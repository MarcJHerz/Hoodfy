const stripe = require('../config/stripe');
const stripeConnect = require('../config/stripeConnect');
const Community = require('../models/Community');
const User = require('../models/User');
const Payout = require('../models/Payout');

// Crear cuenta de Stripe Connect para un creador
exports.createConnectAccount = async (req, res) => {
  try {
    console.log('🏗️ Iniciando creación de cuenta de Stripe Connect...');
    console.log('👤 Usuario ID:', req.userId);
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { communityId, accountType = 'express', country = 'US' } = req.body;
    
    if (!communityId) {
      return res.status(400).json({ error: 'ID de comunidad requerido' });
    }

    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede configurar pagos' });
    }

    // Verificar que la comunidad no tenga ya una cuenta de Stripe Connect
    if (community.stripeConnectAccountId) {
      return res.status(400).json({ 
        error: 'Esta comunidad ya tiene una cuenta de Stripe Connect configurada',
        accountId: community.stripeConnectAccountId
      });
    }

    // Obtener información del usuario
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
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
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.ip || '127.0.0.1'
      }
    };

    const account = await stripe.accounts.create(accountData);
    
    console.log('✅ Cuenta de Stripe Connect creada:', account.id);

    // Actualizar la comunidad con la información de Stripe Connect
    community.stripeConnectAccountId = account.id;
    community.stripeConnectStatus = 'pending';
    community.platformFeePercentage = 12;
    community.creatorFeePercentage = 88;
    await community.save();

    console.log('✅ Comunidad actualizada con cuenta de Stripe Connect');

    // Crear link de onboarding
    const returnUrl = `${process.env.FRONTEND_URL || 'https://www.qahood.com'}/dashboard/communities/${communityId}/payments`;
    const refreshUrl = `${process.env.FRONTEND_URL || 'https://www.qahood.com'}/dashboard/communities/${communityId}/payments`;
    
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
};

// Obtener estado de la cuenta de Stripe Connect
exports.getConnectAccountStatus = async (req, res) => {
  try {
    console.log('🔍 Obteniendo estado de cuenta de Stripe Connect...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { communityId } = req.params;
    
    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede ver el estado de pagos' });
    }

    if (!community.stripeConnectAccountId) {
      return res.status(404).json({ 
        error: 'Esta comunidad no tiene cuenta de Stripe Connect configurada',
        status: 'not_configured'
      });
    }

    // Obtener estado de la cuenta desde Stripe
    const account = await stripe.accounts.retrieve(community.stripeConnectAccountId);
    
    // Actualizar estado en la base de datos si cambió
    let statusChanged = false;
    if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
      if (community.stripeConnectStatus !== 'active') {
        community.stripeConnectStatus = 'active';
        statusChanged = true;
      }
    } else if (account.requirements && account.requirements.disabled_reason) {
      if (community.stripeConnectStatus !== 'restricted') {
        community.stripeConnectStatus = 'restricted';
        statusChanged = true;
      }
    } else if (!account.charges_enabled || !account.payouts_enabled) {
      if (community.stripeConnectStatus !== 'pending') {
        community.stripeConnectStatus = 'pending';
        statusChanged = true;
      }
    }

    if (statusChanged) {
      await community.save();
      console.log('✅ Estado de cuenta actualizado en BD');
    }

    // Obtener estadísticas de ganancias
    const earnings = await Payout.getCreatorTotalEarnings(req.userId, communityId);
    const pendingBalance = await Payout.getCreatorPendingBalance(req.userId, communityId);

    res.json({
      accountId: account.id,
      status: community.stripeConnectStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      businessType: account.business_type,
      country: account.country,
      email: account.email,
      earnings: {
        total: earnings.totalEarnings / 100, // Convertir de centavos a dólares
        totalPayouts: earnings.totalPayouts,
        averagePayout: earnings.averagePayout / 100,
        pending: pendingBalance.pendingAmount / 100
      },
      platformFee: community.platformFeePercentage,
      creatorFee: community.creatorFeePercentage
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de cuenta:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estado de cuenta',
      details: error.message 
    });
  }
};

// Crear link de onboarding para una cuenta existente
exports.createOnboardingLink = async (req, res) => {
  try {
    console.log('🔗 Creando link de onboarding...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { communityId } = req.params;
    
    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede acceder al onboarding' });
    }

    if (!community.stripeConnectAccountId) {
      return res.status(404).json({ error: 'Esta comunidad no tiene cuenta de Stripe Connect configurada' });
    }

    // Crear link de onboarding
    const returnUrl = `${process.env.FRONTEND_URL || 'https://www.qahood.com'}/dashboard/communities/${communityId}/payments`;
    const refreshUrl = `${process.env.FRONTEND_URL || 'https://www.qahood.com'}/dashboard/communities/${communityId}/payments`;
    
    const onboardingLink = await stripe.accountLinks.create({
      account: community.stripeConnectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    console.log('✅ Link de onboarding creado');

    res.json({
      onboardingUrl: onboardingLink.url,
      expiresAt: onboardingLink.expires_at
    });

  } catch (error) {
    console.error('❌ Error creando link de onboarding:', error);
    res.status(500).json({ 
      error: 'Error creando link de onboarding',
      details: error.message 
    });
  }
};

// Crear link de login para la cuenta de Stripe Connect
exports.createLoginLink = async (req, res) => {
  try {
    console.log('🔑 Creando link de login...');
    
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe no está configurado' });
    }

    const { communityId } = req.params;
    
    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede acceder al dashboard de Stripe' });
    }

    if (!community.stripeConnectAccountId) {
      return res.status(404).json({ error: 'Esta comunidad no tiene cuenta de Stripe Connect configurada' });
    }

    // Crear link de login
    const loginLink = await stripe.accounts.createLoginLink(community.stripeConnectAccountId);

    console.log('✅ Link de login creado');

    res.json({
      loginUrl: loginLink.url
    });

  } catch (error) {
    console.error('❌ Error creando link de login:', error);
    res.status(500).json({ 
      error: 'Error creando link de login',
      details: error.message 
    });
  }
};

// Obtener historial de payouts de un creador
exports.getCreatorPayouts = async (req, res) => {
  try {
    console.log('💰 Obteniendo historial de payouts...');
    
    const { communityId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    // Verificar que el usuario es el creador de la comunidad
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Comunidad no encontrada' });
    }

    if (community.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Solo el creador puede ver el historial de payouts' });
    }

    // Construir filtros
    const filter = { creator: req.userId, community: communityId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Obtener payouts con paginación
    const skip = (page - 1) * limit;
    const payouts = await Payout.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('subscription', 'stripeSubscriptionId')
      .populate('community', 'name');

    // Obtener total de payouts
    const total = await Payout.countDocuments(filter);

    // Obtener estadísticas
    const earnings = await Payout.getCreatorTotalEarnings(req.userId, communityId);
    const pendingBalance = await Payout.getCreatorPendingBalance(req.userId, communityId);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalEarnings: earnings.totalEarnings / 100,
        totalPayouts: earnings.totalPayouts,
        averagePayout: earnings.averagePayout / 100,
        pendingBalance: pendingBalance.pendingAmount / 100
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de payouts:', error);
    res.status(500).json({ 
      error: 'Error obteniendo historial de payouts',
      details: error.message 
    });
  }
};

// Obtener estadísticas de ganancias de todas las comunidades de un creador
exports.getCreatorEarningsOverview = async (req, res) => {
  try {
    console.log('📊 Obteniendo resumen de ganancias...');
    
    // Obtener todas las comunidades del creador
    const communities = await Community.find({ creator: req.userId });
    
    const earningsData = [];
    let totalEarnings = 0;
    let totalPending = 0;

    for (const community of communities) {
      const earnings = await Payout.getCreatorTotalEarnings(req.userId, community._id);
      const pending = await Payout.getCreatorPendingBalance(req.userId, community._id);
      
      earningsData.push({
        communityId: community._id,
        communityName: community.name,
        totalEarnings: earnings.totalEarnings / 100,
        totalPayouts: earnings.totalPayouts,
        pendingBalance: pending.pendingAmount / 100,
        stripeConnectStatus: community.stripeConnectStatus
      });

      totalEarnings += earnings.totalEarnings;
      totalPending += pending.pendingAmount;
    }

    res.json({
      communities: earningsData,
      totals: {
        totalEarnings: totalEarnings / 100,
        totalPending: totalPending / 100
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo resumen de ganancias:', error);
    res.status(500).json({ 
      error: 'Error obteniendo resumen de ganancias',
      details: error.message 
    });
  }
};
