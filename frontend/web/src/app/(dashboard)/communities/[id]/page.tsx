'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { communities, users } from '@/services/api';
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import CommunityFeed from '@/components/community/CommunityFeed';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import SubscriptionModal from '@/components/SubscriptionModal';
import { formatImageUrl } from '@/utils/imageUtils';
import { useAuthStore } from '@/stores/authStore';
import CommunityChatModal from '@/components/chat/CommunityChatModal';

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
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
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [communityChat, setCommunityChat] = useState<any | null>(null);
  const { user: authUser } = useAuthStore();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);

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

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const response = await communities.getById(id as string);
      console.log('Respuesta de getById:', response.data);
      setCommunity(response.data);
      
      // Simular conteo de vistas
      setViewCount(Math.floor(Math.random() * 1000) + 100);
      
      // Verificar si el usuario es el creador
      const currentUser = await users.getProfile();
      const userData = currentUser.data.user || currentUser.data;
      console.log('Datos del usuario actual:', userData);
      
      const isUserCreator = userData._id === response.data.creator?._id;
      console.log('Estado del usuario:', {
        userId: userData._id,
        creatorId: response.data.creator?._id,
        isCreator: isUserCreator
      });
      
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
      console.log('Datos del usuario cargados:', userData);
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
      return isSubscribedToCommunity;
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
      return false;
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: community?.name,
        text: community?.description,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error al compartir:', error);
      navigator.clipboard.writeText(window.location.href);
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
        <div className="h-80 w-full overflow-hidden">
          <Image
            src={formatImageUrl(community.coverImage)}
            alt={community.name}
            fill
            className="object-cover"
            priority
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
                <button
                  onClick={handleReport}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
            title="Reportar comunidad"
                >
                  <FlagIcon className="h-5 w-5" />
                </button>
                {authUser && community.creator?._id === authUser._id && (
                  <Link
                    href={`/communities/${community._id}/edit`}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 hover-lift"
              title="Editar comunidad"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
          )}
        </div>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  {isCreator && (
                    <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                      <StarIcon className="w-4 h-4 mr-2" />
                      Creador
                    </span>
                  )}
                  {isSubscribed && (
                    <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Suscrito
                    </span>
                  )}
                  {community.isPrivate && (
                    <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                      <LockClosedIcon className="w-4 h-4 mr-2" />
                      Privada
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                  {community.name}
                </h1>
                <p className="text-lg sm:text-xl text-white/90 mb-4 max-w-3xl leading-relaxed drop-shadow line-clamp-3">
                  {community.description}
                </p>
                
                {/* Stats */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-white/80">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-semibold">{community.members?.length || 0}</span>
                    <span className="text-sm sm:text-base">miembros</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-semibold">{viewCount}</span>
                    <span className="text-sm sm:text-base">vistas</span>
                  </div>
                  {community.createdAt && (
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Creada el {new Date(community.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                )}
              </div>
            </div>
              
              {/* Action Button */}
              <div className="ml-8">
            {!isCreator && !isSubscribed && (
              <button
                onClick={handleSubscribe}
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover-lift text-lg"
              >
                    Únete ahora
              </button>
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
            {/* Chat Grupal Card */}
            {hasAccess && (
              <div 
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover-lift group"
                onClick={() => setIsChatModalOpen(true)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Chat Grupal</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Conecta con todos los miembros de la comunidad
                  </p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium">
                    Abrir chat
                  </div>
                </div>
              </div>
            )}

            {/* Creator Card */}
            {community.creator && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Creador
                </h3>
                <Link
                  href={`/profile/${community.creator._id}`}
                  className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="relative">
                    <Image
                      src={formatImageUrl(community.creator.profilePicture)}
                      alt={community.creator.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-700 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                      <StarIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {community.creator.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fundador de la comunidad
                    </p>
                  </div>
                </Link>
            </div>
            )}

            {/* Members Count */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {community.members?.length || 0}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {community.members?.length === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === 'posts'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === 'about'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Acerca de
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Miembros
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
                        Contenido exclusivo
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                        Únete a esta comunidad para acceder a posts exclusivos y conectar con otros miembros
                      </p>
                      <button
                        onClick={handleSubscribe}
                        className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                      >
                        Únete ahora
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
                  Acerca de {community.name}
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
                      Creado por
                    </h3>
                    <Link
                      href={`/profile/${community.creator._id}`}
                      className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="relative">
                        <Image
                          src={formatImageUrl(community.creator.profilePicture)}
                          alt={community.creator.name}
                          width={64}
                          height={64}
                          className="rounded-xl object-cover ring-2 ring-primary-200 dark:ring-primary-700 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
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
                          Fundador de la comunidad
                        </p>
                        {community.createdAt && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Miembro desde {new Date(community.createdAt).toLocaleDateString('es-ES')}</p>
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
                    Miembros ({community.members?.length || 0})
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
                          src={formatImageUrl(member.profilePicture)}
                          alt={member.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
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
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                        {member._id === community.creator?._id && (
                            <span className="inline-block px-2 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full mt-1">
                              Creador
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
                      No hay miembros aún en esta comunidad
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
        price={0}
        benefits={['Acceso a contenido exclusivo', 'Participación en el chat grupal', 'Conexión con otros miembros']}
        rules={['Respetar a los miembros', 'No spam', 'Mantener conversaciones constructivas']}
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
    </div>
  );
}