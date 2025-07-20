const Stripe = require('stripe');

let stripe = null;

console.log('🔍 Verificando configuración de Stripe...');
console.log('📋 Variables de entorno disponibles:', {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Presente (sk_...)' : 'No encontrada',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Presente (whsec_...)' : 'No encontrada',
  STRIPE_WEBHOOK_SECRET_HOODFY: process.env.STRIPE_WEBHOOK_SECRET_HOODFY ? 'Presente (whsec_...)' : 'No encontrada',
  FRONTEND_URL: process.env.FRONTEND_URL || 'No definida',
  FRONTEND_URL_HOODFY: process.env.FRONTEND_URL_HOODFY || 'No definida',
  NODE_ENV: process.env.NODE_ENV || 'No definida'
});

if (process.env.STRIPE_SECRET_KEY) {
  try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });
    console.log('✅ Stripe inicializado correctamente');
    console.log('🌐 Webhooks configurados:');
    console.log('   - Qahood.com: ' + (process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌'));
    console.log('   - Hoodfy.com: ' + (process.env.STRIPE_WEBHOOK_SECRET_HOODFY ? '✅' : '❌'));
  } catch (error) {
    console.error('❌ Error al inicializar Stripe:', error.message);
  }
} else {
  console.error('❌ Stripe no inicializado: STRIPE_SECRET_KEY no encontrada');
}

module.exports = stripe; 