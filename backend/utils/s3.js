const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME;

// Importación dinámica para compatibilidad con ESM de 'file-type'
async function getMimeTypeFromBuffer(buffer, defaultMime) {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const result = await fileTypeFromBuffer(buffer);
    if (result && result.mime) return result.mime;
  } catch (error) {
    console.log('⚠️ No se pudo detectar el tipo MIME, usando el original:', defaultMime);
  }
  return defaultMime;
}

// Función mejorada para detectar MIME types de iPhone
function detectIphoneMimeType(originalName, mimetype) {
  const ext = path.extname(originalName).toLowerCase();
  
  // Mapeo específico para archivos de iPhone
  const iphoneMimeMap = {
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.heic-sequence': 'image/heic-sequence',
    '.heif-sequence': 'image/heif-sequence',
    '.mov': 'video/quicktime',
    '.m4v': 'video/mp4',
    '.3gp': 'video/3gpp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo'
  };
  
  return iphoneMimeMap[ext] || mimetype;
}

// Sube un archivo a S3 y retorna el key
const uploadFileToS3 = async (buffer, originalname, mimetype) => {
  try {
    // Generar key único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname);
    const key = `uploads/${timestamp}-${randomString}${extension}`;

    // Detectar MIME type real usando la API correcta de file-type
    const realMimeType = await getMimeTypeFromBuffer(buffer, mimetype);

    // Verificar tipo de archivo permitido
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];

    if (!allowedTypes.includes(realMimeType)) {
      throw new Error(`Tipo de archivo no permitido: ${realMimeType}`);
    }

    // Configurar parámetros de subida
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: realMimeType
    });

    // Subir a S3
    await s3.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Nueva función para subir avatares públicos
const uploadPublicAvatar = async (buffer, originalname, mimetype) => {
  try {
    // Generar key único para avatar público
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname);
    const key = `public/avatars/${timestamp}-${randomString}${extension}`;

    // Detectar MIME type real
    const realMimeType = await getMimeTypeFromBuffer(buffer, mimetype);

    // Verificar tipo de archivo permitido (solo imágenes)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
    ];

    if (!allowedTypes.includes(realMimeType)) {
      throw new Error(`Tipo de archivo no permitido para avatar: ${realMimeType}`);
    }

    // Configurar parámetros de subida
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: realMimeType
    });

    // Subir a S3
    await s3.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading public avatar to S3:', error);
    throw error;
  }
};

// Nueva función para subir banners públicos
const uploadPublicBanner = async (buffer, originalname, mimetype) => {
  try {
    // Generar key único para banner público
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname);
    const key = `public/banners/${timestamp}-${randomString}${extension}`;

    // Detectar MIME type real
    const realMimeType = await getMimeTypeFromBuffer(buffer, mimetype);

    // Verificar tipo de archivo permitido (solo imágenes)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
    ];

    if (!allowedTypes.includes(realMimeType)) {
      throw new Error(`Tipo de archivo no permitido para banner: ${realMimeType}`);
    }

    // Configurar parámetros de subida
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: realMimeType
    });

    // Subir a S3
    await s3.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading public banner to S3:', error);
    throw error;
  }
};

// Genera una URL firmada temporal para acceder al archivo
async function getS3SignedUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}

// Nueva función para subir archivos de chat organizados por tipo y chatId
const uploadChatFile = async (buffer, originalname, mimetype, chatId) => {
  try {
    // Generar key único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalname);

    // Detectar MIME type real
    const realMimeType = await getMimeTypeFromBuffer(buffer, mimetype);

    // Determinar la carpeta basada en el tipo de archivo
    let folder = 'documents'; // Por defecto
    if (realMimeType.startsWith('image/')) {
      folder = 'images';
    } else if (realMimeType.startsWith('video/')) {
      folder = 'videos';
    } else if (realMimeType.startsWith('audio/')) {
      folder = 'audio';
    }

    // Generar la ruta del archivo: chats/{tipo}/{chatId}/{timestamp}-{uuid}.{ext}
    const key = `chats/${folder}/${chatId}/${timestamp}-${randomString}${extension}`;

    // Verificar tipos de archivo permitidos
    const allowedTypes = [
      // Imágenes
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
      // Videos
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a',
      // Documentos
      'application/pdf', 'text/plain', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(realMimeType)) {
      throw new Error(`Tipo de archivo no permitido en chat: ${realMimeType}`);
    }

    // Configurar parámetros de subida
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: realMimeType,
      Metadata: {
        'original-name': originalname,
        'chat-id': chatId,
        'upload-timestamp': timestamp.toString()
      }
    });

    // Subir a S3
    await s3.send(command);
    console.log(`📁 Archivo de chat subido: ${key}`);
    return key;
  } catch (error) {
    console.error('Error uploading chat file to S3:', error);
    throw error;
  }
};

module.exports = {
  uploadFileToS3,
  uploadPublicAvatar,
  uploadPublicBanner,
  uploadChatFile,
  getS3SignedUrl,
}; 