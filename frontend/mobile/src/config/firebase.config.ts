import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  projectId: "hoodfy-a43f4",
  storageBucket: "hoodfy-a43f4.firebasestorage.app",
  messagingSenderId: "457055892109",
  appId: "1:457055892109:android:5a30730c44d8593c3268c4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export { app, auth }; 