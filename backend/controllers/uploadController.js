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

// GET /api/upload/signed-url/:key (requiere autenticación)
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

// GET /api/upload/logo/:key (público, sin autenticación)
exports.getLogoSignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    console.log('🔍 getLogoSignedUrl called with key:', key);
    
    if (!key) return res.status(400).json({ error: 'Key requerido' });
    
    // Verificar que sea un logo (empiece con 'logos/')
    if (!key.startsWith('logos/')) {
      return res.status(403).json({ error: 'Solo se permiten logos' });
    }
    
    console.log('🔗 Getting signed URL for logo:', key);
    const url = await getS3SignedUrl(key);
    console.log('✅ Got signed URL for logo:', url.substring(0, 50) + '...');
    
    res.json({ url });
  } catch (error) {
    console.error('❌ Error al generar URL firmada del logo:', error);
    res.status(500).json({ error: 'Error al generar URL firmada del logo' });
  }
}; 