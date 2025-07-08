import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Post } from '@/types/post';
import { User } from '@/types/user';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import Comments from './Comments';
import Image from 'next/image';
import { comments } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useImageUrl } from '@/utils/useImageUrl';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  const [showComments, setShowComments] = useState(true);
  const { url: currentMediaUrl } = useImageUrl(post?.media?.[currentMediaIndex]?.url);
  const { url: thumbnailUrl } = useImageUrl(post?.media?.[currentMediaIndex]?.thumbnail);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    try {
      await comments.createComment(post._id, newComment);
      setNewComment('');
      // Recargar los comentarios
      const response = await comments.getPostComments(post._id);
      if (response.data) {
        onPostUpdate({
          ...post,
          comments: response.data
        });
      }
      toast.success('Comentario agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      toast.error('Error al agregar el comentario');
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
  }, [post?._id]);

  // Si no hay post, no mostrar el modal
  if (!post) {
    return null;
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-white dark:bg-gray-800 flex flex-col" style={{ maxHeight: '90vh', height: '90vh' }}>
                <div className="flex-1 overflow-y-auto">
                  {/* Header con botón de cierre */}
                  <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comentarios</h3>
                      <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none transition-colors"
                      >
                        <span className="sr-only">Cerrar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Contenido del post */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    {post.author && (
                      <PostHeader author={post.author} createdAt={post.createdAt} />
                    )}
                    <PostContent content={post.content} />
                    
                    {/* Media Gallery con navegación */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3 relative">
                        <div className="flex justify-center">
                          {post.media[currentMediaIndex].type === 'image' ? (
                          <Image
                              src={currentMediaUrl}
                            alt="Post content"
                              width={600}
                              height={400}
                              className="rounded-lg object-contain max-h-[50vh] w-auto max-w-full"
                              style={{ width: 'auto', height: 'auto', maxHeight: '50vh' }}
                            unoptimized
                          />
                        ) : (
                          <video
                              src={currentMediaUrl}
                            controls
                              className="rounded-lg max-h-[50vh] w-auto max-w-full"
                              poster={thumbnailUrl ? thumbnailUrl : undefined}
                            preload="metadata"
                              style={{ width: 'auto', height: 'auto', maxHeight: '50vh' }}
                            />
                          )}
                        </div>

                        {/* Controles de navegación para múltiples archivos */}
                        {post.media.length > 1 && (
                          <>
                            {/* Botón anterior */}
                            <button
                              onClick={handlePrevMedia}
                              disabled={currentMediaIndex === 0}
                              className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 dark:bg-black/70 text-white rounded-full transition-all ${
                                currentMediaIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/70 dark:hover:bg-black/90'
                              }`}
                            >
                              <ChevronLeftIcon className="w-5 h-5" />
                            </button>

                            {/* Botón siguiente */}
                            <button
                              onClick={handleNextMedia}
                              disabled={currentMediaIndex === post.media.length - 1}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 dark:bg-black/70 text-white rounded-full transition-all ${
                                currentMediaIndex === post.media.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/70 dark:hover:bg-black/90'
                              }`}
                            >
                              <ChevronRightIcon className="w-5 h-5" />
                            </button>

                            {/* Indicador de posición */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 dark:bg-black/80 text-white px-3 py-1 rounded-full text-sm">
                              {currentMediaIndex + 1} / {post.media.length}
                            </div>

                            {/* Indicadores de puntos */}
                            <div className="flex justify-center mt-3 space-x-2">
                              {post.media.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentMediaIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentMediaIndex 
                                      ? 'bg-blue-500 dark:bg-blue-400' 
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

                  {/* Área de comentarios */}
                  <div className="px-4 bg-white dark:bg-gray-800">
                    <Comments postId={post._id} postType={post.postType || 'general'} communityId={post.community?._id} />
                  </div>
                </div>

                {/* Input de comentario fijo en la parte inferior */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <form onSubmit={handleSubmitComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base md:text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 text-base md:text-lg transition-colors"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 