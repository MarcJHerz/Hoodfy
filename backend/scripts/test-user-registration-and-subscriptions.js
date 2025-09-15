const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
require('dotenv').config();

async function testUserRegistrationAndSubscriptions() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 Verificando registro de usuarios y suscripciones...\n');

    // 1. Verificar usuarios recientes
    console.log('1️⃣ Verificando usuarios recientes...');
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email username firebaseUid createdAt');
    
    console.log(`📊 Usuarios recientes (últimos 5):`);
    recentUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.username} - ${user.createdAt.toISOString()}`);
    });

    // 2. Verificar suscripciones activas
    console.log('\n2️⃣ Verificando suscripciones activas...');
    const activeSubscriptions = await Subscription.find({
      status: 'active'
    }).populate('user', 'name email').populate('community', 'name');
    
    console.log(`📊 Suscripciones activas: ${activeSubscriptions.length}`);
    activeSubscriptions.forEach(sub => {
      console.log(`- ${sub.user?.name || 'Usuario'} -> ${sub.community?.name || 'Comunidad'} ($${sub.amount})`);
      console.log(`  Customer ID: ${sub.stripeCustomerId || 'No disponible'}`);
      console.log(`  Subscription ID: ${sub.stripeSubscriptionId || 'No disponible'}`);
    });

    // 3. Verificar usuarios con suscripciones
    console.log('\n3️⃣ Verificando usuarios con suscripciones...');
    const usersWithSubscriptions = await User.find({
      _id: { $in: activeSubscriptions.map(sub => sub.user._id) }
    }).select('name email stripeConnectAccountId stripeConnectStatus');
    
    console.log(`📊 Usuarios con suscripciones: ${usersWithSubscriptions.length}`);
    usersWithSubscriptions.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Stripe Connect: ${user.stripeConnectAccountId || 'No configurado'}`);
      console.log(`  Status: ${user.stripeConnectStatus || 'No configurado'}`);
    });

    // 4. Verificar comunidades con suscripciones
    console.log('\n4️⃣ Verificando comunidades con suscripciones...');
    const communitiesWithSubscriptions = await Community.find({
      _id: { $in: activeSubscriptions.map(sub => sub.community._id) }
    }).populate('creator', 'name stripeConnectAccountId stripeConnectStatus');
    
    console.log(`📊 Comunidades con suscripciones: ${communitiesWithSubscriptions.length}`);
    communitiesWithSubscriptions.forEach(comm => {
      console.log(`- ${comm.name} (Creador: ${comm.creator.name})`);
      console.log(`  Creador Stripe Connect: ${comm.creator.stripeConnectAccountId || 'No configurado'}`);
      console.log(`  Creador Status: ${comm.creator.stripeConnectStatus || 'No configurado'}`);
    });

    // 5. Verificar configuración del Portal de Cliente
    console.log('\n5️⃣ Verificando configuración del Portal de Cliente...');
    const subscriptionsWithCustomerId = activeSubscriptions.filter(sub => sub.stripeCustomerId);
    console.log(`📊 Suscripciones con Customer ID: ${subscriptionsWithCustomerId.length}/${activeSubscriptions.length}`);
    
    if (subscriptionsWithCustomerId.length > 0) {
      console.log('✅ Portal de Cliente configurado correctamente');
      console.log('   - Los usuarios pueden gestionar sus suscripciones');
      console.log('   - Customer IDs disponibles para Stripe Billing Portal');
    } else {
      console.log('❌ Portal de Cliente NO configurado');
      console.log('   - No hay Customer IDs disponibles');
      console.log('   - Los usuarios no pueden gestionar suscripciones');
    }

    // 6. Verificar flujo completo
    console.log('\n6️⃣ Verificando flujo completo...');
    let flowComplete = true;
    
    // Verificar que hay usuarios
    if (recentUsers.length === 0) {
      console.log('❌ No hay usuarios registrados');
      flowComplete = false;
    }
    
    // Verificar que hay suscripciones
    if (activeSubscriptions.length === 0) {
      console.log('❌ No hay suscripciones activas');
      flowComplete = false;
    }
    
    // Verificar que hay Customer IDs
    if (subscriptionsWithCustomerId.length === 0) {
      console.log('❌ No hay Customer IDs para Portal de Cliente');
      flowComplete = false;
    }
    
    if (flowComplete) {
      console.log('✅ Flujo completo funcionando correctamente');
      console.log('   - Registro de usuarios: ✅');
      console.log('   - Suscripciones activas: ✅');
      console.log('   - Portal de Cliente: ✅');
    } else {
      console.log('❌ Flujo incompleto - revisar configuración');
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testUserRegistrationAndSubscriptions();
