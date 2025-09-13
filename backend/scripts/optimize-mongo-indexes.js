const mongoose = require('mongoose');
require('dotenv').config();

class MongoOptimizer {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Conectado a MongoDB');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      throw error;
    }
  }

  async optimizeIndexes() {
    try {
      console.log('🚀 Iniciando optimización de índices MongoDB...\n');

      // 1. Índices para usuarios
      await this.optimizeUserIndexes();
      
      // 2. Índices para posts
      await this.optimizePostIndexes();
      
      // 3. Índices para comunidades
      await this.optimizeCommunityIndexes();
      
      // 4. Índices para comentarios
      await this.optimizeCommentIndexes();
      
      // 5. Índices para suscripciones
      await this.optimizeSubscriptionIndexes();
      
      // 6. Índices para notificaciones
      await this.optimizeNotificationIndexes();
      
      console.log('\n✅ Optimización de índices MongoDB completada');
      
    } catch (error) {
      console.error('❌ Error optimizando índices MongoDB:', error);
      throw error;
    }
  }

  async optimizeUserIndexes() {
    console.log('👤 Optimizando índices de usuarios...');
    
    const userIndexes = [
      // Índice único para firebaseUid (ya existe, pero verificamos)
      { firebaseUid: 1 },
      
      // Índice para búsquedas por email
      { email: 1 },
      
      // Índice compuesto para usuarios activos
      { isActive: 1, createdAt: -1 },
      
      // Índice para búsquedas por nombre
      { name: 'text', username: 'text' },
      
      // Índice para usuarios por comunidad
      { 'communities.communityId': 1, 'communities.role': 1 },
      
      // Índice para estadísticas de usuario
      { 'stats.totalPosts': -1, 'stats.totalLikes': -1 },
      
      // Índice para usuarios premium
      { 'subscription.status': 1, 'subscription.plan': 1 },
      
      // Índice para última actividad
      { lastActiveAt: -1 },
      
      // Índice para verificación de email
      { emailVerified: 1, createdAt: -1 }
    ];

    await this.createIndexes('users', userIndexes);
  }

  async optimizePostIndexes() {
    console.log('📝 Optimizando índices de posts...');
    
    const postIndexes = [
      // Índice para posts por autor
      { author: 1, createdAt: -1 },
      
      // Índice para posts por comunidad
      { communityId: 1, createdAt: -1 },
      
      // Índice compuesto para posts activos
      { isActive: 1, communityId: 1, createdAt: -1 },
      
      // Índice para búsquedas de texto
      { content: 'text', title: 'text' },
      
      // Índice para posts populares
      { 'stats.likes': -1, 'stats.comments': -1, createdAt: -1 },
      
      // Índice para posts con media
      { 'media.0': { $exists: true }, createdAt: -1 },
      
      // Índice para posts por visibilidad
      { visibility: 1, communityId: 1, createdAt: -1 },
      
      // Índice para posts por tags
      { tags: 1, createdAt: -1 },
      
      // Índice para posts fijados
      { isPinned: 1, communityId: 1, pinnedAt: -1 },
      
      // Índice para posts por tipo
      { type: 1, communityId: 1, createdAt: -1 }
    ];

    await this.createIndexes('posts', postIndexes);
  }

  async optimizeCommunityIndexes() {
    console.log('🏘️ Optimizando índices de comunidades...');
    
    const communityIndexes = [
      // Índice único para slug
      { slug: 1 },
      
      // Índice para comunidades activas
      { isActive: 1, createdAt: -1 },
      
      // Índice para búsquedas de texto
      { name: 'text', description: 'text' },
      
      // Índice para comunidades por categoría
      { category: 1, isActive: 1 },
      
      // Índice para comunidades populares
      { 'stats.memberCount': -1, 'stats.postCount': -1 },
      
      // Índice para comunidades por creador
      { createdBy: 1, createdAt: -1 },
      
      // Índice para comunidades por tipo
      { type: 1, isActive: 1 },
      
      // Índice para comunidades por precio
      { 'pricing.monthlyPrice': 1, isActive: 1 },
      
      // Índice para comunidades por ubicación
      { 'location.country': 1, 'location.city': 1 },
      
      // Índice para comunidades verificadas
      { isVerified: 1, isActive: 1 }
    ];

    await this.createIndexes('communities', communityIndexes);
  }

  async optimizeCommentIndexes() {
    console.log('💬 Optimizando índices de comentarios...');
    
    const commentIndexes = [
      // Índice para comentarios por post
      { postId: 1, createdAt: -1 },
      
      // Índice para comentarios por autor
      { author: 1, createdAt: -1 },
      
      // Índice compuesto para comentarios activos
      { isActive: 1, postId: 1, createdAt: -1 },
      
      // Índice para comentarios anidados
      { parentCommentId: 1, createdAt: 1 },
      
      // Índice para búsquedas de texto
      { content: 'text' },
      
      // Índice para comentarios populares
      { 'stats.likes': -1, createdAt: -1 },
      
      // Índice para comentarios por comunidad
      { communityId: 1, createdAt: -1 }
    ];

    await this.createIndexes('comments', commentIndexes);
  }

  async optimizeSubscriptionIndexes() {
    console.log('💳 Optimizando índices de suscripciones...');
    
    const subscriptionIndexes = [
      // Índice para suscripciones por usuario
      { userId: 1, status: 1 },
      
      // Índice para suscripciones por comunidad
      { communityId: 1, status: 1 },
      
      // Índice compuesto para suscripciones activas
      { status: 1, communityId: 1, createdAt: -1 },
      
      // Índice para suscripciones por plan
      { planId: 1, status: 1 },
      
      // Índice para suscripciones por fecha de vencimiento
      { currentPeriodEnd: 1, status: 1 },
      
      // Índice para suscripciones por método de pago
      { paymentMethodId: 1, status: 1 },
      
      // Índice para suscripciones canceladas
      { status: 1, canceledAt: -1 },
      
      // Índice para suscripciones por Stripe
      { stripeSubscriptionId: 1 }
    ];

    await this.createIndexes('subscriptions', subscriptionIndexes);
  }

  async optimizeNotificationIndexes() {
    console.log('🔔 Optimizando índices de notificaciones...');
    
    const notificationIndexes = [
      // Índice para notificaciones por usuario
      { userId: 1, createdAt: -1 },
      
      // Índice para notificaciones no leídas
      { userId: 1, isRead: 1, createdAt: -1 },
      
      // Índice para notificaciones por tipo
      { type: 1, userId: 1, createdAt: -1 },
      
      // Índice para notificaciones por comunidad
      { communityId: 1, userId: 1, createdAt: -1 },
      
      // Índice para notificaciones por post
      { postId: 1, userId: 1, createdAt: -1 },
      
      // Índice para notificaciones por comentario
      { commentId: 1, userId: 1, createdAt: -1 },
      
      // Índice para notificaciones por fecha
      { createdAt: -1, userId: 1 },
      
      // Índice para notificaciones por prioridad
      { priority: 1, userId: 1, createdAt: -1 }
    ];

    await this.createIndexes('notifications', notificationIndexes);
  }

  async createIndexes(collectionName, indexes) {
    const collection = this.connection.connection.db.collection(collectionName);
    
    for (const index of indexes) {
      try {
        const options = { background: true };
        
        // Si es índice de texto, agregar opciones específicas
        if (JSON.stringify(index).includes('text')) {
          options.default_language = 'spanish';
          options.name = `${collectionName}_text_index`;
        }
        
        await collection.createIndex(index, options);
        console.log(`  ✅ ${collectionName}: ${JSON.stringify(index)}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`  ⚠️ ${collectionName}: Índice ya existe`);
        } else {
          console.log(`  ❌ ${collectionName}: ${error.message}`);
        }
      }
    }
  }

  async getIndexStats() {
    try {
      console.log('\n📊 Estadísticas de índices MongoDB:');
      
      const collections = ['users', 'posts', 'communities', 'comments', 'subscriptions', 'notifications'];
      
      for (const collectionName of collections) {
        const collection = this.connection.connection.db.collection(collectionName);
        const indexes = await collection.indexes();
        
        console.log(`\n📋 ${collectionName}:`);
        indexes.forEach(index => {
          console.log(`  🔍 ${index.name}: ${JSON.stringify(index.key)}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.connection.close();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const optimizer = new MongoOptimizer();
  
  optimizer.connect()
    .then(() => optimizer.optimizeIndexes())
    .then(() => optimizer.getIndexStats())
    .then(() => optimizer.close())
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = MongoOptimizer;
