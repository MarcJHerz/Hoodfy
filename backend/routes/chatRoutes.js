const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');
const logger = require('../utils/logger');

// Inicializar modelos
const chatModel = new Chat();
const messageModel = new Message();
const participantModel = new ChatParticipant();

// Función para obtener información del usuario
async function getUserInfo(userId) {
  try {
    // Importar modelo de usuario dinámicamente
    const User = require('../models/User');
    
    // Buscar usuario por Firebase UID
    const user = await User.findOne({ firebaseUid: userId });
    
    if (user) {
      return {
        name: user.name || user.username || 'Usuario',
        profile_picture: user.profilePicture || null
      };
    } else {
      console.warn(`⚠️ Usuario no encontrado: ${userId}`);
      return {
        name: 'Usuario',
        profile_picture: null
      };
    }
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    return {
      name: 'Usuario',
      profile_picture: null
    };
  }
}

// ============================================================================
// RUTAS DE CHAT
// ============================================================================

// Obtener o crear chat de comunidad
router.get('/community/:communityId', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.userId; // Firebase UID del usuario actual

    console.log(`🏘️ Obteniendo/creando chat para comunidad ${communityId} por usuario ${userId}`);

    // Verificar que la comunidad existe y el usuario tiene acceso
    const Community = require('../models/Community');
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    // Verificar que el usuario está suscrito a la comunidad
    const Subscription = require('../models/Subscription');
    const User = require('../models/User');
    
    // Obtener el MongoDB ID del usuario
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const subscription = await Subscription.findOne({
      user: user._id,
      community: communityId,
      status: 'active'
    });

    // También verificar si es el creador de la comunidad
    const isCreator = community.creator.toString() === user._id.toString();

    if (!subscription && !isCreator) {
      return res.status(403).json({ error: 'Debes estar suscrito a esta comunidad para acceder al chat' });
    }

    // Buscar chat existente para esta comunidad
    // Usar ORDER BY para garantizar consistencia en la selección
    const existingChat = await chatModel.pool.connect().then(async (client) => {
      try {
        const result = await client.query(`
          SELECT * FROM chats 
          WHERE community_id = $1 AND type = 'community' AND is_active = true
          ORDER BY created_at ASC
          LIMIT 1
        `, [communityId.toString()]);
        return result.rows[0];
      } finally {
        client.release();
      }
    });

    let chat;
    let isNew = false;

    if (existingChat) {
      chat = existingChat;
      console.log('✅ Chat de comunidad existente encontrado:', chat.id);
    } else {
      // Crear nuevo chat de comunidad
      const chatData = {
        name: `💬 ${community.name}`,
        description: `Chat grupal de la comunidad ${community.name}`,
        type: 'community',
        community_id: communityId,
        created_by: userId,
        max_participants: 10000,
        settings: {
          allowFileUploads: true,
          allowImageUploads: true,
          allowVideoUploads: true,
          moderationEnabled: true
        }
      };

      chat = await chatModel.createChat(chatData);
      isNew = true;
      console.log('✅ Nuevo chat de comunidad creado:', chat.id);

      // Agregar automáticamente a todos los suscriptores activos
      try {
        const activeSubscriptions = await Subscription.find({
          community: communityId,
          status: 'active'
        }).populate('user', 'firebaseUid');

        console.log(`👥 Agregando ${activeSubscriptions.length} suscriptores al chat ${chat.id}`);

        for (const subscription of activeSubscriptions) {
          if (subscription.user && subscription.user.firebaseUid) {
            try {
              const userFirebaseUid = subscription.user.firebaseUid;
              const userRole = userFirebaseUid === userId ? 'admin' : 'member';
              await participantModel.addParticipant(chat.id, userFirebaseUid, userRole);
              console.log(`✅ Suscriptor ${userFirebaseUid} agregado como ${userRole}`);
            } catch (participantError) {
              console.error(`❌ Error agregando suscriptor ${subscription.user.firebaseUid}:`, participantError);
            }
          }
        }

        // Agregar al creador de la comunidad si no está ya incluido
        const creatorUser = await User.findById(community.creator);
        if (creatorUser && creatorUser.firebaseUid !== userId) {
          try {
            await participantModel.addParticipant(chat.id, creatorUser.firebaseUid, 'admin');
            console.log(`✅ Creador ${creatorUser.firebaseUid} agregado como admin`);
          } catch (creatorError) {
            console.error(`❌ Error agregando creador:`, creatorError);
          }
        }
      } catch (participantsError) {
        console.error('❌ Error agregando participantes automáticamente:', participantsError);
      }
    }

    // Verificar si el usuario ya es participante
    const isParticipant = await participantModel.isParticipant(chat.id, userId);
    
    if (!isParticipant) {
      // Agregar usuario como participante
      const role = isCreator ? 'admin' : 'member';
      await participantModel.addParticipant(chat.id, userId, role);
      console.log(`✅ Usuario ${userId} agregado como ${role} al chat ${chat.id}`);
    }

    res.json({
      success: true,
      chat: {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        type: chat.type,
        community_id: chat.community_id,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        settings: chat.settings
      },
      isNew,
      userRole: isCreator ? 'admin' : 'member'
    });

  } catch (error) {
    console.error('Error obteniendo/creando chat de comunidad:', error);
    res.status(500).json({ error: 'Error obteniendo chat de comunidad', details: error.message });
  }
});

// Obtener o crear chat privado entre dos usuarios
router.post('/private/:otherUserFirebaseUid', verifyToken, async (req, res) => {
  try {
    const { otherUserFirebaseUid } = req.params;
    const currentUserId = req.userId; // Este es el firebaseUid del usuario actual

    console.log(`🔧 Creando chat privado entre ${currentUserId} y ${otherUserFirebaseUid}`);

    // Prevenir chat con uno mismo
    if (currentUserId === otherUserFirebaseUid) {
      return res.status(400).json({ error: 'No puedes crear un chat contigo mismo' });
    }

    // Verificar que el otro usuario existe
    const User = require('../models/User');
    const otherUser = await User.findOne({ firebaseUid: otherUserFirebaseUid });
    if (!otherUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Buscar chat existente entre los dos usuarios (usando firebaseUid)
    const existingChat = await chatModel.findPrivateChatBetweenUsers(currentUserId, otherUserFirebaseUid);
    
    if (existingChat) {
      console.log('✅ Chat privado existente encontrado:', existingChat.id);
      return res.json({
        success: true,
        chat: existingChat,
        isNew: false
      });
    }

    // Crear nuevo chat privado
    const chatData = {
      name: `Private chat`,
      type: 'private',
      created_by: currentUserId
    };

    const chat = await chatModel.createChat(chatData);
    
    // Agregar al otro usuario como participante
    await participantModel.addParticipant(chat.id, otherUserFirebaseUid, 'member');
    
    console.log('✅ Nuevo chat privado creado:', chat.id);
    
    res.json({
      success: true,
      chat,
      isNew: true
    });

  } catch (error) {
    console.error('Error obteniendo/creando chat privado:', error);
    res.status(500).json({ error: 'Error obteniendo/creando chat privado', details: error.message });
  }
});

// Crear nuevo chat (comunidad o privado)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, type, community_id, max_participants, settings } = req.body;
    const created_by = req.userId;

    // Validaciones
    if (!name || !type) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }

    if (!['community', 'private'].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser "community" o "private"' });
    }

    if (type === 'community' && !community_id) {
      return res.status(400).json({ error: 'community_id es requerido para chats de comunidad' });
    }

    // Crear chat
    const chatData = {
      name,
      description,
      type,
      community_id,
      created_by,
      max_participants: max_participants || 1000,
      settings: settings || {}
    };

    const chat = await chatModel.createChat(chatData);
    
    console.log('Chat creado exitosamente', { chatId: chat.id, type, created_by });

    res.status(201).json({
      success: true,
      message: 'Chat creado exitosamente',
      chat
    });

  } catch (error) {
    console.error('Error creando chat', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Error creando chat', details: error.message });
  }
});

// Obtener chat por ID
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    console.log(`🔍 Verificando acceso al chat ${chatId} para usuario ${userId}`);
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    console.log(`📊 Resultado isParticipant: ${isParticipant}`);
    
    if (!isParticipant) {
      console.log(`❌ Usuario ${userId} no tiene acceso al chat ${chatId}`);
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const chat = await chatModel.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    res.json({
      success: true,
      chat
    });

  } catch (error) {
    console.error('Error obteniendo chat', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error obteniendo chat', details: error.message });
  }
});

// Obtener todos los chats del usuario
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { includeMuted = 'true' } = req.query;

    const chats = await participantModel.getUserChats(userId, includeMuted === 'true');

    res.json({
      success: true,
      chats,
      total: chats.length
    });

  } catch (error) {
    console.error('Error obteniendo chats del usuario', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Error obteniendo chats', details: error.message });
  }
});

// Unirse a un chat
router.post('/:chatId/join', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role = 'member' } = req.body;
    const userId = req.userId;

    // Verificar si el chat existe
    const chat = await chatModel.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // Verificar si ya es participante
    const existingParticipant = await participantModel.getParticipant(chatId, userId);
    if (existingParticipant) {
      return res.status(400).json({ error: 'Ya eres participante de este chat' });
    }

    // Agregar participante
    const participant = await participantModel.addParticipant(chatId, userId, role);

    console.log('Usuario se unió al chat', { chatId, userId, role });

    res.json({
      success: true,
      message: 'Te has unido al chat exitosamente',
      participant
    });

  } catch (error) {
    console.error('Error uniéndose al chat', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error uniéndose al chat', details: error.message });
  }
});

// Salir de un chat
router.post('/:chatId/leave', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verificar si es participante
    const participant = await participantModel.getParticipant(chatId, userId);
    if (!participant) {
      return res.status(400).json({ error: 'No eres participante de este chat' });
    }

    // Remover participante
    await participantModel.removeParticipant(chatId, userId);

    console.log('Usuario salió del chat', { chatId, userId });

    res.json({
      success: true,
      message: 'Has salido del chat exitosamente'
    });

  } catch (error) {
    console.error('Error saliendo del chat', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error saliendo del chat', details: error.message });
  }
});

// Obtener participantes del chat
router.get('/:chatId/participants', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    const { includeBanned = 'false' } = req.query;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const participants = await participantModel.getChatParticipants(chatId, includeBanned === 'true');

    res.json({
      success: true,
      participants,
      total: participants.length
    });

  } catch (error) {
    console.error('Error obteniendo participantes', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error obteniendo participantes', details: error.message });
  }
});

// Actualizar rol de participante (solo admin/moderador)
router.put('/:chatId/participants/:participantId/role', verifyToken, async (req, res) => {
  try {
    const { chatId, participantId } = req.params;
    const { role } = req.body;
    const userId = req.userId;

    // Verificar permisos del usuario
    const hasPermission = await participantModel.hasRole(chatId, userId, 'moderator');
    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes permisos para cambiar roles' });
    }

    // Verificar que el rol sea válido
    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Actualizar rol
    const updatedParticipant = await participantModel.updateParticipantRole(chatId, participantId, role);

    console.log('Rol de participante actualizado', { chatId, participantId, newRole: role, updatedBy: userId });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error actualizando rol', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error actualizando rol', details: error.message });
  }
});

// Mutear/desmutear participante
router.put('/:chatId/participants/:participantId/mute', verifyToken, async (req, res) => {
  try {
    const { chatId, participantId } = req.params;
    const { muted = true } = req.body;
    const userId = req.userId;

    // Verificar permisos del usuario
    const hasPermission = await participantModel.hasRole(chatId, userId, 'moderator');
    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes permisos para mutear usuarios' });
    }

    // Mutear/desmutear participante
    const updatedParticipant = await participantModel.muteParticipant(chatId, participantId, muted);

    console.log('Participante mutado/desmutado', { chatId, participantId, muted, updatedBy: userId });

    res.json({
      success: true,
      message: `Usuario ${muted ? 'mutado' : 'desmutado'} exitosamente`,
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error mutando participante', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error mutando participante', details: error.message });
  }
});

// Banear/desbanear participante
router.put('/:chatId/participants/:participantId/ban', verifyToken, async (req, res) => {
  try {
    const { chatId, participantId } = req.params;
    const { banned = true } = req.body;
    const userId = req.userId;

    // Verificar permisos del usuario
    const hasPermission = await participantModel.hasRole(chatId, userId, 'moderator');
    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes permisos para banear usuarios' });
    }

    // Banear/desbanear participante
    const updatedParticipant = await participantModel.banParticipant(chatId, participantId, banned);

    console.log('Participante baneado/desbaneado', { chatId, participantId, banned, updatedBy: userId });

    res.json({
      success: true,
      message: `Usuario ${banned ? 'baneado' : 'desbaneado'} exitosamente`,
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('Error baneando participante', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error baneando participante', details: error.message });
  }
});

// ============================================================================
// RUTAS DE MENSAJES
// ============================================================================

// Enviar mensaje
router.post('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, content_type, reply_to_id, metadata } = req.body;
    const sender_id = req.userId;

    // Validaciones
    if (!content) {
      return res.status(400).json({ error: 'Contenido del mensaje es requerido' });
    }

    // Usar chatService para enviar mensaje (incluye Socket.io)
    const messageData = {
      chatId,
      content,
      content_type: content_type || 'text',
      reply_to_id,
      metadata: metadata || {}
    };

    // Crear mensaje
    const message = await messageModel.createMessage({
      chat_id: parseInt(chatId),
      sender_id,
      content,
      content_type: content_type || 'text',
      reply_to_id,
      metadata: metadata || {}
    });

    // Obtener información del usuario para el mensaje
    const userInfo = await getUserInfo(sender_id);
    const messageWithUserInfo = {
      ...message,
      sender_name: userInfo.name,
      sender_profile_picture: userInfo.profile_picture
    };

    // Emitir via Socket.io usando la instancia global
    if (global.chatService && global.chatService.io) {
      console.log(`📡 Emitiendo new_message a chat ${chatId}:`, messageWithUserInfo);
      global.chatService.io.to(chatId).emit('new_message', messageWithUserInfo);
      console.log(`📡 Evento new_message emitido a ${global.chatService.io.sockets.adapter.rooms.get(chatId)?.size || 0} usuarios en chat ${chatId}`);
    } else {
      console.warn('⚠️ ChatService no disponible para emitir mensaje');
    }

    console.log('Mensaje enviado exitosamente', { messageId: message.id, chatId, sender_id });

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      message
    });

  } catch (error) {
    console.error('Error enviando mensaje', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error enviando mensaje', details: error.message });
  }
});

// Obtener mensajes del chat
router.get('/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0, beforeMessageId } = req.query;
    const userId = req.userId;

    // Verificar si el usuario es participante
    console.log(`🔍 Verificando acceso a mensajes del chat ${chatId} para usuario ${userId}`);
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    console.log(`📊 Resultado isParticipant para mensajes: ${isParticipant}`);
    
    if (!isParticipant) {
      console.log(`❌ Usuario ${userId} no tiene acceso a mensajes del chat ${chatId}`);
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const messages = await messageModel.getChatMessages(
      parseInt(chatId),
      parseInt(limit),
      parseInt(offset),
      beforeMessageId ? parseInt(beforeMessageId) : null
    );

    res.json({
      success: true,
      messages,
      total: messages.length,
      hasMore: messages.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Error obteniendo mensajes', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error obteniendo mensajes', details: error.message });
  }
});

// Obtener mensaje específico
router.get('/:chatId/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const message = await messageModel.getMessageById(parseInt(messageId));
    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error obteniendo mensaje', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error obteniendo mensaje', details: error.message });
  }
});

// Actualizar mensaje
router.put('/:chatId/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content, metadata } = req.body;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Actualizar mensaje
    const updatedMessage = await messageModel.updateMessage(parseInt(messageId), { content, metadata }, userId);

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Mensaje no encontrado o no tienes permisos para editarlo' });
    }

    console.log('Mensaje actualizado exitosamente', { messageId, chatId, userId });

    res.json({
      success: true,
      message: 'Mensaje actualizado exitosamente',
      message: updatedMessage
    });

  } catch (error) {
    console.error('Error actualizando mensaje', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error actualizando mensaje', details: error.message });
  }
});

// Eliminar mensaje
router.delete('/:chatId/messages/:messageId', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Verificar si es admin/moderador
    const hasPermission = await participantModel.hasRole(chatId, userId, 'moderator');
    const isAdmin = hasPermission;

    // Eliminar mensaje
    const deletedMessage = await messageModel.deleteMessage(parseInt(messageId), userId, isAdmin);

    if (!deletedMessage) {
      return res.status(404).json({ error: 'Mensaje no encontrado o no tienes permisos para eliminarlo' });
    }

    console.log('Mensaje eliminado exitosamente', { messageId, chatId, userId, isAdmin });

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando mensaje', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error eliminando mensaje', details: error.message });
  }
});

// ============================================================================
// RUTAS DE REACCIONES
// ============================================================================

// Agregar reacción a mensaje
router.post('/:chatId/messages/:messageId/reactions', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { reaction_type } = req.body;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Agregar reacción
    const reaction = await messageModel.addReaction(parseInt(messageId), userId, reaction_type);

    console.log('Reacción agregada exitosamente', { messageId, reaction_type, userId });

    // Emitir evento de reacción via Socket.io
    if (global.chatService && global.chatService.io) {
      console.log(`📡 Emitiendo reaction_added a chat ${chatId}:`, { messageId, reaction_type, userId });
      global.chatService.io.to(chatId).emit('reaction_added', {
        messageId: parseInt(messageId),
        reaction_type,
        userId,
        reaction
      });
    }

    res.json({
      success: true,
      message: 'Reacción agregada exitosamente',
      reaction
    });

  } catch (error) {
    console.error('Error agregando reacción', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error agregando reacción', details: error.message });
  }
});

// Remover reacción de mensaje
router.delete('/:chatId/messages/:messageId/reactions/:reactionType', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId, reactionType } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Remover reacción
    const removedReaction = await messageModel.removeReaction(parseInt(messageId), userId, reactionType);

    if (!removedReaction) {
      return res.status(404).json({ error: 'Reacción no encontrada' });
    }

    console.log('Reacción removida exitosamente', { messageId, reactionType, userId });

    // Emitir evento de reacción removida via Socket.io
    if (global.chatService && global.chatService.io) {
      console.log(`📡 Emitiendo reaction_removed a chat ${chatId}:`, { messageId, reactionType, userId });
      global.chatService.io.to(chatId).emit('reaction_removed', {
        messageId: parseInt(messageId),
        reactionType,
        userId
      });
    }

    res.json({
      success: true,
      message: 'Reacción removida exitosamente'
    });

  } catch (error) {
    console.error('Error removiendo reacción', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error removiendo reacción', details: error.message });
  }
});

// Obtener reacciones de un mensaje
router.get('/:chatId/messages/:messageId/reactions', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const reactions = await messageModel.getMessageReactions(parseInt(messageId));

    res.json({
      success: true,
      reactions,
      total: reactions.length
    });

  } catch (error) {
    console.error('Error obteniendo reacciones', { error: error.message, messageId: req.params.messageId });
    res.status(500).json({ error: 'Error obteniendo reacciones', details: error.message });
  }
});

// ============================================================================
// RUTAS DE LECTURA
// ============================================================================

// Marcar mensaje como leído
router.post('/:chatId/messages/:messageId/read', verifyToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Marcar como leído
    await messageModel.markMessageAsRead(parseInt(messageId), userId);

    console.log('Mensaje marcado como leído', { messageId, chatId, userId });

    res.json({
      success: true,
      message: 'Mensaje marcado como leído exitosamente'
    });

  } catch (error) {
    console.error('Error marcando mensaje como leído', { error: error.message, messageId: req.params.messageId });  
    res.status(500).json({ error: 'Error marcando mensaje como leído', details: error.message });
  }
});

// Marcar todos los mensajes del chat como leídos
router.post('/:chatId/read', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Marcar todos como leídos
    await participantModel.markMessagesAsRead(parseInt(chatId), userId);

    console.log('Todos los mensajes marcados como leídos', { chatId, userId });

    res.json({
      success: true,
      message: 'Todos los mensajes marcados como leídos exitosamente'
    });

  } catch (error) {
    console.error('Error marcando mensajes como leídos', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error marcando mensajes como leídos', details: error.message });
  }
});

// ============================================================================
// RUTAS DE BÚSQUEDA
// ============================================================================

// Buscar mensajes en un chat
router.get('/:chatId/search', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: query, limit = 20 } = req.query;
    const userId = req.userId;

    if (!query) {
      return res.status(400).json({ error: 'Query de búsqueda es requerido' });
    }

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const messages = await messageModel.searchMessages(parseInt(chatId), query, parseInt(limit));

    res.json({
      success: true,
      messages,
      total: messages.length,
      query
    });

  } catch (error) {
    console.log('Error buscando mensajes', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error buscando mensajes', details: error.message });
  }
});

// ============================================================================
// RUTAS DE ESTADÍSTICAS
// ============================================================================

// Obtener contador de mensajes no leídos
router.get('/:chatId/unread-count', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    const unreadCount = await participantModel.getUnreadCount(parseInt(chatId), userId);

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.log('Error obteniendo contador de no leídos', { error: error.message, chatId: req.params.chatId });
    res.status(500).json({ error: 'Error obteniendo contador', details: error.message });
  }
});

// Obtener total de mensajes no leídos del usuario
router.get('/unread-count/total', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const totalUnread = await participantModel.getTotalUnreadCount(userId);

    res.json({
      success: true,
      totalUnread
    });

  } catch (error) {
    console.log('Error obteniendo total de no leídos', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Error obteniendo total', details: error.message });
  }
});

module.exports = router;
