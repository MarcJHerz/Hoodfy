/**
 * Utilidad para obtener URLs firmadas de S3 desde el frontend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';

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

    const response = await fetch(`${API_BASE_URL}/api/upload/signed-url/${key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener URL firmada: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting signed S3 URL:', error);
    // Fallback: retornar la URL directa si falla
    return `${API_BASE_URL}/uploads/${key}`;
  }
} 