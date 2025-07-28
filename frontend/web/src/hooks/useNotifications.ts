'use client';

import { useState, useEffect } from 'react';
import { messaging, auth } from '@/config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { toast } from 'react-hot-toast';

// Función para detectar automáticamente qué API usar según el dominio
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
  }
  
  const currentDomain = window.location.hostname;
  
  if (currentDomain === 'hoodfy.com' || currentDomain === 'www.hoodfy.com') {
    return process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
};

export const useNotifications = () => {
  const { user } = useAuthStore();
  const { chatRooms, incrementUnreadCount } = useChatStore();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // 🚧 NOTIFICACIONES TEMPORALMENTE DESHABILITADAS
  // Motivo: Requiere Google Cloud billing habilitado
  const FCM_ENABLED = true;

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if (!FCM_ENABLED) {
      return false;
    }

    if (!messaging) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        await getFCMToken();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return false;
    }
  };

  // Obtener token de FCM
  const getFCMToken = async () => {
    if (!FCM_ENABLED || !messaging || !user) return;

    try {
      // Verificar que el usuario esté completamente autenticado
      if (!auth.currentUser) {
        return;
      }

      // Esperar a que el service worker esté listo
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }

      // Agregar un pequeño delay para asegurar que todo esté inicializado
      await new Promise(resolve => setTimeout(resolve, 1000));

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'TEMP_VAPID_KEY_NEEDED';
      
      if (vapidKey === 'TEMP_VAPID_KEY_NEEDED') {
        console.error('❌ VAPID Key no configurada');
        return;
      }
      
      console.log('🔑 VAPID Key encontrada:', vapidKey.substring(0, 20) + '...');
      
      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        setFcmToken(token);
        console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...');
        await saveFCMTokenToBackend(token);
      } else {
        console.warn('⚠️ No se pudo obtener token FCM');
      }
    } catch (error) {
      console.error('Error al obtener token FCM:', error);
    }
  };

  // Enviar token FCM al backend
  const saveFCMTokenToBackend = async (token: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        console.error('❌ No se pudo obtener el token de autenticación');
        return;
      }

      console.log('📤 Enviando token FCM al backend...');

      const response = await fetch(`${getApiUrl()}/api/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fcmToken: token }),
      });

      if (response.ok) {
        console.log('✅ Token FCM guardado exitosamente en el backend');
      } else {
        console.error('❌ Error guardando token FCM en backend:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error enviando token FCM al backend:', error);
    }
  };

  // Configurar listener para mensajes en primer plano
  const setupForegroundMessageListener = () => {
    if (!FCM_ENABLED || !messaging) return;

    console.log('🎧 Configurando listener de mensajes en primer plano...');

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 Mensaje recibido en primer plano:', payload);
      
      // Reproducir sonido de notificación
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
      } catch (error) {
        console.log('Error reproduciendo sonido:', error);
      }
      
      // Mostrar notificación toast
      const { notification, data } = payload;
      if (notification) {
        toast.success(`${notification.title}: ${notification.body}`, {
          duration: 5000,
          position: 'top-right',
        });
      }

      // Actualizar contador de mensajes no leídos
      if (data?.chatId) {
        incrementUnreadCount(data.chatId);
        
        // Vibrar en dispositivos móviles
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    });

    return unsubscribe;
  };

  // Inicializar notificaciones
  useEffect(() => {
    if (!FCM_ENABLED || !user) return;

    console.log('🚀 Inicializando sistema de notificaciones...');

    const initializeNotifications = async () => {
      // Verificar si las notificaciones están soportadas
      if (!('Notification' in window)) {
        console.warn('⚠️ Este navegador no soporta notificaciones');
        return;
      }

      // Verificar permisos actuales
      const currentPermission = Notification.permission;
      setNotificationPermission(currentPermission);
      
      console.log('🔐 Permisos de notificación actuales:', currentPermission);

      if (currentPermission === 'granted') {
        console.log('✅ Permisos concedidos, obteniendo token FCM...');
        await getFCMToken();
      } else if (currentPermission === 'denied') {
        console.warn('❌ Permisos de notificación denegados');
      } else {
        console.log('⏳ Permisos de notificación no solicitados aún');
      }
    };

    initializeNotifications();
  }, [user]);

  // Configurar listeners cuando el usuario esté autenticado
  useEffect(() => {
    if (!FCM_ENABLED || !user || !messaging) return;

    const unsubscribeForeground = setupForegroundMessageListener();

    return () => {
      unsubscribeForeground?.();
    };
  }, [user, messaging]);

  return {
    notificationPermission,
    fcmToken,
    requestNotificationPermission,
    getFCMToken,
    isEnabled: FCM_ENABLED,
    isSupported: 'Notification' in window,
    hasValidConfig: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY && 
                   process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY !== 'TEMP_VAPID_KEY_NEEDED'
  };
}; 