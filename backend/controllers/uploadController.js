const { uploadFileToS3, getS3SignedUrl } = require('../utils/s3');

// POST /api/upload
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was sent.' });
    }
    const { buffer, originalname, mimetype } = req.file;
    const key = await uploadFileToS3(buffer, originalname, mimetype);
    const url = await getS3SignedUrl(key);
    res.json({ key, url });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.status(500).json({ error: 'Error uploading file to S3' });
  }
};

// GET /api/upload/signed-url/:key (requires authentication)
exports.getSignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) return res.status(400).json({ error: 'Key required' });
    const url = await getS3SignedUrl(key);
    res.json({ url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Error generating signed URL' });
  }
};

// GET /api/upload/logo/:key (public, no authentication required)
exports.getLogoSignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) return res.status(400).json({ error: 'Key required' });
    
    // Verify it's a logo (starts with 'logos/')
    if (!key.startsWith('logos/')) {
      return res.status(403).json({ error: 'Only logos are allowed' });
    }
    
    const url = await getS3SignedUrl(key);
    
    res.json({ url });
  } catch (error) {
    console.error('❌ Error generating signed URL for logo:', error);
    res.status(500).json({ error: 'Error generating signed URL for logo' });
  }
}; 