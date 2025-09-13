const rateLimit = require('express-rate-limit');
const { getValkeyManager } = require('../config/valkey-cluster');

// Usar el mismo manager de Valkey que el resto de la aplicación
const valkeyManager = getValkeyManager();

// Store personalizado para rate limiting distribuido
const createRedisStore = () => {
  return {
    async increment(key, options) {
      const now = Date.now();
      const windowMs = options.windowMs;
      const max = options.max;
      
      // Crear clave con timestamp de ventana
      const window = Math.floor(now / windowMs);
      const redisKey = `rate_limit:${key}:${window}`;
      
      try {
        // Usar el cluster de Valkey existente
        const cluster = valkeyManager.cluster;
        if (!cluster || cluster.status !== 'ready') {
          throw new Error('Valkey cluster no disponible');
        }
        
        const pipeline = cluster.pipeline();
        pipeline.incr(redisKey);
        pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
        
        const results = await pipeline.exec();
        const count = results[0][1];
        
        return {
          totalHits: count,
          resetTime: new Date((window + 1) * windowMs),
          remaining: Math.max(0, max - count)
        };
      } catch (error) {
        console.error('Error en Valkey store para rate limiting:', error);
        // Fallback: permitir la request si Valkey falla
        return {
          totalHits: 1,
          resetTime: new Date(now + windowMs),
          remaining: max - 1
        };
      }
    }
  };
};

// Rate limiter global (muy restrictivo)
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    // Usar IP real si está detrás de proxy
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Saltar health checks
    return req.path === '/health' || req.path === '/';
  }
});

// Rate limiter para autenticación (muy restrictivo)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por IP por ventana
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    return `auth:${req.ip}`;
  }
});

// Rate limiter para API general (moderado)
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por usuario por ventana
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    // Usar user ID si está autenticado, sino IP
    const userId = req.user?.id;
    return userId ? `api:user:${userId}` : `api:ip:${req.ip}`;
  }
});

// Rate limiter para uploads (muy restrictivo)
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 uploads por usuario por hora
  message: {
    error: 'Límite de uploads excedido, intenta de nuevo en 1 hora',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `upload:user:${userId}` : `upload:ip:${req.ip}`;
  }
});

// Rate limiter para chat (moderado)
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 mensajes por usuario por minuto
  message: {
    error: 'Demasiados mensajes, espera un momento',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `chat:user:${userId}` : `chat:ip:${req.ip}`;
  }
});

// Rate limiter para búsquedas (moderado)
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por usuario por minuto
  message: {
    error: 'Demasiadas búsquedas, espera un momento',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `search:user:${userId}` : `search:ip:${req.ip}`;
  }
});

// Rate limiter para webhooks (muy restrictivo)
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por IP por minuto
  message: {
    error: 'Demasiados webhooks, intenta de nuevo más tarde',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore(),
  keyGenerator: (req) => {
    return `webhook:${req.ip}`;
  }
});

module.exports = {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  chatRateLimit,
  searchRateLimit,
  webhookRateLimit
};