const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const Comment = require('../models/Comment');
const Ally = require('../models/Ally');
const Subscription = require('../models/Subscription');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanDatabase() {
  try {
    console.log('🧹 Iniciando limpieza de la base de datos...');
    
    // Eliminar todos los posts (que pueden tener URLs locales)
    const postsDeleted = await Post.deleteMany({});
    console.log(`✅ Eliminados ${postsDeleted.deletedCount} posts`);
    
    // Eliminar todos los comentarios
    const commentsDeleted = await Comment.deleteMany({});
    console.log(`✅ Eliminados ${commentsDeleted.deletedCount} comentarios`);
    
    // Eliminar todas las alianzas
    const alliesDeleted = await Ally.deleteMany({});
    console.log(`✅ Eliminadas ${alliesDeleted.deletedCount} alianzas`);
    
    // Eliminar todas las suscripciones
    const subscriptionsDeleted = await Subscription.deleteMany({});
    console.log(`✅ Eliminadas ${subscriptionsDeleted.deletedCount} suscripciones`);
    
    // Eliminar todas las comunidades
    const communitiesDeleted = await Community.deleteMany({});
    console.log(`✅ Eliminadas ${communitiesDeleted.deletedCount} comunidades`);
    
    // Eliminar todos los usuarios (OPCIONAL - descomenta si quieres empezar completamente limpio)
    // const usersDeleted = await User.deleteMany({});
    // console.log(`✅ Eliminados ${usersDeleted.deletedCount} usuarios`);
    
    console.log('🎉 Limpieza completada exitosamente!');
    console.log('💡 Ahora puedes crear nuevos usuarios, comunidades y posts que serán compatibles con S3');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDatabase();
}

module.exports = cleanDatabase; 