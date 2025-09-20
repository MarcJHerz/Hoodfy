const mongoose = require('mongoose');
const Community = require('../models/Community');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  bufferMaxEntries: 0,
  bufferCommands: false,
});

async function simpleHealthCheck() {
  try {
    console.log('🔍 Análisis Simple de Salud de Comunidades\n');
    console.log('=' .repeat(60));
    
    // Esperar a que la conexión esté lista
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connection.asPromise();
    console.log('✅ Conectado a MongoDB\n');

    // 1. Obtener todas las comunidades (sin populate para ser más rápido)
    console.log('📊 Obteniendo comunidades...');
    const allCommunities = await Community.find({}).select('name status createdAt members allowNewSubscriptions allowRenewals').sort({ createdAt: -1 });
    console.log(`✅ Total de comunidades: ${allCommunities.length}\n`);

    // 2. Análisis por estado
    const statusAnalysis = {
      active: allCommunities.filter(c => c.status === 'active'),
      suspended: allCommunities.filter(c => c.status === 'suspended'),
      archived: allCommunities.filter(c => c.status === 'archived'),
      deleted: allCommunities.filter(c => c.status === 'deleted')
    };

    console.log('📈 DISTRIBUCIÓN POR ESTADO:');
    Object.entries(statusAnalysis).forEach(([status, communities]) => {
      const emoji = {
        active: '🟢',
        suspended: '🟡', 
        archived: '🟠',
        deleted: '⚫'
      }[status];
      console.log(`${emoji} ${status.toUpperCase()}: ${communities.length} comunidades`);
    });

    // 3. Detectar comunidades de prueba
    console.log('\n🧪 DETECTANDO COMUNIDADES DE PRUEBA:');
    const testCommunities = allCommunities.filter(c => 
      c.name.toLowerCase().includes('test') ||
      c.name.toLowerCase().includes('prueba') ||
      c.name.toLowerCase().includes('demo') ||
      c.name.toLowerCase().includes('example')
    );

    if (testCommunities.length > 0) {
      console.log(`\n🔍 Encontradas ${testCommunities.length} comunidades de prueba:`);
      testCommunities.forEach(c => {
        console.log(`   - ${c.name} (${c.status}) - ${c.members?.length || 0} miembros`);
      });
    } else {
      console.log('✅ No se encontraron comunidades de prueba');
    }

    // 4. Comunidades inactivas
    console.log('\n🔴 COMUNIDADES INACTIVAS:');
    const inactiveCommunities = allCommunities.filter(c => 
      c.status === 'active' && 
      c.members?.length === 0 && 
      !c.name.toLowerCase().includes('test')
    );

    if (inactiveCommunities.length > 0) {
      console.log(`\n⚠️ Encontradas ${inactiveCommunities.length} comunidades inactivas:`);
      inactiveCommunities.forEach(c => {
        console.log(`   - ${c.name} - ${c.members?.length || 0} miembros`);
      });
    } else {
      console.log('✅ No se encontraron comunidades inactivas');
    }

    // 5. Resumen y recomendaciones
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN Y RECOMENDACIONES:');
    console.log('=' .repeat(60));

    if (testCommunities.length > 0) {
      console.log(`\n🧪 Comunidades de prueba: ${testCommunities.length}`);
      console.log('   Recomendación: Archivar estas comunidades para producción');
    }

    if (inactiveCommunities.length > 0) {
      console.log(`\n🔴 Comunidades inactivas: ${inactiveCommunities.length}`);
      console.log('   Recomendación: Considerar archivar o eliminar');
    }

    console.log(`\n📈 Total de comunidades: ${allCommunities.length}`);
    console.log(`🟢 Activas: ${statusAnalysis.active.length}`);
    console.log(`🟡 Suspendidas: ${statusAnalysis.suspended.length}`);
    console.log(`🟠 Archivadas: ${statusAnalysis.archived.length}`);
    console.log(`⚫ Eliminadas: ${statusAnalysis.deleted.length}`);

  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    
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

// Ejecutar el análisis
simpleHealthCheck();
