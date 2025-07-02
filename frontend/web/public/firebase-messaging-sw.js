importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configuración dinámica de Firebase (se obtiene del cliente)
let firebaseApp;

// Escuchar mensajes del cliente principal para obtener la configuración
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('🔧 Configurando Firebase en Service Worker con credenciales dinámicas');
    
    if (!firebaseApp) {
      firebaseApp = firebase.initializeApp(event.data.config);
      console.log('✅ Firebase inicializado en Service Worker');
    }
  }
});

// Configuración de respaldo (si no se recibe del cliente)
// IMPORTANTE: La configuración real debe enviarse desde el cliente
// Este es solo un fallback con valores de desarrollo
if (!firebaseApp) {
  try {
    firebaseApp = firebase.initializeApp({
      apiKey: "YOUR_FIREBASE_API_KEY_HERE", // Esta clave debe enviarse desde el cliente
      authDomain: "hoodfy-a43f4.firebaseapp.com", 
      projectId: "hoodfy-a43f4",
      storageBucket: "hoodfy-a43f4.firebasestorage.app",
      messagingSenderId: "457055892109",
      appId: "1:457055892109:web:2f9776aa9e4c32b33268c4",
      measurementId: "G-PJJKQKZZ16"
    });
    console.log('✅ Firebase inicializado con configuración de respaldo');
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
  }
}

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Mensaje recibido en segundo plano:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje',
    icon: '/default-avatar.png', // Usar ícono existente
    badge: '/default-avatar.png', // Usar ícono existente  
    tag: payload.data?.chatId || 'default', // Evitar notificaciones duplicadas
    requireInteraction: false, // Permitir que se cierre automáticamente
    sound: '/notification-sound.mp3', // Sonido de notificación
    vibrate: [200, 100, 200], // Patrón de vibración
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: '📖 Abrir',
        icon: '/default-avatar.png'
      },
      {
        action: 'close', 
        title: '❌ Cerrar',
        icon: '/default-avatar.png'
      }
    ],
    silent: false, // Permitir sonido
    renotify: true, // Notificar cada mensaje nuevo
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Click en notificación:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Abrir la aplicación o enfocar ventana existente
    const url = event.notification.data?.click_action || '/messages';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notificación cerrada:', event.notification.data);
}); 