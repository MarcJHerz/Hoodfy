const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const fs = require('fs');
const { verifyToken } = require('../middleware/authMiddleware');
const Community = require('../models/Community');
const { uploadFileToS3 } = require('../utils/s3');

// 📌 Asegurar que las carpetas de imágenes existen
const profilePicturesPath = 'uploads/profile_pictures/';

if (!fs.existsSync(profilePicturesPath)) {
  fs.mkdirSync(profilePicturesPath, { recursive: true });
}

// 📌 Configurar `multer` para memoria (para S3)
// Función para detectar el tipo MIME real de un archivo
function detectMimeType(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Mapeo de extensiones a tipos MIME
  const mimeMap = {
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  return mimeMap[ext] || file.mimetype;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB para imágenes de perfil
    files: 1, // Máximo 1 archivo por request
    fieldSize: 50 * 1024 * 1024, // 50MB por campo
    fieldNameSize: 100 // Tamaño máximo del nombre del campo
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Archivo recibido en userRoutes:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });
    
    // Detectar el tipo MIME real basado en la extensión
    const realMimeType = detectMimeType(file);
    console.log('📋 Tipo MIME detectado:', realMimeType);
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'
    ];
    
    if (allowedTypes.includes(realMimeType)) {
      console.log('✅ Archivo aceptado en userRoutes');
      cb(null, true);
    } else {
      console.log('❌ Archivo rechazado en userRoutes - tipo no permitido:', realMimeType);
      cb(new Error(`Tipo de archivo no soportado: ${realMimeType}. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, HEIC, HEIF)`));
    }
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  console.log('🚨 Error de multer detectado en userRoutes:', {
    message: error.message,
    code: error.code,
    field: error.field,
    file: error.file
  });
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el límite de tamaño permitido (50MB)'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Demasiados archivos',
      message: 'No puedes subir más de 1 archivo a la vez'
    });
  }
  
  if (error.message.includes('Tipo de archivo no soportado')) {
    return res.status(400).json({
      error: 'Tipo de archivo no soportado',
      message: error.message
    });
  }
  
  return res.status(500).json({
    error: 'Error al procesar archivos',
    message: error.message
  });
};

// ✅ Ruta para subir imagen de perfil a S3
router.put('/profile/photo', verifyToken, upload.single('profilePicture'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen.' });

    // Subir imagen a S3
    const key = await uploadFileToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    
    // Actualizar usuario con el key de S3
    const user = await User.findByIdAndUpdate(req.userId, { profilePicture: key }, { new: true });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ 
      message: 'Foto de perfil actualizada', 
      profilePicture: key 
    });
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

    // Para S3, el profilePicture ya es el key, no necesitamos construir URL
    const profilePicture = user.profilePicture;

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

    // Para S3, el profilePicture ya es el key, no necesitamos construir URL
    const profilePicture = user.profilePicture;

    // Asegurar que la URL del banner sea absoluta (si existe)
    const bannerImage = user.bannerImage?.startsWith('http')
      ? user.bannerImage
      : user.bannerImage ? `${process.env.BASE_URL || 'https://api.qahood.com'}/${user.bannerImage}` : null;

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
    
    // Para S3, el profilePicture ya es el key, no necesitamos construir URL
    const profilePicture = user.profilePicture;

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
    const { fcmToken } = req.body;
    const userId = req.userId;
    
    // Actualizar el usuario con el token FCM
    await User.findByIdAndUpdate(userId, {
      fcmToken: fcmToken
    });
    
    res.json({ message: 'Token FCM guardado exitosamente' });
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
    const users = await User.find({
      _id: { $in: userIds }
    }).select('fcmToken');
    
    const tokens = users
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken);
    
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
    
    res.json({ success: true, response });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 