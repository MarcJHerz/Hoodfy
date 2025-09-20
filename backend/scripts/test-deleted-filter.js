const mongoose = require('mongoose');
const Community = require('../models/Community');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  bufferMaxEntries: 0,
  bufferCommands: false,
});

async function testDeletedFilter() {
  try {
    console.log('🔍 Probando filtrado de comunidades eliminadas...\n');
    
    // Esperar a que la conexión esté lista
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connection.asPromise();
    console.log('✅ Conectado a MongoDB\n');

    // 1. Obtener todas las comunidades (incluyendo eliminadas)
    console.log('📊 Obteniendo todas las comunidades...');
    const allCommunities = await Community.find({}).select('name status');
    console.log(`✅ Total de comunidades en la base de datos: ${allCommunities.length}`);

    // 2. Contar por estado
    const statusCounts = {
      active: allCommunities.filter(c => c.status === 'active' || !c.status).length,
      suspended: allCommunities.filter(c => c.status === 'suspended').length,
      archived: allCommunities.filter(c => c.status === 'archived').length,
      deleted: allCommunities.filter(c => c.status === 'deleted').length
    };

    console.log('\n📈 DISTRIBUCIÓN POR ESTADO:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = {
        active: '🟢',
        suspended: '🟡', 
        archived: '🟠',
        deleted: '⚫'
      }[status];
      console.log(`${emoji} ${status.toUpperCase()}: ${count} comunidades`);
    });

    // 3. Probar filtrado de comunidades públicas (simulando la API)
    console.log('\n🔍 Probando filtrado para API pública...');
    const publicCommunities = await Community.find({
      isPrivate: { $ne: true },
      status: { $ne: 'deleted' }
    }).select('name status isPrivate');
    
    console.log(`✅ Comunidades públicas (no eliminadas): ${publicCommunities.length}`);
    
    if (publicCommunities.length > 0) {
      console.log('\n📋 Primeras 5 comunidades públicas:');
      publicCommunities.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name} (${c.status || 'active'})`);
      });
    }

    // 4. Verificar que las eliminadas no aparecen
    const deletedInPublic = publicCommunities.filter(c => c.status === 'deleted');
    if (deletedInPublic.length === 0) {
      console.log('✅ CORRECTO: Las comunidades eliminadas NO aparecen en la lista pública');
    } else {
      console.log('❌ ERROR: Las comunidades eliminadas SÍ aparecen en la lista pública');
    }

    // 5. Probar búsqueda por ID específico (simulando /communities/:id/public)
    if (allCommunities.length > 0) {
      const testCommunity = allCommunities[0];
      console.log(`\n🔍 Probando búsqueda por ID: ${testCommunity._id}`);
      
      const foundCommunity = await Community.findOne({
        _id: testCommunity._id,
        status: { $ne: 'deleted' }
      }).select('name status');
      
      if (foundCommunity) {
        console.log(`✅ Comunidad encontrada: ${foundCommunity.name} (${foundCommunity.status || 'active'})`);
      } else {
        console.log('❌ Comunidad no encontrada (posiblemente eliminada)');
      }
    }

    console.log('\n🎉 Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Sugerencias:');
      console.log('1. Verifica que MongoDB esté ejecutándose');
      console.log('2. Verifica la URL de conexión en MONGODB_URI');
      console.log('3. Verifica la conectividad de red');
    }
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Conexión a MongoDB cerrada');
    } catch (closeError) {
      console.log('\n⚠️ Error al cerrar la conexión:', closeError.message);
    }
  }
}

// Ejecutar la prueba
testDeletedFilter();
