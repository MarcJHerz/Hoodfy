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
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

    if (showOptions) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
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
          ref={buttonRef}
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 flex items-center space-x-1 animate-scale-in z-50"
          style={{
            // Posicionamiento inteligente basado en la posición del mensaje
            bottom: '100%',
            marginBottom: '8px',
            maxWidth: 'min(calc(100vw - 40px), 280px)',
            width: 'max-content',
            position: 'absolute',
            zIndex: 1000,
            // Posicionamiento dinámico
            ...(isOwnMessage ? {
              // Mensaje propio (derecha) - posicionar a la izquierda
              left: 'auto',
              right: '0',
              transform: 'none'
            } : {
              // Mensaje de otro (izquierda) - posicionar a la derecha
              left: '0',
              right: 'auto',
              transform: 'none'
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
      const hasReactions = messages.some(msg => msg.reactions && msg.reactions.length > 0);
      const hasReplies = messages.some(msg => msg.replyTo);
      
      const behavior = (hasReactions || hasReplies) ? 'auto' : 'smooth';
      
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages, shouldAutoScroll]);

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
        className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 scroll-smooth bg-gray-50 dark:bg-gray-900 chat-scroll" 
        style={{
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} space-x-3`}>
              {!isOwnMessage && (
                <div className="flex-shrink-0">
                  <UserAvatar
                    size={40}
                    source={message.senderProfilePicture}
                    name={message.senderName}
                  />
                </div>
              )}

              <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-2xl`}>
                {!isOwnMessage && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                )}

                <div className={`
                  relative group rounded-2xl px-4 py-3 shadow-sm transition-all duration-200
                  ${isOwnMessage 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  }
                `}>
                  <p className="text-sm leading-relaxed">
                    {message.content}
                  </p>

                  {isOwnMessage && (
                    <div className="flex items-center justify-end mt-2 space-x-1">
                      <span className="text-xs opacity-75">
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </span>
                      <CheckIcon className="w-3 h-3 opacity-75" />
                    </div>
                  )}
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

                {/* Botón de opciones de mensaje */}
                <div className={`flex items-center space-x-2 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
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
