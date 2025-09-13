const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('./config/firebase-admin');
require('dotenv').config();
const path = require('path');
const http = require('http'); // Agregar para Socket.io

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Crear servidor HTTP para Socket.io
const server = http.createServer(app);

// ✅ Configurar trust proxy para servidor detrás de proxy/load balancer
app.set('trust proxy', 1);

// ✅ Middlewares - Configuración CORS mejorada para múltiples dominios
app.use(cors({
  origin: [
    'https://qahood.com',
    'https://www.qahood.com',
    'https://hoodfy.com',
    'https://www.hoodfy.com',
    /^https:\/\/.*\.qahood\.com$/, // Cualquier subdominio de qahood.com
    /^https:\/\/.*\.hoodfy\.com$/, // Cualquier subdominio de hoodfy.com
    /^https:\/\/.*\.amplifyapp\.com$/ // Para Amplify previews
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'Cache-Control',
    'Accept-Language',
    'Accept-Encoding',
    'Content-Length'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight por 24 horas
}));

// Configurar límites de tamaño para archivos grandes (hasta 500MB)
// EXCLUIR el webhook de Stripe del parsing de JSON
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') {
    // Para el webhook de Stripe, guardar el raw body
    req.rawBody = '';
    req.on('data', chunk => {
      req.rawBody += chunk;
    });
    req.on('end', () => {
      next();
    });
  } else {
    // Para todas las otras rutas, usar el middleware JSON normal
    express.json({ limit: '500mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// ✅ Importar rate limiters
const {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  chatRateLimit,
  webhookRateLimit
} = require('./middleware/rateLimiter');

// ✅ Importar rutas
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const communitiesRoutes = require('./routes/communitiesRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const postRoutes = require('./routes/postsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const allyRoutes = require('./routes/allyRoutes');
const communityStatsRoutes = require('./routes/communityStatsRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const stripeConnectRoutes = require('./routes/stripeConnectRoutes');
const userStripeRoutes = require('./routes/userStripeRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes'); // Nueva ruta
const adminRoutes = require('./routes/adminRoutes'); // Rutas de admin

// ✅ Health check endpoint para ALB (sin rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Hoodfy Backend API'
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Hoodfy Backend API',
    version: '1.0.0'
  });
});

// ✅ Aplicar rate limiting global
app.use(globalRateLimit);

// ✅ Rutas con rate limiting específico
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/upload', uploadRateLimit, uploadRoutes);
app.use('/api/chats', chatRateLimit, chatRoutes);
app.use('/api/stripe/webhook', webhookRateLimit, stripeRoutes);

// ✅ Rutas con rate limiting general de API
app.use('/api/users', apiRateLimit, userRoutes);
app.use('/api/posts', apiRateLimit, postRoutes);
app.use('/api/communities', apiRateLimit, communitiesRoutes);
app.use('/api/subscriptions', apiRateLimit, subscriptionsRoutes);
app.use('/api/stripe', apiRateLimit, stripeRoutes);
app.use('/api/stripe-connect', apiRateLimit, stripeConnectRoutes);
app.use('/api/user', apiRateLimit, userStripeRoutes);
app.use('/api/metrics', apiRateLimit, metricsRoutes);
app.use('/api/comments', apiRateLimit, commentRoutes);
app.use('/api/allies', apiRateLimit, allyRoutes);
app.use('/api/community-stats', apiRateLimit, communityStatsRoutes);
app.use('/api/notifications', apiRateLimit, require('./routes/notificationRoutes'));
app.use('/api/admin', apiRateLimit, adminRoutes);

// ✅ Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('🚨 Error global capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    headers: {
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin,
      'authorization': req.headers.authorization ? 'Present' : 'Missing'
    },
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ✅ Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Configurar CORS para archivos estáticos
    res.set('Access-Control-Allow-Origin', '*');
    // Configurar cache-control para optimizar el rendimiento
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// ✅ Servir imágenes por defecto del frontend
app.use('/images', express.static(path.join(__dirname, '../frontend/web/public/images'), {
  setHeaders: (res, path) => {
    // Configurar CORS para archivos estáticos
    res.set('Access-Control-Allow-Origin', '*');
    // Configurar cache-control para optimizar el rendimiento
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// ✅ Verificar variables de entorno críticas
console.log('🔍 Verificando configuración de Stripe...');
console.log('📋 Variables de entorno disponibles:', {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'Presente (sk_...)' : 'No encontrada',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'Presente (whsec_...)' : 'No encontrada',
  STRIPE_WEBHOOK_SECRET_HOODFY: process.env.STRIPE_WEBHOOK_SECRET_HOODFY ? 'Presente (whsec_...)' : 'No encontrada',
  FRONTEND_URL: process.env.FRONTEND_URL || 'No definida',
  FRONTEND_URL_HOODFY: process.env.FRONTEND_URL_HOODFY || 'No definida',
  NODE_ENV: process.env.NODE_ENV || 'No definida'
});

console.log('🌐 Webhooks configurados:');
console.log('   - Qahood.com:', process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌');
console.log('   - Hoodfy.com:', process.env.STRIPE_WEBHOOK_SECRET_HOODFY ? '✅' : '❌');

// ✅ Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// ✅ INICIALIZAR CHAT SERVICE (DIFERIDO)
let chatService;
setTimeout(async () => {
  try {
    console.log('🔄 Inicializando Chat Service después de limpieza...');
    const ChatService = require('./services/chatService');
    chatService = new ChatService(server);
    global.chatService = chatService; // Hacer disponible globalmente
    console.log('✅ Chat Service inicializado correctamente');
    console.log('🔌 Socket.io configurado para chat en tiempo real');
  } catch (error) {
    console.error('❌ Error inicializando Chat Service:', error);
    console.log('⚠️ El chat en tiempo real no estará disponible');
  }
}, 5000); // Esperar 5 segundos para limpieza completa

// ✅ Iniciar el servidor con configuración de timeout
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: https://api.qahood.com y https://api.hoodfy.com`);
  
  if (chatService) {
    console.log('💬 Chat en tiempo real disponible en Socket.io');
    console.log('📊 Estadísticas del chat:', chatService.getStats());
  }
});

// Configurar timeouts para archivos grandes
server.timeout = 300000; // 5 minutos
server.keepAliveTimeout = 65000; // 65 segundos
server.headersTimeout = 66000; // 66 segundos

console.log('⏱️ Timeouts configurados:', {
  serverTimeout: server.timeout,
  keepAliveTimeout: server.keepAliveTimeout,
  headersTimeout: server.headersTimeout
});

// ✅ Manejo de señales para shutdown graceful
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM recibido, cerrando servidor...');
  if (chatService) {
    chatService.cleanup();
  }
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT recibido, cerrando servidor...');
  if (chatService) {
    chatService.cleanup();
  }
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
}); 