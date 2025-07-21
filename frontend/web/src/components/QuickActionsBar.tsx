'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UsersIcon, 
  ChatBubbleLeftIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function QuickActionsBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Verificar si el usuario ya cerró esta barra
  useEffect(() => {
    const dismissed = localStorage.getItem('quickActionsBarDismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  // Cerrar la barra permanentemente
  const handleDismiss = () => {
    localStorage.setItem('quickActionsBarDismissed', 'true');
    setIsVisible(false);
  };

  // Toggle minimizar/expandir
  const handleToggle = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) return null;

  return (
    <div className="mb-6">
      {/* Barra compacta */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 relative">
        {/* Header con toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Acciones Rápidas
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Botón minimizar/expandir */}
            <button
              onClick={handleToggle}
              className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              <svg className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              title="Cerrar permanentemente"
            >
              <XMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Contenido colapsible */}
        <div className={`transition-all duration-300 ${isMinimized ? 'h-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Descubre y gestiona tu experiencia en Hoodfy
          </p>
          
          {/* Enlaces horizontales compactos */}
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/communities"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
            >
              <UsersIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Explorar Comunidades
              </span>
            </Link>
            
            <Link 
              href="/subscriptions"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-green-200 dark:hover:border-green-700"
            >
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Mis Suscripciones
              </span>
            </Link>
            
            <Link 
              href="/messages"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Mensajes
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 