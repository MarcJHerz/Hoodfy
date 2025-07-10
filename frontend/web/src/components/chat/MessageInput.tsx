'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
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
  placeholder = "Escribe un mensaje...",
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
      // Verificar si es HEIC/HEIF
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        
        console.log('🔄 Convirtiendo HEIC a JPEG en chat:', file.name);
        
        // Importar heic2any dinámicamente si no está disponible
        if (!heic2any) {
          const module = await import('heic2any');
          heic2any = module.default;
        }
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        
        // Crear nuevo archivo con nombre .jpg
        const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        const convertedFile = new File([convertedBlob as Blob], newFileName, {
          type: 'image/jpeg',
          lastModified: file.lastModified
        });
        
        console.log('✅ HEIC convertido exitosamente en chat:', {
          original: file.name,
          converted: newFileName
        });
        
        return convertedFile;
      }
      
      return file; // Retornar archivo original si no es HEIC
    } catch (error) {
      console.error('❌ Error convirtiendo HEIC en chat:', error);
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
      handleSubmit(e);
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

    onSendMessage(convertedFile.name, 'image', convertedFile);
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setShowFileMenu(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  };

  const openImageSelector = () => {
    imageInputRef.current?.click();  
    setShowFileMenu(false);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Botón para adjuntar archivos con menú desplegable */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowFileMenu(!showFileMenu)}
            disabled={isLoading || disabled}
            className="p-3 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:bg-transparent transition-all duration-200 rounded-full hover-lift"
            title="Adjuntar archivo"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          {/* Menú desplegable de archivos */}
          {showFileMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[150px] z-10">
              <button
                type="button"
                onClick={openImageSelector}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
              >
                <PhotoIcon className="h-4 w-4" />
                <span>Imagen</span>
              </button>
              <button
                type="button"
                onClick={openFileSelector}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
              >
                <DocumentIcon className="h-4 w-4" />
                <span>Archivo</span>
              </button>
            </div>
          )}
        </div>

        {/* Input de texto mejorado */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 
                     bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent 
                     disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400
                     transition-all duration-200"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          {/* Indicador de caracteres */}
          {message.length > 100 && (
            <div className="absolute bottom-1 right-12 text-xs text-gray-400 dark:text-gray-500">
              {message.length}/500
            </div>
          )}
        </div>

        {/* Botón de enviar mejorado */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className="flex-shrink-0 p-3 bg-gradient-to-r from-primary-600 to-accent-600 
                   hover:from-primary-700 hover:to-accent-700 
                   disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-600 dark:disabled:to-gray-700
                   text-white font-medium rounded-xl 
                   disabled:text-gray-500 dark:disabled:text-gray-400
                   transition-all duration-200 hover-lift shadow-lg hover:shadow-xl
                   disabled:shadow-none disabled:transform-none"
          title={message.trim() ? "Enviar mensaje" : "Escribe algo primero"}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : (
            <PaperAirplaneIcon className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Inputs ocultos para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleImageSelect}
        accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.heic,.heif"
        className="hidden"
      />

      {/* Indicador de escritura mejorado */}
      {isTyping && (
        <div className="mt-3 px-2">
          <div className="flex items-center space-x-2 text-xs text-primary-600 dark:text-primary-400">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="font-medium">Escribiendo...</span>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú */}
      {showFileMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowFileMenu(false)}
        />
      )}
    </div>
  );
};

export default MessageInput; 