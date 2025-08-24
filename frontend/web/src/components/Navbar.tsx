'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useEffect, useCallback, useState, Fragment } from 'react';
import {
  HomeIcon,
  UsersIcon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { useAuthStore, useUIStore } from '@/stores';
import { Dialog, Transition } from '@headlessui/react';
import Image from 'next/image';
import { useChatStore } from '@/stores/chatStore';
import { useTheme } from 'next-themes';
import { useImageUrl } from '@/utils/useImageUrl';
import { UserAvatar } from './UserAvatar';
import Logo from './Logo';
import NotificationDropdown from './notifications/NotificationDropdown';
import ChatNotificationBadge from './chat/ChatNotificationBadge';
import { useIsCreator } from '@/hooks/useIsCreator';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const SearchModal = dynamic(() => import('./SearchModal'), { ssr: false });

const Navbar = React.memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Usar stores de Zustand
  const { user, logout, isLoading } = useAuthStore();
  const { url: profileImageUrl } = useImageUrl(user?.profilePicture);
  const { 
    isSearchModalOpen, 
    profileMenuOpen, 
    mobileSidebarOpen,
    openSearchModal, 
    closeSearchModal,
    setProfileMenuOpen,
    toggleMobileSidebar
  } = useUIStore();
  const { getTotalUnreadCount } = useChatStore();
  
  // Hook para verificar si el usuario es creador
  const { isCreator } = useIsCreator();
  // Hook para verificar si el usuario es admin
  const { isAdmin } = useIsAdmin();

  // Create navItems dynamically with the current user ID
  const navItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Home' },
    { href: '/communities', icon: UsersIcon, label: 'Communities' },
    { href: '/messages', icon: ChatBubbleLeftIcon, label: 'Messages' },
  ];

  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/');
  const isUserProfilePage = pathname.startsWith('/profile/') && pathname !== '/profile';

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efecto para theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Efecto para atajo de teclado ⌘K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearchModal]);

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
      console.log('Logout button PRESSED');
      setProfileMenuOpen(false);
      await logout();
      console.log('Logout initiated from Navbar');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/login';
    }
  }, [logout, setProfileMenuOpen]);

  const handleGoTo = (path: string) => {
    router.push(path);
    setTimeout(() => setProfileMenuOpen(false), 150);
  };

  const toggleTheme = () => {
    console.log('🔧 [Theme Debug] Current theme:', theme);
    console.log('🔧 [Theme Debug] Resolved theme:', theme);
    console.log('🔧 [Theme Debug] Document class:', document.documentElement.classList.toString());
    
    // Forzar cambio explícito
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      console.log('🔧 [Theme Debug] Cambiando a light');
      setTheme('light');
    } else {
      console.log('🔧 [Theme Debug] Cambiando a dark');
      setTheme('dark');
    }
    
    // Verificar después de un momento si se aplicó
    setTimeout(() => {
      console.log('🔧 [Theme Debug] Después del cambio - Document class:', document.documentElement.classList.toString());
      console.log('🔧 [Theme Debug] Después del cambio - Theme:', theme);
    }, 100);
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50' 
        : 'bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Logo size="md" showText={false} href="/dashboard" />
          </div>

          {/* Buscador central */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-full max-w-md">
              <button
                type="button"
                className="w-full px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 shadow-sm hover:shadow-md placeholder-gray-400 flex items-center gap-3 cursor-text group"
                onClick={openSearchModal}
                tabIndex={0}
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
                <span className="text-left flex-1 text-gray-500 dark:text-gray-400">
                  Search people, topics or communities...
                </span>
                <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>
          </div>

          {/* Navegación e íconos */}
          <div className="flex items-center gap-2 relative">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname.startsWith(href);
              const isMessages = href.includes('messages');
              
              return (
              <Link
                key={href}
                href={href}
                  className={`group relative flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isActive 
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                title={label}
              >
                  <div className="relative">
                    <Icon className={`h-6 w-6 mb-1 transition-all duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                    
                    {/* Badge de notificaciones mejorado para mensajes */}
                    {isMessages && (
                      <div className="absolute -top-2 -right-2">
                        <ChatNotificationBadge size="sm" animated />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden lg:block transition-all duration-200 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : ''
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
            
            {/* Dropdown de notificaciones */}
            {user && <NotificationDropdown />}
            
            {/* Avatar que abre el menú tipo dropdown */}
            {user && (
              <div className="relative ml-2">
                <button
                  className="flex items-center focus:outline-none group"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-label="Open profile menu"
                >
                  <div className="relative">
                    <UserAvatar
                      size={32}
                      source={user.profilePicture}
                      name={user.name || 'User'}
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/10 group-hover:to-accent-500/10 transition-all duration-200"></div>
                  </div>
                </button>
                
                {/* Dropdown menu */}
                <Transition
                  show={profileMenuOpen}
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <div ref={menuRef} className="absolute right-0 mt-2 w-72 glass-strong rounded-2xl shadow-strong border border-gray-200/50 dark:border-gray-700/50 py-4 z-50">
                    {/* Profile header */}
                    <div className="flex flex-col items-center gap-3 mb-4 px-4">
                        <UserAvatar
                        size={48}
                          source={user.profilePicture}
                        name={user.name || 'User'}
                        />
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.name || 'User'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Profile actions */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <button
                        onClick={() => handleGoTo('/profile')}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                          >
                        <UserCircleIcon className="h-5 w-5" />
                        View profile
                          </button>
                          <button
                            onClick={() => handleGoTo('/profile/edit')}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                          >
                        <UserCircleIcon className="h-5 w-5" />
                        Edit profile
                          </button>
                          <button
                            onClick={() => handleGoTo('/subscriptions')}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Mis Suscripciones
                          </button>
                          
                          {/* Creator Dashboard - Solo mostrar si es creador */}
                          {isCreator && (
                            <button
                              onClick={() => handleGoTo('/creator-dashboard')}
                              className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Creator Dashboard
                            </button>
                          )}
                          
                          {/* Admin Dashboard - Solo mostrar si es admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleGoTo('/admin')}
                              className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Admin Dashboard
                            </button>
                          )}
                      </div>
                      
                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <button
                          onClick={handleLogout}
                          disabled={isLoading}
                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center gap-3 disabled:opacity-50"
                        >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        {isLoading ? 'Signing out...' : 'Sign out'}
                        </button>
                    </div>
                  </div>
                </Transition>
              </div>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between h-16">
          {/* Mobile navigation left - Botón hamburger */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              title="Open menu"
            >
              <Bars3Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </button>
            
            {/* Solo mostrar mensajes aquí ya que el resto está en el sidebar */}
            {navItems.slice(2, 3).map(({ href, icon: Icon, label }) => {
              const isActive = pathname.startsWith(href);
              
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title={label}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    <div className="absolute -top-2 -right-2">
                      <ChatNotificationBadge size="sm" animated />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile logo */}
          <Logo size="md" showText href="/dashboard" />
            
          {/* Mobile navigation right */}
          <div className="flex items-center gap-1">
            <button
              onClick={openSearchModal}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
              title="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  title="Profile"
                >
                  <UserAvatar
                    size={28}
                    source={user.profilePicture}
                    name={user.name || 'User'}
                  />
                </button>
                
                {/* Mobile profile dropdown */}
                <Transition
                  show={profileMenuOpen}
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <div ref={menuRef} className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl shadow-strong border border-gray-200/50 dark:border-gray-700/50 py-4 z-50">
                    {/* Profile header */}
                    <div className="flex flex-col items-center gap-3 mb-4 px-4">
                      <UserAvatar
                        size={48}
                        source={user.profilePicture}
                        name={user.name || 'User'}
                        />
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.name || 'User'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Profile actions */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <button
                        onClick={() => handleGoTo('/profile')}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        View profile
                      </button>
                      <button
                        onClick={() => handleGoTo('/profile/edit')}
                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center gap-3"
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        Edit profile
                      </button>
                    </div>

                    {/* Creator Dashboard - Solo para creadores */}
                    {isCreator && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <button
                          onClick={() => handleGoTo('/dashboard/creator')}
                          className="w-full px-4 py-2 text-left text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 flex items-center gap-3"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Creator Dashboard
                        </button>
                      </div>
                    )}

                    {/* Admin Dashboard - Solo para administradores */}
                    {isAdmin && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <button
                          onClick={() => handleGoTo('/admin')}
                          className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center gap-3"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Admin Dashboard
                        </button>
                      </div>
                    )}

                    {/* Mis Suscripciones */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <button
                        onClick={() => handleGoTo('/subscriptions')}
                        className="w-full px-4 py-2 text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 flex items-center gap-3"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Mis Suscripciones
                      </button>
                    </div>
                      
                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <button
                          onClick={handleLogout}
                          disabled={isLoading}
                        className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 flex items-center gap-3 disabled:opacity-50"
                        >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        {isLoading ? 'Signing out...' : 'Sign out'}
                        </button>
                    </div>
                  </div>
                </Transition>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de búsqueda - Disponible tanto para desktop como móvil */}
      <SearchModal open={isSearchModalOpen} onClose={closeSearchModal} />
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;