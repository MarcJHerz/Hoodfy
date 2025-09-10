const Redis = require('ioredis');

class RedisClusterManager {
  constructor() {
    this.cluster = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectingPromise = null; // ✅ PROMESA DE CONEXIÓN COMPARTIDA
  }

  async connect() {
    try {
      // ✅ VERIFICAR SI YA ESTÁ CONECTADO
      if (this.isConnected && this.cluster && this.cluster.status === 'ready') {
        console.log('✅ Redis Cluster ya está conectado, reutilizando conexión existente');
        return this.cluster;
      }

      // ✅ VERIFICAR SI YA ESTÁ CONECTANDO - USAR PROMESA COMPARTIDA
      if (this.connectingPromise) {
        console.log('⏳ Redis Cluster ya está conectando, esperando promesa compartida...');
        return this.connectingPromise;
      }

      // ✅ CREAR PROMESA DE CONEXIÓN COMPARTIDA
      this.connectingPromise = this._doConnect();
      return this.connectingPromise;

    } catch (error) {
      this.connectingPromise = null; // Limpiar promesa en caso de error
      throw error;
    }
  }

  async _doConnect() {
    try {
      // ✅ DESTRUIR INSTANCIA ANTERIOR SI EXISTE
      if (this.cluster) {
        console.log('🧹 Limpiando instancia anterior de Redis Cluster...');
        try {
          // Forzar desconexión inmediata
          this.cluster.disconnect();
          await this.cluster.quit();
        } catch (cleanupError) {
          console.warn('⚠️ Error limpiando instancia anterior:', cleanupError.message);
        }
        this.cluster = null;
        this.isConnected = false;
      }

      console.log('🔄 Conectando a Redis Cluster...');

      // ✅ ESPERAR MÁS TIEMPO PARA ASEGURAR LIMPIEZA COMPLETA
      console.log('⏳ Esperando 3 segundos para limpieza completa...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // ✅ VERIFICAR QUE NO HAY INSTANCIA ACTIVA
      if (this.cluster && this.cluster.status === 'connecting') {
        console.log('⚠️ Instancia aún conectando, esperando más tiempo...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.cluster = null;
        this.isConnected = false;
      }

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
          // ✅ SOLO USAR CONTRASEÑA SI ESTÁ DEFINIDA Y NO ESTÁ VACÍA
          password: (process.env.VALKEY_PASSWORD && process.env.VALKEY_PASSWORD.trim() !== '') 
            ? process.env.VALKEY_PASSWORD 
            : (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '') 
              ? process.env.REDIS_PASSWORD 
              : undefined,
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
          // ✅ SOLO USAR CONTRASEÑA SI ESTÁ DEFINIDA Y NO ESTÁ VACÍA
          password: (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '') 
            ? process.env.REDIS_PASSWORD 
            : undefined,
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

      // ✅ LIMPIAR PROMESA DE CONEXIÓN
      this.connectingPromise = null;
      return this.cluster;

    } catch (error) {
      console.error('❌ Error conectando a Valkey Cluster:', error);
      this.isConnected = false;
      this.connectingPromise = null; // ✅ LIMPIAR PROMESA EN CASO DE ERROR
      
      // Intentar reconexión si no hemos superado el límite
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        // ✅ RESET COMPLETO ANTES DE RECONECTAR
        await this.reset();
        
        // Esperar antes de reconectar (tiempo exponencial)
        const waitTime = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
        console.log(`⏳ Esperando ${waitTime}ms antes de reconectar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // ✅ VERIFICAR QUE NO HAY INSTANCIA ACTIVA
        if (this.cluster && this.cluster.status === 'connecting') {
          console.log('⚠️ Instancia aún conectando, esperando más tiempo...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          this.cluster = null;
          this.isConnected = false;
        }
        
        return this._doConnect();
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
    // ✅ LIMPIAR ESTADO COMPLETAMENTE
    this.cluster = null;
    this.isConnected = false;
    this.connectingPromise = null;
    this.reconnectAttempts = 0;
  }

  // ✅ MÉTODO PARA RESET COMPLETO
  async reset() {
    console.log('🔄 Reseteando Redis Cluster Manager...');
    await this.disconnect();
    this.cluster = null;
    this.isConnected = false;
    this.connectingPromise = null;
    this.reconnectAttempts = 0;
  }

  // ✅ MÉTODO DE EMERGENCIA PARA DETENER BUCLE
  async emergencyStop() {
    console.log('🚨 DETENIENDO BUCLE DE RECONEXIÓN DE EMERGENCIA...');
    this.reconnectAttempts = this.maxReconnectAttempts + 1; // Forzar parada
    if (this.cluster) {
      try {
        this.cluster.disconnect();
        await this.cluster.quit();
      } catch (error) {
        console.warn('⚠️ Error en parada de emergencia:', error.message);
      }
    }
    this.cluster = null;
    this.isConnected = false;
    this.connectingPromise = null;
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
