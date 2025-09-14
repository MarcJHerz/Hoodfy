import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect } from 'react';

export const useIsAdmin = () => {
  const { user, token } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !token) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Usar la URL de la API correcta según el dominio
        const apiUrl = window.location.hostname === 'hoodfy.com' || window.location.hostname === 'www.hoodfy.com'
          ? 'https://api.hoodfy.com'
          : 'https://api.hoodfy.com';

        const response = await fetch(`${apiUrl}/api/auth/verify-admin`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, token]);

  return { isAdmin, isLoading };
};
