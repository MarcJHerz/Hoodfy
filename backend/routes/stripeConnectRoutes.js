const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createConnectAccount,
  getConnectAccountStatus,
  createOnboardingLink,
  createLoginLink,
  getCreatorPayouts,
  getCreatorEarningsOverview
} = require('../controllers/stripeConnectController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Crear cuenta de Stripe Connect para una comunidad
router.post('/accounts', createConnectAccount);

// Obtener estado de la cuenta de Stripe Connect
router.get('/accounts/:communityId/status', getConnectAccountStatus);

// Crear link de onboarding
router.post('/accounts/:communityId/onboarding', createOnboardingLink);

// Crear link de login
router.post('/accounts/:communityId/login', createLoginLink);

// Obtener historial de payouts de un creador
router.get('/communities/:communityId/payouts', getCreatorPayouts);

// Obtener resumen de ganancias de todas las comunidades
router.get('/earnings/overview', getCreatorEarningsOverview);

module.exports = router;
