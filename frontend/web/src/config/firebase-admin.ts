// @ts-ignore
import * as admin from 'firebase-admin';

// Verificar si ya está inicializado
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    const isBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64 === 'true';
    
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Faltan variables de entorno para Firebase Admin');
    }

    // Decodificar Base64 si está configurado
    if (isBase64) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }
    
    // Procesar saltos de línea
    privateKey = privateKey.replace(/\\n/g, '\n');

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