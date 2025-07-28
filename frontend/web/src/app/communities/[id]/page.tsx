'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  ShareIcon, 
  StarIcon,
  LockClosedIcon,
  EyeIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowRightIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useImageUrl } from '@/utils/useImageUrl';
import { useAuthStore } from '@/stores/authStore';

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

export default function PublicCommunityPage() {
  const { id } = useParams();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isChatTeaseModalOpen, setIsChatTeaseModalOpen] = useState(false);
  const { user } = useAuthStore();

  // Hook para manejar la cover image de la comunidad
  const coverImageKey = community?.coverImage || '';
  const { url: communityCoverImageUrl } = useImageUrl(coverImageKey);
  
  // Hook para manejar la imagen del perfil del creador
  const creatorProfilePictureKey = community?.creator?.profilePicture || '';
  const { url: creatorProfileImageUrl } = useImageUrl(creatorProfilePictureKey);

  useEffect(() => {
    loadCommunity();
  }, [id]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      // Usar la API pública (sin autenticación)
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://api.hoodfy.com' 
        : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/communities/${id}/public`);
      
      if (!response.ok) {
        throw new Error('Comunidad no encontrada');
      }
      
      const data = await response.json();
      setCommunity(data);
      
      // Simular conteo de vistas
      setViewCount(Math.floor(Math.random() * 1000) + 100);
    } catch (error: any) {
      console.error('Error al cargar la comunidad:', error);
      setError(error.message || 'Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      // Usar la URL pública específica
      const shareUrl = `${window.location.origin}/communities/${id}`;
      
      await navigator.share({
        title: community?.name,
        text: community?.description,
        url: shareUrl
      });
    } catch (error) {
      console.error('Error al compartir:', error);
      const shareUrl = `${window.location.origin}/communities/${id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Quitado de favoritos' : 'Agregado a favoritos');
  };

  const handleJoinNow = () => {
    if (user) {
      // Usuario registrado - ir a la página privada
      router.push(`/dashboard/communities/${id}`);
    } else {
      // Usuario no registrado - ir a registro
      router.push('/register');
    }
  };

  const handleChatClick = () => {
    setIsChatTeaseModalOpen(true);
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

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Comunidad privada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Esta comunidad es privada o no existe
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
        </div>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 w-full sm:w-auto">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
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
                  
                  {/* 🆓 Comunidad gratuita */}
                  {community.isFree && (
                    <div className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-blue-400/30">
                      <span className="text-blue-300 font-bold text-sm">FREE</span>
                    </div>
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

              {/* 🎯 CTA Mejorado con Urgencia */}
              <div className="w-full sm:w-auto sm:ml-8">
                <div className="text-center sm:text-right">
                  {/* 🔥 Mensaje de urgencia (solo si hay suficientes miembros) */}
                  {(community.members?.length || 0) > 3 && (
                    <p className="text-white/80 text-xs mb-2 font-medium">
                      🔥 {Math.floor(Math.random() * 5) + 2} se unieron esta semana
                    </p>
                  )}
                  
                  <button
                    onClick={handleJoinNow}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 hover-lift text-base sm:text-lg group"
                  >
                    <span className="flex items-center justify-center">
                      {user ? 'Acceder ahora' : 'Únete ahora'}
                      <SparklesIcon className="w-4 h-4 ml-2 group-hover:animate-spin" />
                    </span>
                  </button>
                  
                  {/* 💝 Valor agregado */}
                  <p className="text-white/70 text-xs mt-2 font-medium">
                    ✨ Acceso instantáneo al contenido exclusivo
                  </p>
                </div>
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
            {/* 🎯 Creator Spotlight */}
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

            {/* 🎯 Chat Grupal Card - FOMO Strategy */}
            <div 
              className="rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl transition-all duration-300 hover-lift group relative bg-gradient-to-br from-gray-500 to-gray-600"
              onClick={handleChatClick}
            >
              {/* 🔒 Lock Overlay para usuarios no suscritos */}
              <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <LockClosedIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors group-hover:scale-110 duration-300 bg-white/10 group-hover:bg-white/20">
                  <ChatBubbleLeftRightIcon className="w-8 h-8" />
                </div>
                
                <h3 className="text-lg font-bold mb-2">Chat en vivo</h3>
                <p className="text-white/80 text-sm mb-3">
                  Conecta con {community.members?.length || 0} miembros
                </p>
                
                <div className="text-xs text-white/60">
                  🔒 Únete para acceder
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Únete a la comunidad
              </h3>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {community.isFree ? 'Gratis' : `$${community.price}`}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {community.isFree ? 'Acceso completo' : 'por mes'}
                </p>
              </div>

              <button
                onClick={handleJoinNow}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
              >
                {user ? 'Acceder ahora' : 'Registrarse y unirse'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                Acceso inmediato a todo el contenido
              </p>
            </div>

            {/* Community Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                Estadísticas
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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Preview Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
                Vista previa del contenido
              </h2>
              
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LockClosedIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  Contenido exclusivo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Únete a esta comunidad para acceder a posts exclusivos, conectar con otros miembros y participar en conversaciones privadas.
                </p>
                <button
                  onClick={handleJoinNow}
                  className="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
                >
                  {user ? 'Acceder al contenido' : 'Registrarse y unirse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    handleJoinNow();
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