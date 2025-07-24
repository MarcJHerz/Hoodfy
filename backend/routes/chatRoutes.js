const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const admin = require('../config/firebase-admin');

// Marcar mensajes como leídos
router.post('/:chatId/read', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    console.log(`📖 Marcando mensajes como leídos para usuario ${userId} en chat ${chatId}`);

    // Actualizar el contador de mensajes no leídos en Firestore
    const { db } = require('../config/firebase-admin');
    
    await db.collection('chats').doc(chatId).update({
      [`unreadCount.${userId}`]: 0,
    });

    console.log(`✅ Mensajes marcados como leídos para usuario ${userId} en chat ${chatId}`);

    res.json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('❌ Error marcando mensajes como leídos:', error);
    res.status(500).json({ 
      error: 'Error marcando mensajes como leídos',
      details: error.message 
    });
  }
});

module.exports = router; 