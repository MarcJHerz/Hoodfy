const Redis = require('ioredis');

class RedisClusterManager {
  constructor() {
    this.cluster = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      // ✅ VERIFICAR SI YA ESTÁ CONECTADO
      if (this.isConnected && this.cluster && this.cluster.status === 'ready') {
        console.log('✅ Redis Cluster ya está conectado, reutilizando conexión existente');
        return this.cluster;
      }

      // ✅ VERIFICAR SI YA ESTÁ CONECTANDO
      if (this.cluster && this.cluster.status === 'connecting') {
        console.log('⏳ Redis Cluster ya está conectando, esperando...');
        // Esperar hasta que termine la conexión
        return new Promise((resolve, reject) => {
          const checkConnection = () => {
            if (this.isConnected && this.cluster.status === 'ready') {
              resolve(this.cluster);
            } else if (this.cluster.status === 'error') {
              reject(new Error('Error en conexión previa'));
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      console.log('🔄 Conectando a Redis Cluster...');

      // Configuración para Valkey Cluster
      const clusterConfig = {
        // Usar Configuration Endpoint para cluster mode
        nodes: [
          {
            host: process.env.VALKEY_CLUSTER_HOST || 'clustercfg.hoodfy-valkey-cluster.yqqefg.use1.cache.amazonaws.com',
            port: parseInt(process.env.VALKEY_CLUSTER_PORT) || 6379
          }
        ],
        
        // Configuración optimizada para Valkey Cluster
        redisOptions: {
          password: process.env.VALKEY_PASSWORD || process.env.REDIS_PASSWORD,
          connectTimeout: 15000,        // Aumentado para cluster
          commandTimeout: 10000,        // Aumentado para cluster
          retryDelayOnFailover: 2000,   // Aumentado para cluster
          maxRetriesPerRequest: 5,      // Aumentado para cluster
          lazyConnect: true,
          keepAlive: 60000,             // Aumentado para cluster
          family: 4,
          keyPrefix: 'hoodfy:',
          // Configuración específica para Valkey Cluster con TLS
          tls: {
            checkServerIdentity: false,  // Para ElastiCache con TLS
            rejectUnauthorized: false   // Para ElastiCache con TLS
          },
          enableReadyCheck: true,
          maxRetriesPerRequest: 5,
        },
        
        // Configuración del cluster Valkey
        enableReadyCheck: true,
        scaleReads: 'slave',           // Leer de réplicas cuando sea posible
        maxRedirections: 16,
        retryDelayOnFailover: 2000,    // Aumentado para cluster
        enableOfflineQueue: false,
        readOnly: false,
        
        // Configuración específica para ElastiCache
        dnsLookup: (address, callback) => callback(null, address),
        enableAutoPipelining: true,    // Mejorar rendimiento
        
        // Configuración de salud
        healthCheckInterval: 30000,
        clusterRetryDelayOnFailover: 3000,  // Aumentado para cluster
      };

      // FALLBACK: Usar Redis Serverless mientras solucionamos Valkey Cluster
      if (process.env.USE_VALKEY_CLUSTER === 'true') {
        console.log('🔧 Conectando a Valkey Cluster...');
        this.cluster = new Redis.Cluster(clusterConfig.nodes, clusterConfig);
      } else {
        console.log('🔧 Conectando a Redis Serverless (fallback)...');
        this.cluster = new Redis({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 30000,
          commandTimeout: 15000,
          retryDelayOnFailover: 2000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 60000,
          family: 4,
          keyPrefix: 'hoodfy:',
        });
      }

      // Event handlers
      this.setupEventHandlers();
      
      // Conectar
      await this.cluster.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Valkey Cluster conectado exitosamente');
      
      // Test de conexión
      await this.cluster.set('health:check', Date.now(), 'EX', 30);
      const healthCheck = await this.cluster.get('health:check');
      console.log('✅ Test de conexión Valkey exitoso:', healthCheck);

      return this.cluster;

    } catch (error) {
      console.error('❌ Error conectando a Valkey Cluster:', error);
      this.isConnected = false;
      
      // Intentar reconexión si no hemos superado el límite
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        // Esperar antes de reconectar
        await new Promise(resolve => setTimeout(resolve, 2000 * this.reconnectAttempts));
        return this.connect();
      }
      
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      throw error;
    }
  }

  setupEventHandlers() {
    // Controlar frecuencia de logs para evitar spam
    this.lastLogTime = 0;
    this.logCooldown = 30000; // 30 segundos entre logs similares
    
    this.cluster.on('connect', () => {
      const now = Date.now();
      if (now - this.lastLogTime > this.logCooldown) {
        console.log('✅ Redis conectado');
        this.lastLogTime = now;
      }
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.cluster.on('ready', () => {
      console.log('✅ Redis listo');
      this.isConnected = true;
    });

    this.cluster.on('error', (err) => {
      // Solo loguear errores críticos, ignorar timeouts rutinarios
      if (!err.message.includes('Command timed out') && 
          !err.message.includes('Connection is closed') &&
          !err.message.includes('Failed to refresh slots cache')) {
        console.error('🔄 Redis error crítico:', err.message);
      }
      this.isConnected = false;
    });

    this.cluster.on('close', () => {
      const now = Date.now();
      if (now - this.lastLogTime > this.logCooldown) {
        console.log('⚠️ Redis desconectado');
        this.lastLogTime = now;
      }
      this.isConnected = false;
    });

    this.cluster.on('reconnecting', () => {
      const now = Date.now();
      if (now - this.lastLogTime > this.logCooldown) {
        console.log('🔄 Redis reconectando...');
        this.lastLogTime = now;
      }
      this.isConnected = false;
    });

    this.cluster.on('end', () => {
      console.log('🔚 Conexión Redis terminada');
      this.isConnected = false;
    });
  }

  async disconnect() {
    if (this.cluster) {
      try {
        await this.cluster.quit();
        console.log('✅ Redis desconectado limpiamente');
      } catch (error) {
        console.error('❌ Error desconectando Redis:', error);
      }
    }
  }

  getClient() {
    return this.cluster;
  }

  isHealthy() {
    return this.isConnected && this.cluster && this.cluster.status === 'ready';
  }

  // Wrapper methods con manejo de errores
  async safeSet(key, value, ...args) {
    try {
      if (!this.isHealthy()) {
        console.warn('⚠️ Redis no disponible, operación set ignorada');
        return null;
      }
      return await this.cluster.set(key, value, ...args);
    } catch (error) {
      console.warn('⚠️ Error en Redis set, continuando sin cache:', error.message);
      return null;
    }
  }

  async safeGet(key) {
    try {
      if (!this.isHealthy()) {
        console.warn('⚠️ Redis no disponible, operación get ignorada');
        return null;
      }
      return await this.cluster.get(key);
    } catch (error) {
      console.warn('⚠️ Error en Redis get, continuando sin cache:', error.message);
      return null;
    }
  }

  async safeDel(key) {
    try {
      if (!this.isHealthy()) {
        console.warn('⚠️ Redis no disponible, operación del ignorada');
        return null;
      }
      return await this.cluster.del(key);
    } catch (error) {
      console.warn('⚠️ Error en Redis del, continuando sin cache:', error.message);
      return null;
    }
  }

  async safePublish(channel, message) {
    try {
      if (!this.isHealthy()) {
        console.warn('⚠️ Redis no disponible, publish ignorado');
        return null;
      }
      return await this.cluster.publish(channel, message);
    } catch (error) {
      console.warn('⚠️ Error en Redis publish, continuando sin pub/sub:', error.message);
      return null;
    }
  }

  async safeSubscribe(channel, callback) {
    try {
      if (!this.isHealthy()) {
        console.warn('⚠️ Redis no disponible, subscribe ignorado');
        return null;
      }
      await this.cluster.subscribe(channel);
      this.cluster.on('message', callback);
      return true;
    } catch (error) {
      console.warn('⚠️ Error en Redis subscribe, continuando sin pub/sub:', error.message);
      return null;
    }
  }
}

// Singleton instance
let redisManager = null;

const getRedisManager = () => {
  if (!redisManager) {
    redisManager = new RedisClusterManager();
  }
  return redisManager;
};

module.exports = {
  RedisClusterManager,
  getRedisManager
};
