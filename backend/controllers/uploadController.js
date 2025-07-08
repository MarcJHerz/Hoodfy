const { uploadFileToS3, getS3SignedUrl } = require('../utils/s3');

// POST /api/upload
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo.' });
    }
    const { buffer, originalname, mimetype } = req.file;
    const key = await uploadFileToS3(buffer, originalname, mimetype);
    const url = await getS3SignedUrl(key);
    res.json({ key, url });
  } catch (error) {
    console.error('Error al subir archivo a S3:', error);
    res.status(500).json({ error: 'Error al subir archivo a S3' });
  }
};

// GET /api/upload/signed-url/:key
exports.getSignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) return res.status(400).json({ error: 'Key requerido' });
    const url = await getS3SignedUrl(key);
    res.json({ url });
  } catch (error) {
    console.error('Error al generar URL firmada:', error);
    res.status(500).json({ error: 'Error al generar URL firmada' });
  }
}; 