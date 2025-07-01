import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.87:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Variable para controlar las solicitudes de login
let loginRequestInProgress = false;

// Función para obtener el token desde múltiples fuentes
const getToken = () => {
  if (typeof window === 'undefined') return null;
  
  // Buscar en localStorage primero
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;
  
  // Buscar en cookies como respaldo
  const cookieToken = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  return cookieToken || null;
};

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      console.log('Token expirado, limpiando localStorage y cookies');
      
      // Limpiar todas las fuentes de token
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('communities-storage');
      localStorage.removeItem('posts-storage');
      
      // Limpiar cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Solo redirigir si no estamos ya en login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: async (token: string) => {
    if (loginRequestInProgress) {
      throw new Error('Ya hay una solicitud de login en progreso');
    }
    loginRequestInProgress = true;
    try {
      const response = await api.post('/api/auth/login', { token });
      return response;
    } finally {
      loginRequestInProgress = false;
    }
  },
  logout: async () => {
    return api.post('/api/auth/logout');
  },
  getProfile: () => api.get('/api/auth/me'),
};

// Posts endpoints
export const posts = {
  getAll: (params?: any) => api.get('/api/posts', { params }),
  getById: (id: string) => api.get(`/api/posts/${id}`),
  create: (data: any) => api.post('/api/posts', data),
  update: (id: string, data: any) => api.put(`/api/posts/${id}`, data),
  delete: (id: string) => api.delete(`/api/posts/${id}`),
  like: (id: string) => api.post(`/api/posts/${id}/like`),
  unlike: (id: string) => api.delete(`/api/posts/${id}/like`),
  comment: (id: string, data: any) => api.post(`/api/posts/${id}/comments`, data),
  getComments: (id: string) => api.get(`/api/posts/${id}/comments`),
  
  // Funciones adicionales que estaban siendo usadas
  getHomeFeed: (userId: string) => api.get(`/api/posts/home/${userId}`),
  getCommunityPosts: async (communityId: string, sort?: string) => {
    const params = sort ? { sort } : {};
    return api.get(`/api/posts/community/${communityId}`, { params });
  },
  getCommunityPostsFiltered: async (communityId: string, filter: 'creator' | 'community' = 'creator', page = 1, limit = 10) => {
    const params = { filter, page, limit };
    return api.get(`/api/posts/community/${communityId}/filtered`, { params });
  },
  createPost: async (formData: FormData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/api/posts', formData, config);
  },
  likePost: async (postId: string) => {
    return api.post(`/api/posts/${postId}/like`);
  },
  unlikePost: async (postId: string) => {
    return api.post(`/api/posts/${postId}/unlike`);
  },
  savePost: (postId: string) => api.post(`/api/posts/${postId}/save`),
  unsavePost: (postId: string) => api.post(`/api/posts/${postId}/unsave`),
  getUserPosts: (userId: string) => api.get(`/api/posts/user/${userId}`),
  togglePin: async (postId: string) => {
    return api.post(`/api/posts/${postId}/pin`);
  },
};

// Communities endpoints
export const communities = {
  getAll: (params?: any) => api.get('/api/communities', { params }),
  getById: (id: string) => api.get(`/api/communities/${id}`),
  create: (data: any) => api.post('/api/communities', data),
  update: (id: string, data: any) => api.put(`/api/communities/${id}`, data),
  delete: (id: string) => api.delete(`/api/communities/${id}`),
  subscribe: (communityId: string, amount: number, paymentMethod: string) => api.post('/api/subscriptions/subscribe', { communityId, amount, paymentMethod }),
  unsubscribe: (id: string) => api.delete(`/api/communities/${id}/subscribe`),
  getPosts: (id: string, params?: any) => api.get(`/api/communities/${id}/posts`, { params }),
  
  // Funciones adicionales que estaban siendo usadas
  getCreatedCommunities: (userId: string) => api.get(`/api/communities/created-by/${userId}`),
  getSubscribedCommunities: () => api.get('/api/subscriptions/my-subscriptions'),
  search: async (query: string) => {
    return api.get(`/api/communities/search?q=${encodeURIComponent(query)}`);
  },
  subscribeToCommunity: async (communityId: string, amount: number, paymentMethod: string) => {
    return api.post('/api/subscriptions/subscribe', { communityId, amount, paymentMethod });
  },
  getSubscribers: (communityId: string) => {
    return api.get(`/api/subscriptions/community/${communityId}/subscribers`);
  },
  updateCommunity: (id: string, data: any) => api.put(`/api/communities/${id}/update`, data),
};

// Users endpoints
export const users = {
  getProfile: () => api.get('/api/users/profile'),
  getProfileById: (id: string) => api.get(`/api/users/${id}`),
  updateProfile: (data: any) => api.put('/api/users/profile', data),
  uploadProfilePicture: (data: any) => api.post('/api/users/profile/picture', data),
  search: async (query: string) => {
    return api.get(`/api/users/search?query=${encodeURIComponent(query)}`);
  },
  getRecommended: () => api.get('/api/users/recommended'),
  
  // Funciones adicionales que estaban siendo usadas
  getProfileByIdOld: (id: string) => api.get(`/api/users/profile/${id}`),
  updateProfileOld: (formData: FormData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.put('/api/users/profile/update', formData, config);
  },
  updateProfilePhoto: (formData: FormData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.put('/api/users/profile/photo', formData, config);
  },
  getFollowers: (id: string) => api.get(`/api/users/${id}/followers`),
  getFollowing: (id: string) => api.get(`/api/users/${id}/following`),
  follow: (id: string) => api.post(`/api/users/${id}/follow`),
  unfollow: (id: string) => api.post(`/api/users/${id}/unfollow`),
  getCreatedCommunities: (id: string) => api.get(`/api/communities/created-by/${id}`),
  getJoinedCommunities: (id: string) => api.get(`/api/communities/joined-by/${id}`),
  getAllies: (id: string) => api.get(`/api/users/${id}/allies`),
  getJoinedCommunitiesWithMembers: (id: string) => api.get(`/api/communities/joined-by/${id}`),
};

// Subscriptions endpoints
export const subscriptions = {
  getAll: () => api.get('/api/subscriptions'),
  create: (data: any) => api.post('/api/subscriptions', data),
  delete: (id: string) => api.delete(`/api/subscriptions/${id}`),
  
  // Funciones adicionales que estaban siendo usadas
  subscribe: async (communityId: string, amount: number, paymentMethod: string) => {
    return api.post('/api/subscriptions/subscribe', { communityId, amount, paymentMethod });
  },
  getSubscribers: (communityId: string) => {
    return api.get(`/api/subscriptions/community/${communityId}/subscribers`);
  },
  getMySubscriptions: () => api.get('/api/subscriptions/my-subscriptions'),
};

// Comments endpoints
export const comments = {
  create: (data: any) => api.post('/api/comments', data),
  update: (id: string, data: any) => api.put(`/api/comments/${id}`, data),
  delete: (id: string) => api.delete(`/api/comments/${id}`),
  like: (id: string) => api.post(`/api/comments/${id}/like`),
  unlike: (id: string) => api.delete(`/api/comments/${id}/like`),
  
  // Funciones adicionales que estaban siendo usadas
  createComment: (postId: string, content: string, parentCommentId?: string) => 
    api.post(`/api/posts/${postId}/comments`, { content, parentCommentId }),
  getPostComments: (postId: string) => 
    api.get(`/api/posts/${postId}/comments`),
  deleteComment: (commentId: string) => 
    api.delete(`/api/comments/${commentId}`),
  likeComment: (commentId: string) => 
    api.post(`/api/comments/${commentId}/like`),
  unlikeComment: (commentId: string) => 
    api.delete(`/api/comments/${commentId}/like`)
};

export default api; 