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
  // Los campos de Stripe Connect ahora están en el modelo User
  // Los fees son globales: Platform 12%, Creator 88%
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
  // Estado de la comunidad
  status: {
    type: String,
    enum: ['active', 'suspended', 'archived', 'deleted'],
    default: 'active'
  },
  // Control de suscripciones
  allowNewSubscriptions: {
    type: Boolean,
    default: true
  },
  allowRenewals: {
    type: Boolean,
    default: true
  },
  // Fecha de archivo/eliminación
  archivedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
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

// Método para suspender una comunidad (pausar nuevas suscripciones)
CommunitySchema.methods.suspend = async function() {
  this.status = 'suspended';
  this.allowNewSubscriptions = false;
  this.allowRenewals = false;
  return this.save();
};

// Método para archivar una comunidad (mantener suscripciones activas pero no permitir nuevas)
CommunitySchema.methods.archive = async function() {
  this.status = 'archived';
  this.allowNewSubscriptions = false;
  this.allowRenewals = true; // Permitir renovaciones para usuarios existentes
  this.archivedAt = new Date();
  return this.save();
};

// Método para marcar como eliminada (soft delete)
CommunitySchema.methods.markAsDeleted = async function() {
  this.status = 'deleted';
  this.allowNewSubscriptions = false;
  this.allowRenewals = false;
  this.deletedAt = new Date();
  return this.save();
};

// Método para verificar si la comunidad puede recibir nuevas suscripciones
CommunitySchema.methods.canAcceptNewSubscriptions = function() {
  return this.status === 'active' && this.allowNewSubscriptions;
};

// Método para verificar si la comunidad puede procesar renovaciones
CommunitySchema.methods.canProcessRenewals = function() {
  return this.status === 'active' || (this.status === 'archived' && this.allowRenewals);
};

const Community = mongoose.model('Community', CommunitySchema);

module.exports = Community; 