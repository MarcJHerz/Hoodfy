const Redis = require('ioredis');
require('dotenv').config();

async function testValkeyConnection() {
  console.log('🧪 Probando conexión a Valkey Cluster...');
  
  const clusterConfig = {
    nodes: [
      {
        host: 'clustercfg.hoodfy-valkey-cluster.yqqefg.use1.cache.amazonaws.com',
        port: 6379
      }
    ],
    redisOptions: {
      password: process.env.VALKEY_PASSWORD || process.env.REDIS_PASSWORD,
      connectTimeout: 15000,
      commandTimeout: 10000,
      retryDelayOnFailover: 2000,
      maxRetriesPerRequest: 5,
      lazyConnect: true,
      keepAlive: 60000,
      family: 4,
      keyPrefix: 'hoodfy:',
      tls: {
        checkServerIdentity: false,
        rejectUnauthorized: false
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 5,
    },
    enableReadyCheck: true,
    scaleReads: 'slave',
    maxRedirections: 16,
    retryDelayOnFailover: 2000,
    enableOfflineQueue: false,
    readOnly: false,
    dnsLookup: (address, callback) => callback(null, address),
    enableAutoPipelining: true,
    healthCheckInterval: 30000,
    clusterRetryDelayOnFailover: 3000,
  };

  try {
    console.log('🔧 Creando cliente Redis Cluster...');
    const cluster = new Redis.Cluster(clusterConfig.nodes, clusterConfig);
    
    console.log('⏳ Esperando conexión...');
    await cluster.connect();
    
    console.log('✅ Conectado exitosamente!');
    
    // Probar operaciones básicas
    console.log('🧪 Probando operaciones...');
    
    await cluster.set('test:connection', 'Hoodfy Valkey Test');
    const value = await cluster.get('test:connection');
    console.log('✅ SET/GET exitoso:', value);
    
    await cluster.del('test:connection');
    console.log('✅ DELETE exitoso');
    
    // Obtener información del cluster
    const info = await cluster.cluster('info');
    console.log('📊 Cluster Info:', info);
    
    const nodes = await cluster.cluster('nodes');
    console.log('🖥️ Cluster Nodes:', nodes);
    
    await cluster.disconnect();
    console.log('✅ Desconectado exitosamente');
    
  } catch (error) {
    console.error('❌ Error conectando a Valkey Cluster:', error.message);
    console.error('🔍 Detalles del error:', error);
    
    if (error.code) {
      console.error('📋 Código de error:', error.code);
    }
    
    if (error.syscall) {
      console.error('🔧 Syscall:', error.syscall);
    }
    
    if (error.address) {
      console.error('🌐 Address:', error.address);
    }
    
    if (error.port) {
      console.error('🔌 Port:', error.port);
    }
  }
}

// Ejecutar prueba
testValkeyConnection().then(() => {
  console.log('🏁 Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
