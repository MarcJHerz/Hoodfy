require('dotenv').config();
const { verifyConnection } = require('./config/firebase');

// Función principal de prueba
const testFirebaseConnection = async () => {
  console.log('🔍 Probando conexión a Firebase...');
  const isConnected = await verifyConnection();
  
  if (isConnected) {
    console.log('✨ Todo está configurado correctamente');
  } else {
    console.log('❌ Hay problemas con la configuración');
  }
};

// Ejecutar la prueba
testFirebaseConnection(); 