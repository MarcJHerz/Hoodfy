const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    console.log('🔍 Headers recibidos:', Object.keys(req.headers));
    console.log('🔑 Authorization header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No se encontró token en Authorization header');
      return res.status(401).json({ 
        error: 'No autorizado',
        details: { token: 'Token no proporcionado' }
      });
    }

    let firebaseUid;
    let user;

    try {
      // Primero intentamos verificar como token de Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      firebaseUid = decodedToken.uid;
      user = await User.findOne({ firebaseUid });
      
      console.log(`🔧 Token Firebase verificado: ${firebaseUid}`);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado',
          details: { user: 'El usuario asociado al Firebase UID no existe en la base de datos' }
        });
      }
    } catch (firebaseError) {
      console.log('🔧 Token Firebase falló, intentando JWT...');
      
      // Si falla Firebase, intentamos como JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const mongoUserId = decoded.userId;
        
        // Buscar usuario por MongoDB ID para obtener firebaseUid
        user = await User.findById(mongoUserId);
        if (!user || !user.firebaseUid) {
          throw new Error('Usuario no encontrado o sin firebaseUid');
        }
        
        firebaseUid = user.firebaseUid;
        console.log(`🔧 Token JWT verificado: ${mongoUserId} -> ${firebaseUid}`);
        
      } catch (jwtError) {
        console.error('❌ Error verificando JWT:', jwtError);
        throw new Error('Token inválido');
      }
    }

    if (!firebaseUid || !user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        details: { user: 'El usuario asociado al token no existe en la base de datos' }
      });
    }

    // 🔧 CRÍTICO: Asignar firebaseUid como userId para consistencia
    req.userId = firebaseUid;
    req.user = user;
    req.mongoUserId = user._id; // Por si se necesita el MongoDB ID
    next();
  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    
    if (error.code === 'auth/id-token-expired' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        details: { token: 'El token ha expirado' },
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        details: { token: 'El token proporcionado no es válido' },
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(500).json({ 
      error: 'Error al verificar autenticación',
      message: error.message 
    });
  }
};

module.exports = { verifyToken }; 