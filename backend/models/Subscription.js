const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  community: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Community', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'expired'], 
    default: 'active' 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date 
  },
  paymentMethod: { 
    type: String, 
    default: 'stripe' 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  stripeSubscriptionId: {
    type: String,
    required: false
  },
  stripeCustomerId: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema); 