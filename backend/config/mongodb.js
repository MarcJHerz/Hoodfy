const mongoose = require('mongoose');

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    return false;
  }
};

// Función para verificar la conexión
const verifyConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Conexión a MongoDB establecida correctamente');
      return true;
    } else {
      console.log('❌ No hay conexión activa con MongoDB');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar la conexión:', error);
    return false;
  }
};

module.exports = {
  connectDB,
  verifyConnection
}; 