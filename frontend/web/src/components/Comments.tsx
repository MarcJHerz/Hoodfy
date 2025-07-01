'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { comments } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatImageUrl } from '@/utils/imageUtils';

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
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

export default function Comments({ postId, postType, communityId }: CommentsProps) {
  const { user } = useAuthStore();
  const [commentsList, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      setError('Error al agregar el comentario');
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await comments.createComment(postId, replyContent, parentCommentId);
      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
      setError('Error al agregar la respuesta');
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
      setError('Error al procesar el like');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await comments.deleteComment(commentId);
      loadComments();
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      setError('Error al eliminar el comentario');
    }
  };

  const CommentItem = ({ comment, level = 0 }: { comment: Comment; level?: number }) => {
    const isLiked = comment.likes?.includes(user?._id || '') || false;
    const isAuthor = comment.user?._id === user?._id;
    const isReply = level > 0;

    return (
      <div className="relative mt-4">
        {/* Línea guía vertical para respuestas */}
        {isReply && (
          <div className="absolute left-0 top-0 h-full flex" style={{ width: '20px' }}>
            <div className="w-px bg-blue-200 dark:bg-blue-600 mx-auto h-full" />
          </div>
        )}
        <div className={`flex items-start space-x-3 ${isReply ? 'pl-6' : ''} w-full`}>
          <div className="flex-shrink-0">
            <Image
              src={formatImageUrl(comment.user?.profilePicture)}
              alt={comment.user?.name || 'Usuario'}
              width={40}
              height={40}
              className="rounded-full"
              sizes="(max-width: 40px) 100vw, 40px"
            />
          </div>
          <div className={`rounded-lg p-3 flex-1 ${isReply ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-gray-900 dark:text-white">{comment.user?.name || 'Usuario'}</div>
                <p className="text-gray-800 dark:text-gray-200 mt-1 break-words whitespace-pre-wrap">{comment.content}</p>
              </div>
              {isAuthor && (
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2 flex-shrink-0"
                >
                  ×
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: es,
              }) : 'Fecha no disponible'}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment._id)}
                className={`flex items-center space-x-1 ${
                  comment.likes?.includes(user?._id || '') 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                <span>{comment.likes?.length || 0}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill={comment.likes?.includes(user?._id || '') ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setReplyingTo(comment._id)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                Responder
              </button>
            </div>
            {replyingTo === comment._id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment._id)} className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Escribe tu respuesta..."
                  rows={2}
                  onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Responder
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {/* Renderizar respuestas */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-12">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 py-4">
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 dark:text-red-400 text-center">{error}</div>
      ) : commentsList.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No hay comentarios aún. ¡Sé el primero en comentar!</div>
      ) : (
        commentsList.map((comment) => (
          <CommentItem key={comment._id} comment={comment} />
        ))
      )}
    </div>
  );
} 