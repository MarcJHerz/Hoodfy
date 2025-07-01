const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};

// Verificar que todas las variables de entorno necesarias estén presentes
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Faltan las siguientes variables de entorno: ${missingEnvVars.join(', ')}`);
}

// Inicializar la app de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Función para verificar la conexión
const verifyConnection = async () => {
  try {
    // Intentar obtener la lista de usuarios (solo para verificar la conexión)
    await admin.auth().listUsers(1);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Firebase:', error);
    return false;
  }
};

module.exports = {
  admin,
  verifyConnection
}; 