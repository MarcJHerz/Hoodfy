const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy', {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  bufferMaxEntries: 0,
  bufferCommands: false,
});

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a MongoDB...\n');
    
    // Esperar a que la conexión esté lista
    console.log('⏳ Conectando...');
    await mongoose.connection.asPromise();
    console.log('✅ Conectado a MongoDB exitosamente\n');
    
    // Probar una consulta simple
    console.log('🔍 Probando consulta simple...');
    const Community = require('../models/Community');
    const count = await Community.countDocuments();
    console.log(`✅ Consulta exitosa. Total de comunidades: ${count}\n`);
    
    console.log('🎉 Conexión y consultas funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en la conexión:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Sugerencias:');
      console.log('1. Verifica que MongoDB esté ejecutándose');
      console.log('2. Verifica la URL de conexión en MONGODB_URI');
      console.log('3. Verifica la conectividad de red');
      console.log('4. Verifica que el puerto 27017 esté abierto');
    }
    
    console.log('\n🔧 Para verificar MongoDB:');
    console.log('sudo systemctl status mongod');
    console.log('sudo systemctl start mongod');
    
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Conexión a MongoDB cerrada');
    } catch (closeError) {
      console.log('\n⚠️ Error al cerrar la conexión:', closeError.message);
    }
  }
}

// Ejecutar la prueba
testConnection();
