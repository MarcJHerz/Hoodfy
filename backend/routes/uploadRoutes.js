const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();

// Función para detectar el tipo MIME real de un archivo
function detectMimeType(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Mapeo de extensiones a tipos MIME
  const mimeMap = {
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  
  return mimeMap[ext] || file.mimetype;
}

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB para imágenes
    files: 1, // Máximo 1 archivo por request
    fieldSize: 50 * 1024 * 1024, // 50MB por campo
    fieldNameSize: 100 // Tamaño máximo del nombre del campo
  },
  fileFilter: (req, file, cb) => {
    // Detectar el tipo MIME real basado en la extensión
    const realMimeType = detectMimeType(file);
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'
    ];
    
    if (allowedTypes.includes(realMimeType)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${realMimeType}. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, HEIC, HEIF)`));
    }
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el límite de tamaño permitido (50MB)'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      error: 'Demasiados archivos',
      message: 'No puedes subir más de 1 archivo a la vez'
    });
  }
  
  if (error.message.includes('Tipo de archivo no soportado')) {
    return res.status(400).json({
      error: 'Tipo de archivo no soportado',
      message: error.message
    });
  }
  
  return res.status(500).json({
    error: 'Error al procesar archivos',
    message: error.message
  });
};

// Subir imagen a S3
router.post('/', verifyToken, upload.single('file'), handleMulterError, uploadController.uploadImage);
// Obtener URL firmada (requiere autenticación)
router.get('/signed-url/:key', verifyToken, uploadController.getSignedUrl);
// Obtener URL firmada de logo (público, sin autenticación)
router.get('/logo/:key', uploadController.getLogoSignedUrl);

module.exports = router; 