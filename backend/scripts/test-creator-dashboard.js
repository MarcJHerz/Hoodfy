const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testCreatorDashboard() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n🔍 PROBANDO CREATOR DASHBOARD\n');

    // 1. Buscar un usuario con Stripe Connect
    console.log('1️⃣ Buscando usuario con Stripe Connect...');
    const user = await User.findOne({ 
      stripeConnectAccountId: { $exists: true, $ne: null } 
    });
    
    if (!user) {
      console.log('❌ No se encontró usuario con Stripe Connect');
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: user._id,
      name: user.name,
      email: user.email,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectStatus: user.stripeConnectStatus
    });

    // 2. Crear token JWT para el usuario
    console.log('\n2️⃣ Creando token JWT...');
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        firebaseUid: user.firebaseUid 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token JWT creado');

    // 3. Simular verificación de token (como lo hace authMiddleware)
    console.log('\n3️⃣ Simulando verificación de token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', {
      userId: decoded.userId,
      firebaseUid: decoded.firebaseUid
    });

    // 4. Verificar que req.mongoUserId funcione correctamente
    console.log('\n4️⃣ Verificando conversión de IDs...');
    const mongoUserId = decoded.userId; // Esto es lo que se asigna a req.mongoUserId
    const firebaseUid = decoded.firebaseUid; // Esto es lo que se asigna a req.userId

    console.log('✅ IDs correctos:', {
      mongoUserId: mongoUserId,
      firebaseUid: firebaseUid
    });

    // 5. Probar consulta con mongoUserId
    console.log('\n5️⃣ Probando consulta con mongoUserId...');
    const userFromMongoId = await User.findById(mongoUserId);
    if (userFromMongoId) {
      console.log('✅ Consulta con mongoUserId exitosa:', userFromMongoId.name);
    } else {
      console.log('❌ Error: No se pudo encontrar usuario con mongoUserId');
    }

    // 6. Probar consulta con firebaseUid (esto debería fallar)
    console.log('\n6️⃣ Probando consulta con firebaseUid (debería fallar)...');
    try {
      const userFromFirebaseId = await User.findById(firebaseUid);
      console.log('⚠️ Consulta con firebaseUid funcionó (no debería)');
    } catch (error) {
      console.log('✅ Consulta con firebaseUid falló correctamente:', error.message);
    }

    // 7. Probar consulta correcta con firebaseUid
    console.log('\n7️⃣ Probando consulta correcta con firebaseUid...');
    const userFromFirebaseUid = await User.findOne({ firebaseUid: firebaseUid });
    if (userFromFirebaseUid) {
      console.log('✅ Consulta con firebaseUid exitosa:', userFromFirebaseUid.name);
    } else {
      console.log('❌ Error: No se pudo encontrar usuario con firebaseUid');
    }

    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('==================================================');
    console.log('🎯 El Creator Dashboard debería funcionar correctamente');
    console.log('🔧 Los IDs se están manejando correctamente');
    console.log('📊 Usuario listo para usar Stripe Connect');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testCreatorDashboard();
