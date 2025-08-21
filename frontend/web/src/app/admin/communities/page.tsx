'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Community {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'pending';
  membersCount: number;
  postsCount: number;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  category: string;
  isPrivate: boolean;
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Implementar llamada a API para obtener comunidades
    // Por ahora usamos datos mock
    setTimeout(() => {
      const mockCommunities: Community[] = [
        {
          id: '1',
          name: 'Tecnología Avanzada',
          description: 'Comunidad para discutir las últimas tendencias en tecnología',
          status: 'active',
          membersCount: 1250,
          postsCount: 89,
          createdAt: '2024-01-15',
          owner: {
            id: '1',
            username: 'techadmin',
            email: 'tech@example.com'
          },
          category: 'Tecnología',
          isPrivate: false
        },
        {
          id: '2',
          name: 'Arte Digital',
          description: 'Compartiendo creaciones artísticas digitales',
          status: 'active',
          membersCount: 567,
          postsCount: 234,
          createdAt: '2024-02-20',
          owner: {
            id: '2',
            username: 'artlover',
            email: 'art@example.com'
          },
          category: 'Arte',
          isPrivate: false
        },
        {
          id: '3',
          name: 'Fitness & Wellness',
          description: 'Comunidad dedicada a la salud y el bienestar',
          status: 'suspended',
          membersCount: 890,
          postsCount: 156,
          createdAt: '2024-03-10',
          owner: {
            id: '3',
            username: 'fitnessguru',
            email: 'fitness@example.com'
          },
          category: 'Salud',
          isPrivate: true
        },
        {
          id: '4',
          name: 'Cocina Internacional',
          description: 'Recetas y técnicas de cocina de todo el mundo',
          status: 'pending',
          membersCount: 0,
          postsCount: 0,
          createdAt: '2024-08-20',
          owner: {
            id: '4',
            username: 'chefmaster',
            email: 'chef@example.com'
          },
          category: 'Cocina',
          isPrivate: false
        }
      ];
      setCommunities(mockCommunities);
      setFilteredCommunities(mockCommunities);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = communities;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.owner.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(community => community.status === statusFilter);
    }

    // Filtrar por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(community => community.category === categoryFilter);
    }

    setFilteredCommunities(filtered);
  }, [communities, searchTerm, statusFilter, categoryFilter]);

  const handleCommunityAction = async (communityId: string, action: string) => {
    // TODO: Implementar acciones de moderación
    console.log(`Acción ${action} para comunidad ${communityId}`);
    
    // Actualizar estado local
    setCommunities(prevCommunities =>
      prevCommunities.map(community =>
        community.id === communityId
          ? { ...community, status: action === 'suspend' ? 'suspended' : 'active' }
          : community
      )
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCommunities.length === 0) return;
    
    // TODO: Implementar acciones masivas
    console.log(`Acción masiva ${action} para comunidades:`, selectedCommunities);
    
    setSelectedCommunities([]);
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
      active: { color: 'bg-green-100 text-green-800', text: 'Activa' },
      suspended: { color: 'bg-red-100 text-red-800', text: 'Suspendida' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    
    const colorIndex = category.length % colors.length;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[colorIndex]}`}>
        {category}
      </span>
    );
  };

  if (isLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestión de Comunidades
        </h1>
        <p className="text-gray-600">
          Administra y modera las comunidades de la plataforma
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, descripción o propietario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Arte">Arte</option>
              <option value="Salud">Salud</option>
              <option value="Cocina">Cocina</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedCommunities.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {selectedCommunities.length} comunidad(es) seleccionada(s)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Suspender Seleccionadas
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Activar Seleccionadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de comunidades */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comunidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommunities.map((community) => (
                <tr key={community.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCommunities.includes(community.id)}
                      onChange={() => toggleCommunitySelection(community.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {community.name}
                          {community.isPrivate && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Privada
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {community.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {community.owner.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {community.owner.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(community.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(community.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">
                      {community.membersCount.toLocaleString()} miembros
                    </div>
                    <div className="text-sm text-gray-500">
                      {community.postsCount.toLocaleString()} posts
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(community.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {community.status === 'active' ? (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'suspend')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCommunityAction(community.id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        onClick={() => handleCommunityAction(community.id, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCommunityAction(community.id, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron comunidades</h3>
            <p className="mt-1 text-sm text-gray-500">
              Intenta ajustar los filtros de búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredCommunities.length}</span> de{' '}
            <span className="font-medium">{communities.length}</span> comunidades
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
