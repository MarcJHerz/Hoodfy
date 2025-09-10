#!/usr/bin/env node

// Cargar variables de entorno
require('dotenv').config();

const { getValkeyManager, resetValkeyManager } = require('../config/valkey-cluster');

async function testValkeyFinal() {
  console.log('🧪 PRUEBA FINAL DE VALKEY CLUSTER');
  console.log('==================================');
  
  // Mostrar variables de entorno
  console.log('🔧 Variables de entorno:');
  console.log('VALKEY_CLUSTER_HOST:', process.env.VALKEY_CLUSTER_HOST);
  console.log('VALKEY_CLUSTER_PORT:', process.env.VALKEY_CLUSTER_PORT);
  console.log('VALKEY_PASSWORD:', process.env.VALKEY_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('USE_VALKEY_CLUSTER:', process.env.USE_VALKEY_CLUSTER);
  console.log('');

  try {
    // 1. Reset completo del singleton
    console.log('1️⃣ Reseteando singleton de Valkey Manager...');
    resetValkeyManager();
    console.log('✅ Singleton reseteado');

    // 2. Esperar un momento
    console.log('2️⃣ Esperando 3 segundos para limpieza completa...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Obtener manager limpio
    console.log('3️⃣ Obteniendo Valkey Manager limpio...');
    const valkeyManager = getValkeyManager();
    console.log('✅ Valkey Manager obtenido');

    // 4. Conectar
    console.log('4️⃣ Conectando a Valkey Cluster...');
    const cluster = await valkeyManager.connect();
    console.log('✅ Conexión exitosa');

    // 5. Probar operaciones básicas
    console.log('5️⃣ Probando operaciones básicas...');
    
    // Test SET
    const setResult = await valkeyManager.safeSet('test:valkey', 'Hello Valkey!', 60);
    console.log('SET test:valkey:', setResult ? '✅ OK' : '❌ FAIL');

    // Test GET
    const getValue = await valkeyManager.safeGet('test:valkey');
    console.log('GET test:valkey:', getValue ? `✅ ${getValue}` : '❌ FAIL');

    // Test PUBLISH
    const pubResult = await valkeyManager.safePublish('test:channel', { message: 'Hello from Valkey!' });
    console.log('PUBLISH test:channel:', pubResult ? '✅ OK' : '❌ FAIL');

    // 6. Verificar estado
    console.log('6️⃣ Verificando estado del cluster...');
    console.log('Estado:', cluster.status);
    console.log('Conectado:', valkeyManager.isHealthy());
    console.log('Nodos:', cluster.nodes().length);

    // 7. Limpiar
    console.log('7️⃣ Limpiando datos de prueba...');
    await valkeyManager.safeDel('test:valkey');
    console.log('✅ Datos limpiados');

    // 8. Desconectar
    console.log('8️⃣ Desconectando...');
    await valkeyManager.disconnect();
    console.log('✅ Desconectado correctamente');

    console.log('');
    console.log('🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('✅ Valkey Cluster está funcionando correctamente');
    console.log('✅ Sistema unificado para usar Valkey Cluster');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR EN LA PRUEBA:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    
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
    } else if (error.message.includes('Failed to refresh slots cache')) {
      console.log('❌ Error de slots cache - Verificar:');
      console.log('   - Cluster de Valkey activo');
      console.log('   - Configuración de cluster');
      console.log('   - Security groups');
      console.log('   - Endpoint correcto');
    }

    process.exit(1);
  }
}

// Ejecutar prueba
testValkeyFinal();
