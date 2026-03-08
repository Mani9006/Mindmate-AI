/**
 * JournalingPrompt.tsx
 * 
 * Full-screen journaling component for MindMate AI
 * Features: Writing prompts, word count, mood selection, auto-save
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export type JournalMood = 'great' | 'good' | 'okay' | 'difficult' | 'rough';

export interface JournalPrompt {
  id: string;
  text: string;
  category: string;
}

interface JournalEntry {
  id: string;
  promptId: string;
  content: string;
  mood: JournalMood | null;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalingPromptProps {
  prompt?: JournalPrompt;
  onComplete?: (entry: JournalEntry) => void;
  onClose?: () => void;
  autoSaveKey?: string;
}

const prompts: JournalPrompt[] = [
  {
    id: '1',
    text: "What are three things that brought you joy today?",
    category: 'Gratitude',
  },
  {
    id: '2',
    text: "Describe a challenge you're facing and how you might overcome it.",
    category: 'Reflection',
  },
  {
    id: '3',
    text: "What would you tell your younger self right now?",
    category: 'Self-Compassion',
  },
  {
    id: '4',
    text: "Write about a moment today when you felt truly present.",
    category: 'Mindfulness',
  },
  {
    id: '5',
    text: "What are you most looking forward to this week?",
    category: 'Positivity',
  },
  {
    id: '6',
    text: "Describe your current emotions without judgment.",
    category: 'Awareness',
  },
  {
    id: '7',
    text: "What's one small win you had today?",
    category: 'Celebration',
  },
  {
    id: '8',
    text: "If you could change one thing about today, what would it be?",
    category: 'Growth',
  },
];

const moodConfig: Record<JournalMood, { 
  icon: string; 
  label: string; 
  color: string;
  gradient: [string, string];
}> = {
  great: {
    icon: 'sunny',
    label: 'Great',
    color: '#F59E0B',
    gradient: ['#FCD34D', '#F59E0B'],
  },
  good: {
    icon: 'happy',
    label: 'Good',
    color: '#10B981',
    gradient: ['#6EE7B7', '#10B981'],
  },
  okay: {
    icon: 'remove-circle',
    label: 'Okay',
    color: '#6B7280',
    gradient: ['#9CA3AF', '#6B7280'],
  },
  difficult: {
    icon: 'rainy',
    label: 'Difficult',
    color: '#3B82F6',
    gradient: ['#93C5FD', '#3B82F6'],
  },
  rough: {
    icon: 'thunderstorm',
    label: 'Rough',
    color: '#8B5CF6',
    gradient: ['#C4B5FD', '#8B5CF6'],
  },
};

export const JournalingPrompt: React.FC<JournalingPromptProps> = ({
  prompt: initialPrompt,
  onComplete,
  onClose,
  autoSaveKey = 'journal_draft',
}) => {
  const [prompt, setPrompt] = useState<JournalPrompt>(
    initialPrompt || prompts[Math.floor(Math.random() * prompts.length)]
  );
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalMood | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const moodSlideAnim = useRef(new Animated.Value(100)).current;
  const inputRef = useRef<TextInput>(null);

  // Load auto-saved draft
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(`${autoSaveKey}_${prompt.id}`);
        if (draft) {
          const parsed = JSON.parse(draft);
          setContent(parsed.content || '');
          setSelectedMood(parsed.mood || null);
          setLastSaved(new Date(parsed.savedAt));
        }
      } catch (error) {
        console.log('Error loading draft:', error);
      }
    };

    loadDraft();

    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus input after animation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
  }, [prompt.id]);

  // Auto-save
  useEffect(() => {
    const saveDraft = async () => {
      if (content.trim()) {
        setIsSaving(true);
        try {
          await AsyncStorage.setItem(
            `${autoSaveKey}_${prompt.id}`,
            JSON.stringify({
              content,
              mood: selectedMood,
              savedAt: new Date().toISOString(),
            })
          );
          setLastSaved(new Date());
        } catch (error) {
          console.log('Error saving draft:', error);
        }
        setIsSaving(false);
      }
    };

    const timeout = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timeout);
  }, [content, selectedMood, prompt.id]);

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Mood selector animation
  useEffect(() => {
    Animated.timing(moodSlideAnim, {
      toValue: showMoodSelector ? 0 : 100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showMoodSelector]);

  const handleContentChange = (text: string) => {
    setContent(text);
  };

  const handleMoodSelect = (mood: JournalMood) => {
    setSelectedMood(mood);
    setShowMoodSelector(false);
  };

  const handleNewPrompt = () => {
    const availablePrompts = prompts.filter((p) => p.id !== prompt.id);
    const newPrompt =
      availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    setPrompt(newPrompt);
    setContent('');
    setSelectedMood(null);
    setLastSaved(null);
  };

  const handleComplete = async () => {
    if (content.trim().length < 10) {
      Alert.alert(
        'Write a bit more',
        'Try to write at least a few sentences to get the most benefit from journaling.',
        [{ text: 'OK' }]
      );
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      promptId: prompt.id,
      content: content.trim(),
      mood: selectedMood,
      wordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clear draft
    try {
      await AsyncStorage.removeItem(`${autoSaveKey}_${prompt.id}`);
    } catch (error) {
      console.log('Error clearing draft:', error);
    }

    if (onComplete) {
      onComplete(entry);
    }
  };

  const handleClose = () => {
    if (content.trim().length > 0) {
      Alert.alert(
        'Save your progress?',
        'Your journal entry has been auto-saved. You can continue later.',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onClose,
          },
          {
            text: 'Keep Draft',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose?.();
    }
  };

  const getProgressColor = () => {
    if (wordCount < 20) return '#EF4444';
    if (wordCount < 50) return '#F59E0B';
    return '#10B981';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#1E1B4B']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.categoryBadge}>
              <Ionicons name="create-outline" size={14} color="#C4B5FD" />
              <Text style={styles.categoryText}>{prompt.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleNewPrompt}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

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
            colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.promptGradient}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#C4B5FD"
              style={styles.promptIcon}
            />
            <Text style={styles.promptText}>{prompt.text}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Writing Area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            multiline
            placeholder="Start writing here..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={content}
            onChangeText={handleContentChange}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{wordCount}</Text>
              <Text style={styles.statLabel}>words</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((wordCount / 100) * 100, 100)}%`,
                      backgroundColor: getProgressColor(),
                    },
                  ]}
                />
              </View>
              <Text style={styles.goalText}>Goal: 100 words</Text>
            </View>

            <View style={styles.saveIndicator}>
              {isSaving ? (
                <Ionicons name="sync" size={16} color="rgba(255,255,255,0.5)" />
              ) : lastSaved ? (
                <>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                  <Text style={styles.savedText}>
                    Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          {/* Mood Selector */}
          <Animated.View
            style={[
              styles.moodSelector,
              { transform: [{ translateY: moodSlideAnim }] },
            ]}
          >
            <Text style={styles.moodLabel}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {(Object.keys(moodConfig) as JournalMood[]).map((mood) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => handleMoodSelect(mood)}
                  style={[
                    styles.moodButton,
                    selectedMood === mood && styles.moodButtonSelected,
                  ]}
                >
                  <LinearGradient
                    colors={moodConfig[mood].gradient}
                    style={[
                      styles.moodIcon,
                      selectedMood === mood && styles.moodIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={moodConfig[mood].icon as any}
                      size={20}
                      color="#FFF"
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.moodText,
                      selectedMood === mood && styles.moodTextSelected,
                    ]}
                  >
                    {moodConfig[mood].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => setShowMoodSelector(!showMoodSelector)}
              style={[
                styles.moodToggle,
                selectedMood && { backgroundColor: moodConfig[selectedMood].color },
              ]}
            >
              {selectedMood ? (
                <>
                  <Ionicons
                    name={moodConfig[selectedMood].icon as any}
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.moodToggleText}>
                    {moodConfig[selectedMood].label}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="happy-outline" size={18} color="#FFF" />
                  <Text style={styles.moodToggleText}>Add Mood</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleComplete}
              style={[
                styles.completeButton,
                wordCount < 10 && styles.completeButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.completeGradient}
              >
                <Text style={styles.completeButtonText}>Complete Entry</Text>
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promptGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptIcon: {
    marginTop: 2,
  },
  promptText: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    lineHeight: 28,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 4,
  },
  saveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    color: '#10B981',
    fontSize: 11,
  },
  moodSelector: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  moodLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    gap: 6,
  },
  moodButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  moodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodIconSelected: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  moodText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  moodTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 15,
  },
  moodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  moodToggleText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  completeButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JournalingPrompt;
