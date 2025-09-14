import axios from 'axios';

// Función para detectar automáticamente qué API usar según el dominio
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
  }
  
  const currentDomain = window.location.hostname;
  
  if (currentDomain === 'hoodfy.com' || currentDomain === 'www.hoodfy.com') {
    return process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
};

class PostService {
  private api;

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiUrl()}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar el token a las peticiones
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Obtener el feed del home
  async getHomeFeed(userId: string) {
    const response = await this.api.get(`/posts/home/${userId}`);
    return response.data;
  }

  // Obtener posts de un usuario
  async getUserPosts(userId: string) {
    const response = await this.api.get(`/posts/user/${userId}`);
    return response.data;
  }

  // Crear un nuevo post
  async createPost(data: FormData) {
    const response = await this.api.post('/posts', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Dar like a un post
  async likePost(postId: string) {
    const response = await this.api.post(`/posts/${postId}/like`);
    return response.data;
  }

  // Obtener comentarios de un post
  async getComments(postId: string) {
    const response = await this.api.get(`/api/comments/post/${postId}`);
    return response.data;
  }

  // Agregar un comentario
  async addComment(postId: string, content: string, parentCommentId?: string) {
    const response = await this.api.post(`/api/comments/${postId}`, {
      content,
      parentComment: parentCommentId
    });
    return response.data;
  }

  // Dar like a un comentario
  async likeComment(commentId: string) {
    const response = await this.api.post(`/api/comments/${commentId}/like`);
    return response.data;
  }

  // Quitar like de un comentario
  async unlikeComment(commentId: string) {
    const response = await this.api.post(`/api/comments/${commentId}/unlike`);
    return response.data;
  }

  // Eliminar un comentario
  async deleteComment(commentId: string) {
    const response = await this.api.delete(`/api/comments/${commentId}`);
    return response.data;
  }
}

export const postService = new PostService(); 