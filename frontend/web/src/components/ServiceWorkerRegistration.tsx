'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('🔄 Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registrado exitosamente:', registration);
      
      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Nueva versión del Service Worker disponible');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ Service Worker actualizado');
              toast.success('Notificaciones actualizadas', {
                duration: 3000,
                position: 'bottom-right'
              });
            }
          });
        }
      });

      // Verificar si hay un service worker esperando
      if (registration.waiting) {
        console.log('🔄 Service Worker en espera, activando...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  };

  return null; // Este componente no renderiza nada
} 