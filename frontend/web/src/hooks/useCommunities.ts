import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'hoodfy.com' || window.location.hostname === 'www.hoodfy.com'
      ? 'https://api.hoodfy.com'
      : 'https://api.hoodfy.com';
  }
  return 'https://api.hoodfy.com';
};

export interface AdminCommunity {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'archived' | 'deleted';
  allowNewSubscriptions: boolean;
  allowRenewals: boolean;
  price: number;
  isFree: boolean;
  creator: {
    _id: string;
    name: string;
    username: string;
    email: string;
  };
  membersCount: number;
  activeSubscriptions: number;
  postsCount: number;
  totalRevenue: number;
  createdAt: string;
  archivedAt?: string;
  deletedAt?: string;
  error?: string;
}

export interface CommunityStats {
  total: number;
  byStatus: {
    active: number;
    suspended: number;
    archived: number;
    deleted: number;
  };
  byPeriod: {
    last7Days: number;
    last30Days: number;
  };
  revenue: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
}

interface UseCommunitiesReturn {
  communities: AdminCommunity[];
  communityStats: CommunityStats | null;
  isLoading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  fetchCommunityStats: () => Promise<void>;
  suspendCommunity: (communityId: string) => Promise<boolean>;
  archiveCommunity: (communityId: string) => Promise<boolean>;
  deleteCommunity: (communityId: string) => Promise<boolean>;
  restoreCommunity: (communityId: string) => Promise<boolean>;
}

export const useCommunities = (): UseCommunitiesReturn => {
  const { token } = useAuthStore();
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities`, {
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
        setCommunities(data.communities);
        console.log(`✅ Comunidades obtenidas: ${data.communities.length}`);
      } else {
        throw new Error(data.message || 'Error obteniendo comunidades');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error obteniendo comunidades:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities/stats`, {
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
        setCommunityStats(data.stats);
        console.log('✅ Estadísticas de comunidades obtenidas');
      } else {
        throw new Error(data.message || 'Error obteniendo estadísticas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error obteniendo estadísticas:', errorMessage);
    }
  };

  const suspendCommunity = async (communityId: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities/${communityId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar la comunidad en el estado local
        setCommunities(prevCommunities =>
          prevCommunities.map(community =>
            community.id === communityId
              ? { ...community, status: 'suspended', allowNewSubscriptions: false, allowRenewals: false }
              : community
          )
        );
        console.log('✅ Comunidad suspendida exitosamente');
        return true;
      } else {
        throw new Error(data.message || 'Error suspendiendo comunidad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error suspendiendo comunidad:', errorMessage);
      return false;
    }
  };

  const archiveCommunity = async (communityId: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities/${communityId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar la comunidad en el estado local
        setCommunities(prevCommunities =>
          prevCommunities.map(community =>
            community.id === communityId
              ? { 
                  ...community, 
                  status: 'archived', 
                  allowNewSubscriptions: false, 
                  allowRenewals: true,
                  archivedAt: data.community.archivedAt
                }
              : community
          )
        );
        console.log('✅ Comunidad archivada exitosamente');
        return true;
      } else {
        throw new Error(data.message || 'Error archivando comunidad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error archivando comunidad:', errorMessage);
      return false;
    }
  };

  const deleteCommunity = async (communityId: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities/${communityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar la comunidad en el estado local
        setCommunities(prevCommunities =>
          prevCommunities.map(community =>
            community.id === communityId
              ? { 
                  ...community, 
                  status: 'deleted', 
                  allowNewSubscriptions: false, 
                  allowRenewals: false,
                  deletedAt: data.community.deletedAt
                }
              : community
          )
        );
        console.log('✅ Comunidad eliminada exitosamente');
        return true;
      } else {
        throw new Error(data.message || 'Error eliminando comunidad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error eliminando comunidad:', errorMessage);
      return false;
    }
  };

  const restoreCommunity = async (communityId: string): Promise<boolean> => {
    try {
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/communities/${communityId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar la comunidad en el estado local
        setCommunities(prevCommunities =>
          prevCommunities.map(community =>
            community.id === communityId
              ? { 
                  ...community, 
                  status: 'active', 
                  allowNewSubscriptions: true, 
                  allowRenewals: true,
                  deletedAt: undefined
                }
              : community
          )
        );
        console.log('✅ Comunidad restaurada exitosamente');
        return true;
      } else {
        throw new Error(data.message || 'Error restaurando comunidad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('❌ Error restaurando comunidad:', errorMessage);
      return false;
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchCommunityStats();
  }, []);

  return {
    communities,
    communityStats,
    isLoading,
    error,
    fetchCommunities,
    fetchCommunityStats,
    suspendCommunity,
    archiveCommunity,
    deleteCommunity,
    restoreCommunity
  };
};
