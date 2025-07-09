const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Genera una miniatura de un video usando ffmpeg
 * @param {string} videoPath - Ruta del archivo de video
 * @param {string} outputPath - Ruta donde guardar la miniatura
 * @param {number} time - Tiempo en segundos para extraer el frame (por defecto 1 segundo)
 * @returns {Promise<string>} - Ruta de la miniatura generada
 */
const generateThumbnail = (videoPath, outputPath, time = 1) => {
  return new Promise((resolve, reject) => {
    // Verificar que el archivo de video existe
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`El archivo de video no existe: ${videoPath}`));
    }

    // Crear el directorio de salida si no existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [time],
        filename: path.basename(outputPath),
        folder: outputDir,
        size: '320x240' // Tamaño de la miniatura
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error al generar miniatura:', err);
        reject(err);
      });
  });
};

/**
 * Genera una miniatura para un video subido
 * @param {string} filename - Nombre del archivo de video
 * @param {string} baseUrl - URL base del servidor
 * @returns {Promise<string>} - URL de la miniatura generada
 */
const generateVideoThumbnail = async (filename, baseUrl) => {
  try {
    const videoPath = path.join(__dirname, '../uploads/posts', filename);
    const thumbnailFilename = `${path.parse(filename).name}_thumb.jpg`;
    const thumbnailPath = path.join(__dirname, '../uploads/posts/thumbnails', thumbnailFilename);
    
    await generateThumbnail(videoPath, thumbnailPath);
    
    // Retornar la URL de la miniatura
    return `${baseUrl}/uploads/posts/thumbnails/${thumbnailFilename}`;
  } catch (error) {
    console.error('Error al generar miniatura de video:', error);
    // Si falla la generación, retornar null
    return null;
  }
};

module.exports = {
  generateThumbnail,
  generateVideoThumbnail
}; 