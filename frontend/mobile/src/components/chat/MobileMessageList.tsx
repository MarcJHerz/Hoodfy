import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Message } from '../../types/chat';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface MobileMessageListProps {
  messages: Message[];
  currentUserId: string;
  onMessagePress?: (message: Message) => void;
  onMessageLongPress?: (message: Message) => void;
  onUserPress?: (userId: string) => void;
  theme: 'light' | 'dark';
}

const { width: screenWidth } = Dimensions.get('window');

const MobileMessageList: React.FC<MobileMessageListProps> = ({
  messages,
  currentUserId,
  onMessagePress,
  onMessageLongPress,
  onUserPress,
  theme = 'light'
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const colors = {
    light: {
      background: '#f8fafc',
      messageOwn: ['#3b82f6', '#8b5cf6', '#ec4899'],
      messageOther: '#ffffff',
      textOwn: '#ffffff',
      textOther: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      timeContainer: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      background: '#111827',
      messageOwn: ['#1d4ed8', '#7c3aed', '#db2777'],
      messageOther: '#1f2937',
      textOwn: '#ffffff',
      textOther: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      timeContainer: '#374151',
      shadow: 'rgba(0, 0, 0, 0.3)',
    }
  };

  const currentColors = colors[theme];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [messages]);

  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm', { locale: es });
    } else if (isYesterday(timestamp)) {
      return 'Ayer ' + format(timestamp, 'HH:mm', { locale: es });
    } else {
      return format(timestamp, 'dd/MM HH:mm', { locale: es });
    }
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff = message.timestamp.getTime() - prevMessage.timestamp.getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  };

  const shouldShowAvatar = (message: Message, index: number) => {
    if (message.senderId === currentUserId) return false;
    if (index === messages.length - 1) return true;
    const nextMessage = messages[index + 1];
    return nextMessage.senderId !== message.senderId;
  };

  const getUserColor = (userId: string) => {
    const colorPalettes = [
      ['#f59e0b', '#f97316'],
      ['#3b82f6', '#1d4ed8'],
      ['#10b981', '#059669'],
      ['#8b5cf6', '#7c3aed'],
      ['#ef4444', '#dc2626'],
      ['#06b6d4', '#0891b2'],
      ['#84cc16', '#65a30d'],
      ['#f97316', '#ea580c'],
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    return colorPalettes[Math.abs(hash) % colorPalettes.length];
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === currentUserId;
    const showAvatar = shouldShowAvatar(message, index);
    const showTimestamp = shouldShowTimestamp(message, index);
    const userColors = getUserColor(message.senderId);

    return (
      <Animated.View
        key={message.id}
        style={[
          styles.messageContainer,
          { opacity: fadeAnim },
          isOwnMessage && styles.ownMessageContainer,
        ]}
      >
        {/* Timestamp separator */}
        {showTimestamp && (
          <View style={styles.timestampContainer}>
            <View style={[styles.timestampBubble, { backgroundColor: currentColors.timeContainer }]}>
              <Text style={[styles.timestampText, { color: currentColors.textSecondary }]}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.messageRow, isOwnMessage && styles.ownMessageRow]}>
          {/* Avatar */}
          {!isOwnMessage && (
            <View style={[styles.avatarContainer, !showAvatar && styles.hiddenAvatar]}>
              {showAvatar && (
                <TouchableOpacity
                  onPress={() => onUserPress?.(message.senderId)}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: userColors[0],
                      shadowColor: currentColors.shadow,
                    }
                  ]}
                >
                  {message.senderProfilePicture ? (
                    <Image
                      source={{ uri: message.senderProfilePicture }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {message.senderName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                  {/* Online indicator */}
                  <View style={styles.onlineIndicator} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Message content */}
          <View style={[styles.messageContent, isOwnMessage && styles.ownMessageContent]}>
            {/* Sender name */}
            {!isOwnMessage && showAvatar && (
              <TouchableOpacity onPress={() => onUserPress?.(message.senderId)}>
                <Text style={[styles.senderName, { color: userColors[0] }]}>
                  {message.senderName}
                </Text>
              </TouchableOpacity>
            )}

            {/* Message bubble */}
            <TouchableOpacity
              onPress={() => onMessagePress?.(message)}
              onLongPress={() => onMessageLongPress?.(message)}
              style={[
                styles.messageBubble,
                isOwnMessage 
                  ? [styles.ownMessageBubble, { backgroundColor: currentColors.messageOwn[0] }]
                  : [styles.otherMessageBubble, { backgroundColor: currentColors.messageOther, borderColor: currentColors.border }],
                {
                  shadowColor: currentColors.shadow,
                  elevation: Platform.OS === 'android' ? 3 : 0,
                }
              ]}
            >
              {renderMessageContent(message, isOwnMessage)}
              
              {/* Message status and time */}
              <View style={styles.messageFooter}>
                <Text style={[
                  styles.messageTime,
                  { color: isOwnMessage ? currentColors.textOwn : currentColors.textSecondary }
                ]}>
                  {format(message.timestamp, 'HH:mm', { locale: es })}
                </Text>
                
                {isOwnMessage && (
                  <View style={styles.messageStatus}>
                    <Text style={[styles.statusIcon, { color: currentColors.textOwn }]}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderMessageContent = (message: Message, isOwnMessage: boolean) => {
    const textColor = isOwnMessage ? currentColors.textOwn : currentColors.textOther;

    switch (message.type) {
      case 'image':
        return (
          <View>
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[styles.messageText, { color: textColor, marginTop: 8 }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'video':
        return (
          <View>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.mediaUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
            {message.content && (
              <Text style={[styles.messageText, { color: textColor, marginTop: 8 }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'file':
        return (
          <View style={styles.fileContainer}>
            <View style={[styles.fileIcon, { backgroundColor: currentColors.border }]}>
              <Text style={[styles.fileIconText, { color: currentColors.textSecondary }]}>
                📄
              </Text>
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
                {message.mediaName || 'Archivo'}
              </Text>
              <Text style={[styles.fileSize, { color: currentColors.textSecondary }]}>
                Toca para descargar
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <Text style={[styles.messageText, { color: textColor }]}>
            {message.content}
          </Text>
        );
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => renderMessage(message, index))}
      </ScrollView>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottom}>
          <Text style={styles.scrollToBottomIcon}>↓</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
  },
  ownMessageRow: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
  },
  hiddenAvatar: {
    opacity: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  messageContent: {
    flex: 1,
    maxWidth: screenWidth * 0.75,
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: 'white',
    fontSize: 16,
    marginLeft: 2,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIconText: {
    fontSize: 18,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  messageStatus: {
    marginLeft: 4,
  },
  statusIcon: {
    fontSize: 12,
    opacity: 0.7,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollToBottomIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MobileMessageList;
