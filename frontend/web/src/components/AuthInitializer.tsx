'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from './LoadingScreen';

export default function AuthInitializer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isInitialized, initialize } = useAuthStore();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Inicializar autenticación
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Manejar navegación basada en autenticación
  useEffect(() => {
    // Solo navegar si ya está inicializado y no está cargando
    if (isInitialized && !isLoading && !hasNavigated) {
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      const isPublicPage = pathname === '/' || pathname.startsWith('/communities') || pathname.startsWith('/explore') || pathname.startsWith('/profile/');

      if (user) {
        // Usuario autenticado
        if (isAuthPage) {
          // Si está en página de auth, redirigir al dashboard
          console.log('Usuario autenticado en página de auth, redirigiendo a dashboard');
          setHasNavigated(true);
          router.push('/dashboard');
        }
      } else {
        // Usuario no autenticado
        if (!isAuthPage && !isPublicPage) {
          // Si no está en página pública ni de auth, redirigir a login
          console.log('Usuario no autenticado, redirigiendo a login');
          setHasNavigated(true);
          router.push('/login');
        }
      }
    }
  }, [user, isLoading, isInitialized, pathname, router, hasNavigated]);

  // Resetear la bandera de navegación cuando cambia la ruta
  useEffect(() => {
    setHasNavigated(false);
  }, [pathname]);

  // Mostrar loading mientras se inicializa
  if (!isInitialized || isLoading) {
    return <LoadingScreen message="Verificando autenticación..." />;
  }

  // No renderizar nada si ya está inicializado
  return null;
} 