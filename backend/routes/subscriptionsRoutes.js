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
    const userId = req.mongoUserId;

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
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
});

// 📌 Cancelar suscripción
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { subscriptionId, communityId } = req.body;
    const userId = req.mongoUserId;

    let subscription;
    
    if (communityId) {
      // Buscar por communityId
      subscription = await Subscription.findOne({ 
        community: communityId, 
        user: userId, 
        status: 'active' 
      });
    } else if (subscriptionId) {
      // Buscar por subscriptionId (mantener compatibilidad)
      subscription = await Subscription.findOne({ 
        _id: subscriptionId, 
        user: userId, 
        status: 'active' 
      });
    }
    
    if (!subscription) {
      return res.status(404).json({ error: 'No tienes una suscripción activa para esta comunidad.' });
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
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

// 📌 Obtener suscripciones del usuario (todas, activas e inactivas)
router.get('/my-subscriptions', verifyToken, async (req, res) => {
  try {
    // 🔧 CRÍTICO: Usar mongoUserId para consultas MongoDB
    // Verificar que el usuario existe
    const user = await User.findById(req.mongoUserId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const subscriptions = await Subscription.find({ 
      user: req.mongoUserId
      // Removed status filter to show all subscriptions (active, canceled, etc.)
    }).populate('community', 'name description coverImage members creator');

    // Filtramos suscripciones sin comunidad (por si acaso alguna está corrupta)
    const filtered = subscriptions.filter(sub => sub.community !== null);
    
    res.json(filtered);
  } catch (err) {
    console.error('Error en /my-subscriptions:', err);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// 📌 Obtener solamente comunidades activas (suscripciones activas)
router.get('/by-user', verifyToken, async (req, res) => {
  try {
    // Obtener todas las suscripciones activas
    const subscriptions = await Subscription.find({
      user: req.mongoUserId,
      status: 'active'
    });
    
    // Extraer solo los IDs de comunidades
    const communityIds = subscriptions
      .filter(sub => sub.community) // Filtrar casos donde community es null
      .map(sub => sub.community.toString());
    
    if (communityIds.length === 0) {
      return res.json([]);
    }
    
    // Buscar las comunidades completas
    const communities = await Community.find({
      _id: { $in: communityIds }
    });
    
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
    res.status(500).json({ error: 'Error al obtener comunidades suscritas' });
  }
});

// 📌 Unirse a una comunidad (suscripción gratuita)
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const communityId = req.params.id;
    const userId = req.mongoUserId;
    
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

    // Agregar automáticamente al chat de la comunidad si existe
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });

      // Buscar si existe un chat para esta comunidad
      const chatResult = await pool.query(`
        SELECT id FROM chats 
        WHERE community_id = $1 AND type = 'community' AND is_active = true
        LIMIT 1
      `, [communityId]);

      if (chatResult.rows.length > 0) {
        const chatId = chatResult.rows[0].id;
        const userFirebaseUid = user.firebaseUid;

        // Agregar como participante del chat
        await pool.query(`
          INSERT INTO chat_participants (chat_id, user_id, role)
          VALUES ($1, $2, 'member')
          ON CONFLICT (chat_id, user_id) 
          DO UPDATE SET role = 'member', joined_at = CURRENT_TIMESTAMP
        `, [chatId, userFirebaseUid]);

        console.log(`✅ Usuario ${userFirebaseUid} agregado al chat ${chatId} de la comunidad ${communityId}`);
      }
      
      pool.end();
    } catch (chatError) {
      console.error('❌ Error agregando usuario al chat de comunidad:', chatError);
      // No fallar la suscripción por esto
    }

    res.status(201).json({
      message: 'Te has unido exitosamente a la comunidad',
      subscription
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// 📌 Verificar suscripción a una comunidad específica
router.get('/check/:communityId', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.mongoUserId;
    
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
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
});

// 📌 Ruta de diagnóstico para verificar suscripciones
router.get('/debug-subscriptions', verifyToken, async (req, res) => {
  try {
    // Obtener suscripciones con toda la información
    const subscriptions = await Subscription.find({ user: req.mongoUserId })
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
      userId: req.mongoUserId,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      subscriptions: detailedInfo
    });
    
  } catch (error) {
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
    res.status(500).json({ error: 'Error al obtener suscriptores' });
  }
});

// 📌 Endpoint de diagnóstico para verificar suscripciones
router.get('/diagnostic', verifyToken, async (req, res) => {
  try {
    // Obtener todas las suscripciones del usuario
    const allSubscriptions = await Subscription.find({ user: req.mongoUserId });
    const activeSubscriptions = await Subscription.find({ 
      user: req.mongoUserId, 
      status: 'active' 
    });
    
    // Obtener información del usuario
    const user = await User.findById(req.mongoUserId);
    
    // Obtener todas las comunidades
    const allCommunities = await Community.find({});
    
    const diagnostic = {
      userId: req.mongoUserId,
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
    
    res.json(diagnostic);
  } catch (error) {
    res.status(500).json({ error: 'Error en diagnóstico' });
  }
});

module.exports = router; 