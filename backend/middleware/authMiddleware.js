const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'No autorizado',
        details: { token: 'Token no proporcionado' }
      });
    }

    let userId;

    try {
      // Primero intentamos verificar como token de Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (user) {
        userId = user._id;
      }
    } catch (firebaseError) {
      // Si falla Firebase, intentamos como JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (jwtError) {
        throw new Error('Token inválido');
      }
    }

    if (!userId) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: { user: 'El usuario asociado al token no existe en la base de datos' }
      });
    }

    console.log('🔐 Usuario autenticado:', userId);
    req.userId = userId;
    next();
  } catch (error) {
    console.error('❌ Error al verificar el token:', error);
    
    if (error.code === 'auth/id-token-expired' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        details: { token: 'El token ha expirado' }
      });
    }
    
    if (error.code === 'auth/invalid-id-token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        details: { token: 'El token proporcionado no es válido' }
      });
    }

    return res.status(500).json({ 
      error: 'Error al verificar autenticación',
      message: error.message 
    });
  }
};

module.exports = { verifyToken }; 