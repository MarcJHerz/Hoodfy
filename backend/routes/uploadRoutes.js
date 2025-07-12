const express = require('express');
const router = express.Router();
const multer = require('multer');
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
  fileFilter: (req, file, cb) => {
    console.log('🔍 Archivo recibido en uploadRoutes:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Detectar el tipo MIME real basado en la extensión
    const realMimeType = detectMimeType(file);
    console.log('📋 Tipo MIME detectado:', realMimeType);
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
      'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'
    ];
    
    if (allowedTypes.includes(realMimeType)) {
      console.log('✅ Archivo aceptado en uploadRoutes');
      cb(null, true);
    } else {
      console.log('❌ Archivo rechazado en uploadRoutes - tipo no permitido:', realMimeType);
      cb(new Error(`Tipo de archivo no soportado: ${realMimeType}. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, HEIC, HEIF)`));
    }
  }
});

// Subir imagen a S3
router.post('/', verifyToken, upload.single('file'), uploadController.uploadImage);
// Obtener URL firmada
router.get('/signed-url/:key', verifyToken, uploadController.getSignedUrl);

module.exports = router; 