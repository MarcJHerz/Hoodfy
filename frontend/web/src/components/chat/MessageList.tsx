'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import { DocumentIcon, PhotoIcon, VideoCameraIcon, UserIcon, ChatBubbleLeftIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/UserAvatar';
import Link from 'next/link';
import PrivateChatModal from './PrivateChatModal';
import { User } from '@/types/user';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  onMessageClick?: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  currentUserId,
  onMessageClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    userId: string;
    userName: string;
  } | null>(null);
  const [selectedUserForChat, setSelectedUserForChat] = useState<User | null>(null);

  // Generar colores únicos por usuario para mejor identificación visual
  const getUserColor = (userId: string) => {
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
    
    // Usar el hash del userId para asignar colores consistentes
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const checkIfNearBottom = () => {
    if (!containerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // 100px de margen
    const isNear = scrollHeight - scrollTop - clientHeight < threshold;
    setIsNearBottom(isNear);
    return isNear;
  };

  const handleScroll = () => {
    const nearBottom = checkIfNearBottom();
    setShouldAutoScroll(nearBottom);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      return;
    }

    // Si es el primer mensaje o si el usuario está cerca del final, hacer scroll
    if (shouldAutoScroll || messages.length === 1) {
      // Usar 'auto' para el primer mensaje para evitar animación
      const behavior = messages.length === 1 ? 'auto' : 'smooth';
      setTimeout(() => scrollToBottom(behavior), 100);
    }
  }, [messages, shouldAutoScroll]);

  const handleUserProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    // Aquí podrías navegar al perfil del usuario
    console.log('Ver perfil de usuario:', userId);
  };

  const handleUserContextMenu = (e: React.MouseEvent, userId: string, userName: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      userId,
      userName
    });
  };

  const handleViewProfile = (userId: string) => {
    setContextMenu(null);
    // Implementar navegación al perfil
    console.log('Ver perfil:', userId);
  };

  const handleStartPrivateChat = (userId: string, userName: string) => {
    setContextMenu(null);
    // Buscar usuario en la lista de usuarios disponibles
    const user = { _id: userId, name: userName } as User;
    setSelectedUserForChat(user);
  };

  const handleClosePrivateChat = () => {
    setSelectedUserForChat(null);
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <div className="relative group">
              <Image
                src={message.mediaUrl || ''}
                alt={message.mediaName || 'Imagen'}
                width={300}
                height={200}
                className="rounded-lg max-w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => window.open(message.mediaUrl, '_blank')}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <PhotoIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            {message.mediaName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                {message.mediaName}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <video
              controls
              className="rounded-lg max-w-full h-auto cursor-pointer"
              preload="metadata"
            >
              <source src={message.mediaUrl} type={message.mediaType} />
              Tu navegador no soporta el elemento de video.
            </video>
            {message.mediaName && (
              <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                {message.mediaName}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              <DocumentIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {message.mediaName || message.content}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {message.mediaType || 'Archivo'}
              </p>
            </div>
            {message.mediaUrl && (
              <a
                href={message.mediaUrl}
                download={message.mediaName}
                className="flex-shrink-0 p-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                title="Descargar archivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words message-content leading-relaxed">
            {message.content}
          </p>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Cargando mensajes...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ChatBubbleLeftIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ¡Inicia la conversación!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay mensajes aún. Sé el primero en enviar un mensaje y romper el hielo.
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            <span>Esperando tu primer mensaje...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden p-6 space-y-6 scroll-smooth bg-gray-50 dark:bg-gray-900 chat-scroll" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          const showTimestamp = index === messages.length - 1 || 
            messages[index + 1].senderId !== message.senderId ||
            (new Date(messages[index + 1].timestamp).getTime() - new Date(message.timestamp).getTime()) > 300000; // 5 minutos
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group animate-fade-in`}
              onClick={() => onMessageClick?.(message)}
            >
              <div className={`flex max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-4`}>
                {/* Avatar mejorado con colores únicos por usuario */}
                {!isOwnMessage && (
                  <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={(e) => handleUserProfileClick(e, message.senderId)}
                      onContextMenu={(e) => handleUserContextMenu(e, message.senderId, message.senderName)}
                      className="w-12 h-12 rounded-2xl overflow-hidden hover:ring-4 hover:ring-primary-300/50 dark:hover:ring-primary-600/50 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/50 dark:focus:ring-primary-400/50 shadow-lg"
                      title={`Ver perfil de ${message.senderName}`}
                    >
                      <UserAvatar
                        source={message.senderProfilePicture}
                        name={message.senderName}
                        size={48}
                      />
                    </button>
                  </div>
                )}

                {/* Mensaje con diseño completamente renovado */}
                <div className={`flex flex-col min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {/* Nombre del remitente con colores únicos */}
                  {!isOwnMessage && showAvatar && (
                    <button
                      onClick={(e) => handleUserProfileClick(e, message.senderId)}
                      onContextMenu={(e) => handleUserContextMenu(e, message.senderId, message.senderName)}
                      className={`text-sm font-semibold mb-2 px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none bg-gradient-to-r ${getUserColor(message.senderId)} text-white shadow-md hover:shadow-lg`}
                      title={`Ver perfil de ${message.senderName}`}
                    >
                      {message.senderName}
                    </button>
                  )}

                  {/* Contenido del mensaje con burbujas modernas */}
                  <div
                    className={`px-6 py-4 rounded-3xl max-w-full transition-all duration-300 hover:shadow-xl word-wrap break-words ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-2xl transform hover:scale-[1.02]'
                        : `bg-gradient-to-r ${getUserColor(message.senderId)} text-white shadow-lg hover:shadow-2xl transform hover:scale-[1.02]`
                    } ${message.type !== 'text' ? 'p-4' : ''}`}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                  >
                    {renderMessageContent(message)}
                  </div>

                  {/* Timestamp y estado de mensaje siempre visibles */}
                  <div className={`flex items-center mt-3 space-x-3 transition-all duration-200 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Timestamp */}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full">
                      {formatDistanceToNow(message.timestamp, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                    
                    {/* Estado del mensaje para mensajes propios */}
                    {isOwnMessage && (
                      <div className="flex items-center space-x-1 text-blue-400">
                        <CheckIcon className="w-3 h-3" />
                        <span className="text-xs">Enviado</span>
                      </div>
                    )}
                    
                    {/* Indicador de edición */}
                    {message.isEdited && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full">
                        (editado)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Botón de scroll al final mejorado */}
      {!isNearBottom && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-10 group"
          title="Ir al último mensaje"
        >
          <ChevronDownIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Menú contextual mejorado */}
      {contextMenu?.isOpen && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[220px] overflow-hidden backdrop-blur-lg"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {contextMenu.userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opciones de usuario
            </p>
          </div>
          
          <button
            onClick={() => handleViewProfile(contextMenu.userId)}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 flex items-center space-x-3 transition-all duration-200"
          >
            <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Ver perfil</span>
          </button>
          
          {contextMenu.userId !== currentUserId && (
            <button
              onClick={() => handleStartPrivateChat(contextMenu.userId, contextMenu.userName)}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 flex items-center space-x-3 transition-all duration-200"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>Iniciar chat privado</span>
            </button>
          )}
        </div>
      )}

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
};

export default MessageList; 