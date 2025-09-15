'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import { useUIStore } from '@/stores/uiStore';

import Logo from './Logo';
import { Transition } from '@headlessui/react';
import {
  HomeIcon,
  PlusIcon,
  FireIcon,
  UserGroupIcon,
  SparklesIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  HeartIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FireIcon as FireSolid,
  UserGroupIcon as UserGroupSolid,
  SparklesIcon as SparklesSolid,
} from '@heroicons/react/24/solid';
import { Community } from '@/types';

interface QuickAction {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  solidIcon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface UserStats {
  totalPosts: number;
  totalCommunities: number;
  totalViews: number;
  totalLikes: number;
}

export default function MobileSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { 
    userCommunities, 
    subscribedCommunities, 
    isLoadingCommunities, 
    loadUserCommunities, 
    loadSubscribedCommunities 
  } = useCommunitiesStore();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  

  
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalCommunities: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);

  // Combinamos comunidades creadas y suscritas
  const allUserCommunities = [...userCommunities, ...subscribedCommunities];

  // Acciones rápidas optimizadas para móvil
  const quickActions: QuickAction[] = [
    {
      name: 'Feed',
      href: '/dashboard',
      icon: HomeIcon,
      solidIcon: HomeSolid,
      color: 'from-blue-500 to-cyan-500',
      description: 'All posts'
    },
    {
      name: 'Trending',
      href: '/dashboard/trending',
      icon: FireIcon,
      solidIcon: FireSolid,
      color: 'from-orange-500 to-red-500',
      description: 'Most popular'
    },
    {
      name: 'My communities',
      href: '/communities',
      icon: UserGroupIcon,
      solidIcon: UserGroupSolid,
      color: 'from-green-500 to-emerald-500',
      description: 'Where I participate'
    },
    {
      name: 'Discover',
      href: '/communities/discover',
      icon: SparklesIcon,
      solidIcon: SparklesSolid,
      color: 'from-purple-500 to-pink-500',
      description: 'New communities'
    }
  ];

  // Cargar datos del usuario y comunidades
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        // Cargar comunidades del usuario
        await loadUserCommunities(user._id);
        await loadSubscribedCommunities();
        
        // Simulamos estadísticas del usuario
        setUserStats({
          totalPosts: 25,
          totalCommunities: allUserCommunities.length,
          totalViews: 1250,
          totalLikes: 340,
        });

        // Simulamos comunidades sugeridas
        setSuggestedCommunities([
          {
            _id: 'suggested-1',
            name: 'Nomads Dating Bali',
            description: 'Meeting every weekend in Bali Indonesia',
            isNew: true
          },
          {
            _id: 'suggested-2',
            name: 'F1 Miami',
            description: 'Fanbase F1 Miami',
            isNew: false
          },
          {
            _id: 'suggested-3',
            name: 'Stoics Daily',
            description: 'Stoicism for everyone',
            isNew: true
          }
        ]);
      } catch (error) {
        console.error('Error cargando datos del mobile sidebar:', error);
      }
    };

    if (mobileSidebarOpen) {
      loadUserData();
    }
  }, [user, mobileSidebarOpen, loadUserCommunities, loadSubscribedCommunities]);

  // Actualizar estadísticas cuando cambien las comunidades
  useEffect(() => {
    setUserStats(prev => ({
      ...prev,
      totalCommunities: allUserCommunities.length,
    }));
  }, [allUserCommunities.length]);

  // Cerrar sidebar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setMobileSidebarOpen(false);
      }
    };

    if (mobileSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileSidebarOpen, setMobileSidebarOpen]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getCommunityColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ];
    return colors[index % colors.length];
  };

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <Transition
        show={mobileSidebarOpen}
        enter="transition-opacity ease-linear duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-gray-600/75 dark:bg-gray-900/75 backdrop-blur-sm z-40 lg:hidden" />
      </Transition>

      {/* Sidebar */}
      <Transition
        show={mobileSidebarOpen}
        enter="transition ease-in-out duration-300 transform"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-xl lg:hidden" ref={sidebarRef}>
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Logo size="md" showText href="/dashboard" />
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-4 space-y-6">
              {/* Dashboard Personal */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  📊 Dashboard
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DocumentTextIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                      {formatNumber(userStats.totalPosts)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <UserGroupIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatNumber(userStats.totalCommunities)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Communities</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <EyeIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {formatNumber(userStats.totalViews)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <HeartIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                      {formatNumber(userStats.totalLikes)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
                  </div>
                </div>
              </div>

              {/* Navegación rápida */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  🚀 Navigation
                </h2>
                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const active = isActive(action.href);
                    const Icon = active ? action.solidIcon : action.icon;
                    
                    return (
                      <Link
                        key={action.name}
                        href={action.href}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{action.name}</div>
                          <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            {action.description}
                          </div>
                        </div>
                        {!active && (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>



              {/* My Communities */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    🏘️ My Communities
                  </h2>
                  <Link
                    href="/communities"
                    onClick={handleLinkClick}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    See all
                  </Link>
                </div>
                
                {isLoadingCommunities ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allUserCommunities.slice(0, 4).map((community, index) => (
                      <Link
                        key={community._id}
                        href={`/dashboard/communities/${community._id}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className={`w-6 h-6 bg-gradient-to-br ${getCommunityColor(index)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-semibold text-xs">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {community.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {community.members?.length || 0} members
                          </div>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      </Link>
                    ))}
                    
                    {allUserCommunities.length === 0 && (
                      <div className="text-center py-4">
                        <UserGroupIcon className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          You are not a member of any community
                        </p>
                        <Link
                          href="/communities/discover"
                          onClick={handleLinkClick}
                          className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                          Discover communities
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Suggested Communities */}
              {suggestedCommunities.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    ⭐ Suggested Communities
                  </h2>
                  <div className="space-y-2">
                    {suggestedCommunities.map((community, index) => (
                      <Link
                        key={community._id}
                        href={`/dashboard/communities/${community._id}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className={`w-6 h-6 bg-gradient-to-br ${getCommunityColor(index + 5)} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-semibold text-xs">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {community.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {community.members?.length || 0} members
                            {community.isNew && (
                              <span className="ml-1 text-green-600 dark:text-green-400">• New</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <SparklesIcon className="h-3 w-3 text-yellow-400" />
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con acciones rápidas */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/create-post"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-1 p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">Create Post</span>
                </Link>
                <Link
                  href="/communities/create"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-1 p-3 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <UserGroupIcon className="h-5 w-5" />
                  <span className="text-xs font-medium">New Community</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </>
  );
} 