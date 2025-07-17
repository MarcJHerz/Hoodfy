import { useState, useEffect } from 'react';
import { getSignedS3Url, getLogoSignedS3Url } from './s3';

// Cache para URLs ya resueltas
const urlCache = new Map<string, string>();

/**
 * Hook para obtener la URL de una imagen, resolviendo keys de S3 a URLs firmadas si es necesario
 * @param keyOrUrl - Puede ser una URL completa, una ruta local o un key de S3
 * @returns { url, loading, error }
 */
export function useImageUrl(keyOrUrl?: string) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      setLoading(true);
      setError(null);
      
      // Si no hay keyOrUrl, usar imagen por defecto
      if (!keyOrUrl) {
        if (isMounted) {
          setUrl('/images/defaults/default-avatar.png');
          setLoading(false);
        }
        return;
      }
      
      // Verificar cache primero
      if (urlCache.has(keyOrUrl)) {
        if (isMounted) {
          setUrl(urlCache.get(keyOrUrl)!);
          setLoading(false);
        }
        return;
      }
      
      // Si ya es una URL completa, usarla directamente
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        if (isMounted) {
          setUrl(keyOrUrl);
          setLoading(false);
        }
        // Cachear URL completa
        urlCache.set(keyOrUrl, keyOrUrl);
        return;
      }
      
      // Si es un logo (empiece con 'logos/')
      if (keyOrUrl.startsWith('logos/')) {
        try {
          const signedUrl = await getLogoSignedS3Url(keyOrUrl);
          if (isMounted) {
            setUrl(signedUrl);
            setLoading(false);
            // Cachear URL firmada
            urlCache.set(keyOrUrl, signedUrl);
          }
        } catch (err) {
          console.error('❌ Error getting signed URL for logo:', err);
          if (isMounted) {
            setError('No se pudo obtener la URL firmada del logo');
            setUrl('/images/defaults/default-avatar.png');
            setLoading(false);
          }
        }
        return;
      }
      
      // Si parece un key de S3 (contiene extensión de imagen y no es una URL)
      const isS3Key = /\.(jpg|jpeg|png|webp|gif|jfif|mp4|mov|avi)$/i.test(keyOrUrl) && 
                     !keyOrUrl.startsWith('http://') && 
                     !keyOrUrl.startsWith('https://');
      
      if (isS3Key) {
        try {
          const signedUrl = await getSignedS3Url(keyOrUrl);
          if (isMounted) {
            setUrl(signedUrl);
            setLoading(false);
            // Cachear URL firmada
            urlCache.set(keyOrUrl, signedUrl);
          }
        } catch (err) {
          console.error('❌ Error getting signed URL:', err);
          if (isMounted) {
            setError('No se pudo obtener la URL firmada');
            setUrl('/images/defaults/default-avatar.png');
            setLoading(false);
          }
        }
        return;
      }
      
      // Si es una ruta relativa local
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
      const finalUrl = `${baseUrl}/${keyOrUrl.replace(/^\//, '')}`;
      if (isMounted) {
        setUrl(finalUrl);
        setLoading(false);
        // Cachear URL local
        urlCache.set(keyOrUrl, finalUrl);
      }
    };
    
    resolveUrl();
    
    return () => { 
      isMounted = false; 
    };
  }, [keyOrUrl]);

  return { url, loading, error };
}

// Función para limpiar el cache si es necesario
export const clearImageUrlCache = () => {
  urlCache.clear();
}; 