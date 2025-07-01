// @ts-ignore
import * as admin from 'firebase-admin';

// Verificar si ya está inicializado
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Faltan variables de entorno para Firebase Admin');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    console.log('✅ Firebase Admin inicializado correctamente en frontend');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin en frontend:', error);
    throw error;
  }
}

export default admin; 