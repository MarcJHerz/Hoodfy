import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Post } from '@/types/post';
import { User } from '@/types/user';
import { Comment } from '@/types/comment';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import Comments from './Comments';
import Image from 'next/image';
import { comments } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useImageUrl } from '@/utils/useImageUrl';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  currentUser: User | null;
  onPostUpdate: (updatedPost: Post) => void;
}

export default function CommentsModal({ 
  isOpen,
  onClose,
  post,
  currentUser,
  onPostUpdate 
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [localComments, setLocalComments] = useState(post?.comments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { url: currentMediaUrl } = useImageUrl(post?.media?.[currentMediaIndex]?.url);
  const { url: thumbnailUrl } = useImageUrl(post?.media?.[currentMediaIndex]?.thumbnail);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await comments.createComment(post._id, newComment);
      
      // Actualizar comentarios localmente inmediatamente
      const newCommentData: Comment = {
        _id: response.data._id,
        content: newComment,
        user: currentUser!,
        post: post._id,
        createdAt: new Date().toISOString(),
        likes: [],
        replies: []
      };
      
      setLocalComments(prev => [newCommentData, ...prev]);
      
      // También actualizar el post en el componente padre
      const updatedPost = {
        ...post,
        comments: [newCommentData, ...(post.comments || [])]
      };
      onPostUpdate(updatedPost);
      
      setNewComment('');
      toast.success('Comentario agregado exitosamente', {
        duration: 3000,
        icon: '💬',
      });
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      toast.error('Error al agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextMedia = () => {
    if (post?.media && currentMediaIndex < post.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  // Resetear índice cuando cambie el post
  React.useEffect(() => {
    setCurrentMediaIndex(0);
    setLocalComments(post?.comments || []);
  }, [post?._id, post?.comments]);

  // Si no hay post, no mostrar el modal
  if (!post) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog as="div" className="fixed inset-0 z-50 overflow-hidden" open={isOpen} onClose={onClose}>
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
              aria-hidden="true" 
            />

            {/* Modal */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.95,
                y: 20 
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0 
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95,
                y: 20 
              }}
              transition={{ 
                type: "spring",
                duration: 0.4,
                bounce: 0.1
              }}
              className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all bg-white dark:bg-gray-900 shadow-2xl rounded-2xl"
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex flex-col h-full" style={{ maxHeight: '90vh' }}>
                {/* Header mejorado con gradiente */}
                <div className="relative px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comentarios</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {localComments.length} {localComments.length === 1 ? 'comentario' : 'comentarios'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="flex-1 overflow-y-auto">
                  {/* Post content con padding mejorado */}
                  <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                    {post.author && (
                      <PostHeader author={post.author} createdAt={post.createdAt} />
                    )}
                    <PostContent content={post.content} />
                    
                    {/* Media Gallery MEJORADA - Tamaño original */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-6 relative">
                        <div className="flex justify-center">
                          {post.media[currentMediaIndex].type === 'image' ? (
                            <div className="relative rounded-xl overflow-hidden shadow-lg">
                              <Image
                                src={currentMediaUrl}
                                alt="Post content"
                                width={800}
                                height={600}
                                className="object-contain w-full h-auto max-h-[60vh] rounded-xl"
                                style={{ 
                                  width: 'auto', 
                                  height: 'auto', 
                                  maxWidth: '100%',
                                  maxHeight: '60vh'
                                }}
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="relative rounded-xl overflow-hidden shadow-lg">
                              <video
                                src={currentMediaUrl}
                                controls
                                className="w-full h-auto max-h-[60vh] rounded-xl"
                                poster={thumbnailUrl ? thumbnailUrl : undefined}
                                preload="metadata"
                                style={{ 
                                  width: 'auto', 
                                  height: 'auto', 
                                  maxWidth: '100%',
                                  maxHeight: '60vh'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Controles de navegación mejorados */}
                        {post.media.length > 1 && (
                          <>
                            {/* Botón anterior */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={handlePrevMedia}
                              disabled={currentMediaIndex === 0}
                              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-white rounded-full shadow-lg transition-all ${
                                currentMediaIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-gray-800'
                              }`}
                            >
                              <ChevronLeftIcon className="w-5 h-5" />
                            </motion.button>

                            {/* Botón siguiente */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={handleNextMedia}
                              disabled={currentMediaIndex === post.media.length - 1}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-white rounded-full shadow-lg transition-all ${
                                currentMediaIndex === post.media.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-gray-800'
                              }`}
                            >
                              <ChevronRightIcon className="w-5 h-5" />
                            </motion.button>

                            {/* Indicador de posición mejorado */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 dark:bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                              {currentMediaIndex + 1} / {post.media.length}
                            </div>

                            {/* Indicadores de puntos mejorados */}
                            <div className="flex justify-center mt-4 space-x-2">
                              {post.media.map((_, index) => (
                                <motion.button
                                  key={index}
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setCurrentMediaIndex(index)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                    index === currentMediaIndex 
                                      ? 'bg-blue-500 dark:bg-blue-400 shadow-lg' 
                                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Área de comentarios con diseño mejorado */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                    <Comments postId={post._id} postType={post.postType || 'general'} communityId={post.community?._id} />
                  </div>
                </div>

                {/* Input de comentario mejorado con animaciones */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <form onSubmit={handleSubmitComment} className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario increíble..."
                        disabled={isSubmitting}
                        className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
                      />
                      {newComment.trim() && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        'Enviar'
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 