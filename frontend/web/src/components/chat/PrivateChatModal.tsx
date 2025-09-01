'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import ChatRoom from './ChatRoom';
import { postgresChatService } from '@/services/postgresChatService';
import { PrivateChat } from '@/types/chat';
import { User } from '@/types/user';
import { toast } from 'react-hot-toast';
import api from '@/services/api';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
          setError('You cannot create a chat with yourself');
          setIsLoading(false);
          return;
        }

        // Crear chat privado si no existe (en Postgres no buscamos por par aún)
        const chatId = await postgresChatService.createPrivateChat(`Chat with ${otherUser.name}`);
        const privateChat: any = { id: chatId, name: `Chat with ${otherUser.name}`, type: 'private' };
        setChat(privateChat);
        setCurrentChat(privateChat);
      } catch (error: any) {
        console.error('Error initializing private chat:', error);
        setError(error.message || 'Error initializing chat. Try again.');
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
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
          {/* Backdrop animado */}
          <motion.div 
            className="fixed inset-0 bg-gradient-to-br from-black/40 via-gray-900/50 to-black/60 backdrop-blur-md" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true" 
          />

          {/* Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 flex flex-col overflow-hidden backdrop-blur-lg"
            >
              {/* Header animado */}
              <motion.div 
                className="flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <UserIcon className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <motion.div 
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Chat with {otherUser.name}
                    </Dialog.Title>
                    <motion.p 
                      className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div 
                        className="w-2 h-2 bg-green-400 rounded-full mr-2"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      Private conversation
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="group p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200"
                  title="Cerrar chat"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </motion.div>
                </motion.button>
              </motion.div>

              {/* Content animado */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ 
                        delay: 0.2,
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10"
                    >
                      <div className="text-center p-8">
                        <motion.div 
                          className="relative mb-6"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
                          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full"></div>
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </motion.div>
                        </motion.div>
                        <motion.h3 
                          className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Initializing chat
                        </motion.h3>
                        <motion.p 
                          className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Configuring the conversation with {otherUser.name}...
                        </motion.p>
                        <motion.div 
                          className="mt-6 flex justify-center space-x-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ 
                        delay: 0.2,
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-red-50 to-orange-50/30 dark:from-red-900/10 dark:to-orange-900/10"
                    >
                      <div className="text-center max-w-md p-8">
                        <motion.div 
                          className="relative mb-8 mx-auto w-24 h-24"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center shadow-xl">
                            <ExclamationTriangleIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                          </div>
                          <motion.div 
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </motion.div>
                        <motion.h3 
                          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          You need to be allies
                        </motion.h3>
                        <motion.p 
                          className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {error}
                        </motion.p>
                        <motion.div 
                          className="flex flex-col sm:flex-row gap-4 justify-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link
                              href="/communities"
                              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl inline-block"
                            >
                              Explorar comunidades
                            </Link>
                          </motion.div>
                          <motion.button
                            onClick={handleClose}
                            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cerrar
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : chat ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <ChatRoom 
                        chatId={chat.id}
                        chatName={chat.name}
                        chatType="private"
                        onClose={handleClose}
                        isModal={true}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="fallback"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ 
                        delay: 0.2,
                        duration: 0.4,
                        ease: "easeOut"
                      }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                    >
                      <div className="text-center p-8">
                        <motion.div 
                          className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <UserIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                        </motion.div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          Could not load chat
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 