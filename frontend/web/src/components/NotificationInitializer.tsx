'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPrompt } from './notifications/NotificationPrompt';

const NotificationInitializer = () => {
  const { isEnabled, isSupported, hasValidConfig } = useNotifications();

  useEffect(() => {
    if (isEnabled && hasValidConfig) {
      console.log('📱 Notificaciones FCM habilitadas y configuradas correctamente');
    } else if (isEnabled && !hasValidConfig) {
      console.warn('⚠️ Notificaciones FCM habilitadas pero VAPID Key no configurada');
    } else {
      console.log('📱 Notificaciones FCM deshabilitadas');
    }
    
    if (!isSupported) {
      console.warn('⚠️ Este navegador no soporta notificaciones push');
    }
  }, [isEnabled, isSupported, hasValidConfig]);

  // Solo mostrar NotificationPrompt si las notificaciones están habilitadas y configuradas
  return (isEnabled && hasValidConfig && isSupported) ? <NotificationPrompt /> : null;
};

export default NotificationInitializer; 