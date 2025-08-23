const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const stripe = require('../config/stripe');
const User = require('../models/User');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear cuenta de Stripe Connect para el usuario
router.post('/stripe-connect/account', async (req, res) => {
  try {
    console.log('🏗️ Iniciando creación de cuenta de Stripe Connect para usuario...');
    console.log('👤 Usuario ID:', req.userId);
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { accountType = 'express', country = 'US' } = req.body;
    
    // Verificar que el usuario no tenga ya una cuenta de Stripe Connect
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.stripeConnectAccountId) {
      return res.status(400).json({ 
        error: 'Ya tienes una cuenta de Stripe Connect configurada',
        accountId: user.stripeConnectAccountId
      });
    }

    console.log('✅ Validaciones pasadas, creando cuenta de Stripe Connect...');

    // Crear cuenta de Stripe Connect
    const accountData = {
      type: accountType,
      country: country,
      email: user.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    };

    console.log('📋 Datos de cuenta a enviar a Stripe:', JSON.stringify(accountData, null, 2));

    const account = await stripe.accounts.create(accountData);
    
    console.log('✅ Cuenta de Stripe Connect creada:', account.id);

    // Actualizar el usuario con la información de Stripe Connect
    user.stripeConnectAccountId = account.id;
    user.stripeConnectStatus = 'pending';
    await user.save();

    console.log('✅ Usuario actualizado con cuenta de Stripe Connect');

    // Crear link de onboarding
    const returnUrl = `${process.env.FRONTEND_URL_HOODFY || 'https://www.hoodfy.com'}/creator-dashboard`;
    const refreshUrl = `${process.env.FRONTEND_URL_HOODFY || 'https://www.hoodfy.com'}/creator-dashboard`;
    
    const onboardingLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    console.log('✅ Link de onboarding creado');

    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl: onboardingLink.url,
      status: 'pending',
      message: 'Cuenta de Stripe Connect creada exitosamente. Completa el onboarding para activar los pagos.'
    });

  } catch (error) {
    console.error('❌ Error creando cuenta de Stripe Connect:', error);
    res.status(500).json({ 
      error: 'Error creando cuenta de Stripe Connect',
      details: error.message 
    });
  }
});

// Obtener estado de la cuenta de Stripe Connect del usuario
router.get('/stripe-connect/status', async (req, res) => {
  try {
    console.log('🔍 Obteniendo estado de cuenta de Stripe Connect del usuario...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.stripeConnectAccountId) {
      return res.status(404).json({ 
        error: 'No tienes cuenta de Stripe Connect configurada',
        status: 'not_configured'
      });
    }

    // Obtener estado de la cuenta desde Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    
    // Actualizar estado en la base de datos si cambió
    let statusChanged = false;
    if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
      if (user.stripeConnectStatus !== 'active') {
        user.stripeConnectStatus = 'active';
        statusChanged = true;
      }
    } else if (account.requirements && account.requirements.disabled_reason) {
      if (user.stripeConnectStatus !== 'restricted') {
        user.stripeConnectStatus = 'restricted';
        statusChanged = true;
      }
    } else if (!account.charges_enabled || !account.payouts_enabled) {
      if (user.stripeConnectStatus !== 'pending') {
        user.stripeConnectStatus = 'pending';
        statusChanged = true;
      }
    }

    if (statusChanged) {
      await user.save();
      console.log('✅ Estado de cuenta actualizado en BD');
    }

    res.json({
      accountId: account.id,
      status: user.stripeConnectStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      businessType: account.business_type,
      country: account.country,
      email: account.email,
      platformFee: 12, // Fee global de la plataforma
      creatorFee: 88  // Fee global del creador
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de cuenta:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estado de cuenta',
      details: error.message 
    });
  }
});

// Crear link de onboarding para una cuenta existente
router.post('/stripe-connect/onboarding', async (req, res) => {
  try {
    console.log('🔗 Creando link de onboarding para usuario...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.stripeConnectAccountId) {
      return res.status(404).json({ 
        error: 'No tienes cuenta de Stripe Connect configurada',
        status: 'not_configured'
      });
    }

    // Crear link de onboarding
    const returnUrl = `${process.env.FRONTEND_URL_HOODFY || 'https://www.hoodfy.com'}/creator-dashboard`;
    const refreshUrl = `${process.env.FRONTEND_URL_HOODFY || 'https://www.hoodfy.com'}/creator-dashboard`;
    
    const onboardingLink = await stripe.accountLinks.create({
      account: user.stripeConnectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    console.log('✅ Link de onboarding creado');

    res.json({
      success: true,
      onboardingUrl: onboardingLink.url,
      message: 'Link de onboarding generado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando link de onboarding:', error);
    res.status(500).json({ 
      error: 'Error creando link de onboarding',
      details: error.message 
    });
  }
});

// Crear link de login para el dashboard de Stripe
router.post('/stripe-connect/login', async (req, res) => {
  try {
    console.log('🔗 Creando link de login para usuario...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.stripeConnectAccountId) {
      return res.status(404).json({ 
        error: 'No tienes cuenta de Stripe Connect configurada',
        status: 'not_configured'
      });
    }

    // Crear link de login
    const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectAccountId);

    console.log('✅ Link de login creado');

    res.json({
      success: true,
      loginUrl: loginLink.url,
      message: 'Link de login generado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error creando link de login:', error);
    res.status(500).json({ 
      error: 'Error creando link de login',
      details: error.message 
    });
  }
});

module.exports = router;
