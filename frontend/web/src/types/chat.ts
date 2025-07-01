import { User } from './user';

export interface Message {
  id: string;
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  mediaType?: string;
  mediaName?: string;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'community' | 'private';
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface CommunityChat extends ChatRoom {
  communityId: string;
  communityName: string;
}

export interface PrivateChat extends ChatRoom {
  otherUserId: string;
  otherUserName: string;
}

export interface ChatState {
  // Estado del chat actual
  currentChat: ChatRoom | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Lista de chats
  chatRooms: ChatRoom[];
  chatRoomsLoading: boolean;
  
  // Estado de conexión
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Usuarios escribiendo
  typingUsers: string[];
  
  // Acciones
  setCurrentChat: (chat: ChatRoom) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setMessages: (messages: Message[]) => void;
  setChatRooms: (rooms: ChatRoom[]) => void;
  addChatRoom: (room: ChatRoom) => void;
  updateChatRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  setTypingUsers: (users: string[]) => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  sendMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<string>;
  subscribeToMessages: (chatId: string) => () => void;
  unsubscribeFromMessages: () => void;
  reset: () => void;
  
  // Funciones de notificaciones
  getTotalUnreadCount: () => number;
  markChatAsRead: (chatId: string) => void;
  incrementUnreadCount: (chatId: string) => void;
}

export interface ChatNotification {
  id: string;
  chatId: string;
  chatName: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'community' | 'private';
  read: boolean;
} 