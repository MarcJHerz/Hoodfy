const rateLimit = require('express-rate-limit');

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
  keyGenerator: (req) => {
    // Usar IP real si está detrás de proxy
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Saltar health checks
    return req.path === '/health' || req.path === '/';
  }
});

// Rate limiter para autenticación (más permisivo)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 intentos de login por IP por ventana (aumentado de 10)
  message: {
    error: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `auth:${req.ip}`;
  },
  skip: (req) => {
    // Saltar rate limiting para health checks y endpoints de verificación
    return req.path === '/health' || req.path === '/' || req.path === '/verify-admin';
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
  keyGenerator: (req) => {
    // Usar user ID si está autenticado, sino IP
    const userId = req.user?.id;
    return userId ? `api:user:${userId}` : `api:ip:${req.ip}`;
  }
});

// Rate limiter para uploads (más permisivo para testing)
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 500, // 500 uploads por usuario por hora (aumentado de 50)
  message: {
    error: 'Límite de uploads excedido, intenta de nuevo en 1 hora',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
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
  keyGenerator: (req) => {
    const userId = req.user?.id;
    return userId ? `chat:user:${userId}` : `chat:ip:${req.ip}`;
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
  webhookRateLimit
};