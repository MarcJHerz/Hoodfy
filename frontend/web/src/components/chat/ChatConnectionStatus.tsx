import React from 'react';
import { useChatStore } from '@/stores/chatStore';
import { 
  SignalIcon, 
  SignalSlashIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const ChatConnectionStatus: React.FC = () => {
  const { connectionStatus, error } = useChatStore();

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: SignalIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: 'Conectado'
        };
      case 'connecting':
        return {
          icon: SignalIcon,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'Conectando...'
        };
      case 'disconnected':
        return {
          icon: SignalSlashIcon,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'Desconectado'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: 'Estado desconocido'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
      <Icon className={`h-4 w-4 ${statusInfo.color}`} />
      <span className={`text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
      {error && (
        <span className="text-xs text-red-600 ml-2">
          {error}
        </span>
      )}
    </div>
  );
};

export default ChatConnectionStatus; 