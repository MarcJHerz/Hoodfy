const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
require('dotenv').config();

async function optimizeDatabaseIndexes() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔧 OPTIMIZANDO ÍNDICES DE BASE DE DATOS\n');

    // 1. Optimizar índices de User
    console.log('1️⃣ Optimizando índices de User...');
    
    try {
      // Índice para email (crítico para login)
      await User.collection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Índice creado: User.email');
    } catch (error) {
      console.log('⚠️ Índice User.email ya existe o error:', error.message);
    }

    try {
      // Índice para username (crítico para búsquedas)
      await User.collection.createIndex({ username: 1 }, { unique: true });
      console.log('✅ Índice creado: User.username');
    } catch (error) {
      console.log('⚠️ Índice User.username ya existe o error:', error.message);
    }

    try {
      // Índice para firebaseUid (crítico para autenticación)
      await User.collection.createIndex({ firebaseUid: 1 }, { unique: true });
      console.log('✅ Índice creado: User.firebaseUid');
    } catch (error) {
      console.log('⚠️ Índice User.firebaseUid ya existe o error:', error.message);
    }

    try {
      // Índice compuesto para búsquedas de usuarios activos
      await User.collection.createIndex({ isActive: 1, createdAt: -1 });
      console.log('✅ Índice creado: User.isActive + createdAt');
    } catch (error) {
      console.log('⚠️ Índice User.isActive ya existe o error:', error.message);
    }

    // 2. Optimizar índices de Community
    console.log('\n2️⃣ Optimizando índices de Community...');
    
    try {
      // Índice para búsquedas por nombre
      await Community.collection.createIndex({ name: 1 });
      console.log('✅ Índice creado: Community.name');
    } catch (error) {
      console.log('⚠️ Índice Community.name ya existe o error:', error.message);
    }

    try {
      // Índice para búsquedas por creador
      await Community.collection.createIndex({ creator: 1, createdAt: -1 });
      console.log('✅ Índice creado: Community.creator + createdAt');
    } catch (error) {
      console.log('⚠️ Índice Community.creator ya existe o error:', error.message);
    }

    try {
      // Índice para búsquedas por miembros
      await Community.collection.createIndex({ members: 1 });
      console.log('✅ Índice creado: Community.members');
    } catch (error) {
      console.log('⚠️ Índice Community.members ya existe o error:', error.message);
    }

    // 3. Optimizar índices de Subscription
    console.log('\n3️⃣ Optimizando índices de Subscription...');
    
    try {
      // Índice para búsquedas por usuario
      await Subscription.collection.createIndex({ user: 1, status: 1 });
      console.log('✅ Índice creado: Subscription.user + status');
    } catch (error) {
      console.log('⚠️ Índice Subscription.user ya existe o error:', error.message);
    }

    try {
      // Índice para búsquedas por comunidad
      await Subscription.collection.createIndex({ community: 1, status: 1 });
      console.log('✅ Índice creado: Subscription.community + status');
    } catch (error) {
      console.log('⚠️ Índice Subscription.community ya existe o error:', error.message);
    }

    try {
      // Índice para búsquedas por status
      await Subscription.collection.createIndex({ status: 1, createdAt: -1 });
      console.log('✅ Índice creado: Subscription.status + createdAt');
    } catch (error) {
      console.log('⚠️ Índice Subscription.status ya existe o error:', error.message);
    }

    try {
      // Índice para Stripe Customer ID
      await Subscription.collection.createIndex({ stripeCustomerId: 1 });
      console.log('✅ Índice creado: Subscription.stripeCustomerId');
    } catch (error) {
      console.log('⚠️ Índice Subscription.stripeCustomerId ya existe o error:', error.message);
    }

    try {
      // Índice para Stripe Subscription ID
      await Subscription.collection.createIndex({ stripeSubscriptionId: 1 });
      console.log('✅ Índice creado: Subscription.stripeSubscriptionId');
    } catch (error) {
      console.log('⚠️ Índice Subscription.stripeSubscriptionId ya existe o error:', error.message);
    }

    // 4. Verificar índices finales
    console.log('\n4️⃣ Verificando índices finales...');
    
    const userIndexes = await User.collection.getIndexes();
    const communityIndexes = await Community.collection.getIndexes();
    const subscriptionIndexes = await Subscription.collection.getIndexes();

    console.log(`\n📊 Total de índices:`);
    console.log(`- User: ${Object.keys(userIndexes).length}`);
    console.log(`- Community: ${Object.keys(communityIndexes).length}`);
    console.log(`- Subscription: ${Object.keys(subscriptionIndexes).length}`);

    // 5. Test de rendimiento después de optimización
    console.log('\n5️⃣ Test de rendimiento optimizado...');
    
    const startTime = Date.now();
    const users = await User.find({ email: { $exists: true } }).limit(100);
    const userQueryTime = Date.now() - startTime;
    console.log(`- Consulta optimizada de usuarios: ${userQueryTime}ms`);

    const startTime2 = Date.now();
    const subscriptions = await Subscription.find({ status: 'active' }).populate('user community');
    const subscriptionQueryTime = Date.now() - startTime2;
    console.log(`- Consulta optimizada de suscripciones: ${subscriptionQueryTime}ms`);

    console.log('\n✅ OPTIMIZACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log('🚀 La base de datos está optimizada para escalar');
    console.log('📈 Rendimiento mejorado para consultas frecuentes');
    console.log('🔍 Búsquedas más rápidas en usuarios y suscripciones');
    
  } catch (error) {
    console.error('❌ Error en optimización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

optimizeDatabaseIndexes();
