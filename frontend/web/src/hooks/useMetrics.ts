import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface DashboardMetrics {
  users: {
    total: number;
    newThisMonth: number;
    active: number;
    admin: number;
    growthRate: number;
  };
  communities: {
    total: number;
    newThisMonth: number;
    active: number;
    growthRate: number;
  };
  posts: {
    total: number;
    newThisMonth: number;
    growthRate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  overview: {
    totalUsers: number;
    totalCommunities: number;
    totalPosts: number;
    totalRevenue: number;
  };
}

interface GrowthMetrics {
  period: string;
  userGrowth: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  communityGrowth: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  postGrowth: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
}

interface CommunityAnalytics {
  topByMembers: Array<{
    _id: string;
    name: string;
    description: string;
    memberCount: number;
    createdAt: string;
    isActive: boolean;
  }>;
  topByPosts: Array<{
    _id: string;
    name: string;
    description: string;
    postCount: number;
    createdAt: string;
    isActive: boolean;
  }>;
  stats: {
    totalCommunities: number;
    activeCommunities: number;
    avgMembersPerCommunity: number;
  };
}

export const useMetrics = () => {
  const { token } = useAuthStore();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [communityAnalytics, setCommunityAnalytics] = useState<CommunityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener la URL de la API correcta
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

  // Obtener métricas del dashboard
  const fetchDashboardMetrics = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/metrics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardMetrics(data);
      } else {
        throw new Error('Error obteniendo métricas del dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      setError('Error obteniendo métricas del dashboard');
    }
  };

  // Obtener métricas de crecimiento
  const fetchGrowthMetrics = async (period: number = 30) => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/metrics/growth?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGrowthMetrics(data);
      } else {
        throw new Error('Error obteniendo métricas de crecimiento');
      }
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
      setError('Error obteniendo métricas de crecimiento');
    }
  };

  // Obtener análisis de comunidades
  const fetchCommunityAnalytics = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/metrics/communities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCommunityAnalytics(data);
      } else {
        throw new Error('Error obteniendo análisis de comunidades');
      }
    } catch (error) {
      console.error('Error fetching community analytics:', error);
      setError('Error obteniendo análisis de comunidades');
    }
  };

  // Cargar todas las métricas
  const loadAllMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchDashboardMetrics(),
        fetchGrowthMetrics(),
        fetchCommunityAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar métricas cuando cambie el token
  useEffect(() => {
    if (token) {
      loadAllMetrics();
    }
  }, [token]);

  return {
    dashboardMetrics,
    growthMetrics,
    communityAnalytics,
    isLoading,
    error,
    fetchDashboardMetrics,
    fetchGrowthMetrics,
    fetchCommunityAnalytics,
    loadAllMetrics
  };
};
