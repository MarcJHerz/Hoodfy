const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserStats,
  updateUserRole,
  updateUserStatus
} = require('../controllers/adminController');

// 🔒 Middleware de verificación de admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Acceso denegado', 
      message: 'Se requieren permisos de administrador' 
    });
  }
};

// 📊 Rutas de usuarios (solo para admins)
router.get('/users', verifyToken, requireAdmin, getAllUsers);
router.get('/users/stats', verifyToken, requireAdmin, getUserStats);

// 🔧 Rutas de gestión de usuarios (solo para admins)
router.put('/users/:userId/role', verifyToken, requireAdmin, updateUserRole);
router.put('/users/:userId/status', verifyToken, requireAdmin, updateUserStatus);

// 📈 Ruta de prueba para verificar que las rutas funcionan
router.get('/test', verifyToken, requireAdmin, (req, res) => {
  res.json({ 
    message: '✅ Rutas de admin funcionando correctamente',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
