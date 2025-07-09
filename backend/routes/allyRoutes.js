const express = require('express');
const router = express.Router();
const Ally = require('../models/Ally');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

// Función para asegurar URLs absolutas
const ensureAbsoluteUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.BASE_URL || 'https://api.qahood.com';
  return `${baseUrl}/${url}`;
};

// 🔹 Obtener mis aliados
router.get('/my-allies', verifyToken, async (req, res) => {
  try {
    const allies = await Ally.find({
      $or: [
        { user1: req.userId },
        { user2: req.userId }
      ]
    })
    .populate('user1', 'name username profilePicture bio category')
    .populate('user2', 'name username profilePicture bio category');
    
    const formattedAllies = allies.map(a => {
      const allyUser = a.user1._id.toString() === req.userId.toString() ? a.user2 : a.user1;
      return {
        _id: allyUser._id,
        name: allyUser.name,
        username: allyUser.username,
        profilePicture: ensureAbsoluteUrl(allyUser.profilePicture),
        bio: allyUser.bio,
        category: allyUser.category
      };
    });

    res.json({
      message: 'Aliados obtenidos con éxito',
      allies: formattedAllies
    });
  } catch (error) {
    console.error('❌ Error al obtener aliados:', error);
    res.status(500).json({ 
      error: 'Error al obtener aliados',
      message: error.message 
    });
  }
});

// 🔹 Agregar un aliado
router.post('/add-ally', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { userId: 'El ID del usuario es obligatorio' }
      });
    }

    // Verificar que el usuario a agregar existe
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: { userId: 'El usuario que intentas agregar no existe' }
      });
    }

    // Verificar que no sea el mismo usuario
    if (userId === req.userId) {
      return res.status(400).json({ 
        error: 'Operación inválida',
        details: { userId: 'No puedes agregarte a ti mismo como aliado' }
      });
    }

    // Verificar que no sean ya aliados
    const existingAlly = await Ally.findOne({
      $or: [
        { user1: req.userId, user2: userId },
        { user1: userId, user2: req.userId }
      ]
    });

    if (existingAlly) {
      return res.status(400).json({ 
        error: 'Aliado existente',
        details: { userId: 'Ya eres aliado de este usuario' }
      });
    }

    // Crear la relación de aliados
    const newAlly = new Ally({
      user1: req.userId,
      user2: userId
    });

    await newAlly.save();

    res.status(201).json({
      message: 'Aliado agregado con éxito',
      ally: {
        _id: userToAdd._id,
        name: userToAdd.name,
        username: userToAdd.username,
        profilePicture: ensureAbsoluteUrl(userToAdd.profilePicture)
      }
    });
  } catch (error) {
    console.error('❌ Error al agregar aliado:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Aliado existente',
        details: { userId: 'Ya eres aliado de este usuario' }
      });
    }

    res.status(500).json({ 
      error: 'Error al agregar aliado',
      message: error.message 
    });
  }
});

// 🔹 Eliminar un aliado
router.delete('/remove-ally/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: { userId: 'El ID del usuario es obligatorio' }
      });
    }

    const result = await Ally.findOneAndDelete({
      $or: [
        { user1: req.userId, user2: userId },
        { user1: userId, user2: req.userId }
      ]
    });

    if (!result) {
      return res.status(404).json({ 
        error: 'Aliado no encontrado',
        details: { userId: 'No existe una relación de aliados con este usuario' }
      });
    }

    res.json({
      message: 'Aliado eliminado con éxito'
    });
  } catch (error) {
    console.error('❌ Error al eliminar aliado:', error);
    res.status(500).json({ 
      error: 'Error al eliminar aliado',
      message: error.message 
    });
  }
});

// 🔹 Verificar si dos usuarios son aliados
router.get('/check/:targetUserId', verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;

    const ally = await Ally.findOne({
      $or: [
        { user1: req.userId, user2: targetUserId },
        { user1: targetUserId, user2: req.userId }
      ]
    });

    res.json({
      isAlly: !!ally
    });
  } catch (error) {
    console.error('❌ Error al verificar aliado:', error);
    res.status(500).json({ 
      error: 'Error al verificar aliado',
      message: error.message 
    });
  }
});

// 🔹 Obtener aliados de cualquier usuario
router.get('/of/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const allies = await Ally.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    })
    .populate('user1', 'name username profilePicture bio category')
    .populate('user2', 'name username profilePicture bio category');

    const formattedAllies = allies.map(a => {
      const allyUser = a.user1._id.toString() === userId ? a.user2 : a.user1;
      return {
        _id: allyUser._id,
        name: allyUser.name,
        username: allyUser.username,
        profilePicture: ensureAbsoluteUrl(allyUser.profilePicture),
        bio: allyUser.bio,
        category: allyUser.category
      };
    });

    res.json({
      message: 'Aliados obtenidos con éxito',
      allies: formattedAllies
    });
  } catch (error) {
    console.error('❌ Error al obtener aliados de usuario:', error);
    res.status(500).json({
      error: 'Error al obtener aliados de usuario',
      message: error.message
    });
  }
});

module.exports = router; 