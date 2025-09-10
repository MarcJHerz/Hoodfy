#!/usr/bin/env node

const { getValkeyManager } = require('../config/valkey-cluster');

async function testValkeyConnection() {
  console.log('🧪 INICIANDO PRUEBA DIRECTA DE VALKEY CLUSTER');
  console.log('================================================');
  
  // Mostrar variables de entorno
  console.log('🔧 Variables de entorno:');
  console.log('VALKEY_CLUSTER_HOST:', process.env.VALKEY_CLUSTER_HOST);
  console.log('VALKEY_CLUSTER_PORT:', process.env.VALKEY_CLUSTER_PORT);
  console.log('USE_VALKEY_CLUSTER:', process.env.USE_VALKEY_CLUSTER);
  console.log('VALKEY_PASSWORD:', process.env.VALKEY_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('');

  try {
    // 1. Obtener manager
    console.log('1️⃣ Obteniendo Valkey Manager...');
    const valkeyManager = getValkeyManager();
    console.log('✅ Valkey Manager obtenido');

    // 2. Conectar
    console.log('2️⃣ Conectando a Valkey Cluster...');
    const cluster = await valkeyManager.connect();
    console.log('✅ Conexión exitosa');

    // 3. Probar operaciones básicas
    console.log('3️⃣ Probando operaciones básicas...');
    
    // Test SET
    const setResult = await valkeyManager.safeSet('test:valkey', 'Hello Valkey!', 60);
    console.log('SET test:valkey:', setResult ? '✅ OK' : '❌ FAIL');

    // Test GET
    const getValue = await valkeyManager.safeGet('test:valkey');
    console.log('GET test:valkey:', getValue ? `✅ ${getValue}` : '❌ FAIL');

    // Test PUBLISH
    const pubResult = await valkeyManager.safePublish('test:channel', { message: 'Hello from Valkey!' });
    console.log('PUBLISH test:channel:', pubResult ? '✅ OK' : '❌ FAIL');

    // 4. Verificar estado
    console.log('4️⃣ Verificando estado del cluster...');
    console.log('Estado:', cluster.status);
    console.log('Conectado:', valkeyManager.isHealthy());
    console.log('Nodos:', cluster.nodes().length);

    // 5. Limpiar
    console.log('5️⃣ Limpiando datos de prueba...');
    await valkeyManager.safeDel('test:valkey');
    console.log('✅ Datos limpiados');

    // 6. Desconectar
    console.log('6️⃣ Desconectando...');
    await valkeyManager.disconnect();
    console.log('✅ Desconectado correctamente');

    console.log('');
    console.log('🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('✅ Valkey Cluster está funcionando correctamente');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR EN LA PRUEBA:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code) {
      console.error('Código de error:', error.code);
    }
    
    if (error.syscall) {
      console.error('Syscall:', error.syscall);
    }
    
    if (error.address) {
      console.error('Address:', error.address);
    }
    
    if (error.port) {
      console.error('Port:', error.port);
    }

    console.log('');
    console.log('🔍 DIAGNÓSTICO:');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ Error de conexión rechazada - Verificar:');
      console.log('   - Host y puerto correctos');
      console.log('   - Security groups en AWS');
      console.log('   - Cluster activo en ElastiCache');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('❌ Error de DNS - Verificar:');
      console.log('   - Hostname correcto');
      console.log('   - DNS resolution');
    } else if (error.message.includes('timeout')) {
      console.log('❌ Error de timeout - Verificar:');
      console.log('   - Conectividad de red');
      console.log('   - Security groups');
      console.log('   - Cluster disponible');
    } else if (error.message.includes('already connecting/connected')) {
      console.log('❌ Error de conexión duplicada - Verificar:');
      console.log('   - Instancias múltiples');
      console.log('   - Conexiones no cerradas');
    }

    process.exit(1);
  }
}

// Ejecutar prueba
testValkeyConnection();
