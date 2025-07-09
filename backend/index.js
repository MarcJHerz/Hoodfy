const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('./config/firebase-admin');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares - Configuración CORS mejorada para móviles
app.use(cors({
  origin: [
    'https://qahood.com',
    'https://www.qahood.com',
    'http://localhost:3000',
    'http://localhost:19006',
    'exp://192.168.1.100:8081', // Para Expo en desarrollo
    /^https:\/\/.*\.qahood\.com$/ // Cualquier subdominio de qahood.com
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
    'Cache-Control'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Configurar límites de tamaño para archivos grandes (hasta 500MB)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Middleware adicional para manejar preflight OPTIONS en móviles
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).send();
  } else {
    next();
  }
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

// ✅ Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: https://api.qahood.com`);
}); 