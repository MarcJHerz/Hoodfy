const stripe = require('../config/stripe');
const stripePrices = require('../config/stripePrices');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { makeAllies } = require('../routes/communitiesRoutes');

// Crear Price y Product en Stripe para precio personalizado
exports.createStripeProductAndPrice = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { communityName, price } = req.body;
    if (!communityName || typeof price !== 'number' || price < 1) {
      return res.status(400).json({ error: 'Nombre y precio válido requerido (mínimo 1 USD).' });
    }
    // Crear Product
    const product = await stripe.products.create({
      name: communityName,
    });
    // Crear Price
    const stripePrice = await stripe.prices.create({
      unit_amount: Math.round(price * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
    });
    res.json({ stripeProductId: product.id, stripePriceId: stripePrice.id });
  } catch (error) {
    console.error('Error creando producto/price en Stripe:', error);
    res.status(500).json({ error: 'Error creando producto/price en Stripe' });
  }
};

// Crear sesión de Checkout
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('🛒 Iniciando createCheckoutSession...');
    console.log('📋 Body recibido:', req.body);
    console.log('👤 Usuario ID:', req.userId);
    
    if (!stripe) {
      console.error('❌ Stripe no está configurado');
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { priceId, communityId } = req.body;
    const userId = req.userId;
    
    console.log('🔍 Validando datos:', { priceId, communityId, userId });
    
    if (!priceId || !communityId) {
      console.error('❌ Faltan datos:', { priceId, communityId });
      return res.status(400).json({ error: 'Faltan datos para crear la sesión.' });
    }
    
    console.log('🏘️ Buscando comunidad:', communityId);
    const community = await Community.findById(communityId);
    if (!community) {
      console.error('❌ Comunidad no encontrada:', communityId);
      return res.status(404).json({ error: 'Comunidad no encontrada.' });
    }
    
    console.log('👤 Buscando usuario:', userId);
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Usuario no encontrado:', userId);
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    console.log('✅ Datos validados, creando sesión con Stripe...');
    console.log('💰 PriceId:', priceId);
    console.log('📧 Email del usuario:', user.email);
    console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: userId.toString(), communityId: communityId.toString() },
      success_url: (process.env.FRONTEND_URL || 'https://www.qahood.com') + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (process.env.FRONTEND_URL || 'https://www.qahood.com') + '/cancel',
    });
    
    console.log('✅ Sesión creada exitosamente:', session.url);
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error detallado creando sesión de checkout:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Error creando sesión de checkout', 
      details: error.message 
    });
  }
};

// Webhook de Stripe
exports.stripeWebhook = async (req, res) => {
  try {
    console.log('📨 Webhook recibido de Stripe');
    
    if (!stripe) {
      console.error('❌ Stripe no está configurado en webhook');
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('✅ Webhook verificado exitosamente');
    } catch (err) {
      console.error('❌ Error de verificación de webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log('🔍 Tipo de evento:', event.type);
    console.log('📋 Datos del evento:', event.data.object);
    
    // Manejar evento de suscripción completada
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, communityId } = session.metadata;
      
      console.log('💳 Checkout completado:', {
        sessionId: session.id,
        userId,
        communityId,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status
      });
      
      // Registrar suscripción activa
      try {
        // Validar que los IDs sean válidos
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(communityId)) {
          console.error('❌ IDs inválidos:', { userId, communityId });
          return;
        }
        
        // Verificar que la comunidad existe
        const community = await Community.findById(communityId);
        if (!community) {
          console.error('❌ Comunidad no encontrada:', communityId);
          return;
        }
        
        // Verificar que no exista una suscripción duplicada
        const existing = await Subscription.findOne({ 
          user: userId, 
          community: communityId, 
          status: 'active' 
        });
        
        if (!existing) {
          console.log('🆕 Creando nueva suscripción...');
          
          const newSubscription = await Subscription.create({
            user: userId,
            community: communityId,
            status: 'active',
            startDate: new Date(),
            paymentMethod: 'stripe',
            amount: session.amount_total ? session.amount_total / 100 : 0,
          });
          
          console.log('✅ Suscripción creada:', newSubscription._id);
          
          // Agregar usuario como miembro si no lo es ya
          if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
            console.log('✅ Usuario agregado como miembro de la comunidad');
            
            // Crear relaciones de aliados - IMPORTANTE!
            await makeAllies(userId, communityId);
            console.log('✅ Relaciones de aliados creadas');
          } else {
            console.log('ℹ️ Usuario ya era miembro de la comunidad');
          }
        } else {
          console.log('ℹ️ Suscripción ya existe:', existing._id);
        }
      } catch (err) {
        console.error('❌ Error registrando suscripción:', err);
      }
    } else {
      console.log('ℹ️ Evento no es checkout.session.completed, ignorando');
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error en webhook de Stripe:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}; 