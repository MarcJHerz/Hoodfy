#!/usr/bin/env node

// Cargar variables de entorno
require('dotenv').config();

const { getRedisManager } = require('../config/redis-cluster');
const { getValkeyManager } = require('../config/valkey-cluster');

async function diagnoseRedisValkey() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE REDIS/VALKEY');
  console.log('==========================================');
  
  // Mostrar variables de entorno
  console.log('🔧 Variables de entorno:');
  console.log('REDIS_HOST:', process.env.REDIS_HOST);
  console.log('REDIS_PORT:', process.env.REDIS_PORT);
  console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('VALKEY_CLUSTER_HOST:', process.env.VALKEY_CLUSTER_HOST);
  console.log('VALKEY_CLUSTER_PORT:', process.env.VALKEY_CLUSTER_PORT);
  console.log('VALKEY_PASSWORD:', process.env.VALKEY_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('USE_VALKEY_CLUSTER:', process.env.USE_VALKEY_CLUSTER);
  console.log('');

  try {
    // 1. Probar Redis Cluster (original)
    console.log('1️⃣ PROBANDO REDIS CLUSTER (ORIGINAL)');
    console.log('------------------------------------');
    try {
      const redisManager = getRedisManager();
      const redisCluster = await redisManager.connect();
      console.log('✅ Redis Cluster conectado');
      console.log('Estado:', redisCluster.status);
      console.log('Nodos:', redisCluster.nodes().length);
      
      // Test básico
      await redisManager.safeSet('test:redis', 'Hello Redis!', 60);
      const value = await redisManager.safeGet('test:redis');
      console.log('Test SET/GET:', value ? `✅ ${value}` : '❌ FAIL');
      
      await redisManager.safeDel('test:redis');
      await redisManager.disconnect();
      console.log('✅ Redis Cluster desconectado');
    } catch (error) {
      console.log('❌ Redis Cluster falló:', error.message);
    }

    console.log('');

    // 2. Probar Valkey Cluster (nuevo)
    console.log('2️⃣ PROBANDO VALKEY CLUSTER (NUEVO)');
    console.log('-----------------------------------');
    try {
      const valkeyManager = getValkeyManager();
      const valkeyCluster = await valkeyManager.connect();
      console.log('✅ Valkey Cluster conectado');
      console.log('Estado:', valkeyCluster.status);
      console.log('Nodos:', valkeyCluster.nodes().length);
      
      // Test básico
      await valkeyManager.safeSet('test:valkey', 'Hello Valkey!', 60);
      const value = await valkeyManager.safeGet('test:valkey');
      console.log('Test SET/GET:', value ? `✅ ${value}` : '❌ FAIL');
      
      await valkeyManager.safeDel('test:valkey');
      await valkeyManager.disconnect();
      console.log('✅ Valkey Cluster desconectado');
    } catch (error) {
      console.log('❌ Valkey Cluster falló:', error.message);
    }

    console.log('');

    // 3. Análisis de configuración
    console.log('3️⃣ ANÁLISIS DE CONFIGURACIÓN');
    console.log('-----------------------------');
    
    if (process.env.USE_VALKEY_CLUSTER === 'true') {
      console.log('✅ Configuración: USAR VALKEY CLUSTER');
      console.log('   - Servicios deberían usar getValkeyManager()');
      console.log('   - Host:', process.env.VALKEY_CLUSTER_HOST);
      console.log('   - Port:', process.env.VALKEY_CLUSTER_PORT);
    } else {
      console.log('⚠️ Configuración: USAR REDIS CLUSTER');
      console.log('   - Servicios deberían usar getRedisManager()');
      console.log('   - Host:', process.env.REDIS_HOST);
      console.log('   - Port:', process.env.REDIS_PORT);
    }

    console.log('');

    // 4. Recomendaciones
    console.log('4️⃣ RECOMENDACIONES');
    console.log('------------------');
    
    if (process.env.USE_VALKEY_CLUSTER === 'true') {
      console.log('✅ Usar Valkey Cluster:');
      console.log('   - chatService.js: getValkeyManager() ✅');
      console.log('   - cacheService.js: getValkeyManager() ✅');
      console.log('   - Eliminar Redis Cluster de AWS');
    } else {
      console.log('⚠️ Usar Redis Cluster:');
      console.log('   - chatService.js: getRedisManager() ❌');
      console.log('   - cacheService.js: getRedisManager() ❌');
      console.log('   - Eliminar Valkey Cluster de AWS');
    }

    console.log('');
    console.log('🎯 CONCLUSIÓN:');
    console.log('   - Tienes DOS clusters en AWS');
    console.log('   - Debes elegir UNO y eliminar el otro');
    console.log('   - Unificar el código para usar el elegido');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
diagnoseRedisValkey();
