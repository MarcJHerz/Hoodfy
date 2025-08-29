'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  PhotoIcon, 
  DocumentIcon, 
  FaceSmileIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { Message } from '@/types/chat';
import { auth } from '@/config/firebase';

interface ImprovedMessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'file', file?: File, replyTo?: Message, s3Key?: string, s3Url?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  chatId?: string; // Añadir chatId
}

const QUICK_EMOJIS = [
  '😀', '😂', '❤️', '👍', '👏', '🔥', '💯', '🎉', '😍', '🤔', '😭', '🙏'
];

const ImprovedMessageInput: React.FC<ImprovedMessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  replyingTo,
  onCancelReply,
  chatId
}) => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize del textarea usando el patrón existente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message.trim(), 'text', undefined, replyingTo || undefined);
    setMessage('');
    setIsTyping(false);
    
    // Limpiar respuesta después de enviar
    if (replyingTo && onCancelReply) {
      onCancelReply();
    }
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileSelect = async (type: 'file' | 'image' | 'video') => {
    const input = type === 'image' ? imageInputRef.current : 
                 type === 'video' ? videoInputRef.current : 
                 fileInputRef.current;
    
    input?.click();
    setShowAttachmentMenu(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    let messageType: 'text' | 'image' | 'video' | 'file' = 'file';
    
    if (type === 'image' || file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (type === 'video' || file.type.startsWith('video/')) {
      messageType = 'video';
    }

    try {
      // Subir archivo a S3
      console.log('📎 Subiendo archivo a S3:', file.name);
      console.log('🔍 Detalles del archivo:', {
        name: file.name,
        size: file.size,
        type: file.type,
        chatId: chatId || 'unknown-chat'
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', chatId || 'unknown-chat');
      
      const token = await auth.currentUser?.getIdToken();
      console.log('🔑 Token obtenido:', token ? '✅' : '❌');
      
      // Usar el mismo patrón que el resto del proyecto
      const API_URL = typeof window !== 'undefined' ? 
        (window.location.hostname === 'hoodfy.com' || window.location.hostname === 'www.hoodfy.com' 
          ? 'https://api.hoodfy.com' 
          : 'https://api.qahood.com') 
        : 'https://api.qahood.com';

      console.log('🌐 API URL:', API_URL);
      console.log('📤 FormData entries:', Array.from(formData.entries()));

      const response = await fetch(`${API_URL}/api/upload/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error uploading file');
      }

      const uploadResult = await response.json();
      console.log('✅ Archivo subido a S3:', uploadResult);

      // Enviar mensaje con URL de S3
      onSendMessage(file.name, messageType, file, replyingTo || undefined, uploadResult.key, uploadResult.url);
      
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      // Fallback: enviar sin S3
      onSendMessage(file.name, messageType, file, replyingTo || undefined);
    }
    
    // Limpiar respuesta después de enviar archivo
    if (replyingTo && onCancelReply) {
      onCancelReply();
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Preview de respuesta usando el sistema existente */}
      {replyingTo && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Responding to {replyingTo.senderName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:scale-110"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Menú de archivos adjuntos usando el sistema card existente */}
        {showAttachmentMenu && (
          <div className="mb-4 card p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <PaperClipIcon className="w-4 h-4" />
                <span>Attach file</span>
              </h4>
              <button
                onClick={() => setShowAttachmentMenu(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:scale-110"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleFileSelect('image')}
                className="card-interactive flex flex-col items-center p-4 hover:shadow-lg hover:scale-105"
              >
                <PhotoIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</span>
              </button>

              <button
                onClick={() => handleFileSelect('video')}
                className="card-interactive flex flex-col items-center p-4 hover:shadow-lg hover:scale-105"
              >
                <VideoCameraIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video</span>
              </button>

              <button
                onClick={() => handleFileSelect('file')}
                className="card-interactive flex flex-col items-center p-4 hover:shadow-lg hover:scale-105"
              >
                <DocumentIcon className="w-8 h-8 text-green-500 dark:text-green-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivo</span>
              </button>
            </div>
          </div>
        )}

        {/* Picker de emojis usando el sistema existente */}
        {showEmojiPicker && (
          <div className="mb-4 card p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <FaceSmileIcon className="w-4 h-4" />
                <span>Frequent emojis</span>
              </h4>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:scale-110"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-3 text-2xl hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-120"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input principal usando el sistema input existente */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Botones de acciones usando btn existente */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`btn-ghost p-3 rounded-xl hover:scale-110 ${
                showAttachmentMenu 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : ''
              }`}
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`btn-ghost p-3 rounded-xl hover:scale-110 ${
                showEmojiPicker 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                  : ''
              }`}
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Área de texto usando el sistema input-field existente */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="input-field w-full min-h-[48px] max-h-[120px] rounded-2xl resize-none"
              style={{ scrollbarWidth: 'thin' }}
            />
            
            {/* Indicador de escritura usando animaciones existentes */}
            {isTyping && (
              <div className="absolute bottom-2 right-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Botón de enviar usando btn-primary existente */}
          {message.trim() ? (
            <button
              type="submit"
              disabled={disabled || isLoading}
              className="btn-primary p-3 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary p-3 rounded-xl hover:scale-105 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400"
              title="Record voice message"
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Inputs de archivos ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={(e) => handleFileChange(e, 'file')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'image')}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={(e) => handleFileChange(e, 'video')}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImprovedMessageInput;
