import { useEffect, useState } from 'react';
import api from '@/services/api';

export async function getSignedS3Url(key: string): Promise<string> {
  const response = await api.get(`/api/upload/signed-url/${key}`);
  return response.data.url;
}

/**
 * Hook para obtener la URL de una imagen, resolviendo keys de S3 a URLs firmadas si es necesario
 * @param keyOrUrl - Puede ser una URL completa, una ruta local o un key de S3
 * @returns { url, loading, error }
 */
export function useImageUrlResolved(keyOrUrl?: string) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const resolveUrl = async () => {
      setLoading(true);
      setError(null);
      
      console.log('🔍 useImageUrl Processing:', {
        keyOrUrl,
        isS3Key: keyOrUrl ? /^[a-zA-Z0-9\-]+\.(jpg|jpeg|png|webp|gif|jfif|mp4|mov|avi)$/i.test(keyOrUrl) : false,
        isHttpUrl: keyOrUrl ? (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) : false,
        timestamp: new Date().toISOString()
      });
      
      // Si no hay keyOrUrl, usar imagen por defecto
      if (!keyOrUrl) {
        console.log('🔍 No keyOrUrl provided, using default avatar');
        if (isMounted) {
          setUrl('/images/defaults/default-avatar.png');
          setLoading(false);
        }
        return;
      }
      
      // Si ya es una URL completa, usarla directamente
      if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
        console.log('🔍 Using existing HTTP URL:', keyOrUrl);
        if (isMounted) {
          setUrl(keyOrUrl);
          setLoading(false);
        }
        return;
      }
      
      // Si parece un key de S3 (no contiene "/" o contiene extensión de imagen)
      const isS3Key = /^[a-zA-Z0-9\-]+\.(jpg|jpeg|png|webp|gif|jfif|mp4|mov|avi)$/i.test(keyOrUrl);
      if (isS3Key) {
        try {
          console.log('🔍 Getting signed URL for S3 key:', keyOrUrl);
          const signedUrl = await getSignedS3Url(keyOrUrl);
          console.log('🔍 Signed URL obtained:', signedUrl);
          if (isMounted) {
            setUrl(signedUrl);
            setLoading(false);
          }
        } catch (err) {
          console.error('🔍 Error getting signed URL:', err);
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
      console.log('🔍 Using relative path, final URL:', finalUrl);
      if (isMounted) {
        setUrl(finalUrl);
        setLoading(false);
      }
    };
    
    resolveUrl();
    
    return () => { 
      isMounted = false; 
    };
  }, [keyOrUrl]);

  return { url, loading, error };
}

// Mantener el nombre original para compatibilidad
export const useImageUrl = useImageUrlResolved; 