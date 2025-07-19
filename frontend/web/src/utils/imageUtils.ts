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

/**
 * Formatea una URL de imagen para asegurar que sea válida
 * @param url - La URL de la imagen
 * @returns La URL formateada
 */
export const formatImageUrl = (url?: string): string => {
  if (!url) return '/images/defaults/default-avatar.png';
  
  // Si ya es una URL completa, devolverla tal como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si es una ruta relativa, construir la URL completa
  const baseUrl = getApiUrl();
  return `${baseUrl}/${url.replace(/^\//, '')}`;
};

/**
 * Verifica si una URL es una imagen
 * @param url - La URL a verificar
 * @returns true si es una imagen
 */
export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('image/');
};

/**
 * Verifica si una URL es un video
 * @param url - La URL a verificar
 * @returns true si es un video
 */
export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const lowerUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('video/');
};