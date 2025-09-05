'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import { useChatStore } from '@/stores/chatStore';
import ChatRoom from './ChatRoom';
// import { postgresChatService } from '@/services/postgresChatService'; // Usar store en su lugar
import { CommunityChat } from '@/types/chat';
import { toast } from 'react-hot-toast';
import { XMarkIcon, UserGroupIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunityChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  communityName: string;
}

const CommunityChatModal: React.FC<CommunityChatModalProps> = ({
  isOpen,
  onClose,
  communityId,
  communityName
}) => {
  const { user } = useAuthStore();
  const { checkSubscription, loadSubscribedCommunities, isLoadingSubscriptions } = useCommunitiesStore();
  const { setCurrentChat, reset } = useChatStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [communityChat, setCommunityChat] = useState<CommunityChat | null>(null);

  useEffect(() => {
    if (!isOpen || !user?._id) return;

    const checkAccess = async () => {
      setIsLoading(true);
      try {
        console.log('🚀 Iniciando verificación de acceso al chat');
        console.log('👤 Usuario:', user._id);
        console.log('🏘️ Comunidad:', communityId);
        
        // Primero cargar las suscripciones si no están cargadas
        console.log('📥 Cargando suscripciones...');
        await loadSubscribedCommunities();
        
        // Esperar un poco para asegurar que las suscripciones se hayan cargado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar si el usuario está suscrito a la comunidad
        console.log('🔍 Verificando suscripción...');
        const subscribed = checkSubscription(communityId);
        console.log('🔍 Verificación de suscripción:', {
          communityId,
          subscribed,
          user: user._id
        });

        // También verificar si el usuario es el creador de la comunidad
        // Necesitamos obtener la información de la comunidad para esto
        const { loadCommunity } = useCommunitiesStore.getState();
        await loadCommunity(communityId);
        const { currentCommunity } = useCommunitiesStore.getState();
        
        const isCreator = (currentCommunity as any)?.creator?._id === user._id;
        console.log('👑 Verificación de creador:', {
          isCreator,
          creatorId: (currentCommunity as any)?.creator?._id,
          userId: user._id
        });

        const hasAccess = subscribed || isCreator;
        console.log('✅ Acceso final:', { subscribed, isCreator, hasAccess });
        
        setIsSubscribed(hasAccess);

        if (hasAccess) {
          console.log('✅ Usuario tiene acceso, creando chat...');
          // Crear o obtener el chat de la comunidad en Postgres
          const { postgresChatService } = await import('@/services/postgresChatService');
          const chat = await postgresChatService.getOrCreateCommunityChat(communityId, communityName);
          if (chat) {
            setCommunityChat(chat as any);
            
            // Crear objeto ChatRoom completo para el store
            const chatRoom: CommunityChat = {
              id: chat.id,
              name: chat.name,
              type: 'community',
              communityId,
              communityName,
              participants: [], // Se llenará automáticamente por el backend
              updatedAt: new Date(),
              createdAt: new Date()
            };
            
            setCurrentChat(chatRoom); // ✅ CRÍTICO: Establecer chat actual en el store
            
            // Conectar a Socket.io y unirse al chat
            await postgresChatService.connectToSocket(user.firebaseUid || user._id);
            await postgresChatService.joinChat(chat.id);
          }
        } else {
          console.log('❌ Usuario no tiene acceso');
        }
      } catch (error) {
        console.error('Error al verificar acceso al chat:', error);
        toast.error('Error al acceder al chat de la comunidad');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isOpen, communityId, communityName, user?._id, checkSubscription, loadSubscribedCommunities]);

  const handleClose = () => {
    reset(); // ✅ Limpiar store de chat
    setCommunityChat(null);
    setIsSubscribed(false);
    setIsLoading(true);
    onClose();
  };

  if (!isOpen) return null;

  if (!user?._id) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop animado */}
          <motion.div 
            className="fixed inset-0 bg-gradient-to-br from-black/40 via-gray-900/50 to-black/60 backdrop-blur-md transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.div 
            className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200/60 dark:border-gray-700/60"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 px-6 pt-6 pb-4 sm:p-8">
              <div className="text-center">
                <motion.div 
                  className="relative mb-6 mx-auto w-20 h-20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center shadow-xl">
                    <UserGroupIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <motion.div 
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Authentication required
                </motion.h3>
                <motion.p 
                  className="text-gray-600 dark:text-gray-400 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  You must login to access the community chat
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50" 
          style={{ overflow: 'hidden' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Improved backdrop with gradient and blur */}
            <motion.div 
              className="fixed inset-0 bg-gradient-to-br from-black/40 via-gray-900/50 to-black/60 backdrop-blur-md transition-opacity" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleClose}
              onWheel={(e) => e.preventDefault()} 
            />
            
            <motion.div 
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden backdrop-blur-lg"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onWheel={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header mejorado con gradiente */}
              <motion.div 
                className="flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10 flex-shrink-0"
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
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <UserGroupIcon className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    <motion.div 
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {communityName}
                    </h3>
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
                      Community chat
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  className="group p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200"
                  title="Close chat"
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

              {/* Content con mejores estados */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10"
                    >
                      <div className="text-center p-8">
                        <motion.div 
                          className="relative mb-6"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
                          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full"></div>
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <UserGroupIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                          </motion.div>
                        </motion.div>
                        <motion.h3 
                          className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Verifying access
                        </motion.h3>
                        <motion.p 
                          className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Checking permissions to access the chat of {communityName}...
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
                              className="w-2 h-2 bg-purple-600 rounded-full"
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
                  ) : !isSubscribed ? (
                    <motion.div
                      key="no-access"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-red-50/30 dark:from-orange-900/10 dark:to-red-900/10"
                    >
                      <div className="text-center max-w-md p-8">
                        <motion.div 
                          className="relative mb-8 mx-auto w-24 h-24"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center shadow-xl">
                            <LockClosedIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                          </div>
                          <motion.div 
                            className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"
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
                          Restricted access
                        </motion.h3>
                        <motion.p 
                          className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          You must be subscribed to <span className="font-semibold text-purple-600 dark:text-purple-400">{communityName}</span> to access the community chat
                        </motion.p>
                        <motion.div 
                          className="flex flex-col sm:flex-row gap-4 justify-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.button
                            onClick={() => window.open(`/communities/${communityId}`, '_blank')}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View community
                          </motion.button>
                          <motion.button
                            onClick={handleClose}
                            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Close
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : communityChat ? (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="h-full overflow-hidden"
                    >
                      <ChatRoom
                        chatId={communityChat.id}
                        chatName={communityName}
                        chatType="community"
                        onClose={handleClose}
                        isModal={true}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center h-full bg-gradient-to-br from-red-50 to-pink-50/30 dark:from-red-900/10 dark:to-pink-900/10"
                    >
                      <div className="text-center p-8">
                        <motion.div 
                          className="relative mb-8 mx-auto w-24 h-24"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center shadow-xl">
                            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
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
                          Error loading the chat
                        </motion.h3>
                        <motion.p 
                          className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          Could not establish connection with the chat of <span className="font-semibold text-purple-600 dark:text-purple-400">{communityName}</span>
                        </motion.p>
                        <motion.div 
                          className="flex flex-col sm:flex-row gap-4 justify-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Try again
                          </motion.button>
                          <motion.button
                            onClick={handleClose}
                            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Close
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommunityChatModal; 