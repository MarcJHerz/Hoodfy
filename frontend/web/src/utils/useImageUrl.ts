import { useState, useEffect } from 'react';
import { getSignedS3Url, getLogoSignedS3Url } from './s3';

// Cache para URLs firmadas
const urlCache = new Map<string, string>();

// Función para detectar automáticamente qué API usar según el dominio
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
  }
  
  const currentDomain = window.location.hostname;
  
  if (currentDomain === 'hoodfy.com' || currentDomain === 'www.hoodfy.com') {
    return process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
};

// Función para generar URL directa de S3 para imágenes públicas
const getPublicS3Url = (key: string): string => {
  const bucket = 'hoodfy-community-media';
  const region = 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// Función para detectar si una imagen es pública
const isPublicImage = (key: string): boolean => {
  return key.startsWith('public/') || key.startsWith('logos/');
};

// Función para detectar si es un key de S3 válido
const isValidS3Key = (key: string): boolean => {
  return /\.(jpg|jpeg|png|webp|gif|jfif|mp4|mov|avi)$/i.test(key) && 
         !key.startsWith('http://') && 
         !key.startsWith('https://');
};

export function useImageUrl(keyOrUrl?: string) {
  const [url, setUrl] = useState<string>('/images/defaults/default-avatar.png');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyOrUrl) {
      setUrl('/images/defaults/default-avatar.png');
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const resolveUrl = async () => {
      // Si ya es una URL completa, usarla directamente
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        if (isMounted) {
          setUrl(keyOrUrl);
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
      
      // Si es una imagen pública (empiece con 'public/' o 'logos/')
      if (isPublicImage(keyOrUrl)) {
        const publicUrl = getPublicS3Url(keyOrUrl);
        if (isMounted) {
          setUrl(publicUrl);
          setLoading(false);
          // Cachear URL pública
          urlCache.set(keyOrUrl, publicUrl);
        }
        return;
      }
      
      // Si es un key de S3 válido (contiene extensión de imagen)
      if (isValidS3Key(keyOrUrl)) {
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
      const baseUrl = getApiUrl();
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