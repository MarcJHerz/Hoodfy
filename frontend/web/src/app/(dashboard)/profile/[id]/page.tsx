'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Tab, Menu } from '@headlessui/react';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUsers, FaHeart, FaRegHeart, FaComment } from 'react-icons/fa';
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
  TagIcon,
  LockClosedIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import type { UserProfile, Community } from '@/types';
import { Post } from '@/types/post';
import { User } from '@/types/user';
import { users, posts, communities } from '@/services/api';
import api from '@/services/api';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import { useImageUrl } from '@/utils/useImageUrl';
import PrivateChatModal from '@/components/chat/PrivateChatModal';

// Componente para manejar imágenes de comunidades individualmente
const CommunityImage = ({ coverImage, name }: { coverImage?: string; name: string }) => {
  const { url: communityImageUrl } = useImageUrl(coverImage || '');
  
  return (
    <div className="relative h-32 overflow-hidden">
      {coverImage ? (
        <Image
          src={communityImageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-3xl">
            {name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  );
};

// Componente para manejar imágenes de aliados individualmente
const AllyImage = ({ profilePicture, name }: { profilePicture?: string; name: string }) => {
  const { url: allyImageUrl } = useImageUrl(profilePicture || '');
  
  return (
    <div className="relative w-16 h-16 mx-auto mb-4">
      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all">
        {profilePicture ? (
          <Image
            src={allyImageUrl}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center rounded-full">
            <span className="text-white font-bold text-lg">
              {name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para manejar imágenes de posts
const PostMediaImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  const { url: mediaUrl } = useImageUrl(src || '');
  
  return (
    <Image
      src={mediaUrl}
      alt={alt}
      fill
      className={className}
      unoptimized
    />
  );
};

// Componente para manejar videos de posts
const PostMediaVideo = ({ src, className }: { src?: string; className?: string }) => {
  const { url: mediaUrl } = useImageUrl(src || '');
  
  return (
    <video
      src={mediaUrl}
      className={className}
      preload="metadata"
    />
  );
};

console.log('Cargando archivo: frontend/web/src/app/(dashboard)/profile/[id]/page.tsx');

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Asegurar que siempre pasemos un valor consistente al hook
  const profilePictureKey = user?.profilePicture || '';
  const { url: userImageUrl } = useImageUrl(profilePictureKey);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [allies, setAllies] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedAlly, setSelectedAlly] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAlly, setIsAlly] = useState(false);
  const [allyCheckLoading, setAllyCheckLoading] = useState(true);
  

  // Combinamos comunidades creadas y unidas
  const allCommunities = [...createdCommunities, ...joinedCommunities];

  const tabList = [
    { key: 'posts', label: 'Publicaciones', icon: Squares2X2Icon },
    { key: 'communities', label: 'Comunidades', icon: UsersIcon },
    { key: 'allies', label: 'Aliados', icon: UserPlusIcon },
    { key: 'about', label: 'Acerca de', icon: TagIcon },
  ];

  const handleLike = async (postId: string) => {
    try {
      const post = userPosts.find(p => p._id === postId);
      if (!post || !authUser?._id) return;

      if (post.likes.includes(authUser._id)) {
        await posts.unlikePost(postId);
        post.likes = post.likes.filter(id => id !== authUser._id);
      } else {
        await posts.likePost(postId);
        post.likes.push(authUser._id);
      }

      setUserPosts([...userPosts]);
    } catch (error) {
      console.error('Error al dar like:', error);
      toast.error('Error al dar like al post');
    }
  };

  const handleAddAlly = async () => {
    try {
      if (!user?._id) return;
      
      const response = await api.post('/api/allies/add-ally', {
        userId: user._id
      });
      
      if (response.data) {
        setIsAlly(true);
        toast.success('¡Ahora son aliados!');
      }
    } catch (error: any) {
      console.error('Error al agregar aliado:', error);
      toast.error(error.response?.data?.error || 'Error al agregar aliado');
    }
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id && authUser) {
          router.push(`/dashboard/profile/${authUser._id}`);
          return;
        }

        if (!id && !authUser) {
          setError('No se ha especificado un perfil');
          setLoading(false);
          return;
        }

        const userId = Array.isArray(id) ? id[0] : id;

        // Obtener datos del usuario
        const userResponse = await api.get(`/api/users/profile/${userId}`);
        if (!userResponse.data) {
          throw new Error('No se pudo obtener la información del usuario');
        }
        setUser(userResponse.data);

        // Verificar si es el propio perfil
        const isOwn = authUser && userId === authUser._id;
        setIsOwnProfile(!!isOwn);

        // Si no es el propio perfil, verificar si son aliados
        if (!isOwn && authUser) {
          try {
            const allyResponse = await api.get(`/api/allies/check/${userId}`);
            setIsAlly(allyResponse.data.isAlly);
          } catch (error) {
            console.error('Error al verificar alianza:', error);
            setIsAlly(false);
          }
        }
        setAllyCheckLoading(false);

        // Solo obtener posts si es el propio perfil o son aliados
        if (isOwn || isAlly) {
        const postsResponse = await posts.getUserPosts(userId);
        if (postsResponse.data?.posts) {
          setUserPosts(postsResponse.data.posts);
          } else {
            setUserPosts([]);
          }
        } else {
          setUserPosts([]);
        }

        // Obtener comunidades creadas
        const createdCommunitiesResponse = await communities.getCreatedCommunities(userId);
        const createdCommunitiesData = createdCommunitiesResponse.data || [];
        setCreatedCommunities(createdCommunitiesData);

        // Obtener comunidades unidas
        const joinedCommunitiesResponse = await users.getJoinedCommunities(userId);
        const joinedCommunitiesData = joinedCommunitiesResponse.data || [];
        setJoinedCommunities(joinedCommunitiesData);

        // Obtener aliados
        let alliesData = [];
        if (authUser && userId === authUser._id) {
          const response = await api.get('/api/allies/my-allies');
          alliesData = response.data?.allies || [];
        } else {
          const response = await api.get(`/api/allies/of/${userId}`);
          alliesData = response.data?.allies || [];
        }
        setAllies(alliesData);

      } catch (error: any) {
        console.error('Error en fetchData:', error);
        setError(error.response?.data?.message || error.message || 'Ha ocurrido un error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authUser, router, isAlly]);

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
        {authUser && (
          <Link
            href={`/dashboard/profile/${authUser._id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Volver a mi perfil
          </Link>
        )}
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El perfil que buscas no existe o ha sido eliminado.
          </p>
        {authUser && (
          <Link
            href={`/dashboard/profile/${authUser._id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Volver a mi perfil
          </Link>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-br from-blue-500/30 via-purple-500/10 to-gray-900/10 dark:from-blue-900/40 dark:via-purple-900/20 dark:to-gray-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-soft rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 70%)'}} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-end">
            {/* Avatar destacado */}
            <div className="relative group">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 ring-blue-400/30 dark:ring-blue-600/40 shadow-strong group-hover:shadow-glow transition-all duration-300 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md">
                {user?.profilePicture ? (
                  <Image
                    src={userImageUrl}
                    alt={`${user.name}'s profile`}
                    width={176}
                    height={176}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center rounded-full">
                    <span className="text-5xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Estado online */}
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full animate-pulse shadow-glow" title="En línea"></div>
            </div>
            {/* Info y acciones */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                      {user?.name}
                    </h1>
                    {/* Icono de aliado/no aliado */}
                    {!isOwnProfile && (
                      isAlly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold animate-fade-in" title="Aliado">
                          <CheckBadgeIcon className="w-4 h-4" /> Aliado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full text-xs font-semibold animate-fade-in" title="No aliado">
                          <UserPlusIcon className="w-4 h-4" /> No aliado
                        </span>
                      )
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">@{user?.username}</p>
                </div>
                {/* Botones de acción */}
                <div className="flex flex-wrap justify-center lg:justify-end gap-3">
                  {isOwnProfile ? (
                    <>
                      <Link
                        href="/profile/edit"
                        className="flex items-center gap-2 px-6 py-2.5 btn-secondary btn-lg shadow-soft hover:shadow-md"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Editar perfil
                      </Link>
                      <button className="flex items-center gap-2 px-6 py-2.5 btn-secondary btn-lg shadow-soft hover:shadow-md">
                        <ShareIcon className="w-4 h-4" />
                        Compartir
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedAlly(user)}
                        className="flex items-center gap-2 px-6 py-2.5 btn-primary btn-lg shadow-glow hover:shadow-glow-accent"
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        Mensaje
                      </button>
                      {!allyCheckLoading && !isAlly && (
                        <button
                          onClick={handleAddAlly}
                          className="flex items-center gap-2 px-6 py-2.5 btn-success btn-lg shadow-soft hover:shadow-md"
                        >
                          <UserPlusIcon className="w-4 h-4" />
                          Agregar aliado
                        </button>
                      )}
                      {/* Menú */}
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2.5 btn-ghost rounded-xl">
                          <EllipsisHorizontalIcon className="w-5 h-5" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50">
                          {isOwnProfile && (
                            <Menu.Item>
                              {({ active }) => (
                      <Link
                                  href="/profile/edit"
                                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                    active 
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <Cog6ToothIcon className="w-4 h-4" />
                                  Editar perfil
                      </Link>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                                  active 
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast.success('Enlace copiado al portapapeles');
                                }}
                              >
                                <ShareIcon className="w-4 h-4" />
                                Compartir perfil
                              </button>
                            )}
                          </Menu.Item>
                          {!isOwnProfile && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                                    active 
                                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  <UserCircleIcon className="w-4 h-4" />
                                  Reportar usuario
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </Menu.Items>
                      </Menu>
                    </>
                  )}
                </div>
              </div>
              {/* Bio */}
              {user?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {user.bio}
                </p>
              )}
              {/* Estadísticas en tarjetas */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-center mt-4">
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-xl px-6 py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Squares2X2Icon className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userPosts.length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Publicaciones</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-xl px-6 py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <UsersIcon className="w-5 h-5 text-purple-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allCommunities.length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Comunidades</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-xl px-6 py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <UserPlusIcon className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allies.length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Aliados</div>
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
                  {!isOwnProfile && !isAlly ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockClosedIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Contenido privado
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Solo los aliados pueden ver las publicaciones de este usuario
                      </p>
                    </div>
                  ) : (
                    <>
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
                            {isOwnProfile 
                              ? 'Comparte tu primera publicación con la comunidad'
                              : 'Este usuario aún no ha publicado nada'
                            }
                          </p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
                          {userPosts.map((post) => {
                            // Determinar si hay media
                            const hasMedia = post.media && post.media.length > 0;
                            const firstMedia = hasMedia ? post.media![0] : null;
                            const isVideo = firstMedia?.type === 'video';
                            const isImage = firstMedia?.type === 'image';
                            const videoThumbnail = isVideo ? firstMedia.thumbnail : null;
                            
                            return (
                              <div 
                                key={post._id} 
                                className="group cursor-pointer"
                                onClick={() => {
                                  setSelectedPost(post);
                                  setIsCommentsModalOpen(true);
                                }}
                              >
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
                                  {/* Mostrar video thumbnail, imagen, o placeholder */}
                                  {isVideo && videoThumbnail ? (
                                    <div className="relative w-full h-full">
                                      <PostMediaImage
                                        src={videoThumbnail}
                                        alt="Video thumbnail"
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      {/* Indicador de video */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : isVideo && !videoThumbnail ? (
                                    <div className="relative w-full h-full">
                                      <PostMediaVideo
                                        src={firstMedia.url}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      {/* Indicador de video */}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : isImage ? (
                                    <PostMediaImage
                                      src={firstMedia.url}
                                      alt="Post"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                                  
                                  {/* Overlay con estadísticas */}
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
                                  {hasMedia && post.media!.length > 1 && (
                                    <div className="absolute top-2 right-2">
                                      <div className="bg-black/50 rounded-full p-1">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                        <div className="space-y-6">
                          {userPosts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                              onCommentClick={(post) => {
                                setSelectedPost(post);
                                setIsCommentsModalOpen(true);
                              }}
                          onPostUpdate={(updatedPost) => {
                            const index = userPosts.findIndex(p => p._id === updatedPost._id);
                            if (index !== -1) {
                              const newPosts = [...userPosts];
                              newPosts[index] = updatedPost;
                              setUserPosts(newPosts);
                            }
                          }}
                        />
                          ))}
                        </div>
                      )}
                    </>
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
                        {isOwnProfile 
                          ? 'Únete a comunidades o crea la tuya propia'
                          : 'Este usuario no participa en ninguna comunidad'
                        }
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
                            <CommunityImage 
                              coverImage={community.coverImage}
                              name={community.name}
                            />
                            {createdCommunities.includes(community) && (
                              <div className="absolute top-3 right-3">
                                <span className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                                  Creador
                                </span>
                              </div>
                            )}
                            
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
                        {isOwnProfile 
                          ? 'Únete a comunidades para conocer gente y hacer aliados'
                          : 'Este usuario aún no tiene aliados'
                        }
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
                            <AllyImage 
                              profilePicture={ally.profilePicture}
                              name={ally.name}
                            />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {ally.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              @{ally.username}
                            </p>
                              {!isOwnProfile && (
                                <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedAlly(ally);
                                }}
                                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-full opacity-0 group-hover:opacity-100"
                              >
                                Mensaje
                                </button>
                            )}
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
                          {isOwnProfile 
                            ? 'Agrega una biografía para que otros sepan más sobre ti'
                            : 'Este usuario no ha compartido información adicional'
                          }
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

      {/* Modals */}
      {selectedAlly && (
        <PrivateChatModal
          isOpen={!!selectedAlly}
          onClose={() => setSelectedAlly(null)}
          otherUser={{
            _id: selectedAlly._id,
            name: selectedAlly.name,
            username: selectedAlly.username,
            email: '', // No disponible en UserProfile, pero requerido por User
            profilePicture: selectedAlly.profilePicture,
            bio: selectedAlly.bio,
            createdAt: selectedAlly.createdAt,
            updatedAt: selectedAlly.lastLogin // Usar lastLogin como updatedAt
          }}
        />
      )}

      {isCommentsModalOpen && selectedPost && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => setIsCommentsModalOpen(false)}
          post={selectedPost}
          currentUser={authUser}
          onPostUpdate={(updatedPost) => {
            const index = userPosts.findIndex(p => p._id === updatedPost._id);
            if (index !== -1) {
              const newPosts = [...userPosts];
              newPosts[index] = updatedPost;
              setUserPosts(newPosts);
            }
          }}
        />
      )}
    </div>
  );
} 