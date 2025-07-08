const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Subir imagen a S3
router.post('/', verifyToken, upload.single('file'), uploadController.uploadImage);
// Obtener URL firmada
router.get('/signed-url/:key', verifyToken, uploadController.getSignedUrl);

module.exports = router; 