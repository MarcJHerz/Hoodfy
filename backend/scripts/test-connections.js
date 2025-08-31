require('dotenv').config();
const { Pool } = require('pg');
const Redis = require('ioredis');
const { Client } = require('@opensearch-project/opensearch');

console.log('🔍 Probando conexiones a las nuevas bases de datos...\n');

// 1. Probar PostgreSQL
async function testPostgreSQL() {
  try {
    console.log('📊 Probando conexión a PostgreSQL...');
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ PostgreSQL: Conectado correctamente');
    console.log('   Tiempo actual:', result.rows[0].current_time);
    console.log('   Versión:', result.rows[0].db_version.split(' ')[0]);
    await pool.end();
  } catch (error) {
    console.log('❌ PostgreSQL Error:', error.message);
  }
}

// 2. Probar Redis
async function testRedis() {
  try {
    console.log('🔴 Probando conexión a Redis...');
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 10000, // 10 segundos máximo
      commandTimeout: 5000,  // 5 segundos para comandos
      keyPrefix: 'hoodfy:test:',
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('   Conectando a Redis... (timeout: 10s)');
    await redis.connect();
    
    await redis.set('hoodfy_test', 'Hoodfy Redis Test - ' + new Date().toISOString());
    const value = await redis.get('hoodfy_test');
    const info = await redis.info('server');
    const version = info.split('\r\n').find(line => line.startsWith('redis_version')).split(':')[1];
    
    console.log('✅ Redis: Conectado correctamente');
    console.log('   Test value:', value);
    console.log('   Versión:', version);
    await redis.disconnect();
  } catch (error) {
    console.log('❌ Redis Error:', error.message);
  }
}

// 3. Probar OpenSearch
async function testOpenSearch() {
  try {
    console.log('🔍 Probando conexión a OpenSearch...');
    
    // Configuración para autenticación IAM de AWS
    const client = new Client({
      node: process.env.OPENSEARCH_URL,
      // Usar autenticación IAM en lugar de credenciales básicas
      auth: {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_REGION || 'us-east-1'
      },
      ssl: { 
        rejectUnauthorized: false,
        ca: undefined,
        checkServerIdentity: () => undefined
      },
      requestTimeout: 15000, // 15 segundos
      maxRetries: 2,
      // Configuración específica para OpenSearch con IAM
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('   Conectando a OpenSearch con IAM... (timeout: 15s)');
    console.log('   URL:', process.env.OPENSEARCH_URL);
    console.log('   Región AWS:', process.env.AWS_REGION || 'us-east-1');
    
    // Probar conexión básica primero
    const info = await client.info();
    console.log('   ✅ Info obtenida');
    
    // Probar health del cluster
    const clusterInfo = await client.cluster.health();
    console.log('   ✅ Health del cluster obtenido');
    
    console.log('✅ OpenSearch: Conectado correctamente con IAM');
    console.log('   Versión:', info.body.version.number);
    console.log('   Estado del clúster:', clusterInfo.body.status);
    console.log('   Nodos activos:', clusterInfo.body.number_of_nodes);
  } catch (error) {
    console.log('❌ OpenSearch Error:', error.message);
    console.log('   Detalles del error:', error);
    
    // Sugerencias de troubleshooting
    if (error.message.includes('timeout')) {
      console.log('   💡 Sugerencia: Verificar VPC Endpoint y Security Groups');
    } else if (error.message.includes('Unauthorized')) {
      console.log('   💡 Sugerencia: Verificar rol IAM y permisos de OpenSearch');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   💡 Sugerencia: Verificar DNS y conectividad de red');
    }
  }
}

// 4. Verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('🔧 Verificando variables de entorno...\n');
  
  const requiredVars = {
    'PostgreSQL': ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'],
    'Redis': ['REDIS_HOST', 'REDIS_PORT'],
    'OpenSearch': ['OPENSEARCH_URL'],
    'AWS IAM': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
  };
  
  let allVarsPresent = true;
  
  Object.entries(requiredVars).forEach(([service, vars]) => {
    const missing = vars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      console.log(`❌ ${service} - Variables faltantes:`, missing.join(', '));
      allVarsPresent = false;
    } else {
      console.log(`✅ ${service} - Todas las variables están configuradas`);
    }
  });
  
  // Verificar variables opcionales pero recomendadas
  const optionalVars = {
    'Redis Password': 'REDIS_PASSWORD',
    'OpenSearch Username/Password': 'OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD (obsoletas con IAM)'
  };
  
  console.log('\n📝 Variables opcionales:');
  Object.entries(optionalVars).forEach(([desc, vars]) => {
    console.log(`   ${desc}: ${vars}`);
  });
  
  console.log('');
  return allVarsPresent;
}

// Ejecutar todas las pruebas
async function runTests() {
  const envVarsOk = checkEnvironmentVariables();
  
  if (!envVarsOk) {
    console.log('⚠️  Algunas variables de entorno están faltando. Revisa tu archivo .env');
    return;
  }
  
  console.log('🚀 Iniciando pruebas de conexión...\n');
  
  // Timeout global de 30 segundos para todo el script
  const globalTimeout = setTimeout(() => {
    console.log('⏰ Timeout global alcanzado (30s). Cerrando...');
    process.exit(1);
  }, 30000);
  
  try {
    await testPostgreSQL();
    console.log('');
    await testRedis();
    console.log('');
    await testOpenSearch();
    
    clearTimeout(globalTimeout);
    console.log('\n🎉 Pruebas completadas!');
    console.log('\n📋 Resumen:');
    console.log('   - Si ves ✅, la conexión está funcionando');
    console.log('   - Si ves ❌, hay un problema que resolver');
    console.log('   - Si ves ⚠️, revisa la configuración');
  } catch (error) {
    clearTimeout(globalTimeout);
    console.log('❌ Error durante las pruebas:', error.message);
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.log('❌ Error no manejado:', error.message);
  process.exit(1);
});

// Ejecutar pruebas
runTests().catch(error => {
  console.log('❌ Error fatal:', error.message);
  process.exit(1);
});
