const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  stripeProductId: {
    type: String,
    default: ''
  },
  stripePriceId: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  // Stripe Connect - ID de la cuenta del creador
  stripeConnectAccountId: {
    type: String,
    default: ''
  },
  // Estado de la cuenta de Stripe Connect
  stripeConnectStatus: {
    type: String,
    enum: ['pending', 'active', 'restricted', 'disabled'],
    default: 'pending'
  },
  // Porcentaje de comisión de la plataforma
  platformFeePercentage: {
    type: Number,
    default: 9.1
  },
  // Porcentaje que recibe el creador
  creatorFeePercentage: {
    type: Number,
    default: 90.9
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  postCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Solo necesitamos el índice para members ya que los otros ya están definidos en los campos
CommunitySchema.index({ members: 1 });

// Método para agregar un miembro
CommunitySchema.methods.addMember = async function(userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    return this.save();
  }
  return this;
};

// Método para remover un miembro
CommunitySchema.methods.removeMember = async function(userId) {
  if (this.creator.toString() === userId.toString()) {
    throw new Error('El creador no puede ser removido de la comunidad');
  }
  this.members = this.members.filter(id => id.toString() !== userId.toString());
  return this.save();
};

const Community = mongoose.model('Community', CommunitySchema);

module.exports = Community; 