const mongoose = require('mongoose');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const Post = require('../models/Post');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function analyzeCommunityHealth() {
  try {
    console.log('🔍 Análisis de Salud de Comunidades\n');
    console.log('=' .repeat(80));

    // 1. Obtener todas las comunidades
    const allCommunities = await Community.find({})
      .populate('creator', 'name username email')
      .sort({ createdAt: -1 });

    console.log(`📊 Total de comunidades: ${allCommunities.length}\n`);

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

    // 3. Análisis detallado de cada comunidad
    console.log('\n' + '=' .repeat(80));
    console.log('📋 ANÁLISIS DETALLADO POR COMUNIDAD:');
    console.log('=' .repeat(80));

    for (const community of allCommunities) {
      // Obtener estadísticas de la comunidad
      const activeSubscriptions = await Subscription.countDocuments({
        community: community._id,
        status: 'active'
      });

      const totalSubscriptions = await Subscription.countDocuments({
        community: community._id
      });

      const postsCount = await Post.countDocuments({
        community: community._id
      });

      const membersCount = community.members?.length || 0;

      // Calcular ingresos
      const revenue = await Subscription.aggregate([
        { $match: { community: community._id, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalRevenue = revenue[0]?.total || 0;

      // Determinar salud de la comunidad
      let healthStatus = '🟢 HEALTHY';
      let recommendations = [];

      if (community.status === 'deleted') {
        healthStatus = '⚫ DELETED';
      } else if (community.status === 'suspended') {
        healthStatus = '🟡 SUSPENDED';
        recommendations.push('Consider archiving if no active subscriptions');
      } else if (community.status === 'archived') {
        healthStatus = '🟠 ARCHIVED';
      } else {
        // Comunidad activa - analizar salud
        if (activeSubscriptions === 0 && membersCount === 0) {
          healthStatus = '🔴 INACTIVE';
          recommendations.push('No members or subscriptions - consider archiving');
        } else if (activeSubscriptions === 0 && membersCount > 0) {
          healthStatus = '🟡 LOW ACTIVITY';
          recommendations.push('Has members but no active subscriptions');
        } else if (postsCount === 0) {
          healthStatus = '🟡 NO CONTENT';
          recommendations.push('No posts created - encourage content creation');
        }

        // Detectar comunidades de prueba
        const isTestCommunity = 
          community.name.toLowerCase().includes('test') ||
          community.name.toLowerCase().includes('prueba') ||
          community.description.toLowerCase().includes('test') ||
          community.description.toLowerCase().includes('prueba') ||
          community.creator.email.includes('test') ||
          community.creator.username.toLowerCase().includes('test');

        if (isTestCommunity) {
          healthStatus = '🧪 TEST COMMUNITY';
          recommendations.push('Test community - consider archiving for production');
        }
      }

      // Mostrar información de la comunidad
      console.log(`\n📌 ${community.name}`);
      console.log(`   ID: ${community._id}`);
      console.log(`   Estado: ${healthStatus}`);
      console.log(`   Creador: ${community.creator.name} (${community.creator.email})`);
      console.log(`   Fecha creación: ${community.createdAt.toLocaleDateString()}`);
      console.log(`   Miembros: ${membersCount}`);
      console.log(`   Suscripciones activas: ${activeSubscriptions}`);
      console.log(`   Total suscripciones: ${totalSubscriptions}`);
      console.log(`   Posts: ${postsCount}`);
      console.log(`   Ingresos: $${totalRevenue.toFixed(2)}`);
      console.log(`   Precio: ${community.isFree ? 'Gratis' : `$${community.price}`}`);
      console.log(`   Privada: ${community.isPrivate ? 'Sí' : 'No'}`);
      
      if (recommendations.length > 0) {
        console.log(`   💡 Recomendaciones:`);
        recommendations.forEach(rec => console.log(`      - ${rec}`));
      }
    }

    // 4. Resumen y recomendaciones generales
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RESUMEN Y RECOMENDACIONES:');
    console.log('=' .repeat(80));

    const testCommunities = allCommunities.filter(c => 
      c.name.toLowerCase().includes('test') ||
      c.name.toLowerCase().includes('prueba') ||
      c.description.toLowerCase().includes('test') ||
      c.description.toLowerCase().includes('prueba') ||
      c.creator.email.includes('test') ||
      c.creator.username.toLowerCase().includes('test')
    );

    const inactiveCommunities = allCommunities.filter(c => 
      c.status === 'active' && 
      c.members?.length === 0 && 
      !c.name.toLowerCase().includes('test')
    );

    console.log(`\n🧪 Comunidades de prueba identificadas: ${testCommunities.length}`);
    if (testCommunities.length > 0) {
      console.log('   Recomendación: Archivar estas comunidades para producción');
      testCommunities.forEach(c => console.log(`   - ${c.name} (${c.creator.email})`));
    }

    console.log(`\n🔴 Comunidades inactivas: ${inactiveCommunities.length}`);
    if (inactiveCommunities.length > 0) {
      console.log('   Recomendación: Considerar archivar o eliminar');
      inactiveCommunities.forEach(c => console.log(`   - ${c.name} (${c.creator.email})`));
    }

    // 5. Estadísticas de ingresos
    const totalRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log(`\n💰 Ingresos totales de la plataforma: $${(totalRevenue[0]?.total || 0).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error en el análisis:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar el análisis
analyzeCommunityHealth();
