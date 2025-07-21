'use client';

import { useEffect, useState } from 'react';
import { Notification } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

export default function NotificationToast({ 
  notification, 
  onClose, 
  onAction 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const router = useRouter();

  // Animar entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-cerrar después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Obtener icono por tipo
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'subscription_success':
        return '🎉';
      case 'new_post':
        return '📝';
      case 'new_comment':
        return '💬';
      case 'subscription_expiring':
        return '⚠️';
      case 'payment_failed':
        return '💳';
      case 'payment_success':
        return '✅';
      case 'subscription_canceled':
        return '❌';
      case 'community_update':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Obtener colores por tipo
  const getColorClasses = (type: Notification['type']) => {
    switch (type) {
      case 'subscription_success':
      case 'payment_success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'payment_failed':
      case 'subscription_canceled':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      case 'subscription_expiring':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'new_post':
      case 'new_comment':
      case 'community_update':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      default:
        return 'border-gray-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  // Manejar cierre con animación
  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Manejar click en la notificación
  const handleClick = () => {
    if (notification.metadata.actionUrl) {
      router.push(notification.metadata.actionUrl);
    }
    onAction?.();
    handleClose();
  };

  return (
    <div
      className={`
        fixed top-20 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          relative border-l-4 rounded-lg shadow-lg backdrop-blur-lg
          p-4 cursor-pointer group
          hover:shadow-xl transition-all duration-200
          ${getColorClasses(notification.type)}
        `}
        onClick={handleClick}
      >
        {/* Botón de cerrar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="
            absolute top-2 right-2 p-1
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            rounded-full hover:bg-white/50 dark:hover:bg-gray-700/50
            transition-colors duration-200
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenido principal */}
        <div className="flex items-start space-x-3 pr-6">
          {/* Icono animado */}
          <div className="flex-shrink-0 text-2xl animate-bounce">
            {getIcon(notification.type)}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1 line-clamp-1">
              {notification.title}
            </h4>
            
            <p className="text-sm opacity-90 line-clamp-2 mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-75">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: es
                })}
              </span>
              
              {notification.metadata.actionUrl && (
                <span className="text-xs font-medium opacity-75">
                  Toca para ver →
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 dark:bg-gray-700/30 rounded-b-lg overflow-hidden">
          <div className="h-full bg-current opacity-50 animate-shrink-width"></div>
        </div>
      </div>
    </div>
  );
} 