const stripe = require('../config/stripe');
const stripePrices = require('../config/stripePrices');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

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
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { priceId, communityId } = req.body;
    const userId = req.userId;
    if (!priceId || !communityId) {
      return res.status(400).json({ error: 'Faltan datos para crear la sesión.' });
    }
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: 'Comunidad no encontrada.' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, communityId },
      success_url: process.env.FRONTEND_URL + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.FRONTEND_URL + '/cancel',
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creando sesión de checkout:', error);
    res.status(500).json({ error: 'Error creando sesión de checkout' });
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
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Manejar evento de suscripción completada
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, communityId } = session.metadata;
      // Registrar suscripción activa
      try {
        const existing = await Subscription.findOne({ user: userId, community: communityId, status: 'active' });
        if (!existing) {
          await Subscription.create({
            user: userId,
            community: communityId,
            status: 'active',
            startDate: new Date(),
            paymentMethod: 'stripe',
            amount: session.amount_total ? session.amount_total / 100 : 0,
          });
          // Agregar usuario como miembro
          const community = await Community.findById(communityId);
          if (community && !community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
          }
        }
      } catch (err) {
        console.error('Error registrando suscripción:', err);
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Error en webhook de Stripe:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}; 