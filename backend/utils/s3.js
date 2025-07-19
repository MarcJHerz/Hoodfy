const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const FileType = require('file-type');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME;

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
    let realMimeType = mimetype;
    try {
      const fileType = await FileType.fromBuffer(buffer);
      if (fileType) {
        realMimeType = fileType.mime;
      }
    } catch (error) {
      console.log('⚠️ No se pudo detectar el tipo MIME, usando el original:', mimetype);
    }

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

module.exports = {
  uploadFileToS3,
  getS3SignedUrl,
}; 