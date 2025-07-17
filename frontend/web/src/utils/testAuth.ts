// Utilidad para probar y debuggear el estado de autenticación
export const testAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Verificar localStorage
  const token = localStorage.getItem('token');
  const authStorage = localStorage.getItem('auth-storage');
  
  // Verificar cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  // Verificar sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  
  // Verificar IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      // Solo verificar que existe, sin mostrar contenido
    });
  }
  
  // Verificar Firebase auth state
  import('@/config/firebase').then(({ auth }) => {
    // Solo verificar estado, sin mostrar información sensible
  });
};

// Función para simular un login completo
export const simulateLogin = async (email: string, password: string) => {
  try {
    // Importar Firebase auth
    const { auth } = await import('@/config/firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    // Login con Firebase
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // Obtener token de Firebase
    const idToken = await cred.user.getIdToken();
    
    // Login con backend
    const { auth: apiAuth } = await import('@/services/api');
    const response = await apiAuth.login(idToken);
    
    // Verificar estado final
    testAuth();
    
    return response.data;
  } catch (error) {
    console.error('Error en simulación de login:', error);
    throw error;
  }
}; 