import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';

// Configuración con valores por defecto para evitar errores durante build
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMO'
};

// Solo inicializar Firebase si tenemos configuración válida
let app: any = null;
let auth: any = null;
let db: any = null;
let messaging: any = null;

try {
  // Verificar si tenemos una configuración válida (no demo)
  const hasValidConfig = firebaseConfig.apiKey !== 'demo-api-key' && 
                        firebaseConfig.apiKey && 
                        firebaseConfig.projectId !== 'demo-project';

  if (hasValidConfig) {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    
    // Initialize Firestore and get a reference to the service
    db = getFirestore(app);
    
    // Initialize Firebase Cloud Messaging (solo en el cliente)
    messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;
  } else {
    console.warn('⚠️  Firebase no está configurado correctamente. Usando configuración demo para build.');
  }
} catch (error) {
  console.warn('⚠️  Error al inicializar Firebase:', error);
  // En caso de error, mantener los valores null para evitar crashes
}

export { auth, db, messaging };
export default app; 