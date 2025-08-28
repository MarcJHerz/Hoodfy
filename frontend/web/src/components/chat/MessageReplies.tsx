'use client';

import React, { useState } from 'react';
import { ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types/chat';
import { UserAvatar } from '@/components/UserAvatar';

interface MessageRepliesProps {
  message: Message;
  isOwnMessage: boolean;
  onReply: (originalMessage: Message) => void;
}

interface ReplyPreviewProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export function MessageWithReply({ message, isOwnMessage, onReply }: MessageRepliesProps) {
  return (
    <div className="group">
      {/* Mensaje original siendo respondido */}
      {message.replyTo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-2 ${isOwnMessage ? 'ml-8' : 'mr-8'}`}
        >
          <div className={`
            relative pl-4 border-l-4 border-blue-400 dark:border-blue-500 
            bg-gray-50 dark:bg-gray-800/50 rounded-r-lg p-3
            ${isOwnMessage ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          `}>
            <div className="flex items-center space-x-2 mb-1">
              <UserAvatar 
                source={message.replyTo.senderProfilePicture} 
                name={message.replyTo.senderName} 
                size={20} 
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {message.replyTo.senderName}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {message.replyTo.content}
            </p>
          </div>
        </motion.div>
      )}

      {/* Botón de respuesta que aparece al hover */}
      <div className="relative">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReply(message)}
          className={`
            absolute ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
            top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700
            opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 z-10
          `}
          title="Responder a este mensaje"
        >
          <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </motion.button>
      </div>
    </div>
  );
}

export function ReplyPreview({ replyingTo, onCancelReply }: ReplyPreviewProps) {
  if (!replyingTo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mx-4 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <ArrowUturnLeftIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Respondiendo a {replyingTo.senderName}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageWithReply;
