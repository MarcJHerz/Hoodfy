'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useCallback, useState } from 'react';
import {
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  HomeIcon,
  UsersIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useAuthStore, useUIStore } from '@/stores';
import { useTheme } from 'next-themes';
import Image from 'next/image';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });

// Función para formatear la URL de la imagen de perfil
const formatImageUrl = (url?: string) => {
  if (!url) return '/images/defaults/default-avatar.png';
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.87:5000';
  return `${baseUrl}/${url.replace(/^\//, '')}`;
};

export default function MobileNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user, logout, isLoading } = useAuthStore();
  const { 
    isSearchModalOpen, 
    profileMenuOpen,
    openSearchModal, 
    closeSearchModal,
    setProfileMenuOpen
  } = useUIStore();

  const isProfilePage = pathname === '/profile';
  const isUserProfilePage = pathname.startsWith('/profile/') && pathname !== '/profile';

  // Items de navegación para la barra inferior
  const bottomNavItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Inicio' },
    { href: '/communities', icon: UsersIcon, label: 'Comunidades' },
    { href: '/messages', icon: ChatBubbleLeftIcon, label: 'Mensajes' },
  ];

  // Efecto para theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileMenuOpen, setProfileMenuOpen]);

  const handleLogout = useCallback(async () => {
    try {
      setProfileMenuOpen(false);
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      window.location.href = '/login';
    }
  }, [logout, setProfileMenuOpen]);

  const handleGoTo = (path: string) => {
    router.push(path);
    setTimeout(() => setProfileMenuOpen(false), 150);
  };

  const toggleTheme = () => {
    console.log('Current theme:', theme);
    if (theme === 'system') {
      // Si está en system, cambiar a light o dark basado en la preferencia actual del sistema
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'light' : 'dark');
    } else {
      // Alternar entre light y dark
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    }
    console.log('Theme changed to:', theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Navbar superior */}
      <nav className="md:hidden fixed top-0 left-0 w-full z-30 bg-white dark:bg-gray-900 shadow-md border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">H</span>
            </div>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">Hoodfy</span>
          </Link>
        </div>
        
        {/* Centro: Buscador */}
        <div className="flex-1 flex justify-center items-center px-3">
          <button
            type="button"
              className="w-full max-w-xs px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 shadow-sm flex items-center gap-2 cursor-text hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={openSearchModal}
            tabIndex={0}
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              <span className="text-left flex-1 text-gray-500 dark:text-gray-400 text-sm truncate">Buscar...</span>
          </button>
        </div>
        
        {/* Iconos de acción */}
        <div className="flex items-center space-x-2">
          {/* Notificaciones */}
          <button
            onClick={() => router.push('/dashboard/notifications')}
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
            title="Notificaciones"
            aria-label="Notificaciones"
            type="button"
          >
            <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </button>
          
          {/* Perfil */}
          {user && (
            <div className="relative">
              <button
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-label="Abrir menú de perfil"
              >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-700 shadow-sm ring-2 ring-white dark:ring-gray-900">
                  <Image
                    src={formatImageUrl(user.profilePicture)}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </button>
              
              {/* Menú de perfil mejorado */}
              {profileMenuOpen && (
                  <div ref={menuRef} className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-4 z-50 animate-fade-in">
                  {/* Header del perfil */}
                  <div className="flex flex-col items-center gap-3 mb-4 px-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-primary-200 dark:border-primary-700 shadow-lg ring-2 ring-white dark:ring-gray-800">
                      <Image
                        src={formatImageUrl(user.profilePicture)}
                        alt="Avatar"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        priority
                      />
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">@{user.email}</div>
                      </div>
                  </div>
                  
                  {/* Opciones del menú */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {isProfilePage ? (
                      <>
                        <button
                            className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                          onClick={() => handleGoTo('/profile/edit')}
                        >
                          <UserCircleIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">Editar perfil</span>
                        </button>
                        <button
                            className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                          onClick={() => handleGoTo('/profile')}
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">Configuración</span>
                        </button>
                      </>
                    ) : isUserProfilePage ? (
                      <button
                          className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                        onClick={() => handleGoTo('/profile')}
                      >
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Ver mi perfil</span>
                      </button>
                    ) : (
                      <button
                          className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                        onClick={() => handleGoTo(`/profile/${user._id}`)}
                      >
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">Ver perfil</span>
                      </button>
                    )}
                    
                    {/* Toggle tema */}
                    {mounted && (
                      <button
                        onClick={toggleTheme}
                        className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                      >
                        {theme === 'dark' ? (
                          <SunIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <MoonIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        </span>
                      </button>
                    )}
                    
                    <button
                        className="w-full text-left py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3"
                      onClick={() => handleGoTo('/help')}
                    >
                      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Ayuda y soporte</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                        className="w-full text-left py-3 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>{isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
      
      {/* Barra de navegación inferior */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-4">
          {bottomNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium truncate">{label}</span>
              </Link>
            );
          })}
          
          {/* Botón de búsqueda */}
          <button
            onClick={openSearchModal}
            className="flex flex-col items-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 min-w-0"
          >
            <MagnifyingGlassIcon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Buscar</span>
          </button>
        </div>
      </nav>
      
      {/* Modal de búsqueda */}
      <SearchModal open={isSearchModalOpen} onClose={closeSearchModal} />
    </>
  );
} 