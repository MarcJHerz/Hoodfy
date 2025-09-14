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
  CheckIcon,
  ArrowDownTrayIcon
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

// Componente para opciones de mensaje con posicionamiento inteligente
const MessageOptionsButton: React.FC<{
  message: Message;
  onReplyToMessage?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  currentUserId: string;
  isOwnMessage: boolean;
}> = ({ message, onReplyToMessage, onAddReaction, onRemoveReaction, currentUserId, isOwnMessage }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'left' | 'right' | 'center'>('right');
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculateMenuPosition = () => {
    if (!buttonRef.current || !menuRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 20; // Padding mínimo desde el borde

    // Calcular espacio disponible en cada lado
    const spaceLeft = buttonRect.left;
    const spaceRight = viewportWidth - buttonRect.right;
    const estimatedMenuWidth = 280; // Ancho estimado del menú

    // Determinar posición horizontal
    let horizontalPosition: 'left' | 'right' | 'center' = 'right';
    
    if (isOwnMessage) {
      // Para mensajes propios, preferir izquierda
      if (spaceLeft >= estimatedMenuWidth + padding) {
        horizontalPosition = 'left';
      } else if (spaceRight >= estimatedMenuWidth + padding) {
        horizontalPosition = 'right';
      } else {
        // Si no hay espacio suficiente, centrar
        horizontalPosition = 'center';
      }
    } else {
      // Para mensajes de otros, preferir derecha
      if (spaceRight >= estimatedMenuWidth + padding) {
        horizontalPosition = 'right';
      } else if (spaceLeft >= estimatedMenuWidth + padding) {
        horizontalPosition = 'left';
      } else {
        // Si no hay espacio suficiente, centrar
        horizontalPosition = 'center';
      }
    }

    setMenuPosition(horizontalPosition);
  };

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showOptions) {
      // Calcular posición antes de mostrar
      setTimeout(() => {
        calculateMenuPosition();
      }, 10);
    }
    
    setShowOptions(!showOptions);
  };

  const handleOptionClick = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setShowOptions(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };

    const handleResize = () => {
      if (showOptions) {
        calculateMenuPosition();
      }
    };

    if (showOptions) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [showOptions]);

  return (
    <div className="relative">
      <button
        onClick={handleButtonClick}
        className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:scale-110 transition-all duration-150"
        title="Opciones del mensaje"
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {showOptions && (
        <div 
          ref={menuRef}
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 flex items-center space-x-1 animate-scale-in z-50 overflow-hidden"
          style={{
            // Posicionamiento inteligente basado en el espacio disponible
            bottom: '100%',
            marginBottom: '8px',
            width: 'max-content',
            position: 'absolute',
            zIndex: 1000,
            maxWidth: 'calc(100vw - 40px)',
            // Posicionamiento dinámico basado en el cálculo
            ...(menuPosition === 'left' ? {
              left: '0',
              right: 'auto',
              transform: 'translateX(-10px)'
            } : menuPosition === 'right' ? {
              left: 'auto',
              right: '0',
              transform: 'translateX(10px)'
            } : {
              left: '50%',
              right: 'auto',
              transform: 'translateX(-50%)'
            })
          }}
        >
          {/* Botón de respuesta */}
          <button
            onClick={(e) => handleOptionClick(e, () => {
              onReplyToMessage?.(message);
            })}
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
              onClick={(e) => handleOptionClick(e, () => {
                const existingReaction = message.reactions?.find(r => r.emoji === emoji);
                if (existingReaction?.users.includes(currentUserId)) {
                  onRemoveReaction?.(message.id, emoji);
                } else {
                  onAddReaction?.(message.id, emoji);
                }
              })}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150 hover:scale-110"
              title={`Reaccionar con ${emoji}`}
            >
              <span className="text-lg">{emoji}</span>
            </button>
          ))}

          {/* Botón para cerrar */}
          <button
            onClick={(e) => handleOptionClick(e, () => {})}
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

  // Auto-scroll optimizado para evitar saltos extraños
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      // Usar setTimeout para asegurar que el DOM se actualice
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [messages, shouldAutoScroll]);

  // Forzar scroll cuando se envía un mensaje propio
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId === currentUserId) {
        // Mensaje propio - forzar scroll
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end',
              inline: 'nearest'
            });
          }
        }, 150);
      }
    }
  }, [messages, currentUserId]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShouldAutoScroll(isAtBottom);
      setShowScrollToBottom(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'auto',
        block: 'end',
        inline: 'nearest'
      });
    }
    setShouldAutoScroll(true);
    setShowScrollToBottom(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full animate-bounce" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading messages...
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
            ¡Start the conversation!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Be the first to send a message and break the ice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden chat-container">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden px-3 py-2 space-y-2 scroll-smooth bg-gray-50 dark:bg-gray-900 chat-scroll" 
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const isConsecutiveMessage = index > 0 && messages[index - 1].senderId === message.senderId;
          const timeDiff = index > 0 ? new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() : 0;
          const isWithin5Minutes = timeDiff < 5 * 60 * 1000; // 5 minutos
          const shouldGroup = isConsecutiveMessage && isWithin5Minutes;

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} space-x-2 group ${shouldGroup ? 'mb-0.5' : 'mb-3'}`}>
              {!isOwnMessage && !shouldGroup && (
                <div className="flex-shrink-0">
                  <UserAvatar
                    size={32}
                    source={message.senderProfilePicture}
                    name={message.senderName}
                  />
                </div>
              )}
              {!isOwnMessage && shouldGroup && (
                <div className="flex-shrink-0 w-8"></div>
              )}

              <div className={`relative flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl`}>
                {!isOwnMessage && !shouldGroup && (
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                )}

                <div className={`
                  relative px-3 py-2 shadow-sm transition-all duration-200
                  ${isOwnMessage 
                    ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white ${shouldGroup ? 'rounded-lg' : 'rounded-xl rounded-br-md'}` 
                    : `bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 ${shouldGroup ? 'rounded-lg' : 'rounded-xl rounded-bl-md'}`
                  }
                `}>
                  {/* Mostrar respuesta a mensaje */}
                  {message.replyTo && (
                    <div className={`
                      mb-2 p-2 rounded-lg border-l-2 text-xs
                      ${isOwnMessage 
                        ? 'bg-blue-400/20 border-blue-300 text-blue-100' 
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      <div className="font-medium">
                        Respondiendo a {message.replyTo.senderName}
                      </div>
                      <div className="truncate">
                        {message.replyTo.content}
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar contenido según el tipo */}
                  {message.type === 'image' ? (
                    <div className="space-y-2">
                      <img 
                        src={message.mediaUrl || message.content} 
                        alt={message.content}
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        style={{ maxHeight: '300px' }}
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {message.content && message.content !== message.mediaUrl && (
                        <p className="text-sm leading-snug text-gray-600 dark:text-gray-400">
                          {message.content}
                        </p>
                      )}
                    </div>
                  ) : message.type === 'file' ? (
                    <div className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <DocumentIcon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.content}</p>
                        {message.mediaType && (
                          <p className="text-xs text-gray-500">{message.mediaType}</p>
                        )}
                      </div>
                      {message.mediaUrl && (
                        <a 
                          href={message.mediaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-snug">
                      {message.content}
                    </p>
                  )}

                  {isOwnMessage && (
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <span className="text-xs opacity-75">
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </span>
                      <CheckIcon className="w-3 h-3 opacity-75" />
                    </div>
                  )}
                </div>

                {/* Reacciones del mensaje */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1 ml-3">
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
                        title={`${reaction.emoji} - ${reaction.count} reacciones`}
                      >
                        <span className="text-sm">{reaction.emoji}</span>
                        {reaction.count > 1 && (
                          <span className="ml-1 font-semibold text-xs">
                            {reaction.count}
                          </span>
                        )}
                      </button>
                    ))}
                    
                    {/* Contador total de reacciones para chats grupales */}
                    {message.reactions.length > 1 && (
                      <div className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {message.reactions.reduce((total, r) => total + r.count, 0)} reacciones
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Botón de opciones de mensaje - Posicionado al lado del mensaje */}
                <div className={`absolute ${isOwnMessage ? 'left-0 -translate-x-12' : 'right-0 translate-x-12'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}>
                  <MessageOptionsButton
                    message={message}
                    onReplyToMessage={onReplyToMessage}
                    onAddReaction={onAddReaction}
                    onRemoveReaction={onRemoveReaction}
                    currentUserId={currentUserId}
                    isOwnMessage={isOwnMessage}
                  />
                </div>
              </div>

              {isOwnMessage && (
                <div className="flex-shrink-0">
                  <UserAvatar
                    size={40}
                    source={message.senderProfilePicture}
                    name={message.senderName}
                  />
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
          title="Ir al final del chat"
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
