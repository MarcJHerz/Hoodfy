require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadFileToS3 } = require('../utils/s3');

// Función para subir el avatar por defecto a S3
const uploadDefaultAvatar = async () => {
  try {
    const defaultAvatarPath = path.join(__dirname, '../../frontend/web/public/images/defaults/default-avatar.png');
    
    if (!fs.existsSync(defaultAvatarPath)) {
      console.log('❌ No se encontró la imagen por defecto del avatar');
      return;
    }

    const fileBuffer = fs.readFileSync(defaultAvatarPath);
    const fileName = 'default-avatar.png';
    
    console.log('📤 Subiendo avatar por defecto a S3...');
    
    const key = await uploadFileToS3(fileBuffer, fileName, 'image/png');
    
    if (key) {
      console.log('✅ Avatar por defecto subido exitosamente a S3');
      console.log('🔑 Key:', key);
      
      // Guardar el key en el archivo de configuración
      const configPath = path.join(__dirname, '../config/defaultAvatarKey.js');
      const configContent = `module.exports = '${key}';`;
      fs.writeFileSync(configPath, configContent);
      console.log('📝 Key guardado en config/defaultAvatarKey.js');
    } else {
      console.log('❌ Error al subir el avatar por defecto');
    }
  } catch (error) {
    console.error('❌ Error al subir el avatar por defecto:', error);
  }
};

// Función para subir la imagen por defecto de comunidad a S3
const uploadDefaultCommunityImage = async () => {
  try {
    const defaultCommunityPath = path.join(__dirname, '../../frontend/web/public/images/defaults/default-community.png');
    
    if (!fs.existsSync(defaultCommunityPath)) {
      console.log('❌ No se encontró la imagen por defecto de la comunidad');
      return;
    }

    const fileBuffer = fs.readFileSync(defaultCommunityPath);
    const fileName = 'default-community.png';
    
    console.log('📤 Subiendo imagen por defecto de comunidad a S3...');
    
    const key = await uploadFileToS3(fileBuffer, fileName, 'image/png');
    
    if (key) {
      console.log('✅ Imagen por defecto de comunidad subida exitosamente a S3');
      console.log('🔑 Key:', key);
      
      // Podrías guardar este key también si lo necesitas en el futuro
      console.log('💡 Considera guardar este key para uso futuro en comunidades sin imagen');
    } else {
      console.log('❌ Error al subir la imagen por defecto de comunidad');
    }
  } catch (error) {
    console.error('❌ Error al subir la imagen por defecto de comunidad:', error);
  }
};

// Función principal
const main = async () => {
  console.log('🚀 Iniciando subida de imágenes por defecto...');
  await uploadDefaultAvatar();
  await uploadDefaultCommunityImage();
  console.log('🎉 Proceso completado');
};

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { uploadDefaultAvatar, uploadDefaultCommunityImage }; 