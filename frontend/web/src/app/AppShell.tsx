'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import AuthInitializer from '@/components/AuthInitializer';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { initialize, isInitialized } = useAuthStore();
  
  // Ocultar navbar en login, register y landing
  const hideNavbar = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');

  // Inicializar el AuthStore globalmente
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return (
    <>
      <AuthInitializer />
      {!hideNavbar && <Navbar />}
      <main className={!hideNavbar ? 'pt-16' : ''}>
        {children}
      </main>
    </>
  );
} 