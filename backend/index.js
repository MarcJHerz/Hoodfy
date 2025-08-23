const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('./config/firebase-admin');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

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
    /^https:\/\/.*\.amplifyapp\.com$/, // Para Amplify previews
    /^https:\/\/.*\.vercel\.app$/, // Para Vercel deployments
    /^https:\/\/.*\.ngrok\.io$/ // Para túneles ngrok
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

// ✅ Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/stripe-connect', stripeConnectRoutes);
app.use('/api/user', userStripeRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/allies', allyRoutes);
app.use('/api/community-stats', communityStatsRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chats', chatRoutes); // Nueva ruta para chats
app.use('/api/admin', adminRoutes); // Rutas de admin

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

// ✅ Iniciar el servidor con configuración de timeout
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: https://api.qahood.com y https://api.hoodfy.com`);
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