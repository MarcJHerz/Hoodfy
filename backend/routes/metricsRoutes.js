const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  getDashboardMetrics, 
  getGrowthMetrics, 
  getCommunityAnalytics 
} = require('../controllers/metricsController');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener métricas generales del dashboard
router.get('/dashboard', getDashboardMetrics);

// Obtener métricas de crecimiento por período
router.get('/growth', getGrowthMetrics);

// Obtener análisis de comunidades
router.get('/communities', getCommunityAnalytics);

module.exports = router;
