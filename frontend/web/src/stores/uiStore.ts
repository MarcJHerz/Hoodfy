import { create } from 'zustand';

interface UIState {
  // Modales
  isCreatePostModalOpen: boolean;
  isCommentsModalOpen: boolean;
  isSearchModalOpen: boolean;
  isSubscriptionModalOpen: boolean;
  isMediaGalleryOpen: boolean;
  
  // Estados de carga globales
  isGlobalLoading: boolean;
  loadingMessage: string | null;
  
  // Notificaciones
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  
  // Estados de UI
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  mobileSidebarOpen: boolean;
  profileMenuOpen: boolean;
  
  // Funciones para modales
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  openCommentsModal: () => void;
  closeCommentsModal: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  openMediaGallery: () => void;
  closeMediaGallery: () => void;
  
  // Funciones para loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Funciones para notificaciones
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Funciones para estados de UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleProfileMenu: () => void;
  setProfileMenuOpen: (open: boolean) => void;
  
  // Función para limpiar todo
  resetUI: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Estado inicial
  isCreatePostModalOpen: false,
  isCommentsModalOpen: false,
  isSearchModalOpen: false,
  isSubscriptionModalOpen: false,
  isMediaGalleryOpen: false,
  isGlobalLoading: false,
  loadingMessage: null,
  notifications: [],
  sidebarOpen: false,
  mobileMenuOpen: false,
  mobileSidebarOpen: false,
  profileMenuOpen: false,

  // Funciones para modales
  openCreatePostModal: () => set({ isCreatePostModalOpen: true }),
  closeCreatePostModal: () => set({ isCreatePostModalOpen: false }),
  openCommentsModal: () => set({ isCommentsModalOpen: true }),
  closeCommentsModal: () => set({ isCommentsModalOpen: false }),
  openSearchModal: () => set({ isSearchModalOpen: true }),
  closeSearchModal: () => set({ isSearchModalOpen: false }),
  openSubscriptionModal: () => set({ isSubscriptionModalOpen: true }),
  closeSubscriptionModal: () => set({ isSubscriptionModalOpen: false }),
  openMediaGallery: () => set({ isMediaGalleryOpen: true }),
  closeMediaGallery: () => set({ isMediaGalleryOpen: false }),

  // Funciones para loading
  setGlobalLoading: (loading: boolean, message?: string) => 
    set({ isGlobalLoading: loading, loadingMessage: message || null }),

  // Funciones para notificaciones
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    set({ notifications: [...get().notifications, newNotification] });
    
    // Auto-remover notificación después del tiempo especificado
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },

  removeNotification: (id: string) => 
    set({ notifications: get().notifications.filter(n => n.id !== id) }),

  clearNotifications: () => set({ notifications: [] }),

  // Funciones para estados de UI
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set({ mobileMenuOpen: !get().mobileMenuOpen }),
  setMobileMenuOpen: (open: boolean) => set({ mobileMenuOpen: open }),
  toggleMobileSidebar: () => set({ mobileSidebarOpen: !get().mobileSidebarOpen }),
  setMobileSidebarOpen: (open: boolean) => set({ mobileSidebarOpen: open }),
  toggleProfileMenu: () => set({ profileMenuOpen: !get().profileMenuOpen }),
  setProfileMenuOpen: (open: boolean) => set({ profileMenuOpen: open }),

  // Función para limpiar todo
  resetUI: () => set({
    isCreatePostModalOpen: false,
    isCommentsModalOpen: false,
    isSearchModalOpen: false,
    isSubscriptionModalOpen: false,
    isMediaGalleryOpen: false,
    isGlobalLoading: false,
    loadingMessage: null,
    notifications: [],
    sidebarOpen: false,
    mobileMenuOpen: false,
    mobileSidebarOpen: false,
    profileMenuOpen: false,
  }),
})); 