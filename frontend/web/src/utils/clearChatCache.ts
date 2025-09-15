// Utilidad para limpiar el cache de chats
export const clearChatCache = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Limpiar localStorage de datos de chat
    const keysToRemove = [
      'chat-storage',
      'firebase-chat-data',
      'chat-storage-v1',
      'chat-storage-v2'
    ];
    
    keysToRemove.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        console.log(`🧹 Limpiando cache de chat: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage también
    sessionStorage.clear();
    
    console.log('✅ Cache de chats limpiado exitosamente');
    
    // Recargar la página para aplicar los cambios
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error limpiando cache de chats:', error);
  }
};

// Función para verificar qué hay en el cache
export const debugChatCache = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🔍 DEBUGGING CHAT CACHE:');
  
  // Verificar localStorage
  const chatStorage = localStorage.getItem('chat-storage');
  if (chatStorage) {
    try {
      const data = JSON.parse(chatStorage);
      console.log('📊 chat-storage data:', data);
      
      if (data.state?.chatRooms) {
        console.log('💬 Chat rooms en cache:', data.state.chatRooms.length);
        data.state.chatRooms.forEach((chat: any, index: number) => {
          console.log(`  ${index + 1}. Chat ID: ${chat.id}, Nombre: ${chat.name}, Tipo: ${chat.type}`);
        });
      }
    } catch (error) {
      console.error('❌ Error parseando chat-storage:', error);
    }
  } else {
    console.log('📭 No hay datos en chat-storage');
  }
  
  // Verificar otras claves
  const otherKeys = ['firebase-chat-data', 'chat-storage-v1', 'chat-storage-v2'];
  otherKeys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      console.log(`📦 ${key}:`, item.substring(0, 100) + '...');
    }
  });
};
