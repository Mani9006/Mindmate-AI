/**
 * Transcript Overlay Component for MindMate AI Video Session
 * Displays real-time conversation transcript
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Transcript message types
export interface TranscriptMessage {
  id: string;
  text: string;
  speaker: 'user' | 'ai';
  timestamp: number;
  isFinal: boolean;
}

// Component props
export interface TranscriptOverlayProps {
  messages: TranscriptMessage[];
  currentTranscript: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  position?: 'top' | 'bottom';
  maxHeight?: number;
  showTimestamps?: boolean;
}

// Individual message component
interface MessageBubbleProps {
  message: TranscriptMessage;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showTimestamp = false 
}) => {
  const isUser = message.speaker === 'user';
  
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.text}
        </Text>
      </View>
      {showTimestamp && (
        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
      )}
    </View>
  );
};

// Current (live) transcript indicator
interface LiveTranscriptProps {
  text: string;
  speaker: 'user' | 'ai';
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ text, speaker }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  if (!text) return null;

  return (
    <View style={styles.liveContainer}>
      <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
      <View style={[
        styles.liveBubble,
        speaker === 'user' ? styles.userLiveBubble : styles.aiLiveBubble
      ]}>
        <Text style={[
          styles.liveText,
          speaker === 'user' ? styles.userLiveText : styles.aiLiveText
        ]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

// Main Transcript Overlay Component
export const TranscriptOverlay: React.FC<TranscriptOverlayProps> = ({
  messages,
  currentTranscript,
  isVisible,
  onToggleVisibility,
  position = 'bottom',
  maxHeight = 200,
  showTimestamps = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const translateY = useRef(new Animated.Value(position === 'bottom' ? 100 : -100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isVisible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, currentTranscript, isVisible]);

  // Animate visibility changes
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isVisible ? 0 : (position === 'bottom' ? 100 : -100),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isVisible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, position, translateY, opacity]);

  if (!isVisible && messages.length === 0) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={onToggleVisibility}
      >
        <Icon name="format-align-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        { 
          maxHeight,
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="format-align-left" size={18} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Live Transcript</Text>
        </View>
        <TouchableOpacity onPress={onToggleVisibility}>
          <Icon 
            name={isVisible ? 'chevron-down' : 'chevron-up'} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isVisible && (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && !currentTranscript && (
            <View style={styles.emptyState}>
              <Icon name="text-to-speech" size={32} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyStateText}>
                Conversation will appear here
              </Text>
            </View>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              showTimestamp={showTimestamps}
            />
          ))}

          {currentTranscript && (
            <LiveTranscript 
              text={currentTranscript} 
              speaker={messages.length > 0 && messages[messages.length - 1].speaker === 'user' ? 'ai' : 'user'}
            />
          )}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  containerTop: {
    top: 100,
  },
  containerBottom: {
    bottom: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    maxHeight: 160,
  },
  scrollContent: {
    padding: 12,
  },
  // Message styles
  messageContainer: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  // Live transcript styles
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  liveBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  userLiveBubble: {
    borderColor: 'rgba(0, 122, 255, 0.5)',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  aiLiveBubble: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  liveText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  userLiveText: {
    color: 'rgba(0, 122, 255, 0.8)',
  },
  aiLiveText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 8,
  },
  // Toggle button
  toggleButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TranscriptOverlay;
