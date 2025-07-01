const rateLimit = require('express-rate-limit');

// Configuración del rate limiter
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP en 15 minutos
  message: {
    error: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
  },
  standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
});

module.exports = rateLimiter; 