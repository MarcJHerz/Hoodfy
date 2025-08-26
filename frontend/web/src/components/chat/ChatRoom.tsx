'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { chatService } from '@/services/chatService';
import { Message } from '@/types/chat';
import { XMarkIcon, UserGroupIcon, UserIcon, SignalIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { UserAvatar } from '@/components/UserAvatar';

interface ChatRoomProps {
  chatId: string;
  chatName: string;
  chatType: 'community' | 'private';
  onClose?: () => void;
  isModal?: boolean;
  otherUserProfilePicture?: string;
  otherUserId?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  chatId,
  chatName,
  chatType,
  onClose,
  isModal = false,
  otherUserProfilePicture,
  otherUserId
}) => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages
  } = useChatStore();

  const [isSending, setIsSending] = useState(false);

  // Generar colores únicos por usuario para el header
  const getHeaderColor = (userId?: string) => {
    if (!userId) return 'from-blue-500 to-purple-500';
    
    const colors = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-teal-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-cyan-500 to-blue-500'
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    if (!user?._id || !chatId) return;

    console.log('🔄 Suscribiendo a mensajes del chat:', chatId);
    
    // Suscribirse a los mensajes del chat
    const unsubscribe = subscribeToMessages(chatId);
    
    // Marcar mensajes como leídos cuando se abre el chat
    chatService.markMessagesAsRead(chatId, user._id);
    
    return () => {
      console.log('🔌 Unsubscribing from chat messages:', chatId);
      unsubscribe();
    };
  }, [chatId, user?._id, subscribeToMessages]);

  const handleSendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => {
    if (!user?._id || !content.trim()) return;

    setIsSending(true);
    try {
      const messageData: Omit<Message, 'id' | 'timestamp'> = {
        chatId,
        content,
        senderId: user._id,
        senderName: user.name,
        senderProfilePicture: user.profilePicture,
        type,
        mediaUrl: file ? URL.createObjectURL(file) : undefined,
        mediaType: file?.type,
        mediaName: file?.name,
      };

      await sendMessage(messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      // Here you could show an error toast
    } finally {
      setIsSending(false);
    }
  };

  if (!user?._id) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Error
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You must be logged in to access the chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${isModal ? 'rounded-lg shadow-xl border border-gray-200 dark:border-gray-700' : ''}`}>
      {/* Completely renovated chat header */}
      {!isModal && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex-shrink-0 shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Improved avatar/icon with unique colors */}
            {chatType === 'private' && otherUserProfilePicture ? (
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-xl group-hover:ring-4 group-hover:ring-primary-300/50 dark:group-hover:ring-primary-600/50 transition-all duration-300 group-hover:scale-110">
                  <UserAvatar
                    source={otherUserProfilePicture}
                    name={chatName}
                    size={56}
                  />
                </div>
                {/* Improved online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full shadow-lg animate-pulse ring-2 ring-green-400/50"></div>
              </div>
            ) : (
              <div className={`w-14 h-14 bg-gradient-to-r ${getHeaderColor(otherUserId)} rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110`}>
                {chatType === 'community' ? (
                  <UserGroupIcon className="w-7 h-7 text-white" />
                ) : (
                  <UserIcon className="w-7 h-7 text-white" />
                )}
              </div>
            )}
            
            {/* Chat information with better design */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xl truncate mb-1">
                {chatName}
              </h3>
              <div className="flex items-center space-x-3">
                {/* Connection status indicator */}
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'} shadow-sm`}></div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isLoading ? 'Connecting...' : 'Online'}
                  </p>
                </div>
                
                {/* Separator */}
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                
                {/* Chat type */}
                <div className="flex items-center space-x-2">
                  <SignalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {chatType === 'community' ? 'Community Chat' : 'Private Chat'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Improved close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg"
              title="Close chat"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Message list with improved error handling */}
      <div className="flex-1 overflow-hidden min-h-0">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Error loading chat
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-50 dark:bg-gray-900">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              currentUserId={user._id}
            />
          </div>
        )}
      </div>

      {/* Input to send messages */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isSending}
          placeholder={`Write a message in ${chatName}...`}
          disabled={isLoading || !!error}
        />
      </div>
    </div>
  );
};

export default ChatRoom; 