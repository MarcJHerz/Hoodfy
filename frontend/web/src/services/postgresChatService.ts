import { Message, ChatRoom, CommunityChat, PrivateChat } from '@/types/chat';
import { User } from '@/types/user';
import { useChatStore } from '@/stores/chatStore';
import { Socket } from 'socket.io-client';
import { auth } from '@/config/firebase';

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';

class PostgresChatService {
  private socket: Socket | null = null;
  private chatStore: any = null;

  constructor() {
    // Inicializar el store cuando esté disponible
    this.initializeStore();
    // Limpiar datos antiguos del sistema Firebase
    this.clearOldChatData();
  }

  private async initializeStore() {
    // Importar dinámicamente para evitar problemas de SSR
    if (typeof window !== 'undefined') {
      try {
        const { useChatStore } = await import('@/stores/chatStore');
        this.chatStore = useChatStore.getState();
        console.log('✅ Chat store inicializado correctamente');
      } catch (error) {
        console.error('❌ Error inicializando chat store:', error);
      }
    }
  }

  private clearOldChatData() {
    // Limpiar datos del sistema Firebase anterior
    if (typeof window !== 'undefined') {
      try {
        // Limpiar localStorage de datos antiguos
        const keysToRemove = ['firebase-chat-data', 'chat-storage'];
        keysToRemove.forEach(key => {
          const item = localStorage.getItem(key);
          if (item) {
            console.log(`🧹 Limpiando datos antiguos: ${key}`);
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Error limpiando datos antiguos:', error);
      }
    }
  }

  // Métodos de autenticación
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const token = await auth.currentUser?.getIdToken();
      return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };
    } catch (error) {
      console.error('❌ Error obteniendo token de Firebase:', error);
      return {
        'Content-Type': 'application/json',
        'Authorization': '',
      };
    }
  }

  // Obtener chats del usuario
  async getUserChats(userId: string): Promise<ChatRoom[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformChatRooms(data.chats || []);
    } catch (error) {
      console.error('❌ Error obteniendo chats del usuario:', error);
      return [];
    }
  }

  // Obtener mensajes de un chat
  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformMessages(data.messages || []);
    } catch (error) {
      console.error('❌ Error obteniendo mensajes del chat:', error);
      return [];
    }
  }

  // Enviar mensaje
  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${messageData.chatId}/messages`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          content: messageData.content,
          content_type: messageData.type,
          sender_id: messageData.senderId,
          reply_to_id: messageData.replyTo?.id,
          metadata: {
            senderName: messageData.senderName,
            senderProfilePicture: messageData.senderProfilePicture,
            replyTo: messageData.replyTo,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.id?.toString() || '';
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  // Obtener o crear chat privado entre dos usuarios (como las grandes empresas)
  async getOrCreatePrivateChat(otherUserId: string): Promise<string> {
    try {
      // 🔧 ARREGLO: Obtener firebaseUid del usuario antes de crear chat
      const userResponse = await fetch(`${API_BASE_URL}/api/users/${otherUserId}`, {
        headers: await this.getAuthHeaders(),
      });
      
      if (!userResponse.ok) {
        throw new Error('Usuario no encontrado');
      }
      
      const userData = await userResponse.json();
      const otherUserFirebaseUid = userData.user.firebaseUid;
      
      if (!otherUserFirebaseUid) {
        throw new Error('Firebase UID del usuario no encontrado');
      }
      
      console.log(`🔧 Usando firebaseUid para chat: ${otherUserFirebaseUid} (MongoDB ID: ${otherUserId})`);
      
      const response = await fetch(`${API_BASE_URL}/api/chats/private/${otherUserFirebaseUid}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Chat privado ${data.isNew ? 'creado' : 'encontrado'}:`, data.chat.id);
      return data.chat.id.toString();
    } catch (error) {
      console.error('❌ Error obteniendo/creando chat privado:', error);
      throw error;
    }
  }

  // Crear chat privado (método legacy - mantener para compatibilidad)
  async createPrivateChat(name: string = 'Private chat'): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          name,
          type: 'private'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chat?.id?.toString() ?? data.chatId?.toString();
    } catch (error) {
      console.error('❌ Error creando chat privado:', error);
      throw error;
    }
  }

  // Crear chat de comunidad
  async createCommunityChat(communityId: string, name: string, participantIds: string[]): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({
          community_id: communityId,
          name,
          type: 'community'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chat?.id?.toString() ?? data.chatId?.toString();
    } catch (error) {
      console.error('❌ Error creando chat de comunidad:', error);
      throw error;
    }
  }

  // Obtener o crear chat de comunidad para el usuario actual
  async getOrCreateCommunityChat(communityId: string, communityName: string): Promise<{ id: string; name: string; type: 'community' } | null> {
    try {
      console.log(`🏘️ Obteniendo chat de comunidad: ${communityId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/chats/community/${communityId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.chat) {
        console.log(`✅ Chat de comunidad obtenido/creado: ${data.chat.id}`);
        return {
          id: data.chat.id.toString(),
          name: data.chat.name,
          type: 'community'
        };
      }
      
      throw new Error('No se pudo obtener el chat de la comunidad');
    } catch (error) {
      console.error('❌ Error obteniendo/creando chat de comunidad:', error);
      return null;
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  }

  // Añadir reacción a mensaje
  async addReaction(chatId: string, messageId: string, reactionType: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ reaction_type: reactionType }),
      });
    } catch (error) {
      console.error('❌ Error añadiendo reacción:', error);
    }
  }

  // Remover reacción de mensaje
  async removeReaction(chatId: string, messageId: string, reactionType: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages/${messageId}/reactions/${encodeURIComponent(reactionType)}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('❌ Error removiendo reacción:', error);
    }
  }

  // Unirse a un chat específico via Socket.io
  async joinChat(chatId: string) {
    if (this.socket && this.socket.connected) {
      console.log(`🔌 Uniéndose al chat ${chatId} via Socket.io`);
      this.socket.emit('join_chat', { chatId });
    } else {
      console.warn('⚠️ Socket no conectado, esperando conexión...');
      // Esperar a que se conecte
      return new Promise((resolve) => {
        if (this.socket) {
          this.socket.once('connect', () => {
            console.log(`🔌 Socket conectado, uniéndose al chat ${chatId}`);
            this.socket!.emit('join_chat', { chatId });
            resolve(undefined);
          });
        } else {
          resolve(undefined);
        }
      });
    }
  }

  // Conectar a Socket.io para tiempo real
  async connectToSocket(userId: string) {
    try {
      // Asegurar que el store esté inicializado
      if (!this.chatStore) {
        await this.initializeStore();
      }
      
      // 🔧 ARREGLO: Usar Firebase ID Token para Socket.io
      const firebaseIdToken = await auth.currentUser?.getIdToken();
      
      if (!firebaseIdToken) {
        throw new Error('No se pudo obtener Firebase ID Token');
      }
      
      console.log('🔧 Conectando Socket.io con Firebase ID Token');
      
      // Importar Socket.io dinámicamente
      import('socket.io-client').then(({ io }) => {
        this.socket = io(API_BASE_URL, {
          auth: {
            token: firebaseIdToken
          }
        });

        this.socket.on('connect', () => {
          console.log('✅ Conectado a Socket.io');
          if (this.socket) {
            this.socket.emit('join', { userId });
          }
          
          if (this.chatStore) {
            this.chatStore.setConnectionStatus('connected');
          }
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Desconectado de Socket.io');
          if (this.chatStore) {
            this.chatStore.setConnectionStatus('disconnected');
          }
        });

        this.socket.on('new_message', (message: any) => {
          console.log('📨 Nuevo mensaje recibido via Socket.io:', message);
          const transformedMessage = this.transformMessage(message);
          console.log('🔄 Mensaje transformado:', transformedMessage);
          if (this.chatStore) {
            console.log('✅ Agregando mensaje al store');
            this.chatStore.addMessage(transformedMessage);
          } else {
            console.error('❌ Chat store no disponible');
          }
        });

        this.socket.on('user_typing_start', (data: { userId: string, userName: string }) => {
          console.log('👀 Usuario escribiendo:', data);
          if (this.chatStore && data.userId !== userId) {
            const { typingUsers } = this.chatStore;
            if (!typingUsers.includes(data.userName)) {
              this.chatStore.setTypingUsers([...typingUsers, data.userName]);
            }
          }
        });

        this.socket.on('user_typing_stop', (data: { userId: string, userName?: string }) => {
          console.log('✋ Usuario dejó de escribir:', data);
          if (this.chatStore && data.userName) {
            const { typingUsers } = this.chatStore;
            this.chatStore.setTypingUsers(
              typingUsers.filter((name: string) => name !== data.userName)
            );
          }
        });

        this.socket.on('message_reaction', (data: { messageId: string; reactions: any[] }) => {
          if (this.chatStore) {
            const { messages } = this.chatStore;
            const updatedMessages = messages.map((msg: Message) => 
              msg.id === data.messageId 
                ? { ...msg, reactions: data.reactions }
                : msg
            );
            this.chatStore.setMessages(updatedMessages);
          }
        });

        // Listener para reacciones agregadas
        this.socket.on('reaction_added', (data: { messageId: number; reaction_type: string; userId: string; reaction: any }) => {
          console.log('📨 Reacción agregada recibida via Socket.io:', data);
          if (this.chatStore) {
            const { messages } = this.chatStore;
            const updatedMessages = messages.map((msg: Message) => {
              if (msg.id === data.messageId.toString()) {
                const existingReaction = msg.reactions?.find(r => r.emoji === data.reaction_type);
                if (existingReaction) {
                  // Actualizar reacción existente
                  const updatedReactions = msg.reactions?.map(r => 
                    r.emoji === data.reaction_type 
                      ? { ...r, users: [...r.users, data.userId], count: r.count + 1 }
                      : r
                  ) || [];
                  return { ...msg, reactions: updatedReactions };
                } else {
                  // Crear nueva reacción
                  const newReaction = {
                    emoji: data.reaction_type,
                    users: [data.userId],
                    count: 1
                  };
                  return { ...msg, reactions: [...(msg.reactions || []), newReaction] };
                }
              }
              return msg;
            });
            this.chatStore.setMessages(updatedMessages);
          }
        });

        // Listener para reacciones removidas
        this.socket.on('reaction_removed', (data: { messageId: number; reactionType: string; userId: string }) => {
          console.log('📨 Reacción removida recibida via Socket.io:', data);
          if (this.chatStore) {
            const { messages } = this.chatStore;
            const updatedMessages = messages.map((msg: Message) => {
              if (msg.id === data.messageId.toString()) {
                const updatedReactions = msg.reactions?.map(r => {
                  if (r.emoji === data.reactionType) {
                    const filteredUsers = r.users.filter(userId => userId !== data.userId);
                    return filteredUsers.length > 0 
                      ? { ...r, users: filteredUsers, count: filteredUsers.length }
                      : null;
                  }
                  return r;
                }).filter(Boolean) || [];
                return { ...msg, reactions: updatedReactions };
              }
              return msg;
            });
            this.chatStore.setMessages(updatedMessages);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error conectando a Socket.io:', error);
    }
  }

  // Desconectar de Socket.io
  disconnectFromSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Enviar indicador de escritura
  sendTypingIndicator(chatId: string, userId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, userId, isTyping });
    }
  }

  // Transformar datos del backend a tipos del frontend
  private transformChatRooms(data: any[]): ChatRoom[] {
    return data.map(chat => ({
      id: chat.id.toString(),
      name: chat.name || 'Chat sin nombre',
      type: chat.type || 'private',
      participants: chat.participant_ids || [],
      lastMessage: chat.last_message ? this.transformMessage(chat.last_message) : undefined,
      unreadCount: chat.unread_count || 0,
      updatedAt: new Date(chat.updated_at),
      createdAt: new Date(chat.created_at),
      ...(chat.type === 'community' && {
        communityId: chat.community_id,
        communityName: chat.community_name
      }),
      ...(chat.type === 'private' && {
        otherUserId: chat.other_user_id,
        otherUserName: chat.other_user_name,
        otherUserProfilePicture: chat.other_user_profile_picture
      })
    }));
  }

  private transformMessages(data: any[]): Message[] {
    return data.map(msg => this.transformMessage(msg));
  }

  private transformMessage(msg: any): Message {
    return {
      id: msg.id.toString(),
      chatId: msg.chat_id.toString(),
      content: msg.content,
      senderId: msg.sender_id,
      senderName: msg.sender_name || msg.senderName || 'Usuario',
      senderProfilePicture: msg.sender_profile_picture || msg.senderProfilePicture,
      timestamp: new Date(msg.created_at || msg.timestamp),
      type: msg.content_type || msg.type || 'text',
      mediaUrl: msg.media_url || msg.mediaUrl,
      mediaType: msg.media_type || msg.mediaType,
      mediaName: msg.media_name || msg.mediaName,
      isEdited: msg.is_edited || false,
      editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
      reactions: msg.reactions || [],
      replyTo: msg.reply_to ? {
        id: msg.reply_to.id.toString(),
        content: msg.reply_to.content,
        senderId: msg.reply_to.sender_id,
        senderName: msg.reply_to.sender_name,
        senderProfilePicture: msg.reply_to.sender_profile_picture,
        timestamp: new Date(msg.reply_to.timestamp),
        type: msg.reply_to.type || 'text'
      } : undefined,
      status: 'sent'
    };
  }
}

// Exportar instancia singleton
export const postgresChatService = new PostgresChatService();
export default postgresChatService;
