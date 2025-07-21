'use client';

import { useNotificationStore } from '@/stores/notificationStore';
import { useEffect, useState, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationItem from './NotificationItem';
import NotificationBadge from './NotificationBadge';

interface NotificationDropdownProps {
  buttonClassName?: string;
  dropdownClassName?: string;
}

export default function NotificationDropdown({ 
  buttonClassName = '',
  dropdownClassName = ''
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAllAsRead,
    clearError,
    addNewNotification
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications({ page: 1, limit: 10 });
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  // Manejar toggle del dropdown
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (error) clearError();
  };

  // Manejar marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Cerrar dropdown
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`
          relative p-2 text-gray-600 hover:text-gray-900 
          dark:text-gray-300 dark:hover:text-gray-100
          rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors duration-200
          ${buttonClassName}
        `}
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Icono de campana */}
        <BellIcon className="w-6 h-6" />

        {/* Badge de notificaciones no leídas */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <NotificationBadge size="sm" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute right-0 top-full mt-2 z-50
            w-96 max-w-[calc(100vw-2rem)]
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            max-h-96 overflow-hidden
            ${dropdownClassName}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} no leídas)
                </span>
              )}
            </h3>

            {/* Botón marcar todas como leídas */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="
                  text-sm text-blue-600 hover:text-blue-800
                  dark:text-blue-400 dark:hover:text-blue-300
                  hover:underline
                "
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Contenido */}
          <div className="max-h-80 overflow-y-auto">
            {/* Loading */}
            {isLoading && notifications.length === 0 && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
                <button
                  onClick={() => fetchNotifications({ page: 1, limit: 10 })}
                  className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Lista de notificaciones */}
            {!isLoading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, 10).map((notification) => (
                  <div key={notification._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <NotificationItem 
                      notification={notification} 
                      onClose={handleClose}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Estado vacío */}
            {!isLoading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  No hay notificaciones
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Te notificaremos cuando algo importante suceda
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
            {/* Test Toast Button (temporal) */}
            <button
              onClick={() => {
                const testNotification = {
                  _id: 'test-' + Date.now(),
                  user: 'current-user',
                  type: 'new_post' as const,
                  title: 'Nueva publicación de prueba',
                  message: 'Este es un toast de prueba para verificar que funciona correctamente',
                  read: false,
                  createdAt: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  metadata: {
                    actionUrl: '/communities/test'
                  }
                };
                addNewNotification(testNotification);
                handleClose();
              }}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              🧪 Probar Toast (Debug)
            </button>
            
            {notifications.length > 10 && (
              <button
                onClick={() => {
                  handleClose();
                  // Aquí podrías navegar a una página completa de notificaciones
                  // router.push('/notifications');
                }}
                className="
                  w-full text-center text-blue-600 hover:text-blue-800
                  dark:text-blue-400 dark:hover:text-blue-300
                  text-sm hover:underline
                "
              >
                Ver todas las notificaciones
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 