const stripe = require('../config/stripe');
const stripePrices = require('../config/stripePrices');
const stripeConnect = require('../config/stripeConnect');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Payout = require('../models/Payout');
const { makeAllies } = require('../routes/communitiesRoutes');
const { notificationHelpers } = require('./notificationController');
const PriceValidationService = require('../services/priceValidationService');

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

    console.log('💰 Creando producto y precio en Stripe:', {
      communityName,
      price,
      priceInCents: Math.round(price * 100),
      priceInDollars: (Math.round(price * 100) / 100).toFixed(2)
    });

    // Crear Product
    const product = await stripe.products.create({
      name: communityName,
    });

    console.log('✅ Producto creado en Stripe:', product.id);

    // Crear Price - CORREGIR: usar Math.floor para evitar redondeo incorrecto
    const priceInCents = Math.floor(price * 100);
    const stripePrice = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
    });

    console.log('✅ Precio creado en Stripe:', {
      priceId: stripePrice.id,
      unitAmount: stripePrice.unit_amount,
      unitAmountInDollars: (stripePrice.unit_amount / 100).toFixed(2)
    });

    res.json({ 
      stripeProductId: product.id, 
      stripePriceId: stripePrice.id,
      priceInCents,
      priceInDollars: (priceInCents / 100).toFixed(2)
    });
  } catch (error) {
    console.error('❌ Error creando producto/price en Stripe:', error);
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
    const userId = req.userId; // Firebase UID para logging
    const mongoUserId = req.mongoUserId; // MongoDB ID para base de datos
    
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
    
    console.log('👤 Buscando usuario:', mongoUserId);
    
    if (!mongoUserId) {
      console.error('❌ MongoDB ID no disponible');
      return res.status(400).json({ error: 'Error de autenticación' });
    }
    
    const user = await User.findById(mongoUserId);
    if (!user) {
      console.error('❌ Usuario no encontrado:', mongoUserId);
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    console.log('✅ Datos validados, validando priceId...');
    console.log('💰 PriceId recibido:', priceId);
    
    // 🔍 VALIDAR QUE EL PRECIO EXISTA EN STRIPE
    const priceValidation = await PriceValidationService.validatePriceId(priceId);
    if (!priceValidation.isValid) {
      console.error('❌ PriceId inválido:', priceValidation.error);
      
      // Intentar encontrar un precio válido para esta comunidad
      if (community.price > 0) {
        console.log('🔄 Buscando precio válido para monto:', community.price);
        const validPrice = await PriceValidationService.findValidPriceForAmount(community.price);
        
        if (validPrice) {
          console.log('✅ Precio válido encontrado:', validPrice.priceId);
          
          // Actualizar la comunidad con el precio válido
          community.stripePriceId = validPrice.priceId;
          await community.save();
          
          // Usar el precio válido
          priceId = validPrice.priceId;
          console.log('🔄 Usando precio válido actualizado:', priceId);
        } else {
          console.error('❌ No se pudo encontrar un precio válido para:', community.price);
          return res.status(400).json({ 
            error: 'Precio de suscripción no válido',
            details: 'El precio configurado para esta comunidad no es válido en Stripe'
          });
        }
      } else {
        return res.status(400).json({ 
          error: 'Precio de suscripción no válido',
          details: priceValidation.error
        });
      }
    } else {
      console.log('✅ PriceId válido confirmado:', priceId);
    }
    
    console.log('📧 Email del usuario:', user.email);
    console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
    
    // Determinar la URL del frontend basada en el origen de la request
    const origin = req.headers.origin || req.headers.referer;
    let frontendUrl = process.env.FRONTEND_URL || 'https://www.hoodfy.com';
    
    if (origin && origin.includes('hoodfy.com')) {
      frontendUrl = 'https://www.hoodfy.com';
    }
    
    // Configuración de la sesión de checkout
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: mongoUserId.toString(), communityId: communityId.toString() },
      success_url: frontendUrl + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: frontendUrl + '/cancel',
    };

    // Si el creador tiene Stripe Connect configurado, agregar split payments
    if (user.stripeConnectAccountId && user.stripeConnectStatus === 'active') {
      // Calcular el split de pagos (88% creador, 12% plataforma)
      const paymentSplit = stripeConnect.calculatePaymentSplit(community.price);
      
      sessionConfig.subscription_data = {
        application_fee_percent: 12, // 12% para la plataforma
        transfer_data: {
          destination: user.stripeConnectAccountId, // Usar la cuenta del creador
        },
      };
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
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
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const sig = req.headers['stripe-signature'];
    let event;
    
    // Determinar qué webhook secret usar basándose en el dominio
    const host = req.headers.host || req.headers['x-forwarded-host'];
    let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Default para qahood.com
    
    if (host && host.includes('hoodfy.com')) {
      webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_HOODFY;
    }
    
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Error de verificación de webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Manejar diferentes tipos de eventos de Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook de Stripe:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

// Crear sesión del Portal de Cliente
exports.createPortalSession = async (req, res) => {
  try {
    console.log('🌐 Iniciando createPortalSession...');
    console.log('👤 Usuario ID:', req.userId);
    
    if (!stripe) {
      console.error('❌ Stripe no está configurado');
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const userId = req.userId; // Firebase UID para logging
    const mongoUserId = req.mongoUserId; // MongoDB ID para base de datos
    const { subscriptionId } = req.body; // Nuevo: subscriptionId específico opcional
    
    if (!mongoUserId) {
      console.error('❌ MongoDB ID no disponible');
      return res.status(400).json({ error: 'Error de autenticación' });
    }
    
    // Buscar usuario
    const user = await User.findById(mongoUserId);
    if (!user) {
      console.error('❌ Usuario no encontrado:', mongoUserId);
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    
    let subscription;
    
    if (subscriptionId) {
      // Buscar suscripción específica del usuario
      console.log('🎯 Buscando suscripción específica:', subscriptionId);
      subscription = await Subscription.findOne({
        _id: subscriptionId,
        user: mongoUserId,
        stripeCustomerId: { $exists: true, $ne: null }
      });
      
      if (!subscription) {
        console.log('❌ Suscripción específica no encontrada o sin customer ID');
        return res.status(400).json({ 
          error: 'Suscripción no encontrada o no válida',
          details: 'La suscripción especificada no existe o no puede ser gestionada'
        });
      }
    } else {
      // Buscar la suscripción más reciente (comportamiento original)
      console.log('🔍 Buscando suscripción más reciente del usuario...');
      subscription = await Subscription.findOne({
        user: mongoUserId,
        stripeCustomerId: { $exists: true, $ne: null }
      }).sort({ createdAt: -1 }); // Más reciente primero
      
      if (!subscription || !subscription.stripeCustomerId) {
        console.log('❌ Usuario no tiene suscripciones con customer ID de Stripe');
        return res.status(400).json({ 
          error: 'No tienes suscripciones activas para gestionar',
          details: 'Debes tener al menos una suscripción para acceder al portal de gestión'
        });
      }
    }
    
    console.log('✅ Customer ID encontrado:', subscription.stripeCustomerId);
    console.log('📋 Suscripción seleccionada:', subscription._id);
    
    // Determinar la URL de retorno basada en el origen
    const origin = req.headers.origin || req.headers.referer;
    let returnUrl = process.env.FRONTEND_URL || 'https://www.hoodfy.com';
    
    if (origin && origin.includes('hoodfy.com')) {
      returnUrl = 'https://www.hoodfy.com';
    }
    
    console.log('🌐 URL de retorno detectada:', returnUrl);
    
    // Crear sesión del portal usando customer ID
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl + '/subscriptions',
    });
    
    console.log('✅ Sesión del portal creada exitosamente');
    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creando sesión del portal:', error);
    res.status(500).json({ 
      error: 'Error creando sesión del portal', 
      details: error.message 
    });
  }
};

// Función para manejar checkout completado
async function handleCheckoutCompleted(session) {
      const { userId, communityId } = session.metadata;
      
      console.log('💳 Checkout completado:', {
        sessionId: session.id,
        userId,
        communityId,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status
      });
      
      // Verificar que tenemos los datos necesarios
      if (!userId || !communityId) {
        console.error('❌ Faltan datos en metadata:', { userId, communityId });
    return;
      }
      
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
            stripeSubscriptionId: session.subscription || null,
            stripeCustomerId: session.customer || null,
          });
          
          console.log('✅ Suscripción creada:', newSubscription._id);
          
          // Si el creador tiene Stripe Connect activo, crear registro de Payout
          if (user.stripeConnectAccountId && user.stripeConnectStatus === 'active') {
            try {
              const paymentSplit = stripeConnect.calculatePaymentSplit(community.price);
              
              const payout = await Payout.create({
                creator: community.creator,
                community: communityId,
                subscription: newSubscription._id,
                stripeConnectAccountId: user.stripeConnectAccountId,
                paymentDetails: {
                  totalAmount: paymentSplit.total,
                  platformFee: paymentSplit.platformFee,
                  creatorAmount: paymentSplit.creatorAmount,
                  platformFeePercentage: 12, // 12% para la plataforma
                  creatorFeePercentage: 88   // 88% para el creador
                },
                status: 'pending',
                metadata: {
                  stripeInvoiceId: session.invoice || null,
                  stripeSubscriptionId: session.subscription || null,
                  stripeCustomerId: session.customer || null,
                  currency: 'usd',
                  description: `Suscripción a ${community.name}`
                }
              });
              
              console.log('✅ Registro de Payout creado:', payout._id);
            } catch (payoutError) {
              console.error('❌ Error creando registro de Payout:', payoutError);
            }
          }
      
      // Crear notificación de suscripción exitosa
      try {
        await notificationHelpers.createSubscriptionSuccessNotification(
          userId, 
          communityId, 
          newSubscription._id
        );
        console.log('✅ Notificación de suscripción exitosa creada');
      } catch (notificationError) {
        console.error('❌ Error creando notificación de suscripción:', notificationError);
      }
          
          // Agregar usuario como miembro si no lo es ya
          if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
            console.log('✅ Usuario agregado como miembro de la comunidad');
            
            // Crear relaciones de aliados - IMPORTANTE!
            try {
              await makeAllies(userId, communityId);
              console.log('✅ Relaciones de aliados creadas');
            } catch (allyError) {
              console.error('❌ Error creando aliados:', allyError);
            }
          } else {
            console.log('ℹ️ Usuario ya era miembro de la comunidad');
          }
        } else {
          console.log('ℹ️ Suscripción ya existe:', existing._id);
        }
      } catch (err) {
        console.error('❌ Error registrando suscripción:', err);
  }
}

// Función para manejar actualización de suscripción
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Suscripción actualizada:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end
  });
  
  try {
    // Buscar la suscripción en la BD
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });
    
    if (dbSubscription) {
      // Actualizar estado y fechas
      const oldStatus = dbSubscription.status;
      dbSubscription.status = subscription.status;
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      dbSubscription.updatedAt = new Date();
      
      await dbSubscription.save();
      
      console.log('✅ Suscripción actualizada en BD:', {
        id: dbSubscription._id,
        oldStatus,
        newStatus: subscription.status
      });
      
      // Si la suscripción se reactivó después de estar pausada
      if (oldStatus === 'paused' && subscription.status === 'active') {
        // Agregar usuario de vuelta a la comunidad si no está
        const community = await Community.findById(dbSubscription.community);
        if (community && !community.members.includes(dbSubscription.user)) {
          community.members.push(dbSubscription.user);
          await community.save();
          console.log('✅ Usuario agregado de vuelta a la comunidad');
        }
      }
      
      // Si la suscripción se pausó
      if (subscription.status === 'paused') {
        // Remover usuario de la comunidad temporalmente
        const community = await Community.findById(dbSubscription.community);
        if (community) {
          community.members = community.members.filter(
            memberId => memberId.toString() !== dbSubscription.user.toString()
          );
          await community.save();
          console.log('⏸️ Usuario removido temporalmente de la comunidad (suscripción pausada)');
        }
      }
    } else {
      console.log('⚠️ Suscripción no encontrada en BD:', subscription.id);
    }
  } catch (error) {
    console.error('❌ Error actualizando suscripción:', error);
  }
}

// Función para manejar cancelación de suscripción
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Suscripción cancelada:', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer
  });
  
  try {
    // Buscar la suscripción en tu base de datos
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
      status: 'active'
    });
    
    if (dbSubscription) {
      // Actualizar estado de la suscripción
      dbSubscription.status = 'canceled';
      dbSubscription.endDate = new Date();
      await dbSubscription.save();
      
      console.log('✅ Suscripción actualizada en BD:', dbSubscription._id);
      
      // Crear notificación de suscripción cancelada
      try {
        await notificationHelpers.createSubscriptionCanceledNotification(
          dbSubscription.user,
          dbSubscription.community,
          dbSubscription._id
        );
        console.log('✅ Notificación de suscripción cancelada creada');
      } catch (notificationError) {
        console.error('❌ Error creando notificación de cancelación:', notificationError);
      }
      
      // Remover usuario de la comunidad
      const community = await Community.findById(dbSubscription.community);
      if (community) {
        community.members = community.members.filter(
          memberId => memberId.toString() !== dbSubscription.user.toString()
        );
        await community.save();
        console.log('✅ Usuario removido de la comunidad');
      }
    } else {
      console.log('⚠️ Suscripción no encontrada en BD:', subscription.id);
    }
  } catch (error) {
    console.error('❌ Error manejando cancelación de suscripción:', error);
  }
}

// Función para manejar pago fallido
async function handlePaymentFailed(invoice) {
  console.log('💸 Pago fallido:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amountDue: invoice.amount_due
  });
  
  try {
    // Buscar la suscripción en la BD
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });
    
    if (subscription) {
      // Marcar la suscripción como con pago pendiente
      subscription.status = 'payment_failed';
      subscription.lastPaymentAttempt = new Date();
      await subscription.save();
      
      console.log('⚠️ Suscripción marcada como pago fallido:', subscription._id);
      
      // Crear notificación de pago fallido
      try {
        await notificationHelpers.createPaymentFailedNotification(
          subscription.user,
          subscription.community,
          subscription._id
        );
        console.log('✅ Notificación de pago fallido creada');
      } catch (notificationError) {
        console.error('❌ Error creando notificación de pago fallido:', notificationError);
      }
    }
  } catch (error) {
    console.error('❌ Error manejando pago fallido:', error);
  }
}

// Función para manejar pago exitoso
async function handlePaymentSucceeded(invoice) {
  console.log('✅ Pago exitoso:', {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    amountPaid: invoice.amount_paid
  });
  
  try {
    // Buscar la suscripción en la BD
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });
    
    if (subscription) {
      // Si estaba marcada como pago fallido, reactivarla
      if (subscription.status === 'payment_failed') {
        subscription.status = 'active';
        subscription.lastPaymentAttempt = new Date();
        await subscription.save();
        
        console.log('🔄 Suscripción reactivada después de pago exitoso:', subscription._id);
        
        // Crear notificación de pago exitoso
        try {
          await notificationHelpers.createPaymentSuccessNotification(
            subscription.user,
            subscription.community,
            subscription._id,
            invoice.amount_paid / 100 // Convertir de centavos a dólares
          );
          console.log('✅ Notificación de pago exitoso creada');
        } catch (notificationError) {
          console.error('❌ Error creando notificación de pago exitoso:', notificationError);
        }
        
        // Asegurar que el usuario esté en la comunidad
        const community = await Community.findById(subscription.community);
        if (community && !community.members.includes(subscription.user)) {
          community.members.push(subscription.user);
          await community.save();
          console.log('✅ Usuario re-agregado a la comunidad');
        }
      } else {
        console.log('ℹ️ Suscripción ya estaba activa:', subscription._id);
        
        // Crear notificación de pago exitoso incluso si ya estaba activa
        try {
          await notificationHelpers.createPaymentSuccessNotification(
            subscription.user,
            subscription.community,
            subscription._id,
            invoice.amount_paid / 100 // Convertir de centavos a dólares
          );
          console.log('✅ Notificación de pago exitoso creada');
        } catch (notificationError) {
          console.error('❌ Error creando notificación de pago exitoso:', notificationError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error manejando pago exitoso:', error);
  }
} 