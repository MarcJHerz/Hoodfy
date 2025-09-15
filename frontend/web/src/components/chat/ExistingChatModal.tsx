'use client';

import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import ChatRoom from './ChatRoom';
import { ChatRoom as ChatRoomType } from '@/types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface ExistingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatRoomType;
}

export default function ExistingChatModal({ isOpen, onClose, chat }: ExistingChatModalProps) {
  const { user } = useAuthStore();
  const { setCurrentChat, reset } = useChatStore();

  const handleClose = () => {
    reset();
    onClose();
  };

  const getChatIcon = () => {
    if (chat.type === 'community') {
      return <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
    return <UserIcon className="w-6 h-6 text-green-600 dark:text-green-400" />;
  };

  const getChatName = () => {
    if (chat.type === 'community') {
      const communityChat = chat as any;
      return communityChat.communityName || chat.name || 'Comunidad';
    }
    
    // Para chats privados, usar la información de participantes
    const privateChat = chat as any;
    if (privateChat.participants && privateChat.participants.length > 0) {
      const otherParticipant = privateChat.participants.find((p: any) => p.user_id !== user?._id);
      if (otherParticipant && otherParticipant.name) {
        return otherParticipant.name;
      }
    }
    if (privateChat.otherUserName) {
      return privateChat.otherUserName;
    }
    return 'Usuario';
  };

  const getOtherUserInfo = () => {
    if (chat.type === 'private') {
      const privateChat = chat as any;
      if (privateChat.participants && privateChat.participants.length > 0) {
        const otherParticipant = privateChat.participants.find((p: any) => p.user_id !== user?._id);
        return {
          userId: otherParticipant?.user_id,
          profilePicture: otherParticipant?.profile_picture
        };
      }
      return {
        userId: privateChat.otherUserId,
        profilePicture: privateChat.otherUserProfilePicture
      };
    }
    return null;
  };

  if (!user) {
    return null;
  }

  const otherUserInfo = getOtherUserInfo();

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
                      {getChatIcon()}
                    </div>
                    <motion.div 
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {getChatName()}
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
                      {chat.type === 'community' ? 'Comunidad' : 'Conversación privada'}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ChatRoom 
                    chatId={chat.id}
                    chatName={getChatName()}
                    chatType={chat.type}
                    onClose={handleClose}
                    isModal={true}
                    otherUserProfilePicture={otherUserInfo?.profilePicture}
                    otherUserId={otherUserInfo?.userId}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
