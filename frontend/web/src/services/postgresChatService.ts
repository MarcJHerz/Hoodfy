import { Message, ChatRoom, CommunityChat, PrivateChat } from '@/types/chat';
import { User } from '@/types/user';
import { useChatStore } from '@/stores/chatStore';
import { Socket } from 'socket.io-client';

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';

class PostgresChatService {
  private socket: Socket | null = null;
  private chatStore: any = null;

  constructor() {
    // Inicializar el store cuando esté disponible
    this.initializeStore();
  }

  private initializeStore() {
    // Importar dinámicamente para evitar problemas de SSR
    if (typeof window !== 'undefined') {
      import('@/stores/chatStore').then(({ useChatStore }) => {
        this.chatStore = useChatStore;
      });
    }
  }

  // Métodos de autenticación
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Obtener chats del usuario
  async getUserChats(userId: string): Promise<ChatRoom[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/user/${userId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformChatRooms(data);
    } catch (error) {
      console.error('❌ Error obteniendo chats del usuario:', error);
      return [];
    }
  }

  // Obtener mensajes de un chat
  async getChatMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformMessages(data);
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          content: messageData.content,
          content_type: messageData.type,
          sender_id: messageData.senderId,
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
      return data.messageId;
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  // Crear chat privado
  async createPrivateChat(userId1: string, userId2: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/private`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          participant_ids: [userId1, userId2],
          type: 'private'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chatId;
    } catch (error) {
      console.error('❌ Error creando chat privado:', error);
      throw error;
    }
  }

  // Crear chat de comunidad
  async createCommunityChat(communityId: string, name: string, participantIds: string[]): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/community`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          community_id: communityId,
          name,
          participant_ids: participantIds,
          type: 'community'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chatId;
    } catch (error) {
      console.error('❌ Error creando chat de comunidad:', error);
      throw error;
    }
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
    }
  }

  // Añadir reacción a mensaje
  async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          emoji,
          user_id: userId
        }),
      });
    } catch (error) {
      console.error('❌ Error añadiendo reacción:', error);
    }
  }

  // Remover reacción de mensaje
  async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          emoji,
          user_id: userId
        }),
      });
    } catch (error) {
      console.error('❌ Error removiendo reacción:', error);
    }
  }

  // Conectar a Socket.io para tiempo real
  connectToSocket(userId: string) {
    try {
      // Importar Socket.io dinámicamente
      import('socket.io-client').then(({ io }) => {
        this.socket = io(API_BASE_URL, {
          auth: {
            token: localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
          }
        });

        this.socket.on('connect', () => {
          console.log('✅ Conectado a Socket.io');
          if (this.socket) {
            this.socket.emit('join', { userId });
          }
          
          if (this.chatStore) {
            this.chatStore.getState().setConnectionStatus('connected');
          }
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Desconectado de Socket.io');
          if (this.chatStore) {
            this.chatStore.getState().setConnectionStatus('disconnected');
          }
        });

        this.socket.on('new_message', (message: any) => {
          const transformedMessage = this.transformMessage(message);
          if (this.chatStore) {
            this.chatStore.getState().addMessage(transformedMessage);
          }
        });

        this.socket.on('typing_start', (data: { userId: string }) => {
          if (this.chatStore) {
            const { typingUsers } = this.chatStore.getState();
            if (!typingUsers.includes(data.userId)) {
              this.chatStore.getState().setTypingUsers([...typingUsers, data.userId]);
            }
          }
        });

        this.socket.on('typing_stop', (data: { userId: string }) => {
          if (this.chatStore) {
            const { typingUsers } = this.chatStore.getState();
            this.chatStore.getState().setTypingUsers(
              typingUsers.filter((id: string) => id !== data.userId)
            );
          }
        });

        this.socket.on('message_reaction', (data: { messageId: string; reactions: any[] }) => {
          if (this.chatStore) {
            const { messages } = this.chatStore.getState();
            const updatedMessages = messages.map((msg: Message) => 
              msg.id === data.messageId 
                ? { ...msg, reactions: data.reactions }
                : msg
            );
            this.chatStore.getState().setMessages(updatedMessages);
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
      senderName: msg.sender_name || 'Usuario',
      senderProfilePicture: msg.sender_profile_picture,
      timestamp: new Date(msg.created_at),
      type: msg.content_type || 'text',
      mediaUrl: msg.media_url,
      mediaType: msg.media_type,
      mediaName: msg.media_name,
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
