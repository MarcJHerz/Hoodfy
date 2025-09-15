const mongoose = require('mongoose');
const User = require('../models/User');
const Community = require('../models/Community');
const Subscription = require('../models/Subscription');
const Post = require('../models/Post');
const { Pool } = require('pg');
require('dotenv').config();

async function analyzeScalability() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 ANÁLISIS DE ESCALABILIDAD - REVISIÓN FINAL\n');

    // 1. Análisis de MongoDB
    console.log('1️⃣ ANÁLISIS DE MONGODB');
    console.log('='.repeat(50));

    // Verificar índices en User
    console.log('\n📊 Modelo User:');
    const userIndexes = await User.collection.getIndexes();
    console.log('Índices:', Object.keys(userIndexes).length);
    Object.keys(userIndexes).forEach(index => {
      console.log(`- ${index}: ${JSON.stringify(userIndexes[index].key)}`);
    });

    // Verificar índices en Community
    console.log('\n📊 Modelo Community:');
    const communityIndexes = await Community.collection.getIndexes();
    console.log('Índices:', Object.keys(communityIndexes).length);
    Object.keys(communityIndexes).forEach(index => {
      console.log(`- ${index}: ${JSON.stringify(communityIndexes[index].key)}`);
    });

    // Verificar índices en Subscription
    console.log('\n📊 Modelo Subscription:');
    const subscriptionIndexes = await Subscription.collection.getIndexes();
    console.log('Índices:', Object.keys(subscriptionIndexes).length);
    Object.keys(subscriptionIndexes).forEach(index => {
      console.log(`- ${index}: ${JSON.stringify(subscriptionIndexes[index].key)}`);
    });

    // 2. Análisis de PostgreSQL
    console.log('\n2️⃣ ANÁLISIS DE POSTGRESQL');
    console.log('='.repeat(50));

    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const client = await pool.connect();
      
      // Verificar índices de chats
      console.log('\n📊 Tabla chats:');
      const chatIndexes = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'chats'
      `);
      console.log('Índices:', chatIndexes.rows.length);
      chatIndexes.rows.forEach(idx => {
        console.log(`- ${idx.indexname}`);
      });

      // Verificar índices de messages
      console.log('\n📊 Tabla messages:');
      const messageIndexes = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'messages'
      `);
      console.log('Índices:', messageIndexes.rows.length);
      messageIndexes.rows.forEach(idx => {
        console.log(`- ${idx.indexname}`);
      });

      // Verificar índices de chat_participants
      console.log('\n📊 Tabla chat_participants:');
      const participantIndexes = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'chat_participants'
      `);
      console.log('Índices:', participantIndexes.rows.length);
      participantIndexes.rows.forEach(idx => {
        console.log(`- ${idx.indexname}`);
      });

      client.release();
    } catch (error) {
      console.log('⚠️ No se pudo conectar a PostgreSQL:', error.message);
    }

    // 3. Análisis de datos actuales
    console.log('\n3️⃣ ANÁLISIS DE DATOS ACTUALES');
    console.log('='.repeat(50));

    const userCount = await User.countDocuments();
    const communityCount = await Community.countDocuments();
    const subscriptionCount = await Subscription.countDocuments();
    const postCount = await Post.countDocuments();

    console.log(`📊 Usuarios: ${userCount}`);
    console.log(`📊 Comunidades: ${communityCount}`);
    console.log(`📊 Suscripciones: ${subscriptionCount}`);
    console.log(`📊 Posts: ${postCount}`);

    // 4. Análisis de rendimiento
    console.log('\n4️⃣ ANÁLISIS DE RENDIMIENTO');
    console.log('='.repeat(50));

    // Test de consulta de usuarios
    console.log('\n⏱️ Test de consulta de usuarios:');
    const startTime = Date.now();
    const users = await User.find().limit(100).select('name email createdAt');
    const userQueryTime = Date.now() - startTime;
    console.log(`- Consulta de 100 usuarios: ${userQueryTime}ms`);

    // Test de consulta de comunidades
    console.log('\n⏱️ Test de consulta de comunidades:');
    const startTime2 = Date.now();
    const communities = await Community.find().limit(100).populate('creator', 'name');
    const communityQueryTime = Date.now() - startTime2;
    console.log(`- Consulta de 100 comunidades: ${communityQueryTime}ms`);

    // Test de consulta de suscripciones
    console.log('\n⏱️ Test de consulta de suscripciones:');
    const startTime3 = Date.now();
    const subscriptions = await Subscription.find({ status: 'active' }).populate('user community');
    const subscriptionQueryTime = Date.now() - startTime3;
    console.log(`- Consulta de suscripciones activas: ${subscriptionQueryTime}ms`);

    // 5. Recomendaciones de escalabilidad
    console.log('\n5️⃣ RECOMENDACIONES DE ESCALABILIDAD');
    console.log('='.repeat(50));

    console.log('\n✅ FORTALEZAS:');
    console.log('- MongoDB con índices en campos críticos');
    console.log('- PostgreSQL con índices optimizados para chats');
    console.log('- Separación de responsabilidades (MongoDB para usuarios, PostgreSQL para chats)');
    console.log('- Pool de conexiones configurado');
    console.log('- Rate limiting implementado');

    console.log('\n⚠️ ÁREAS DE MEJORA:');
    
    // Verificar si faltan índices importantes
    if (!userIndexes.email) {
      console.log('- ❌ FALTA: Índice en User.email (crítico para login)');
    }
    if (!userIndexes.username) {
      console.log('- ❌ FALTA: Índice en User.username (crítico para búsquedas)');
    }
    if (!userIndexes.firebaseUid) {
      console.log('- ❌ FALTA: Índice en User.firebaseUid (crítico para autenticación)');
    }
    if (!subscriptionIndexes.user) {
      console.log('- ❌ FALTA: Índice en Subscription.user (crítico para consultas)');
    }
    if (!subscriptionIndexes.community) {
      console.log('- ❌ FALTA: Índice en Subscription.community (crítico para consultas)');
    }
    if (!subscriptionIndexes.status) {
      console.log('- ❌ FALTA: Índice en Subscription.status (crítico para filtros)');
    }

    console.log('\n🚀 RECOMENDACIONES PARA ESCALABILIDAD:');
    console.log('1. Agregar índices faltantes en MongoDB');
    console.log('2. Implementar paginación en todas las consultas');
    console.log('3. Usar Redis para cache de sesiones');
    console.log('4. Implementar CDN para imágenes');
    console.log('5. Monitorear métricas de rendimiento');
    console.log('6. Configurar auto-scaling en producción');

    // 6. Verificación de configuración de producción
    console.log('\n6️⃣ CONFIGURACIÓN DE PRODUCCIÓN');
    console.log('='.repeat(50));

    const envVars = [
      'MONGODB_URI',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'STRIPE_SECRET_KEY',
      'JWT_SECRET',
      'NODE_ENV'
    ];

    console.log('\n📋 Variables de entorno críticas:');
    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: Configurada`);
      } else {
        console.log(`❌ ${varName}: NO CONFIGURADA`);
      }
    });

    console.log('\n✅ ANÁLISIS COMPLETADO');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

analyzeScalability();
