const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { createPortalSession } = require('../controllers/stripeController');
require('dotenv').config();

// Mock request object para simular una petición
function createMockRequest(userId, subscriptionId = null) {
  return {
    userId: 'firebase-uid-' + userId, // Firebase UID simulado
    mongoUserId: userId, // MongoDB ObjectId
    body: subscriptionId ? { subscriptionId } : {},
    headers: {
      origin: 'https://www.hoodfy.com'
    }
  };
}

// Mock response object para capturar la respuesta
function createMockResponse() {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.data = data;
      return res;
    }
  };
  return res;
}

async function testPortalSession() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🧪 Probando Portal de Cliente (Handle Subscription)...\n');

    // 1. Buscar usuarios con suscripciones que tengan Customer ID
    console.log('1️⃣ Buscando usuarios con suscripciones válidas...');
    const subscriptionsWithCustomer = await Subscription.find({
      stripeCustomerId: { $exists: true, $ne: null }
    }).populate('user', 'name email').populate('community', 'name');
    
    console.log(`📊 Suscripciones con Customer ID: ${subscriptionsWithCustomer.length}`);
    
    if (subscriptionsWithCustomer.length === 0) {
      console.log('❌ No hay suscripciones con Customer ID para probar');
      return;
    }

    // 2. Probar Portal de Cliente con diferentes usuarios
    console.log('\n2️⃣ Probando Portal de Cliente...');
    
    for (let i = 0; i < Math.min(3, subscriptionsWithCustomer.length); i++) {
      const subscription = subscriptionsWithCustomer[i];
      const user = subscription.user;
      
      console.log(`\n🔍 Probando con usuario: ${user.name} (${user.email})`);
      console.log(`   Suscripción: ${subscription.community.name} ($${subscription.amount})`);
      console.log(`   Customer ID: ${subscription.stripeCustomerId}`);
      
      try {
        // Crear mock request y response
        const mockReq = createMockRequest(user._id, subscription._id);
        const mockRes = createMockResponse();
        
        // Llamar a la función createPortalSession
        await createPortalSession(mockReq, mockRes);
        
        if (mockRes.statusCode === 200) {
          console.log('✅ Portal de Cliente creado exitosamente');
          console.log(`   URL: ${mockRes.data.url}`);
        } else {
          console.log('❌ Error creando Portal de Cliente');
          console.log(`   Status: ${mockRes.statusCode}`);
          console.log(`   Error: ${JSON.stringify(mockRes.data)}`);
        }
      } catch (error) {
        console.log('❌ Excepción en Portal de Cliente');
        console.log(`   Error: ${error.message}`);
      }
    }

    // 3. Probar sin subscriptionId específico (comportamiento por defecto)
    console.log('\n3️⃣ Probando Portal de Cliente sin subscriptionId específico...');
    
    const firstUser = subscriptionsWithCustomer[0].user;
    console.log(`🔍 Probando con usuario: ${firstUser.name}`);
    
    try {
      const mockReq = createMockRequest(firstUser._id); // Sin subscriptionId
      const mockRes = createMockResponse();
      
      await createPortalSession(mockReq, mockRes);
      
      if (mockRes.statusCode === 200) {
        console.log('✅ Portal de Cliente (por defecto) creado exitosamente');
        console.log(`   URL: ${mockRes.data.url}`);
      } else {
        console.log('❌ Error creando Portal de Cliente (por defecto)');
        console.log(`   Status: ${mockRes.statusCode}`);
        console.log(`   Error: ${JSON.stringify(mockRes.data)}`);
      }
    } catch (error) {
      console.log('❌ Excepción en Portal de Cliente (por defecto)');
      console.log(`   Error: ${error.message}`);
    }

    // 4. Verificar configuración de Stripe
    console.log('\n4️⃣ Verificando configuración de Stripe...');
    
    const stripe = require('../config/stripe');
    if (stripe) {
      console.log('✅ Stripe configurado correctamente');
    } else {
      console.log('❌ Stripe NO configurado');
    }

    console.log('\n✅ Pruebas del Portal de Cliente completadas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testPortalSession();
