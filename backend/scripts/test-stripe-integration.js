const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
require('dotenv').config();

async function testStripeIntegration() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar que el modelo Subscription tenga todos los campos necesarios
    console.log('\n🔍 Verificando modelo Subscription...');
    const subscriptionSchema = Subscription.schema.obj;
    const requiredFields = ['user', 'community', 'status', 'stripeSubscriptionId', 'stripeCustomerId', 'currentPeriodEnd'];
    
    for (const field of requiredFields) {
      if (subscriptionSchema[field]) {
        console.log(`✅ Campo ${field}: ${subscriptionSchema[field].type || 'Definido'}`);
      } else {
        console.log(`❌ Campo ${field}: NO ENCONTRADO`);
      }
    }

    // Verificar que el enum de status incluya 'paused'
    const statusEnum = subscriptionSchema.status.enum;
    if (statusEnum.includes('paused')) {
      console.log('✅ Status enum incluye "paused"');
    } else {
      console.log('❌ Status enum NO incluye "paused"');
    }

    // Buscar usuarios con suscripciones
    console.log('\n🔍 Verificando suscripciones existentes...');
    const subscriptions = await Subscription.find().populate('user', 'name email').populate('community', 'name');
    console.log(`📊 Total de suscripciones: ${subscriptions.length}`);
    
    subscriptions.forEach(sub => {
      console.log(`- ${sub.user?.name || 'Usuario'} -> ${sub.community?.name || 'Comunidad'} (${sub.status})`);
    });

    // Buscar comunidades con Stripe Connect
    console.log('\n🔍 Verificando comunidades con Stripe Connect...');
    const communitiesWithStripe = await Community.find({
      stripeConnectAccountId: { $exists: true, $ne: null }
    });
    console.log(`📊 Comunidades con Stripe Connect: ${communitiesWithStripe.length}`);
    
    communitiesWithStripe.forEach(comm => {
      console.log(`- ${comm.name} (${comm.stripeConnectStatus})`);
    });

    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testStripeIntegration();
