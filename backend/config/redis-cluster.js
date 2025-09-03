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
      console.log('🔄 Conectando a Redis Cluster...');

      // Configuración para Redis Cluster real (no Serverless)
      const clusterConfig = {
        // Nodos del cluster (actualizar con tus endpoints reales)
        nodes: [
          {
            host: process.env.REDIS_CLUSTER_HOST_1 || process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_CLUSTER_PORT_1) || parseInt(process.env.REDIS_PORT) || 6379
          }
          // Agregar más nodos si tienes cluster real:
          // {
          //   host: process.env.REDIS_CLUSTER_HOST_2,
          //   port: parseInt(process.env.REDIS_CLUSTER_PORT_2)
          // },
          // {
          //   host: process.env.REDIS_CLUSTER_HOST_3,
          //   port: parseInt(process.env.REDIS_CLUSTER_PORT_3)
          // }
        ],
        
        // Configuración optimizada para producción
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 10000,
          commandTimeout: 5000,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
          keyPrefix: 'hoodfy:',
        },
        
        // Configuración del cluster
        enableReadyCheck: true,
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
        },
        scaleReads: 'slave', // Leer de slaves cuando sea posible
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        readOnly: false,
        
        // Configuración de salud
        healthCheckInterval: 30000,
        clusterRetryDelayOnFailover: 2000,
      };

      // Si solo tenemos un nodo, usar Redis normal en lugar de cluster
      if (clusterConfig.nodes.length === 1) {
        console.log('🔧 Un solo nodo detectado, usando Redis normal...');
        this.cluster = new Redis({
          host: clusterConfig.nodes[0].host,
          port: clusterConfig.nodes[0].port,
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 10000,
          commandTimeout: 5000,
          retryDelayOnFailover: 1000,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          family: 4,
          keyPrefix: 'hoodfy:',
          // Configuración de reconexión
          retryDelayOnClusterDown: 300,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          reconnectOnError: (err) => {
            console.log('🔄 Redis reconectando por error:', err.message);
            const targetError = err.message.includes('READONLY') || 
                               err.message.includes('ECONNRESET') || 
                               err.message.includes('ETIMEDOUT') ||
                               err.message.includes('ENOTFOUND');
            return targetError;
          }
        });
      } else {
        console.log('🔧 Múltiples nodos detectados, usando Redis Cluster...');
        this.cluster = new Redis.Cluster(clusterConfig.nodes, clusterConfig);
      }

      // Event handlers
      this.setupEventHandlers();
      
      // Conectar
      await this.cluster.connect();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ Redis Cluster conectado exitosamente');
      
      // Test de conexión
      await this.cluster.set('health:check', Date.now(), 'EX', 30);
      const healthCheck = await this.cluster.get('health:check');
      console.log('✅ Test de conexión Redis exitoso:', healthCheck);

      return this.cluster;

    } catch (error) {
      console.error('❌ Error conectando a Redis Cluster:', error);
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
    this.cluster.on('connect', () => {
      console.log('✅ Redis conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.cluster.on('ready', () => {
      console.log('✅ Redis listo');
      this.isConnected = true;
    });

    this.cluster.on('error', (err) => {
      console.error('🔄 Redis error:', err.message);
      this.isConnected = false;
      
      // No hacer throw para evitar que el servicio se caiga
      // El sistema continuará funcionando sin Redis
    });

    this.cluster.on('close', () => {
      console.log('⚠️ Redis desconectado');
      this.isConnected = false;
    });

    this.cluster.on('reconnecting', () => {
      console.log('🔄 Redis reconectando...');
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
