#!/usr/bin/env node

/**
 * Script para crear usuarios de prueba para testing del chat
 * Uso: node scripts/create-test-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');

// Configurar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema de Usuario
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  profilePicture: String,
  firebaseUid: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema de Ally
const allySchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'accepted' },
  createdAt: { type: Date, default: Date.now }
});

const Ally = mongoose.model('Ally', allySchema);

async function createTestUsers() {
  console.log('🧪 Creando usuarios de prueba para testing del chat...');
  
  try {
    // 1. Crear usuarios de prueba en Firebase
    const testUsers = [
      {
        name: 'Test User 1',
        username: 'testuser1',
        email: 'testuser1@hoodfy.com',
        password: 'Test123!'
      },
      {
        name: 'Test User 2', 
        username: 'testuser2',
        email: 'testuser2@hoodfy.com',
        password: 'Test123!'
      },
      {
        name: 'Test User 3',
        username: 'testuser3', 
        email: 'testuser3@hoodfy.com',
        password: 'Test123!'
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      try {
        // Crear usuario en Firebase
        const firebaseUser = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name
        });

        console.log(`✅ Usuario Firebase creado: ${userData.name} (${firebaseUser.uid})`);

        // Crear usuario en MongoDB
        const mongoUser = new User({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          firebaseUid: firebaseUser.uid,
          profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`
        });

        await mongoUser.save();
        console.log(`✅ Usuario MongoDB creado: ${userData.name} (${mongoUser._id})`);

        createdUsers.push({
          firebaseUid: firebaseUser.uid,
          mongoId: mongoUser._id,
          name: userData.name,
          email: userData.email
        });

      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.name}:`, error.message);
      }
    }

    // 2. Crear alianzas entre usuarios de prueba
    if (createdUsers.length >= 2) {
      console.log('\n🤝 Creando alianzas entre usuarios de prueba...');
      
      // Crear alianza entre User 1 y User 2
      const ally1 = new Ally({
        user1: createdUsers[0].mongoId,
        user2: createdUsers[1].mongoId,
        status: 'accepted'
      });
      await ally1.save();
      console.log(`✅ Alianza creada: ${createdUsers[0].name} ↔ ${createdUsers[1].name}`);

      // Crear alianza entre User 1 y User 3
      const ally2 = new Ally({
        user1: createdUsers[0].mongoId,
        user2: createdUsers[2].mongoId,
        status: 'accepted'
      });
      await ally2.save();
      console.log(`✅ Alianza creada: ${createdUsers[0].name} ↔ ${createdUsers[2].name}`);
    }

    // 3. Mostrar resumen
    console.log('\n📋 RESUMEN DE USUARIOS CREADOS:');
    console.log('================================');
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      console.log(`   MongoDB ID: ${user.mongoId}`);
      console.log(`   Password: Test123!`);
      console.log('');
    });

    console.log('🎉 Usuarios de prueba creados exitosamente!');
    console.log('💡 Puedes usar estos usuarios para probar el chat');

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Conexión a MongoDB cerrada');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestUsers().catch(console.error);
}

module.exports = createTestUsers;
