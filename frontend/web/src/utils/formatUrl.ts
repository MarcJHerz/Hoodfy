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

export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/images/defaults/default-avatar.png';
  
  // Si ya es una URL absoluta, retornarla tal cual
  if (url.startsWith('http')) return url;
  
  // Si es una URL relativa, agregar la URL base
  const baseUrl = getApiUrl();
  
  // Asegurarse de que la URL no tenga doble slash
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${baseUrl}/${cleanUrl}`;
}; 