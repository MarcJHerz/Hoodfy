'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  HeartIcon as HeartOutline, 
  ChatBubbleLeftIcon, 
  ShareIcon,
  BookmarkIcon as BookmarkOutline,
  EllipsisHorizontalIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
  MapPinIcon as MapPinIconSolid
} from '@heroicons/react/24/solid';
import { Post } from '@/types/post';
import { useImageUrl } from '@/utils/useImageUrl';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'react-hot-toast';
import { posts } from '@/services/api';
import { MediaGallery } from './MediaGallery';

interface PostCardProps {
  post: Post;
  onCommentClick?: (post: Post) => void;
  onPostUpdate?: (post: Post) => void;
  showCommunity?: boolean;
  compact?: boolean;
  isCreator?: boolean;
  showPinOption?: boolean;
}

export default function PostCard({ 
  post,
  onCommentClick, 
  onPostUpdate,
  showCommunity = false,
  compact = false,
  isCreator = false,
  showPinOption = false
}: PostCardProps) {
  const { user } = useAuthStore();
  const { url: authorImageUrl } = useImageUrl(post.author.profilePicture);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isSaved, setIsSaved] = useState(false); // TODO: Implementar saved posts
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  
  // Verificar si el post está destacado
  const isPinned = (post as any).isPinned || false;

  const handleLike = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    const optimisticLiked = !isLiked;
    const optimisticCount = optimisticLiked ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(optimisticLiked);
    setLikesCount(optimisticCount);

    try {
      if (isLiked) {
        await posts.unlikePost(post._id);
        toast.success('Post eliminado de favoritos', {
          icon: '💔',
          duration: 2000,
        });
      } else {
        await posts.likePost(post._id);
        toast.success('Post agregado a favoritos', {
          icon: '❤️',
          duration: 2000,
        });
      }

      // Actualizar el post en el componente padre si es necesario
      if (onPostUpdate) {
        const updatedPost = {
          ...post,
          likes: optimisticLiked 
            ? [...(post.likes || []), user._id] 
            : (post.likes || []).filter(id => id !== user._id)
        };
        onPostUpdate(updatedPost);
      }
    } catch (error) {
      // Revertir optimistic update en caso de error
      setIsLiked(!optimisticLiked);
      setLikesCount(optimisticLiked ? likesCount - 1 : likesCount + 1);
      
      console.error('Error al dar like:', error);
      toast.error('Error al procesar like');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // TODO: Implementar funcionalidad de guardar posts
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Post eliminado de guardados' : 'Post guardado');
  };

  // Handler para cuando se hace click en una imagen del MediaGallery
  const handleImageClick = (index: number) => {
    // Abrir modal de comentarios cuando se hace click en una imagen
    if (onCommentClick) {
      onCommentClick(post);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsPinning(true);
      await posts.togglePin(post._id);
      toast.success(isPinned ? 'Post quitado de destacados' : 'Post destacado exitosamente');
      setShowOptionsMenu(false);
      
      // Actualizar el post en el componente padre
      if (onPostUpdate) {
        const updatedPost = {
          ...post,
          isPinned: !isPinned
        };
        onPostUpdate(updatedPost);
      }
    } catch (error: any) {
      console.error('Error al destacar/quitar destaque:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar estado de destaque');
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <article className={`card-hover group ${compact ? 'p-4' : 'p-6'} animate-slide-up ${
      isPinned ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg' : ''
    }`}>
      {/* Badge de destacado */}
      {isPinned && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 -m-6 mb-4">
          <div className="flex items-center space-x-2 text-white">
            <MapPinIconSolid className="w-4 h-4" />
            <span className="text-sm font-semibold">Post destacado por el creador</span>
            <StarIcon className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Header del post */}
      <header className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link 
            href={`/profile/${post.author._id}`}
            className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
          >
        <Image
          src={authorImageUrl}
          alt={post.author.name}
              width={compact ? 32 : 40}
              height={compact ? 32 : 40}
              className="rounded-full ring-2 ring-transparent group-hover:ring-primary-200 transition-all duration-200"
          unoptimized
        />
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link 
                href={`/profile/${post.author._id}`}
                className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 truncate"
              >
                {post.author.name}
              </Link>
              
              {/* Badge de pin en el nombre */}
              {isPinned && (
                <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                  <MapPinIconSolid className="w-4 h-4" />
                </div>
              )}
              
              {/* Badge verificado (si aplica) */}
              {post.author.verified && (
                <div className="flex-shrink-0">
                  <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={post.createdAt}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
              </time>
              
              {/* Mostrar comunidad si está habilitado */}
              {showCommunity && post.community && (
                <>
                  <span>•</span>
                  <Link 
                    href={`/communities/${post.community._id}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  >
                    {post.community.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menú de opciones para creadores */}
        {isCreator && showPinOption ? (
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Dropdown del menú */}
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={handleTogglePin}
                  disabled={isPinning}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {isPinning ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent" />
                  ) : isPinned ? (
                    <MapPinIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <MapPinIconSolid className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isPinned ? 'Quitar destaque' : 'Destacar post'}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
        <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 opacity-0 group-hover:opacity-100">
          <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
        </button>
        )}
      </header>

      {/* Contenido del post */}
      <div className="mb-4">
        {post.content && (
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
            {post.content}
          </p>
        )}

        {/* Media Gallery */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            <MediaGallery 
              media={post.media} 
              onImageClick={handleImageClick}
            />
        </div>
        )}
      </div>

      {/* Footer con acciones */}
      <footer className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={`group/like flex items-center space-x-2 transition-all duration-200 ${
              isLiked 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-red-500'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className={`p-2 rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-red-50 dark:bg-red-900/20' 
                : 'hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}>
              {isLiked ? (
                <HeartSolid className="w-5 h-5 animate-bounce-gentle" />
              ) : (
                <HeartOutline className="w-5 h-5 group-hover/like:scale-110 transition-transform duration-200" />
                )}
              </div>
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          {/* Comment button */}
          <button
            onClick={() => onCommentClick?.(post)}
            className="group/comment flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-200"
          >
            <div className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
              <ChatBubbleLeftIcon className="w-5 h-5 group-hover/comment:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </button>

          {/* Share button */}
          <button className="group/share flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-all duration-200">
            <div className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200">
              <ShareIcon className="w-5 h-5 group-hover/share:scale-110 transition-transform duration-200" />
            </div>
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`group/save p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
              : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
          }`}
        >
          {isSaved ? (
            <BookmarkSolid className="w-5 h-5" />
          ) : (
            <BookmarkOutline className="w-5 h-5 group-hover/save:scale-110 transition-transform duration-200" />
          )}
        </button>
      </footer>
    </article>
  );
}

// Componente Skeleton para loading states
export function PostSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`card ${compact ? 'p-4' : 'p-6'} animate-pulse`}>
      {/* Header skeleton */}
      <div className="flex items-start space-x-3 mb-4">
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-200 dark:bg-gray-700 rounded-full skeleton`}></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded skeleton w-1/3"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton w-3/4"></div>
      </div>

      {/* Media skeleton (opcional) */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg skeleton mb-4"></div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
            <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
            <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded skeleton"></div>
          </div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
      </div>
    </div>
  );
} 