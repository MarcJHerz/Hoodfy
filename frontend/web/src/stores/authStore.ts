import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth as apiAuth } from '@/services/api';
import { User } from '@/types/user';
import { useCommunitiesStore } from './communitiesStore';
import { usePostsStore } from './postsStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  clearAllAuthData: () => void;
  initialize: () => Promise<void>;
}

// Función para sincronizar token con cookies
const syncTokenWithCookies = (token: string | null) => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    // Establecer cookie con el token
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    // También guardar en localStorage como respaldo
    localStorage.setItem('token', token);
  } else {
    // Limpiar cookie y localStorage
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('token');
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Selectores para optimizar re-renders
      getUser: () => get().user,
      getToken: () => get().token,
      getIsLoading: () => get().isLoading,
      getIsInitialized: () => get().isInitialized,
      getError: () => get().error,
      getIsLoggingOut: () => get().isLoggingOut,
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      isLoggingOut: false,
      
      // Inicializar estado de autenticación
      initialize: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          // Verificar si hay un token JWT en localStorage o cookies
          const storedToken = localStorage.getItem('token') || 
                             document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
          
          if (storedToken) {
            // Verificar si el token JWT es válido con el backend
            try {
              const response = await apiAuth.getProfile();
              set({ 
                user: response.data, 
                token: storedToken, 
                isLoading: false, 
                isInitialized: true 
              });
              // Sincronizar token con cookies
              syncTokenWithCookies(storedToken);
            } catch (error: any) {
              console.error('Error getting profile:', error);
              // Solo limpiar si es error de autenticación, no de red
              if (error.response?.status === 401) {
                set({ 
                  user: null, 
                  token: null, 
                  isLoading: false, 
                  isInitialized: true 
                });
                syncTokenWithCookies(null);
              } else {
                // Si es error de red, mantener el token pero marcar como inicializado
                set({ 
                  isLoading: false, 
                  isInitialized: true 
                });
              }
            }
          } else {
            // No hay token JWT, verificar si hay usuario de Firebase
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
              try {
                // Obtener token de Firebase y hacer login en backend para obtener JWT
                const idToken = await firebaseUser.getIdToken();
                const response = await apiAuth.login(idToken);
                const { token, user } = response.data;
                
                set({ 
                  user, 
                  token, 
                  isLoading: false, 
                  isInitialized: true 
                });
                syncTokenWithCookies(token);
              } catch (error: any) {
                console.error('Error getting profile from Firebase user:', error);
                // Solo limpiar si es error de autenticación
                if (error.response?.status === 401) {
                  set({ 
                    user: null, 
                    token: null, 
                    isLoading: false, 
                    isInitialized: true 
                  });
                  syncTokenWithCookies(null);
                } else {
                  // Si es error de red, mantener el usuario de Firebase pero sin token
                  set({ 
                    isLoading: false, 
                    isInitialized: true 
                  });
                }
              }
            } else {
              set({ 
                user: null, 
                token: null, 
                isLoading: false, 
                isInitialized: true 
              });
            }
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ 
            user: null, 
            token: null, 
            isLoading: false, 
            isInitialized: true 
          });
          syncTokenWithCookies(null);
        }
      },
      
      // Login con Firebase y backend
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Login con Firebase
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = cred.user;
          const idToken = await firebaseUser.getIdToken();
          
          // Login con backend (JWT)
          const response = await apiAuth.login(idToken);
          const { token, user } = response.data;
          
          set({ user, token, isLoading: false });
          
          // Sincronizar token JWT con cookies
          syncTokenWithCookies(token);
          
          // Forzar sincronización con onAuthStateChanged
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: any) {
          set({ error: error.message || 'Error al iniciar sesión', isLoading: false });
          syncTokenWithCookies(null);
        }
      },
      
      // Registro con Firebase y backend
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = cred.user;
          const idToken = await firebaseUser.getIdToken();
          
          // Registro en backend
          const response = await apiAuth.register({ name, email, password });
          const { token, user } = response.data;
          
          set({ user, token, isLoading: false });
          
          // Sincronizar token JWT con cookies
          syncTokenWithCookies(token);
        } catch (error: any) {
          set({ error: error.message || 'Error al registrar', isLoading: false });
          syncTokenWithCookies(null);
        }
      },
      
      // Logout de Firebase y backend
      logout: async () => {
        set({ isLoading: true, error: null, isLoggingOut: true });
        try {
          console.log('🚪 Iniciando proceso de logout...');
          
          // Primero limpiar el estado local para evitar conflictos
          set({ user: null, token: null, isLoading: false, isInitialized: false });
          
          // Limpiar localStorage y cookies inmediatamente
          syncTokenWithCookies(null);
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('communities-storage');
          localStorage.removeItem('posts-storage');
          localStorage.removeItem('user-storage');
          localStorage.removeItem('ui-storage');
          
          // Limpiar todas las cookies relacionadas
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'communities-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'posts-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'user-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'ui-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Limpiar sessionStorage
          sessionStorage.clear();
          
          // Limpiar comunidades
          useCommunitiesStore.getState().clearCommunities();
          
          // Limpiar posts
          usePostsStore.getState().clearPosts();
          
          console.log('🧹 Datos locales limpiados, procediendo con logout de servicios...');
          
          // Luego hacer logout de Firebase y backend
          await signOut(auth);
          await apiAuth.logout();
          
          console.log('✅ Logout completado exitosamente');
          
          // Esperar un momento antes de redirigir para asegurar que todo esté limpio
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Usar window.location.href para forzar recarga completa y evitar problemas de estado
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } catch (error: any) {
          console.error('❌ Error durante logout:', error);
          // Asegurar que el estado esté limpio incluso si hay error
          set({ user: null, token: null, isLoading: false, isInitialized: false });
          syncTokenWithCookies(null);
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('communities-storage');
          localStorage.removeItem('posts-storage');
          localStorage.removeItem('user-storage');
          localStorage.removeItem('ui-storage');
          
          // En caso de error, también redirigir
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } finally {
          // Siempre limpiar la bandera de logout
          set({ isLoggingOut: false });
        }
      },
      
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        syncTokenWithCookies(token);
      },
      clearError: () => set({ error: null }),
      
      // Función para limpiar completamente todos los datos de autenticación
      clearAllAuthData: () => {
        console.log('🧹 Limpiando todos los datos de autenticación...');
        
        // Limpiar estado del store
        set({ 
          user: null, 
          token: null, 
          isLoading: false, 
          isInitialized: false,
          isLoggingOut: false,
          error: null 
        });
        
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('communities-storage');
        localStorage.removeItem('posts-storage');
        localStorage.removeItem('user-storage');
        localStorage.removeItem('ui-storage');
        
        // Limpiar cookies
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'communities-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'posts-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'user-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'ui-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Limpiar sessionStorage
        sessionStorage.clear();
        
        // Limpiar otros stores
        useCommunitiesStore.getState().clearCommunities();
        usePostsStore.getState().clearPosts();
        
        console.log('✅ Todos los datos de autenticación limpiados');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// Escuchar cambios de autenticación de Firebase y sincronizar el store
if (typeof window !== 'undefined') {
  let isProcessingAuthChange = false;
  let lastLogoutTime = 0;
  
  onAuthStateChanged(auth, async (firebaseUser) => {
    const store = useAuthStore.getState();
    const now = Date.now();
    
    // Evitar procesamiento simultáneo
    if (isProcessingAuthChange) {
      console.log('Auth change already being processed, skipping');
      return;
    }
    
    // No hacer nada si se está haciendo logout manual
    if (store.isLoggingOut) {
      console.log('Logout manual en progreso, ignorando onAuthStateChanged');
      return;
    }
    
    // Verificar si se hizo logout recientemente (dentro de los últimos 5 segundos)
    if (!firebaseUser && (now - lastLogoutTime) < 5000) {
      console.log('Logout reciente detectado, ignorando onAuthStateChanged');
      return;
    }
    
    isProcessingAuthChange = true;
    
    try {
      // Si no hay usuario de Firebase, limpiar el store
      if (!firebaseUser) {
        console.log('Firebase user logged out, clearing store');
        store.setUser(null);
        store.setToken(null);
        lastLogoutTime = now;
        return;
      }
      
      // Si hay usuario de Firebase, verificar si ya tenemos un token JWT válido
      if (store.token) {
        try {
          // Intentar usar el token JWT existente
          const response = await apiAuth.getProfile();
          store.setUser(response.data);
          console.log('Profile updated successfully using existing JWT token');
        } catch (error: any) {
          console.error('Error with existing JWT token:', error);
          // Si el token JWT no es válido, obtener uno nuevo
          if (error.response?.status === 401) {
            try {
              const idToken = await firebaseUser.getIdToken();
              const response = await apiAuth.login(idToken);
              const { token, user } = response.data;
              store.setUser(user);
              store.setToken(token);
              console.log('New JWT token obtained and profile updated');
            } catch (loginError: any) {
              console.error('Error getting new JWT token:', loginError);
              // Si no se puede obtener nuevo token, limpiar
              store.setUser(null);
              store.setToken(null);
            }
          }
        }
      } else {
        // No tenemos token JWT, obtenerlo del backend
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await apiAuth.login(idToken);
          const { token, user } = response.data;
          store.setUser(user);
          store.setToken(token);
          console.log('JWT token obtained and profile updated');
        } catch (error: any) {
          console.error('Error getting JWT token:', error);
          // Si no se puede obtener token, mantener solo el usuario de Firebase
          // pero sin token para evitar errores de API
        }
      }
    } finally {
      isProcessingAuthChange = false;
    }
  });
} 