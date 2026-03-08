/**
 * GratitudeLog.tsx
 * 
 * 3-item gratitude list component for MindMate AI
 * Features: Animated entries, prompts, celebration on completion
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export type GratitudeItem = {
  id: string;
  text: string;
  emoji: string;
  timestamp: Date;
};

interface GratitudeLogProps {
  onComplete?: (items: GratitudeItem[]) => void;
  onClose?: () => void;
  initialItems?: GratitudeItem[];
}

const gratitudePrompts = [
  "What made you smile today?",
  "Who are you grateful for right now?",
  "What's something beautiful you noticed?",
  "What comfort are you thankful for?",
  "What opportunity do you appreciate?",
  "What small thing brought you joy?",
  "What are you proud of today?",
  "Who made a positive impact on you?",
  "What nature are you grateful for?",
  "What lesson are you thankful to have learned?",
];

const suggestedEmojis = [
  '❤️', '🌟', '🙏', '🌈', '☀️', '🌸', '💫', '🦋',
  '🌻', '💕', '✨', '🎵', '📚', '☕', '🐾', '🌙',
  '🍀', '🎨', '🏠', '🌊', '🎁', '💪', '😊', '🌺',
];

export const GratitudeLog: React.FC<GratitudeLogProps> = ({
  onComplete,
  onClose,
  initialItems = [],
}) => {
  const [items, setItems] = useState<GratitudeItem[]>(initialItems);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('❤️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [prompt, setPrompt] = useState(
    gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]
  );
  const [isComplete, setIsComplete] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const itemAnims = useRef<Animated.Value[]>([]);
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Initialize animations for items
  useEffect(() => {
    itemAnims.current = items.map(() => new Animated.Value(1));
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Check completion
  useEffect(() => {
    if (items.length >= 3 && !isComplete) {
      setIsComplete(true);
      triggerCelebration();
    }
  }, [items.length]);

  const triggerCelebration = () => {
    Vibration.vibrate([50, 100, 50]);
    
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddItem = () => {
    if (currentInput.trim().length === 0) return;
    if (items.length >= 3) return;

    const newItem: GratitudeItem = {
      id: Date.now().toString(),
      text: currentInput.trim(),
      emoji: selectedEmoji,
      timestamp: new Date(),
    };

    const newAnim = new Animated.Value(0);
    itemAnims.current.push(newAnim);

    setItems([...items, newItem]);
    setCurrentInput('');

    // Animate new item entry
    Animated.spring(newAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleRemoveItem = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;

    const anim = itemAnims.current[index];
    
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setItems(items.filter((item) => item.id !== id));
      itemAnims.current.splice(index, 1);
      setIsComplete(false);
      celebrationAnim.setValue(0);
      scaleAnim.setValue(0.8);
    });
  };

  const handleNewPrompt = () => {
    const availablePrompts = gratitudePrompts.filter((p) => p !== prompt);
    const newPrompt =
      availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    setPrompt(newPrompt);
  };

  const handleComplete = () => {
    if (items.length >= 3) {
      onComplete?.(items);
    }
  };

  const getProgressColor = () => {
    if (items.length === 0) return '#6B7280';
    if (items.length === 1) return '#EF4444';
    if (items.length === 2) return '#F59E0B';
    return '#10B981';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FDF2F8', '#FCE7F3', '#FDF2F8']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleBadge}>
              <Ionicons name="heart" size={16} color="#EC4899" />
              <Text style={styles.titleText}>Daily Gratitude</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleNewPrompt} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#831843" />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {items.length} of 3 items
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round((items.length / 3) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${(items.length / 3) * 100}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
            <View style={styles.progressDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    items.length > i && {
                      backgroundColor: getProgressColor(),
                      transform: [{ scale: 1.2 }],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Prompt Card */}
          <Animated.View
            style={[
              styles.promptCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FBCFE8', '#F9A8D4']}
              style={styles.promptGradient}
            >
              <Ionicons name="sparkles" size={24} color="#831843" />
              <Text style={styles.promptText}>{prompt}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Input Section */}
          {items.length < 3 && (
            <Animated.View
              style={[
                styles.inputSection,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Emoji Picker */}
              <View style={styles.emojiSection}>
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={styles.emojiButton}
                >
                  <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
                  <Ionicons name="chevron-down" size={16} color="#831843" />
                </TouchableOpacity>

                {showEmojiPicker && (
                  <View style={styles.emojiPicker}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.emojiList}
                    >
                      {suggestedEmojis.map((emoji) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => {
                            setSelectedEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={[
                            styles.emojiOption,
                            selectedEmoji === emoji && styles.emojiOptionSelected,
                          ]}
                        >
                          <Text style={styles.emojiOptionText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Text Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="I'm grateful for..."
                  placeholderTextColor="rgba(131, 24, 67, 0.4)"
                  value={currentInput}
                  onChangeText={setCurrentInput}
                  maxLength={100}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleAddItem}
                  disabled={currentInput.trim().length === 0}
                  style={[
                    styles.addButton,
                    currentInput.trim().length === 0 && styles.addButtonDisabled,
                  ]}
                >
                  <LinearGradient
                    colors={['#EC4899', '#DB2777']}
                    style={styles.addButtonGradient}
                  >
                    <Ionicons name="add" size={24} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={styles.charCount}>
                {currentInput.length}/100
              </Text>
            </Animated.View>
          )}

          {/* Gratitude Items List */}
          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.itemCard,
                  {
                    opacity: itemAnims.current[index],
                    transform: [
                      {
                        scale: itemAnims.current[index]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }) || 1,
                      },
                      {
                        translateX: itemAnims.current[index]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }) || 0,
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFF', '#FDF2F8']}
                  style={styles.itemGradient}
                >
                  <View style={styles.itemEmoji}>
                    <Text style={styles.itemEmojiText}>{item.emoji}</Text>
                  </View>
                  <Text style={styles.itemText}>{item.text}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>

          {/* Empty State */}
          {items.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={60} color="#F9A8D4" />
              <Text style={styles.emptyTitle}>Start Your Gratitude List</Text>
              <Text style={styles.emptySubtitle}>
                Write down 3 things you're grateful for today
              </Text>
            </View>
          )}

          {/* Completion Celebration */}
          {isComplete && (
            <Animated.View
              style={[
                styles.celebrationCard,
                {
                  opacity: celebrationAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.celebrationGradient}
              >
                <View style={styles.celebrationIcon}>
                  <Ionicons name="checkmark-circle" size={48} color="#FFF" />
                </View>
                <Text style={styles.celebrationTitle}>Wonderful!</Text>
                <Text style={styles.celebrationText}>
                  You've completed your daily gratitude practice
                </Text>
                
                {/* Floating hearts */}
                <View style={styles.floatingHearts}>
                  {[...Array(5)].map((_, i) => (
                    <AnimatedHeart key={i} index={i} />
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleComplete}
            disabled={items.length < 3}
            style={[
              styles.completeButton,
              items.length < 3 && styles.completeButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={items.length >= 3 ? ['#EC4899', '#DB2777'] : ['#9CA3AF', '#6B7280']}
              style={styles.completeGradient}
            >
              <Text style={styles.completeButtonText}>
                {items.length >= 3 ? 'Complete' : `Add ${3 - items.length} more`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

// Animated Heart Component
const AnimatedHeart: React.FC<{ index: number }> = ({ index }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const delay = index * 200;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, [index]);

  const hearts = ['💕', '💖', '💗', '💓', '💝'];

  return (
    <Animated.Text
      style={[
        styles.floatingHeart,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          left: `${index * 20 + 10}%`,
        },
      ]}
    >
      {hearts[index]}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(131, 24, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  titleText: {
    color: '#831843',
    fontSize: 16,
    fontWeight: '700',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(131, 24, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#831843',
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDots: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '16%',
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  promptCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  promptGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptText: {
    flex: 1,
    color: '#831843',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  emojiSection: {
    marginBottom: 12,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedEmoji: {
    fontSize: 24,
  },
  emojiPicker: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emojiList: {
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiOptionSelected: {
    backgroundColor: '#FBCFE8',
    transform: [{ scale: 1.1 }],
  },
  emojiOptionText: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#831843',
    minHeight: 56,
    maxHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    color: 'rgba(131, 24, 67, 0.5)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  itemEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmojiText: {
    fontSize: 24,
  },
  itemText: {
    flex: 1,
    color: '#831843',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#831843',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: 'rgba(131, 24, 67, 0.6)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  celebrationCard: {
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  celebrationGradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  celebrationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  floatingHearts: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 20,
    fontSize: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  completeButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GratitudeLog;
