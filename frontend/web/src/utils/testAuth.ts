// Utilidad para probar y debuggear el estado de autenticación
export const testAuth = () => {
  if (typeof window === 'undefined') {
    console.log('No estamos en el navegador');
    return;
  }

  console.log('=== DEBUG AUTH STATE ===');
  
  // Verificar localStorage
  console.log('localStorage token:', localStorage.getItem('token'));
  console.log('localStorage auth-storage:', localStorage.getItem('auth-storage'));
  
  // Verificar cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  console.log('Cookies:', cookies);
  console.log('Cookie token:', cookies.token);
  
  // Verificar sessionStorage
  console.log('sessionStorage keys:', Object.keys(sessionStorage));
  
  // Verificar IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      console.log('IndexedDB databases:', databases);
    });
  }
  
  // Verificar Firebase auth state
  import('@/config/firebase').then(({ auth }) => {
    console.log('Firebase current user:', auth.currentUser);
    console.log('Firebase auth state:', auth.authStateReady());
  });
  
  console.log('=== END DEBUG ===');
};

// Función para simular un login completo
export const simulateLogin = async (email: string, password: string) => {
  console.log('=== SIMULATING LOGIN ===');
  
  try {
    // Importar Firebase auth
    const { auth } = await import('@/config/firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    // Login con Firebase
    console.log('1. Login con Firebase...');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase login exitoso:', cred.user.email);
    
    // Obtener token de Firebase
    console.log('2. Obteniendo token de Firebase...');
    const idToken = await cred.user.getIdToken();
    console.log('Token obtenido:', idToken.substring(0, 20) + '...');
    
    // Login con backend
    console.log('3. Login con backend...');
    const { auth: apiAuth } = await import('@/services/api');
    const response = await apiAuth.login(idToken);
    console.log('Backend response:', response.data);
    
    // Verificar estado final
    console.log('4. Verificando estado final...');
    testAuth();
    
    console.log('=== LOGIN SIMULATION COMPLETE ===');
    return response.data;
  } catch (error) {
    console.error('Error en simulación de login:', error);
    throw error;
  }
}; 