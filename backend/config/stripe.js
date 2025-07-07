const Stripe = require('stripe');

// Solo inicializar Stripe si existe la variable de entorno
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });
}

module.exports = stripe; 