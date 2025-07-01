'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPrompt } from './notifications/NotificationPrompt';

const NotificationInitializer = () => {
  const { isEnabled } = useNotifications();

  useEffect(() => {
    if (isEnabled) {
      console.log('📱 Notificaciones FCM habilitadas');
    } else {
      console.log('📱 Notificaciones FCM deshabilitadas (requiere Google Cloud billing)');
    }
  }, [isEnabled]);

  // Solo mostrar NotificationPrompt si las notificaciones están habilitadas
  return isEnabled ? <NotificationPrompt /> : null;
};

export default NotificationInitializer; 