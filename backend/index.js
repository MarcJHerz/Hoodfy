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

// ✅ Middlewares - Configuración CORS mejorada para móviles
app.use(cors({
  origin: [
    'https://qahood.com',
    'https://www.qahood.com',
    'http://localhost:3000',
    'http://localhost:19006',
    'exp://192.168.1.100:8081', // Para Expo en desarrollo
    /^https:\/\/.*\.qahood\.com$/, // Cualquier subdominio de qahood.com
    /^https:\/\/.*\.amplifyapp\.com$/, // Para Amplify previews
    /^https:\/\/.*\.vercel\.app$/, // Para Vercel deployments
    /^http:\/\/localhost:\d+$/, // Para desarrollo local con cualquier puerto
    /^https:\/\/.*\.ngrok\.io$/, // Para túneles ngrok
    '*' // Temporal para debugging móvil - QUITAR EN PRODUCCIÓN
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

// Middleware adicional para manejar preflight OPTIONS en móviles
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS preflight request:', {
      url: req.url,
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    });
    
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Accept-Language, Accept-Encoding, Content-Length');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache por 24 horas
    res.status(204).send();
  } else {
    next();
  }
});

// Middleware para debugging de requests desde móviles y Stripe
app.use((req, res, next) => {
  // Log específico para requests POST desde móviles
  if (req.method === 'POST' && req.path.includes('/api/posts')) {
    console.log('📱 POST Request a /api/posts:', {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'origin': req.headers.origin,
        'authorization': req.headers.authorization ? 'Present' : 'Missing'
      },
      body: req.body ? 'Body present' : 'No body',
      files: req.files ? `${req.files.length} files` : 'No files yet',
      query: req.query
    });
  }
  
  // Log específico para requests a Stripe
  if (req.method === 'POST' && req.path.includes('/api/stripe')) {
    console.log('💳 POST Request a Stripe:', {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'Present' : 'Missing'
      },
      body: req.body,
      stripeConfigured: !!require('./config/stripe')
    });
  }
  
  next();
});

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
const uploadRoutes = require('./routes/uploadRoutes');

// ✅ Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/allies', allyRoutes);
app.use('/api/community-stats', communityStatsRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stripe', stripeRoutes);
app.use('/api/upload', uploadRoutes);

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

// ✅ Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// ✅ Iniciar el servidor con configuración de timeout
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: https://api.qahood.com`);
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