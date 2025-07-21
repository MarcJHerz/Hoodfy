const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Para consultas rápidas por usuario
  },
  type: { 
    type: String, 
    enum: [
      'subscription_success',     // "Te has suscrito exitosamente a [Comunidad]"
      'new_post',                // "Se ha publicado un nuevo post en [Comunidad]"
      'new_comment',             // "Tienes un nuevo comentario en tu post"
      'subscription_expiring',   // "Tu suscripción expira en X días"
      'payment_failed',          // "Pago fallido - Actualiza tu método de pago"
      'payment_success',         // "Pago exitoso - Tu suscripción está activa"
      'subscription_canceled',   // "Tu suscripción ha sido cancelada"
      'community_update'         // "Actualizaciones en la comunidad"
    ], 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true,
    maxlength: [100, 'El título no puede exceder los 100 caracteres.']
  },
  message: { 
    type: String, 
    required: true,
    maxlength: [500, 'El mensaje no puede exceder los 500 caracteres.']
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true // Para consultas de notificaciones no leídas
  },
  metadata: {
    // Datos adicionales específicos del tipo de notificación
    communityId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Community',
      required: false 
    },
    postId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Post',
      required: false 
    },
    subscriptionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Subscription',
      required: false 
    },
    commentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Comment',
      required: false 
    },
    // Para notificaciones de expiración
    daysUntilExpiration: {
      type: Number,
      required: false
    },
    // Para notificaciones de pago
    amount: {
      type: Number,
      required: false
    },
    // URL de acción (ej: enlace al post, comunidad, etc.)
    actionUrl: {
      type: String,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Para ordenar por fecha
  },
  // Expiración automática de notificaciones (30 días por defecto)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    index: true // Para limpieza automática
  }
});

// Índices compuestos para consultas optimizadas
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index para limpieza automática

// Métodos del modelo
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Método estático para crear notificaciones tipadas
NotificationSchema.statics.createNotification = async function(notificationData) {
  const { userId, type, communityId, postId, subscriptionId, commentId, customData } = notificationData;
  
  let title, message, actionUrl;
  
  // Generar título y mensaje según el tipo
  switch(type) {
    case 'subscription_success':
      const community = await mongoose.model('Community').findById(communityId);
      title = '🎉 Suscripción exitosa';
      message = `Te has suscrito exitosamente a ${community?.name || 'la comunidad'}`;
      actionUrl = `/communities/${communityId}`;
      break;
      
    case 'new_post':
      const postCommunity = await mongoose.model('Community').findById(communityId);
      title = '📝 Nuevo post';
      message = `Se ha publicado un nuevo post en ${postCommunity?.name || 'tu comunidad'}`;
      actionUrl = `/posts/${postId}`;
      break;
      
    case 'new_comment':
      title = '💬 Nuevo comentario';
      message = 'Tienes un nuevo comentario en tu post';
      actionUrl = `/posts/${postId}#comment-${commentId}`;
      break;
      
    case 'subscription_expiring':
      const expCommunity = await mongoose.model('Community').findById(communityId);
      const days = customData?.daysUntilExpiration || 3;
      title = '⚠️ Suscripción por expirar';
      message = `Tu suscripción a ${expCommunity?.name || 'la comunidad'} expira en ${days} día${days > 1 ? 's' : ''}`;
      actionUrl = `/communities/${communityId}`;
      break;
      
    case 'payment_failed':
      const failCommunity = await mongoose.model('Community').findById(communityId);
      title = '💳 Pago fallido';
      message = `No se pudo procesar el pago para ${failCommunity?.name || 'tu suscripción'}. Actualiza tu método de pago`;
      actionUrl = '/dashboard/subscriptions';
      break;
      
    case 'payment_success':
      const succCommunity = await mongoose.model('Community').findById(communityId);
      title = '✅ Pago exitoso';
      message = `Pago exitoso. Tu suscripción a ${succCommunity?.name || 'la comunidad'} está activa`;
      actionUrl = `/communities/${communityId}`;
      break;
      
    case 'subscription_canceled':
      const canCommunity = await mongoose.model('Community').findById(communityId);
      title = '❌ Suscripción cancelada';
      message = `Tu suscripción a ${canCommunity?.name || 'la comunidad'} ha sido cancelada`;
      actionUrl = '/dashboard';
      break;
      
    default:
      title = customData?.title || 'Notificación';
      message = customData?.message || 'Tienes una nueva notificación';
      actionUrl = customData?.actionUrl || '/dashboard';
  }
  
  // Crear la notificación
  const notification = new this({
    user: userId,
    type,
    title,
    message,
    metadata: {
      communityId,
      postId,
      subscriptionId,
      commentId,
      daysUntilExpiration: customData?.daysUntilExpiration,
      amount: customData?.amount,
      actionUrl
    }
  });
  
  return notification.save();
};

// Método estático para obtener el conteo de notificaciones no leídas
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, read: false });
};

// Método estático para marcar todas como leídas
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};

module.exports = mongoose.model('Notification', NotificationSchema); 