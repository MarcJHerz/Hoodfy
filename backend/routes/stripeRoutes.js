const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const stripeController = require('../controllers/stripeController');

router.post('/create-product-price', verifyToken, stripeController.createStripeProductAndPrice);
router.post('/create-checkout-session', verifyToken, stripeController.createCheckoutSession);
router.post('/create-portal-session', verifyToken, stripeController.createPortalSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.stripeWebhook);

// 🔄 Sincronizar precios de Stripe
router.post('/sync-prices', verifyToken, async (req, res) => {
  try {
    const PriceValidationService = require('../services/priceValidationService');
    
    const result = await PriceValidationService.syncAllPrices();
    
    res.json({
      message: 'Sincronización de precios completada',
      result
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error sincronizando precios',
      details: error.message 
    });
  }
});

// 🔍 Validar un priceId específico
router.post('/validate-price', verifyToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: 'PriceId requerido' });
    }
    
    const PriceValidationService = require('../services/priceValidationService');
    const validation = await PriceValidationService.validatePriceId(priceId);
    
    res.json({
      priceId,
      validation
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error validando precio',
      details: error.message 
    });
  }
});

module.exports = router; 