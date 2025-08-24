'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const NotificationPrompt = () => {
  const { notificationPermission, requestNotificationPermission, isEnabled } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // No mostrar si las notificaciones están deshabilitadas
    if (!isEnabled) {
      return;
    }

    // Mostrar el prompt solo si los permisos están en estado 'default' (no solicitados)
    if (notificationPermission === 'default') {
      // Esperar un poco antes de mostrar el prompt para no ser intrusivo
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notificationPermission, isEnabled]);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    } finally {
      setIsRequesting(false);
      // Forzar cierre del prompt en caso de error
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // No mostrar si no está habilitado, o si ya se concedieron/denegaron los permisos
  if (!isEnabled || notificationPermission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Want to receive notifications?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              We'll notify you when you receive new messages and important updates.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="flex-1 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                {isRequesting ? 'Requesting...' : 'Allow'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md transition-colors touch-manipulation"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 