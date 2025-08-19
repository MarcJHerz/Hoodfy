import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface CreatorStatus {
  isCreator: boolean;
  userCommunities: any[];
  isLoading: boolean;
  error: string | null;
}

export const useIsCreator = (): CreatorStatus => {
  const [isCreator, setIsCreator] = useState(false);
  const [userCommunities, setUserCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user && token) {
      checkUserCommunities();
    } else {
      setIsLoading(false);
      setIsCreator(false);
    }
  }, [user, token]);

  const checkUserCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Usar la API correcta según el dominio
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/communities/user-created`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const communities = await response.json();
        const hasCommunities = communities.length > 0;
        setIsCreator(hasCommunities);
        setUserCommunities(communities);
      } else {
        console.error('Error checking user communities:', response.status);
        setError('Error checking user communities');
        setIsCreator(false);
      }
    } catch (error) {
      console.error('Error checking user communities:', error);
      setError('Error checking user communities');
      setIsCreator(false);
    } finally {
      setIsLoading(false);
    }
  };

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

  return { isCreator, userCommunities, isLoading, error };
};
