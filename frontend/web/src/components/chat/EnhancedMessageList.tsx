'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import { DocumentIcon, PhotoIcon, VideoCameraIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import MessageReactions from './MessageReactions';
import { MessageWithReply, ReplyPreview } from './MessageReplies';

interface EnhancedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  onMessageClick?: (message: Message) => void;
  onReply?: (message: Message) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

interface MessageStatus {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: Date;
}

const EnhancedMessageList: React.FC<EnhancedMessageListProps> = ({
  messages,
  isLoading,
  currentUserId,
  onMessageClick,
  onReply,
  replyingTo,
  onCancelReply,
  onAddReaction,
  onRemoveReaction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (!isUserScrolling && containerRef.current) {
      const container = containerRef.current;
      const shouldScroll = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (shouldScroll) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isUserScrolling]);

  // Detectar scroll del usuario
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    setIsUserScrolling(!isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth'
    });
    setIsUserScrolling(false);
    setShowScrollToBottom(false);
  };

  // Formatear timestamps de manera inteligente
  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm', { locale: es });
    } else if (isYesterday(timestamp)) {
      return 'Ayer ' + format(timestamp, 'HH:mm', { locale: es });
    } else if (isThisWeek(timestamp)) {
      return format(timestamp, 'EEEE HH:mm', { locale: es });
    } else if (isThisYear(timestamp)) {
      return format(timestamp, 'dd MMM HH:mm', { locale: es });
    } else {
      return format(timestamp, 'dd/MM/yyyy HH:mm', { locale: es });
    }
  };

  // Determinar si mostrar timestamp
  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  };

  // Determinar si mostrar separador de tiempo
  const shouldShowTimeSeparator = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime();
    return timeDiff > 60 * 60 * 1000; // 1 hora
  };

  // Colores únicos por usuario con mejor contraste
  const getUserColor = (userId: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-indigo-500', 
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-cyan-500',
      'from-pink-500 to-rose-500'
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Renderizar indicador de estado del mensaje
  const renderMessageStatus = (message: Message, isOwnMessage: boolean) => {
    if (!isOwnMessage) return null;

    const status: MessageStatus = {
      status: message.id.includes('temp') ? 'sending' : 'sent', // Simplificado para el ejemplo
      timestamp: message.timestamp
    };

    const getStatusIcon = () => {
      switch (status.status) {
        case 'sending':
          return <ClockIcon className="w-3 h-3 text-gray-400 animate-pulse" />;
        case 'sent':
          return <CheckIcon className="w-3 h-3 text-gray-400" />;
        case 'delivered':
          return (
            <div className="flex -space-x-1">
              <CheckIcon className="w-3 h-3 text-gray-400" />
              <CheckIcon className="w-3 h-3 text-gray-400" />
            </div>
          );
        case 'read':
          return (
            <div className="flex -space-x-1">
              <CheckIcon className="w-3 h-3 text-blue-500" />
              <CheckIcon className="w-3 h-3 text-blue-500" />
            </div>
          );
        case 'failed':
          return <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />;
        default:
          return null;
      }
    };

    return (
      <div className="flex items-center space-x-1 mt-1">
        {getStatusIcon()}
        <span className="text-xs text-gray-400">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    );
  };

  // Renderizar contenido multimedia mejorado
  const renderMediaContent = (message: Message) => {
    const imageUrl = useImageUrl(message.mediaUrl);

    switch (message.type) {
      case 'image':
        return (
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Image
                src={imageUrl || '/default-image.png'}
                alt="Imagen compartida"
                width={300}
                height={200}
                className="object-cover w-full h-auto max-w-sm rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => onMessageClick?.(message)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
            </div>
            {message.content && (
              <p className="mt-3 text-white/90 text-sm leading-relaxed">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              <video
                src={imageUrl || ''}
                controls
                className="w-full h-auto max-w-sm rounded-2xl"
                preload="metadata"
              />
            </div>
            {message.content && (
              <p className="mt-3 text-white/90 text-sm leading-relaxed">
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
          <p className="text-white/95 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
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
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <PhotoIcon className="w-12 h-12 text-white" />
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden">
      {/* Preview de respuesta */}
      <ReplyPreview replyingTo={replyingTo} onCancelReply={onCancelReply} />

      {/* Lista de mensajes */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 scroll-smooth bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10" 
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#e5e7eb #f9fafb',
        }}
      >
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            const showTimestamp = shouldShowTimestamp(message, index);
            const showTimeSeparator = shouldShowTimeSeparator(message, index);
            
            return (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Separador de tiempo */}
                {showTimeSeparator && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-8"
                  >
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </motion.div>
                )}
                
                <MessageWithReply 
                  message={message} 
                  isOwnMessage={isOwnMessage} 
                  onReply={onReply || (() => {})}
                >
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                      {/* Avatar con estado online/offline */}
                      {!isOwnMessage && (
                        <div className={`flex-shrink-0 relative ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="relative">
                            <UserAvatar
                              source={message.senderProfilePicture}
                              name={message.senderName}
                              size={44}
                              className="ring-2 ring-white dark:ring-gray-800 shadow-lg"
                            />
                            {/* Indicador de estado online */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm" />
                          </div>
                        </div>
                      )}

                      {/* Contenido del mensaje */}
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        {/* Nombre del remitente */}
                        {!isOwnMessage && showAvatar && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`text-sm font-bold mb-2 px-3 py-1 rounded-full bg-gradient-to-r ${getUserColor(message.senderId)} text-white shadow-sm`}
                          >
                            {message.senderName}
                          </motion.div>
                        )}

                        {/* Burbuja del mensaje */}
                        <div
                          className={`
                            relative px-5 py-4 rounded-3xl backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer
                            ${isOwnMessage
                              ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white ml-4'
                              : `bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4 border border-gray-200/50 dark:border-gray-700/50`
                            }
                          `}
                          onClick={() => onMessageClick?.(message)}
                        >
                          {renderMediaContent(message)}
                          
                          {/* Estado del mensaje y timestamp */}
                          {renderMessageStatus(message, isOwnMessage)}
                        </div>

                        {/* Reacciones */}
                        {onAddReaction && onRemoveReaction && (
                          <MessageReactions
                            messageId={message.id}
                            reactions={message.reactions || []}
                            currentUserId={currentUserId}
                            onAddReaction={onAddReaction}
                            onRemoveReaction={onRemoveReaction}
                            isOwnMessage={isOwnMessage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </MessageWithReply>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Botón de scroll hacia abajo */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedMessageList;
