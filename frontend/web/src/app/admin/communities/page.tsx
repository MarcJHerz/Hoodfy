'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCommunities, AdminCommunity } from '@/hooks/useCommunities';
import { toast } from 'react-hot-toast';
import { 
  EyeIcon, 
  PencilIcon, 
  ArchiveBoxIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function AdminCommunitiesPage() {
  const { 
    communities, 
    communityStats, 
    isLoading, 
    error, 
    suspendCommunity, 
    archiveCommunity, 
    deleteCommunity, 
    restoreCommunity 
  } = useCommunities();
  
  const [filteredCommunities, setFilteredCommunities] = useState<AdminCommunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let filtered = communities;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.creator.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(community => community.status === statusFilter);
    }

    setFilteredCommunities(filtered);
  }, [communities, searchTerm, statusFilter]);

  const handleCommunityAction = async (communityId: string, action: string) => {
    setIsActionLoading(communityId);
    
    try {
      let success = false;
      
      switch (action) {
        case 'suspend':
          success = await suspendCommunity(communityId);
          if (success) toast.success('Comunidad suspendida exitosamente');
          break;
        case 'archive':
          success = await archiveCommunity(communityId);
          if (success) toast.success('Comunidad archivada exitosamente');
          break;
        case 'delete':
          if (window.confirm('¿Estás seguro de que quieres eliminar esta comunidad? Esta acción no se puede deshacer.')) {
            success = await deleteCommunity(communityId);
            if (success) toast.success('Comunidad eliminada exitosamente');
          }
          break;
        case 'restore':
          success = await restoreCommunity(communityId);
          if (success) toast.success('Comunidad restaurada exitosamente');
          break;
        default:
          toast.error('Acción no válida');
      }
      
      if (!success) {
        toast.error('Error ejecutando la acción');
      }
    } catch (error) {
      console.error('Error en acción:', error);
      toast.error('Error ejecutando la acción');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCommunities.length === 0) return;
    
    const confirmMessage = `¿Estás seguro de que quieres ${action} ${selectedCommunities.length} comunidad(es)?`;
    if (!window.confirm(confirmMessage)) return;
    
    setIsActionLoading('bulk');
    
    try {
      const promises = selectedCommunities.map(id => {
        switch (action) {
          case 'suspend':
            return suspendCommunity(id);
          case 'archive':
            return archiveCommunity(id);
          case 'delete':
            return deleteCommunity(id);
          default:
            return Promise.resolve(false);
        }
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} comunidad(es) procesada(s) exitosamente`);
      }
      
      setSelectedCommunities([]);
    } catch (error) {
      console.error('Error en acción masiva:', error);
      toast.error('Error ejecutando acción masiva');
    } finally {
      setIsActionLoading(null);
    }
  };

  const toggleCommunitySelection = (communityId: string) => {
    setSelectedCommunities(prev =>
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', 
        text: 'Activa',
        icon: CheckCircleIcon
      },
      suspended: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', 
        text: 'Suspendida',
        icon: ExclamationTriangleIcon
      },
      archived: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', 
        text: 'Archivada',
        icon: ArchiveBoxIcon
      },
      deleted: { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', 
        text: 'Eliminada',
        icon: XCircleIcon
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getSubscriptionStatus = (community: AdminCommunity) => {
    if (!community.allowNewSubscriptions && !community.allowRenewals) {
      return { text: 'Completamente pausada', color: 'text-red-600 dark:text-red-400' };
    } else if (!community.allowNewSubscriptions && community.allowRenewals) {
      return { text: 'Solo renovaciones', color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { text: 'Activa', color: 'text-green-600 dark:text-green-400' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando comunidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Error</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestión de Comunidades
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Administra y modera las comunidades de la plataforma
            </p>
          </div>
          
          {communityStats && (
            <div className="mt-4 sm:mt-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {communityStats.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {communityStats.byStatus.active}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {communityStats.byStatus.archived}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Archivadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {communityStats.subscriptions.active}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Suscripciones</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, descripción o creador..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="archived">Archivada</option>
              <option value="deleted">Eliminada</option>
            </select>
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Acciones
            </label>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedCommunities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {selectedCommunities.length} comunidad(es) seleccionada(s)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('suspend')}
                disabled={isActionLoading === 'bulk'}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading === 'bulk' ? 'Procesando...' : 'Suspender'}
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                disabled={isActionLoading === 'bulk'}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading === 'bulk' ? 'Procesando...' : 'Archivar'}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isActionLoading === 'bulk'}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isActionLoading === 'bulk' ? 'Procesando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de comunidades - Responsive */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Header de la tabla - Solo visible en desktop */}
        <div className="hidden lg:block">
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
            <div className="flex items-center">
              <div className="w-8">
                <input
                  type="checkbox"
                  checked={selectedCommunities.length === filteredCommunities.length && filteredCommunities.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCommunities(filteredCommunities.map(community => community.id));
                    } else {
                      setSelectedCommunities([]);
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex-1 grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div>Comunidad</div>
                <div>Creador</div>
                <div>Estado</div>
                <div>Estadísticas</div>
                <div>Fecha</div>
                <div>Acciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de comunidades */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              {/* Vista móvil */}
              <div className="lg:hidden">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCommunities.includes(community.id)}
                    onChange={() => toggleCommunitySelection(community.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                        {community.name}
                      </h3>
                      {getStatusBadge(community.status)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {community.description}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      {community.membersCount.toLocaleString()} miembros
                      <DocumentTextIcon className="w-4 h-4 ml-4 mr-1" />
                      {community.postsCount.toLocaleString()} posts
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Creador: {community.creator.username}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      {new Date(community.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {community.status === 'active' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'suspend')}
                          disabled={isActionLoading === community.id}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Suspender'}
                        </button>
                      )}
                      {community.status === 'active' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'archive')}
                          disabled={isActionLoading === community.id}
                          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 disabled:opacity-50"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Archivar'}
                        </button>
                      )}
                      {community.status === 'deleted' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'restore')}
                          disabled={isActionLoading === community.id}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Restaurar'}
                        </button>
                      )}
                      {community.status !== 'deleted' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'delete')}
                          disabled={isActionLoading === community.id}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista desktop */}
              <div className="hidden lg:block">
                <div className="flex items-center">
                  <div className="w-8">
                    <input
                      type="checkbox"
                      checked={selectedCommunities.includes(community.id)}
                      onChange={() => toggleCommunitySelection(community.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {community.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {community.description}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {community.creator.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {community.creator.email}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(community.status)}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {getSubscriptionStatus(community).text}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <UsersIcon className="w-4 h-4 inline mr-1" />
                        {community.membersCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                        {community.postsCount.toLocaleString()}
                      </div>
                      {community.totalRevenue > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                          ${community.totalRevenue.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(community.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      {community.status === 'active' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'suspend')}
                          disabled={isActionLoading === community.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 text-sm"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Suspender'}
                        </button>
                      )}
                      {community.status === 'active' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'archive')}
                          disabled={isActionLoading === community.id}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 text-sm"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Archivar'}
                        </button>
                      )}
                      {community.status === 'deleted' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'restore')}
                          disabled={isActionLoading === community.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 text-sm"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Restaurar'}
                        </button>
                      )}
                      {community.status !== 'deleted' && (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'delete')}
                          disabled={isActionLoading === community.id}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-sm"
                        >
                          {isActionLoading === community.id ? 'Procesando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No se encontraron comunidades</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros de búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{filteredCommunities.length}</span> de{' '}
            <span className="font-medium">{communities.length}</span> comunidades
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Anterior
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
