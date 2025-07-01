require('dotenv').config();
const { connectDB, verifyConnection } = require('./config/mongodb');

// Función principal de prueba
const testMongoDBConnection = async () => {
  console.log('🔍 Probando conexión a MongoDB...');
  
  // Intentar conectar
  const connected = await connectDB();
  
  if (connected) {
    // Verificar el estado de la conexión
    const isConnected = await verifyConnection();
    
    if (isConnected) {
      console.log('✨ Todo está configurado correctamente');
    } else {
      console.log('❌ Hay problemas con la conexión');
    }
  }
};

// Ejecutar la prueba
testMongoDBConnection(); 