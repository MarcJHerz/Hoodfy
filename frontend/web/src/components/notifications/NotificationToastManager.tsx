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
  const { notifications, markAsRead } = useNotificationStore();

  // Escuchar nuevas notificaciones
  useEffect(() => {
    // Obtener la última notificación
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Verificar si es una notificación nueva (creada en los últimos 30 segundos)
      const createdAt = new Date(latestNotification.createdAt);
      const now = new Date();
      const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
      
      // Si es nueva y no leída, mostrar como toast
      if (diffInSeconds < 30 && !latestNotification.read) {
        const toastId = `toast-${latestNotification._id}-${Date.now()}`;
        
        // Verificar si ya está en los toasts
        const existingToast = toasts.find(t => t._id === latestNotification._id);
        if (!existingToast) {
          const toastNotification: ToastNotification = {
            ...latestNotification,
            id: toastId,
            showAsToast: true
          };
          
          setToasts(prev => [toastNotification, ...prev.slice(0, 2)]); // Máximo 3 toasts
        }
      }
    }
  }, [notifications, toasts]);

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