'use client';

import React, { useState, useEffect } from 'react';

interface MetricsData {
  users: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    activeToday: number;
    growthRate: number;
  };
  communities: {
    total: number;
    newThisMonth: number;
    active: number;
    suspended: number;
    pending: number;
  };
  posts: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    engagementRate: number;
  };
  revenue: {
    monthly: number;
    weekly: number;
    subscriptions: number;
    growthRate: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
  };
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementar llamada a API para obtener métricas
    // Por ahora usamos datos mock
    setTimeout(() => {
      setMetrics({
        users: {
          total: 1247,
          newThisMonth: 156,
          newThisWeek: 23,
          activeToday: 89,
          growthRate: 12.5
        },
        communities: {
          total: 89,
          newThisMonth: 12,
          active: 78,
          suspended: 8,
          pending: 3
        },
        posts: {
          total: 5678,
          newThisMonth: 456,
          newThisWeek: 67,
          engagementRate: 8.7
        },
        revenue: {
          monthly: 12450.00,
          weekly: 3125.00,
          subscriptions: 234,
          growthRate: 15.3
        },
        engagement: {
          dailyActiveUsers: 89,
          weeklyActiveUsers: 456,
          monthlyActiveUsers: 1247,
          averageSessionTime: 24.5
        }
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Métricas del Sistema
            </h1>
            <p className="text-gray-600">
              Análisis detallado del rendimiento y crecimiento de la plataforma
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '7d'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '30d'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              30 días
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                timeRange === '90d'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              90 días
            </button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usuarios */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Usuarios
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.users.total.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                +{metrics.users.growthRate}%
              </span>
              <span className="text-gray-500 ml-1">este mes</span>
            </div>
          </div>
        </div>

        {/* Comunidades */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Comunidades
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.communities.total.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">
                {metrics.communities.active}
              </span>
              <span className="text-gray-500 ml-1">activas</span>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Posts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.posts.total.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-purple-600 font-medium">
                {metrics.posts.engagementRate}%
              </span>
              <span className="text-gray-500 ml-1">engagement</span>
            </div>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ingresos Mensuales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${metrics.revenue.monthly.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                +{metrics.revenue.growthRate}%
              </span>
              <span className="text-gray-500 ml-1">este mes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de usuarios */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Crecimiento de Usuarios
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nuevos este mes</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.users.newThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Nuevos esta semana</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.users.newThisWeek}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Activos hoy</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.users.activeToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tasa de crecimiento</span>
              <span className="text-sm font-medium text-green-600">
                +{metrics.users.growthRate}%
              </span>
            </div>
          </div>
          
          {/* Gráfico simple de barras */}
          <div className="mt-6">
            <div className="flex items-end space-x-2 h-32">
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '60%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '80%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '40%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '100%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '70%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '90%' }}></div>
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: '50%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </div>
        </div>

        {/* Actividad de comunidades */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Comunidades
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-medium text-gray-900">
                {metrics.communities.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Activas</span>
              <span className="text-sm font-medium text-green-600">
                {metrics.communities.active}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Suspendidas</span>
              <span className="text-sm font-medium text-red-600">
                {metrics.communities.suspended}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pendientes</span>
              <span className="text-sm font-medium text-yellow-600">
                {metrics.communities.pending}
              </span>
            </div>
          </div>
          
          {/* Gráfico de dona */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray={`${(metrics.communities.active / metrics.communities.total) * 88} 88`}
                  strokeDashoffset="0"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((metrics.communities.active / metrics.communities.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de engagement */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Métricas de Engagement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {metrics.engagement.dailyActiveUsers}
            </div>
            <div className="text-sm text-gray-500">Usuarios Activos Diarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.engagement.weeklyActiveUsers}
            </div>
            <div className="text-sm text-gray-500">Usuarios Activos Semanales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.engagement.monthlyActiveUsers}
            </div>
            <div className="text-sm text-gray-500">Usuarios Activos Mensuales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.engagement.averageSessionTime}min
            </div>
            <div className="text-sm text-gray-500">Tiempo Promedio de Sesión</div>
          </div>
        </div>
      </div>

      {/* Análisis de contenido */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Análisis de Contenido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.posts.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total de Posts</div>
            <div className="text-xs text-green-600 mt-1">
              +{metrics.posts.newThisMonth} este mes
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.posts.engagementRate}%
            </div>
            <div className="text-sm text-gray-600">Tasa de Engagement</div>
            <div className="text-xs text-blue-600 mt-1">
              Promedio de interacciones
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.revenue.subscriptions}
            </div>
            <div className="text-sm text-gray-600">Suscripciones Activas</div>
            <div className="text-xs text-green-600 mt-1">
              +{metrics.revenue.growthRate}% crecimiento
            </div>
          </div>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow rounded-lg p-6 text-white">
        <h3 className="text-lg font-medium mb-4">
          Resumen Ejecutivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90">
              La plataforma muestra un crecimiento saludable con un aumento del {metrics.users.growthRate}% 
              en usuarios este mes. El engagement se mantiene estable con una tasa del {metrics.posts.engagementRate}%.
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">
              Los ingresos mensuales han crecido un {metrics.revenue.growthRate}%, alcanzando 
              ${metrics.revenue.monthly.toLocaleString()}. Las comunidades activas representan 
              el {Math.round((metrics.communities.active / metrics.communities.total) * 100)}% del total.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
