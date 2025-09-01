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

// ============================================================================
// RUTAS DE CHAT
// ============================================================================

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
    
    logger.info('Chat creado exitosamente', { chatId: chat.id, type, created_by });

    res.status(201).json({
      success: true,
      message: 'Chat creado exitosamente',
      chat
    });

  } catch (error) {
    logger.error('Error creando chat', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Error creando chat', details: error.message });
  }
});

// Obtener chat por ID
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
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
    logger.error('Error obteniendo chat', { error: error.message, chatId: req.params.chatId });
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
    logger.error('Error obteniendo chats del usuario', { error: error.message, userId: req.userId });
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

    logger.info('Usuario se unió al chat', { chatId, userId, role });

    res.json({
      success: true,
      message: 'Te has unido al chat exitosamente',
      participant
    });

  } catch (error) {
    logger.error('Error uniéndose al chat', { error: error.message, chatId: req.params.chatId });
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

    logger.info('Usuario salió del chat', { chatId, userId });

    res.json({
      success: true,
      message: 'Has salido del chat exitosamente'
    });

  } catch (error) {
    logger.error('Error saliendo del chat', { error: error.message, chatId: req.params.chatId });
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
    logger.error('Error obteniendo participantes', { error: error.message, chatId: req.params.chatId });
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

    logger.info('Rol de participante actualizado', { chatId, participantId, newRole: role, updatedBy: userId });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      participant: updatedParticipant
    });

  } catch (error) {
    logger.error('Error actualizando rol', { error: error.message, chatId: req.params.chatId });
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

    logger.info('Participante mutado/desmutado', { chatId, participantId, muted, updatedBy: userId });

    res.json({
      success: true,
      message: `Usuario ${muted ? 'mutado' : 'desmutado'} exitosamente`,
      participant: updatedParticipant
    });

  } catch (error) {
    logger.error('Error mutando participante', { error: error.message, chatId: req.params.chatId });
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

    logger.info('Participante baneado/desbaneado', { chatId, participantId, banned, updatedBy: userId });

    res.json({
      success: true,
      message: `Usuario ${banned ? 'baneado' : 'desbaneado'} exitosamente`,
      participant: updatedParticipant
    });

  } catch (error) {
    logger.error('Error baneando participante', { error: error.message, chatId: req.params.chatId });
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

    // Verificar si el usuario es participante
    const isParticipant = await participantModel.isParticipant(chatId, sender_id);
    if (!isParticipant) {
      return res.status(403).json({ error: 'No puedes enviar mensajes a este chat' });
    }

    // Verificar si está mutado
    const participant = await participantModel.getParticipant(chatId, sender_id);
    if (participant && participant.is_muted) {
      return res.status(403).json({ error: 'Estás mutado en este chat' });
    }

    // Crear mensaje
    const messageData = {
      chat_id: parseInt(chatId),
      sender_id,
      content,
      content_type: content_type || 'text',
      reply_to_id,
      metadata: metadata || {}
    };

    const message = await messageModel.createMessage(messageData);

    logger.info('Mensaje enviado exitosamente', { messageId: message.id, chatId, sender_id });

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      message
    });

  } catch (error) {
    logger.error('Error enviando mensaje', { error: error.message, chatId: req.params.chatId });
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
    const isParticipant = await participantModel.isParticipant(chatId, userId);
    if (!isParticipant) {
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
    logger.error('Error obteniendo mensajes', { error: error.message, chatId: req.params.chatId });
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
    logger.error('Error obteniendo mensaje', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Mensaje actualizado exitosamente', { messageId, chatId, userId });

    res.json({
      success: true,
      message: 'Mensaje actualizado exitosamente',
      message: updatedMessage
    });

  } catch (error) {
    logger.error('Error actualizando mensaje', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Mensaje eliminado exitosamente', { messageId, chatId, userId, isAdmin });

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    logger.error('Error eliminando mensaje', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Reacción agregada exitosamente', { messageId, reaction_type, userId });

    res.json({
      success: true,
      message: 'Reacción agregada exitosamente',
      reaction
    });

  } catch (error) {
    logger.error('Error agregando reacción', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Reacción removida exitosamente', { messageId, reactionType, userId });

    res.json({
      success: true,
      message: 'Reacción removida exitosamente'
    });

  } catch (error) {
    logger.error('Error removiendo reacción', { error: error.message, messageId: req.params.messageId });
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
    logger.error('Error obteniendo reacciones', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Mensaje marcado como leído', { messageId, chatId, userId });

    res.json({
      success: true,
      message: 'Mensaje marcado como leído exitosamente'
    });

  } catch (error) {
    logger.error('Error marcando mensaje como leído', { error: error.message, messageId: req.params.messageId });
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

    logger.info('Todos los mensajes marcados como leídos', { chatId, userId });

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
    logger.error('Error buscando mensajes', { error: error.message, chatId: req.params.chatId });
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
    logger.error('Error obteniendo contador de no leídos', { error: error.message, chatId: req.params.chatId });
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
    logger.error('Error obteniendo total de no leídos', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Error obteniendo total', details: error.message });
  }
});

module.exports = router;
