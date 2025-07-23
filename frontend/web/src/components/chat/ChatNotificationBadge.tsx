'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatNotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showZero?: boolean;
  animated?: boolean;
}

export default function ChatNotificationBadge({ 
  className = '', 
  size = 'md',
  showZero = false,
  animated = true 
}: ChatNotificationBadgeProps) {
  const { getTotalUnreadCount } = useChatStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    const count = getTotalUnreadCount();
    const previousCount = unreadCount;
    
    setUnreadCount(count);
    setIsVisible(count > 0 || showZero);
    
    // Trigger change animation when count increases
    if (animated && count > previousCount && count > 0) {
      setHasChanged(true);
      setTimeout(() => setHasChanged(false), 1000);
    }
  }, [getTotalUnreadCount, showZero, animated, unreadCount]);

  // Tamaños de badge
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-[16px]',
    md: 'h-5 w-5 text-xs min-w-[20px]',
    lg: 'h-6 w-6 text-sm min-w-[24px]'
  };

  // Limitar el número mostrado
  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  if (!animated) {
    return isVisible ? (
      <span 
        className={`
          inline-flex items-center justify-center
          ${sizeClasses[size]}
          bg-gradient-to-r from-red-500 to-pink-600
          text-white font-bold
          rounded-full
          shadow-lg
          border-2 border-white dark:border-gray-900
          ${className}
        `}
        role="status"
        aria-label={`${unreadCount} mensajes no leídos`}
      >
        {displayCount}
      </span>
    ) : null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.span
          key={unreadCount} // Re-mount when count changes for fresh animations
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            transition: { 
              type: "spring", 
              stiffness: 500, 
              damping: 25,
              duration: 0.6
            }
          }}
          exit={{ 
            scale: 0, 
            opacity: 0,
            rotate: 180,
            transition: { duration: 0.2 }
          }}
          whileHover={{ 
            scale: 1.2,
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.9 }}
          className={`
            inline-flex items-center justify-center
            ${sizeClasses[size]}
            bg-gradient-to-r from-red-500 to-pink-600
            text-white font-bold
            rounded-full
            shadow-lg
            border-2 border-white dark:border-gray-900
            cursor-pointer
            ${className}
          `}
          role="status"
          aria-label={`${unreadCount} mensajes no leídos`}
        >
          {/* Pulse animation cuando hay cambios */}
          <motion.span
            animate={hasChanged ? {
              scale: [1, 1.3, 1],
              transition: { duration: 0.6, ease: "easeInOut" }
            } : {}}
          >
            {displayCount}
          </motion.span>

          {/* Ring effect cuando hay nuevos mensajes */}
          <AnimatePresence>
            {hasChanged && (
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ 
                  scale: 2.5, 
                  opacity: 0,
                  transition: { duration: 1, ease: "easeOut" }
                }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
              />
            )}
          </AnimatePresence>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Hook personalizado mejorado con feedback háptico
export function useChatNotifications() {
  const { getTotalUnreadCount } = useChatStore();
  const [count, setCount] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    const updateCount = () => {
      const newCount = getTotalUnreadCount();
      const wasUpdated = newCount > count;
      
      setCount(newCount);
      
      if (wasUpdated && newCount > 0) {
        setJustUpdated(true);
        
        // Feedback háptico en dispositivos móviles
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        setTimeout(() => setJustUpdated(false), 1000);
      }
    };

    updateCount();
    
    // Actualizar cada segundo
    const interval = setInterval(updateCount, 1000);
    
    return () => clearInterval(interval);
  }, [count, getTotalUnreadCount]);

  return {
    unreadCount: count,
    hasUnread: count > 0,
    formattedCount: count > 99 ? '99+' : count.toString(),
    justUpdated
  };
} 