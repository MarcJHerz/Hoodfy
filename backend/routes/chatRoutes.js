const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const admin = require('../config/firebase-admin');

// Marcar mensajes como leídos
router.post('/:chatId/read', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    console.log(`📖 Marcando mensajes como leídos para usuario ${userId} en chat ${chatId}`);

    // ✅ FIXED: Verificar que Firebase admin esté inicializado correctamente
    if (!admin.apps.length) {
      throw new Error('Firebase admin no está inicializado');
    }

    // Obtener Firestore correctamente y verificar conexión
    const db = admin.firestore();
    
    if (!db) {
      throw new Error('No se pudo obtener Firestore database');
    }

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