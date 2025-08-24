import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

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

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'banned' | 'suspended';
  createdAt: string;
  lastLogin: string;
  lastActivity: string;
  communitiesCount: number;
  postsCount: number;
  activeSubscriptionsCount: number;
  isVerified: boolean;
  profileComplete: boolean;
  daysSinceRegistration: number;
  error?: string;
}

export interface UserStats {
  total: number;
  byStatus: {
    active: number;
    banned: number;
  };
  byRole: {
    admin: number;
    moderator: number;
    user: number;
  };
  byPeriod: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  verification: {
    verified: number;
    unverified: number;
  };
  profile: {
    complete: number;
    incomplete: number;
  };
}

interface UseUsersReturn {
  users: AdminUser[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUserRole: (userId: string, newRole: string) => Promise<boolean>;
  updateUserStatus: (userId: string, newStatus: string) => Promise<boolean>;
}

export const useUsers = (): UseUsersReturn => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos de administrador');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        console.log(`✅ Usuarios obtenidos: ${data.users.length}`);
      } else {
        throw new Error(data.message || 'Error obteniendo usuarios');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error obteniendo usuarios:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/users/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos de administrador');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.stats);
        console.log('✅ Estadísticas de usuarios obtenidas');
      } else {
        throw new Error(data.message || 'Error obteniendo estadísticas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error obteniendo estadísticas de usuarios:', errorMessage);
      // No establecer error global para estadísticas, solo log
    }
  };

  const updateUserRole = async (userId: string, newRole: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos de administrador');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el usuario en el estado local
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole as 'user' | 'admin' | 'moderator' }
              : user
          )
        );
        
        console.log(`✅ Rol de usuario actualizado a ${newRole}`);
        return true;
      } else {
        throw new Error(data.message || 'Error actualizando rol');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error actualizando rol de usuario:', errorMessage);
      return false;
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStatus }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos de administrador');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el usuario en el estado local
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, status: newStatus as 'active' | 'banned' | 'suspended' }
              : user
          )
        );
        
        console.log(`✅ Estado de usuario actualizado a ${newStatus}`);
        return true;
      } else {
        throw new Error(data.message || 'Error actualizando estado');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error actualizando estado de usuario:', errorMessage);
      return false;
    }
  };

  const refetch = async () => {
    await Promise.all([fetchUsers(), fetchUserStats()]);
  };

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token]);

  return {
    users,
    userStats,
    isLoading,
    error,
    refetch,
    updateUserRole,
    updateUserStatus,
  };
};
