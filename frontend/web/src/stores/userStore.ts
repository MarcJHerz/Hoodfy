import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { users } from '@/services/api';
import { User, UserProfile } from '@/types/user';

interface UserState {
  // Estado del usuario
  currentUser: User | null;
  userProfiles: Record<string, UserProfile>;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingUserProfiles: boolean;
  
  // Estados de error
  error: string | null;
  
  // Funciones para perfil
  loadCurrentUserProfile: () => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;
  updateProfile: (formData: FormData) => Promise<void>;
  updateProfilePhoto: (formData: FormData) => Promise<void>;
  
  // Funciones para relaciones
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowers: (userId: string) => Promise<any[]>;
  getFollowing: (userId: string) => Promise<any[]>;
  
  // Funciones para aliados
  getAllies: (userId: string) => Promise<any[]>;
  
  // Funciones de utilidad
  setCurrentUser: (user: User | null) => void;
  updateUserInStore: (userId: string, updates: Partial<UserProfile>) => void;
  clearError: () => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      userProfiles: {},
      isLoading: false,
      isLoadingProfile: false,
      isLoadingUserProfiles: false,
      error: null,

      // Cargar perfil del usuario actual
      loadCurrentUserProfile: async () => {
        set({ isLoadingProfile: true, error: null });
        try {
          const response = await users.getProfile();
          const userProfile = response.data;
          set({ 
            currentUser: userProfile,
            userProfiles: { 
              ...get().userProfiles, 
              [userProfile._id]: userProfile 
            },
            isLoadingProfile: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar el perfil', 
            isLoadingProfile: false 
          });
        }
      },

      // Cargar perfil de un usuario específico
      loadUserProfile: async (userId: string) => {
        set({ isLoadingUserProfiles: true, error: null });
        try {
          const response = await users.getProfileById(userId);
          const userProfile = response.data;
          set({ 
            userProfiles: { 
              ...get().userProfiles, 
              [userId]: userProfile 
            },
            isLoadingUserProfiles: false 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al cargar el perfil del usuario', 
            isLoadingUserProfiles: false 
          });
        }
      },

      // Actualizar perfil
      updateProfile: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await users.updateProfile(formData);
          const updatedProfile = response.data;
          
          // Actualizar en el store
          set({
            currentUser: updatedProfile,
            userProfiles: {
              ...get().userProfiles,
              [updatedProfile._id]: updatedProfile
            },
            isLoading: false
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al actualizar el perfil', 
            isLoading: false 
          });
        }
      },

      // Actualizar foto de perfil
      updateProfilePhoto: async (formData: FormData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await users.updateProfilePhoto(formData);
          const updatedProfile = response.data;
          
          // Actualizar en el store
          set({
            currentUser: updatedProfile,
            userProfiles: {
              ...get().userProfiles,
              [updatedProfile._id]: updatedProfile
            },
            isLoading: false
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Error al actualizar la foto de perfil', 
            isLoading: false 
          });
        }
      },

      // Seguir usuario
      followUser: async (userId: string) => {
        try {
          await users.follow(userId);
          // Actualizar estado de seguimiento en el perfil
          const currentProfiles = get().userProfiles;
          if (currentProfiles[userId]) {
            set({
              userProfiles: {
                ...currentProfiles,
                [userId]: {
                  ...currentProfiles[userId],
                  isFollowing: true,
                  followers: (currentProfiles[userId].followers || 0) + 1
                }
              }
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al seguir al usuario' });
        }
      },

      // Dejar de seguir usuario
      unfollowUser: async (userId: string) => {
        try {
          await users.unfollow(userId);
          // Actualizar estado de seguimiento en el perfil
          const currentProfiles = get().userProfiles;
          if (currentProfiles[userId]) {
            set({
              userProfiles: {
                ...currentProfiles,
                [userId]: {
                  ...currentProfiles[userId],
                  isFollowing: false,
                  followers: Math.max(0, (currentProfiles[userId].followers || 0) - 1)
                }
              }
            });
          }
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al dejar de seguir al usuario' });
        }
      },

      // Obtener seguidores
      getFollowers: async (userId: string) => {
        try {
          const response = await users.getFollowers(userId);
          return response.data || [];
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al cargar los seguidores' });
          return [];
        }
      },

      // Obtener seguidos
      getFollowing: async (userId: string) => {
        try {
          const response = await users.getFollowing(userId);
          return response.data || [];
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al cargar los seguidos' });
          return [];
        }
      },

      // Obtener aliados
      getAllies: async (userId: string) => {
        try {
          const response = await users.getAllies(userId);
          return response.data || [];
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Error al cargar los aliados' });
          return [];
        }
      },

      // Establecer usuario actual
      setCurrentUser: (user: User | null) => set({ currentUser: user }),

      // Actualizar usuario en el store
      updateUserInStore: (userId: string, updates: Partial<UserProfile>) => {
        const currentProfiles = get().userProfiles;
        if (currentProfiles[userId]) {
          set({
            userProfiles: {
              ...currentProfiles,
              [userId]: {
                ...currentProfiles[userId],
                ...updates
              }
            }
          });
        }
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Limpiar datos de usuario
      clearUserData: () => set({ 
        currentUser: null, 
        userProfiles: {} 
      }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        userProfiles: state.userProfiles
      }),
    }
  )
); 