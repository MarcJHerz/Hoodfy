'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import ChatRoom from './ChatRoom';
import { chatService } from '@/services/chatService';
import { CommunityChat } from '@/types/chat';
import { toast } from 'react-hot-toast';
import { useIsMobileOrTablet } from '@/hooks/useMediaQuery';
import CommunityChatModal from './CommunityChatModal';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface CommunityChatRoomProps {
  communityId: string;
  communityName: string;
}

const CommunityChatRoom: React.FC<CommunityChatRoomProps> = ({
  communityId,
  communityName
}) => {
  const { user } = useAuthStore();
  const { checkSubscription } = useCommunitiesStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [communityChat, setCommunityChat] = useState<CommunityChat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // Verificar si el usuario está suscrito a la comunidad
        const subscribed = checkSubscription(communityId);
        setIsSubscribed(subscribed);

        if (subscribed) {
          // Crear o obtener el chat de la comunidad
          const chat = await chatService.createOrGetCommunityChat(communityId, communityName);
          setCommunityChat(chat);
        }
      } catch (error) {
        console.error('Error al inicializar el chat:', error);
        toast.error('Error al cargar el chat de la comunidad');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [communityId, communityName, user?._id, checkSubscription]);

  // Detectar si estamos en mobile/tablet usando el hook personalizado
  const isMobileOrTablet = useIsMobileOrTablet();

  if (!user?._id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Debes iniciar sesión para acceder al chat</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso restringido
          </h3>
          <p className="text-gray-500">
            Debes estar suscrito a esta comunidad para acceder al chat
          </p>
        </div>
      </div>
    );
  }

  if (!communityChat) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Error al cargar el chat</p>
        </div>
      </div>
    );
  }

  // En mobile/tablet, mostrar botón para abrir modal
  if (isMobileOrTablet) {
    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chat de {communityName}
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Abrir Chat
            </button>
          </div>
        </div>

        <CommunityChatModal
          communityId={communityId}
          communityName={communityName}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // En desktop, mostrar el chat normal
  return (
    <div className="h-full">
      <ChatRoom
        chatId={communityChat.id}
        chatName={communityName}
        chatType="community"
      />
    </div>
  );
};

export default CommunityChatRoom; 