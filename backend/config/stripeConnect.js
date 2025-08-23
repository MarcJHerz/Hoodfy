const stripe = require('./stripe');

// Configuración de Stripe Connect
const STRIPE_CONNECT_CONFIG = {
  // Porcentaje que se queda la plataforma (12% - incluye fee de Stripe)
  PLATFORM_FEE_PERCENTAGE: process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || 12,
  
  // Porcentaje que se queda el creador (88% - neto después de fees)
  CREATOR_FEE_PERCENTAGE: 100 - (process.env.STRIPE_PLATFORM_FEE_PERCENTAGE || 12),
  
  // Tipos de cuenta soportados
  ACCOUNT_TYPES: ['express', 'standard'],
  
  // Configuración de onboarding
  ONBOARDING_CONFIG: {
    // Campos requeridos para Express accounts
    express: {
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    },
    
    // Campos requeridos para Standard accounts
    standard: {
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    }
  }
};

// Función para crear una cuenta de Stripe Connect
async function createConnectAccount(accountType = 'express', country = 'US') {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado');
    }

    const accountData = {
      type: accountType,
      country: country,
      email: '', // Se actualizará después
      business_type: STRIPE_CONNECT_CONFIG.ONBOARDING_CONFIG[accountType].business_type,
      capabilities: STRIPE_CONNECT_CONFIG.ONBOARDING_CONFIG[accountType].capabilities,
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1' // Se actualizará con IP real
      }
    };

    const account = await stripe.accounts.create(accountData);
    
    console.log(`✅ Cuenta de Stripe Connect creada: ${account.id} (${accountType})`);
    return account;
  } catch (error) {
    console.error('❌ Error creando cuenta de Stripe Connect:', error);
    throw error;
  }
}

// Función para crear un link de onboarding
async function createOnboardingLink(accountId, returnUrl, refreshUrl) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado');
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    console.log(`✅ Link de onboarding creado para cuenta: ${accountId}`);
    return link;
  } catch (error) {
    console.error('❌ Error creando link de onboarding:', error);
    throw error;
  }
}

// Función para crear un link de login
async function createLoginLink(accountId) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado');
    }

    const link = await stripe.accounts.createLoginLink(accountId);
    
    console.log(`✅ Link de login creado para cuenta: ${accountId}`);
    return link;
  } catch (error) {
    console.error('❌ Error creando link de login:', error);
    throw error;
  }
}

// Función para calcular el split de pagos
function calculatePaymentSplit(amount, platformFeePercentage = STRIPE_CONNECT_CONFIG.PLATFORM_FEE_PERCENTAGE) {
  const amountInCents = Math.round(amount * 100);
  const platformFeeCents = Math.round(amountInCents * (platformFeePercentage / 100));
  const creatorAmountCents = amountInCents - platformFeeCents;
  
  return {
    total: amountInCents,
    platformFee: platformFeeCents,
    creatorAmount: creatorAmountCents,
    platformFeePercentage,
    creatorFeePercentage: 100 - platformFeePercentage
  };
}

// Función para verificar el estado de una cuenta
async function getAccountStatus(accountId) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado');
    }

    const account = await stripe.accounts.retrieve(accountId);
    
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
      businessType: account.business_type,
      country: account.country,
      email: account.email
    };
  } catch (error) {
    console.error('❌ Error obteniendo estado de cuenta:', error);
    throw error;
  }
}

// Función para obtener el balance de una cuenta
async function getAccountBalance(accountId) {
  try {
    if (!stripe) {
      throw new Error('Stripe no está configurado');
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId
    });

    return {
      available: balance.available,
      pending: balance.pending,
      instantAvailable: balance.instant_available
    };
  } catch (error) {
    console.error('❌ Error obteniendo balance de cuenta:', error);
    throw error;
  }
}

module.exports = {
  STRIPE_CONNECT_CONFIG,
  createConnectAccount,
  createOnboardingLink,
  createLoginLink,
  calculatePaymentSplit,
  getAccountStatus,
  getAccountBalance
};
