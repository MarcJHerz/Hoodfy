import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { communities } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  members?: any[];
  creator?: any;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
}

interface Subscription {
  _id: string;
  communityId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  community?: Community;
}

interface CommunitiesState {
  // Estado de comunidades
  allCommunities: Community[];
  userCommunities: Community[];
  subscribedCommunities: Community[];
  currentCommunity: Community | null;
  
  // Estado de suscripciones
  subscriptions: Subscription[];
  subscribers: Record<string, any[]>;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingCommunities: boolean;
  isLoadingSubscriptions: boolean;
  isLoadingSubscribers: boolean;
  
  // Estados de error
  error: string | null;
  
  // Funciones para comunidades
  loadAllCommunities: () => Promise<void>;
  loadUserCommunities: (userId: string) => Promise<void>;
  loadSubscribedCommunities: () => Promise<void>;
  loadCommunity: (communityId: string) => Promise<void>;
  createCommunity: (data: { name: string; description: string; coverImage?: string }) => Promise<void>;
  updateCommunity: (communityId: string, data: any) => Promise<void>;
  searchCommunities: (query: string) => Promise<Community[]>;
  
  // Funciones para suscripciones
  subscribeToCommunity: (communityId: string, amount: number, paymentMethod: string) => Promise<void>;
  loadSubscribers: (communityId: string) => Promise<void>;
  checkSubscription: (communityId: string) => boolean;
  
  // Funciones de utilidad
  clearError: () => void;
  clearCommunities: () => void;
}

export const useCommunitiesStore = create<CommunitiesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      allCommunities: [],
      userCommunities: [],
      subscribedCommunities: [],
      currentCommunity: null,
      subscriptions: [],
      subscribers: {},
      isLoading: false,
      isLoadingCommunities: false,
      isLoadingSubscriptions: false,
      isLoadingSubscribers: false,
      error: null,

      // Cargar todas las comunidades
      loadAllCommunities: async () => {
        set({ isLoadingCommunities: true, error: null });
        try {
          const response = await communities.getAll();
          set({ allCommunities: response.data || [], isLoadingCommunities: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error loading communities', 
            isLoadingCommunities: false 
          });
        }
      },

      // Cargar comunidades del usuario
      loadUserCommunities: async (userId: string) => {
        set({ isLoadingCommunities: true, error: null });
        try {
          const response = await communities.getCreatedCommunities(userId);
          set({ userCommunities: response.data || [], isLoadingCommunities: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error loading user communities', 
            isLoadingCommunities: false 
          });
        }
      },

      // Cargar comunidades suscritas
      loadSubscribedCommunities: async () => {
        set({ isLoadingSubscriptions: true, error: null });
        try {
          const response = await communities.getSubscribedCommunities();
          
          // La respuesta del backend devuelve objetos de suscripción con community populada
          const subscriptions = response.data || [];
          
          // Verificar que las suscripciones pertenezcan al usuario actual
          const currentUser = useAuthStore.getState().user;
          if (!currentUser?._id) {
            set({ 
              subscribedCommunities: [],
              subscriptions: [],
              isLoadingSubscriptions: false 
            });
            return;
          }
          
          // Extraer las comunidades de las suscripciones activas
          const subscribedCommunitiesList = subscriptions
            .filter((sub: any) => {
              // Verificar que la suscripción tenga comunidad y esté activa
              const isValid = sub.community && sub.status === 'active';
              return isValid;
            })
            .map((sub: any) => {
              return sub.community;
            });
          
          set({ 
            subscribedCommunities: subscribedCommunitiesList, 
            subscriptions: subscriptions,
            isLoadingSubscriptions: false 
          });
          
        } catch (error: any) {
          console.error('❌ Error loading subscriptions:', error);
          set({ 
            subscribedCommunities: [],
            subscriptions: [],
            error: error.response?.data?.message || 'Error loading subscriptions', 
            isLoadingSubscriptions: false 
          });
        }
      },

      // Cargar comunidad individual
      loadCommunity: async (communityId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communities.getById(communityId);
          set({ currentCommunity: response.data, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error loading community', 
            isLoading: false 
          });
        }
      },

      // Crear comunidad
      createCommunity: async (data: { name: string; description: string; coverImage?: string }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communities.create(data);
          const newCommunity = response.data;
          set({ 
            allCommunities: [...get().allCommunities, newCommunity],
            userCommunities: [...get().userCommunities, newCommunity],
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error creating community', 
            isLoading: false 
          });
        }
      },

      // Actualizar comunidad
      updateCommunity: async (communityId: string, data: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communities.updateCommunity(communityId, data);
          const updatedCommunity = response.data;
          
          // Actualizar en todos los arrays
          const updateCommunityInArray = (communities: Community[]) => 
            communities.map(c => c._id === communityId ? updatedCommunity : c);
          
          set({
            allCommunities: updateCommunityInArray(get().allCommunities),
            userCommunities: updateCommunityInArray(get().userCommunities),
            subscribedCommunities: updateCommunityInArray(get().subscribedCommunities),
            currentCommunity: get().currentCommunity?._id === communityId ? updatedCommunity : get().currentCommunity,
            isLoading: false
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error updating community', 
            isLoading: false 
          });
        }
      },

      // Buscar comunidades
      searchCommunities: async (query: string) => {
        set({ isLoadingCommunities: true, error: null });
        try {
          const response = await communities.search(query);
          set({ allCommunities: response.data || [], isLoadingCommunities: false });
          return response.data || [];
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error searching communities', 
            isLoadingCommunities: false 
          });
          return [];
        }
      },

      // Suscribirse a comunidad
      subscribeToCommunity: async (communityId: string, amount: number, paymentMethod: string) => {
        set({ isLoadingSubscriptions: true, error: null });
        try {
          const response = await communities.subscribe(communityId, amount, paymentMethod);
          const newSubscription = response.data;
          
          set({
            subscriptions: [...get().subscriptions, newSubscription],
            isLoadingSubscriptions: false
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error subscribing to community', 
            isLoadingSubscriptions: false 
          });
        }
      },

      // Cargar suscriptores de una comunidad
      loadSubscribers: async (communityId: string) => {
        set({ isLoadingSubscribers: true, error: null });
        try {
          const response = await communities.getSubscribers(communityId);
          const currentSubscribers = get().subscribers;
          set({ 
            subscribers: { 
              ...currentSubscribers, 
              [communityId]: response.data || [] 
            },
            isLoadingSubscribers: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error loading subscribers', 
            isLoadingSubscribers: false 
          });
        }
      },

      // Verificar si el usuario está suscrito a una comunidad
      checkSubscription: (communityId: string) => {
        const { subscriptions } = get();
        
        const isSubscribed = subscriptions.some(sub => {
          const hasSubscription = sub.community?._id === communityId && sub.status === 'active';
          return hasSubscription;
        });
        
        return isSubscribed;
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Limpiar comunidades
      clearCommunities: () => {
        set({ 
          allCommunities: [], 
          userCommunities: [], 
          subscribedCommunities: [], 
          currentCommunity: null,
          subscriptions: [],
          subscribers: {},
          isLoading: false,
          isLoadingCommunities: false,
          isLoadingSubscriptions: false,
          isLoadingSubscribers: false,
          error: null
        });
      },
    }),
    {
      name: 'communities-storage',
      partialize: (state) => ({ 
        allCommunities: state.allCommunities,
        userCommunities: state.userCommunities,
        // No persistir subscribedCommunities ya que deben cargarse dinámicamente
        // subscribedCommunities: state.subscribedCommunities,
        subscriptions: state.subscriptions
      }),
    }
  )
); 