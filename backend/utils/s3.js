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
async function uploadFileToS3(buffer, originalName, mimetype) {
  try {
    console.log('📤 Iniciando subida a S3:', {
      originalName,
      originalMimeType: mimetype,
      bufferSize: buffer.length,
      bufferSizeMB: (buffer.length / (1024 * 1024)).toFixed(2)
    });
    
    // Detectar MIME type real para archivos de iPhone
    const realMimeType = detectIphoneMimeType(originalName, mimetype);
    console.log('📋 MIME type detectado:', realMimeType);
    
    const ext = path.extname(originalName);
    const key = `${uuidv4()}${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: realMimeType,
      // Metadatos adicionales para archivos de iPhone
      Metadata: {
        'original-name': originalName,
        'uploaded-from': 'iphone',
        'file-size': buffer.length.toString()
      }
    });
    
    console.log('🚀 Enviando comando a S3...');
    await s3.send(command);
    console.log('✅ Archivo subido exitosamente:', key);
    
    return key;
  } catch (error) {
    console.error('❌ Error subiendo archivo a S3:', {
      originalName,
      mimetype,
      error: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode
    });
    throw error;
  }
}

// Genera una URL firmada temporal para acceder al archivo
async function getS3SignedUrl(key, expiresIn = 3600) {
  try {
    console.log('🔗 Generando URL firmada para:', key);
    
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    
    const url = await getSignedUrl(s3, command, { expiresIn });
    console.log('✅ URL firmada generada:', url.substring(0, 50) + '...');
    
    return url;
  } catch (error) {
    console.error('❌ Error generando URL firmada:', error);
    throw error;
  }
}

module.exports = {
  uploadFileToS3,
  getS3SignedUrl,
}; 