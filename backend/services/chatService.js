const io = require('socket.io');
const admin = require('../config/firebase-admin');
const logger = require('../utils/logger');
const { getValkeyManager } = require('../config/valkey-cluster');

// Importar nuestros nuevos modelos
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');

class ChatService {
  constructor(server) {
    this.io = io(server, {
      cors: {
        origin: [
          'https://qahood.com',
          'https://www.qahood.com',
          'https://hoodfy.com',
          'https://www.hoodfy.com',
          /^https:\/\/.*\.qahood\.com$/,
          /^https:\/\/.*\.hoodfy\.com$/,
          /^https:\/\/.*\.amplifyapp\.com$/
        ],
        methods: ["GET", "POST"],
        credentials: true
      },
      maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1e8
    });

        // ✅ VALKEY CLUSTER HABILITADO - PROBLEMA DE TIMEOUTS SOLUCIONADO
    console.log('🚀 Inicializando Valkey Cluster para Chat Service...');
    this.redisManager = getValkeyManager();
    this.redis = null; // Se inicializará en initializeRedis()
    this.initializeRedis();

    // Inicializar modelos
    this.chatModel = new Chat();
    this.messageModel = new Message();
    this.participantModel = new ChatParticipant();

    this.setupSocketHandlers();
    // Redis subscriptions se configurarán después de conectar
    // this.initializeDatabase(); // Comentado para evitar conflictos con el script manual
  }

  async initializeRedis() {
    try {
      console.log('🔄 Inicializando Redis Cluster para Chat Service...');
      
      // ✅ OBTENER CONEXIÓN EXISTENTE O CONECTAR
      this.redis = await this.redisManager.connect();
      
      if (this.redis) {
        console.log('✅ Redis Cluster conectado para Chat Service');
        this.setupRedisSubscriptions();
      } else {
        console.warn('⚠️ Redis no disponible, Chat Service funcionará sin cache');
      }
    } catch (error) {
      console.error('❌ Error conectando Redis para Chat Service:', error);
      console.warn('⚠️ Chat Service funcionará sin Redis');
      this.redis = null;
    }
  }

  async initializeDatabase() {
    try {
      await this.chatModel.init();
      await this.messageModel.init();
      await this.participantModel.init();
      console.log('✅ Base de datos de chat inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos de chat:', error);
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

        // 🔧 ARREGLO: Intentar Firebase ID Token primero, luego JWT
        try {
          // Primero intentar Firebase ID Token
          const decodedToken = await admin.auth().verifyIdToken(token);
          const firebaseUid = decodedToken.uid;
          
          const User = require('../models/User');
          const user = await User.findOne({ firebaseUid });
          
          if (!user) {
            return next(new Error('Usuario no encontrado'));
          }

          // 🔧 CRÍTICO: Usar firebaseUid como userId para consistencia
          socket.userId = firebaseUid;
          socket.user = user;
          socket.userName = user.name || 'Usuario';
          socket.userProfilePicture = user.profilePicture;
          
          console.log(`🔌 Usuario autenticado en Socket.io (Firebase): ${socket.userId} (${socket.userName})`);
          next();
        } catch (firebaseError) {
          console.log('🔧 Firebase token falló, intentando JWT...');
          
          // Si falla Firebase, intentar JWT
          try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const User = require('../models/User');
            const user = await User.findById(decoded.userId);
            
            if (!user || !user.firebaseUid) {
              return next(new Error('Usuario no encontrado o sin firebaseUid'));
            }

            // 🔧 CRÍTICO: Usar firebaseUid como userId para consistencia
            socket.userId = user.firebaseUid;
            socket.user = user;
            socket.userName = user.name || 'Usuario';
            socket.userProfilePicture = user.profilePicture;
            
            console.log(`🔌 Usuario autenticado en Socket.io (JWT->Firebase): ${socket.userId} (${socket.userName})`);
          next();
        } catch (jwtError) {
            console.error('❌ Error de autenticación Socket.io:', jwtError);
            next(new Error('Token inválido o expirado'));
          }
        }
      } catch (error) {
        console.error('Error de autenticación Socket.io:', error);
        next(new Error('Error de autenticación'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.userId} (${socket.userName})`);

      // Unirse a chats del usuario
      socket.on('join_chats', async (chatIds) => {
        try {
          for (const chatId of chatIds) {
            await this.joinChat(socket, chatId);
          }
        } catch (error) {
          console.error('Error uniéndose a chats:', error);
          socket.emit('error', { message: 'Error uniéndose a chats' });
        }
      });

      // Unirse a un chat específico
      socket.on('join_chat', async (data) => {
        try {
          const { chatId } = data;
          console.log(`🔌 Usuario ${socket.userId} solicitando unirse al chat ${chatId}`);
          await this.joinChat(socket, chatId);
        } catch (error) {
          console.error('Error uniéndose al chat:', error);
          socket.emit('error', { message: 'Error uniéndose al chat' });
        }
      });

      // Enviar mensaje
      socket.on('send_message', async (messageData) => {
        try {
          const message = await this.sendMessage(socket.userId, messageData);
          socket.emit('message_sent', { messageId: message.id, success: true });
        } catch (error) {
          console.error('Error enviando mensaje:', error);
          socket.emit('message_error', { error: error.message });
        }
      });

      // Indicar que está escribiendo
      socket.on('typing_start', (data) => {
        const { chatId } = data;
        console.log(`👀 ${socket.userName} está escribiendo en chat ${chatId}`);
        socket.to(chatId).emit('user_typing_start', {
          userId: socket.userId,
          userName: socket.userName,
          chatId
        });
      });

      socket.on('typing_stop', (data) => {
        const { chatId } = data;
        console.log(`✋ ${socket.userName} dejó de escribir en chat ${chatId}`);
        socket.to(chatId).emit('user_typing_stop', {
          userId: socket.userId,
          userName: socket.userName,
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
          console.error('Error marcando mensajes como leídos:', error);
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
          console.error('Error obteniendo historial:', error);
          socket.emit('error', { message: 'Error obteniendo historial' });
        }
      });

      // Obtener participantes del chat
      socket.on('get_chat_participants', async (chatId) => {
        try {
          const participants = await this.participantModel.getChatParticipants(chatId);
          socket.emit('chat_participants', { chatId, participants });
        } catch (error) {
          console.error('Error obteniendo participantes:', error);
          socket.emit('error', { message: 'Error obteniendo participantes' });
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`🔌 Usuario desconectado: ${socket.userId}`);
        this.handleUserDisconnect(socket);
      });
    });
  }

  async joinChat(socket, chatId) {
    try {
      console.log(`🔍 Verificando acceso al chat ${chatId} para usuario ${socket.userId}`);
      
      // Verificar si el usuario es participante del chat
      const isParticipant = await this.participantModel.isParticipant(chatId, socket.userId);
      console.log(`🔍 Resultado de verificación de participante: ${isParticipant}`);
      
      if (!isParticipant) {
        console.log(`❌ Usuario ${socket.userId} no es participante del chat ${chatId}`);
        console.log(`🔧 Intentando agregar usuario como participante...`);
        
        // Intentar agregar al usuario como participante
        try {
          await this.participantModel.addParticipant(chatId, socket.userId, 'member');
          console.log(`✅ Usuario ${socket.userId} agregado como participante del chat ${chatId}`);
        } catch (addError) {
          console.error(`❌ Error agregando participante:`, addError);
          throw new Error('No tienes acceso a este chat');
        }
      }

      // Unirse al room de Socket.io
      socket.join(chatId);
      console.log(`🔌 Usuario ${socket.userId} se unió al room ${chatId}`);
      console.log(`👥 Usuarios en room ${chatId}: ${this.io.sockets.adapter.rooms.get(chatId)?.size || 0}`);
      
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

      console.log(`✅ Usuario ${socket.userId} se unió al chat ${chatId}`);
    } catch (error) {
      console.error(`❌ Error uniéndose al chat ${chatId}:`, error);
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
      console.log(`📡 Emitiendo new_message a chat ${chatId}:`, messageWithUserInfo);
      console.log(`📡 Rooms disponibles:`, Array.from(this.io.sockets.adapter.rooms.keys()));
      console.log(`📡 Usuarios en room ${chatId}:`, this.io.sockets.adapter.rooms.get(chatId)?.size || 0);
      
      this.io.to(chatId).emit('new_message', messageWithUserInfo);
      console.log(`📡 Evento new_message emitido a ${this.io.sockets.adapter.rooms.get(chatId)?.size || 0} usuarios en chat ${chatId}`);

      // Enviar notificaciones push
      await this.sendPushNotifications(chatId, messageWithUserInfo, senderId);

      console.log(`✅ Mensaje enviado: ${message.id} en chat ${chatId}`);
      return message;

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  async cacheMessage(chatId, message) {
    if (!this.redisManager || !this.redisManager.isHealthy()) {
      console.warn('⚠️ Redis no disponible para cachear mensaje, continuando sin cache');
      return;
    }

    try {
      // Cache del mensaje individual
      await this.redisManager.safeSet(
        `message:${message.id}`,
        JSON.stringify(message),
        'EX',
        3600 // 1 hora
      );

      // Cache de últimos mensajes del chat
      const redis = this.redisManager.getClient();
      if (redis) {
        await redis.lpush(`chat:${chatId}:recent_messages`, JSON.stringify(message));
        await redis.ltrim(`chat:${chatId}:recent_messages`, 0, 99); // Mantener solo 100
      }

      // Cache del último mensaje del chat
      await this.redisManager.safeSet(
        `chat:${chatId}:last_message`,
        JSON.stringify(message),
        'EX',
        3600
      );
    } catch (error) {
      console.warn('⚠️ Error cacheando mensaje, continuando sin cache:', error.message);
    }
  }

  async getUserInfo(userId) {
    try {
      // Limpiar userId de comillas extra si las tiene
      const cleanUserId = userId.toString().replace(/['"]/g, '');
      console.log(`🔍 Buscando usuario con ID limpio: ${cleanUserId} (original: ${userId})`);
      
      // Intentar obtener del cache (con manejo de errores)
      if (this.redisManager && this.redisManager.isHealthy()) {
      try {
          const cached = await this.redisManager.safeGet(`user:${cleanUserId}:profile`);
        if (cached) {
          console.log(`✅ Usuario encontrado en cache: ${cleanUserId}`);
          return JSON.parse(cached);
        }
      } catch (redisError) {
          console.warn('⚠️ Error accediendo cache para getUserInfo:', redisError.message);
        }
      }

      // Obtener de MongoDB
      const User = require('../models/User');
      const user = await User.findById(cleanUserId);
      
      if (user) {
        const userInfo = {
          id: cleanUserId,
          name: user.name || user.username || 'Usuario',
          profile_picture: user.profilePicture || null
        };
        
        console.log(`✅ Usuario encontrado en MongoDB: ${userInfo.name} (${cleanUserId})`);
        
        // Cache por 1 hora (con manejo de errores)
        if (this.redisManager && this.redisManager.isHealthy()) {
          await this.redisManager.safeSet(`user:${cleanUserId}:profile`, JSON.stringify(userInfo), 'EX', 3600);
        }
        
        return userInfo;
      } else {
        console.warn(`⚠️ Usuario no encontrado en MongoDB: ${cleanUserId}`);
        const userInfo = {
          id: cleanUserId,
          name: 'Usuario',
          profile_picture: null
        };
        
        // Cache por 5 minutos para usuarios no encontrados (con manejo de errores)
        if (this.redisManager && this.redisManager.isHealthy()) {
          await this.redisManager.safeSet(`user:${cleanUserId}:profile`, JSON.stringify(userInfo), 'EX', 300);
        }
        
        return userInfo;
      }
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
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
      console.log(`📱 Notificaciones push para ${otherParticipants.length} usuarios en chat ${chatId}`);

      // TODO: Implementar notificaciones push reales
      // - Obtener tokens FCM de usuarios
      // - Enviar notificaciones
      // - Usar servicio de notificaciones existente

    } catch (error) {
      console.error('Error enviando notificaciones push:', error);
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

      // Limpiar estado del usuario en Redis (solo si Redis está disponible)
      if (this.redisManager && this.redisManager.isHealthy()) {
        try {
          const redis = this.redisManager.getClient();
          if (redis) {
            // No usar await para no bloquear la desconexión
            redis.hdel(`user:${socket.userId}:online`).catch(redisError => {
              console.warn('⚠️ Error limpiando estado Redis al desconectar:', redisError.message);
            });
          }
        } catch (redisError) {
          console.warn('⚠️ Error limpiando estado Redis al desconectar:', redisError.message);
        }
      }
      
      console.log(`👋 Usuario ${socket.userId} desconectado de ${rooms.length - 1} chats`);
    } catch (error) {
      console.error('Error manejando desconexión:', error);
    }
  }

  setupRedisSubscriptions() {
    // Suscribirse a eventos de Redis para sincronización entre instancias
    if (!this.redis || !this.redisManager || !this.redisManager.isHealthy()) {
      console.warn('⚠️ Redis no disponible para suscripciones, funcionando sin pub/sub');
      return;
    }

    try {
      console.log('🔄 Configurando suscripciones Redis...');
      const channels = ['chat:message', 'chat:typing', 'chat:read', 'chat:join', 'chat:leave'];
      const ok = await this.redisManager.safeSubscribe(channels, (channel, message) => {
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
          console.error('❌ Error procesando mensaje Redis:', error);
        }
      });
      if (ok) {
        console.log('✅ Suscripciones Redis configuradas para:', channels.join(', '));
      } else {
        console.warn('⚠️ No se pudieron configurar suscripciones Redis');
      }
    } catch (error) {
      console.error('❌ Error configurando suscripciones Redis:', error);
      console.warn('⚠️ Funcionando sin pub/sub Redis');
    }
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
      console.log(`✅ Chat de comunidad creado: ${chat.id} para comunidad ${communityId}`);
      
      return chat;
    } catch (error) {
      console.error('❌ Error creando chat de comunidad:', error);
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

      console.log(`✅ Chat privado creado: ${chat.id} entre ${user1Id} y ${user2Id}`);
      
      return chat;
    } catch (error) {
      console.error('❌ Error creando chat privado:', error);
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
      console.error('❌ Error obteniendo chats del usuario:', error);
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
      console.error('❌ Error obteniendo estadísticas del chat:', error);
      throw error;
    }
  }

  // Método para obtener estadísticas del servicio
  getStats() {
    return {
      connectedUsers: this.io.engine.clientsCount,
      activeRooms: Object.keys(this.io.sockets.adapter.rooms).length,
      redisConnected: this.redis && this.redis.status === 'ready',
      redisManager: this.redisManager && this.redisManager.isHealthy(),
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
      if (this.redisManager) {
        await this.redisManager.disconnect();
      }
      console.log('✅ Chat service cleanup completado');
    } catch (error) {
      console.error('❌ Error en cleanup del chat service:', error);
    }
  }
}

module.exports = ChatService;

