'use client';

import { useUnreadNotifications } from '@/stores/notificationStore';
import { useEffect } from 'react';

interface NotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
}

export default function NotificationBadge({ 
  className = '', 
  size = 'md',
  showZero = false 
}: NotificationBadgeProps) {
  const { unreadCount, fetchUnreadCount, shouldRefresh } = useUnreadNotifications();

  // Refrescar conteo si es necesario
  useEffect(() => {
    if (shouldRefresh) {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount, shouldRefresh]);

  // No mostrar si no hay notificaciones no leídas (a menos que showZero sea true)
  if (unreadCount === 0 && !showZero) {
    return null;
  }

  // Tamaños de badge
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  // Limitar el número mostrado
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <span 
      className={`
        inline-flex items-center justify-center
        ${sizeClasses[size]}
        bg-red-500 text-white font-semibold
        rounded-full
        ${className}
      `}
      role="status"
      aria-label={`${unreadCount} notificaciones no leídas`}
    >
      {displayCount}
    </span>
  );
} 