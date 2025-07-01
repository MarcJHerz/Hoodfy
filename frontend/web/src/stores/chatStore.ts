import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Message, ChatRoom } from '@/types/chat';
import { chatService } from '@/services/chatService';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentChat: null,
      messages: [],
      isLoading: false,
      error: null,
      chatRooms: [],
      chatRoomsLoading: false,
      connectionStatus: 'disconnected',
      typingUsers: [],

      // Acciones
      setCurrentChat: (chat) => {
        const { currentChat } = get();
        
        // Solo limpiar mensajes si cambiamos a un chat diferente
        if (!currentChat || currentChat.id !== chat.id) {
          set({ currentChat: chat, messages: [] });
        } else {
          // Si es el mismo chat, mantener los mensajes
          set({ currentChat: chat });
        }
      },

      addMessage: (message) => {
        const { messages, currentChat } = get();
        
        // Solo agregar si pertenece al chat actual
        if (currentChat && message.chatId === currentChat.id) {
          // Verificar si el mensaje ya existe para evitar duplicados
          const messageExists = messages.some(msg => msg.id === message.id);
          if (!messageExists) {
            set({ messages: [...messages, message] });
          }
        }
        
        // Actualizar el último mensaje en la lista de chats
        const { chatRooms } = get();
        const updatedRooms = chatRooms.map(room => 
          room.id === message.chatId 
            ? { ...room, lastMessage: message, updatedAt: new Date() }
            : room
        );
        set({ chatRooms: updatedRooms });
      },

      updateMessage: (messageId, updates) => {
        const { messages } = get();
        const updatedMessages = messages.map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
        set({ messages: updatedMessages });
      },

      deleteMessage: (messageId) => {
        const { messages } = get();
        const filteredMessages = messages.filter(msg => msg.id !== messageId);
        set({ messages: filteredMessages });
      },

      setMessages: (messages) => {
        // Filtrar mensajes duplicados basándose en ID y timestamp
        const uniqueMessages = messages.filter((message, index, self) => 
          index === self.findIndex(m => m.id === message.id)
        );
        set({ messages: uniqueMessages });
      },

      setChatRooms: (rooms) => set({ chatRooms: rooms }),

      addChatRoom: (room) => {
        const { chatRooms } = get();
        const existingRoom = chatRooms.find(r => r.id === room.id);
        if (!existingRoom) {
          set({ chatRooms: [...chatRooms, room] });
        }
      },

      updateChatRoom: (roomId, updates) => {
        const { chatRooms } = get();
        const updatedRooms = chatRooms.map(room =>
          room.id === roomId ? { ...room, ...updates } : room
        );
        set({ chatRooms: updatedRooms });
      },

      setTypingUsers: (users) => set({ typingUsers: users }),

      setConnectionStatus: (status) => set({ connectionStatus: status }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // Funciones de chat service
      sendMessage: async (messageData) => {
        try {
          set({ isLoading: true, error: null });
          const messageId = await chatService.sendMessage(messageData);
          set({ isLoading: false });
          return messageId;
        } catch (error: any) {
          set({ 
            isLoading: false, 
            error: error.message || 'Error al enviar mensaje' 
          });
          throw error;
        }
      },

      subscribeToMessages: (chatId) => {
        try {
          set({ connectionStatus: 'connecting' });
          const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
            set({ 
              messages, 
              connectionStatus: 'connected',
              error: null 
            });
          });

          return unsubscribe;
        } catch (error: any) {
          set({ 
            connectionStatus: 'disconnected',
            error: error.message || 'Error al suscribirse a mensajes'
          });
          return () => {};
        }
      },

      unsubscribeFromMessages: () => {
        set({ connectionStatus: 'disconnected' });
      },

      reset: () => set({
        currentChat: null,
        messages: [],
        isLoading: false,
        error: null,
        typingUsers: [],
        connectionStatus: 'disconnected',
      }),

      // Nuevas funciones para notificaciones
      getTotalUnreadCount: () => {
        const { chatRooms } = get();
        return chatRooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
      },

      markChatAsRead: (chatId) => {
        const { chatRooms } = get();
        const updatedRooms = chatRooms.map(room =>
          room.id === chatId ? { ...room, unreadCount: 0 } : room
        );
        set({ chatRooms: updatedRooms });
      },

      incrementUnreadCount: (chatId) => {
        const { chatRooms } = get();
        const updatedRooms = chatRooms.map(room =>
          room.id === chatId 
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
            : room
        );
        set({ chatRooms: updatedRooms });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chatRooms: state.chatRooms,
        currentChat: state.currentChat,
        messages: state.messages, // Persistir mensajes también
      }),
    }
  )
); 