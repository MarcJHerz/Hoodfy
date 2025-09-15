const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
require('dotenv').config();

async function verifyStripeConnectConfig() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 Verificando configuración de Stripe Connect...\n');

    // 1. Verificar que los campos de Stripe Connect estén en el modelo User
    console.log('1️⃣ Verificando modelo User...');
    const userSchema = User.schema.obj;
    const requiredStripeFields = ['stripeConnectAccountId', 'stripeConnectStatus'];
    
    for (const field of requiredStripeFields) {
      if (userSchema[field]) {
        console.log(`✅ Campo ${field}: ${userSchema[field].type || 'Definido'}`);
      } else {
        console.log(`❌ Campo ${field}: NO ENCONTRADO`);
      }
    }

    // 2. Verificar que los campos de Stripe Connect NO estén en el modelo Community
    console.log('\n2️⃣ Verificando modelo Community...');
    const communitySchema = Community.schema.obj;
    const stripeFieldsInCommunity = ['stripeConnectAccountId', 'stripeConnectStatus'];
    
    for (const field of stripeFieldsInCommunity) {
      if (communitySchema[field]) {
        console.log(`❌ Campo ${field}: NO DEBERÍA ESTAR EN COMMUNITY`);
      } else {
        console.log(`✅ Campo ${field}: Correctamente NO está en Community`);
      }
    }

    // 3. Buscar usuarios con Stripe Connect configurado
    console.log('\n3️⃣ Verificando usuarios con Stripe Connect...');
    const usersWithStripe = await User.find({
      stripeConnectAccountId: { $exists: true, $ne: '' }
    }).select('name email stripeConnectAccountId stripeConnectStatus');
    
    console.log(`📊 Usuarios con Stripe Connect: ${usersWithStripe.length}`);
    usersWithStripe.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.stripeConnectStatus}`);
    });

    // 4. Buscar comunidades de usuarios con Stripe Connect
    console.log('\n4️⃣ Verificando comunidades de usuarios con Stripe Connect...');
    const userIdsWithStripe = usersWithStripe.map(u => u._id);
    const communitiesWithStripeUsers = await Community.find({
      creator: { $in: userIdsWithStripe }
    }).populate('creator', 'name stripeConnectAccountId stripeConnectStatus');
    
    console.log(`📊 Comunidades de usuarios con Stripe Connect: ${communitiesWithStripeUsers.length}`);
    communitiesWithStripeUsers.forEach(comm => {
      console.log(`- ${comm.name} (Creador: ${comm.creator.name}, Status: ${comm.creator.stripeConnectStatus})`);
    });

    // 5. Verificar suscripciones activas
    console.log('\n5️⃣ Verificando suscripciones activas...');
    const activeSubscriptions = await Subscription.find({
      status: 'active'
    }).populate('user', 'name').populate('community', 'name');
    
    console.log(`📊 Suscripciones activas: ${activeSubscriptions.length}`);
    activeSubscriptions.forEach(sub => {
      console.log(`- ${sub.user?.name || 'Usuario'} -> ${sub.community?.name || 'Comunidad'} ($${sub.amount})`);
    });

    // 6. Verificar configuración correcta
    console.log('\n6️⃣ Verificando configuración correcta...');
    let configCorrect = true;
    
    // Verificar que no haya campos de Stripe Connect en Community
    if (communitySchema.stripeConnectAccountId || communitySchema.stripeConnectStatus) {
      console.log('❌ ERROR: Campos de Stripe Connect encontrados en modelo Community');
      configCorrect = false;
    }
    
    // Verificar que los campos estén en User
    if (!userSchema.stripeConnectAccountId || !userSchema.stripeConnectStatus) {
      console.log('❌ ERROR: Campos de Stripe Connect faltantes en modelo User');
      configCorrect = false;
    }
    
    if (configCorrect) {
      console.log('✅ Configuración de Stripe Connect CORRECTA');
      console.log('   - Cada usuario tiene una sola cuenta de Stripe Connect');
      console.log('   - Todas las comunidades del usuario usan la misma cuenta');
      console.log('   - Los campos están en el modelo correcto (User)');
    } else {
      console.log('❌ Configuración de Stripe Connect INCORRECTA');
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

verifyStripeConnectConfig();
