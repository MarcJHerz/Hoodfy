const mongoose = require('mongoose');

const communityStatsSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  totalMembers: {
    type: Number,
    default: 0
  },
  activeMembers: {
    type: Number,
    default: 0
  },
  postsPerDay: {
    type: Number,
    default: 0
  },
  engagementRate: {
    type: Number,
    default: 0
  },
  newMembersThisWeek: {
    type: Number,
    default: 0
  },
  popularContent: [{
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    engagement: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Índice para búsquedas rápidas
communityStatsSchema.index({ communityId: 1 });

module.exports = mongoose.model('CommunityStats', communityStatsSchema); 