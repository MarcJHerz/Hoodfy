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

// Upload para imágenes generales (posts, perfiles, etc)
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

// Upload específico para chat (acepta más tipos de archivos)
const uploadChat = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB para archivos de chat
    files: 1,
    fieldSize: 100 * 1024 * 1024,
    fieldNameSize: 100
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Mapeo más completo para chat
    const chatMimeMap = {
      // Imágenes
      '.heic': 'image/heic', '.heif': 'image/heif',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
      // Videos
      '.mp4': 'video/mp4', '.mov': 'video/quicktime', 
      '.avi': 'video/x-msvideo', '.webm': 'video/webm',
      // Audio
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', 
      '.aac': 'audio/aac', '.m4a': 'audio/m4a', '.ogg': 'audio/ogg',
      // Documentos
      '.pdf': 'application/pdf', '.txt': 'text/plain',
      '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    const realMimeType = chatMimeMap[ext] || file.mimetype;
    
    const allowedChatTypes = [
      // Imágenes
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      // Videos
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a',
      // Documentos
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedChatTypes.includes(realMimeType)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no soportado en chat: ${realMimeType}`));
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

// Subir imagen a S3 (general)
router.post('/', verifyToken, upload.single('file'), handleMulterError, uploadController.uploadImage);

// Subir archivo de chat a S3 (específico para chat)
router.post('/chat', verifyToken, uploadChat.single('file'), handleMulterError, uploadController.uploadChatFile);

// Obtener URL firmada (requiere autenticación)
router.get('/signed-url/:key', verifyToken, uploadController.getSignedUrl);

// Obtener URL firmada de logo (público, sin autenticación)
router.get('/logo/:key', uploadController.getLogoSignedUrl);

module.exports = router; 