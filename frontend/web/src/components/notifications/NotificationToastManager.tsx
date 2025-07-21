'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import NotificationToast from './NotificationToast';

interface ToastNotification extends Notification {
  id: string;
  showAsToast: boolean;
}

export default function NotificationToastManager() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { newNotifications, markAsRead, clearNewNotifications } = useNotificationStore();

  // Escuchar nuevas notificaciones
  useEffect(() => {
    // Procesar todas las nuevas notificaciones
    if (newNotifications.length > 0) {
      const newToasts: ToastNotification[] = [];
      
      newNotifications.forEach(notification => {
        // Verificar si ya está en los toasts actuales
        const existingToast = toasts.find(t => t._id === notification._id);
        if (!existingToast && !notification.read) {
          const toastId = `toast-${notification._id}-${Date.now()}`;
          newToasts.push({
            ...notification,
            id: toastId,
            showAsToast: true
          });
        }
      });

      if (newToasts.length > 0) {
        // Agregar nuevos toasts (máximo 3 total)
        setToasts(prev => [...newToasts, ...prev].slice(0, 3));
      }

      // Limpiar las nuevas notificaciones después de procesarlas
      clearNewNotifications();
    }
  }, [newNotifications, toasts, clearNewNotifications]);

  // Remover toast
  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  // Manejar acción del toast (marcar como leída)
  const handleToastAction = async (notification: ToastNotification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    removeToast(notification.id);
  };

  return (
    <div className="fixed top-16 right-0 z-50 pointer-events-none">
      <div className="space-y-2 p-4">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index
            }}
          >
            <NotificationToast
              notification={toast}
              onClose={() => removeToast(toast.id)}
              onAction={() => handleToastAction(toast)}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 