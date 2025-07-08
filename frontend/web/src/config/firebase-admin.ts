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
    
    console.log('🔍 Firebase Admin Debug:');
    console.log('- projectId:', projectId);
    console.log('- clientEmail:', clientEmail);
    console.log('- storageBucket:', storageBucket);
    console.log('- isBase64:', isBase64);
    console.log('- privateKey (first 50 chars):', privateKey?.substring(0, 50));
    
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Faltan variables de entorno para Firebase Admin');
    }

    // Decodificar Base64 si está configurado
    if (isBase64) {
      console.log('🔧 Decodificando private key desde Base64...');
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
      console.log('✅ Base64 decodificado. Nuevos primeros 50 chars:', privateKey.substring(0, 50));
    } else {
      console.log('⚠️ No se detectó Base64. Usando private key directamente.');
    }
    
    // Procesar saltos de línea
    privateKey = privateKey.replace(/\\n/g, '\n');
    console.log('🔧 Procesando saltos de línea. Resultado (primeros 50 chars):', privateKey.substring(0, 50));
    
    // Verificar formato PEM
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ La private key no tiene el formato PEM correcto');
      throw new Error('Private key no tiene formato PEM válido');
    }
    
    console.log('✅ Private key parece tener formato PEM válido');

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