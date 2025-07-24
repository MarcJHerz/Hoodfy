'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { comments } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import { toast } from 'react-hot-toast';
import { UserAvatar } from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartIcon as HeartOutline, 
  ChatBubbleLeftIcon,
  TrashIcon,
  ArrowUturnLeftIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
    verified?: boolean; // ✅ FIXED: Añadir propiedad verified opcional
  };
  content: string;
  likes: string[];
  replies: Comment[];
  createdAt: string;
}

interface CommentsProps {
  postId: string;
  postType: 'general' | 'community';
  communityId?: string;
}

const Comments = React.memo(({ postId, postType, communityId }: CommentsProps) => {
  const { user } = useAuthStore();
  const [commentsList, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await comments.getPostComments(postId);
      console.log('Comentarios cargados:', response); // Debug
      setComments(response.data);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      setError('Error al cargar los comentarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await comments.createComment(postId, newComment);
      setNewComment('');
      loadComments();
      toast.success('Comentario agregado', { icon: '💬' });
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      toast.error('Error al agregar el comentario');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await comments.createComment(postId, replyContent, parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
      loadComments();
      toast.success('Respuesta agregada', { icon: '↩️' });
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
      toast.error('Error al agregar la respuesta');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const comment = commentsList.find(c => c._id === commentId);
      if (comment?.likes.includes(user?._id || '')) {
        await comments.unlikeComment(commentId);
      } else {
        await comments.likeComment(commentId);
      }
      loadComments();
    } catch (error) {
      console.error('Error al dar like:', error);
      toast.error('Error al procesar el like');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await comments.deleteComment(commentId);
      loadComments();
      toast.success('Comentario eliminado', { icon: '🗑️' });
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      toast.error('Error al eliminar el comentario');
    }
  };

  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const isLiked = comment.likes?.includes(user?._id || '') || false;
    const isAuthor = comment.user?._id === user?._id;
    const isReply = level > 0;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {/* Línea guía vertical para respuestas */}
        {isReply && (
          <div className="absolute left-0 top-0 h-full flex" style={{ width: '20px' }}>
            <div className="w-0.5 bg-gradient-to-b from-blue-200 to-purple-200 dark:from-blue-600 dark:to-purple-600 mx-auto h-full rounded-full" />
          </div>
        )}
        
        <div className={`flex items-start space-x-4 ${isReply ? 'pl-8' : ''} w-full group`}>
          <div className="flex-shrink-0">
            <Link href={`/profile/${comment.user._id}`} className="block">
              <div className="hover:scale-105 transition-transform duration-200">
                <UserAvatar
                  size={isReply ? 36 : 44}
                  source={comment.user?.profilePicture}
                  name={comment.user?.name || 'Usuario'}
                />
              </div>
            </Link>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Card del comentario */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className={`rounded-2xl p-4 transition-all duration-200 ${
                isReply 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30' 
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Link 
                      href={`/profile/${comment.user._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
                    >
                      {comment.user?.name || 'Usuario'}
                    </Link>
                    
                    {/* Badge verificado si aplica */}
                    {comment.user?.verified && (
                      <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-800 dark:text-gray-200 mt-2 break-words whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
                
                {/* Botón eliminar para el autor */}
                {isAuthor && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteComment(comment._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: es,
                }) : 'Fecha no disponible'}
              </div>
              
              {/* Acciones */}
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLikeComment(comment._id)}
                  className={`flex items-center space-x-2 transition-all duration-200 ${
                    isLiked 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                  }`}
                >
                  <div className={`p-1.5 rounded-full transition-all duration-200 ${
                    isLiked 
                      ? 'bg-red-50 dark:bg-red-900/20' 
                      : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}>
                    {isLiked ? (
                      <HeartSolid className="w-4 h-4 animate-bounce-gentle" />
                    ) : (
                      <HeartOutline className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{comment.likes?.length || 0}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setReplyingTo(comment._id)}
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200"
                >
                  <div className="p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
                    <ArrowUturnLeftIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Responder</span>
                </motion.button>
              </div>
              
              {/* Formulario de respuesta */}
              <AnimatePresence>
                {replyingTo === comment._id && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={(e) => handleSubmitReply(e, comment._id)} 
                    className="mt-4 space-y-3"
                  >
                    <div className="relative">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200"
                        placeholder="Escribe tu respuesta..."
                        rows={3}
                        disabled={isSubmittingReply}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!replyContent.trim() || isSubmittingReply}
                        className="px-6 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmittingReply ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          'Responder'
                        )}
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Renderizar respuestas */}
            <AnimatePresence>
              {comment.replies && comment.replies.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 space-y-4"
                >
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply._id} comment={reply} level={level + 1} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 py-6">
      {loading ? (
        <div className="flex justify-center py-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"
          />
        </div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            {error}
          </div>
        </motion.div>
      ) : commentsList.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
              <ChatBubbleLeftIcon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ¡Inicia la conversación!
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sé el primero en comentar este post
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {commentsList.map((comment, index) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <CommentItem comment={comment} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

Comments.displayName = 'Comments';

export default Comments;