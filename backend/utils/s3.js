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

// Sube un archivo a S3 y retorna el key
async function uploadFileToS3(buffer, originalName, mimetype) {
  const ext = path.extname(originalName);
  const key = `${uuidv4()}${ext}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });
  await s3.send(command);
  return key;
}

// Genera una URL firmada temporal para acceder al archivo
async function getS3SignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

module.exports = {
  uploadFileToS3,
  getS3SignedUrl,
}; 