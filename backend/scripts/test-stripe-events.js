const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
require('dotenv').config();

// Simular eventos de Stripe
const mockStripeEvents = {
  checkoutSessionCompleted: {
    id: 'cs_test_123',
    subscription: 'sub_test_123',
    customer: 'cus_test_123',
    amount_total: 1000, // $10.00
    payment_status: 'paid',
    metadata: {
      userId: '507f1f77bcf86cd799439011', // MongoDB ObjectId de ejemplo
      communityId: '507f1f77bcf86cd799439012'
    }
  },
  
  subscriptionUpdated: {
    id: 'sub_test_123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 días
  },
  
  subscriptionDeleted: {
    id: 'sub_test_123',
    status: 'canceled',
    customer: 'cus_test_123'
  },
  
  paymentFailed: {
    id: 'in_test_123',
    subscription: 'sub_test_123',
    amount_due: 1000
  },
  
  paymentSucceeded: {
    id: 'in_test_124',
    subscription: 'sub_test_123',
    amount_paid: 1000
  }
};

async function testStripeEvents() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Importar las funciones de manejo de eventos
    const { 
      handleCheckoutCompleted, 
      handleSubscriptionUpdated, 
      handleSubscriptionDeleted, 
      handlePaymentFailed, 
      handlePaymentSucceeded 
    } = require('../controllers/stripeController');

    console.log('\n🧪 Probando eventos de Stripe...\n');

    // 1. Simular checkout completado
    console.log('1️⃣ Probando checkout completado...');
    try {
      await handleCheckoutCompleted(mockStripeEvents.checkoutSessionCompleted);
      console.log('✅ Checkout completado procesado');
    } catch (error) {
      console.error('❌ Error en checkout completado:', error.message);
    }

    // 2. Simular actualización de suscripción
    console.log('\n2️⃣ Probando actualización de suscripción...');
    try {
      await handleSubscriptionUpdated(mockStripeEvents.subscriptionUpdated);
      console.log('✅ Actualización de suscripción procesada');
    } catch (error) {
      console.error('❌ Error en actualización de suscripción:', error.message);
    }

    // 3. Simular pago exitoso
    console.log('\n3️⃣ Probando pago exitoso...');
    try {
      await handlePaymentSucceeded(mockStripeEvents.paymentSucceeded);
      console.log('✅ Pago exitoso procesado');
    } catch (error) {
      console.error('❌ Error en pago exitoso:', error.message);
    }

    // 4. Simular pago fallido
    console.log('\n4️⃣ Probando pago fallido...');
    try {
      await handlePaymentFailed(mockStripeEvents.paymentFailed);
      console.log('✅ Pago fallido procesado');
    } catch (error) {
      console.error('❌ Error en pago fallido:', error.message);
    }

    // 5. Simular cancelación de suscripción
    console.log('\n5️⃣ Probando cancelación de suscripción...');
    try {
      await handleSubscriptionDeleted(mockStripeEvents.subscriptionDeleted);
      console.log('✅ Cancelación de suscripción procesada');
    } catch (error) {
      console.error('❌ Error en cancelación de suscripción:', error.message);
    }

    console.log('\n✅ Pruebas de eventos completadas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testStripeEvents();
