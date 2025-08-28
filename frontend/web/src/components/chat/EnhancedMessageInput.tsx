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
  XMarkIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'file', file?: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  replyingTo?: any;
  onCancelReply?: () => void;
}

interface EmojiOption {
  emoji: string;
  name: string;
  category: string;
}

const QUICK_EMOJIS = [
  { emoji: '😀', name: 'sonrisa', category: 'caras' },
  { emoji: '😂', name: 'risa', category: 'caras' },
  { emoji: '❤️', name: 'corazón', category: 'símbolos' },
  { emoji: '👍', name: 'pulgar arriba', category: 'gestos' },
  { emoji: '👏', name: 'aplausos', category: 'gestos' },
  { emoji: '🔥', name: 'fuego', category: 'símbolos' },
  { emoji: '💯', name: 'cien', category: 'símbolos' },
  { emoji: '🎉', name: 'celebración', category: 'objetos' },
  { emoji: '😍', name: 'ojos de corazón', category: 'caras' },
  { emoji: '🤔', name: 'pensativo', category: 'caras' },
  { emoji: '😭', name: 'llorando', category: 'caras' },
  { emoji: '🙏', name: 'manos juntas', category: 'gestos' },
];

const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  replyingTo,
  onCancelReply
}) => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout>();

  // Auto-resize del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Timer de grabación
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message.trim(), 'text');
    setMessage('');
    setIsTyping(false);
    
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

    onSendMessage(file.name, messageType, file);
    
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

  const startRecording = () => {
    setIsRecording(true);
    // Aquí implementarías la lógica de grabación de audio
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Aquí enviarías el audio grabado
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {/* Preview de respuesta */}
      {replyingTo && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Respondiendo a {replyingTo.senderName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                  {replyingTo.content}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Menú de archivos adjuntos */}
        <AnimatePresence>
          {showAttachmentMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <PaperClipIcon className="w-4 h-4" />
                  <span>Adjuntar archivo</span>
                </h4>
                <button
                  onClick={() => setShowAttachmentMenu(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFileSelect('image')}
                  className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <PhotoIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFileSelect('video')}
                  className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <VideoCameraIcon className="w-8 h-8 text-purple-500 dark:text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleFileSelect('file')}
                  className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <DocumentIcon className="w-8 h-8 text-green-500 dark:text-green-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivo</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Picker de emojis */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <FaceSmileIcon className="w-4 h-4" />
                  <span>Emojis frecuentes</span>
                </h4>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {QUICK_EMOJIS.map((item) => (
                  <motion.button
                    key={item.emoji}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiSelect(item.emoji)}
                    className="p-3 text-2xl hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors"
                    title={item.name}
                  >
                    {item.emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input principal */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Botones de acciones */}
          <div className="flex space-x-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                showAttachmentMenu 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <PaperClipIcon className="w-5 h-5" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${
                showEmojiPicker 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FaceSmileIcon className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Área de texto */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full min-h-[48px] max-h-[120px] p-4 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              style={{ scrollbarWidth: 'thin' }}
            />
            
            {/* Indicador de escritura */}
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

          {/* Botón de grabar o enviar */}
          {message.trim() ? (
            <motion.button
              type="submit"
              disabled={disabled || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400'
              }`}
            >
              {isRecording ? (
                <div className="flex items-center space-x-2">
                  <SpeakerWaveIcon className="w-5 h-5" />
                  <span className="text-xs font-mono">{formatRecordingTime(recordingTime)}</span>
                </div>
              ) : (
                <MicrophoneIcon className="w-5 h-5" />
              )}
            </motion.button>
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

export default EnhancedMessageInput;
