/**
 * Utilidad para obtener URLs firmadas de S3 desde el frontend
 */

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

const API_BASE_URL = getApiUrl();

/**
 * Genera una URL directa de S3 para imágenes públicas
 * @param key - El key del archivo en S3
 * @returns string - La URL directa
 */
export function getPublicS3Url(key: string): string {
  const bucket = 'hoodfy-community-media';
  const region = 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Detecta si una imagen es pública (no necesita URL firmada)
 * @param key - El key del archivo en S3
 * @returns boolean - True si es imagen pública
 */
export function isPublicImage(key: string): boolean {
  return key.startsWith('public/') || key.startsWith('logos/');
}

/**
 * Obtiene una URL firmada de S3 para un key específico
 * @param key - El key del archivo en S3
 * @returns Promise<string> - La URL firmada
 */
export async function getSignedS3Url(key: string): Promise<string> {
  try {
    // Obtener el token de autenticación
    const token = localStorage.getItem('token') || 
                  document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    const url = `${API_BASE_URL}/api/upload/signed-url/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`Error al obtener URL firmada: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('❌ Error getting signed S3 URL:', error);
    // Fallback: retornar la URL directa si falla
    return `${API_BASE_URL}/uploads/${key}`;
  }
}

/**
 * Obtiene una URL firmada de S3 para logos (sin autenticación)
 * @param key - El key del logo en S3
 * @returns Promise<string> - La URL firmada
 */
export async function getLogoSignedS3Url(key: string): Promise<string> {
  try {
    const url = `${API_BASE_URL}/api/upload/logo/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Logo Response error:', errorText);
      throw new Error(`Error al obtener URL firmada del logo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('❌ Error getting signed S3 URL for logo:', error);
    // Fallback: retornar la URL directa si falla
    return `${API_BASE_URL}/uploads/${key}`;
  }
} 