const Notification = require('../models/Notification');
const User = require('../models/User');
const Community = require('../models/Community');
const mongoose = require('mongoose');

// 📋 Obtener todas las notificaciones del usuario
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    console.log('📋 Obteniendo notificaciones para usuario:', userId);
    
    // Construir query
    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener notificaciones con paginación
    const notifications = await Notification.find(query)
      .populate('metadata.communityId', 'name coverImage')
      .populate('metadata.postId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Obtener total para paginación
    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    console.log(`✅ Encontradas ${notifications.length} notificaciones (página ${page}/${totalPages})`);
    
    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error obteniendo notificaciones' });
  }
};

// 🔢 Obtener conteo de notificaciones no leídas
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    
    const unreadCount = await Notification.getUnreadCount(userId);
    
    console.log(`🔢 Usuario ${userId} tiene ${unreadCount} notificaciones no leídas`);
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('❌ Error obteniendo conteo no leídas:', error);
    res.status(500).json({ error: 'Error obteniendo conteo de notificaciones' });
  }
};

// ✅ Marcar notificación como leída
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;
    
    console.log('✅ Marcando como leída notificación:', notificationId);
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: 'ID de notificación inválido' });
    }
    
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    if (!notification.read) {
      await notification.markAsRead();
      console.log('✅ Notificación marcada como leída');
    }
    
    res.json({ message: 'Notificación marcada como leída', notification });
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    res.status(500).json({ error: 'Error actualizando notificación' });
  }
};

// ✅ Marcar todas las notificaciones como leídas
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('✅ Marcando todas las notificaciones como leídas para usuario:', userId);
    
    const result = await Notification.markAllAsRead(userId);
    
    console.log(`✅ ${result.modifiedCount} notificaciones marcadas como leídas`);
    
    res.json({ 
      message: 'Todas las notificaciones marcadas como leídas',
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marcando todas como leídas:', error);
    res.status(500).json({ error: 'Error actualizando notificaciones' });
  }
};

// 🗑️ Eliminar notificación
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;
    
    console.log('🗑️ Eliminando notificación:', notificationId);
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: 'ID de notificación inválido' });
    }
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    console.log('✅ Notificación eliminada exitosamente');
    
    res.json({ message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando notificación:', error);
    res.status(500).json({ error: 'Error eliminando notificación' });
  }
};

// 🗑️ Eliminar todas las notificaciones del usuario
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('🗑️ Eliminando todas las notificaciones para usuario:', userId);
    
    const result = await Notification.deleteMany({ user: userId });
    
    console.log(`✅ ${result.deletedCount} notificaciones eliminadas`);
    
    res.json({ 
      message: 'Todas las notificaciones eliminadas',
      deleted: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error eliminando todas las notificaciones:', error);
    res.status(500).json({ error: 'Error eliminando notificaciones' });
  }
};

// 📝 Crear notificación (uso interno/admin)
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, communityId, postId, subscriptionId, commentId, customData } = req.body;
    
    console.log('📝 Creando notificación:', { userId, type });
    
    // Validar userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Crear notificación usando el método estático del modelo
    const notification = await Notification.createNotification({
      userId,
      type,
      communityId,
      postId,
      subscriptionId,
      commentId,
      customData
    });
    
    console.log('✅ Notificación creada:', notification._id);
    
    res.status(201).json({ 
      message: 'Notificación creada exitosamente',
      notification
    });
  } catch (error) {
    console.error('❌ Error creando notificación:', error);
    res.status(500).json({ error: 'Error creando notificación' });
  }
};

// 🧹 Limpiar notificaciones expiradas (uso interno/cron)
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    console.log('🧹 Iniciando limpieza de notificaciones expiradas...');
    
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`✅ ${result.deletedCount} notificaciones expiradas eliminadas`);
    
    res.json({ 
      message: 'Limpieza completada',
      deleted: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error en limpieza de notificaciones:', error);
    res.status(500).json({ error: 'Error en limpieza de notificaciones' });
  }
};

// 📊 Obtener estadísticas de notificaciones (opcional, para admin)
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await Notification.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalNotifications = await Notification.countDocuments({ user: userId });
    const totalUnread = await Notification.countDocuments({ user: userId, read: false });
    
    res.json({
      totalNotifications,
      totalUnread,
      byType: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
};

// 🔔 Funciones auxiliares para crear notificaciones específicas
exports.notificationHelpers = {
  // Notificación de suscripción exitosa
  async createSubscriptionSuccessNotification(userId, communityId, subscriptionId) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'subscription_success',
        communityId,
        subscriptionId
      });
    } catch (error) {
      console.error('Error creando notificación de suscripción exitosa:', error);
    }
  },

  // Notificación de nuevo post
  async createNewPostNotification(userId, communityId, postId) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'new_post',
        communityId,
        postId
      });
    } catch (error) {
      console.error('Error creando notificación de nuevo post:', error);
    }
  },

  // Notificación de nuevo comentario
  async createNewCommentNotification(userId, postId, commentId) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'new_comment',
        postId,
        commentId
      });
    } catch (error) {
      console.error('Error creando notificación de nuevo comentario:', error);
    }
  },

  // Notificación de pago fallido
  async createPaymentFailedNotification(userId, communityId, subscriptionId) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'payment_failed',
        communityId,
        subscriptionId
      });
    } catch (error) {
      console.error('Error creando notificación de pago fallido:', error);
    }
  },

  // Notificación de pago exitoso
  async createPaymentSuccessNotification(userId, communityId, subscriptionId, amount) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'payment_success',
        communityId,
        subscriptionId,
        customData: { amount }
      });
    } catch (error) {
      console.error('Error creando notificación de pago exitoso:', error);
    }
  },

  // Notificación de suscripción cancelada
  async createSubscriptionCanceledNotification(userId, communityId, subscriptionId) {
    try {
      return await Notification.createNotification({
        userId,
        type: 'subscription_canceled',
        communityId,
        subscriptionId
      });
    } catch (error) {
      console.error('Error creando notificación de suscripción cancelada:', error);
    }
  }
}; 