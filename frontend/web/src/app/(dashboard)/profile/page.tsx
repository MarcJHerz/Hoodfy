'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUsers } from 'react-icons/fa';
import { 
  UserCircleIcon, 
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  UsersIcon,
  HeartIcon,
  BookmarkIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { users, posts, communities } from '@/services/api';
import { Tab } from '@headlessui/react';
import Link from 'next/link';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageUtils';
import PostCard from '@/components/PostCard';
import type { UserProfile, Community } from '@/types';
import { Post } from '@/types/post';
import { User } from '@/types/user';

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [allies, setAllies] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Combinamos comunidades creadas y unidas
  const allCommunities = [...createdCommunities, ...joinedCommunities];

  const onPostUpdate = (updatedPost: Post) => {
    setUserPosts(prevPosts => 
      prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
  };

  const tabList = [
    { key: 'posts', label: 'Publicaciones', icon: Squares2X2Icon },
    { key: 'communities', label: 'Comunidades', icon: UsersIcon },
    { key: 'allies', label: 'Aliados', icon: UserPlusIcon },
    { key: 'about', label: 'Acerca de', icon: TagIcon },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        // Si no hay ID, usar el usuario autenticado
        const userId = id || authUser._id;
        
        const [userRes, postsRes, createdCommunitiesRes, joinedCommunitiesRes, alliesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/user/${userId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/created-by/${userId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/communities/joined-by/${userId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/allies/my-allies`)
        ]);

        if (!userRes.ok) throw new Error('Error al cargar el perfil');
        if (!postsRes.ok) throw new Error('Error al cargar las publicaciones');
        if (!createdCommunitiesRes.ok) throw new Error('Error al cargar las comunidades creadas');
        if (!joinedCommunitiesRes.ok) throw new Error('Error al cargar las comunidades unidas');
        if (!alliesRes.ok) throw new Error('Error al cargar los aliados');

        const [userData, postsData, createdCommunitiesData, joinedCommunitiesData, alliesData] = await Promise.all([
          userRes.json(),
          postsRes.json(),
          createdCommunitiesRes.json(),
          joinedCommunitiesRes.json(),
          alliesRes.json()
        ]);

        setUser(userData);
        setUserPosts(postsData);
        setCreatedCommunities(createdCommunitiesData);
        setJoinedCommunities(joinedCommunitiesData);
        setAllies(alliesData.allies || []);
      } catch (error: any) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      fetchData();
    }
  }, [id, authUser, router]);

  useEffect(() => {
    if (authUser && user) {
      setIsOwnProfile(authUser._id === user._id);
    }
  }, [authUser, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😞</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error al cargar el perfil
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Usuario no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No se pudo cargar la información del perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  {user?.profilePicture ? (
            <Image
              src={formatImageUrl(user.profilePicture)}
                      alt={`${user.name}'s profile`}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center rounded-full">
                      <span className="text-4xl font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
          </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-gray-700 rounded-full animate-pulse"></div>
        </div>
      </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {user?.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    @{user?.username}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center lg:justify-end gap-3">
                  <Link
                    href="/profile/edit"
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-all duration-200 hover-lift"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Editar perfil
                  </Link>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-all duration-200 hover-lift">
                    <ShareIcon className="w-4 h-4" />
                    Compartir
                  </button>
                </div>
              </div>

              {/* Bio */}
              {user?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed max-w-2xl">
                  {user.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 text-center">
                <div className="group cursor-pointer">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {userPosts.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Publicaciones
                  </div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {allCommunities.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Comunidades
                  </div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {allies.length}
            </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Aliados
          </div>
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tab.Group onChange={setActiveTab}>
            <Tab.List className="flex space-x-8 overflow-x-auto">
              {tabList.map((tab, index) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    `flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      selected
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`
                  }
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels className="mt-6 pb-8">
              {/* Posts Panel */}
              <Tab.Panel>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                  {/* View Toggle */}
                  <div className="flex justify-end mb-6">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          viewMode === 'grid'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Vista en cuadrícula"
                      >
                        <Squares2X2Icon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          viewMode === 'list'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Vista en lista"
                      >
                        <ViewColumnsIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {userPosts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Squares2X2Icon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay publicaciones
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Comparte tu primera publicación con la comunidad
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
                      {userPosts.map((post) => (
                        <div key={post._id} className="group cursor-pointer">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                            {post.media && post.media.length > 0 ? (
                              <Image
                                src={formatImageUrl(post.media[0].url)}
                                alt="Post"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800 p-2">
                                <Squares2X2Icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                                {post.content && (
                                  <p className="text-xs text-center line-clamp-3 px-1">
                                    {post.content.substring(0, 50)}...
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex items-center gap-2 sm:gap-4 text-white">
                                <div className="flex items-center gap-1">
                                  <HeartSolidIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                                  <span className="font-medium text-xs sm:text-sm">{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ChatBubbleLeftIcon className="w-3 h-3 sm:w-5 sm:h-5" />
                                  <span className="font-medium text-xs sm:text-sm">{post.comments?.length || 0}</span>
                                </div>
                              </div>
                            </div>
                            {/* Indicador de múltiples medios */}
                            {post.media && post.media.length > 1 && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-black/50 rounded-full p-1">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onPostUpdate={onPostUpdate}
                      />
                    ))}
                  </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Communities Panel */}
              <Tab.Panel>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                  {allCommunities.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay comunidades
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Únete a comunidades o crea la tuya propia
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allCommunities.map((community) => (
                      <Link
                        key={community._id}
                        href={`/communities/${community._id}`}
                          className="group"
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-200 hover-lift overflow-hidden">
                            {/* Banner de la comunidad */}
                            <div className="relative h-32 overflow-hidden">
                              {community.coverImage ? (
                                <Image
                                  src={formatImageUrl(community.coverImage)}
                                  alt={community.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                  <span className="text-white font-bold text-3xl">
                                    {community.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {createdCommunities.includes(community) && (
                                <div className="absolute top-3 right-3">
                                  <span className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                                    Creador
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Contenido */}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate mb-2">
                                {community.name}
                              </h3>
                              {community.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {community.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <UsersIcon className="w-4 h-4 mr-1" />
                                  {community.members?.length || 0} miembros
                                </span>
                                {community.creator && (
                                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                                    por {community.creator.name}
                                  </span>
                                )}
                              </div>
                  </div>
                </div>
                      </Link>
                    ))}
                  </div>
                  )}
                </div>
              </Tab.Panel>

              {/* Allies Panel */}
              <Tab.Panel>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                  {allies.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlusIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay aliados
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Únete a comunidades para conocer gente y hacer aliados
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allies.map((ally) => (
                      <Link
                        key={ally._id}
                          href={`/dashboard/profile/${ally._id}`}
                          className="group"
                      >
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-all duration-200 hover-lift text-center">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                              <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
                                {ally.profilePicture ? (
                          <Image
                            src={formatImageUrl(ally.profilePicture)}
                            alt={ally.name}
                            fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">
                                      {ally.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                        </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {ally.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              @{ally.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  )}
                </div>
              </Tab.Panel>

              {/* About Panel */}
              <Tab.Panel>
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Acerca de {user?.name}
                    </h3>
                    
                    {user?.bio ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Biografía</h4>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {user.bio}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Estadísticas</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {userPosts.length}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Publicaciones</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {allCommunities.length}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Comunidades</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {allies.length}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Aliados</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TagIcon className="w-8 h-8 text-gray-400" />
                      </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Sin información adicional
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Agrega una biografía para que otros sepan más sobre ti
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
} 