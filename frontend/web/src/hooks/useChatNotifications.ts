import { useEffect, useRef } from 'react';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';

interface UseChatNotificationsProps {
  enabled?: boolean;
  onNewMessage?: (message: any) => void;
}

export const useChatNotifications = ({ 
  enabled = true, 
  onNewMessage 
}: UseChatNotificationsProps = {}) => {
  const { user } = useAuthStore();
  const messagingRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !user?._id) return;

    const initializeMessaging = async () => {
      try {
        // Verificar si el navegador soporta notificaciones
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications');
          return;
        }

        // Solicitar permisos
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permissions denied');
            return;
          }
        }

        // Inicializar Firebase Messaging
        const messaging = getMessaging();
        messagingRef.current = messaging;

        // Obtener token para notificaciones
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (token) {
          console.log('Notification token obtained:', token);
          // Aquí podrías enviar el token al backend para guardarlo
          // await api.post('/api/users/notification-token', { token });
        }

        // Escuchar mensajes en primer plano
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Message received in foreground:', payload);
          
          const { notification, data } = payload;
          
          if (notification) {
            // Mostrar notificación toast
            const message = notification.body 
              ? `${notification.title || 'New message'}: ${notification.body}`
              : notification.title || 'New message';
            
            toast.success(message, {
              duration: 5000,
            });
          }

          // Llamar callback si se proporciona
          if (onNewMessage && data) {
            onNewMessage(data);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    const unsubscribe = initializeMessaging();

    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub?.());
      }
    };
  }, [enabled, user?._id, onNewMessage]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notifications enabled');
      return true;
    } else {
      toast.error('Notification permissions denied');
      return false;
    }
  };

  return {
    requestPermission,
    isSupported: 'Notification' in window,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default'
  };
}; 