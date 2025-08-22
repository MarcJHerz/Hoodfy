const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUserRoles() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Actualizar todos los usuarios existentes para agregar campos role y status
    const updateResult = await User.updateMany(
      { role: { $exists: false } }, // Solo usuarios sin campo role
      { 
        $set: { 
          role: 'user',
          status: 'active'
        }
      }
    );
    console.log(`✅ Actualizados ${updateResult.modifiedCount} usuarios existentes`);

    // 2. Buscar si ya existe un usuario admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Ya existe un usuario admin:', existingAdmin.email);
    } else {
      // 3. Crear el primer usuario admin (marcelo.sbd@hotmail.com)
      const adminUser = await User.findOneAndUpdate(
        { email: 'marcelo.sbd@hotmail.com' },
        { 
          role: 'admin',
          status: 'active'
        },
        { new: true }
      );

      if (adminUser) {
        console.log('✅ Usuario marcelo.sbd@hotmail.com promovido a ADMIN');
        console.log('📧 Email:', adminUser.email);
        console.log('👤 Username:', adminUser.username);
        console.log('🔑 Rol:', adminUser.role);
        console.log('📊 Estado:', adminUser.status);
      } else {
        console.log('❌ Usuario marcelo.sbd@hotmail.com no encontrado');
        console.log('💡 Asegúrate de que el usuario exista antes de ejecutar este script');
      }
    }

    // 4. Mostrar estadísticas finales
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Estadísticas de roles:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} usuarios`);
    });

    const statusStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Estadísticas de estado:');
    statusStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} usuarios`);
    });

    console.log('\n🎉 Script ejecutado exitosamente!');
    console.log('💡 Ahora puedes acceder al panel admin con marcelo.sbd@hotmail.com');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
updateUserRoles();
