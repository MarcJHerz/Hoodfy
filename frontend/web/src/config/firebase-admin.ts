// @ts-ignore
import * as admin from 'firebase-admin';

// Verificar si ya está inicializado
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Solo mostrar debug info si tenemos configuración real
    if (projectId && clientEmail && privateKey && projectId !== 'demo-project') {
      console.log('🔍 Firebase Admin Debug:');
      console.log('- projectId:', projectId);
      console.log('- clientEmail:', clientEmail);
      console.log('- storageBucket:', storageBucket);
      console.log('- privateKey (first 50 chars):', privateKey?.substring(0, 50));
    }
    
    // Verificar si tenemos configuración válida
    if (!projectId || !clientEmail || !privateKey || projectId === 'demo-project') {
      console.warn('⚠️  Firebase Admin: Variables de entorno no disponibles durante build. Skipping inicialización.');
      // No inicializar Firebase Admin durante build sin credenciales
    } else {
      // Procesar saltos de línea: convertir \n a saltos reales
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      console.log('🔧 Private key después de procesar saltos (primeros 100 chars):', privateKey.substring(0, 100));
      console.log('🔧 Private key después de procesar saltos (últimos 50 chars):', privateKey.substring(privateKey.length - 50));
      
      // Verificar formato PEM
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
        console.error('❌ La private key no tiene el formato PEM correcto');
        throw new Error('Private key no tiene formato PEM válido');
      }
      
      console.log('✅ Private key tiene formato PEM válido');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
      console.log('✅ Firebase Admin inicializado correctamente en frontend');
    }
  } catch (error) {
    console.warn('⚠️ Error al inicializar Firebase Admin en frontend:', error);
    // No lanzar error durante build - solo loguear advertencia
  }
}

export default admin; 