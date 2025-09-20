const mongoose = require('mongoose');
const Community = require('../models/Community');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testDeletedCommunities() {
  try {
    console.log('🔍 Probando filtrado de comunidades eliminadas...\n');

    // 1. Obtener todas las comunidades (incluyendo eliminadas)
    const allCommunities = await Community.find({});
    console.log(`📊 Total de comunidades en la base de datos: ${allCommunities.length}`);

    // 2. Contar por estado
    const activeCommunities = await Community.countDocuments({ status: 'active' });
    const suspendedCommunities = await Community.countDocuments({ status: 'suspended' });
    const archivedCommunities = await Community.countDocuments({ status: 'archived' });
    const deletedCommunities = await Community.countDocuments({ status: 'deleted' });

    console.log(`🟢 Comunidades activas: ${activeCommunities}`);
    console.log(`🟡 Comunidades suspendidas: ${suspendedCommunities}`);
    console.log(`🟠 Comunidades archivadas: ${archivedCommunities}`);
    console.log(`⚫ Comunidades eliminadas: ${deletedCommunities}\n`);

    // 3. Simular consulta pública (como en /public)
    const publicCommunities = await Community.find({ 
      isPrivate: { $ne: true },
      status: { $ne: 'deleted' } // Excluir comunidades eliminadas
    }).select('name status isPrivate');

    console.log(`🌐 Comunidades visibles públicamente: ${publicCommunities.length}`);
    console.log('Comunidades públicas:');
    publicCommunities.forEach(community => {
      console.log(`  - ${community.name} (${community.status})`);
    });

    // 4. Verificar que no hay comunidades eliminadas en la consulta pública
    const deletedInPublic = publicCommunities.filter(c => c.status === 'deleted');
    if (deletedInPublic.length === 0) {
      console.log('\n✅ ÉXITO: No hay comunidades eliminadas en la consulta pública');
    } else {
      console.log('\n❌ ERROR: Se encontraron comunidades eliminadas en la consulta pública');
      deletedInPublic.forEach(community => {
        console.log(`  - ${community.name} (${community.status})`);
      });
    }

    // 5. Simular consulta de comunidad específica
    const deletedCommunity = await Community.findOne({ status: 'deleted' });
    if (deletedCommunity) {
      const specificCommunity = await Community.findOne({
        _id: deletedCommunity._id,
        status: { $ne: 'deleted' }
      });
      
      if (!specificCommunity) {
        console.log('✅ ÉXITO: Las comunidades eliminadas no son accesibles por ID específico');
      } else {
        console.log('❌ ERROR: Las comunidades eliminadas son accesibles por ID específico');
      }
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar la prueba
testDeletedCommunities();
