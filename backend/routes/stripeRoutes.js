const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const stripeController = require('../controllers/stripeController');

router.post('/create-product-price', verifyToken, stripeController.createStripeProductAndPrice);
router.post('/create-checkout-session', verifyToken, stripeController.createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.stripeWebhook);

module.exports = router; 