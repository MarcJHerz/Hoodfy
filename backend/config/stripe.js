const Stripe = require('stripe');

let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });
} else {
  console.log('⚠️ Stripe no inicializado: STRIPE_SECRET_KEY no encontrada');
}

module.exports = stripe; 