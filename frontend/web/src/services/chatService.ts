import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  setDoc,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Message, ChatRoom, CommunityChat, PrivateChat } from '@/types/chat';
import { User } from '@/types/user';
import { useChatStore } from '@/stores/chatStore';

// Tipos para Firestore
interface FirestoreMessage {
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  mediaType?: string;
  mediaName?: string;
  isEdited?: boolean;
  editedAt?: Timestamp;
}

interface FirestoreChatRoom {
  type: 'community' | 'private';
  name: string;
  description?: string;
  image?: string;
  participantIds: string[];
  lastMessage?: FirestoreMessage | null;
  unreadCount: { [userId: string]: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Campos específicos para community
  communityId?: string;
  communityName?: string;
  memberCount?: number;
  // Campos específicos para private
  otherUserId?: string;
  otherUserName?: string;
  otherUserProfilePicture?: string;
}

// Convertir Firestore Timestamp a Date
const timestampToDate = (timestamp: Timestamp | null | undefined): Date => {
  if (!timestamp) {
    return new Date(); // Fallback a fecha actual si no hay timestamp
  }
  return timestamp.toDate();
};

// Convertir Date a Firestore Timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Convertir mensaje de Firestore a tipo local
const firestoreMessageToMessage = (doc: any): Message | null => {
  const data = doc.data();
  
  // Validar que el documento tenga datos válidos
  if (!data) {
    console.warn('Documento sin datos válidos:', doc.id);
    return null;
  }

  try {
    return {
      id: doc.id,
      chatId: data.chatId || '',
      content: data.content || '',
      senderId: data.senderId || '',
      senderName: data.senderName || 'Usuario desconocido',
      senderProfilePicture: data.senderProfilePicture,
      timestamp: timestampToDate(data.timestamp),
      type: data.type || 'text',
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      mediaName: data.mediaName,
      isEdited: data.isEdited || false,
      editedAt: data.editedAt ? timestampToDate(data.editedAt) : undefined,
    };
  } catch (error) {
    console.error('Error convirtiendo mensaje de Firestore:', error, data);
    return null;
  }
};

// Convertir mensaje local a formato Firestore
const messageToFirestore = (message: Omit<Message, 'id'>): Omit<FirestoreMessage, 'timestamp'> => {
  const data: any = {
    chatId: message.chatId,
    content: message.content,
    senderId: message.senderId,
    senderName: message.senderName,
    senderProfilePicture: message.senderProfilePicture,
    type: message.type,
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    mediaName: message.mediaName,
    isEdited: message.isEdited,
    editedAt: message.editedAt ? dateToTimestamp(message.editedAt) : undefined,
  };
  // Elimina los campos undefined SOLO de los opcionales
  ['senderProfilePicture','mediaUrl','mediaType','mediaName','isEdited','editedAt'].forEach((key) => data[key] === undefined && delete data[key]);
  return data;
};

// Convertir chat room de Firestore a tipo local
const firestoreChatRoomToChatRoom = (doc: any, currentUserId?: string): ChatRoom => {
  const data = doc.data();
  const lastMsg = data.lastMessage ? firestoreMessageToMessage({ id: '', data: () => data.lastMessage }) : null;

  const baseChat: Partial<ChatRoom> = {
    id: doc.id,
    type: data.type,
    name: data.name,
    participants: data.participantIds || [],
    lastMessage: lastMsg ?? undefined,
    unreadCount: currentUserId ? (data.unreadCount?.[currentUserId] || 0) : 0,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };

  if (data.type === 'community') {
    return {
      ...baseChat,
      communityId: data.communityId,
      communityName: data.communityName,
      memberCount: data.memberCount,
    } as CommunityChat;
  } else {
    // Identificar correctamente el otro usuario
    const otherUserId = (data.participantIds || []).find((id: string) => id !== currentUserId);
    return {
      ...baseChat,
      otherUserId,
      otherUserName: data.otherUserName || '',
      otherUserProfilePicture: data.otherUserProfilePicture || '',
    } as PrivateChat;
  }
};

// Convertir chat room local a formato Firestore
const chatRoomToFirestore = (chatRoom: Omit<ChatRoom, 'id' | 'participants'>): Omit<FirestoreChatRoom, 'createdAt' | 'updatedAt'> => {
  return {
    type: chatRoom.type,
    name: chatRoom.name,
    participantIds: [],
    lastMessage: chatRoom.lastMessage ? { ...messageToFirestore(chatRoom.lastMessage), timestamp: dateToTimestamp(chatRoom.lastMessage.timestamp) } : null,
    unreadCount: {},
  };
};

class ChatService {
  private unsubscribeChats: (() => void) | null = null;
  private unsubscribeMessages: (() => void) | null = null;

  // Verificar autenticación antes de operaciones
  private checkAuth() {
    if (!auth.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return auth.currentUser;
  }

  // Enviar mensaje
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    try {
      const user = this.checkAuth();
      
      // Crear el mensaje con timestamp
      const messageData: Omit<Message, 'id'> = {
        ...message,
        timestamp: new Date(),
      };

      // Convertir a formato Firestore
      const firestoreMessage = messageToFirestore(messageData);
      
      // Agregar el mensaje a Firestore
      const messagesRef = collection(db, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...firestoreMessage,
        timestamp: serverTimestamp(),
      });

      // Actualizar último mensaje en el chat
      await this.updateChatLastMessage(message.chatId, { ...firestoreMessage, timestamp: serverTimestamp() });

      // Incrementar contador de mensajes no leídos para destinatarios
      await this.incrementUnreadCountForRecipients(message.chatId, user.uid);

      // Enviar notificación push
      await this.sendPushNotification(messageData);

      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Enviar notificación push
  private async sendPushNotification(message: Omit<Message, 'id' | 'timestamp'>) {
    try {
      // Obtener información del chat
      const chatRef = doc(db, 'chats', message.chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        console.error('Chat no encontrado para notificación');
        return;
      }

      const chatData = chatDoc.data();
      const participants = chatData.participantIds || [];
      
      // Filtrar participantes (excluir al remitente)
      const recipients = participants.filter((id: string) => id !== message.senderId);
      
      if (recipients.length === 0) {
        return;
      }

      // Crear notificación
      const notification = {
        title: chatData.type === 'community' ? chatData.name : message.senderName,
        body: message.content,
        data: {
          chatId: message.chatId,
          type: chatData.type,
          senderId: message.senderId,
        },
      };

      // Enviar notificación a destinatarios
      await this.sendNotificationToRecipients(notification, recipients);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Enviar notificación a destinatarios
  private async sendNotificationToRecipients(notification: any, recipients: string[]) {
    try {
      // Obtener tokens FCM de los destinatarios
      const tokens = await this.getUserFCMTokens(recipients);
      
      if (tokens.length === 0) {
        console.log('📱 No hay tokens FCM disponibles para enviar notificación');
        return;
      }

      // Detectar la URL de la API dinámicamente
      const currentDomain = window.location.hostname;
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
      
      if (currentDomain.includes('hoodfy.com')) {
        apiUrl = process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
      }

      console.log('📤 Enviando notificación de chat a:', apiUrl);

      // Enviar notificación a través del backend
      const response = await fetch(`${apiUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification,
          tokens,
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando notificación');
      }

      console.log('✅ Notificación de chat enviada exitosamente');

    } catch (error) {
      console.error('Error enviando notificación a destinatarios:', error);
    }
  }

  // Obtener tokens FCM de usuarios
  private async getUserFCMTokens(userIds: string[]): Promise<string[]> {
    try {
      // Obtener el token de Firebase Auth
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        console.error('❌ No se pudo obtener el token de autenticación para FCM tokens');
        return [];
      }

      // Detectar la URL de la API dinámicamente
      const currentDomain = window.location.hostname;
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
      
      if (currentDomain.includes('hoodfy.com')) {
        apiUrl = process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
      }

      // Obtener tokens FCM desde el backend
      const response = await fetch(`${apiUrl}/api/users/fcm-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Error obteniendo tokens FCM');
      }

      const data = await response.json();
      return data.tokens || [];

    } catch (error) {
      console.error('Error obteniendo tokens FCM:', error);
      return [];
    }
  }

  // Escuchar mensajes de un chat
  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
          const message = firestoreMessageToMessage(doc);
          if (message) {
            messages.push(message);
          }
        });
        callback(messages);
      });

      this.unsubscribeMessages = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return () => {};
    }
  }

  // Crear o obtener chat de comunidad
  async createOrGetCommunityChat(communityId: string, communityName: string): Promise<CommunityChat> {
    try {
      const user = this.checkAuth();
      
      // Buscar chat existente
      const existingChat = await this.getCommunityChat(communityId);
      if (existingChat) {
        return existingChat;
      }

      // Crear nuevo chat
      const chatId = await this.createCommunityChat(communityId, communityName, [user.uid]);
      
      // Obtener el chat creado
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Error creando chat de comunidad');
      }

      return firestoreChatRoomToChatRoom(chatDoc) as CommunityChat;
    } catch (error) {
      console.error('Error creating or getting community chat:', error);
      throw error;
    }
  }

  // Crear chat de comunidad
  async createCommunityChat(communityId: string, communityName: string, memberIds: string[]): Promise<string> {
    try {
      const chatsRef = collection(db, 'chats');
      
      const chatData: Omit<FirestoreChatRoom, 'createdAt' | 'updatedAt'> = {
        type: 'community',
        name: communityName,
        participantIds: memberIds,
        lastMessage: null,
        unreadCount: {},
        communityId,
        communityName,
      };

      const docRef = await addDoc(chatsRef, {
        ...chatData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating community chat:', error);
      throw error;
    }
  }

  // Crear chat privado
  async createPrivateChat(user1Id: string, user2Id: string, user2Name: string, user2ProfilePicture?: string): Promise<string> {
    try {
      // Prevenir chat con uno mismo
      if (user1Id === user2Id) {
        throw new Error('No puedes crear un chat contigo mismo');
      }

      // Generar ID único para chat privado
      const chatId = this.generatePrivateChatId(user1Id, user2Id);
      
      // Verificar si ya existe
      const existingChat = await this.getPrivateChat(user1Id, user2Id);
      if (existingChat) {
        return existingChat.id;
      }

      const chatsRef = collection(db, 'chats');
      
      const chatData: Omit<FirestoreChatRoom, 'createdAt' | 'updatedAt'> = {
        type: 'private',
        name: `Chat con ${user2Name}`,
        participantIds: [user1Id, user2Id],
        lastMessage: null,
        unreadCount: {},
        otherUserId: user2Id,
        otherUserName: user2Name,
        otherUserProfilePicture: user2ProfilePicture,
      };

      await setDoc(doc(chatsRef, chatId), {
        ...chatData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return chatId;
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw error;
    }
  }

  // Obtener chat privado existente
  async getPrivateChat(user1Id: string, user2Id: string): Promise<ChatRoom | null> {
    try {
      const chatId = this.generatePrivateChatId(user1Id, user2Id);
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        return firestoreChatRoomToChatRoom(chatDoc);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting private chat:', error);
      return null;
    }
  }

  // Obtener chats del usuario
  async getUserChats(userId: string) {
    try {
      const chatsRef = collection(db, 'chats');
      try {
        const q = query(
          chatsRef,
          where('participantIds', 'array-contains', userId),
          orderBy('updatedAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const chats: ChatRoom[] = [];
          snapshot.forEach((doc) => {
            const chatRoom = firestoreChatRoomToChatRoom(doc, userId);
            chats.push(chatRoom);
          });
          // Filtrar duplicados por participantes y tipo
          const uniqueChats = chats.reduce((acc: ChatRoom[], chat) => {
            if (chat.type === 'private') {
              const exists = acc.some(c => c.type === 'private' && ((c as any).otherUserId === (chat as any).otherUserId));
              if (!exists) acc.push(chat);
            } else if (chat.type === 'community') {
              const exists = acc.some(c => c.type === 'community' && (c as any).communityId === (chat as any).communityId);
              if (!exists) acc.push(chat);
            }
            return acc;
          }, []);
          useChatStore.getState().setChatRooms(uniqueChats);
        }, (error) => {
          console.error('Error en consulta con índice:', error);
          this.getUserChatsAlternative(userId);
        });
        this.unsubscribeChats = unsubscribe;
      } catch (error) {
        console.error('Error en consulta principal:', error);
        this.getUserChatsAlternative(userId);
      }
    } catch (error) {
      console.error('Error obteniendo chats del usuario:', error);
    }
  }

  // Consulta alternativa sin ordenamiento (para cuando el índice no está listo)
  private async getUserChatsAlternative(userId: string) {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chats: ChatRoom[] = [];
        snapshot.forEach((doc) => {
          const chatRoom = firestoreChatRoomToChatRoom(doc, userId);
          chats.push(chatRoom);
        });
        // Filtrar duplicados por participantes y tipo
        const uniqueChats = chats.reduce((acc: ChatRoom[], chat) => {
          if (chat.type === 'private') {
            const exists = acc.some(c => c.type === 'private' && ((c as any).otherUserId === (chat as any).otherUserId));
            if (!exists) acc.push(chat);
          } else if (chat.type === 'community') {
            const exists = acc.some(c => c.type === 'community' && (c as any).communityId === (chat as any).communityId);
            if (!exists) acc.push(chat);
          }
          return acc;
        }, []);
        useChatStore.getState().setChatRooms(uniqueChats);
      });
      this.unsubscribeChats = unsubscribe;
    } catch (error) {
      console.error('Error en consulta alternativa:', error);
    }
  }

  // Actualizar último mensaje en chat
  private async updateChatLastMessage(chatId: string, lastMessage: Omit<FirestoreMessage, 'timestamp'> & { timestamp: any }) {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating chat last message:', error);
    }
  }

  // Generar ID único para chat privado
  private generatePrivateChatId(user1Id: string, user2Id: string): string {
    const sortedIds = [user1Id, user2Id].sort();
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Marcar mensajes como leídos
  async markMessagesAsRead(chatId: string, userId: string) {
    try {
      // Obtener el token de Firebase Auth
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        console.error('❌ No se pudo obtener el token de autenticación');
        return;
      }

      // Detectar la URL de la API dinámicamente
      const currentDomain = window.location.hostname;
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.qahood.com';
      
      if (currentDomain.includes('hoodfy.com')) {
        apiUrl = process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com';
      }
      
      console.log('🌐 Usando API URL para chat:', apiUrl);

      const response = await fetch(`${apiUrl}/api/chats/${chatId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error marcando mensajes como leídos');
      }

      // Actualizar el store local para reflejar que el chat fue leído
      useChatStore.getState().markChatAsRead(chatId);
      console.log('✅ Chat marcado como leído:', chatId);

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Incrementar contador de mensajes no leídos
  async incrementUnreadCount(chatId: string, userId: string) {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const currentCount = chatDoc.data().unreadCount?.[userId] || 0;
        await updateDoc(chatRef, {
          [`unreadCount.${userId}`]: currentCount + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing unread count:', error);
    }
  }

  // Incrementar contador de mensajes no leídos para destinatarios (excluyendo al remitente)
  async incrementUnreadCountForRecipients(chatId: string, senderId: string) {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const participants = chatData.participantIds || [];
        
        // Filtrar participantes (excluir al remitente)
        const recipients = participants.filter((id: string) => id !== senderId);
        
        // Incrementar contador para cada destinatario
        const updates: any = {};
        recipients.forEach((recipientId: string) => {
          const currentCount = chatData.unreadCount?.[recipientId] || 0;
          updates[`unreadCount.${recipientId}`] = currentCount + 1;
        });
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(chatRef, updates);
        }
      }
    } catch (error) {
      console.error('Error incrementing unread count for recipients:', error);
    }
  }

  // Limpiar suscripción a chats
  unsubscribeFromChats() {
    if (this.unsubscribeChats) {
      this.unsubscribeChats();
      this.unsubscribeChats = null;
    }
  }

  async getCommunityChat(communityId: string): Promise<CommunityChat | null> {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', 'community'),
        where('communityId', '==', communityId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return firestoreChatRoomToChatRoom(doc) as CommunityChat;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting community chat:', error);
      return null;
    }
  }
}

export const chatService = new ChatService();
export default chatService; 