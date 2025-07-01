const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    thumbnail: String // Para videos
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  commentsCount: {
    type: Number,
    default: 0
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  },
  postType: {
    type: String,
    enum: ['general', 'community'],
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para mejorar el rendimiento de las consultas
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ community: 1, isPinned: -1, createdAt: -1 });

// Método para agregar un like
postSchema.methods.addLike = async function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  return this;
};

// Método para remover un like
postSchema.methods.removeLike = async function(userId) {
  this.likes = this.likes.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Método para agregar un comentario
postSchema.methods.addComment = async function(comment) {
  this.comments.push(comment);
  return this.save();
};

// Método para destacar/quitar destaque
postSchema.methods.togglePin = async function() {
  this.isPinned = !this.isPinned;
  this.pinnedAt = this.isPinned ? new Date() : null;
  return this.save();
};

module.exports = mongoose.model('Post', postSchema); 