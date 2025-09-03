'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { postgresChatService } from '@/services/postgresChatService';
import { ChatRoom } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserAvatar } from '@/components/UserAvatar';
import Image from 'next/image';
import Link from 'next/link';
import { ChatBubbleLeftIcon, UserGroupIcon, UserIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import PrivateChatModal from '@/components/chat/PrivateChatModal';
import { User } from '@/types/user';
import { users } from '@/services/api';
import { UsersIcon } from '@heroicons/react/24/outline';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { chatRooms, setChatRooms, setLoading } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);
  
  // Cache local para información de usuarios
  const [userCache, setUserCache] = useState<Map<string, { name: string; profilePicture?: string }>>(new Map());

  // Función para obtener información de usuario con cache
  const getUserInfo = async (userId: string) => {
    // Verificar cache primero
    if (userCache.has(userId)) {
      return userCache.get(userId)!;
    }

    try {
      const response = await users.getProfileById(userId);
      const userInfo = {
        name: response.data.name,
        profilePicture: response.data.profilePicture
      };
      
      // Actualizar cache
      setUserCache(prev => new Map(prev.set(userId, userInfo)));
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return { name: 'Unknown user', profilePicture: undefined };
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    const loadChats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Usar el store para cargar chats
        const { loadUserChats, connectToSocket } = useChatStore.getState();
        await loadUserChats(user._id);
        await connectToSocket(user._id);
        
      } catch (error) {
        console.error('❌ Error cargando chats:', error);
        setError('Error loading chats. Try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChats();
    
    // Limpiar suscripción cuando el componente se desmonte
    return () => {
      const { disconnectFromSocket } = useChatStore.getState();
      disconnectFromSocket();
    };
  }, [user?._id]);

  const handleChatClick = (chat: ChatRoom) => {
    // Marcar el chat como leído cuando se hace clic
    if (user?._id) {
      const { markMessagesAsRead } = useChatStore.getState();
      markMessagesAsRead(chat.id, user._id);
    }

    // Navegar al chat individual
    window.location.href = `/chats/${chat.id}`;
  };

  const handleClosePrivateChat = () => {
    setSelectedUserForChat(null);
  };

  const getChatIcon = (chat: ChatRoom) => {
    if (chat.type === 'community') {
      return <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
    }
    return <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
  };

  const getChatName = (chat: ChatRoom) => {
    if (chat.type === 'community') {
      const communityChat = chat as any;
      return communityChat.communityName || chat.name;
    }
    
    const privateChat = chat as any;
    // Identificar al otro usuario correctamente
    const otherUserId = (privateChat.participants || []).find((id: string) => id !== user?._id);
    
    // Si tenemos información del otro usuario en el chat
    if (privateChat.otherUserName && privateChat.otherUserId === otherUserId) {
      return privateChat.otherUserName;
    }
    
    // Si tenemos el ID pero no el nombre, intentar obtenerlo del cache
    if (otherUserId && userCache.has(otherUserId)) {
      return userCache.get(otherUserId)!.name;
    }
    
    // Fallback: obtener información del usuario
    if (otherUserId) {
      getUserInfo(otherUserId).then(userInfo => {
        // Esto causará un re-render cuando se obtenga la información
      });
      return 'Loading...';
    }
    
    return 'Unknown user';
  };

  const getChatImage = (chat: ChatRoom) => {
    if (chat.type === 'community') {
      return '/images/defaults/default-community.png';
    }
    
    const privateChat = chat as any;
    // Identificar al otro usuario correctamente
    const otherUserId = (privateChat.participants || []).find((id: string) => id !== user?._id);
    
    // Si tenemos información del otro usuario en el chat
    if (privateChat.otherUserProfilePicture && privateChat.otherUserId === otherUserId) {
      return privateChat.otherUserProfilePicture;
    }
    
    // Si tenemos el ID pero no la imagen, intentar obtenerlo del cache
    if (otherUserId && userCache.has(otherUserId)) {
      const cachedUser = userCache.get(otherUserId)!;
      return cachedUser.profilePicture || '/images/defaults/default-avatar.png';
    }
    
    // Fallback: obtener información del usuario
    if (otherUserId) {
      getUserInfo(otherUserId).then(userInfo => {
        // Esto causará un re-render cuando se obtenga la información
      });
    }
    
    return '/images/defaults/default-avatar.png';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            You must login to see your messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header mejorado */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                <ChatBubbleLeftIcon className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-700 dark:from-white dark:via-blue-300 dark:to-purple-400 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">
                Your private conversations and community chats
              </p>
            </div>
          </div>
          
          {/* Stats mejoradas con animaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform duration-300">
                    {chatRooms.length}
                  </p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Conversaciones</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Active now
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 group-hover:scale-105 transition-transform duration-300">
                    {chatRooms.filter(chat => chat.type === 'private').length}
                  </p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Private chats</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                With allies
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform duration-300">
                    {chatRooms.filter(chat => chat.type === 'community').length}
                  </p>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Comunidades</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                Active groups
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        {/* Estados mejorados */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChatBubbleLeftIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Loading chats
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Getting your most recent conversations...
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="relative mb-8 mx-auto w-24 h-24">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center animate-pulse">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Error loading chats
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Try again
              </button>
              <Link
                href="/communities"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore communities
              </Link>
            </div>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8 mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <SparklesIcon className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Your inbox is clean!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed text-lg">
              You don't have any chats yet. Start a conversation with your allies or join communities to start chatting.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/communities"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
              >
                <UsersIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                Explore communities
              </Link>
              <Link
                href={`/profile/${user._id}`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 group"
              >
                <UserIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                View my profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatRooms.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/60 dark:hover:border-blue-600/60 overflow-hidden hover:-translate-y-1"
              >
                {/* Gradiente sutil de fondo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-purple-50/30 dark:from-transparent dark:via-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-6">
                  <div className="flex items-center space-x-4">
                    {/* Avatar/Icono mejorado con efectos */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center ring-2 ring-gray-200/60 dark:ring-gray-600/60 group-hover:ring-blue-300/60 dark:group-hover:ring-blue-600/60 transition-all duration-300 group-hover:scale-105">
                        {chat.type === 'private' ? (
                          <div className="relative w-full h-full">
                            <UserAvatar
                              source={getChatImage(chat)}
                              name={getChatName(chat)}
                              size={64}
                            />
                            {/* Indicador de estado online */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-3 border-white dark:border-gray-800 rounded-full shadow-lg animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                            <UserGroupIcon className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Información del chat mejorada */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {getChatName(chat)}
                        </h3>
                        {chat.lastMessage && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-3 flex-shrink-0 font-medium">
                            {formatDistanceToNow(chat.lastMessage.timestamp, { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getChatIcon(chat)}
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {chat.type === 'community' ? 'Community chat' : 'Private chat'}
                          </span>
                          {(chat as any).unreadCount > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg animate-bounce">
                              {(chat as any).unreadCount} nuevo{(chat as any).unreadCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Último mensaje mejorado */}
                      {chat.lastMessage && (
                        <div className="mt-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl border border-gray-200/40 dark:border-gray-600/40">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {chat.lastMessage.senderName}:
                            </span>{' '}
                            <span className="truncate">
                              {chat.lastMessage.content}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Indicador de flecha con animación */}
                    <div className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de chat privado */}
      {selectedUserForChat && (
        <PrivateChatModal
          isOpen={!!selectedUserForChat}
          onClose={handleClosePrivateChat}
          otherUser={selectedUserForChat}
        />
      )}
    </div>
  );
} 