// Rate limiting simple para Socket.io (sin Redis por ahora)
// TODO: Implementar rate limiting distribuido con Valkey más adelante

// Rate limiter simple en memoria para mensajes de chat
const chatMessageLimiter = {
  limits: new Map(),
  async consume(key) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const max = 60; // 60 mensajes
    
    const window = Math.floor(now / windowMs);
    const redisKey = `chat_message:${key}:${window}`;
    
    if (!this.limits.has(redisKey)) {
      this.limits.set(redisKey, { count: 0, resetTime: (window + 1) * windowMs });
    }
    
    const limit = this.limits.get(redisKey);
    limit.count++;
    
    if (limit.count > max) {
      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = limit.resetTime - now;
      throw error;
    }
    
    return { totalHits: limit.count, remaining: max - limit.count };
  }
};

// Rate limiter simple para conexiones
const connectionLimiter = {
  limits: new Map(),
  async consume(key) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const max = 10; // 10 conexiones
    
    const window = Math.floor(now / windowMs);
    const redisKey = `socket_connection:${key}:${window}`;
    
    if (!this.limits.has(redisKey)) {
      this.limits.set(redisKey, { count: 0, resetTime: (window + 1) * windowMs });
    }
    
    const limit = this.limits.get(redisKey);
    limit.count++;
    
    if (limit.count > max) {
      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = limit.resetTime - now;
      throw error;
    }
    
    return { totalHits: limit.count, remaining: max - limit.count };
  }
};

// Rate limiter simple para eventos de room
const roomEventLimiter = {
  limits: new Map(),
  async consume(key) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const max = 100; // 100 eventos
    
    const window = Math.floor(now / windowMs);
    const redisKey = `room_event:${key}:${window}`;
    
    if (!this.limits.has(redisKey)) {
      this.limits.set(redisKey, { count: 0, resetTime: (window + 1) * windowMs });
    }
    
    const limit = this.limits.get(redisKey);
    limit.count++;
    
    if (limit.count > max) {
      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = limit.resetTime - now;
      throw error;
    }
    
    return { totalHits: limit.count, remaining: max - limit.count };
  }
};

// Rate limiter simple para eventos de typing
const typingLimiter = {
  limits: new Map(),
  async consume(key) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const max = 30; // 30 eventos
    
    const window = Math.floor(now / windowMs);
    const redisKey = `typing_event:${key}:${window}`;
    
    if (!this.limits.has(redisKey)) {
      this.limits.set(redisKey, { count: 0, resetTime: (window + 1) * windowMs });
    }
    
    const limit = this.limits.get(redisKey);
    limit.count++;
    
    if (limit.count > max) {
      const error = new Error('Rate limit exceeded');
      error.msBeforeNext = limit.resetTime - now;
      throw error;
    }
    
    return { totalHits: limit.count, remaining: max - limit.count };
  }
};

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
