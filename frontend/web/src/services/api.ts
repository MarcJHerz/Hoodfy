import axios from 'axios';

// Función para detectar automáticamente qué API usar según el dominio
const getApiUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: usar la variable por defecto
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
  }
  
  // Client-side: detectar según el dominio actual
  const currentDomain = window.location.hostname;
  
  if (currentDomain === 'hoodfy.com' || currentDomain === 'www.hoodfy.com') {
    return process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
  }
  
  // Para qahood.com o cualquier otro dominio
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
};

const API_URL = getApiUrl();

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
  // Lista de rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/api/users/public/',
    '/api/communities/public/',
    '/api/posts/public/',
    '/api/communities/public/created-by/',
    '/api/communities/public/joined-by/',
    '/api/posts/public/user/'
  ];
  
  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));
  
  // Solo agregar token si no es una ruta pública
  if (!isPublicRoute) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Si el data es FormData, eliminar el Content-Type para que el navegador lo configure automáticamente
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🚨 Error en interceptor de axios:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Lista de rutas públicas que NO deben redirigir a login
      const publicRoutes = [
        '/api/users/public/',
        '/api/communities/public/',
        '/api/posts/public/',
        '/api/communities/public/created-by/',
        '/api/communities/public/joined-by/',
        '/api/posts/public/user/'
      ];
      
      // Verificar si la URL que falló es una ruta pública
      const isPublicRoute = publicRoutes.some(route => 
        error.config?.url?.includes(route)
      );
      
      console.log('🔍 Verificando si es ruta pública:', {
        url: error.config?.url,
        isPublicRoute,
        publicRoutes
      });
      
      // Solo redirigir a login si NO es una ruta pública
      if (!isPublicRoute) {
        console.log('🔄 Redirigiendo a login...');
        // Token expirado, limpiar datos de autenticación
        localStorage.removeItem('token');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      } else {
        console.log('✅ Es ruta pública, no redirigiendo a login');
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
      throw new Error('There is already a login request in progress');
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
    // Debugging específico para iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      console.log('📱 iOS Safari - Configurando axios especial para FormData');
    }
    
    // Crear una instancia específica de axios para FormData
    // sin el Content-Type global que interfiere
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      timeout: isIOS && isSafari ? 180000 : 120000, // Timeout más largo para iOS Safari
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Forzar que axios NO establezca Content-Type automáticamente
      transformRequest: [(data, headers) => {
        if (data instanceof FormData) {
          // Remover Content-Type para que el navegador lo configure automáticamente
          delete headers['Content-Type'];
        }
        return data;
      }]
    });
    
    // Agregar solo el token de autorización
    const token = typeof window !== 'undefined' ? 
      localStorage.getItem('token') || 
      document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] : 
      null;
    
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return instance.post('/api/posts', formData, { headers });
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
    return api.get(`/api/communities/search?query=${encodeURIComponent(query)}`);
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
  getProfileById: (id: string) => api.get(`/api/users/profile/${id}`),
  updateProfile: (data: any) => api.put('/api/users/profile', data),
      uploadProfilePicture: (data: any) => api.put('/api/users/profile/photo', data),
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
  getAllies: () => api.get('/api/allies/my-allies'),
  getAllyOfUser: (userId: string) => api.get(`/api/allies/of/${userId}`),
  checkAlly: (targetUserId: string) => api.get(`/api/allies/check/${targetUserId}`),
  getJoinedCommunitiesWithMembers: (id: string) => api.get(`/api/communities/joined-by/${id}`),
};

// Subscriptions endpoints
export const subscriptions = {
  getAll: () => api.get('/api/subscriptions'),
  create: (data: any) => api.post('/api/subscriptions', data),
  delete: (id: string) => api.delete(`/api/subscriptions/${id}`),
  subscribe: (communityId: string, amount: number, paymentMethod: string) => {
    return api.post('/api/subscriptions/subscribe', { communityId, amount, paymentMethod });
  },
  getSubscribers: (communityId: string) => {
    return api.get(`/api/subscriptions/community/${communityId}/subscribers`);
  },
  getMySubscriptions: () => api.get('/api/subscriptions/my-subscriptions'),
  cancel: (subscriptionId: string) => api.post('/api/subscriptions/cancel', { subscriptionId }),
  cancelSubscription: (communityId: string) => api.post('/api/subscriptions/cancel', { communityId }),
  checkSubscription: (communityId: string) => api.get(`/api/subscriptions/check/${communityId}`),
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

// Notifications endpoints
export const notifications = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => 
    api.get('/api/notifications', { params }),
  getUnreadCount: () => 
    api.get('/api/notifications/unread-count'),
  getStats: () => 
    api.get('/api/notifications/stats'),
  markAsRead: (notificationId: string) => 
    api.put(`/api/notifications/${notificationId}/read`),
  markAllAsRead: () => 
    api.put('/api/notifications/mark-all-read'),
  delete: (notificationId: string) => 
    api.delete(`/api/notifications/${notificationId}`),
  deleteAll: () => 
    api.delete('/api/notifications/all'),
  create: (data: {
    userId: string;
    type: string;
    communityId?: string;
    postId?: string;
    subscriptionId?: string;
    commentId?: string;
    customData?: any;
  }) => 
    api.post('/api/notifications', data),
  cleanup: () => 
    api.post('/api/notifications/cleanup')
};

export default api; 