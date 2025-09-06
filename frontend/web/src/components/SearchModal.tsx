"use client";
import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  UsersIcon, 
  XMarkIcon,
  UserIcon,
  SparklesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { 
  FireIcon 
} from '@heroicons/react/24/solid';
import { communities, users } from '@/services/api';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { User } from '@/types/user'; // Importar el tipo User global
import Image from 'next/image';
import { useImageUrl } from '@/utils/useImageUrl';

interface Community {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  coverImage?: string;
  members?: any[];
}

// Componente para manejar imágenes de usuario individualmente
const UserImage = ({ profilePicture, name, className }: { profilePicture?: string; name: string; className?: string }) => {
  const { url: userImageUrl } = useImageUrl(profilePicture);
  
  return (
    <Image
      src={userImageUrl}
      alt={name}
      width={48}
      height={48}
      className={className}
      unoptimized
    />
  );
};

// Componente para manejar imágenes de comunidad individualmente
const CommunityImage = ({ coverImage, image, name, className, width = 64, height = 48 }: { 
  coverImage?: string; 
  image?: string; 
  name: string; 
  className?: string;
  width?: number;
  height?: number;
}) => {
  const { url: communityImageUrl } = useImageUrl(coverImage || image);
  
  return (
    <Image
      src={communityImageUrl}
      alt={name}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
};

// Componente de tarjeta de usuario
const UserCard = ({ user, onClick }: { user: User; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover-lift"
  >
    <div className="relative">
      <UserImage
        profilePicture={user.profilePicture}
        name={user.name}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-900 group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all duration-200 flex-shrink-0"
      />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse opacity-80"></div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {user.name}
        </h4>
        {user.verified && (
          <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        )}
      </div>
      {user.username && (
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
      )}
      {user.bio && (
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{user.bio}</p>
      )}
    </div>
    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
  </div>
);

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [communities_results, setCommunities] = useState<Community[]>([]);
  const [users_results, setUsers] = useState<User[]>([]);
  const [recommendations, setRecommendations] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [recentSearches] = useState<string[]>([
    'Emprendedores', 'Pet Lovers', 'Tecnología', 'Jardines del Sur'
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const searchTabs = [
    { key: 'all', label: 'Todo', icon: SparklesIcon },
    { key: 'communities', label: 'Comunidades', icon: UsersIcon },
    { key: 'people', label: 'Personas', icon: UserIcon }
  ];

  // Focus al abrir y bloquear scroll del body
  useEffect(() => {
    if (open) {
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevenir shift layout
      
      if (inputRef.current) {
      inputRef.current.focus();
      }
      loadRecommendations();
      setNavigationLoading(false); // Reset navigation loading cuando se abre
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      setNavigationLoading(false); // Reset navigation loading cuando se cierra
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      setNavigationLoading(false);
    };
  }, [open]);

  // Búsqueda con debounce
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setCommunities([]);
      setUsers([]);
    }
  }, [debouncedQuery, activeTab]);

  const loadRecommendations = useCallback(async () => {
    try {
      const [communitiesRes, usersRes] = await Promise.all([
        communities.getAll({ limit: 6 }),
        users.getRecommended().catch(() => ({ data: [] }))
      ]);
      setRecommendations(communitiesRes.data || []);
      // También podríamos cargar usuarios recomendados aquí
        } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      // Debug: verificar token antes de hacer la búsqueda
      const token = localStorage.getItem('token');
      console.log('🔍 Realizando búsqueda con token:', token ? 'Token presente' : 'Sin token');
      
      const promises = [];
      
      // Buscar comunidades
      if (activeTab === 'all' || activeTab === 'communities') {
        promises.push(communities.search(searchQuery));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      
      // Buscar usuarios
      if (activeTab === 'all' || activeTab === 'people') {
        promises.push(users.search(searchQuery));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [communitiesRes, usersRes] = await Promise.all(promises);
      
      setCommunities(communitiesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error performing search:', error);
      setCommunities([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const handleCommunityClick = useCallback(async (community: Community) => {
    setNavigationLoading(true);
    try {
              await router.push(`/dashboard/communities/${community._id}`);
      onClose();
    } catch (error) {
      console.error('Error navigating to community:', error);
      setNavigationLoading(false);
    }
  }, [router, onClose]);

  const handleUserClick = useCallback(async (user: User) => {
    setNavigationLoading(true);
    try {
      await router.push(`/profile/${user._id}`);
    onClose();
    } catch (error) {
      console.error('Error navigating to user:', error);
      setNavigationLoading(false);
    }
  }, [router, onClose]);

  const handleQuickSearch = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
    setActiveTab('all');
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isSearching = debouncedQuery.trim().length > 0;
  const hasResults = communities_results.length > 0 || users_results.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-start justify-center pt-0 md:pt-16 bg-black/70 backdrop-blur-md animate-fade-in" 
      onClick={handleBackdropClick}
      style={{ touchAction: 'none' }}
    >
      {/* hola Marc aqui se ajusta el ancho del modal */}
      <div className="relative w-full max-w-full md:w-[40%] md:max-w-none mx-0 md:mx-4 h-full md:h-auto md:max-h-[85vh] bg-white dark:bg-gray-900 md:glass-strong md:rounded-3xl shadow-strong overflow-hidden animate-scale-in flex flex-col" style={{ maxWidth: '100vw' }}>
        {/* Header */}
        <div className="relative px-4 md:px-6 pt-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          {/* Botón cerrar con área de toque amplia */}
        <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover-lift touch-manipulation z-10"
          onClick={onClose}
            aria-label="Close search"
        >
            <XMarkIcon className="h-5 w-5" />
        </button>
          
          {/* Buscador principal */}
          <div className="relative pr-14 overflow-hidden">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            </div>
          <input
            ref={inputRef}
            type="text"
              className="w-full pl-12 pr-4 py-4 text-lg border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 min-w-0"
              placeholder="Search for people, communities or topics..."
            value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          {/* Tabs de búsqueda */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {searchTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap hover-lift ${
                  activeTab === tab.key
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {!isSearching && (
            <div className="p-4 md:p-6 space-y-6">
              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Recent searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
            <button
                        key={index}
                        onClick={() => handleQuickSearch(term)}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-all duration-200 hover-lift"
                      >
                        {term}
            </button>
          ))}
        </div>
                </div>
              )}

              {/* Recomendaciones */}
              {recommendations.length > 0 && (
            <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recommendations for you</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FireIcon className="h-4 w-4 text-orange-500" />
                      Popular communities
                    </h4>
                    <div className="grid gap-2">
                      {recommendations.slice(0, 8).map((community) => (
                        <div
                          key={community._id}
                          onClick={() => handleCommunityClick(community)}
                          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover-lift min-h-[80px] w-full max-w-full overflow-hidden"
                        >
                          <CommunityImage
                            coverImage={community.coverImage}
                            image={community.image}
                            name={community.name}
                            width={56}
                            height={40}
                            className="w-14 h-10 rounded-lg object-cover ring-2 ring-white dark:ring-gray-900 group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all duration-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm">
                              {community.name}
                            </h4>
                            {community.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-hidden text-ellipsis" 
                                 style={{ 
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical',
                                   lineHeight: '1.3',
                                   maxHeight: '2.6em',
                                   wordBreak: 'break-word'
                                 }}
                              >
                                {community.description}
                              </p>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block truncate">
                              {community.members?.length || 0} members
                            </span>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección adicional para asegurar scroll */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Explore</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/50">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🚀 Discover new communities</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Join groups with similar interests and connect with amazing people</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800/50">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">👥 Connect with people</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Find professionals, friends and mentors in your area of interest</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-800/50">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🎯 Smart search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Use specific keywords to find exactly what you're looking for</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {isSearching && (
            <div className="p-4 md:p-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl animate-pulse">
                      <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasResults ? (
                <div className="space-y-6">
                  {/* Resultados de usuarios */}
                  {users_results.length > 0 && (activeTab === 'all' || activeTab === 'people') && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary-500" />
                        People ({users_results.length})
                      </h3>
                      <div className="grid gap-2">
                        {users_results.map((user) => (
                          <UserCard
                            key={user._id}
                            user={user}
                            onClick={() => handleUserClick(user)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Resultados de comunidades */}
                  {communities_results.length > 0 && (activeTab === 'all' || activeTab === 'communities') && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary-500" />
                        Communities ({communities_results.length})
                      </h3>
                      <div className="grid gap-2">
                        {communities_results.map((community) => (
                          <div
                            key={community._id}
                            onClick={() => handleCommunityClick(community)}
                            className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover-lift"
                          >
                            <CommunityImage
                              coverImage={community.coverImage}
                              image={community.image}
                              name={community.name}
                              width={64}
                              height={48}
                              className="w-16 h-12 rounded-xl object-cover ring-2 ring-white dark:ring-gray-900 group-hover:ring-primary-200 dark:group-hover:ring-primary-800 transition-all duration-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {community.name}
                              </h4>
                              {community.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{community.description}</p>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {community.members?.length || 0} members
                              </span>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try with other search terms
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con atajos */}
        <div className="px-4 md:px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd> to close</span>
            <span className="hidden sm:block"><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd> to search</span>
          </div>
        </div>

        {/* Loading overlay para navegación */}
        {navigationLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Loading...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Preparing the content
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
