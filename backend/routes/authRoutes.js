const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, validateResult } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { DEFAULT_AVATAR_KEY } = require('../config/defaultAvatarKey');

// Configuración de rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos
  message: {
    error: 'Demasiados intentos',
    details: { auth: 'Por favor intenta de nuevo más tarde' }
  }
});

// 🔹 Registro de usuario
router.post('/register', validateRegistration, validateResult, async (req, res) => {
  try {
    const { name, username, email, firebaseUid } = req.body;
    
    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ 
      $or: [
        { email }, 
        { username: username.toLowerCase() },
        { firebaseUid }
      ] 
    });

    if (existingUser) {
      const details = {};
      if (existingUser.email === email) {
        details.email = 'Este email ya está registrado';
      }
      if (existingUser.username === username.toLowerCase()) {
        details.username = 'Este nombre de usuario ya está en uso';
      }
      if (existingUser.firebaseUid === firebaseUid) {
        details.firebaseUid = 'Este ID de Firebase ya está registrado';
      }
      return res.status(400).json({ 
        error: 'Usuario ya existe',
        details
      });
    }

    // Crear nuevo usuario
    const newUser = new User({ 
      name, 
      username: username.toLowerCase(), 
      email: email.toLowerCase(), 
      firebaseUid
    });
    
    await newUser.save();

    // Generar JWT
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Usuario registrado con éxito', 
      user: { 
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture
      },
      token
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ 
      error: 'Error al registrar usuario',
      message: error.message 
    });
  }
});

// Login con Firebase
router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    // Verificar el token de Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    // Buscar o crear usuario
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Generar username único
      let baseUsername = (name || email.split('@')[0] || 'usuario').toLowerCase().replace(/[^a-z0-9_]/g, '');
      let username = baseUsername;
      let exists = await User.findOne({ username });
      let tries = 0;
      while (exists && tries < 5) {
        username = baseUsername + Math.floor(Math.random() * 10000);
        exists = await User.findOne({ username });
        tries++;
      }

      user = new User({
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0],
        username,
        profilePicture: picture || DEFAULT_AVATAR_KEY,
      });
      await user.save();
    }

    // Generar token JWT
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// 🔹 Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Token no proporcionado',
        details: { token: 'El refresh token es requerido' }
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        details: { user: 'El usuario asociado al token no existe' }
      });
    }

    const newToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: newToken
    });
  } catch (error) {
    console.error('❌ Error al refrescar token:', error);
    res.status(401).json({
      error: 'Token inválido',
      details: { token: 'El refresh token no es válido' }
    });
  }
});

// Obtener perfil del usuario
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-firebaseUid');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

module.exports = router; 