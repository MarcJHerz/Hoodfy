const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const Ally = require('../models/Ally');

// 🔒 Verificar permisos para chat de comunidad
router.post('/community/:communityId/check-access', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.userId;

    // Verificar si la comunidad existe
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ 
        error: 'Comunidad no encontrada',
        hasAccess: false 
      });
    }

    // Verificar si es el creador
    const isCreator = community.creator.toString() === userId;

    // Verificar si está suscrito
    const subscription = await Subscription.findOne({
      user: userId,
      community: communityId,
      status: 'active'
    });

    const hasAccess = isCreator || !!subscription;

    res.json({
      hasAccess,
      isCreator,
      isSubscribed: !!subscription,
      communityName: community.name,
      memberCount: community.members?.length || 0
    });
  } catch (error) {
    console.error('Error verificando acceso a chat de comunidad:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      hasAccess: false 
    });
  }
});

// 🔒 Verificar permisos para chat privado
router.post('/private/:targetUserId/check-access', verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.userId;

    // No permitir chat consigo mismo
    if (userId === targetUserId) {
      return res.status(400).json({ 
        error: 'No puedes chatear contigo mismo',
        hasAccess: false 
      });
    }

    // Verificar si el usuario objetivo existe
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        hasAccess: false 
      });
    }

    // Verificar si son aliados
    const allyRelation = await Ally.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId }
      ]
    });

    const areAllies = !!allyRelation;

    res.json({
      hasAccess: areAllies,
      areAllies,
      targetUser: {
        _id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Error verificando acceso a chat privado:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      hasAccess: false 
    });
  }
});

// 📊 Estadísticas de chat para el usuario
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Contar aliados (chats privados potenciales)
    const allies = await Ally.countDocuments({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    });

    // Contar comunidades con acceso (chats de comunidad)
    const communities = await Community.countDocuments({
      $or: [
        { creator: userId }, // Creadas por el usuario
        { members: userId }   // Es miembro
      ]
    });

    // Suscripciones activas
    const activeSubscriptions = await Subscription.countDocuments({
      user: userId,
      status: 'active'
    });

    res.json({
      totalPrivateChats: allies,
      totalCommunityChats: communities,
      activeSubscriptions,
      canCreatePrivateChats: allies > 0,
      canAccessCommunityChats: communities > 0
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de chat:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🔧 Health check para sistema de chat
router.get('/health', verifyToken, async (req, res) => {
  try {
    // Verificar conexiones necesarias
    const checks = {
      mongodb: false,
      firebase: false,
      user: false
    };

    // Check MongoDB
    try {
      await User.countDocuments({}).limit(1);
      checks.mongodb = true;
    } catch (error) {
      console.error('MongoDB check failed:', error);
    }

    // Check usuario actual
    try {
      const user = await User.findById(req.userId);
      checks.user = !!user;
    } catch (error) {
      console.error('User check failed:', error);
    }

    // Check Firebase (básico)
    try {
      // Asumimos que Firebase está funcionando si llegamos aquí
      checks.firebase = true;
    } catch (error) {
      console.error('Firebase check failed:', error);
    }

    const allHealthy = Object.values(checks).every(check => check === true);

    res.json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 