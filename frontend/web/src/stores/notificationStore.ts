import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notifications as notificationsApi } from '@/services/api';

export interface Notification {
  _id: string;
  user: string;
  type: 'subscription_success' | 'new_post' | 'new_comment' | 'subscription_expiring' | 'payment_failed' | 'payment_success' | 'subscription_canceled' | 'community_update';
  title: string;
  message: string;
  read: boolean;
  metadata: {
    communityId?: string;
    postId?: string;
    subscriptionId?: string;
    commentId?: string;
    daysUntilExpiration?: number;
    amount?: number;
    actionUrl?: string;
  };
  createdAt: string;
  expiresAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  newNotifications: Notification[]; // Para toasts
  
  // Actions
  fetchNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
  clearNotifications: () => void;
  addNewNotification: (notification: Notification) => void;
  clearNewNotifications: () => void;
  
  // Utility functions
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
  shouldRefresh: () => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetch: null,
      newNotifications: [],

      // Obtener notificaciones
      fetchNotifications: async (params = {}) => {
        const { page = 1, limit = 20, unreadOnly = false } = params;
        
        set({ isLoading: true, error: null });
        try {
          const response = await notificationsApi.getAll({ page, limit, unreadOnly });
          const { notifications, pagination } = response.data;
          
          // Si es la primera página, reemplazar. Si no, agregar a las existentes
          const currentNotifications = get().notifications;
          const updatedNotifications = page === 1 
            ? notifications 
            : [...currentNotifications, ...notifications];
          
          set({ 
            notifications: updatedNotifications,
            isLoading: false,
            lastFetch: Date.now()
          });
          
          // También actualizar el conteo de no leídas
          await get().fetchUnreadCount();
          
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          set({ 
            error: error.response?.data?.error || 'Error obteniendo notificaciones',
            isLoading: false 
          });
        }
      },

      // Obtener conteo de no leídas
      fetchUnreadCount: async () => {
        try {
          const response = await notificationsApi.getUnreadCount();
          set({ unreadCount: response.data.unreadCount });
        } catch (error: any) {
          console.error('Error fetching unread count:', error);
          // No establecer error aquí para no interferir con la UI
        }
      },

      // Marcar como leída
      markAsRead: async (notificationId: string) => {
        try {
          await notificationsApi.markAsRead(notificationId);
          
          // Actualizar estado local
          const notifications = get().notifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          );
          
          // Recalcular conteo de no leídas
          const unreadCount = notifications.filter(n => !n.read).length;
          
          set({ notifications, unreadCount });
          
        } catch (error: any) {
          console.error('Error marking notification as read:', error);
          set({ error: error.response?.data?.error || 'Error marcando notificación como leída' });
        }
      },

      // Marcar todas como leídas
      markAllAsRead: async () => {
        try {
          await notificationsApi.markAllAsRead();
          
          // Actualizar estado local
          const notifications = get().notifications.map(notification => 
            ({ ...notification, read: true })
          );
          
          set({ notifications, unreadCount: 0 });
          
        } catch (error: any) {
          console.error('Error marking all notifications as read:', error);
          set({ error: error.response?.data?.error || 'Error marcando todas las notificaciones como leídas' });
        }
      },

      // Eliminar notificación
      deleteNotification: async (notificationId: string) => {
        try {
          await notificationsApi.delete(notificationId);
          
          // Actualizar estado local
          const notifications = get().notifications.filter(
            notification => notification._id !== notificationId
          );
          
          // Recalcular conteo de no leídas
          const unreadCount = notifications.filter(n => !n.read).length;
          
          set({ notifications, unreadCount });
          
        } catch (error: any) {
          console.error('Error deleting notification:', error);
          set({ error: error.response?.data?.error || 'Error eliminando notificación' });
        }
      },

      // Eliminar todas las notificaciones
      deleteAllNotifications: async () => {
        try {
          await notificationsApi.deleteAll();
          
          set({ notifications: [], unreadCount: 0 });
          
        } catch (error: any) {
          console.error('Error deleting all notifications:', error);
          set({ error: error.response?.data?.error || 'Error eliminando notificaciones' });
        }
      },

      // Agregar notificación (para notificaciones en tiempo real)
      addNotification: (notification: Notification) => {
        const notifications = [notification, ...get().notifications];
        const unreadCount = notifications.filter(n => !n.read).length;
        
        set({ notifications, unreadCount });
      },

      // Limpiar error
      clearError: () => set({ error: null }),

      // Limpiar notificaciones (para logout)
      clearNotifications: () => set({ 
        notifications: [], 
        unreadCount: 0, 
        error: null, 
        lastFetch: null 
      }),

      // Agregar nueva notificación (para toasts)
      addNewNotification: (notification: Notification) => {
        set(state => ({
          newNotifications: [notification, ...state.newNotifications],
          notifications: [notification, ...state.notifications],
          unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount
        }));
      },

      // Limpiar nuevas notificaciones (después de mostrar toasts)
      clearNewNotifications: () => {
        set({ newNotifications: [] });
      },

      // Funciones utilitarias
      getUnreadNotifications: () => 
        get().notifications.filter(notification => !notification.read),

      getNotificationsByType: (type: Notification['type']) =>
        get().notifications.filter(notification => notification.type === type),

      // Verificar si necesita refrescar (5 minutos)
      shouldRefresh: () => {
        const lastFetch = get().lastFetch;
        if (!lastFetch) return true;
        return Date.now() - lastFetch > 5 * 60 * 1000; // 5 minutos
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        lastFetch: state.lastFetch
      }),
    }
  )
);

// Hook personalizado para notificaciones no leídas
export const useUnreadNotifications = () => {
  const store = useNotificationStore();
  return {
    unreadCount: store.unreadCount,
    unreadNotifications: store.getUnreadNotifications(),
    fetchUnreadCount: store.fetchUnreadCount,
    shouldRefresh: store.shouldRefresh()
  };
};

// Hook personalizado para notificaciones por tipo
export const useNotificationsByType = (type: Notification['type']) => {
  const store = useNotificationStore();
  return store.getNotificationsByType(type);
}; 