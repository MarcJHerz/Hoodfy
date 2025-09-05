'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { postgresChatService } from '@/services/postgresChatService';
import { Message, ChatRoom } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserAvatar } from '@/components/UserAvatar';
import { ArrowLeftIcon, PaperAirplaneIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentChat, messages, setCurrentChat, setMessages, addMessage } = useChatStore();
  
  const [chatId] = useState(params.chatId as string);
  const [chat, setChat] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!user?._id || !chatId) return;

    const loadChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener información del chat
        const chats = await postgresChatService.getUserChats(user._id);
        const foundChat = chats.find(c => c.id === chatId);
        
        if (!foundChat) {
          setError('Chat no encontrado');
          return;
        }

        setChat(foundChat);
        setCurrentChat(foundChat);

        // Obtener mensajes del chat
        const chatMessages = await postgresChatService.getChatMessages(chatId);
        setMessages(chatMessages);

        // Marcar mensajes como leídos
        await postgresChatService.markMessagesAsRead(chatId, user._id);

        // Conectar a Socket.io si no está conectado
        await postgresChatService.connectToSocket(user._id);

      } catch (error) {
        console.error('❌ Error cargando chat:', error);
        setError('Error loading chat. Try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId, user?._id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat || !user?._id) return;

    try {
      setIsSending(true);

      const messageData = {
        chatId: chat.id,
        content: newMessage.trim(),
        senderId: user.firebaseUid || user._id,
        senderName: user.name || 'Usuario',
        senderProfilePicture: user.profilePicture || '',
        type: 'text' as const,
      };

      const messageId = await postgresChatService.sendMessage(messageData);
      
      // Limpiar input
      setNewMessage('');
      
      // El mensaje se añadirá automáticamente via Socket.io
      console.log('✅ Mensaje enviado:', messageId);

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      setError('Error sending message. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Enviar indicador de escritura
    if (user?._id && chat) {
      const isTyping = e.target.value.length > 0;
      if (isTyping !== isTyping) {
        setIsTyping(isTyping);
        postgresChatService.sendTypingIndicator(chat.id, user._id, isTyping);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Autenticación requerida
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Debes iniciar sesión para ver este chat
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Cargando chat...
          </h3>
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error cargando chat
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error || 'Chat no encontrado'}
          </p>
          <Link
            href="/messages"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Volver a mensajes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header del chat */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/messages"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          
          <div className="flex items-center space-x-3 flex-1">
            <UserAvatar
              source={chat.type === 'private' ? (chat as any).otherUserProfilePicture : '/images/defaults/default-community.png'}
              name={chat.name}
              size={40}
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {chat.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chat.type === 'private' ? 'Chat privado' : 'Chat de comunidad'}
              </p>
            </div>
          </div>

          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No hay mensajes aún
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Sé el primero en enviar un mensaje
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === (user.firebaseUid || user._id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === (user.firebaseUid || user._id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.senderId !== (user.firebaseUid || user._id) && (
                  <div className="flex items-center space-x-2 mb-1">
                    <UserAvatar
                      source={message.senderProfilePicture}
                      name={message.senderName}
                      size={24}
                    />
                    <span className="text-xs font-medium opacity-75">
                      {message.senderName}
                    </span>
                  </div>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                <div className="text-xs opacity-75 mt-1 text-right">
                  {formatDistanceToNow(message.timestamp, { 
                    addSuffix: true, 
                    locale: es 
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input de mensaje */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={1}
              disabled={isSending}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
