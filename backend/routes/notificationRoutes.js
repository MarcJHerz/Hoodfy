const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  cleanupExpiredNotifications,
  getNotificationStats,
  sendPushNotification
} = require('../controllers/notificationController');

// 📋 Obtener todas las notificaciones del usuario
// GET /api/notifications
// Query params: page, limit, unreadOnly
router.get('/', verifyToken, getNotifications);

// 🔢 Obtener conteo de notificaciones no leídas
// GET /api/notifications/unread-count
router.get('/unread-count', verifyToken, getUnreadCount);

// 📊 Obtener estadísticas de notificaciones
// GET /api/notifications/stats
router.get('/stats', verifyToken, getNotificationStats);

// ✅ Marcar notificación específica como leída
// PUT /api/notifications/:notificationId/read
router.put('/:notificationId/read', verifyToken, markAsRead);

// ✅ Marcar todas las notificaciones como leídas
// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', verifyToken, markAllAsRead);

// 🗑️ Eliminar notificación específica
// DELETE /api/notifications/:notificationId
router.delete('/:notificationId', verifyToken, deleteNotification);

// 🗑️ Eliminar todas las notificaciones del usuario
// DELETE /api/notifications/all
router.delete('/all', verifyToken, deleteAllNotifications);

// 📝 Crear notificación (uso interno/admin)
// POST /api/notifications
// Body: { userId, type, communityId?, postId?, subscriptionId?, commentId?, customData? }
router.post('/', verifyToken, createNotification);

// 📤 Enviar notificación push a tokens FCM
// POST /api/notifications/send
// Body: { notification: { title, body, data }, tokens: string[] }
router.post('/send', sendPushNotification);

// 🧹 Limpiar notificaciones expiradas (endpoint para cron jobs)
// POST /api/notifications/cleanup
// Nota: Este endpoint podría requerir autenticación de admin o key especial
router.post('/cleanup', cleanupExpiredNotifications);

module.exports = router; 