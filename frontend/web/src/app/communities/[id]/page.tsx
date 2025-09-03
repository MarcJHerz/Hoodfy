'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { communities, users, subscriptions } from '@/services/api';
import Image from 'next/image';
import { 
  UserGroupIcon, 
  ShareIcon, 
  FlagIcon, 
  PencilIcon, 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  StarIcon,
  SparklesIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import CommunityFeed from '@/components/community/CommunityFeed';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import SubscriptionModal from '@/components/SubscriptionModal';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';
import { useImageUrl } from '@/utils/useImageUrl';
import { useAuthStore } from '@/stores/authStore';
import CommunityChatModal from '@/components/chat/CommunityChatModal';

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  price?: number;
  isFree?: boolean;
  members?: any[];
  creator?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  posts?: any[];
  createdAt?: string;
  rules?: string[];
  category?: string;
  isPrivate?: boolean;
}

export default function UnifiedCommunityPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  
  // Estado principal
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ _id: string; name: string; profilePicture?: string } | null>(null);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members'>('posts');
  const [isCreator, setIsCreator] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCancelSubscriptionModalOpen, setIsCancelSubscriptionModalOpen] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [communityChat, setCommunityChat] = useState<any | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isChatTeaseModalOpen, setIsChatTeaseModalOpen] = useState(false);
  
  // Hooks para imágenes
  const coverImageKey = community?.coverImage || '';
  const { url: communityCoverImageUrl } = useImageUrl(coverImageKey);
  const creatorProfilePictureKey = community?.creator?.profilePicture || '';
  const { url: creatorProfileImageUrl } = useImageUrl(creatorProfilePictureKey);

  // Inicialización
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (authUser) {
          // Usuario autenticado - cargar datos completos
          await loadUser();
          await loadCommunity();
          await loadSubscribers();
          await checkSubscription();
        } else {
          // Usuario no autenticado - cargar solo datos públicos
          await loadPublicCommunity();
        }
      } catch (error) {
        console.error('Error al inicializar datos:', error);
      }
    };

    initializeData();
  }, [id, authUser]);

  // Cargar comunidad pública (sin autenticación)
  const loadPublicCommunity = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
      const response = await fetch(`${apiUrl}/api/communities/${id}/public`);
      
      if (!response.ok) {
        throw new Error('Comunidad no encontrada');
      }
      
      const data = await response.json();
      setCommunity(data);
      setViewCount(Math.floor(Math.random() * 1000) + 100);
    } catch (error: any) {
      console.error('Error al cargar la comunidad pública:', error);
      setError(error.message || 'Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  // Cargar comunidad completa (con autenticación)
  const loadCommunity = async () => {
    try {
      setLoading(true);
      const response = await communities.getById(id as string);
      setCommunity(response.data);
      setViewCount(Math.floor(Math.random() * 1000) + 100);
      
      if (user) {
        const isUserCreator = user._id === response.data.creator?._id;
        setIsCreator(isUserCreator);
      }
    } catch (error: any) {
      console.error('Error al cargar la comunidad:', error);
      setError(error.response?.data?.error || 'Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuario autenticado
  const loadUser = async () => {
    try {
      const res = await users.getProfile();
      const userData = res.data.user || res.data;
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error al cargar usuario:', err);
      setUser(null);
      throw err;
    }
  };

  // Cargar suscriptores
  const loadSubscribers = async () => {
    try {
      const response = await communities.getSubscribers(id as string);
      setSubscribers(response.data);
    } catch (error) {
      console.error('Error al cargar suscriptores:', error);
    }
  };

  // Verificar suscripción
  const checkSubscription = async () => {
    try {
      const response = await communities.getSubscribedCommunities();
      const isSubscribedToCommunity = response.data.some((sub: any) => {
        return sub.community && sub.community._id === id;
      });
      setIsSubscribed(isSubscribedToCommunity);
      return isSubscribedToCommunity;
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
      return false;
    }
  };

  // Handlers
  const handleShare = async () => {
    try {
      const publicUrl = `${window.location.origin}/communities/${id}`;
      await navigator.share({
        title: community?.name,
        text: community?.description,
        url: publicUrl
      });
    } catch (error) {
      console.error('Error al compartir:', error);
      const publicUrl = `${window.location.origin}/communities/${id}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleSubscribe = () => {
    if (!authUser) {
      router.push('/register');
      return;
    }
    setIsSubscriptionModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

  const handleChatClick = () => {
    if (!authUser) {
      router.push('/register');
      return;
    }
    
    if (hasAccess) {
      setIsChatModalOpen(true);
    } else {
      setIsChatTeaseModalOpen(true);
    }
  };

  // Variables computadas
  const hasAccess = authUser && (isCreator || isSubscribed);

  // Loading state
  if (loading) {
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
            Cargando comunidad
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Preparando el contenido...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Comunidad no encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Esta comunidad no existe o ha sido eliminada'}
          </p>
          <Link
            href="/communities"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Explorar comunidades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Banner */}
      <div className="relative">
        <div className="relative h-80 w-full overflow-hidden">
          <Image
            src={communityCoverImageUrl || '/images/defaults/default-community.png'}
            alt={community.name}
            fill
            className="object-cover"
            priority
            unoptimized
            onError={(e) => {
              e.currentTarget.src = '/images/defaults/default-community.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex space-x-3">
          <button
            onClick={handleLike}
            className={`p-3 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200 hover-lift ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isLiked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isLiked ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
            title="Compartir comunidad"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          {authUser && community.creator?._id === authUser._id && (
            <Link
              href={`/dashboard/communities/${community._id}/edit`}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
              title="Editar comunidad"
            >
              <PencilIcon className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 w-full sm:w-auto">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {isCreator && (
                    <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg">
                      <StarIcon className="w-3 h-3 mr-1.5" />
                      Creator
                    </span>
                  )}
                  {isSubscribed && (
                    <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg">
                      <CheckCircleIcon className="w-3 h-3 mr-1.5" />
                      Subscribed
                    </span>
                  )}
                  {community.isPrivate && (
                    <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg">
                      <LockClosedIcon className="w-3 h-3 mr-1.5" />
                      Private
                    </span>
                  )}
                  {(community.members?.length || 0) > 5 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg animate-pulse">
                      🔥 Trending
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 sm:mb-3 drop-shadow-lg leading-tight">
                  {community.name}
                </h1>
                
                {/* Description */}
                {community.description && (
                  <p className="text-white/90 text-sm sm:text-base max-w-2xl drop-shadow-lg mb-4">
                    {community.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{community.members?.length || 0} miembros</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{viewCount} vistas</span>
                  </div>
                  {community.createdAt && (
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Creada {new Date(community.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full sm:w-auto sm:ml-8">
                {!isCreator && !isSubscribed && (
                  <div className="text-center sm:text-right">
                    <button
                      onClick={handleSubscribe}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover-lift text-base sm:text-lg group"
                    >
                      <span className="flex items-center justify-center">
                        {authUser ? 'Unirse ahora' : 'Registrarse y unirse'}
                        <SparklesIcon className="w-4 h-4 ml-2 group-hover:animate-spin" />
                      </span>
                    </button>
                    
                    <p className="text-white/70 text-xs mt-2 font-medium">
                      ✨ Acceso instantáneo al contenido exclusivo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Creator Spotlight */}
            {community.creator && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Image
                      src={creatorProfileImageUrl}
                      alt={community.creator.name}
                      width={64}
                      height={64}
                      className="rounded-2xl object-cover ring-4 ring-white/30"
                      unoptimized
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <StarIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1">{community.creator.name}</h3>
                  <p className="text-white/80 text-sm mb-4">Community founder</p>
                  
                  <Link
                    href={`/profile/${community.creator._id}`}
                    className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover-lift"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            )}

            {/* Chat Card */}
            <div 
              className={`rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover-lift group relative ${
                hasAccess 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}
              onClick={handleChatClick}
            >
              {!hasAccess && (
                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <LockClosedIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:scale-110 duration-300 ${
                  hasAccess 
                    ? 'bg-white/20 group-hover:bg-white/30' 
                    : 'bg-white/10 group-hover:bg-white/20'
                }`}>
                  <ChatBubbleLeftRightIcon className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">
                  {hasAccess ? 'Group Chat' : 'Live Community Chat'}
                </h3>
                
                <p className="text-white/80 text-sm mb-4">
                  {hasAccess 
                    ? `Connect with ${community.members?.length || 0} members`
                    : `${community.members?.length || 0} members are chatting live!`
                  }
                </p>
                
                <div className={`backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  hasAccess 
                    ? 'bg-white/20 group-hover:bg-white/30' 
                    : 'bg-white/10 group-hover:bg-white/20 border border-white/30'
                }`}>
                  {hasAccess ? 'Open chat 💬' : '🔓 Join conversation'}
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Community Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Miembros</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {community.members?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Posts</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {community.posts?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Vistas</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {viewCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    activeTab === 'posts'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>Posts</span>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    activeTab === 'posts' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {community.posts?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    activeTab === 'about'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>About</span>
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>Members</span>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    activeTab === 'members' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {community.members?.length || 0}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {/* Create Post Form - Solo para usuarios autenticados con acceso */}
                {authUser && hasAccess && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <CreatePostForm
                      communityId={id as string}
                      onPostCreated={() => {
                        setRefreshFeed(prev => prev + 1);
                      }}
                    />
                  </div>
                )}
                
                {/* Posts Feed o Vista Pública */}
                {hasAccess ? (
                  <CommunityFeed 
                    communityId={id as string} 
                    isCreator={isCreator}
                    key={refreshFeed}
                  />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12">
                    <div className="text-center max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LockClosedIcon className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Contenido exclusivo
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Únete a esta comunidad para acceder a posts exclusivos y conectar con otros miembros
                      </p>
                      <button
                        onClick={handleSubscribe}
                        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                      >
                        {authUser ? 'Unirse ahora' : 'Registrarse y unirse'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <SparklesIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
                  About {community.name}
                </h2>
                
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
                    {community.description}
                  </p>
                </div>

                {/* Community Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                      {community.members?.length || 0}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Miembros activos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {community.posts?.length || 0}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Posts publicados</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {viewCount}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Vistas totales</p>
                  </div>
                </div>

                {/* Creator Info */}
                {community.creator && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Created by
                    </h3>
                    <Link
                      href={`/profile/${community.creator._id}`}
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="relative">
                        <Image
                          src={creatorProfileImageUrl}
                          alt={community.creator.name}
                          width={64}
                          height={64}
                          className="rounded-xl object-cover ring-2 ring-primary-200 dark:ring-primary-700 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
                          unoptimized
                        />
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                          <StarIcon className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {community.creator.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Community founder
                        </p>
                        {community.createdAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Member since {new Date(community.createdAt).toLocaleDateString('es-ES')}</p>
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <UserGroupIcon className="w-7 h-7 mr-3 text-primary-600 dark:text-primary-400" />
                    Members ({community.members?.length || 0})
                  </h2>
                </div>
                
                {community.members && community.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {community.members.map((member) => (
                      <Link 
                        key={member._id} 
                        href={`/profile/${member._id}`} 
                        className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover-lift group border border-gray-200 dark:border-gray-600"
                      >
                        <div className="relative">
                          <Image
                            src={member.profilePicture || '/images/defaults/default-avatar.png'}
                            alt={member.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
                            unoptimized
                          />
                          {member._id === community.creator?._id && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                              <StarIcon className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                            {member.name}
                          </p>
                          {member._id === community.creator?._id && (
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full mt-1">
                              Creator
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserGroupIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No members yet in this community
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseModal}
        communityName={community.name}
        price={community.price || 0}
        benefits={['Access to exclusive content', 'Participation in the group chat', 'Connection with other members']}
        rules={['Respect the members', 'No spam', 'Keep constructive conversations']}
        communityId={community._id}
        onSubscriptionSuccess={checkSubscription}
      />

      <CommunityChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        communityId={id as string}
        communityName={community.name}
      />

      {/* Chat Tease Modal */}
      {isChatTeaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white text-center relative">
              <button
                onClick={() => setIsChatTeaseModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Join the Conversation!</h3>
              <p className="text-blue-100">
                {community.members?.length || 0} members are chatting live right now
              </p>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm">💬</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Chat in real-time with community members</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-sm">🤝</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Make new friends and connections</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Get instant access to exclusive content</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsChatTeaseModalOpen(false);
                    handleSubscribe();
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift group"
                >
                  <span className="flex items-center justify-center">
                    Join Community Now
                    <SparklesIcon className="w-5 h-5 ml-2 group-hover:animate-spin" />
                  </span>
                </button>
                
                <button
                  onClick={() => setIsChatTeaseModalOpen(false)}
                  className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
