import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configuración de Google Sign-In
GoogleSignin.configure({
  webClientId: '457055892109-6oofl3tk170o4pjlks0kptr3gkssdlsb.apps.googleusercontent.com',
});

// Función para iniciar sesión con Google
export async function signInWithGoogle() {
  try {
    // Obtener el ID token del usuario
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const { accessToken } = await GoogleSignin.getTokens();

    // Crear una credencial de Google con el token
    const googleCredential = auth.GoogleAuthProvider.credential(accessToken);

    // Iniciar sesión con Firebase usando la credencial
    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.error('Error en Google Sign-In:', error);
    throw error;
  }
}

// Función para iniciar sesión con email y contraseña
export async function signInWithEmail(email: string, password: string) {
  try {
    return await auth().signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Error en Email Sign-In:', error);
    throw error;
  }
}

// Función para registrar con email y contraseña
export async function signUpWithEmail(email: string, password: string) {
  try {
    return await auth().createUserWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Error en Email Sign-Up:', error);
    throw error;
  }
}

// Función para cerrar sesión
export async function signOut() {
  try {
    await GoogleSignin.signOut();
    return await auth().signOut();
  } catch (error) {
    console.error('Error en Sign-Out:', error);
    throw error;
  }
}

export default {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
}; 