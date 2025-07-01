'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  // Usar el AuthStore de Zustand
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Limpiar errores previos

    try {
      await login(email, password);
      // El AuthStore maneja la navegación automáticamente
    } catch (err: any) {
      // El error ya está manejado en el store
      console.error('Error en login:', err);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    // TODO: Implementar login con Google usando el AuthStore
    // Por ahora, mostrar mensaje de que no está implementado
    console.log('Login con Google no implementado aún');
  };

  // Función temporal para limpiar datos de debug
  const clearAuthData = () => {
    if (typeof window === 'undefined') return;

    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('communities-storage');
    localStorage.removeItem('posts-storage');
    localStorage.removeItem('ui-storage');
    localStorage.removeItem('user-storage');

    // Limpiar cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'communities-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'posts-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'ui-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Limpiar sessionStorage
    sessionStorage.clear();

    console.log('Datos de autenticación limpiados');
    window.location.reload();
  };

  // Función para debuggear el estado actual
  const debugAuthState = () => {
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
      console.log('Firebase auth state ready:', auth.authStateReady());
    });
    
    console.log('=== END DEBUG ===');
  };

  // Función para simular login completo
  const simulateLogin = async () => {
    if (!email || !password) {
      alert('Por favor ingresa email y contraseña primero');
      return;
    }

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
      debugAuthState();
      
      console.log('=== LOGIN SIMULATION COMPLETE ===');
      return response.data;
    } catch (error) {
      console.error('Error en simulación de login:', error);
      alert('Error en simulación: ' + (error as any).message);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Iniciar sesión
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleLogin}>
        <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Correo electrónico
          </label>
            <div className="mt-2">
          <input
                id="email"
                name="email"
            type="email"
                autoComplete="email"
                required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
            </div>
        </div>

        <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
            Contraseña
          </label>
            <div className="mt-2">
          <input
                id="password"
                name="password"
            type="password"
                autoComplete="current-password"
                required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
            </div>
        </div>

        {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
        )}

          <div>
        <button
          type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white px-6 text-gray-900">O continuar con</span>
            </div>
          </div>

          <div className="mt-6">
        <button
          onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285f4]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          ¿No tienes una cuenta?{' '}
          <a href="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Regístrate aquí
          </a>
        </p>

        {/* Botones de debug temporales */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 space-y-2 text-center">
            <button
              onClick={clearAuthData}
              className="block w-full text-xs text-gray-500 hover:text-red-500 underline"
            >
              [DEBUG] Limpiar datos de autenticación
            </button>
            <button
              onClick={debugAuthState}
              className="block w-full text-xs text-gray-500 hover:text-blue-500 underline"
            >
              [DEBUG] Ver estado de autenticación
            </button>
            <button
              onClick={simulateLogin}
              className="block w-full text-xs text-gray-500 hover:text-green-500 underline"
            >
              [DEBUG] Simular login completo
        </button>
          </div>
        )}
      </div>
    </div>
  );
} 