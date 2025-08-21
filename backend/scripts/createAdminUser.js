const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Ya existe un usuario admin:', existingAdmin.email);
      return;
    }

    // Crear usuario admin desde cero
    const adminUser = new User({
      name: 'Marc Admin',
      username: 'marcadmin',
      email: 'marc@oodfy.com',
      firebaseUid: 'admin_' + Date.now(), // Firebase UID temporal
      role: 'admin',
      status: 'active',
      bio: 'Administrador del sistema Hoodfy',
      category: 'Tecnología',
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await adminUser.save();
    
    console.log('✅ Usuario admin creado exitosamente!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Username:', adminUser.username);
    console.log('🔑 Rol:', adminUser.role);
    console.log('📊 Estado:', adminUser.status);
    console.log('💡 Ahora puedes acceder al panel admin');

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 11000) {
      console.log('💡 El usuario ya existe. Usa el script updateUserRoles.js en su lugar.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
createAdminUser();
