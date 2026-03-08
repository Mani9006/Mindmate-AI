import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, Message } from '@types';
import { useSessionStore } from '@stores/sessionStore';
import { useTheme } from '@hooks/useTheme';
import { SPACING } from '@constants';

type SessionScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Session'>;
type SessionScreenRouteProp = RouteProp<MainStackParamList, 'Session'>;

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#fff' : colors.text },
          ]}
        >
          {message.content}
        </Text>
      </View>
      <Text style={[styles.messageTime, { color: colors.textMuted }]}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
};

export const SessionScreen: React.FC = () => {
  const navigation = useNavigation<SessionScreenNavigationProp>();
  const route = useRoute<SessionScreenRouteProp>();
  const { colors, isDark } = useTheme();

  const {
    currentSession,
    createSession,
    fetchSession,
    sendMessage,
    endSession,
    isLoading,
    isSending,
    clearCurrentSession,
  } = useSessionStore();

  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { sessionId, type = 'chat' } = route.params || {};

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    } else {
      // Create new session
      createSession(type);
    }

    return () => {
      clearCurrentSession();
    };
  }, [sessionId, type]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const content = message.trim();
    setMessage('');

    try {
      await sendMessage(content);
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            await endSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} isUser={item.sender === 'user'} />
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Session
          </Text>
          {currentSession?.status === 'active' && (
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Active
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleEndSession}>
          <Text style={[styles.endButton, { color: colors.error }]}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={currentSession?.messages || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Start a conversation with MindMate AI
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.text,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!message.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  backButton: {
    fontSize: 24,
    padding: SPACING.sm,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
  },
  endButton: {
    fontSize: 14,
    fontWeight: '600',
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: SPACING.md,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.md,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});
