const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy');

const Community = require('../models/Community');
const User = require('../models/User');

async function migrateStripeToUser() {
  try {
    console.log('🚀 Iniciando migración de Stripe Connect de Community a User...');
    
    // Obtener todas las comunidades que tienen Stripe Connect configurado
    const communitiesWithStripe = await Community.find({
      $or: [
        { stripeConnectAccountId: { $exists: true, $ne: '' } },
        { stripeConnectStatus: { $exists: true, $ne: 'pending' } }
      ]
    });
    
    console.log(`📊 Encontradas ${communitiesWithStripe.length} comunidades con Stripe Connect configurado`);
    
    // Agrupar por creador
    const creatorStripeData = new Map();
    
    for (const community of communitiesWithStripe) {
      const creatorId = community.creator.toString();
      
      if (!creatorStripeData.has(creatorId)) {
        creatorStripeData.set(creatorId, {
          stripeConnectAccountId: '',
          stripeConnectStatus: 'pending',
          communities: []
        });
      }
      
      const creatorData = creatorStripeData.get(creatorId);
      
      // Si esta comunidad tiene una cuenta activa, usarla para el creador
      if (community.stripeConnectAccountId && community.stripeConnectStatus === 'active') {
        creatorData.stripeConnectAccountId = community.stripeConnectAccountId;
        creatorData.stripeConnectStatus = community.stripeConnectStatus;
      } else if (community.stripeConnectAccountId && !creatorData.stripeConnectAccountId) {
        // Si no hay cuenta activa, usar la primera disponible
        creatorData.stripeConnectAccountId = community.stripeConnectAccountId;
        creatorData.stripeConnectStatus = community.stripeConnectStatus;
      }
      
      creatorData.communities.push(community._id);
    }
    
    console.log(`👥 Encontrados ${creatorStripeData.size} creadores únicos con Stripe Connect`);
    
    // Actualizar usuarios con la información de Stripe Connect
    let usersUpdated = 0;
    for (const [creatorId, stripeData] of creatorStripeData) {
      try {
        await User.findByIdAndUpdate(creatorId, {
          stripeConnectAccountId: stripeData.stripeConnectAccountId,
          stripeConnectStatus: stripeData.stripeConnectStatus
        });
        
        console.log(`✅ Usuario ${creatorId} actualizado con Stripe Connect`);
        usersUpdated++;
      } catch (error) {
        console.error(`❌ Error actualizando usuario ${creatorId}:`, error.message);
      }
    }
    
    console.log(`✅ ${usersUpdated} usuarios actualizados exitosamente`);
    
    // Limpiar campos de Stripe Connect de las comunidades
    let communitiesCleaned = 0;
    for (const community of communitiesWithStripe) {
      try {
        await Community.findByIdAndUpdate(community._id, {
          $unset: {
            stripeConnectAccountId: 1,
            stripeConnectStatus: 1,
            platformFeePercentage: 1,
            creatorFeePercentage: 1
          }
        });
        
        console.log(`🧹 Comunidad ${community._id} limpiada`);
        communitiesCleaned++;
      } catch (error) {
        console.error(`❌ Error limpiando comunidad ${community._id}:`, error.message);
      }
    }
    
    console.log(`🧹 ${communitiesCleaned} comunidades limpiadas exitosamente`);
    
    console.log('🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar migración
migrateStripeToUser();
