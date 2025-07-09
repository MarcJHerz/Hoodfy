export const formatImageUrl = (url: string | null | undefined): string => {
  if (!url) return '/images/defaults/default-avatar.png';
  
  // Si ya es una URL absoluta, retornarla tal cual
  if (url.startsWith('http')) return url;
  
  // Si es una URL relativa, agregar la URL base
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
  
  // Asegurarse de que la URL no tenga doble slash
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `${baseUrl}/${cleanUrl}`;
}; 