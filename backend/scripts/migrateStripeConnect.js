const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Community = require('../models/Community');

// Función para migrar comunidades existentes
async function migrateCommunitiesToStripeConnect() {
  try {
    console.log('🚀 Iniciando migración de comunidades a Stripe Connect...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Obtener todas las comunidades
    const communities = await Community.find({});
    console.log(`📊 Encontradas ${communities.length} comunidades para migrar`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const community of communities) {
      try {
        // Verificar si ya tiene los campos de Stripe Connect
        if (community.stripeConnectAccountId !== undefined) {
          console.log(`⏭️  Comunidad "${community.name}" ya migrada, saltando...`);
          skippedCount++;
          continue;
        }
        
        // Agregar campos de Stripe Connect con valores por defecto
        community.stripeConnectAccountId = '';
        community.stripeConnectStatus = 'pending';
        community.platformFeePercentage = 12;
        community.creatorFeePercentage = 88;
        
        await community.save();
        
        console.log(`✅ Comunidad "${community.name}" migrada exitosamente`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrando comunidad "${community.name}":`, error.message);
      }
    }
    
    console.log('\n📋 Resumen de migración:');
    console.log(`   ✅ Comunidades actualizadas: ${updatedCount}`);
    console.log(`   ⏭️  Comunidades ya migradas: ${skippedCount}`);
    console.log(`   📊 Total procesadas: ${updatedCount + skippedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Migración completada exitosamente!');
      console.log('💡 Las comunidades ahora están listas para configurar Stripe Connect');
    } else {
      console.log('\nℹ️  No se requirieron actualizaciones');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Función para verificar el estado de la migración
async function checkMigrationStatus() {
  try {
    console.log('🔍 Verificando estado de migración...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Contar comunidades con y sin Stripe Connect
    const totalCommunities = await Community.countDocuments({});
    const migratedCommunities = await Community.countDocuments({
      stripeConnectAccountId: { $exists: true }
    });
    const pendingCommunities = await Community.countDocuments({
      stripeConnectAccountId: { $exists: true, $ne: '' }
    });
    
    console.log('\n📊 Estado de la migración:');
    console.log(`   📈 Total de comunidades: ${totalCommunities}`);
    console.log(`   ✅ Comunidades migradas: ${migratedCommunities}`);
    console.log(`   🏗️  Comunidades con Stripe Connect configurado: ${pendingCommunities}`);
    console.log(`   ⏳ Comunidades pendientes de configuración: ${migratedCommunities - pendingCommunities}`);
    
    // Mostrar algunas comunidades como ejemplo
    const sampleCommunities = await Community.find({})
      .select('name stripeConnectAccountId stripeConnectStatus platformFeePercentage')
      .limit(5);
    
    console.log('\n📋 Ejemplos de comunidades:');
    sampleCommunities.forEach(community => {
      console.log(`   🏘️  ${community.name}:`);
      console.log(`      - Stripe Connect ID: ${community.stripeConnectAccountId || 'No configurado'}`);
      console.log(`      - Estado: ${community.stripeConnectStatus || 'N/A'}`);
      console.log(`      - Comisión plataforma: ${community.platformFeePercentage || 'N/A'}%`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Función para limpiar campos de Stripe Connect (solo para desarrollo)
async function resetStripeConnectFields() {
  try {
    console.log('⚠️  ADVERTENCIA: Esta operación reseteará todos los campos de Stripe Connect');
    console.log('🔒 Solo usar en desarrollo/testing');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Resetear campos de Stripe Connect
    const result = await Community.updateMany(
      {},
      {
        $unset: {
          stripeConnectAccountId: "",
          stripeConnectStatus: "",
          platformFeePercentage: "",
          creatorFeePercentage: ""
        }
      }
    );
    
    console.log(`✅ Reset completado. ${result.modifiedCount} comunidades afectadas`);
    
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Manejar argumentos de línea de comandos
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateCommunitiesToStripeConnect();
    break;
  case 'check':
    checkMigrationStatus();
    break;
  case 'reset':
    resetStripeConnectFields();
    break;
  default:
    console.log('📖 Uso del script de migración:');
    console.log('   npm run migrate:stripe-connect    # Migrar comunidades');
    console.log('   npm run check:migration          # Verificar estado');
    console.log('   npm run reset:stripe-connect     # Resetear campos (solo dev)');
    console.log('\n💡 O ejecutar directamente:');
    console.log('   node scripts/migrateStripeConnect.js migrate');
    console.log('   node scripts/migrateStripeConnect.js check');
    console.log('   node scripts/migrateStripeConnect.js reset');
    process.exit(0);
}
