'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Post } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  HeartIcon as HeartOutline,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon as BookmarkOutline,
  EllipsisHorizontalIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
  MapPinIcon as MapPinIconSolid,
} from '@heroicons/react/24/solid';
import { posts } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import CommentsModal from '../CommentsModal';
import { useAuthStore } from '@/stores/authStore';
import { useImageUrl } from '@/utils/useImageUrl';
import { MediaGallery } from '../MediaGallery';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
  onPostUpdated: () => void;
  isCreator?: boolean;
  showPinOption?: boolean;
  showCommunity?: boolean;
  compact?: boolean;
}

export default function PostCard({ post, onPostUpdated, isCreator = false, showPinOption = false, showCommunity = false, compact = false }: PostCardProps) {
  const { user } = useAuthStore();
  const { url: authorImageUrl } = useImageUrl(post.author.profilePicture);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const router = useRouter();

  // Verificar if el post está destacado
  const isPinned = (post as any).isPinned || false;

  const handleLike = async () => {
    try {
      setIsLoading(true);
      if (isLiked) {
        await posts.unlikePost(post._id);
        setLikesCount(prev => prev - 1);
      } else {
        await posts.likePost(post._id);
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      onPostUpdated();
    } catch (error: any) {
      console.error('Error al dar like:', error);
      toast.error(error.response?.data?.message || 'Error al interactuar con el post');
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
    setIsCommentsModalOpen(true);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await posts.comment(post._id, { content: comment });
      setComment('');
      onPostUpdated();
    } catch (error) {
      console.error('Error al comentar:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      setIsPinning(true);
      await posts.togglePin(post._id);
      toast.success(isPinned ? 'Post quitado de destacados' : 'Post destacado exitosamente');
      setShowOptionsMenu(false);
      onPostUpdated();
    } catch (error: any) {
      console.error('Error al destacar/quitar destaque:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar estado de destaque');
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
      isPinned ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg' : ''
    }`}>
      {/* Badge de destacado */}
      {isPinned && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2">
          <div className="flex items-center space-x-2 text-white">
            <MapPinIconSolid className="w-4 h-4" />
            <span className="text-sm font-semibold">Post destacado por el creador</span>
            <StarIcon className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      )}

      {/* Header del post */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
        <div
            className="relative h-10 w-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-gray-200 dark:ring-gray-600"
          onClick={() => router.push(`/profile/${post.author._id}`)}
        >
            <Image
            src={authorImageUrl}
              alt={post.author.name}
              fill
              className="object-cover"
            />
        </div>
        <div className="cursor-pointer" onClick={() => router.push(`/profile/${post.author._id}`)}>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{post.author.name}</h3>
              {isPinned && (
                <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                  <MapPinIconSolid className="w-4 h-4" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
        </div>

        {/* Menú de opciones para creadores */}
        {isCreator && showPinOption && (
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
        )}
      </div>

      {/* Contenido del post */}
      <div className="px-4 pb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.content}</p>
        
        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="mt-4">
              <MediaGallery
                media={post.media}
                onImageClick={handleImageClick}
              />
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLoading}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              {isLiked ? (
                <HeartSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartOutline className="h-6 w-6" />
              )}
              <span className="font-medium">{likesCount}</span>
            </button>
            <button
              onClick={() => setIsCommentsModalOpen(true)}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <ChatBubbleLeftIcon className="h-6 w-6" />
              <span className="font-medium">{post.comments?.length || 0}</span>
            </button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors">
              <ShareIcon className="h-6 w-6" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 transition-colors"
          >
            {isSaved ? (
              <BookmarkSolid className="h-6 w-6 text-yellow-500" />
            ) : (
              <BookmarkOutline className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Modal de comentarios */}
      {user && (
        <CommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => setIsCommentsModalOpen(false)}
          post={post}
          currentUser={user}
          onPostUpdate={onPostUpdated}
        />
      )}
    </div>
  );
} 