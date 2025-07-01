const admin = require('firebase-admin');
require('dotenv').config();

// Verificar si ya está inicializado
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    throw error;
  }
}

module.exports = admin; 