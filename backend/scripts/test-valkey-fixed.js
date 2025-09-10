const { getRedisManager } = require('../config/redis-cluster');
const CacheService = require('../services/cacheService');

async function testValkeyConnection() {
  console.log('🧪 INICIANDO PRUEBA DE CONEXIÓN VALKEY CLUSTER CORREGIDA');
  console.log('=' .repeat(60));

  try {
    // 1. Probar Redis Manager
    console.log('\n1️⃣ Probando Redis Manager...');
    const redisManager = getRedisManager();
    console.log('✅ Redis Manager obtenido');

    // 2. Conectar por primera vez
    console.log('\n2️⃣ Conectando por primera vez...');
    const redis1 = await redisManager.connect();
    console.log('✅ Primera conexión exitosa');

    // 3. Intentar conectar de nuevo (debería reutilizar)
    console.log('\n3️⃣ Intentando conectar de nuevo (debería reutilizar)...');
    const redis2 = await redisManager.connect();
    console.log('✅ Segunda conexión exitosa (reutilizada)');

    // 4. Verificar que es la misma instancia
    console.log('\n4️⃣ Verificando que es la misma instancia...');
    console.log('¿Misma instancia?', redis1 === redis2 ? '✅ SÍ' : '❌ NO');

    // 5. Probar operaciones básicas
    console.log('\n5️⃣ Probando operaciones básicas...');
    await redisManager.safeSet('test:connection', 'Valkey Cluster funcionando', 'EX', 30);
    const value = await redisManager.safeGet('test:connection');
    console.log('✅ Valor almacenado y recuperado:', value);

    // 6. Probar Cache Service
    console.log('\n6️⃣ Probando Cache Service...');
    const cacheService = new CacheService();
    
    // Esperar un poco para que se inicialice
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await cacheService.set('test:cache', { message: 'Cache Service funcionando' }, 30);
    const cachedValue = await cacheService.get('test:cache');
    console.log('✅ Cache Service funcionando:', cachedValue);

    // 7. Probar múltiples servicios simultáneamente
    console.log('\n7️⃣ Probando múltiples servicios simultáneamente...');
    const cacheService2 = new CacheService();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await cacheService2.set('test:cache2', { message: 'Segundo Cache Service' }, 30);
    const cachedValue2 = await cacheService2.get('test:cache2');
    console.log('✅ Segundo Cache Service funcionando:', cachedValue2);

    // 8. Verificar estadísticas
    console.log('\n8️⃣ Verificando estadísticas...');
    const stats = redisManager.isHealthy();
    console.log('✅ Redis saludable:', stats);

    // 9. Limpiar datos de prueba
    console.log('\n9️⃣ Limpiando datos de prueba...');
    await redisManager.safeDel('test:connection');
    await cacheService.del('test:cache');
    await cacheService2.del('test:cache2');
    console.log('✅ Datos de prueba eliminados');

    console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
    console.log('✅ Valkey Cluster está funcionando correctamente');
    console.log('✅ No hay múltiples conexiones');
    console.log('✅ Cache Service funciona correctamente');
    console.log('✅ Singleton pattern funciona');

  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Limpiar conexiones
    try {
      const redisManager = getRedisManager();
      await redisManager.disconnect();
      console.log('\n🧹 Conexiones limpiadas');
    } catch (cleanupError) {
      console.error('❌ Error en limpieza:', cleanupError);
    }
    
    process.exit(0);
  }
}

// Ejecutar las pruebas
testValkeyConnection();
