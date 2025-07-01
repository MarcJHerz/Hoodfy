import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { posts, comments } from '@/services/api';
import { Post } from '@/types/post';
import { Comment } from '@/types/comment';

interface PostsState {
  // Estado de posts
  feedPosts: Post[];
  communityPosts: Record<string, Post[]>;
  userPosts: Record<string, Post[]>;
  currentPost: Post | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingFeed: boolean;
  isLoadingCommunity: boolean;
  isLoadingUser: boolean;
  
  // Estados de error
  error: string | null;
  
  // Funciones para posts
  loadHomeFeed: (userId: string) => Promise<void>;
  loadCommunityPosts: (communityId: string, sort?: string) => Promise<void>;
  loadUserPosts: (userId: string) => Promise<void>;
  loadPost: (postId: string) => Promise<void>;
  createPost: (formData: FormData) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  
  // Funciones para likes
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  
  // Funciones para guardar posts
  savePost: (postId: string) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  
  // Funciones para comentarios
  addComment: (postId: string, content: string, parentCommentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  
  // Funciones de utilidad
  updatePostInStore: (updatedPost: Post) => void;
  clearError: () => void;
  clearPosts: () => void;
}

export const usePostsStore = create<PostsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      feedPosts: [],
      communityPosts: {},
      userPosts: {},
      currentPost: null,
      isLoading: false,
      isLoadingFeed: false,
      isLoadingCommunity: false,
      isLoadingUser: false,
      error: null,

      // Cargar feed principal
      loadHomeFeed: async (userId: string) => {
        set({ isLoadingFeed: true, error: null });
        try {
          const response = await posts.getHomeFeed(userId);
          set({ feedPosts: response.data || [], isLoadingFeed: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar el feed', 
            isLoadingFeed: false 
          });
        }
      },

      // Cargar posts de comunidad
      loadCommunityPosts: async (communityId: string, sort?: string) => {
        set({ isLoadingCommunity: true, error: null });
        try {
          const response = await posts.getCommunityPosts(communityId, sort);
          const currentPosts = get().communityPosts;
          set({ 
            communityPosts: { 
              ...currentPosts, 
              [communityId]: response.data || [] 
            },
            isLoadingCommunity: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar posts de la comunidad', 
            isLoadingCommunity: false 
          });
        }
      },

      // Cargar posts de usuario
      loadUserPosts: async (userId: string) => {
        set({ isLoadingUser: true, error: null });
        try {
          const response = await posts.getUserPosts(userId);
          const currentPosts = get().userPosts;
          set({ 
            userPosts: { 
              ...currentPosts, 
              [userId]: response.data?.posts || [] 
            },
            isLoadingUser: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar posts del usuario', 
            isLoadingUser: false 
          });
        }
      },

      // Cargar post individual
      loadPost: async (postId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await posts.getById(postId);
          set({ currentPost: response.data, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar el post', 
            isLoading: false 
          });
        }
      },

      // Crear post
      createPost: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
          await posts.createPost(formData);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al crear el post', 
            isLoading: false 
          });
        }
      },

      // Eliminar post
      deletePost: async (postId: string) => {
        set({ isLoading: true, error: null });
        try {
          await posts.deletePost(postId);
          // Remover post de todos los arrays
          const { feedPosts, communityPosts, userPosts } = get();
          set({
            feedPosts: feedPosts.filter(p => p._id !== postId),
            communityPosts: Object.fromEntries(
              Object.entries(communityPosts).map(([key, posts]) => [
                key, 
                posts.filter(p => p._id !== postId)
              ])
            ),
            userPosts: Object.fromEntries(
              Object.entries(userPosts).map(([key, posts]) => [
                key, 
                posts.filter(p => p._id !== postId)
              ])
            ),
            isLoading: false
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al eliminar el post', 
            isLoading: false 
          });
        }
      },

      // Like post
      likePost: async (postId: string, userId: string) => {
        try {
          await posts.likePost(postId);
          // Crear post actualizado con el like
          const updatedPost: Post = {
            _id: postId,
            content: '',
            author: { _id: '', name: '', username: '' },
            likes: [userId],
            commentsCount: 0,
            postType: 'general',
            createdAt: new Date().toISOString(),
            isLiked: true
          };
          get().updatePostInStore(updatedPost);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al dar like' });
        }
      },

      // Unlike post
      unlikePost: async (postId: string, userId: string) => {
        try {
          await posts.unlikePost(postId);
          // Crear post actualizado sin el like
          const updatedPost: Post = {
            _id: postId,
            content: '',
            author: { _id: '', name: '', username: '' },
            likes: [],
            commentsCount: 0,
            postType: 'general',
            createdAt: new Date().toISOString(),
            isLiked: false
          };
          get().updatePostInStore(updatedPost);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al quitar like' });
        }
      },

      // Guardar post
      savePost: async (postId: string) => {
        try {
          await posts.savePost(postId);
          // Crear post actualizado como guardado
          const updatedPost: Post = {
            _id: postId,
            content: '',
            author: { _id: '', name: '', username: '' },
            likes: [],
            commentsCount: 0,
            postType: 'general',
            createdAt: new Date().toISOString(),
            isSaved: true
          };
          get().updatePostInStore(updatedPost);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al guardar el post' });
        }
      },

      // Quitar post guardado
      unsavePost: async (postId: string) => {
        try {
          await posts.unsavePost(postId);
          // Crear post actualizado como no guardado
          const updatedPost: Post = {
            _id: postId,
            content: '',
            author: { _id: '', name: '', username: '' },
            likes: [],
            commentsCount: 0,
            postType: 'general',
            createdAt: new Date().toISOString(),
            isSaved: false
          };
          get().updatePostInStore(updatedPost);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al quitar el post guardado' });
        }
      },

      // Agregar comentario
      addComment: async (postId: string, content: string, parentCommentId?: string) => {
        try {
          await comments.createComment(postId, content, parentCommentId);
          // Recargar comentarios del post actual
          if (get().currentPost?._id === postId) {
            const response = await comments.getPostComments(postId);
            get().updatePostInStore({
              ...get().currentPost!,
              comments: response.data
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al agregar comentario' });
        }
      },

      // Eliminar comentario
      deleteComment: async (commentId: string) => {
        try {
          await comments.deleteComment(commentId);
          // Actualizar comentarios en el post actual
          const currentPost = get().currentPost;
          if (currentPost) {
            const updatedComments = currentPost.comments?.filter(c => c._id !== commentId) || [];
            get().updatePostInStore({
              ...currentPost,
              comments: updatedComments
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al eliminar comentario' });
        }
      },

      // Like comentario
      likeComment: async (commentId: string) => {
        try {
          await comments.likeComment(commentId);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al dar like al comentario' });
        }
      },

      // Unlike comentario
      unlikeComment: async (commentId: string) => {
        try {
          await comments.unlikeComment(commentId);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al quitar like del comentario' });
        }
      },

      // Actualizar post en el store
      updatePostInStore: (updatedPost: Post) => {
        const { feedPosts, communityPosts, userPosts } = get();
        
        // Función helper para actualizar un post en un array
        const updatePostInArray = (posts: Post[], updatedPost: Post) => {
          return posts.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p);
        };
        
        // Actualizar en feed
        const updatedFeedPosts = updatePostInArray(feedPosts, updatedPost);
        
        // Actualizar en comunidades
        const updatedCommunityPosts = Object.fromEntries(
          Object.entries(communityPosts).map(([key, posts]) => [
            key,
            updatePostInArray(posts, updatedPost)
          ])
        );
        
        // Actualizar en posts de usuario
        const updatedUserPosts = Object.fromEntries(
          Object.entries(userPosts).map(([key, posts]) => [
            key,
            updatePostInArray(posts, updatedPost)
          ])
        );
        
        set({
          feedPosts: updatedFeedPosts,
          communityPosts: updatedCommunityPosts,
          userPosts: updatedUserPosts,
          currentPost: get().currentPost?._id === updatedPost._id ? { ...get().currentPost, ...updatedPost } : get().currentPost
        });
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Limpiar posts
      clearPosts: () => set({ 
        feedPosts: [], 
        communityPosts: {}, 
        userPosts: {}, 
        currentPost: null,
        isLoading: false,
        isLoadingFeed: false,
        isLoadingCommunity: false,
        isLoadingUser: false,
        error: null
      }),
    }),
    {
      name: 'posts-storage',
      partialize: (state) => ({ 
        feedPosts: state.feedPosts,
        communityPosts: state.communityPosts,
        userPosts: state.userPosts
      }),
    }
  )
); 