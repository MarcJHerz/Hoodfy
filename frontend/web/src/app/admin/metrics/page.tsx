'use client';

import React, { useState } from 'react';
import { useMetrics } from '@/hooks/useMetrics';

export default function MetricsPage() {
  const { 
    dashboardMetrics, 
    growthMetrics, 
    communityAnalytics, 
    isLoading, 
    error,
    fetchGrowthMetrics 
  } = useMetrics();

  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const handlePeriodChange = (period: number) => {
    setSelectedPeriod(period);
    fetchGrowthMetrics(period);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">❌ Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!dashboardMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600">No hay datos disponibles</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Métricas Detalladas
        </h1>
        <p className="text-gray-600">
          Análisis completo del sistema con métricas en tiempo real.
        </p>
      </div>

      {/* Filtros de período */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Período de Análisis</h2>
        <div className="flex space-x-2">
          {[7, 30, 90, 365].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 7 ? '7 días' : period === 30 ? '30 días' : period === 90 ? '3 meses' : '1 año'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas de Usuarios */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Métricas de Usuarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {dashboardMetrics.users.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Usuarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardMetrics.users.active.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Usuarios Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardMetrics.users.newThisMonth.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Nuevos este Mes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardMetrics.users.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Tasa de Crecimiento</div>
          </div>
        </div>
      </div>

      {/* Métricas de Comunidades */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🏘️ Métricas de Comunidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {dashboardMetrics.communities.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Comunidades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {dashboardMetrics.communities.active.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Comunidades Activas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardMetrics.communities.newThisMonth.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Nuevas este Mes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardMetrics.communities.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Tasa de Crecimiento</div>
          </div>
        </div>
      </div>

      {/* Métricas de Posts */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">📝 Métricas de Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {dashboardMetrics.posts.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardMetrics.posts.newThisMonth.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Nuevos este Mes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardMetrics.posts.growthRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Tasa de Crecimiento</div>
          </div>
        </div>
      </div>

      {/* Métricas Financieras */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">💰 Métricas Financieras</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${dashboardMetrics.revenue.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Ingresos Totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${dashboardMetrics.revenue.monthly.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Ingresos Mensuales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {dashboardMetrics.subscriptions.total.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Suscripciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardMetrics.subscriptions.active.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Suscripciones Activas</div>
          </div>
        </div>
      </div>

      {/* Top Comunidades por Miembros */}
      {communityAnalytics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🏆 Top Comunidades por Miembros</h2>
          <div className="space-y-3">
            {communityAnalytics.topByMembers.slice(0, 5).map((community, index) => (
              <div key={community._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-900">{community.name}</div>
                    <div className="text-sm text-gray-500">{community.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600">
                    {community.memberCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">miembros</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Comunidades por Posts */}
      {communityAnalytics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Top Comunidades por Actividad</h2>
          <div className="space-y-3">
            {communityAnalytics.topByPosts.slice(0, 5).map((community, index) => (
              <div key={community._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="font-medium text-gray-900">{community.name}</div>
                    <div className="text-sm text-gray-500">{community.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {community.postCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">posts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
