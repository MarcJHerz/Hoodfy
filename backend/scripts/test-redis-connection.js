#!/usr/bin/env node

/**
 * Script para probar conexión a Redis ElastiCache Serverless
 * Uso: node scripts/test-redis-connection.js
 */

require('dotenv').config();
const Redis = require('ioredis');

async function testRedisConnection() {
  console.log('🔍 Probando conexión a Redis ElastiCache Serverless...');
  console.log('📍 Host:', process.env.REDIS_HOST);
  console.log('📍 Port:', process.env.REDIS_PORT);
  console.log('📍 Password:', process.env.REDIS_PASSWORD ? '***' : 'none');

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined,
    retryDelayOnFailover: 2000,
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    keyPrefix: 'hoodfy:test:',
    connectTimeout: 30000,
    commandTimeout: 15000,
    retryDelayOnClusterDown: 2000,
    enableOfflineQueue: false,
    maxLoadingTimeout: 15000,
    keepAlive: 60000,
    family: 4,
    db: 0,
    pingInterval: 60000,
    reconnectOnError: (err) => {
      console.log('🔄 Redis reconectando por error:', err.message);
      return err.message.includes('READONLY') || 
             err.message.includes('ECONNRESET') || 
             err.message.includes('ETIMEDOUT');
    },
    enableReadyCheck: true,
    showFriendlyErrorStack: true
  });

  redis.on('connect', () => {
    console.log('✅ Redis conectado');
  });

  redis.on('error', (err) => {
    console.log('❌ Redis error:', err.message);
  });

  redis.on('close', () => {
    console.log('⚠️ Redis desconectado');
  });

  redis.on('reconnecting', () => {
    console.log('🔄 Redis reconectando');
  });

  redis.on('ready', () => {
    console.log('✅ Redis listo');
  });

  try {
    // Probar conexión
    console.log('🔄 Conectando...');
    await redis.connect();
    
    // Probar ping
    console.log('🔄 Probando ping...');
    const pong = await redis.ping();
    console.log('✅ Ping exitoso:', pong);
    
    // Probar set/get
    console.log('🔄 Probando set/get...');
    await redis.set('test:key', 'test:value', 'EX', 60);
    const value = await redis.get('test:key');
    console.log('✅ Set/Get exitoso:', value);
    
    // Probar pub/sub
    console.log('🔄 Probando pub/sub...');
    const subscriber = redis.duplicate();
    await subscriber.connect();
    
    subscriber.subscribe('test:channel');
    subscriber.on('message', (channel, message) => {
      console.log('✅ Pub/Sub exitoso:', channel, message);
    });
    
    // Publicar mensaje
    await redis.publish('test:channel', 'test message');
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Limpiar
    await redis.del('test:key');
    await subscriber.unsubscribe('test:channel');
    await subscriber.disconnect();
    
    console.log('✅ Todas las pruebas exitosas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await redis.disconnect();
    console.log('🔚 Conexión cerrada');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testRedisConnection().catch(console.error);
}

module.exports = testRedisConnection;
