#!/usr/bin/env node

/**
 * Script para resetear los rate limits de Redis
 * Útil cuando se han excedido los límites durante desarrollo
 */

const Redis = require('ioredis');
require('dotenv').config();

// Configuración de Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

async function resetRateLimits() {
  try {
    console.log('🔄 Conectando a Redis...');
    await redis.connect();
    console.log('✅ Conectado a Redis');

    // Buscar todas las claves de rate limiting
    const uploadKeys = await redis.keys('upload:*');
    const apiKeys = await redis.keys('api:*');
    const authKeys = await redis.keys('auth:*');
    const chatKeys = await redis.keys('chat:*');
    const webhookKeys = await redis.keys('webhook:*');

    const allKeys = [...uploadKeys, ...apiKeys, ...authKeys, ...chatKeys, ...webhookKeys];

    if (allKeys.length === 0) {
      console.log('ℹ️ No se encontraron claves de rate limiting para limpiar');
      return;
    }

    console.log(`🔍 Encontradas ${allKeys.length} claves de rate limiting:`);
    allKeys.forEach(key => console.log(`  - ${key}`));

    // Eliminar todas las claves
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
      console.log(`✅ Eliminadas ${allKeys.length} claves de rate limiting`);
    }

    console.log('🎉 Rate limits reseteados exitosamente');

  } catch (error) {
    console.error('❌ Error reseteando rate limits:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Sugerencia: Verifica que Redis esté ejecutándose');
    } else if (error.message.includes('NOAUTH')) {
      console.log('💡 Sugerencia: Verifica la configuración de Redis (password)');
    }
  } finally {
    await redis.quit();
    console.log('👋 Desconectado de Redis');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resetRateLimits()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = { resetRateLimits };
