const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  parentComment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment', 
    default: null 
  },
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Comment', CommentSchema); 