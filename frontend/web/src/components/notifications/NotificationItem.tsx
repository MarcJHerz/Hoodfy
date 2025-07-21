'use client';

import { Notification, useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotificationStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Iconos por tipo de notificación
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

  // Colores por tipo de notificación
  const getColorClasses = (type: Notification['type']) => {
    switch (type) {
      case 'subscription_success':
      case 'payment_success':
        return 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20';
      case 'payment_failed':
      case 'subscription_canceled':
        return 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
      case 'subscription_expiring':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20';
      case 'new_post':
      case 'new_comment':
      case 'community_update':
        return 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  // Manejar click en la notificación
  const handleClick = async () => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navegar a la URL de acción si existe
    if (notification.metadata.actionUrl) {
      router.push(notification.metadata.actionUrl);
      onClose?.();
    }
  };

  // Manejar eliminación
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se active el click del item
    setIsDeleting(true);
    
    try {
      await deleteNotification(notification._id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setIsDeleting(false);
    }
  };

  // Formatear fecha
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es
  });

  return (
    <div
      className={`
        relative p-4 border rounded-lg cursor-pointer
        transition-all duration-200 hover:shadow-md
        ${getColorClasses(notification.type)}
        ${!notification.read ? 'ring-2 ring-blue-500/20' : ''}
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Indicador de no leída */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}

      {/* Contenido principal */}
      <div className="flex items-start space-x-3">
        {/* Icono */}
        <div className="flex-shrink-0 text-2xl">
          {getIcon(notification.type)}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className={`
            text-sm font-medium text-gray-900 dark:text-gray-100
            ${!notification.read ? 'font-semibold' : ''}
          `}>
            {notification.title}
          </h4>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {timeAgo}
          </p>
        </div>

        {/* Botón de eliminar */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="
            flex-shrink-0 p-1 text-gray-400 hover:text-red-500
            rounded transition-colors duration-200
            opacity-0 group-hover:opacity-100 hover:opacity-100
          "
          aria-label="Eliminar notificación"
          title="Eliminar notificación"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>

      {/* Información adicional (metadata) */}
      {notification.metadata.amount && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Monto: ${notification.metadata.amount}
        </div>
      )}
      
      {notification.metadata.daysUntilExpiration && (
        <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
          Expira en {notification.metadata.daysUntilExpiration} día(s)
        </div>
      )}
    </div>
  );
} 