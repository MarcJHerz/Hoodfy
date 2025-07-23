'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatService } from '@/services/chatService';
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
      return { name: 'Usuario desconocido', profilePicture: undefined };
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Usar getUserChats para obtener actualizaciones en tiempo real
      chatService.getUserChats(user._id);
      
      // Marcar como no cargando después de un breve delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error al cargar chats:', error);
      setError('Error al cargar los chats. Inténtalo de nuevo.');
      setIsLoading(false);
    }
    
    // Limpiar suscripción cuando el componente se desmonte
    return () => {
      chatService.unsubscribeFromChats();
    };
  }, [user?._id]);

  const handleChatClick = (chat: ChatRoom) => {
    // Marcar el chat como leído cuando se hace clic
    if (user?._id) {
      chatService.markMessagesAsRead(chat.id, user._id);
    }

    if (chat.type === 'private') {
      const privateChat = chat as any;
      // Identificar correctamente al otro usuario
      const otherUserId = (privateChat.participants || []).find((id: string) => id !== user?._id);
      
      if (!otherUserId) {
        console.error('❌ Error: No se pudo identificar al otro usuario en el chat:', chat.id);
        return;
      }
      
      const userData: User = {
        _id: otherUserId,
        name: privateChat.otherUserName || 'Usuario desconocido',
        username: privateChat.otherUserName?.toLowerCase().replace(/\s+/g, '') || 'usuario',
        email: '',
        profilePicture: privateChat.otherUserProfilePicture || '',
        bio: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedUserForChat(userData);
    } else {
      const communityChat = chat as any;
      if (communityChat.communityId) {
        window.open(`/communities/${communityChat.communityId}`, '_blank');
      } else {
        console.error('❌ Error: communityId es undefined para el chat:', chat.id);
      }
    }
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
      return 'Cargando...';
    }
    
    return 'Usuario desconocido';
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
            Autenticación requerida
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Debes iniciar sesión para ver tus mensajes
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
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
              <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Mensajes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Tus conversaciones privadas y chats de comunidad
              </p>
            </div>
          </div>
          
          {/* Stats rápidas */}
          {chatRooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{chatRooms.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Conversaciones</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {chatRooms.filter(chat => chat.type === 'private').length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Chats privados</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {chatRooms.filter(chat => chat.type === 'community').length}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Comunidades</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ChatBubbleLeftIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Cargando chats
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Obteniendo tus conversaciones...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Error al cargar chats
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 hover-lift shadow-lg"
            >
              Reintentar
            </button>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <SparklesIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              ¡Tu bandeja está limpia!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              No tienes chats aún. Inicia una conversación con tus aliados o únete a comunidades para comenzar a chatear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/communities"
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-medium rounded-lg transition-all duration-200 hover-lift shadow-lg"
              >
                Explorar comunidades
              </Link>
              <Link
                href={`/profile/${user._id}`}
                className="px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover-lift"
              >
                Ver mi perfil
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatRooms.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover-lift group"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar/Icono mejorado */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all duration-200">
                      {chat.type === 'private' ? (
                        <UserAvatar
                          source={getChatImage(chat)}
                          name={getChatName(chat)}
                          size={56}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador de estado */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>

                  {/* Información del chat */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {getChatName(chat)}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {formatDistanceToNow(chat.lastMessage.timestamp, { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getChatIcon(chat)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {chat.type === 'community' ? 'Chat de comunidad' : 'Chat privado'}
                        </span>
                        {(chat as any).unreadCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 animate-pulse">
                            {(chat as any).unreadCount} nuevo{(chat as any).unreadCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Último mensaje */}
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate leading-relaxed">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {chat.lastMessage.senderName}:
                        </span>{' '}
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Indicador de flecha */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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