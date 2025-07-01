'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import ChatRoom from './ChatRoom';
import { chatService } from '@/services/chatService';
import { CommunityChat } from '@/types/chat';
import { toast } from 'react-hot-toast';
import { XMarkIcon, UserGroupIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
          // Crear o obtener el chat de la comunidad
          const chat = await chatService.createOrGetCommunityChat(communityId, communityName);
          setCommunityChat(chat);
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
    setCommunityChat(null);
    setIsSubscribed(false);
    setIsLoading(true);
    onClose();
  };

  if (!isOpen) return null;

  if (!user?._id) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
          <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-900 px-6 pt-6 pb-4 sm:p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Autenticación requerida
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Debes iniciar sesión para acceder al chat
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" style={{ overflow: 'hidden' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
          onClick={handleClose}
          onWheel={(e) => e.preventDefault()} 
        />
        
        <div 
          className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header mejorado */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {communityName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chat de comunidad
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
          <div className="flex-1 overflow-hidden min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Verificando acceso
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Comprobando permisos para acceder al chat...
                  </p>
                </div>
              </div>
            ) : !isSubscribed ? (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md p-8">
                  <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockClosedIcon className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Acceso restringido
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    Debes estar suscrito a esta comunidad para acceder al chat grupal
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 hover-lift shadow-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : communityChat ? (
              <div className="h-full overflow-hidden">
                <ChatRoom
                  chatId={communityChat.id}
                  chatName={communityName}
                  chatType="community"
                  onClose={handleClose}
                  isModal={true}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Error al cargar el chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No se pudo establecer la conexión con el chat de la comunidad
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 hover-lift shadow-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatModal; 