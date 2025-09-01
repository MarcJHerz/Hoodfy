const io = require('socket.io');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Importar nuestros nuevos modelos
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');

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

    // Inicializar modelos
    this.chatModel = new Chat();
    this.messageModel = new Message();
    this.participantModel = new ChatParticipant();

    this.setupSocketHandlers();
    this.setupRedisSubscriptions();
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      await this.chatModel.init();
      await this.messageModel.init();
      await this.participantModel.init();
      logger.info('✅ Base de datos de chat inicializada correctamente');
    } catch (error) {
      logger.error('❌ Error inicializando base de datos de chat:', error);
    }
  }

  setupSocketHandlers() {
    // Middleware de autenticación
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Token de autenticación requerido'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userName = decoded.name || 'Usuario';
        socket.userProfilePicture = decoded.profilePicture;
        next();
      } catch (error) {
        logger.error('Error de autenticación Socket.io:', error);
        next(new Error('Error de autenticación'));
      }
    });

    this.io.on('connection', (socket) => {
      logger.info(`🔌 Usuario conectado: ${socket.userId} (${socket.userName})`);

      // Unirse a chats del usuario
      socket.on('join_chats', async (chatIds) => {
        try {
          for (const chatId of chatIds) {
            await this.joinChat(socket, chatId);
          }
        } catch (error) {
          logger.error('Error uniéndose a chats:', error);
          socket.emit('error', { message: 'Error uniéndose a chats' });
        }
      });

      // Enviar mensaje
      socket.on('send_message', async (messageData) => {
        try {
          const message = await this.sendMessage(socket.userId, messageData);
          socket.emit('message_sent', { messageId: message.id, success: true });
        } catch (error) {
          logger.error('Error enviando mensaje:', error);
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
      socket.on('mark_read', async (data) => {
        try {
          const { chatId, messageId } = data;
          if (messageId) {
            await this.messageModel.markMessageAsRead(messageId, socket.userId);
          } else {
            await this.participantModel.markMessagesAsRead(chatId, socket.userId);
          }
          socket.emit('messages_marked_read', { chatId, messageId });
        } catch (error) {
          logger.error('Error marcando mensajes como leídos:', error);
          socket.emit('error', { message: 'Error marcando mensajes como leídos' });
        }
      });

      // Obtener historial de chat
      socket.on('get_chat_history', async (data) => {
        try {
          const { chatId, limit = 50, offset = 0 } = data;
          const messages = await this.messageModel.getChatMessages(chatId, limit, offset);
          socket.emit('chat_history', { chatId, messages });
        } catch (error) {
          logger.error('Error obteniendo historial:', error);
          socket.emit('error', { message: 'Error obteniendo historial' });
        }
      });

      // Obtener participantes del chat
      socket.on('get_chat_participants', async (chatId) => {
        try {
          const participants = await this.participantModel.getChatParticipants(chatId);
          socket.emit('chat_participants', { chatId, participants });
        } catch (error) {
          logger.error('Error obteniendo participantes:', error);
          socket.emit('error', { message: 'Error obteniendo participantes' });
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        logger.info(`🔌 Usuario desconectado: ${socket.userId}`);
        this.handleUserDisconnect(socket);
      });
    });
  }

  async joinChat(socket, chatId) {
    try {
      // Verificar si el usuario es participante del chat
      const isParticipant = await this.participantModel.isParticipant(chatId, socket.userId);
      if (!isParticipant) {
        throw new Error('No tienes acceso a este chat');
      }

      // Unirse al room de Socket.io
      socket.join(chatId);
      
      // Obtener últimos mensajes
      const messages = await this.messageModel.getChatMessages(chatId, 50);
      socket.emit('chat_history', { chatId, messages });

      // Obtener participantes
      const participants = await this.participantModel.getChatParticipants(chatId);
      socket.emit('chat_participants', { chatId, participants });

      // Notificar a otros usuarios que se unió
      socket.to(chatId).emit('user_joined_chat', {
        userId: socket.userId,
        userName: socket.userName,
        chatId
      });

      logger.info(`✅ Usuario ${socket.userId} se unió al chat ${chatId}`);
    } catch (error) {
      logger.error(`❌ Error uniéndose al chat ${chatId}:`, error);
      throw error;
    }
  }

  async sendMessage(senderId, messageData) {
    const { chatId, content, content_type = 'text', reply_to_id, metadata } = messageData;
    
    try {
      // Verificar si el usuario es participante
      const isParticipant = await this.participantModel.isParticipant(chatId, senderId);
      if (!isParticipant) {
        throw new Error('No tienes acceso a este chat');
      }

      // Verificar si está mutado
      const participant = await this.participantModel.getParticipant(chatId, senderId);
      if (participant && participant.is_muted) {
        throw new Error('Estás mutado en este chat');
      }

      // Crear mensaje usando nuestro modelo
      const messageDataForDB = {
        chat_id: parseInt(chatId),
        sender_id: senderId,
        content,
        content_type,
        reply_to_id: reply_to_id ? parseInt(reply_to_id) : null,
        metadata: metadata || {}
      };

      const message = await this.messageModel.createMessage(messageDataForDB);

      // Obtener información del usuario para el mensaje
      const userInfo = await this.getUserInfo(senderId);
      const messageWithUserInfo = {
        ...message,
        sender_name: userInfo.name,
        sender_profile_picture: userInfo.profile_picture
      };

      // Cache en Redis
      await this.cacheMessage(chatId, messageWithUserInfo);

      // Broadcast via Socket.io
      this.io.to(chatId).emit('new_message', messageWithUserInfo);

      // Enviar notificaciones push
      await this.sendPushNotifications(chatId, messageWithUserInfo, senderId);

      logger.info(`✅ Mensaje enviado: ${message.id} en chat ${chatId}`);
      return message;

    } catch (error) {
      logger.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  async cacheMessage(chatId, message) {
    try {
      // Cache del mensaje individual
      await this.redis.setex(
        `message:${message.id}`,
        3600, // 1 hora
        JSON.stringify(message)
      );

      // Cache de últimos mensajes del chat
      await this.redis.lpush(`chat:${chatId}:recent_messages`, JSON.stringify(message));
      await this.redis.ltrim(`chat:${chatId}:recent_messages`, 0, 99); // Mantener solo 100

      // Cache del último mensaje del chat
      await this.redis.setex(
        `chat:${chatId}:last_message`,
        3600,
        JSON.stringify(message)
      );
    } catch (error) {
      logger.error('Error cacheando mensaje:', error);
    }
  }

  async getUserInfo(userId) {
    try {
      // Intentar obtener del cache
      const cached = await this.redis.get(`user:${userId}:profile`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Obtener de MongoDB (ya que no tenemos tabla users en PostgreSQL)
      // Por ahora retornar datos básicos
      const userInfo = {
        id: userId,
        name: 'Usuario',
        profile_picture: null
      };
      
      // Cache por 1 hora
      await this.redis.setex(`user:${userId}:profile`, 3600, JSON.stringify(userInfo));
      
      return userInfo;
    } catch (error) {
      logger.error('Error obteniendo información del usuario:', error);
      return {
        id: userId,
        name: 'Usuario',
        profile_picture: null
      };
    }
  }

  async sendPushNotifications(chatId, message, excludeUserId) {
    try {
      // Obtener participantes del chat
      const participants = await this.participantModel.getChatParticipants(chatId);
      const otherParticipants = participants.filter(p => p.user_id !== excludeUserId);

      // Por ahora solo log, implementar notificaciones push después
      logger.info(`📱 Notificaciones push para ${otherParticipants.length} usuarios en chat ${chatId}`);

      // TODO: Implementar notificaciones push reales
      // - Obtener tokens FCM de usuarios
      // - Enviar notificaciones
      // - Usar servicio de notificaciones existente

    } catch (error) {
      logger.error('Error enviando notificaciones push:', error);
    }
  }

  handleUserDisconnect(socket) {
    try {
      // Obtener todos los rooms del usuario
      const rooms = Array.from(socket.rooms);
      
      // Notificar a otros usuarios que se desconectó
      rooms.forEach(roomId => {
        if (roomId !== socket.id) { // Excluir el room personal del socket
          socket.to(roomId).emit('user_left_chat', {
            userId: socket.userId,
            userName: socket.userName,
            chatId: roomId
          });
        }
      });

      // Limpiar estado del usuario en Redis
      this.redis.hdel(`user:${socket.userId}:online`);
      
      logger.info(`👋 Usuario ${socket.userId} desconectado de ${rooms.length - 1} chats`);
    } catch (error) {
      logger.error('Error manejando desconexión:', error);
    }
  }

  setupRedisSubscriptions() {
    // Suscribirse a eventos de Redis para sincronización entre instancias
    this.redis.subscribe('chat:message', 'chat:typing', 'chat:read', 'chat:join', 'chat:leave');
    
    this.redis.on('message', (channel, message) => {
      try {
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
          case 'chat:join':
            this.io.to(data.chatId).emit('user_joined_chat', data);
            break;
          case 'chat:leave':
            this.io.to(data.chatId).emit('user_left_chat', data);
            break;
        }
      } catch (error) {
        logger.error('Error procesando mensaje Redis:', error);
      }
    });

    this.redis.on('error', (error) => {
      logger.error('Error en Redis:', error);
    });

    this.redis.on('connect', () => {
      logger.info('✅ Redis conectado para chat service');
    });
  }

  // ============================================================================
  // MÉTODOS PARA USO EXTERNO (DESDE API ROUTES)
  // ============================================================================

  async createCommunityChat(communityId, communityName, createdBy) {
    try {
      const chatData = {
        name: `${communityName} - Chat`,
        description: `Chat de la comunidad ${communityName}`,
        type: 'community',
        community_id: communityId,
        created_by: createdBy,
        max_participants: 1000,
        settings: {
          allow_media: true,
          allow_reactions: true,
          allow_replies: true
        }
      };

      const chat = await this.chatModel.createChat(chatData);
      logger.info(`✅ Chat de comunidad creado: ${chat.id} para comunidad ${communityId}`);
      
      return chat;
    } catch (error) {
      logger.error('❌ Error creando chat de comunidad:', error);
      throw error;
    }
  }

  async createPrivateChat(user1Id, user2Id, createdBy) {
    try {
      const chatData = {
        name: `Chat Privado`,
        description: `Chat privado entre usuarios`,
        type: 'private',
        community_id: null,
        created_by: createdBy,
        max_participants: 2,
        settings: {
          allow_media: true,
          allow_reactions: true,
          allow_replies: true
        }
      };

      const chat = await this.chatModel.createChat(chatData);

      // Agregar ambos usuarios como participantes
      await this.participantModel.addParticipant(chat.id, user1Id, 'member');
      await this.participantModel.addParticipant(chat.id, user2Id, 'member');

      logger.info(`✅ Chat privado creado: ${chat.id} entre ${user1Id} y ${user2Id}`);
      
      return chat;
    } catch (error) {
      logger.error('❌ Error creando chat privado:', error);
      throw error;
    }
  }

  async getUserChats(userId) {
    try {
      const chats = await this.participantModel.getUserChats(userId);
      
      // Enriquecer con información adicional
      const enrichedChats = await Promise.all(
        chats.map(async (chatParticipant) => {
          const chat = await this.chatModel.getChatById(chatParticipant.chat_id);
          if (chat) {
            return {
              ...chat,
              role: chatParticipant.role,
              last_read_at: chatParticipant.last_read_at,
              unread_count: chatParticipant.unread_count,
              is_muted: chatParticipant.is_muted
            };
          }
          return null;
        })
      );

      return enrichedChats.filter(chat => chat !== null);
    } catch (error) {
      logger.error('❌ Error obteniendo chats del usuario:', error);
      throw error;
    }
  }

  async getChatStats(chatId) {
    try {
      const chat = await this.chatModel.getChatById(chatId);
      const participants = await this.participantModel.getChatParticipants(chatId);
      const messageCount = await this.messageModel.getChatMessages(chatId, 1, 0);

      return {
        chat,
        participant_count: participants.length,
        message_count: messageCount.length,
        last_message: chat.last_message_at
      };
    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas del chat:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas del servicio
  getStats() {
    return {
      connectedUsers: this.io.engine.clientsCount,
      activeRooms: Object.keys(this.io.sockets.adapter.rooms).length,
      redisConnected: this.redis.status === 'ready',
      modelsInitialized: {
        chat: !!this.chatModel,
        message: !!this.messageModel,
        participant: !!this.participantModel
      }
    };
  }

  // Método para limpiar recursos
  async cleanup() {
    try {
      await this.redis.quit();
      logger.info('✅ Chat service cleanup completado');
    } catch (error) {
      logger.error('❌ Error en cleanup del chat service:', error);
    }
  }
}

module.exports = ChatService;

