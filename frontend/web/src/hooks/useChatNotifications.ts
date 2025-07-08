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
          console.log('Este navegador no soporta notificaciones');
          return;
        }

        // Solicitar permisos
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Permisos de notificación denegados');
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
          console.log('Token de notificación obtenido:', token);
          // Aquí podrías enviar el token al backend para guardarlo
          // await api.post('/api/users/notification-token', { token });
        }

        // Escuchar mensajes en primer plano
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Mensaje recibido en primer plano:', payload);
          
          const { notification, data } = payload;
          
          if (notification) {
            // Mostrar notificación toast
            const message = notification.body 
              ? `${notification.title || 'Nuevo mensaje'}: ${notification.body}`
              : notification.title || 'Nuevo mensaje';
            
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
        console.error('Error al inicializar notificaciones:', error);
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
      toast.error('Tu navegador no soporta notificaciones');
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notificaciones habilitadas');
      return true;
    } else {
      toast.error('Permisos de notificación denegados');
      return false;
    }
  };

  return {
    requestPermission,
    isSupported: 'Notification' in window,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default'
  };
}; 