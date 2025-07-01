const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Community = require('../models/Community');
const { verifyToken } = require('../middleware/authMiddleware');
const Ally = require('../models/Ally');
const { makeAllies } = require('./communitiesRoutes');
const User = require('../models/User');

// 📌 Suscribirse a una comunidad
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    const { communityId, amount, paymentMethod } = req.body;
    const userId = req.userId;

    // Validar communityId
    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ error: 'ID de comunidad inválido.' });
    }

    // Verificar si la comunidad existe
    const communityExists = await Community.findById(communityId);
    if (!communityExists) {
      return res.status(404).json({ error: 'La comunidad no existe.' });
    }

    // Verificar si el usuario ya está suscrito
    const existingSubscription = await Subscription.findOne({ 
      user: userId, 
      community: communityId, 
      status: 'active' 
    });
    
    if (existingSubscription) {
      return res.status(400).json({ error: 'Ya estás suscrito a esta comunidad.' });
    }

    // Crear nueva suscripción
    const newSubscription = new Subscription({
      user: userId,
      community: communityId,
      amount: amount || 0,
      paymentMethod: paymentMethod || 'manual',
      status: 'active',
      startDate: new Date(),
    });

    await newSubscription.save();
    
    // Añadir usuario como miembro de la comunidad
    if (!communityExists.members.includes(userId)) {
      communityExists.members.push(userId);
      await communityExists.save();
      await makeAllies(userId, communityExists._id);
    }
    
    res.status(201).json({ 
      message: 'Suscripción exitosa', 
      subscription: newSubscription 
    });
  } catch (error) {
    console.error('❌ Error al suscribirse:', error);
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
});

// 📌 Cancelar suscripción
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const userId = req.userId;

    // Buscar la suscripción
    const subscription = await Subscription.findOne({ 
      _id: subscriptionId, 
      user: userId, 
      status: 'active' 
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'No tienes una suscripción activa con este ID.' });
    }

    // Cancelar suscripción
    subscription.status = 'canceled';
    subscription.endDate = new Date();
    await subscription.save();

    // También removemos al usuario de los miembros de la comunidad
    await Community.findByIdAndUpdate(
      subscription.community,
      { $pull: { members: userId } }
    );

    res.json({ 
      message: 'Suscripción cancelada con éxito', 
      subscription 
    });
  } catch (error) {
    console.error('❌ Error al cancelar suscripción:', error);
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

// 📌 Obtener suscripciones del usuario (todas, activas e inactivas)
router.get('/my-subscriptions', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Obteniendo suscripciones para usuario:', req.userId);
    
    // Verificar que el usuario existe
    const user = await User.findById(req.userId);
    if (!user) {
      console.error('❌ Usuario no encontrado:', req.userId);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('✅ Usuario encontrado:', user.name, user.email);
    
    const subscriptions = await Subscription.find({ 
      user: req.userId,
      status: 'active' // Solo suscripciones activas
    }).populate('community', 'name description coverImage members creator');

    console.log(`📊 Encontradas ${subscriptions.length} suscripciones activas`);

    // Filtramos suscripciones sin comunidad (por si acaso alguna está corrupta)
    const filtered = subscriptions.filter(sub => sub.community !== null);
    
    console.log(`✅ Retornando ${filtered.length} suscripciones válidas`);
    
    // Log detallado de cada suscripción
    filtered.forEach((sub, index) => {
      console.log(`📋 Suscripción ${index + 1}:`, {
        id: sub._id,
        userId: sub.user,
        communityId: sub.community._id,
        communityName: sub.community.name,
        status: sub.status
      });
    });

    res.json(filtered);
  } catch (err) {
    console.error('❌ Error al obtener suscripciones:', err);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// 📌 Obtener solamente comunidades activas (suscripciones activas)
router.get('/by-user', verifyToken, async (req, res) => {
  try {
    // Obtener todas las suscripciones activas
    const subscriptions = await Subscription.find({
      user: req.userId,
      status: 'active'
    });

    console.log(`🔍 Encontradas ${subscriptions.length} suscripciones activas para el usuario ${req.userId}`);
    
    // Extraer solo los IDs de comunidades
    const communityIds = subscriptions
      .filter(sub => sub.community) // Filtrar casos donde community es null
      .map(sub => sub.community.toString());
    
    if (communityIds.length === 0) {
      console.log('ℹ️ No hay comunidades suscritas activas');
      return res.json([]);
    }
    
    // Buscar las comunidades completas
    const communities = await Community.find({
      _id: { $in: communityIds }
    });
    
    console.log(`✅ Retornando ${communities.length} comunidades activas`);
    
    // Formatear respuesta
    const formattedCommunities = communities.map(community => {
      const formattedCommunity = community.toObject();
      if (formattedCommunity.coverImage && !formattedCommunity.coverImage.startsWith('http')) {
        formattedCommunity.coverImage = `${process.env.BASE_URL}/${formattedCommunity.coverImage.replace(/^\//, '')}`;
      }
      return formattedCommunity;
    });
    
    res.json(formattedCommunities);
  } catch (error) {
    console.error('❌ Error al obtener comunidades suscritas:', error);
    res.status(500).json({ error: 'Error al obtener comunidades suscritas' });
  }
});

// 📌 Unirse a una comunidad (suscripción gratuita)
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.userId;
    
    console.log('📩 Solicitud de suscripción recibida para comunidad:', communityId);
    console.log('👤 Usuario autenticado:', userId);
    
    // Verificar si la comunidad existe
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }
    
    // Verificar si ya existe una suscripción
    const existing = await Subscription.findOne({
      user: userId,
      community: communityId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({ message: 'Ya estás suscrito a esta comunidad' });
    }

    // Crear nueva suscripción
    const subscription = new Subscription({
      user: userId,
      community: communityId,
      startDate: new Date(),
      paymentMethod: 'manual',
      amount: 0,
      status: 'active',
    });

    await subscription.save();

    // Añadir usuario como miembro de la comunidad
    if (!community.members.includes(userId)) {
      community.members.push(userId);
      await community.save();
      await makeAllies(userId, community._id);
    }

    res.status(201).json({
      message: 'Te has unido exitosamente a la comunidad',
      subscription
    });
  } catch (error) {
    console.error('❌ Error al unirse a la comunidad:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// 📌 Verificar suscripción a una comunidad específica
router.get('/check/:communityId', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.userId;
    
    const subscription = await Subscription.findOne({
      user: userId,
      community: communityId,
      status: 'active'
    });
    
    res.json({
      isSubscribed: !!subscription,
      subscription: subscription
    });
  } catch (error) {
    console.error('❌ Error al verificar suscripción:', error);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
});

// 📌 Ruta de diagnóstico para verificar suscripciones
router.get('/debug-subscriptions', verifyToken, async (req, res) => {
  try {
    // Obtener suscripciones con toda la información
    const subscriptions = await Subscription.find({ user: req.userId })
      .populate('community')
      .populate('user', 'name email');
    
    // Información detallada para cada suscripción
    const detailedInfo = subscriptions.map(sub => ({
      subscriptionId: sub._id,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      paymentMethod: sub.paymentMethod,
      user: sub.user ? {
        id: sub.user._id,
        name: sub.user.name,
        email: sub.user.email
      } : 'Usuario no encontrado',
      community: sub.community ? {
        id: sub.community._id,
        name: sub.community.name,
        coverImage: sub.community.coverImage,
        memberCount: sub.community.members?.length || 0
      } : 'Comunidad no encontrada',
    }));
    
    res.json({
      userId: req.userId,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      subscriptions: detailedInfo
    });
    
  } catch (error) {
    console.error('❌ Error en diagnóstico de suscripciones:', error);
    res.status(500).json({ error: 'Error en diagnóstico de suscripciones' });
  }
});

// 📌 Obtener suscriptores de una comunidad específica
router.get('/community/:communityId/subscribers', async (req, res) => {
  try {
    const { communityId } = req.params;

    // Validar communityId
    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({ error: 'ID de comunidad inválido.' });
    }

    // Obtener todas las suscripciones activas para esta comunidad
    const subscriptions = await Subscription.find({
      community: communityId,
      status: 'active'
    }).populate('user', 'name profilePicture');

    // Formatear la respuesta
    const subscribers = subscriptions.map(sub => ({
      _id: sub._id,
      user: sub.user,
      createdAt: sub.startDate,
      paymentMethod: sub.paymentMethod
    }));

    res.json(subscribers);
  } catch (error) {
    console.error('❌ Error al obtener suscriptores:', error);
    res.status(500).json({ error: 'Error al obtener suscriptores' });
  }
});

// 📌 Endpoint de diagnóstico para verificar suscripciones
router.get('/diagnostic', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Diagnóstico de suscripciones para usuario:', req.userId);
    
    // Obtener todas las suscripciones del usuario
    const allSubscriptions = await Subscription.find({ user: req.userId });
    const activeSubscriptions = await Subscription.find({ 
      user: req.userId, 
      status: 'active' 
    });
    
    // Obtener información del usuario
    const user = await User.findById(req.userId);
    
    // Obtener todas las comunidades
    const allCommunities = await Community.find({});
    
    const diagnostic = {
      userId: req.userId,
      userInfo: user ? { name: user.name, email: user.email } : 'No encontrado',
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      totalCommunities: allCommunities.length,
      subscriptions: allSubscriptions.map(sub => ({
        id: sub._id,
        communityId: sub.community,
        status: sub.status,
        startDate: sub.startDate,
        amount: sub.amount
      }))
    };
    
    console.log('📊 Diagnóstico:', diagnostic);
    res.json(diagnostic);
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({ error: 'Error en diagnóstico' });
  }
});

module.exports = router; 