const mongoose = require('mongoose');

console.log('🔍 Verificando configuración de MongoDB...\n');

// Mostrar la URL de conexión (sin credenciales)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hoodfy';
const displayUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
console.log(`📡 URL de conexión: ${displayUri}`);

// Conectar a MongoDB
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000, // 45 segundos
  bufferMaxEntries: 0,
  bufferCommands: false,
});

async function checkMongoDB() {
  try {
    console.log('\n⏳ Intentando conectar...');
    
    // Esperar a que la conexión esté lista
    await mongoose.connection.asPromise();
    console.log('✅ Conectado a MongoDB exitosamente\n');
    
    // Mostrar información de la conexión
    console.log('📊 INFORMACIÓN DE LA CONEXIÓN:');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Puerto: ${mongoose.connection.port}`);
    console.log(`   Base de datos: ${mongoose.connection.name}`);
    console.log(`   Estado: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    
    // Probar una consulta simple
    console.log('\n🔍 Probando consulta simple...');
    const Community = require('../models/Community');
    const count = await Community.countDocuments();
    console.log(`✅ Consulta exitosa. Total de comunidades: ${count}`);
    
    // Probar una consulta con filtro
    console.log('\n🔍 Probando consulta con filtro...');
    const activeCount = await Community.countDocuments({ status: { $ne: 'deleted' } });
    console.log(`✅ Consulta con filtro exitosa. Comunidades activas: ${activeCount}`);
    
    console.log('\n🎉 MongoDB está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en la conexión:', error);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 DIAGNÓSTICO:');
      console.log('1. MongoDB no está ejecutándose');
      console.log('2. URL de conexión incorrecta');
      console.log('3. Problemas de red/firewall');
      console.log('4. Credenciales incorrectas');
      
      console.log('\n🔧 SOLUCIONES:');
      console.log('1. Verificar que MongoDB esté ejecutándose:');
      console.log('   sudo systemctl status mongod');
      console.log('   sudo systemctl start mongod');
      
      console.log('2. Verificar la URL en el archivo .env:');
      console.log('   MONGODB_URI=mongodb://localhost:27017/hoodfy');
      
      console.log('3. Verificar conectividad:');
      console.log('   telnet localhost 27017');
      
    } else if (error.name === 'MongooseTimeoutError') {
      console.log('\n💡 DIAGNÓSTICO: Timeout de conexión');
      console.log('1. MongoDB está lento o sobrecargado');
      console.log('2. Problemas de red');
      console.log('3. Configuración de timeout muy baja');
      
    } else {
      console.log('\n💡 DIAGNÓSTICO: Error desconocido');
      console.log('Tipo de error:', error.name);
      console.log('Mensaje:', error.message);
    }
    
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Conexión a MongoDB cerrada');
    } catch (closeError) {
      console.log('\n⚠️ Error al cerrar la conexión:', closeError.message);
    }
  }
}

// Ejecutar la verificación
checkMongoDB();
