'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { chatService } from '@/services/chatService';
import { Message } from '@/types/chat';
import { XMarkIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
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
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            You must login to use the chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${isModal ? 'rounded-lg shadow-xl border border-gray-200 dark:border-gray-700' : ''}`}>
      {/* Header of the chat improved - Only show if NOT in modal */}
      {!isModal && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* Improved avatar/icon */}
            {chatType === 'private' && otherUserProfilePicture ? (
              <div className="relative">
                <UserAvatar
                  source={otherUserProfilePicture}
                  name={chatName}
                  size={40}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg hover-lift">
                {chatType === 'community' ? (
                  <UserGroupIcon className="w-5 h-5 text-white" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>
            )}
            
            {/* Información del chat */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">
                {chatName}
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chatType === 'community' ? 'Community chat' : 'Private chat'}
                  {isLoading && ' • Connecting...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Improved close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover-lift"
              title="Close chat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* List of messages with improved error handling */}
      <div className="flex-1 overflow-hidden min-h-0">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Error loading the chat
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 hover-lift"
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
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
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