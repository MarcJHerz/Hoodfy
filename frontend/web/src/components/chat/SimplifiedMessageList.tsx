'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  ChatBubbleLeftIcon, 
  CheckIcon
} from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/UserAvatar';

interface SimplifiedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  onMessageClick?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onReplyToMessage?: (message: Message) => void;
}

// Componente para opciones de mensaje mejorado
const MessageOptionsButton: React.FC<{
  message: Message;
  onReplyToMessage?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  currentUserId: string;
}> = ({ message, onReplyToMessage, onAddReaction, onRemoveReaction, currentUserId }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseDown = () => {
    timeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      setShowOptions(true);
    }, 500); // 500ms para long press
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPress) {
      // Click normal - toggle options
      setShowOptions(!showOptions);
    }
    setIsLongPress(false);
  };

  const handleTouchStart = () => {
    timeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      setShowOptions(true);
    }, 800); // 800ms para mobile long press
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPress) {
      setShowOptions(!showOptions);
    }
    setIsLongPress(false);
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:scale-110 transition-all duration-150"
        title="Opciones del mensaje"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Menú de opciones */}
      {showOptions && (
        <div className="absolute top-0 right-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 flex items-center space-x-1 animate-scale-in z-50">
          {/* Botón de respuesta */}
          <button
            onClick={() => {
              onReplyToMessage?.(message);
              setShowOptions(false);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Responder"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          {/* Emojis de reacción */}
          {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                const existingReaction = message.reactions?.find(r => r.emoji === emoji);
                if (existingReaction?.users.includes(currentUserId)) {
                  onRemoveReaction?.(message.id, emoji);
                } else {
                  onAddReaction?.(message.id, emoji);
                }
                setShowOptions(false);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 hover:scale-110"
              title={`Reaccionar con ${emoji}`}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}

          {/* Botón para cerrar */}
          <button
            onClick={() => setShowOptions(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ml-2"
            title="Cerrar"
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

const SimplifiedMessageList: React.FC<SimplifiedMessageListProps> = ({
  messages,
  isLoading,
  currentUserId,
  onMessageClick,
  onAddReaction,
  onRemoveReaction,
  onReplyToMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Generar colores únicos por usuario
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
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Auto-scroll
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Detectar posición del scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    setShouldAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShouldAutoScroll(true);
    setShowScrollToBottom(false);
  };

  // Formatear timestamps
  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm', { locale: es });
    } else if (isYesterday(timestamp)) {
      return 'Ayer ' + format(timestamp, 'HH:mm', { locale: es });
    } else {
      return format(timestamp, 'dd/MM HH:mm', { locale: es });
    }
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentTime = new Date(message.timestamp);
    const prevTime = new Date(prevMessage.timestamp);
    const timeDiff = currentTime.getTime() - prevTime.getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  };

  // Componente para contenido multimedia
  const MediaContent: React.FC<{ message: Message }> = ({ message }) => {
    // Solo usar useImageUrl para tipos que realmente necesitan media
    const needsMedia = message.type === 'image' || message.type === 'video' || message.type === 'file';
    const { url: imageUrl, loading: imageLoading } = useImageUrl(needsMedia ? message.mediaUrl : undefined);
    
    switch (message.type) {
      case 'image':
        return (
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              {imageLoading ? (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl flex items-center justify-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                </div>
              ) : (
                <Image
                  src={imageUrl || '/default-image.png'}
                  alt="Imagen compartida"
                  width={300}
                  height={200}
                  className="object-cover w-full h-auto max-w-sm rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105"
                  onClick={() => onMessageClick?.(message)}
                />
              )}
            </div>
            {message.content && (
              <p className="mt-3 text-current text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              {imageLoading ? (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl flex items-center justify-center">
                  <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                </div>
              ) : (
                <video
                  src={imageUrl || ''}
                  controls
                  className="w-full h-auto max-w-sm rounded-2xl"
                  preload="metadata"
                />
              )}
            </div>
            {message.content && (
              <p className="mt-3 text-current text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-xl">
              <DocumentIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {message.mediaName || 'Archivo'}
              </p>
              <p className="text-white/70 text-sm">
                Toca para descargar
              </p>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-current text-sm leading-relaxed whitespace-pre-wrap word-wrap message-content">
            {message.content}
          </p>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full animate-bounce" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Cargando mensajes...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ChatBubbleLeftIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            ¡Comienza la conversación!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Sé el primero en enviar un mensaje y rompe el hielo. Las mejores amistades comienzan con una simple conversación.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
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
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 scroll-smooth bg-gray-50 dark:bg-gray-900 chat-scroll" 
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          const showTimestamp = shouldShowTimestamp(message, index);
          
          return (
            <div key={message.id} className="animate-fade-in">
              {/* Separador de tiempo */}
              {showTimestamp && (
                <div className="flex justify-center my-8">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 shadow-lg">
                    {formatTimestamp(new Date(message.timestamp))}
                  </div>
                </div>
              )}
              
              {/* Mensaje principal */}
              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                  {/* Avatar */}
                  {!isOwnMessage && (
                    <div className={`flex-shrink-0 relative ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="relative hover:scale-110 transition-transform duration-300">
                        <div className="ring-2 ring-white dark:ring-gray-800 shadow-lg rounded-2xl overflow-hidden">
                          <UserAvatar
                            source={message.senderProfilePicture}
                            name={message.senderName}
                            size={44}
                          />
                        </div>
                        {/* Indicador de estado online */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Contenido del mensaje */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Nombre del remitente */}
                    {!isOwnMessage && showAvatar && (
                      <div className={`text-sm font-bold mb-2 px-3 py-1 rounded-full bg-gradient-to-r ${getUserColor(message.senderId)} text-white shadow-md hover:scale-105 transition-transform duration-200`}>
                        {message.senderName}
                      </div>
                    )}

                    {/* Burbuja del mensaje */}
                    <div className="relative group/message">
                      <div
                        className={`
                          relative px-5 py-4 rounded-3xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer
                          ${isOwnMessage
                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white ml-4'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4 border border-gray-200/50 dark:border-gray-700/50'
                          }
                        `}
                        style={isOwnMessage ? { borderBottomRightRadius: '8px' } : { borderBottomLeftRadius: '8px' }}
                        onClick={() => onMessageClick?.(message)}
                      >
                        {/* Respuesta al mensaje original */}
                        {message.replyTo && (
                          <div className="mb-3 p-2 bg-black/10 dark:bg-white/10 rounded-lg border-l-2 border-blue-500">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                              Respondiendo a {message.replyTo.senderName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {message.replyTo.content || `${message.replyTo.type === 'image' ? '📷' : message.replyTo.type === 'video' ? '🎥' : '📄'} Archivo multimedia`}
                            </p>
                          </div>
                        )}

                        <MediaContent message={message} />
                        
                        {/* Estado del mensaje y timestamp */}
                        <div className="flex items-center justify-end mt-2 space-x-1">
                          <span className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTimestamp(new Date(message.timestamp))}
                          </span>
                          {isOwnMessage && (
                            <CheckIcon className="w-3 h-3 text-white/70" />
                          )}
                        </div>
                      </div>

                      {/* Reacciones del mensaje */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2 ml-4">
                          {message.reactions.map((reaction, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                if (reaction.users.includes(currentUserId)) {
                                  onRemoveReaction?.(message.id, reaction.emoji);
                                } else {
                                  onAddReaction?.(message.id, reaction.emoji);
                                }
                              }}
                              className={`
                                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-110
                                ${reaction.users.includes(currentUserId) 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Botón de opciones de mensaje */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <MessageOptionsButton 
                          message={message}
                          onReplyToMessage={onReplyToMessage}
                          onAddReaction={onAddReaction}
                          onRemoveReaction={onRemoveReaction}
                          currentUserId={currentUserId}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Botón de scroll hacia abajo */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 p-3 btn-primary rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SimplifiedMessageList;
