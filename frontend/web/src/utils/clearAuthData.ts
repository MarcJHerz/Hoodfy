// Utilidad para limpiar todos los datos de autenticación persistentes
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;

  // Limpiar localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('auth-storage');
  localStorage.removeItem('communities-storage');
  localStorage.removeItem('posts-storage');
  localStorage.removeItem('ui-storage');
  localStorage.removeItem('user-storage');

  // Limpiar cookies
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'communities-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'posts-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'ui-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'user-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // Limpiar sessionStorage
  sessionStorage.clear();

  // Limpiar IndexedDB si existe
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name && db.name.includes('auth') || db.name.includes('storage')) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }

  console.log('Todos los datos de autenticación han sido limpiados');
}; 