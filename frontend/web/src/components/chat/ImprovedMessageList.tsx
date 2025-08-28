'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message, MessageReaction } from '@/types/chat';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import { 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  UserIcon, 
  ChatBubbleLeftIcon, 
  CheckIcon,
  HeartIcon,
  HandThumbUpIcon,
  FaceSmileIcon,
  FireIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/UserAvatar';

interface ImprovedMessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  onMessageClick?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: HeartIcon, color: 'text-red-500' },
  { emoji: '👍', icon: HandThumbUpIcon, color: 'text-blue-500' },
  { emoji: '😄', icon: FaceSmileIcon, color: 'text-yellow-500' },
  { emoji: '🔥', icon: FireIcon, color: 'text-orange-500' },
];

const ImprovedMessageList: React.FC<ImprovedMessageListProps> = ({
  messages,
  isLoading,
  currentUserId,
  onMessageClick,
  onReply,
  onAddReaction,
  onRemoveReaction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Generar colores únicos por usuario usando el sistema existente
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

  // Auto-scroll con mejoras
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
    setIsNearBottom(isAtBottom);
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShouldAutoScroll(true);
    setShowScrollToBottom(false);
  };

  // Formatear timestamps inteligentemente
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

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentTime = new Date(message.timestamp);
    const prevTime = new Date(prevMessage.timestamp);
    const timeDiff = currentTime.getTime() - prevTime.getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  };

  const shouldShowTimeSeparator = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentTime = new Date(message.timestamp);
    const prevTime = new Date(prevMessage.timestamp);
    const timeDiff = currentTime.getTime() - prevTime.getTime();
    return timeDiff > 60 * 60 * 1000; // 1 hora
  };

  // Componente de reacción mejorado
  const MessageReactions = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const reactions = message.reactions || [];

    const handleReactionClick = (emoji: string) => {
      const reaction = reactions.find(r => r.emoji === emoji);
      const userHasReacted = reaction?.users.includes(currentUserId);

      if (userHasReacted) {
        onRemoveReaction?.(message.id, emoji);
      } else {
        onAddReaction?.(message.id, emoji);
      }
    };

    if (!onAddReaction || !onRemoveReaction) return null;

    return (
      <div className={`flex flex-wrap gap-1 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        {reactions.map((reaction) => {
          const userHasReacted = reaction.users.includes(currentUserId);
          const reactionConfig = REACTION_EMOJIS.find(e => e.emoji === reaction.emoji);
          
          return (
            <button
              key={reaction.emoji}
              onClick={() => handleReactionClick(reaction.emoji)}
              className={`
                flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                ${userHasReacted 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {reactionConfig ? (
                <reactionConfig.icon className={`w-3 h-3 ${reactionConfig.color}`} />
              ) : (
                <span className="text-sm">{reaction.emoji}</span>
              )}
              <span className="font-semibold">{reaction.count}</span>
            </button>
          );
        })}

        {/* Botón para añadir reacción */}
        <div className="relative">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <span className="text-lg">+</span>
          </button>

          {/* Picker de reacciones */}
          {showReactionPicker && (
            <div className={`
              absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 
              flex space-x-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20
              animate-fade-in
            `}>
              {REACTION_EMOJIS.map((reaction) => {
                const Icon = reaction.icon;
                return (
                  <button
                    key={reaction.emoji}
                    onClick={() => {
                      handleReactionClick(reaction.emoji);
                      setShowReactionPicker(false);
                    }}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 ${reaction.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente para contenido multimedia
  const MediaContent: React.FC<{ message: Message }> = ({ message }) => {
    // Solo usar useImageUrl para tipos que realmente necesitan media
    const needsMedia = message.type === 'image' || message.type === 'video' || message.type === 'file';
    const { url: imageUrl, loading: imageLoading, error: imageError } = useImageUrl(needsMedia ? message.mediaUrl : undefined);

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
                  className="object-cover w-full h-auto max-w-sm rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => onMessageClick?.(message)}
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-2xl" />
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
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl hover-glow">
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
          const showTimeSeparator = shouldShowTimeSeparator(message, index);
          
          return (
            <div key={message.id} className="animate-fade-in">
              {/* Separador de tiempo */}
              {showTimeSeparator && (
                <div className="flex justify-center my-8">
                  <div className="glass px-4 py-2 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 shadow-lg">
                    {formatTimestamp(new Date(message.timestamp))}
                  </div>
                </div>
              )}
              
              {/* Mensaje principal */}
              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}>
                <div className={`flex max-w-[85%] md:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3`}>
                  {/* Avatar mejorado */}
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
                        {/* Indicador de estado online usando el sistema existente */}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Contenido del mensaje */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Nombre del remitente con gradiente único */}
                    {!isOwnMessage && showAvatar && (
                      <div className={`text-sm font-bold mb-2 px-3 py-1 rounded-full bg-gradient-to-r ${getUserColor(message.senderId)} text-white shadow-md hover:scale-105 transition-transform duration-200`}>
                        {message.senderName}
                      </div>
                    )}

                    {/* Burbuja del mensaje con hover mejorado */}
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

                      {/* Botón de respuesta (aparece al hover) */}
                      {onReply && (
                        <button
                          onClick={() => onReply(message)}
                          className={`
                            absolute ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
                            top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700
                            opacity-0 group-hover/message:opacity-100 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 z-10
                          `}
                          title="Responder a este mensaje"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                    </div>

                    {/* Reacciones */}
                    <MessageReactions message={message} isOwnMessage={isOwnMessage} />
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
          className="absolute bottom-6 right-6 p-3 btn-primary rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 animate-bounce-in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ImprovedMessageList;
