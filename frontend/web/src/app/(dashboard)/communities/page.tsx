'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  PlusIcon, 
  UserGroupIcon, 
  StarIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { communities, users } from '@/services/api';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  members?: any[];
  creator?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Componente CommunityCard que usa useImageUrl
const CommunityCard = ({ community, type }: { community: Community; type: 'created' | 'subscribed' | 'available' }) => {
  const { url: coverImageUrl } = useImageUrl(community.coverImage);
  
  return (
    <Link
                      href={`/dashboard/communities/${community._id}`}
      className="group block"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover-lift border border-gray-200 dark:border-gray-700">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={coverImageUrl || '/images/defaults/default-community.png'}
            alt={community.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 right-4">
            {type === 'created' && (
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Creador
              </span>
            )}
            {type === 'subscribed' && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center">
                <StarIcon className="w-3 h-3 mr-1" />
                Suscrito
              </span>
            )}
            {type === 'available' && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Disponible
              </span>
            )}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
              {community.name}
            </h3>
            {type === 'available' && community.creator && (
              <p className="text-white/80 text-sm">
                por {community.creator.name}
              </p>
            )}
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {community.description || 'Sin descripción'}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {community.members?.length || 0} miembros
              </div>
              {community.createdAt && type === 'created' && (
                <div className="flex items-center">
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(community.createdAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>
              )}
            </div>
            {type === 'subscribed' && (
              <div className="text-primary-600 dark:text-primary-400 text-sm font-medium">
                Acceso completo
              </div>
            )}
            {type === 'available' && (
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Ver detalles
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'members' | 'name'>('newest');
  
  const { user } = useAuthStore();
  const { 
    userCommunities, 
    subscribedCommunities, 
    allCommunities,
    isLoadingCommunities, 
    isLoadingSubscriptions,
    loadUserCommunities, 
    loadSubscribedCommunities,
    loadAllCommunities,
    searchCommunities,
    clearCommunities 
  } = useCommunitiesStore();

  useEffect(() => {
    if (user?._id) {
    loadCommunities();
    } else {
      clearCommunities();
    }
    
    return () => {
      clearCommunities();
    };
  }, [user?._id]);

  const loadCommunities = async () => {
    if (!user?._id) return;
    
    try {
      // Cargar comunidades creadas, suscritas y todas en paralelo
      await Promise.all([
        loadUserCommunities(user._id),
        loadSubscribedCommunities(),
        loadAllCommunities()
      ]);
    } catch (error) {
      console.error('Error al cargar comunidades:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchCommunities(query);
    } else {
      await loadAllCommunities();
    }
  };

  const sortCommunities = (communities: Community[]) => {
    return [...communities].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'members':
          return (b.members?.length || 0) - (a.members?.length || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const filterCommunities = (communities: Community[]) => {
    if (!searchQuery.trim()) return communities;
    return communities.filter(community =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getStats = () => {
    return {
      totalCommunities: userCommunities.length + subscribedCommunities.length,
      totalMembers: userCommunities.reduce((acc, c) => acc + (c.members?.length || 0), 0) +
                    subscribedCommunities.reduce((acc, c) => acc + (c.members?.length || 0), 0),
      createdCommunities: userCommunities.length,
      subscriptions: subscribedCommunities.length
    };
  };

  const stats = getStats();

  if (isLoadingCommunities || isLoadingSubscriptions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Cargando comunidades
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Preparando tu experiencia comunitaria...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-700 dark:to-accent-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 dark:bg-black/20 rounded-full p-4 backdrop-blur-sm">
                <UserGroupIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tus Comunidades
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Conecta, aprende y crece junto a personas que comparten tus intereses
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <SparklesIcon className="w-6 h-6 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.totalCommunities}</span>
                </div>
                <p className="text-white/80 text-sm">Comunidades totales</p>
              </div>
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <TrophyIcon className="w-6 h-6 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.createdCommunities}</span>
                </div>
                <p className="text-white/80 text-sm">Creadas por ti</p>
              </div>
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <StarIcon className="w-6 h-6 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.subscriptions}</span>
                </div>
                <p className="text-white/80 text-sm">Suscripciones</p>
              </div>
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-center mb-2">
                  <FireIcon className="w-6 h-6 text-white mr-2" />
                  <span className="text-2xl font-bold text-white">{stats.totalMembers}</span>
                </div>
                <p className="text-white/80 text-sm">Miembros totales</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Buscar comunidades por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
        <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all duration-200 hover-lift ${
                showFilters
                  ? 'bg-primary-100 dark:bg-primary-900/20 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-400'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
        </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'members' | 'name')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Más recientes</option>
                  <option value="members">Más miembros</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>
            </div>
          )}
      </div>
      
      <Tab.Group onChange={setActiveTab}>
          <Tab.List className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 rounded-2xl bg-white dark:bg-gray-800 p-2 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <Tab
              className={({ selected }) =>
                `w-full rounded-xl py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold leading-5 flex items-center justify-center transition-all duration-200 ${
                  selected
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="truncate">Mis Comunidades</span>
              {userCommunities.length > 0 && (
                <span className={`ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 0 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                }`}>
                  {userCommunities.length}
                </span>
              )}
            </Tab>
          <Tab
            className={({ selected }) =>
                `w-full rounded-xl py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold leading-5 flex items-center justify-center transition-all duration-200 ${
                selected
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="truncate">Suscripciones</span>
              {subscribedCommunities.length > 0 && (
                <span className={`ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 1 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                }`}>
                  {subscribedCommunities.length}
                </span>
              )}
          </Tab>
          <Tab
            className={({ selected }) =>
                `w-full rounded-xl py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold leading-5 flex items-center justify-center transition-all duration-200 ${
                selected
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
            >
              <GlobeAltIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="truncate">Explorar</span>
              {allCommunities.length > 0 && (
                <span className={`ml-1 sm:ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 2 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                }`}>
                  {allCommunities.length}
                </span>
              )}
          </Tab>
        </Tab.List>

          <Tab.Panels>
            {/* Mis Comunidades */}
          <Tab.Panel>
            {userCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sortCommunities(filterCommunities(userCommunities)).map((community) => (
                    <CommunityCard key={community._id} community={community} type="created" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <UserGroupIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    ¡Crea tu primera comunidad!
                </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Comienza tu viaje como creador de contenido y construye una comunidad increíble
                </p>
                  <Link
                    href="/communities/create"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crear comunidad
                  </Link>
              </div>
            )}
          </Tab.Panel>

            {/* Suscripciones */}
          <Tab.Panel>
              {subscribedCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sortCommunities(filterCommunities(subscribedCommunities)).map((community) => (
                    <CommunityCard key={community._id} community={community} type="subscribed" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <StarIcon className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    Descubre comunidades increíbles
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Únete a comunidades que te inspiren y te ayuden a crecer personal y profesionalmente
                  </p>
                  <button
                    onClick={() => setActiveTab(2)}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                  >
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    Explorar comunidades
                  </button>
                </div>
              )}
            </Tab.Panel>

            {/* Explorar */}
            <Tab.Panel>
              {allCommunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {sortCommunities(filterCommunities(allCommunities))
                    .filter(community => 
                      !userCommunities.some(uc => uc._id === community._id) &&
                      !subscribedCommunities.some(sc => sc._id === community._id)
                    )
                    .map((community) => (
                      <CommunityCard key={community._id} community={community} type="available" />
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <GlobeAltIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    No hay comunidades para explorar
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    ¡Sé el primero en crear una comunidad y construir algo increíble!
                  </p>
                </div>
              )}
            </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      </div>

      {/* Botón flotante para crear comunidad */}
      <Link
        href="/communities/create"
        className="fixed bottom-8 right-8 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover-lift group z-50"
        title="Crear nueva comunidad"
      >
        <PlusIcon className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
      </Link>
    </div>
  );
} 