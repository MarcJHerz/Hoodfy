const { Cluster } = require('ioredis');
const dns = require('dns');

class ValkeyClusterManager {
  constructor() {
    this.cluster = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.subscriber = null; // conexión separada para pub/sub
    this.nodes = null; // nodos usados para conectar
    this.options = null; // opciones usadas para conectar
    this.connectingPromise = null; // deduplicar conexiones concurrentes
  }

  async connect() {
    try {
      // ✅ Si ya está conectado, devolver la instancia
      if (this.cluster && this.cluster.status === 'ready') {
        console.log('✅ Valkey Cluster ya está conectado y listo');
        return this.cluster;
      }

      // ✅ Si está conectando, esperar a que termine
      if (this.cluster && this.cluster.status === 'connecting') {
        console.log('⏳ Valkey Cluster está conectando, esperando...');
        return new Promise((resolve) => {
          const checkStatus = () => {
            if (this.cluster.status === 'ready') {
              this.isConnected = true;
              resolve(this.cluster);
            } else if (this.cluster.status === 'error' || this.cluster.status === 'end') {
              this.cluster = null;
              this.isConnected = false;
              resolve(null);
            } else {
              setTimeout(checkStatus, 100);
            }
          };
          checkStatus();
        });
      }

      // ✅ Evitar conexiones concurrentes
      if (this.connectingPromise) {
        return await this.connectingPromise;
      }

      console.log('🔄 Conectando a Valkey Cluster...');
      
      // ✅ ESPERAR UN MOMENTO PARA ASEGURAR LIMPIEZA COMPLETA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ✅ CONFIGURACIÓN CORRECTA PARA CLUSTER
      const nodes = [
        {
          host: process.env.VALKEY_CLUSTER_HOST || 'clustercfg.hoodfy-valkey-cluster.yqqefg.use1.cache.amazonaws.com',
          port: parseInt(process.env.VALKEY_CLUSTER_PORT) || 6379
        }
      ];

      const options = {
        redisOptions: {
          password: (process.env.VALKEY_PASSWORD && process.env.VALKEY_PASSWORD.trim() !== '')
            ? process.env.VALKEY_PASSWORD
            : undefined,
          connectTimeout: 30000, // ✅ Aumentar timeout
          lazyConnect: true,
          retryDelayOnFailover: 1000,
          // Recomendado para cluster: evitar cortar comandos por retry per request
          maxRetriesPerRequest: null,
          retryDelayOnClusterDown: 1000,
          enableOfflineQueue: false,
          maxLoadingTimeout: 30000,
          enableReadyCheck: true,
          scaleReads: 'slave',
          // ✅ TLS para ElastiCache/Valkey con cifrado en tránsito (SNI por hostname)
          tls: {
            rejectUnauthorized: true
          },
          keepAlive: 30000
        },
        clusterRetryDelayOnFailover: 1000,
        clusterRetryDelayOnClusterDown: 1000,
        clusterMaxRedirections: 16,
        clusterScaleReads: 'slave',
        enableOfflineQueue: false,
        maxLoadingTimeout: 30000,
        enableReadyCheck: true,
        // ✅ DNS passthrough para SNI correcto por nodo en TLS
        dnsLookup: (hostname, callback) => callback(null, hostname),
        slotsRefreshTimeout: 30000,
        slotsRefreshInterval: 5000
      };

      console.log('�� Configuración Valkey Cluster:', {
        host: nodes[0].host,
        port: nodes[0].port,
        hasPassword: !!options.redisOptions.password,
        connectTimeout: options.redisOptions.connectTimeout
      });

      // ✅ CREAR CLUSTER CON CONFIGURACIÓN CORRECTA
      this.cluster = new Cluster(nodes, options);
      this.nodes = nodes;
      this.options = options;

      // Configurar event listeners
      this.setupEventListeners();

      // Conectar (deduplicado)
      this.connectingPromise = this.cluster.connect();
      await this.connectingPromise;
      this.connectingPromise = null;
      
      this.isConnected = true;
      console.log('✅ Valkey Cluster conectado exitosamente');
      
      return this.cluster;

    } catch (error) {
      console.error('❌ Error conectando a Valkey Cluster:', error);
      this.isConnected = false;
      this.connectingPromise = null;
      
      // Si ya está conectando/conectado, devolver la instancia actual
      if (this.cluster && (this.cluster.status === 'ready' || this.cluster.status === 'connecting')) {
        return this.cluster;
      }

      throw error;
    }
  }

  setupEventListeners() {
    if (!this.cluster) return;

    this.cluster.on('connect', () => {
      console.log('🔌 Valkey Cluster conectado');
    });

    this.cluster.on('ready', () => {
      console.log('✅ Valkey Cluster listo para usar');
      this.isConnected = true;
    });

    this.cluster.on('error', (error) => {
      console.error('❌ Error en Valkey Cluster:', error);
      this.isConnected = false;
    });

    this.cluster.on('close', () => {
      console.log('🔌 Valkey Cluster desconectado');
      this.isConnected = false;
    });

    this.cluster.on('reconnecting', () => {
      console.log('🔄 Reconectando a Valkey Cluster...');
    });

    this.cluster.on('end', () => {
      console.log('🔚 Conexión Valkey Cluster terminada');
      this.isConnected = false;
    });
  }

  async disconnect() {
    if (this.cluster) {
      try {
        // Preferir QUIT; si falla, forzar disconnect
        await this.cluster.quit().catch(() => this.cluster.disconnect());
        console.log('✅ Valkey Cluster desconectado limpiamente');
      } catch (error) {
        console.error('❌ Error desconectando Valkey Cluster:', error);
      }
    }
    if (this.subscriber) {
      try {
        await this.subscriber.quit();
      } catch (error) {
        console.error('❌ Error desconectando suscriptor Valkey:', error);
      }
    }
    this.cluster = null;
    this.subscriber = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  getClient() {
    return this.cluster;
  }

  isHealthy() {
    return this.isConnected && this.cluster && this.cluster.status === 'ready';
  }

  // Métodos de operación seguros
  async safeGet(key) {
    try {
      if (!this.isHealthy()) return null;
      return await this.cluster.get(key);
    } catch (error) {
      console.error('❌ Error en safeGet:', error);
      return null;
    }
  }

  async safeSet(key, value, modeOrTtl = null, ttlSeconds = null) {
    try {
      if (!this.isHealthy()) return false;
      if (typeof modeOrTtl === 'string' && ttlSeconds != null) {
        return await this.cluster.set(key, value, modeOrTtl, ttlSeconds);
      }
      if (typeof modeOrTtl === 'number') {
        return await this.cluster.setex(key, modeOrTtl, value);
      }
      return await this.cluster.set(key, value);
    } catch (error) {
      console.error('❌ Error en safeSet:', error);
      return false;
    }
  }

  async safeDel(key) {
    try {
      if (!this.isHealthy()) return false;
      return await this.cluster.del(key);
    } catch (error) {
      console.error('❌ Error en safeDel:', error);
      return false;
    }
  }

  async safePublish(channel, message) {
    try {
      if (!this.isHealthy()) return false;
      return await this.cluster.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('❌ Error en safePublish:', error);
      return false;
    }
  }

  async ensureSubscriber() {
    if (this.subscriber && this.subscriber.status === 'ready') {
      return this.subscriber;
    }
    if (!this.nodes || !this.options) {
      throw new Error('Cluster no inicializado para crear suscriptor');
    }
    const subscriber = new Cluster(this.nodes, {
      ...this.options,
      redisOptions: {
        ...this.options.redisOptions,
        lazyConnect: false
      }
    });
    await subscriber.connect();
    this.subscriber = subscriber;
    return this.subscriber;
  }

  async createPubSubClientsForAdapter() {
    if (!this.nodes || !this.options) {
      // Asegurar que haya una conexión base para obtener nodos/opciones
      await this.connect();
    }
    const pubClient = new Cluster(this.nodes, {
      ...this.options,
      redisOptions: {
        ...this.options.redisOptions,
        lazyConnect: false
      }
    });
    const subClient = new Cluster(this.nodes, {
      ...this.options,
      redisOptions: {
        ...this.options.redisOptions,
        lazyConnect: false
      }
    });
    await Promise.all([pubClient.connect(), subClient.connect()]);
    return { pubClient, subClient };
  }

  async safeSubscribe(channels, onMessage) {
    try {
      if (!Array.isArray(channels)) channels = [channels];
      const sub = await this.ensureSubscriber();
      sub.removeAllListeners('message');
      sub.on('message', (channel, message) => {
        try {
          onMessage(channel, message);
        } catch (_) {
        }
      });
      await sub.subscribe(...channels);
      return true;
    } catch (error) {
      console.error('❌ Error en safeSubscribe:', error);
      return false;
    }
  }
}

// Singleton instance
let valkeyManager = null;

function getValkeyManager() {
  if (!valkeyManager) {
    valkeyManager = new ValkeyClusterManager();
  }
  return valkeyManager;
}

// ✅ FUNCIÓN PARA RESET COMPLETO DEL SINGLETON
function resetValkeyManager() {
  if (valkeyManager) {
    console.log('🧹 Reseteando Valkey Manager completamente...');
    try {
      valkeyManager.disconnect();
    } catch (error) {
      console.warn('⚠️ Error desconectando:', error.message);
    }
    valkeyManager = null;
    
    // ✅ FORZAR LIMPIEZA DE MÓDULOS
    delete require.cache[require.resolve('./valkey-cluster.js')];
    
    // ✅ ESPERAR UN MOMENTO PARA ASEGURAR LIMPIEZA
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
  return Promise.resolve();
}

module.exports = {
  ValkeyClusterManager,
  getValkeyManager,
  resetValkeyManager
};
