const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'El nombre es obligatorio.'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres.']
  }, 
  username: { 
    type: String, 
    required: [true, 'El nombre de usuario es obligatorio.'],
    unique: true, 
    lowercase: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres.'],
    match: [/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos.']
  },
  email: { 
    type: String, 
    required: [true, 'El correo es obligatorio.'],
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Por favor ingresa un email válido.']
  },
  firebaseUid: {
    type: String,
    required: [true, 'El ID de Firebase es obligatorio.'],
    unique: true,
    index: true
  },
  profilePicture: {
    type: String,
    default: '/images/defaults/default-avatar.png'
  },
  bio: { 
    type: String, 
    default: '',
    maxlength: [500, 'La biografía no puede exceder los 500 caracteres.']
  },
  category: { 
    type: String, 
    default: '',
    enum: ['', 'Música', 'Arte', 'Deportes', 'Tecnología', 'Educación', 'Entretenimiento', 'Otro']
  },
  links: [{ 
    type: String,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} no es una URL válida!`
    }
  }],
  subscriptionPrice: { 
    type: Number, 
    default: 0,
    min: [0, 'El precio de suscripción no puede ser negativo.']
  },
  profileBlocks: [{
    type: {
      type: String,
      enum: ['text', 'image', 'gallery', 'video', 'link', 'embed', 'social', 'quote', 'button'],
      required: true
    },
    content: mongoose.Schema.Types.Mixed,
    position: { type: Number, default: 0 },
    styles: { type: mongoose.Schema.Types.Mixed, default: {} }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  mainBadgeIcon: {
    type: String,
    enum: ['founder', 'trophy', 'diamond', 'fire', 'calendar', 'heart', 'star', null],
    default: null
  },
  fcmToken: {
    type: String,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Método para actualizar lastLogin
userSchema.methods.updateLastLogin = async function() {
  try {
    this.lastLogin = new Date();
    await this.save();
    return true;
  } catch (error) {
    console.error('Error al actualizar lastLogin:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User; 