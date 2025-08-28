'use client';

import React, { useState } from 'react';
import { HeartIcon, HandThumbUpIcon, FaceSmileIcon, FireIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, HandThumbUpIcon as ThumbUpSolid, FaceSmileIcon as SmileSolid, FireIcon as FireSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  isOwnMessage: boolean;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: HeartIcon, iconSolid: HeartSolid, color: 'text-red-500' },
  { emoji: '👍', icon: HandThumbUpIcon, iconSolid: ThumbUpSolid, color: 'text-blue-500' },
  { emoji: '😄', icon: FaceSmileIcon, iconSolid: SmileSolid, color: 'text-yellow-500' },
  { emoji: '🔥', icon: FireIcon, iconSolid: FireSolid, color: 'text-orange-500' },
];

export default function MessageReactions({ 
  messageId, 
  reactions, 
  currentUserId, 
  onAddReaction, 
  onRemoveReaction,
  isOwnMessage 
}: MessageReactionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionDetails, setShowReactionDetails] = useState<string | null>(null);

  const handleReactionClick = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    const userHasReacted = reaction?.users.includes(currentUserId);

    if (userHasReacted) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
  };

  const handleQuickReaction = (emoji: string) => {
    handleReactionClick(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div className={`relative ${isOwnMessage ? 'flex justify-end' : 'flex justify-start'}`}>
      {/* Reacciones existentes */}
      <div className="flex flex-wrap gap-1 mt-2">
        {reactions.map((reaction) => {
          const userHasReacted = reaction.users.includes(currentUserId);
          const reactionConfig = REACTION_EMOJIS.find(e => e.emoji === reaction.emoji);
          
          return (
            <motion.button
              key={reaction.emoji}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleReactionClick(reaction.emoji)}
              onMouseEnter={() => setShowReactionDetails(reaction.emoji)}
              onMouseLeave={() => setShowReactionDetails(null)}
              className={`
                relative flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                ${userHasReacted 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {reactionConfig ? (
                <reactionConfig.icon className={`w-3 h-3 ${reactionConfig.color}`} />
              ) : (
                <span className="text-sm">{reaction.emoji}</span>
              )}
              <span className="font-semibold">{reaction.count}</span>

              {/* Tooltip con usuarios que reaccionaron */}
              {showReactionDetails === reaction.emoji && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10"
                >
                  {reaction.users.slice(0, 3).join(', ')}
                  {reaction.users.length > 3 && ` +${reaction.users.length - 3} más`}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black dark:border-t-gray-700"></div>
                </motion.div>
              )}
            </motion.button>
          );
        })}

        {/* Botón para añadir reacción */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <span className="text-lg">+</span>
          </motion.button>

          {/* Picker de reacciones */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`
                  absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 
                  flex space-x-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-20
                `}
              >
                {REACTION_EMOJIS.map((reaction) => {
                  const Icon = reaction.icon;
                  return (
                    <motion.button
                      key={reaction.emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuickReaction(reaction.emoji)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${reaction.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
