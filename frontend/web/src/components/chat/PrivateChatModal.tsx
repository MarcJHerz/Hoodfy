'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import ChatRoom from './ChatRoom';
import { chatService } from '@/services/chatService';
import { PrivateChat } from '@/types/chat';
import { User } from '@/types/user';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import Link from 'next/link';

interface PrivateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: User;
}

export default function PrivateChatModal({ isOpen, onClose, otherUser }: PrivateChatModalProps) {
  const { user } = useAuthStore();
  const { setCurrentChat, reset } = useChatStore();
  const [chat, setChat] = useState<PrivateChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user || !otherUser) return;

    const initializeChat = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Prevenir chat con uno mismo
        if (user._id === otherUser._id) {
          setError('No puedes crear un chat contigo mismo');
          setIsLoading(false);
          return;
        }

        // Buscar chat existente o crear uno nuevo
        let existingChat = await chatService.getPrivateChat(user._id, otherUser._id);
        
        if (!existingChat) {
          // Crear nuevo chat privado
          const chatId = await chatService.createPrivateChat(
            user._id,
            otherUser._id,
            otherUser.name,
            otherUser.profilePicture
          );
          
          existingChat = await chatService.getPrivateChat(user._id, otherUser._id);
        }

        if (existingChat && existingChat.type === 'private') {
          const privateChat = existingChat as PrivateChat;
          setChat(privateChat);
          setCurrentChat(privateChat);
        }
      } catch (error: any) {
        console.error('Error initializing private chat:', error);
        setError(error.message || 'Error al iniciar el chat. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [isOpen, user, otherUser, setCurrentChat]);

  const handleClose = () => {
    reset();
    setChat(null);
    setError(null);
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop mejorado */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header mejorado */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Chat con {otherUser.name}
                </Dialog.Title>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Conversación privada
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 hover-lift"
              title="Cerrar chat"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Iniciando chat
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Configurando la conversación con {otherUser.name}...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md p-8">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Necesitas ser aliados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {error}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/communities"
                      className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-medium rounded-lg transition-all duration-200 hover-lift shadow-lg"
                    >
                      Explorar comunidades
                    </Link>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover-lift"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            ) : chat ? (
              <ChatRoom 
                chatId={chat.id}
                chatName={chat.name}
                chatType="private"
                onClose={handleClose}
                isModal={true}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No se pudo cargar el chat
                  </p>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 