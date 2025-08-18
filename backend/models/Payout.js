const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  // Creador de la comunidad
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Comunidad asociada
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true
  },
  
  // Suscripción asociada
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  
  // ID de la cuenta de Stripe Connect del creador
  stripeConnectAccountId: {
    type: String,
    required: true,
    index: true
  },
  
  // Detalles del pago
  paymentDetails: {
    // Monto total del pago (en centavos)
    totalAmount: {
      type: Number,
      required: true
    },
    
    // Monto que se queda la plataforma (12%)
    platformFee: {
      type: Number,
      required: true
    },
    
    // Monto que recibe el creador (88%)
    creatorAmount: {
      type: Number,
      required: true
    },
    
    // Porcentaje de comisión de la plataforma
    platformFeePercentage: {
      type: Number,
      default: 12
    },
    
    // Porcentaje que recibe el creador
    creatorFeePercentage: {
      type: Number,
      default: 88
    }
  },
  
  // Estado del payout
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Fecha del payout
  payoutDate: {
    type: Date
  },
  
  // ID de la transferencia de Stripe (si se creó)
  stripeTransferId: {
    type: String
  },
  
  // ID del payout de Stripe (si se creó)
  stripePayoutId: {
    type: String
  },
  
  // Metadatos adicionales
  metadata: {
    // ID de la factura de Stripe
    stripeInvoiceId: String,
    
    // ID de la suscripción de Stripe
    stripeSubscriptionId: String,
    
    // ID del cliente de Stripe
    stripeCustomerId: String,
    
    // Moneda del pago
    currency: {
      type: String,
      default: 'usd'
    },
    
    // Descripción del pago
    description: String
  },
  
  // Notas o comentarios
  notes: String,
  
  // Intentos de payout
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Último intento de payout
  lastRetryAttempt: Date,
  
  // Error del último intento (si falló)
  lastError: String
}, {
  timestamps: true
});

// Índices para optimizar consultas
PayoutSchema.index({ creator: 1, status: 1 });
PayoutSchema.index({ community: 1, status: 1 });
PayoutSchema.index({ stripeConnectAccountId: 1, status: 1 });
PayoutSchema.index({ createdAt: -1 });
PayoutSchema.index({ payoutDate: -1 });

// Método para calcular el total de ganancias de un creador
PayoutSchema.statics.getCreatorTotalEarnings = async function(creatorId, communityId = null) {
  const match = { creator: creatorId, status: 'completed' };
  if (communityId) {
    match.community = communityId;
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$paymentDetails.creatorAmount' },
        totalPayouts: { $sum: 1 },
        averagePayout: { $avg: '$paymentDetails.creatorAmount' }
      }
    }
  ]);
  
  return result[0] || {
    totalEarnings: 0,
    totalPayouts: 0,
    averagePayout: 0
  };
};

// Método para obtener el balance pendiente de un creador
PayoutSchema.statics.getCreatorPendingBalance = async function(creatorId, communityId = null) {
  const match = { creator: creatorId, status: 'pending' };
  if (communityId) {
    match.community = communityId;
  }
  
  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        pendingAmount: { $sum: '$paymentDetails.creatorAmount' },
        pendingPayouts: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    pendingAmount: 0,
    pendingPayouts: 0
  };
};

// Método para obtener estadísticas de payouts por comunidad
PayoutSchema.statics.getCommunityPayoutStats = async function(communityId) {
  const result = await this.aggregate([
    { $match: { community: communityId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$paymentDetails.creatorAmount' }
      }
    }
  ]);
  
  const stats = {
    total: 0,
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    cancelled: 0
  };
  
  result.forEach(item => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });
  
  return stats;
};

// Método para marcar un payout como completado
PayoutSchema.methods.markAsCompleted = async function(stripeTransferId = null, stripePayoutId = null) {
  this.status = 'completed';
  this.payoutDate = new Date();
  
  if (stripeTransferId) {
    this.stripeTransferId = stripeTransferId;
  }
  
  if (stripePayoutId) {
    this.stripePayoutId = stripePayoutId;
  }
  
  return this.save();
};

// Método para marcar un payout como fallido
PayoutSchema.methods.markAsFailed = async function(error) {
  this.status = 'failed';
  this.lastError = error;
  this.retryCount += 1;
  this.lastRetryAttempt = new Date();
  
  return this.save();
};

// Método para reintentar un payout
PayoutSchema.methods.retry = async function() {
  this.status = 'pending';
  this.lastError = undefined;
  
  return this.save();
};

// Método para obtener el monto en dólares (convertir de centavos)
PayoutSchema.virtual('totalAmountDollars').get(function() {
  return (this.paymentDetails.totalAmount / 100).toFixed(2);
});

PayoutSchema.virtual('platformFeeDollars').get(function() {
  return (this.paymentDetails.platformFee / 100).toFixed(2);
});

PayoutSchema.virtual('creatorAmountDollars').get(function() {
  return (this.paymentDetails.creatorAmount / 100).toFixed(2);
});

// Configurar virtuals para JSON
PayoutSchema.set('toJSON', { virtuals: true });
PayoutSchema.set('toObject', { virtuals: true });

const Payout = mongoose.model('Payout', PayoutSchema);

module.exports = Payout;
