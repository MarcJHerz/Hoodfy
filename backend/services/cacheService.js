const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keyPrefix: 'hoodfy:',
      // Configuración de cluster si está disponible
      enableReadyCheck: true,
      maxLoadingTimeout: 10000,
      // Configuración de pool
      family: 4,
      db: 0
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.redis.on('connect', () => {
      logger.logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.logError(error, { service: 'cache' });
    });

    this.redis.on('ready', () => {
      logger.logger.info('Redis is ready');
    });
  }

  // Métodos básicos de cache
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.logError(error, { operation: 'cache_get', key });
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache_set', key });
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache_del', key });
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.redis.exists(key);
    } catch (error) {
      logger.logError(error, { operation: 'cache_exists', key });
      return false;
    }
  }

  // Cache de usuarios
  async getUserProfile(userId) {
    const cacheKey = `user:${userId}:profile`;
    const cached = await this.get(cacheKey);
    
    if (cached) {
      logger.logPerformance('user_profile_cache_hit', 0, { userId });
      return cached;
    }

    logger.logPerformance('user_profile_cache_miss', 0, { userId });
    return null;
  }

  async setUserProfile(userId, userData, ttl = 3600) {
    const cacheKey = `user:${userId}:profile`;
    return await this.set(cacheKey, userData, ttl);
  }

  async invalidateUserProfile(userId) {
    const cacheKey = `user:${userId}:profile`;
    return await this.del(cacheKey);
  }

  // Cache de comunidades
  async getCommunityData(communityId) {
    const cacheKey = `community:${communityId}:data`;
    const cached = await this.get(cacheKey);
    
    if (cached) {
      logger.logPerformance('community_cache_hit', 0, { communityId });
      return cached;
    }

    logger.logPerformance('community_cache_miss', 0, { communityId });
    return null;
  }

  async setCommunityData(communityId, communityData, ttl = 1800) {
    const cacheKey = `community:${communityId}:data`;
    return await this.set(cacheKey, communityData, ttl);
  }

  async invalidateCommunityData(communityId) {
    const cacheKey = `community:${communityId}:data`;
    return await this.del(cacheKey);
  }

  // Cache de posts
  async getCommunityPosts(communityId, page = 1, limit = 20) {
    const cacheKey = `community:${communityId}:posts:${page}:${limit}`;
    const cached = await this.get(cacheKey);
    
    if (cached) {
      logger.logPerformance('posts_cache_hit', 0, { communityId, page });
      return cached;
    }

    logger.logPerformance('posts_cache_miss', 0, { communityId, page });
    return null;
  }

  async setCommunityPosts(communityId, page, limit, posts, ttl = 300) {
    const cacheKey = `community:${communityId}:posts:${page}:${limit}`;
    return await this.set(cacheKey, posts, ttl);
  }

  async invalidateCommunityPosts(communityId) {
    // Eliminar todos los posts de la comunidad
    const keys = await this.redis.keys(`community:${communityId}:posts:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache de sesiones
  async getSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    return await this.get(cacheKey);
  }

  async setSession(sessionId, sessionData, ttl = 86400) {
    const cacheKey = `session:${sessionId}`;
    return await this.set(cacheKey, sessionData, ttl);
  }

  async invalidateSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    return await this.del(cacheKey);
  }

  // Cache de rate limiting
  async incrementRateLimit(key, window = 3600) {
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, window);
      }
      return current;
    } catch (error) {
      logger.logError(error, { operation: 'rate_limit_increment', key });
      return 0;
    }
  }

  async getRateLimit(key) {
    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.logError(error, { operation: 'rate_limit_get', key });
      return 0;
    }
  }

  // Cache de estadísticas
  async getStats(key) {
    const cacheKey = `stats:${key}`;
    return await this.get(cacheKey);
  }

  async setStats(key, stats, ttl = 600) {
    const cacheKey = `stats:${key}`;
    return await this.set(cacheKey, stats, ttl);
  }

  // Cache de búsquedas
  async getSearchResults(query, filters = {}) {
    const cacheKey = `search:${this.hashQuery(query, filters)}`;
    return await this.get(cacheKey);
  }

  async setSearchResults(query, filters, results, ttl = 1800) {
    const cacheKey = `search:${this.hashQuery(query, filters)}`;
    return await this.set(cacheKey, results, ttl);
  }

  // Cache de notificaciones
  async getUnreadNotifications(userId) {
    const cacheKey = `notifications:${userId}:unread`;
    return await this.get(cacheKey);
  }

  async setUnreadNotifications(userId, count) {
    const cacheKey = `notifications:${userId}:unread`;
    return await this.set(cacheKey, count, 300);
  }

  async incrementUnreadNotifications(userId) {
    const cacheKey = `notifications:${userId}:unread`;
    try {
      return await this.redis.incr(cacheKey);
    } catch (error) {
      logger.logError(error, { operation: 'increment_unread_notifications', userId });
      return 0;
    }
  }

  // Cache de métricas de negocio
  async getBusinessMetrics(metricType, timeRange) {
    const cacheKey = `metrics:${metricType}:${timeRange}`;
    return await this.get(cacheKey);
  }

  async setBusinessMetrics(metricType, timeRange, metrics, ttl = 3600) {
    const cacheKey = `metrics:${metricType}:${timeRange}`;
    return await this.set(cacheKey, metrics, ttl);
  }

  // Métodos de utilidad
  hashQuery(query, filters) {
    const combined = JSON.stringify({ query, filters });
    return require('crypto').createHash('md5').update(combined).digest('hex');
  }

  async flushAll() {
    try {
      await this.redis.flushall();
      logger.logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache_flush' });
      return false;
    }
  }

  async getStats() {
    try {
      const info = await this.redis.info();
      const memory = await this.redis.memory('usage');
      
      return {
        connected: this.redis.status === 'ready',
        memoryUsage: memory,
        totalKeys: await this.redis.dbsize(),
        uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1] || 0
      };
    } catch (error) {
      logger.logError(error, { operation: 'cache_stats' });
      return { connected: false };
    }
  }

  // Métodos para cache distribuido
  async publish(channel, message) {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.logError(error, { operation: 'cache_publish', channel });
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      const subscriber = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      });

      await subscriber.subscribe(channel);
      subscriber.on('message', (chan, message) => {
        callback(JSON.parse(message));
      });

      return subscriber;
    } catch (error) {
      logger.logError(error, { operation: 'cache_subscribe', channel });
      return null;
    }
  }

  // Métodos para cache de archivos
  async getFileUrl(fileKey) {
    const cacheKey = `file:${fileKey}:url`;
    return await this.get(cacheKey);
  }

  async setFileUrl(fileKey, url, ttl = 86400) {
    const cacheKey = `file:${fileKey}:url`;
    return await this.set(cacheKey, url, ttl);
  }

  // Métodos para cache de configuración
  async getConfig(key) {
    const cacheKey = `config:${key}`;
    return await this.get(cacheKey);
  }

  async setConfig(key, value, ttl = 3600) {
    const cacheKey = `config:${key}`;
    return await this.set(cacheKey, value, ttl);
  }

  // Método para limpiar cache por patrón
  async clearPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.logger.info(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      logger.logError(error, { operation: 'clear_pattern', pattern });
      return 0;
    }
  }
}

module.exports = CacheService;
