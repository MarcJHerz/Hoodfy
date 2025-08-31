import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

interface MobileMessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'video' | 'file' | 'audio', file?: any) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  theme: 'light' | 'dark';
}

const { width: screenWidth } = Dimensions.get('window');

const MobileMessageInput: React.FC<MobileMessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Write a message...",
  disabled = false,
  theme = 'light'
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const attachmentAnimation = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout>();

  const colors = {
    light: {
      background: '#ffffff',
      inputBackground: '#f3f4f6',
      inputBorder: '#e5e7eb',
      text: '#1f2937',
      placeholder: '#6b7280',
      sendButton: ['#3b82f6', '#8b5cf6'],
      recordButton: '#ef4444',
      attachButton: '#6b7280',
      attachmentMenu: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    dark: {
      background: '#1f2937',
      inputBackground: '#374151',
      inputBorder: '#4b5563',
      text: '#f9fafb',
      placeholder: '#9ca3af',
      sendButton: ['#1d4ed8', '#7c3aed'],
      recordButton: '#dc2626',
      attachButton: '#9ca3af',
      attachmentMenu: '#374151',
      shadow: 'rgba(0, 0, 0, 0.3)',
    }
  };

  const currentColors = colors[theme];

  const startRecordingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopRecordingAnimation = () => {
    recordingAnimation.stopAnimation();
    Animated.spring(recordingAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const toggleAttachmentMenu = () => {
    const toValue = showAttachmentMenu ? 0 : 1;
    setShowAttachmentMenu(!showAttachmentMenu);
    
    Animated.spring(attachmentAnimation, {
      toValue,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        tension: 300,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendMessage = () => {
    if (!message.trim() || isLoading || disabled) return;
    
    animateSendButton();
    onSendMessage(message.trim(), 'text');
    setMessage('');
    Vibration.vibrate(50); // Feedback háptico
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need permission to access the microphone');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
      startRecordingAnimation();
      Vibration.vibrate(100);

      // Timer para el tiempo de grabación
      timerRef.current = setTimeout(() => {
        setRecordingTime(prev => prev + 1);
        // Continuar el timer
        if (isRecording) {
          startRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      stopRecordingAnimation();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri && recordingTime > 1) { // Solo enviar si tiene más de 1 segundo
        onSendMessage(`Audio grabado (${formatTime(recordingTime)})`, 'audio', { uri });
        Vibration.vibrate([50, 50, 50]);
      }
      
      setRecording(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      stopRecordingAnimation();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingTime(0);
      Vibration.vibrate(200);
    } catch (err) {
      console.error('Failed to cancel recording', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSendMessage('Imagen', 'image', result.assets[0]);
      setShowAttachmentMenu(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSendMessage('Video', 'video', result.assets[0]);
      setShowAttachmentMenu(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        onSendMessage(file.name, 'file', file);
        setShowAttachmentMenu(false);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const AttachmentOption = ({ icon, label, onPress, color }: {
    icon: string;
    label: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.attachmentOption, { backgroundColor: currentColors.attachmentMenu }]}
    >
      <View style={[styles.attachmentIcon, { backgroundColor: color }]}>
        <Text style={styles.attachmentIconText}>{icon}</Text>
      </View>
      <Text style={[styles.attachmentLabel, { color: currentColors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Menú de adjuntos */}
      {showAttachmentMenu && (
        <Animated.View
          style={[
            styles.attachmentMenu,
            {
              backgroundColor: currentColors.attachmentMenu,
              transform: [
                {
                  translateY: attachmentAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
                {
                  scale: attachmentAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: attachmentAnimation,
            },
          ]}
        >
          <View style={styles.attachmentGrid}>
            <AttachmentOption
              icon="📷"
              label="Imagen"
              onPress={pickImage}
              color="#3b82f6"
            />
            <AttachmentOption
              icon="🎥"
              label="Video"
              onPress={pickVideo}
              color="#8b5cf6"
            />
            <AttachmentOption
              icon="📄"
              label="Archivo"
              onPress={pickDocument}
              color="#10b981"
            />
          </View>
        </Animated.View>
      )}

      {/* Indicador de grabación */}
      {isRecording && (
        <View style={[styles.recordingIndicator, { backgroundColor: currentColors.background }]}>
          <Animated.View
            style={[
              styles.recordingDot,
              {
                backgroundColor: currentColors.recordButton,
                transform: [{ scale: recordingAnimation }],
              },
            ]}
          />
          <Text style={[styles.recordingText, { color: currentColors.text }]}>
            Recording... {formatTime(recordingTime)}
          </Text>
          <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input principal */}
      <View style={[styles.inputContainer, { backgroundColor: currentColors.background }]}>
        {!isRecording && (
          <>
            {/* Botón de adjuntos */}
            <TouchableOpacity
              onPress={toggleAttachmentMenu}
              style={[styles.attachButton, {
                backgroundColor: showAttachmentMenu ? currentColors.sendButton[0] : 'transparent'
              }]}
            >
              <Text style={[
                styles.attachButtonText,
                {
                  color: showAttachmentMenu ? '#ffffff' : currentColors.attachButton,
                  transform: [{ rotate: showAttachmentMenu ? '45deg' : '0deg' }]
                }
              ]}>
                +
              </Text>
            </TouchableOpacity>

            {/* Campo de texto */}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={currentColors.placeholder}
              multiline
              style={[
                styles.textInput,
                {
                  backgroundColor: currentColors.inputBackground,
                  borderColor: currentColors.inputBorder,
                  color: currentColors.text,
                }
              ]}
              maxLength={1000}
              editable={!disabled && !isLoading}
            />
          </>
        )}

        {/* Botón de enviar o grabar */}
        {message.trim() ? (
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={disabled || isLoading}
              style={styles.sendButton}
            >
              <LinearGradient
                colors={currentColors.sendButton}
                style={styles.sendButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <View style={styles.loadingSpinner} />
                ) : (
                  <Text style={styles.sendButtonText}>➤</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ transform: [{ scale: recordingAnimation }] }}>
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording ? currentColors.recordButton : currentColors.inputBackground,
                },
              ]}
            >
              <Text style={[
                styles.recordButtonText,
                { color: isRecording ? '#ffffff' : currentColors.attachButton }
              ]}>
                🎤
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  attachmentMenu: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  attachmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentIconText: {
    fontSize: 24,
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  recordingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: 8,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  recordButtonText: {
    fontSize: 20,
  },
});

export default MobileMessageInput;
