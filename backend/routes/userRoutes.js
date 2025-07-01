const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');
const Community = require('../models/Community');

// 📌 Asegurar que las carpetas de imágenes existen
const profilePicturesPath = 'uploads/profile_pictures/';

if (!fs.existsSync(profilePicturesPath)) {
  fs.mkdirSync(profilePicturesPath, { recursive: true });
}

// 📌 Configurar `multer` para imágenes de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = profilePicturesPath;
    if (req.url.includes('/profile/upload-image')) {
      const uploadFolder = 'uploads/profile_content';
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }
      folder = uploadFolder;
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✅ Ruta para subir imagen de perfil
router.put('/profile/photo', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    const profilePicturePath = `uploads/profile_pictures/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { profilePicture: profilePicturePath }, { new: true });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Foto de perfil actualizada', profilePicture: `${process.env.BASE_URL || 'http://192.168.1.87:5000'}/${profilePicturePath}` });
  } catch (error) {
    console.error('❌ Error al actualizar la foto de perfil:', error);
    res.status(500).json({ error: 'Error al actualizar la foto de perfil' });
  }
});

// ✅ Ruta para obtener el perfil del usuario autenticado
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Buscar si el usuario es fundador de alguna comunidad
    const isFounder = await Community.exists({ creator: user._id });
    // Buscar si el usuario es miembro de alguna comunidad
    const isMember = await Community.exists({ members: user._id });

    let mainBadgeIcon = null;
    if (isFounder) mainBadgeIcon = 'founder';
    else if (isMember) mainBadgeIcon = 'trophy';

    // Construir la URL base para las imágenes
    const baseUrl = process.env.BASE_URL || 'http://192.168.1.87:5000';

    // Procesar las URLs de las imágenes
    const profilePicture = user.profilePicture?.startsWith('http') 
      ? user.profilePicture 
      : `${baseUrl}/${user.profilePicture}`;

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture,
      bio: user.bio || '',
      category: user.category || '',
      links: user.links || [],
      profileBlocks: user.profileBlocks || [],
      subscriptionPrice: user.subscriptionPrice ?? 0,
      mainBadgeIcon
    });
  } catch (error) {
    console.error('❌ Error al obtener el perfil:', error);
    res.status(500).json({ 
      error: 'Error al obtener el perfil',
      message: error.message 
    });
  }
});

// ✅ Ruta para obtener el perfil de cualquier usuario
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'Falta el userId en la solicitud.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Buscar si el usuario es fundador de alguna comunidad
    const isFounder = await Community.exists({ creator: user._id });
    // Buscar si el usuario es miembro de alguna comunidad
    const isMember = await Community.exists({ members: user._id });

    let mainBadgeIcon = null;
    if (isFounder) mainBadgeIcon = 'founder';
    else if (isMember) mainBadgeIcon = 'trophy';

    const baseUrl = process.env.BASE_URL || 'http://192.168.1.87:5000';

    // Asegurar que la URL de la imagen de perfil sea absoluta
    const profilePicture = user.profilePicture?.startsWith('http') 
      ? user.profilePicture 
      : `${baseUrl}/${user.profilePicture}`;

    // Asegurar que la URL del banner sea absoluta
    const bannerImage = user.bannerImage?.startsWith('http')
      ? user.bannerImage
      : user.bannerImage ? `${baseUrl}/${user.bannerImage}` : null;

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture,
      bannerImage,
      bio: user.bio || '',
      category: user.category || '',
      links: user.links || [],
      profileBlocks: user.profileBlocks || [],
      subscriptionPrice: user.subscriptionPrice ?? 0,
      mainBadgeIcon
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil de usuario:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    res.status(500).json({ error: 'Error al obtener perfil de usuario' });
  }
});

// ✅ Ruta para actualizar datos de perfil
router.put('/profile/update', verifyToken, upload.none(), async (req, res) => {
  try {
    const { name, username, bio, category, links } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ✅ Actualizar solo si hay datos nuevos
    if (name) user.name = name;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (category !== undefined) user.category = category;
    if (links !== undefined) {
      user.links = Array.isArray(links) ? links : links.split(',').map(link => link.trim());
    }

    await user.save();
    
    // Construir la URL base para las imágenes
    const baseUrl = process.env.BASE_URL || 'http://192.168.1.87:5000';

    // Procesar las URLs de las imágenes
    const profilePicture = user.profilePicture?.startsWith('http') 
      ? user.profilePicture 
      : `${baseUrl}/${user.profilePicture}`;

    res.json({ 
      message: 'Perfil actualizado con éxito', 
      user: {
        ...user.toObject(),
        profilePicture
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// 📌 Ruta para obtener usuarios recomendados
router.get('/recommended', async (req, res) => {
  try {
    const users = await User.find().limit(10).select('_id name profilePicture bio');
    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios recomendados:', error);
    res.status(500).json({ error: 'Error al obtener usuarios recomendados' });
  }
});

// 📌 Ruta para buscar usuarios por nombre o username
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'La consulta de búsqueda no puede estar vacía.' });
  }

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ]
    }).select('_id name username profilePicture');

    res.json(users);
  } catch (error) {
    console.error('❌ Error en la búsqueda de usuarios:', error);
    res.status(500).json({ error: 'Error en la búsqueda de usuarios' });
  }
});

router.put('/profile/blocks', verifyToken, async (req, res) => {
  try {
    const { profileBlocks } = req.body;

    if (!Array.isArray(profileBlocks)) {
      return res.status(400).json({ error: 'profileBlocks debe ser un array' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profileBlocks: profileBlocks },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Bloques de perfil actualizados', profileBlocks: updatedUser.profileBlocks });
  } catch (error) {
    console.error('❌ Error al actualizar bloques de perfil:', error);
    res.status(500).json({ error: 'Error al actualizar bloques de perfil' });
  }
});

// Guardar token FCM del usuario
router.post('/fcm-token', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!token) {
      return res.status(400).json({ error: 'Token FCM requerido' });
    }

    // Actualizar el token FCM en la base de datos
    await User.findByIdAndUpdate(userId, {
      fcmToken: token,
      updatedAt: new Date()
    });

    console.log(`Token FCM guardado para usuario: ${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando token FCM:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener tokens FCM de múltiples usuarios
router.post('/fcm-tokens', verifyToken, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Lista de IDs de usuarios requerida' });
    }

    // Obtener usuarios con sus tokens FCM
    const users = await User.find(
      { _id: { $in: userIds } },
      'fcmToken'
    );

    // Extraer tokens válidos
    const tokens = users
      .map(user => user.fcmToken)
      .filter(token => token && token.trim() !== '');

    console.log(`Tokens FCM obtenidos: ${tokens.length} de ${userIds.length} usuarios`);
    res.json({ tokens });
  } catch (error) {
    console.error('Error obteniendo tokens FCM:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Enviar notificación push
router.post('/notifications/send', verifyToken, async (req, res) => {
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
    
    console.log('Notificación enviada:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    res.json({ success: true, response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 