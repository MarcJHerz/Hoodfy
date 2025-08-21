'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'banned' | 'suspended';
  createdAt: string;
  lastLogin: string;
  communitiesCount: number;
  postsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Implementar llamada a API para obtener usuarios
    // Por ahora usamos datos mock
    setTimeout(() => {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@hoodfy.com',
          username: 'admin',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
          lastLogin: '2024-08-21',
          communitiesCount: 5,
          postsCount: 25
        },
        {
          id: '2',
          email: 'moderator@hoodfy.com',
          username: 'moderator',
          role: 'moderator',
          status: 'active',
          createdAt: '2024-02-20',
          lastLogin: '2024-08-20',
          communitiesCount: 3,
          postsCount: 15
        },
        {
          id: '3',
          email: 'user1@example.com',
          username: 'user1',
          role: 'user',
          status: 'active',
          createdAt: '2024-03-10',
          lastLogin: '2024-08-19',
          communitiesCount: 2,
          postsCount: 8
        },
        {
          id: '4',
          email: 'user2@example.com',
          username: 'user2',
          role: 'user',
          status: 'banned',
          createdAt: '2024-04-05',
          lastLogin: '2024-08-15',
          communitiesCount: 0,
          postsCount: 0
        }
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filtrar por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const handleUserAction = async (userId: string, action: string) => {
    // TODO: Implementar acciones de administración
    console.log(`Acción ${action} para usuario ${userId}`);
    
    // Actualizar estado local
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, status: action === 'ban' ? 'banned' : 'active' }
          : user
      )
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    
    // TODO: Implementar acciones masivas
    console.log(`Acción masiva ${action} para usuarios:`, selectedUsers);
    
    setSelectedUsers([]);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Activo' },
      banned: { color: 'bg-red-100 text-red-800', text: 'Baneado' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', text: 'Suspendido' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', text: 'Admin' },
      moderator: { color: 'bg-blue-100 text-blue-800', text: 'Moderador' },
      user: { color: 'bg-gray-100 text-gray-800', text: 'Usuario' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
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
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra usuarios, roles y estados de la plataforma
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
              placeholder="Email o username..."
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
              <option value="active">Activo</option>
              <option value="banned">Baneado</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderador</option>
              <option value="user">Usuario</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {selectedUsers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {selectedUsers.length} usuario(s) seleccionado(s)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('ban')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Banear Seleccionados
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Activar Seleccionados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">
                      {user.communitiesCount} comunidades
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.postsCount} posts
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'ban')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Banear
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'edit')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron usuarios</h3>
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
            Mostrando <span className="font-medium">{filteredUsers.length}</span> de{' '}
            <span className="font-medium">{users.length}</span> usuarios
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
