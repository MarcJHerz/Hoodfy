'use client';

import { useAuthStore } from '@/stores/authStore';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaHeart, FaRegHeart, FaComment, FaUsers } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { posts } from '@/services/api';
import Comments from '@/components/Comments';
import CommentsModal from '@/components/CommentsModal';
import { Post as PostType } from '@/types/post';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { formatImageUrl } from '@/utils/imageUtils';
import PostCard from '@/components/PostCard';
import LoadingScreen, { PostSkeleton } from '@/components/LoadingScreen';
import { useImageUrl } from '@/utils/useImageUrl';
import { 
  PlusIcon, 
  UsersIcon, 
  ChatBubbleLeftIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/UserAvatar';
import QuickActionsBar from '@/components/QuickActionsBar';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { url: userImageUrl } = useImageUrl(user?.profilePicture);
  const [feedPosts, setFeedPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await posts.getHomeFeed(user?._id || '');
      
      if (response?.data) {
        setFeedPosts(response.data);
      } else {
        setFeedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Error al cargar los posts');
      setFeedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setIsCreatePostModalOpen(true);
    }
  }, []);

  const handleCreatePost = useCallback(() => {
    setSelectedFiles([]);
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      const post = feedPosts.find(p => p._id === postId);
      if (!post) return;

      if (post.likes.includes(user?._id || '')) {
        await posts.unlikePost(postId);
        post.likes = post.likes.filter(id => id !== user?._id);
      } else {
        await posts.likePost(postId);
        post.likes.push(user?._id || '');
      }

      setFeedPosts([...feedPosts]);
    } catch (error) {
      console.error('Error al dar like:', error);
      toast.error('Error al dar like al post');
    }
  }, [feedPosts, user?._id]);

  const handleCommentClick = useCallback((post: PostType) => {
    console.log('Comment icon clicked for post:', post._id);
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  }, []);

  const handlePostUpdate = useCallback((updatedPost: PostType) => {
    setFeedPosts(prevPosts => 
      prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
  }, []);

  if (loading && feedPosts.length === 0) {
    return <LoadingScreen message="Cargando tu feed personalizado..." variant="default" />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Oops, algo salió mal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchPosts}
            className="btn-primary btn-md"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Enlaces rápidos mejorados */}
      <QuickActionsBar />

      {/* Botón para crear post */}
      <div className="card p-6 mb-6 hover-lift">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <UserAvatar
              size={40}
              source={user?.profilePicture}
              name={user?.name || 'Usuario'}
            />
          </div>
          <div className="flex-1">
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 font-medium"
            >
              ¿Qué estás pensando, {user?.name}?
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
            >
              <PhotoIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Foto</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-all duration-200"
            >
              <VideoCameraIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="btn-primary btn-sm"
          >
            Publicar
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.avi,.m4v,.3gp,.heic,.heif"
          multiple
          className="hidden"
        />
      </div>

      {/* Lista de posts */}
      {feedPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ¡Tu feed está vacío!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sé el primero en compartir algo increíble con tu comunidad
          </p>
          <button 
            onClick={() => setIsCreatePostModalOpen(true)}
            className="btn-primary btn-md"
          >
            Crear mi primer post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {feedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onCommentClick={handleCommentClick}
              onPostUpdate={handlePostUpdate}
              showCommunity={true}
            />
          ))}
          
          {/* Mostrar skeletons mientras carga más contenido */}
          {loading && (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}
        </div>
      )}

      {/* Modal de comentarios */}
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        post={selectedPost}
        currentUser={user}
        onPostUpdate={handlePostUpdate}
      />

      {/* Modal de creación de post */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handleCreatePost}
        initialFiles={selectedFiles}
      />
    </div>
  );
} 