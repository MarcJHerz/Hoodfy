const { Cluster } = require('ioredis');

class ValkeyClusterManager {
  constructor() {
    this.cluster = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3; // Reducir intentos para pruebas
  }

  async connect() {
    try {
      // ✅ DESTRUIR INSTANCIA ANTERIOR SI EXISTE
      if (this.cluster) {
        console.log('🧹 Limpiando instancia anterior de Valkey Cluster...');
        try {
          this.cluster.disconnect();
          await this.cluster.quit();
        } catch (cleanupError) {
          console.warn('⚠️ Error limpiando instancia anterior:', cleanupError.message);
        }
        this.cluster = null;
        this.isConnected = false;
      }

      console.log('🔄 Conectando a Valkey Cluster...');
      
      // ✅ ESPERAR UN MOMENTO PARA ASEGURAR LIMPIEZA COMPLETA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Configuración específica para Valkey Cluster
      const clusterConfig = {
        nodes: [
          {
            host: process.env.VALKEY_CLUSTER_HOST || 'clustercfg.hoodfy-valkey-cluster.yqqefg.use1.cache.amazonaws.com',
            port: parseInt(process.env.VALKEY_CLUSTER_PORT) || 6379
          }
        ],
        redisOptions: {
          password: (process.env.VALKEY_PASSWORD && process.env.VALKEY_PASSWORD.trim() !== '')
            ? process.env.VALKEY_PASSWORD
            : undefined,
          connectTimeout: 10000,
          lazyConnect: true,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          retryDelayOnClusterDown: 300,
          enableOfflineQueue: false,
          maxLoadingTimeout: 10000,
          enableReadyCheck: true,
          scaleReads: 'slave'
        },
        clusterRetryDelayOnFailover: 100,
        clusterRetryDelayOnClusterDown: 300,
        clusterMaxRedirections: 16,
        clusterScaleReads: 'slave',
        enableOfflineQueue: false,
        maxLoadingTimeout: 10000,
        enableReadyCheck: true
      };

      console.log('🔧 Configuración Valkey Cluster:', {
        host: clusterConfig.nodes[0].host,
        port: clusterConfig.nodes[0].port,
        hasPassword: !!clusterConfig.redisOptions.password,
        connectTimeout: clusterConfig.redisOptions.connectTimeout
      });

      // Crear instancia de cluster
      this.cluster = new Cluster(clusterConfig.nodes, clusterConfig);

      // Configurar event listeners
      this.setupEventListeners();

      // Conectar
      await this.cluster.connect();
      
      this.isConnected = true;
      console.log('✅ Valkey Cluster conectado exitosamente');
      
      return this.cluster;

    } catch (error) {
      console.error('❌ Error conectando a Valkey Cluster:', error);
      this.isConnected = false;
      
      // Intentar reconexión si no hemos superado el límite
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        // Esperar antes de reconectar
        const waitTime = 2000 * this.reconnectAttempts;
        console.log(`⏳ Esperando ${waitTime}ms antes de reconectar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        return this.connect();
      }
      
      console.error('❌ Máximo de intentos de reconexión alcanzado');
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
        await this.cluster.quit();
        console.log('✅ Valkey Cluster desconectado limpiamente');
      } catch (error) {
        console.error('❌ Error desconectando Valkey Cluster:', error);
      }
    }
    this.cluster = null;
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

  async safeSet(key, value, ttl = null) {
    try {
      if (!this.isHealthy()) return false;
      if (ttl) {
        return await this.cluster.setex(key, ttl, value);
      } else {
        return await this.cluster.set(key, value);
      }
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
