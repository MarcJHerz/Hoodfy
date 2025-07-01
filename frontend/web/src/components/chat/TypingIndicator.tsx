import React from 'react';
import { useChatStore } from '@/stores/chatStore';

const TypingIndicator: React.FC = () => {
  const { typingUsers } = useChatStore();

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} y ${typingUsers[1]} están escribiendo...`;
    } else {
      return `${typingUsers[0]} y ${typingUsers.length - 1} más están escribiendo...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator; 