const io = require('socket.io');
const Redis = require('ioredis');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class ChatService {
  constructor(server) {
    this.io = io(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "https://hoodfy.com",
        methods: ["GET", "POST"],
        credentials: true
      },
      maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1e8
    });

    // Configurar Redis para caching y pub/sub
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keyPrefix: 'hoodfy:chat:'
    });

    // Configurar PostgreSQL para persistencia
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false }
    });

    this.setupSocketHandlers();
    this.setupRedisSubscriptions();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userName = decoded.name;
        socket.userProfilePicture = decoded.profilePicture;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.userId} (${socket.userName})`);

      // Unirse a chats del usuario
      socket.on('join_chats', async (chatIds) => {
        try {
          for (const chatId of chatIds) {
            await this.joinChat(socket, chatId);
          }
        } catch (error) {
          logger.error('Error joining chats:', error);
        }
      });

      // Enviar mensaje
      socket.on('send_message', async (messageData) => {
        try {
          const messageId = await this.sendMessage(socket.userId, messageData);
          socket.emit('message_sent', { messageId, success: true });
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('message_error', { error: error.message });
        }
      });

      // Indicar que está escribiendo
      socket.on('typing_start', (chatId) => {
        socket.to(chatId).emit('user_typing', {
          userId: socket.userId,
          userName: socket.userName,
          chatId
        });
      });

      socket.on('typing_stop', (chatId) => {
        socket.to(chatId).emit('user_stop_typing', {
          userId: socket.userId,
          chatId
        });
      });

      // Marcar mensajes como leídos
      socket.on('mark_read', async (chatId) => {
        try {
          await this.markMessagesAsRead(socket.userId, chatId);
          socket.emit('messages_marked_read', { chatId });
        } catch (error) {
          logger.error('Error marking messages as read:', error);
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`);
        this.handleUserDisconnect(socket);
      });
    });
  }

  async joinChat(socket, chatId) {
    try {
      // Verificar permisos del usuario para este chat
      const hasAccess = await this.verifyChatAccess(socket.userId, chatId);
      if (!hasAccess) {
        throw new Error('Access denied to chat');
      }

      socket.join(chatId);
      
      // Obtener últimos mensajes del cache o DB
      const messages = await this.getRecentMessages(chatId, 50);
      socket.emit('chat_history', { chatId, messages });

      logger.info(`User ${socket.userId} joined chat ${chatId}`);
    } catch (error) {
      logger.error(`Error joining chat ${chatId}:`, error);
      throw error;
    }
  }

  async sendMessage(senderId, messageData) {
    const { chatId, content, type = 'text', mediaUrl, replyTo } = messageData;
    
    try {
      // Verificar acceso al chat
      const hasAccess = await this.verifyChatAccess(senderId, chatId);
      if (!hasAccess) {
        throw new Error('Access denied to chat');
      }

      // Obtener información del usuario
      const user = await this.getUserInfo(senderId);
      
      // Crear mensaje
      const message = {
        chatId,
        senderId,
        senderName: user.name,
        senderProfilePicture: user.profilePicture,
        content,
        type,
        mediaUrl,
        replyTo,
        timestamp: new Date(),
        status: 'sent'
      };

      // 1. Guardar en PostgreSQL
      const result = await this.pgPool.query(
        `INSERT INTO messages (chat_id, sender_id, sender_name, sender_profile_picture, 
         content, type, media_url, reply_to, timestamp, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          message.chatId,
          message.senderId,
          message.senderName,
          message.senderProfilePicture,
          message.content,
          message.type,
          message.mediaUrl,
          replyTo ? JSON.stringify(replyTo) : null,
          message.timestamp,
          message.status
        ]
      );

      message.id = result.rows[0].id;

      // 2. Cache en Redis
      await this.redis.setex(
        `chat:${chatId}:last_message`,
        3600,
        JSON.stringify(message)
      );

      // 3. Incrementar contador de mensajes no leídos para otros usuarios
      await this.incrementUnreadCount(chatId, senderId);

      // 4. Broadcast via Socket.io
      this.io.to(chatId).emit('new_message', message);

      // 5. Enviar notificaciones push
      await this.sendPushNotifications(chatId, message, senderId);

      logger.info(`Message sent: ${message.id} in chat ${chatId}`);
      return message.id;

    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async getRecentMessages(chatId, limit = 50) {
    try {
      // Intentar obtener del cache primero
      const cachedMessages = await this.redis.lrange(`chat:${chatId}:messages`, 0, limit - 1);
      
      if (cachedMessages.length >= limit) {
        return cachedMessages.map(msg => JSON.parse(msg));
      }

      // Si no hay suficientes en cache, obtener de DB
      const result = await this.pgPool.query(
        `SELECT * FROM messages WHERE chat_id = $1 
         ORDER BY timestamp DESC LIMIT $2`,
        [chatId, limit]
      );

      const messages = result.rows.reverse(); // Ordenar por timestamp ascendente

      // Actualizar cache
      if (messages.length > 0) {
        const pipeline = this.redis.pipeline();
        messages.forEach(msg => {
          pipeline.lpush(`chat:${chatId}:messages`, JSON.stringify(msg));
        });
        pipeline.ltrim(`chat:${chatId}:messages`, 0, 999); // Mantener solo 1000 mensajes
        await pipeline.exec();
      }

      return messages;
    } catch (error) {
      logger.error('Error getting recent messages:', error);
      throw error;
    }
  }

  async markMessagesAsRead(userId, chatId) {
    try {
      // Actualizar en PostgreSQL
      await this.pgPool.query(
        `UPDATE message_reads SET read_at = $1 
         WHERE user_id = $2 AND chat_id = $3 AND read_at IS NULL`,
        [new Date(), userId, chatId]
      );

      // Limpiar contador en Redis
      await this.redis.hdel(`chat:${chatId}:unread_counts`, userId);

      logger.info(`Messages marked as read for user ${userId} in chat ${chatId}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async incrementUnreadCount(chatId, excludeUserId) {
    try {
      // Obtener usuarios del chat (excluyendo al remitente)
      const users = await this.getChatUsers(chatId);
      const otherUsers = users.filter(user => user.id !== excludeUserId);

      // Incrementar contadores
      const pipeline = this.redis.pipeline();
      otherUsers.forEach(user => {
        pipeline.hincrby(`chat:${chatId}:unread_counts`, user.id, 1);
      });
      await pipeline.exec();

    } catch (error) {
      logger.error('Error incrementing unread count:', error);
    }
  }

  async verifyChatAccess(userId, chatId) {
    try {
      // Verificar si es chat de comunidad
      const communityChat = await this.pgPool.query(
        `SELECT c.id FROM communities c 
         INNER JOIN subscriptions s ON c.id = s.community_id 
         WHERE c.chat_id = $1 AND s.user_id = $2 AND s.status = 'active'`,
        [chatId, userId]
      );

      if (communityChat.rows.length > 0) {
        return true;
      }

      // Verificar si es chat privado
      const privateChat = await this.pgPool.query(
        `SELECT id FROM private_chats 
         WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
        [chatId, userId]
      );

      return privateChat.rows.length > 0;
    } catch (error) {
      logger.error('Error verifying chat access:', error);
      return false;
    }
  }

  async getUserInfo(userId) {
    try {
      // Intentar obtener del cache
      const cached = await this.redis.get(`user:${userId}:profile`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Obtener de DB
      const result = await this.pgPool.query(
        'SELECT id, name, profile_picture FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      
      // Cache por 1 hora
      await this.redis.setex(`user:${userId}:profile`, 3600, JSON.stringify(user));
      
      return user;
    } catch (error) {
      logger.error('Error getting user info:', error);
      throw error;
    }
  }

  async getChatUsers(chatId) {
    try {
      // Para chats de comunidad
      const communityUsers = await this.pgPool.query(
        `SELECT u.id FROM users u 
         INNER JOIN subscriptions s ON u.id = s.user_id 
         INNER JOIN communities c ON s.community_id = c.id 
         WHERE c.chat_id = $1 AND s.status = 'active'`,
        [chatId]
      );

      if (communityUsers.rows.length > 0) {
        return communityUsers.rows;
      }

      // Para chats privados
      const privateUsers = await this.pgPool.query(
        `SELECT user1_id as id FROM private_chats WHERE id = $1
         UNION
         SELECT user2_id as id FROM private_chats WHERE id = $1`,
        [chatId]
      );

      return privateUsers.rows;
    } catch (error) {
      logger.error('Error getting chat users:', error);
      return [];
    }
  }

  async sendPushNotifications(chatId, message, excludeUserId) {
    try {
      const users = await this.getChatUsers(chatId);
      const otherUsers = users.filter(user => user.id !== excludeUserId);

      // Obtener tokens FCM de los usuarios
      const tokens = [];
      for (const user of otherUsers) {
        const userInfo = await this.getUserInfo(user.id);
        if (userInfo.fcmToken) {
          tokens.push(userInfo.fcmToken);
        }
      }

      if (tokens.length > 0) {
        // Enviar notificación push
        const notification = {
          title: message.senderName,
          body: message.content.length > 100 ? 
                message.content.substring(0, 100) + '...' : 
                message.content,
          data: {
            chatId: chatId,
            messageId: message.id,
            type: 'new_message'
          }
        };

        // Usar el endpoint existente de notificaciones
        const response = await fetch(`${process.env.API_BASE_URL}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notification, tokens })
        });

        if (!response.ok) {
          logger.error('Error sending push notifications');
        }
      }
    } catch (error) {
      logger.error('Error sending push notifications:', error);
    }
  }

  handleUserDisconnect(socket) {
    // Limpiar estado del usuario
    this.redis.hdel(`user:${socket.userId}:online`);
  }

  setupRedisSubscriptions() {
    // Suscribirse a eventos de Redis para sincronización entre instancias
    this.redis.subscribe('chat:message', 'chat:typing', 'chat:read');
    
    this.redis.on('message', (channel, message) => {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'chat:message':
          this.io.to(data.chatId).emit('new_message', data.message);
          break;
        case 'chat:typing':
          this.io.to(data.chatId).emit('user_typing', data);
          break;
        case 'chat:read':
          this.io.to(data.chatId).emit('messages_marked_read', data);
          break;
      }
    });
  }

  // Métodos para uso externo (desde API routes)
  async createCommunityChat(communityId, communityName) {
    try {
      const result = await this.pgPool.query(
        'INSERT INTO community_chats (community_id, name, created_at) VALUES ($1, $2, $3) RETURNING id',
        [communityId, communityName, new Date()]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error creating community chat:', error);
      throw error;
    }
  }

  async createPrivateChat(user1Id, user2Id) {
    try {
      const result = await this.pgPool.query(
        'INSERT INTO private_chats (user1_id, user2_id, created_at) VALUES ($1, $2, $3) RETURNING id',
        [user1Id, user2Id, new Date()]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error creating private chat:', error);
      throw error;
    }
  }

  async getUserChats(userId) {
    try {
      // Obtener chats de comunidad
      const communityChats = await this.pgPool.query(
        `SELECT c.chat_id, c.name, 'community' as type, 
         (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.chat_id) as message_count,
         (SELECT MAX(timestamp) FROM messages m WHERE m.chat_id = c.chat_id) as last_message_time
         FROM communities c 
         INNER JOIN subscriptions s ON c.id = s.community_id 
         WHERE s.user_id = $1 AND s.status = 'active'`,
        [userId]
      );

      // Obtener chats privados
      const privateChats = await this.pgPool.query(
        `SELECT pc.id as chat_id, 
         CASE WHEN pc.user1_id = $1 THEN u2.name ELSE u1.name END as name,
         'private' as type,
         (SELECT COUNT(*) FROM messages m WHERE m.chat_id = pc.id) as message_count,
         (SELECT MAX(timestamp) FROM messages m WHERE m.chat_id = pc.id) as last_message_time
         FROM private_chats pc
         INNER JOIN users u1 ON pc.user1_id = u1.id
         INNER JOIN users u2 ON pc.user2_id = u2.id
         WHERE pc.user1_id = $1 OR pc.user2_id = $1`,
        [userId]
      );

      return [...communityChats.rows, ...privateChats.rows];
    } catch (error) {
      logger.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas
  getStats() {
    return {
      connectedUsers: this.io.engine.clientsCount,
      activeRooms: Object.keys(this.io.sockets.adapter.rooms).length,
      redisConnected: this.redis.status === 'ready',
      pgConnected: this.pgPool.totalCount > 0
    };
  }
}

module.exports = ChatService;
