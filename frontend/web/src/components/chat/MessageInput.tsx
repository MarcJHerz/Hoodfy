'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, PhotoIcon, DocumentIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
// Importación dinámica para evitar errores de SSR
let heic2any: any = null;
if (typeof window !== 'undefined') {
  import('heic2any').then(module => {
    heic2any = module.default;
  });
}

interface MessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Write a message...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();

  // Función para convertir HEIC a JPEG
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      // Verificar si es un archivo HEIC/HEIF
      const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') ||
                     file.type === 'image/heic' || 
                     file.type === 'image/heif';
      
      if (!isHeic) {
        console.log('📸 Archivo no es HEIC/HEIF, manteniendo original:', file.name);
        return file;
      }
      
      console.log('🔄 Iniciando conversión HEIC a JPEG:', file.name);
      
      // Importar heic2any dinámicamente
      const heic2any = (await import('heic2any')).default;
      
      // Convertir HEIC a JPEG
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      
      // Crear un nuevo archivo con el blob convertido
      const convertedFile = new File([convertedBlob as Blob], 
        file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
        { type: 'image/jpeg' }
      );
      
      console.log('✅ Conversión completada:', {
        original: file.name,
        converted: convertedFile.name,
        originalSize: file.size,
        convertedSize: convertedFile.size
      });
      
      return convertedFile;
    } catch (error) {
      console.error('❌ Error en conversión HEIC:', error);
      console.log('⚠️ Manteniendo archivo original:', file.name);
      return file;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || disabled || !user) return;

    onSendMessage(message.trim(), 'text');
    setMessage('');
    setIsTyping(false);
    setShowFileMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir HEIC si es necesario
    const convertedFile = await convertHeicToJpeg(file);

    const fileType = convertedFile.type;
    let messageType: 'image' | 'video' | 'file' = 'file';

    if (fileType.startsWith('image/')) {
      messageType = 'image';
    } else if (fileType.startsWith('video/')) {
      messageType = 'video';
    }

    // Crear un mensaje con el archivo convertido
    const fileName = convertedFile.name;
    onSendMessage(fileName, messageType, convertedFile);
    
    // Limpiar el input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowFileMenu(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir HEIC si es necesario
    const convertedFile = await convertHeicToJpeg(file);

    // Crear un mensaje con la imagen convertida
    const fileName = convertedFile.name;
    onSendMessage(fileName, 'image', convertedFile);
    
    // Limpiar el input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setShowFileMenu(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Menú de archivos mejorado */}
      {showFileMenu && (
        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Attach file
            </h4>
            <button
              onClick={() => setShowFileMenu(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <PhotoIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Image</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <DocumentIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-2" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">File</span>
            </button>
          </div>
        </div>
      )}

      {/* Formulario de mensaje completamente renovado */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Improved file button */}
        <button
          type="button"
          onClick={() => setShowFileMenu(!showFileMenu)}
          className="flex-shrink-0 p-3 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all duration-200 hover:scale-110 hover:shadow-md"
          title="Attach file"
        >
          <PaperClipIcon className="w-5 h-5" />
        </button>

        {/* Emoji button (placeholder for future implementations) */}
        <button
          type="button"
          className="flex-shrink-0 p-3 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-2xl transition-all duration-200 hover:scale-110 hover:shadow-md"
          title="Emojis (coming soon)"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </button>

        {/* Improved textarea with modern design */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            rows={1}
          />
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Writing...
            </div>
          )}
        </div>

        {/* Botón de enviar completamente renovado */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-xl disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed group"
          title="Send message"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          )}
        </button>
      </form>

      {/* Inputs ocultos para archivos */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput; 