'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import { DocumentIcon, PhotoIcon, VideoCameraIcon, UserIcon, ChatBubbleLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
    e.preventDefault();
    e.stopPropagation();
    if (userId !== currentUserId) {
    window.open(`/profile/${userId}`, '_blank');
    }
  };

  const handleUserContextMenu = (e: React.MouseEvent, userId: string, userName: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userId === currentUserId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      userId,
      userName
    });
  };

  const handleViewProfile = (userId: string) => {
    setContextMenu(null);
    window.open(`/profile/${userId}`, '_blank');
  };

  const handleStartPrivateChat = (userId: string, userName: string) => {
    setContextMenu(null);
      const userData: User = {
        _id: userId,
        name: userName,
        username: userName.toLowerCase().replace(/\s+/g, ''),
        email: '',
      profilePicture: '',
        bio: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedUserForChat(userData);
  };

  const handleClosePrivateChat = () => {
    setSelectedUserForChat(null);
  };

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu?.isOpen) {
        setContextMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <div className="relative rounded-lg overflow-hidden max-w-sm">
            <Image
                  src={message.mediaUrl}
                  alt={message.mediaName || 'Imagen'}
                  width={300}
              height={200}
                  className="object-cover hover:scale-105 transition-transform duration-200"
            />
              </div>
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <div className="relative rounded-lg overflow-hidden max-w-sm">
            <video
              src={message.mediaUrl}
              controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px' }}
            />
              </div>
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'file':
        const getFileIcon = (mediaType?: string) => {
          if (mediaType?.includes('pdf')) return DocumentIcon;
          if (mediaType?.includes('image')) return PhotoIcon;
          if (mediaType?.includes('video')) return VideoCameraIcon;
          return DocumentIcon;
        };

        const FileIcon = getFileIcon(message.mediaType);

        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
          <p className="text-sm whitespace-pre-wrap break-words message-content">
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
        className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-4 scroll-smooth bg-gray-50 dark:bg-gray-900 chat-scroll" 
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
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
              onClick={() => onMessageClick?.(message)}
            >
              <div className={`flex max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
                {/* Avatar solo para mensajes de otros usuarios */}
                {!isOwnMessage && (
                  <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <button
                    onClick={(e) => handleUserProfileClick(e, message.senderId)}
                    onContextMenu={(e) => handleUserContextMenu(e, message.senderId, message.senderName)}
                      className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-600 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                      title={`Ver perfil de ${message.senderName}`}
                  >
                    <UserAvatar
                      source={message.senderProfilePicture}
                      name={message.senderName}
                      size={32}
                    />
                  </button>
                </div>
                )}

                {/* Mensaje */}
                <div className={`flex flex-col min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {/* Nombre del remitente solo para mensajes de otros usuarios */}
                  {!isOwnMessage && showAvatar && (
                    <button
                      onClick={(e) => handleUserProfileClick(e, message.senderId)}
                      onContextMenu={(e) => handleUserContextMenu(e, message.senderId, message.senderName)}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors duration-200 focus:outline-none"
                      title={`Ver perfil de ${message.senderName}`}
                    >
                      {message.senderName}
                    </button>
                  )}

                  {/* Contenido del mensaje */}
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-full shadow-sm transition-all duration-200 hover:shadow-md word-wrap break-words ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    } ${message.type !== 'text' ? 'p-2' : ''}`}
                  >
                    {renderMessageContent(message)}
                  </div>

                  {/* Timestamp y estado de edición */}
                  {showTimestamp && (
                    <div className={`flex items-center mt-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(message.timestamp, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                    {message.isEdited && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                          (editado)
                        </span>
                    )}
                  </div>
                  )}
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
          className="absolute bottom-6 right-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover-lift z-10 group"
          title="Ir al último mensaje"
        >
          <ChevronDownIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Menú contextual mejorado */}
      {contextMenu?.isOpen && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] overflow-hidden"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {contextMenu.userName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opciones de usuario
            </p>
          </div>
          
          <button
            onClick={() => handleViewProfile(contextMenu.userId)}
            className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
          >
            <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Ver perfil</span>
          </button>
          
          {contextMenu.userId !== currentUserId && (
            <button
              onClick={() => handleStartPrivateChat(contextMenu.userId, contextMenu.userName)}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
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