const { RateLimiterRedis } = require('rate-limiter-flexible');
const { getValkeyManager } = require('../config/valkey-cluster');

// Usar el mismo manager de Valkey que el resto de la aplicación
const valkeyManager = getValkeyManager();

// Rate limiter para mensajes de chat
const chatMessageLimiter = new RateLimiterRedis({
  storeClient: valkeyManager.cluster,
  keyPrefix: 'chat_message',
  points: 60, // 60 mensajes
  duration: 60, // por minuto
  blockDuration: 60, // bloquear por 60 segundos si excede
});

// Rate limiter para eventos de conexión
const connectionLimiter = new RateLimiterRedis({
  storeClient: valkeyManager.cluster,
  keyPrefix: 'socket_connection',
  points: 10, // 10 conexiones
  duration: 60, // por minuto
  blockDuration: 300, // bloquear por 5 minutos si excede
});

// Rate limiter para eventos de room
const roomEventLimiter = new RateLimiterRedis({
  storeClient: valkeyManager.cluster,
  keyPrefix: 'room_event',
  points: 100, // 100 eventos de room
  duration: 60, // por minuto
  blockDuration: 60, // bloquear por 60 segundos si excede
});

// Rate limiter para eventos de typing
const typingLimiter = new RateLimiterRedis({
  storeClient: valkeyManager.cluster,
  keyPrefix: 'typing_event',
  points: 30, // 30 eventos de typing
  duration: 60, // por minuto
  blockDuration: 30, // bloquear por 30 segundos si excede
});

// Middleware para rate limiting de Socket.io
const socketRateLimiter = (io) => {
  io.use(async (socket, next) => {
    try {
      const userId = socket.user?.id || socket.handshake.auth?.userId;
      const ip = socket.handshake.address;
      const key = userId ? `user:${userId}` : `ip:${ip}`;

      // Verificar límite de conexión
      await connectionLimiter.consume(key);
      next();
    } catch (rejRes) {
      console.warn(`Rate limit excedido para conexión: ${socket.handshake.address}`);
      next(new Error('Demasiadas conexiones, intenta de nuevo más tarde'));
    }
  });

  // Rate limiting por evento
  io.on('connection', (socket) => {
    const userId = socket.user?.id || socket.handshake.auth?.userId;
    const ip = socket.handshake.address;
    const userKey = userId ? `user:${userId}` : `ip:${ip}`;

    // Rate limiting para mensajes de chat
    socket.on('send_message', async (data, callback) => {
      try {
        await chatMessageLimiter.consume(userKey);
        // El evento se procesará normalmente
        socket.emit('message_allowed', data);
      } catch (rejRes) {
        console.warn(`Rate limit excedido para mensaje: ${userKey}`);
        if (callback) {
          callback({
            error: 'Demasiados mensajes, espera un momento',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
          });
        }
        return;
      }
    });

    // Rate limiting para eventos de room
    socket.on('join_room', async (data, callback) => {
      try {
        await roomEventLimiter.consume(userKey);
        // El evento se procesará normalmente
        socket.emit('room_join_allowed', data);
      } catch (rejRes) {
        console.warn(`Rate limit excedido para join_room: ${userKey}`);
        if (callback) {
          callback({
            error: 'Demasiados cambios de room, espera un momento',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
          });
        }
        return;
      }
    });

    socket.on('leave_room', async (data, callback) => {
      try {
        await roomEventLimiter.consume(userKey);
        // El evento se procesará normalmente
        socket.emit('room_leave_allowed', data);
      } catch (rejRes) {
        console.warn(`Rate limit excedido para leave_room: ${userKey}`);
        if (callback) {
          callback({
            error: 'Demasiados cambios de room, espera un momento',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
          });
        }
        return;
      }
    });

    // Rate limiting para eventos de typing
    socket.on('typing_start', async (data, callback) => {
      try {
        await typingLimiter.consume(userKey);
        // El evento se procesará normalmente
        socket.emit('typing_allowed', data);
      } catch (rejRes) {
        console.warn(`Rate limit excedido para typing: ${userKey}`);
        if (callback) {
          callback({
            error: 'Demasiados eventos de typing, espera un momento',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
          });
        }
        return;
      }
    });

    socket.on('typing_stop', async (data, callback) => {
      try {
        await typingLimiter.consume(userKey);
        // El evento se procesará normalmente
        socket.emit('typing_stop_allowed', data);
      } catch (rejRes) {
        console.warn(`Rate limit excedido para typing_stop: ${userKey}`);
        if (callback) {
          callback({
            error: 'Demasiados eventos de typing, espera un momento',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000)
          });
        }
        return;
      }
    });
  });
};

module.exports = {
  socketRateLimiter,
  chatMessageLimiter,
  connectionLimiter,
  roomEventLimiter,
  typingLimiter
};
