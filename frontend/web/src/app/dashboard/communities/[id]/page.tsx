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
import { formatImageUrl } from '@/utils/imageUtils';
import { useImageUrl } from '@/utils/useImageUrl';
import { useAuthStore } from '@/stores/authStore';
import CommunityChatModal from '@/components/chat/CommunityChatModal';

// Componente para manejar imágenes de miembros individualmente
const MemberImage = ({ profilePicture, name, isCreator }: { profilePicture?: string; name: string; isCreator: boolean }) => {
  const { url: memberImageUrl } = useImageUrl(profilePicture);
  
  return (
    <div className="relative">
      <Image
        src={memberImageUrl}
        alt={name}
        width={48}
        height={48}
        className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
        unoptimized
      />
      {isCreator && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
          <StarIcon className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};

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

export default function CommunityPage() {
  const { id } = useParams();
  const router = useRouter();
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
  const { user: authUser } = useAuthStore();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isChatTeaseModalOpen, setIsChatTeaseModalOpen] = useState(false);
  
  // Hook para manejar la cover image de la comunidad - asegurar consistencia
  const coverImageKey = community?.coverImage || '';
  const { url: communityCoverImageUrl } = useImageUrl(coverImageKey);
  
  // Hook para manejar la imagen del perfil del creador - asegurar consistencia
  const creatorProfilePictureKey = community?.creator?.profilePicture || '';
  const { url: creatorProfileImageUrl } = useImageUrl(creatorProfilePictureKey);

  // Debug logs removed for security

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadUser();
        await loadCommunity();
        await loadSubscribers();
        await checkSubscription();
      } catch (error) {
        console.error('Error al inicializar datos:', error);
      }
    };

    initializeData();
  }, [id]);

  // Cerrar menú de opciones cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOptionsMenuOpen && !target.closest('.options-menu')) {
        setIsOptionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsMenuOpen]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const response = await communities.getById(id as string);
      setCommunity(response.data);
      
      // Simular conteo de vistas
      setViewCount(Math.floor(Math.random() * 1000) + 100);
      
      // Verificar si el usuario es el creador
      const currentUser = await users.getProfile();
      const userData = currentUser.data.user || currentUser.data;
      
      const isUserCreator = userData._id === response.data.creator?._id;
      
      setIsCreator(isUserCreator);
    } catch (error: any) {
      console.error('Error al cargar la comunidad:', error);
      setError(error.response?.data?.error || 'Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

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

  const loadSubscribers = async () => {
    try {
      const response = await communities.getSubscribers(id as string);
      setSubscribers(response.data);
    } catch (error) {
      console.error('Error al cargar suscriptores:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const response = await communities.getSubscribedCommunities();
      const isSubscribedToCommunity = response.data.some((sub: any) => {
        return sub.community && sub.community._id === id;
      });
      setIsSubscribed(isSubscribedToCommunity);
      console.log('🔍 Estado de suscripción:', {
        communityId: id,
        isSubscribed: isSubscribedToCommunity,
        subscriptions: response.data
      });
      return isSubscribedToCommunity;
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
      return false;
    }
  };

  const handleShare = async () => {
    try {
      // Usar la URL pública para compartir (sin /dashboard)
      const publicUrl = `${window.location.origin}/communities/${id}`;
      await navigator.share({
        title: community?.name,
        text: community?.description,
        url: publicUrl
      });
    } catch (error) {
      console.error('Error al compartir:', error);
      // Usar la URL pública para copiar al portapapeles
      const publicUrl = `${window.location.origin}/communities/${id}`;
      navigator.clipboard.writeText(publicUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleReport = () => {
    toast.error('Función de reporte en desarrollo');
  };

  const handleSubscribe = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

  const handleCancelSubscription = async () => {
    setIsOptionsMenuOpen(false);
    setIsCancelSubscriptionModalOpen(true);
  };

  const handleChatClick = () => {
    if (hasAccess) {
      setIsChatModalOpen(true);
    } else {
      setIsChatTeaseModalOpen(true);
    }
  };

  const handleConfirmCancelSubscription = async () => {
    try {
      await subscriptions.cancelSubscription(id as string);
      toast.success('Suscripción cancelada exitosamente');
      setIsSubscribed(false);
      
      // Recargar la comunidad para actualizar el estado
      await loadCommunity();
    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
      toast.error('Error al cancelar la suscripción');
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            ¡Ups! Algo salió mal
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 hover-lift"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Comunidad no encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Esta comunidad no existe o ha sido eliminada
          </p>
        </div>
      </div>
    );
  }

  const hasAccess = isCreator || isSubscribed;

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
            title="Share community"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleReport}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
            title="Report community"
          >
            <FlagIcon className="h-5 w-5" />
          </button>
          {authUser && community.creator?._id === authUser._id && (
            <Link
                              href={`/dashboard/communities/${community._id}/edit`}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
              title="Edit community"
            >
              <PencilIcon className="h-5 w-5" />
            </Link>
          )}
          {isSubscribed && !isCreator && (
            <div className="relative options-menu">
              <button
                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
                title="Subscription options"
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </button>
              
              {/* Dropdown Menu */}
              {isOptionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <button
                    onClick={handleCancelSubscription}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span className="font-medium">Cancel subscription</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 w-full sm:w-auto">
                {/* Status Badges - Mobile Optimized */}
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
                  {/* 🔥 NUEVO: Badge de actividad reciente */}
                  {(community.members?.length || 0) > 5 && (
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg animate-pulse">
                      🔥 Trending
                    </span>
                  )}
                </div>
                
                {/* Title - Mobile Optimized */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 sm:mb-3 drop-shadow-lg leading-tight">
                  {community.name}
                </h1>
                
                {/* Description - Shorter for mobile */}
                <p className="text-sm sm:text-xl text-white/90 mb-3 sm:mb-4 max-w-3xl leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-3">
                  {community.description}
                </p>
                
                {/* 🎯 NUEVO: Stats Compactos con Psicología Social */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-white/90">
                  {/* Miembros con urgencia */}
                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold text-sm">{community.members?.length || 0}</span>
                    <span className="text-xs hidden sm:inline">
                      {(community.members?.length || 0) === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  
                  {/* 🕒 Tiempo de la comunidad (psicología de confianza) */}
                  {community.createdAt && (
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
                      <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {(() => {
                          const createdDate = new Date(community.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                                                     if (diffDays < 30) {
                             return `${diffDays} days ago`;
                           } else if (diffDays < 365) {
                             const months = Math.floor(diffDays / 30);
                             return `${months} month${months > 1 ? 's' : ''} ago`;
                           } else {
                             const years = Math.floor(diffDays / 365);
                             return `${years} year${years > 1 ? 's' : ''} ago`;
                           }
                         })()}
                       </span>
                    </div>
                  )}
                  
                  {/* 💰 Precio (psicología de valor) */}
                  {!community.isFree && community.price && (
                    <div className="flex items-center space-x-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-green-400/30">
                      <span className="text-green-300 font-bold text-sm">${community.price}/mes</span>
                    </div>
                  )}
                  
                  {/* 🆓 Comunidad gratuita */}
                  {community.isFree && (
                    <div className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-400/30">
                      <span className="text-blue-300 font-bold text-sm">FREE</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 🎯 CTA Mejorado con Urgencia */}
              <div className="w-full sm:w-auto sm:ml-8">
                {!isCreator && !isSubscribed && (
                  <div className="text-center sm:text-right">
                    {/* 🔥 Mensaje de urgencia (solo si hay suficientes miembros) */}
                    {(community.members?.length || 0) > 3 && (
                      <p className="text-white/80 text-xs mb-2 font-medium">
                        🔥 {Math.floor(Math.random() * 5) + 2} joined this week
                      </p>
                    )}
                    
                    <button
                      onClick={handleSubscribe}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover-lift text-base sm:text-lg group"
                    >
                      <span className="flex items-center justify-center">
                        Join now
                        <SparklesIcon className="w-4 h-4 ml-2 group-hover:animate-spin" />
                      </span>
                    </button>
                    
                    {/* 💝 Valor agregado */}
                    <p className="text-white/70 text-xs mt-2 font-medium">
                      ✨ Instant access to exclusive content
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* 🎯 NUEVO: Creator Spotlight (Prioridad alta) */}
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
                    View profile
                  </Link>
                </div>
              </div>
            )}

            {/* 🎯 Chat Grupal Card - Siempre Visible (FOMO Strategy) */}
            <div 
              className={`rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover-lift group relative ${
                hasAccess 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}
              onClick={handleChatClick}
            >
              {/* 🔒 Lock Overlay para usuarios no suscritos */}
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
                
                {/* 🎯 FOMO indicator para no suscritos */}
                {!hasAccess && (
                  <div className="mt-3 flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/60">Live now</span>
                  </div>
                )}
              </div>
            </div>

            {/* 🎯 NUEVO: Community Stats Modernos */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Community Stats
              </h3>
              
              <div className="space-y-4">
                {/* Miembros */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Members</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active community</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {community.members?.length || 0}
                    </div>
                  </div>
                </div>
                
                {/* Posts */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Posts</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total content</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {community.posts?.length || 0}
                    </div>
                  </div>
                </div>
                
                {/* Tiempo activo */}
                {community.createdAt && (
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Active since</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Community age</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {(() => {
                          const createdDate = new Date(community.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 30) {
                            return `${diffDays}d`;
                          } else if (diffDays < 365) {
                            const months = Math.floor(diffDays / 30);
                            return `${months}m`;
                          } else {
                            const years = Math.floor(diffDays / 365);
                            return `${years}y`;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 🎯 Botón para acceder al Creator Dashboard General */}
            {isCreator && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Creator Tools
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Manage your communities and payments
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/creator-dashboard')}
                    className="bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    Creator Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs - Mejorados */}
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
                {/* Create Post Form */}
                {user && hasAccess && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <CreatePostForm
                      communityId={id as string}
                      onPostCreated={() => {
                        setRefreshFeed(prev => prev + 1);
                      }}
                    />
                  </div>
                )}
                
                {/* Posts Feed */}
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
                        Exclusive content
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Join this community to access exclusive posts and connect with other members
                      </p>
                      <button
                        onClick={handleSubscribe}
                        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                      >
                        Join now
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
                        <MemberImage 
                          profilePicture={member.profilePicture}
                          name={member.name}
                          isCreator={member._id === community.creator?._id}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
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

      {/* Subscription Modal */}
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

      {/* Community Chat Modal */}
      <CommunityChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        communityId={id as string}
        communityName={community.name}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={isCancelSubscriptionModalOpen}
        onClose={() => setIsCancelSubscriptionModalOpen(false)}
        onConfirm={handleConfirmCancelSubscription}
        communityName={community.name}
      />

      {/* 🎯 Chat Tease Modal - FOMO Strategy */}
      {isChatTeaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header con gradiente */}
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
            
            {/* Body */}
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
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">⚡</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Get instant access to exclusive content</p>
                </div>
              </div>
              
              {/* FOMO Element */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 dark:text-red-400 font-semibold text-sm">LIVE NOW</span>
                </div>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  🔥 Don't miss out! {Math.floor(Math.random() * 3) + 2} people joined the conversation in the last hour
                </p>
              </div>
              
              {/* CTA Buttons */}
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
              
              {/* Value proposition */}
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                ✨ Join now and start chatting instantly
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}