const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkSocketAuthErrors() {
  console.log('🔍 Verificando configuración de autenticación Socket.io...\n');
  
  // Verificar variables de entorno de Firebase
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];
  
  console.log('📋 Variables de entorno de Firebase:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${varName}: NO DEFINIDA`);
    }
  });
  
  // Verificar configuración de Firebase Admin
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      console.log('\n✅ Firebase Admin SDK inicializado correctamente');
    } else {
      console.log('\n❌ Firebase Admin SDK no está inicializado');
    }
  } catch (error) {
    console.log('\n❌ Error con Firebase Admin SDK:', error.message);
  }
}

async function checkRedisConnection() {
  console.log('\n🔍 Verificando conexión Redis/Valkey...\n');
  
  try {
    const ValkeyCluster = require('../config/valkey-cluster');
    const cluster = new ValkeyCluster();
    
    console.log('📋 Configuración Valkey:');
    console.log(`  - Hosts: ${process.env.VALKEY_HOSTS || 'No definido'}`);
    console.log(`  - Port: ${process.env.VALKEY_PORT || 'No definido'}`);
    console.log(`  - Password: ${process.env.VALKEY_PASSWORD ? 'Definido' : 'No definido'}`);
    
    // Intentar conectar
    console.log('\n🔄 Probando conexión...');
    await cluster.connect();
    console.log('✅ Conexión a Valkey exitosa');
    
    // Probar operación básica
    await cluster.set('test_key', 'test_value', 'EX', 10);
    const value = await cluster.get('test_key');
    console.log(`✅ Operación de prueba exitosa: ${value}`);
    
    await cluster.disconnect();
    
  } catch (error) {
    console.log('❌ Error de conexión Valkey:', error.message);
  }
}

async function checkDatabaseIndexes() {
  console.log('\n🔍 Verificando índices de base de datos...\n');
  
  const client = await pool.connect();
  
  try {
    // Verificar índices de chats
    const chatIndexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'chats'
      ORDER BY indexname
    `);
    
    console.log('📋 Índices de tabla chats:');
    chatIndexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // Verificar si existe índice único para community_id
    const uniqueIndex = chatIndexes.rows.find(idx => 
      idx.indexdef.includes('UNIQUE') && 
      idx.indexdef.includes('community_id')
    );
    
    if (!uniqueIndex) {
      console.log('\n⚠️  No existe índice único para community_id');
      console.log('   Esto puede causar inconsistencias en la búsqueda de chats');
    } else {
      console.log('\n✅ Índice único encontrado para community_id');
    }
    
    // Verificar índices de mensajes
    const messageIndexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'messages'
      ORDER BY indexname
    `);
    
    console.log('\n📋 Índices de tabla messages:');
    messageIndexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
  } finally {
    client.release();
  }
}

async function fixDatabaseIndexes() {
  console.log('\n🔧 Aplicando correcciones de índices...\n');
  
  const client = await pool.connect();
  
  try {
    // 1. Crear índice único para chats de comunidad
    console.log('1. Creando índice único para chats de comunidad...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_community_unique 
      ON chats (community_id, type) 
      WHERE type = 'community' AND is_active = true
    `);
    console.log('   ✅ Índice único creado');
    
    // 2. Crear índices adicionales para optimización
    console.log('\n2. Creando índices adicionales...');
    
    // Índice para búsqueda de mensajes por chat
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
      ON messages (chat_id, created_at DESC)
    `);
    console.log('   ✅ Índice de mensajes por chat creado');
    
    // Índice para búsqueda de participantes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_chat_user 
      ON chat_participants (chat_id, user_id)
    `);
    console.log('   ✅ Índice de participantes creado');
    
    // 3. Verificar índices creados
    console.log('\n3. Verificando índices...');
    const newIndexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('chats', 'messages', 'chat_participants')
      AND indexname LIKE '%idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log('📋 Índices actuales:');
    newIndexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando verificación y corrección de errores...\n');
    
    // Verificar errores de Socket.io
    await checkSocketAuthErrors();
    
    // Verificar conexión Redis
    await checkRedisConnection();
    
    // Verificar índices de base de datos
    await checkDatabaseIndexes();
    
    // Preguntar si aplicar correcciones
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\n¿Deseas aplicar las correcciones de índices? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await fixDatabaseIndexes();
    } else {
      console.log('\n⏭️  Correcciones canceladas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  checkSocketAuthErrors, 
  checkRedisConnection, 
  checkDatabaseIndexes, 
  fixDatabaseIndexes 
};
