'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import { formatImageUrl } from '@/utils/imageUtils';
import {
  HomeIcon,
  PlusIcon,
  FireIcon,
  UserGroupIcon,
  SparklesIcon,
  ChevronRightIcon,
  EyeIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FireIcon as FireSolid,
  UserGroupIcon as UserGroupSolid,
  SparklesIcon as SparklesSolid,
} from '@heroicons/react/24/solid';
import { Community } from '@/types';
import Logo from './Logo';

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

export default function EnhancedSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { 
    userCommunities, 
    subscribedCommunities, 
    isLoadingCommunities, 
    loadUserCommunities, 
    loadSubscribedCommunities 
  } = useCommunitiesStore();
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalCommunities: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  
  const [suggestedCommunities, setSuggestedCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Combinamos comunidades creadas y suscritas
  const allUserCommunities = [...userCommunities, ...subscribedCommunities];

  // Acciones rápidas con diseño moderno
  const quickActions: QuickAction[] = [
    {
      name: 'Feed',
      href: '/dashboard',
      icon: HomeIcon,
      solidIcon: HomeSolid,
      color: 'from-blue-500 to-cyan-500',
      description: 'See all posts'
    },
    {
      name: 'Trending',
      href: '/dashboard/trending',
      icon: FireIcon,
      solidIcon: FireSolid,
      color: 'from-orange-500 to-red-500',
      description: 'See trending posts'
    },
    {
      name: 'My Communities',
      href: '/communities',
      icon: UserGroupIcon,
      solidIcon: UserGroupSolid,
      color: 'from-green-500 to-emerald-500',
      description: 'See all communities'
    },
    {
      name: 'Discover',
      href: '/communities/discover',
      icon: SparklesIcon,
      solidIcon: SparklesSolid,
      color: 'from-purple-500 to-pink-500',
      description: 'Discover new communities'
    }
  ];

  // Cargar datos del usuario y comunidades
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Cargar comunidades del usuario
        await loadUserCommunities(user._id);
        await loadSubscribedCommunities();
        
        // Simulamos estadísticas del usuario por ahora
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
        console.error('Error updating sidebar:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, loadUserCommunities, loadSubscribedCommunities]);

  // Actualizar estadísticas cuando cambien las comunidades
  useEffect(() => {
    setUserStats(prev => ({
      ...prev,
      totalCommunities: allUserCommunities.length,
    }));
  }, [allUserCommunities.length]);

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

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 px-6 pb-4">
        {/* Header con logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Logo size="lg" showText href="/dashboard" />
        </div>

        {/* Navegación rápida */}
        <nav className="flex flex-1 flex-col gap-y-7">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              🚀 Quick Actions
            </h2>
            <ul className="space-y-2">
              {quickActions.map((action) => {
                const active = isActive(action.href);
                const Icon = active ? action.solidIcon : action.icon;
                
                return (
                  <li key={action.name}>
                    <Link
                      href={action.href}
                      className={`group relative flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <div className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{action.name}</div>
                          <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            {action.description}
                          </div>
                        </div>
                        {!active && (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Dashboard Personal */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              📊 Dashboard
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {formatNumber(userStats.totalPosts)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Communities</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatNumber(userStats.totalCommunities)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {formatNumber(userStats.totalViews)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Likes</span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">
                  {formatNumber(userStats.totalLikes)}
                </span>
              </div>
            </div>
          </div>

          {/* Mis Comunidades */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                🏘️ Communities
              </h2>
              <Link
                href="/communities"
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                See all
              </Link>
            </div>
            
            {isLoadingCommunities ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {allUserCommunities.slice(0, 5).map((community, index) => (
                  <li key={community._id}>
                    <Link
                      href={`/communities/${community._id}`}
                      className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 transition-all duration-200 hover:shadow-md flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${getCommunityColor(index)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-white font-semibold text-xs">
                          {community.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {community.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {community.description || `${community.members?.length || 0} miembros`}
                        </div>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
                
                {allUserCommunities.length === 0 && (
                  <div className="text-center py-4">
                    <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      You are not a member of any community
                    </p>
                    <Link
                      href="/communities/discover"
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Discover communities
                    </Link>
                  </div>
                )}
              </ul>
            )}
          </div>

          {/* Comunidades Sugeridas */}
          {suggestedCommunities.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                  ⭐ Suggested Communities
              </h2>
              <ul className="space-y-2">
                {suggestedCommunities.map((community, index) => (
                  <li key={community._id}>
                    <Link
                      href={`/communities/${community._id}`}
                      className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 transition-all duration-200 hover:shadow-md flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${getCommunityColor(index + 5)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
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
                            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3 text-yellow-400" />
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Acciones rápidas flotantes */}
          <div className="mt-auto">
            <div className="flex gap-2">
              <Link
                href="/dashboard/create-post"
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-3 text-center text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 mx-auto mb-1" />
                Create Post
              </Link>
              <Link
                href="/communities/create"
                className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl p-3 text-center text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <UserGroupIcon className="h-4 w-4 mx-auto mb-1" />
                New Community
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
} 