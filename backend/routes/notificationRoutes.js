const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Enviar notificación push
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { notification, tokens } = req.body;

    if (!notification || !tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'Datos de notificación inválidos' });
    }

    // Usar Firebase Admin para enviar notificación
    const admin = require('../config/firebase-admin');
    const messaging = admin.messaging();

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens,
      android: {
        notification: {
          sound: 'default',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/default-avatar.png',
          badge: '/default-avatar.png',
          actions: [
            {
              action: 'open',
              title: 'Abrir',
            },
            {
              action: 'close',
              title: 'Cerrar',
            },
          ],
        },
        fcm_options: {
          link: notification.data?.click_action || '/messages',
        },
      },
    };

    const response = await messaging.sendMulticast(message);
    
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 