import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, MoodEntry } from '@types';
import { useUserStore } from '@stores/userStore';
import { useTheme } from '@hooks/useTheme';
import { MOOD_SCALE, SPACING } from '@constants';

type MoodTrackerScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MoodTracker'
>;

const { width } = Dimensions.get('window');

export const MoodTrackerScreen: React.FC = () => {
  const navigation = useNavigation<MoodTrackerScreenNavigationProp>();
  const { moodHistory, fetchMoodHistory, addMoodEntry, isLoading } = useUserStore();
  const { colors, isDark } = useTheme();

  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchMoodHistory(30);
  }, []);

  const handleMoodSelect = (value: number) => {
    setSelectedMood(value);
  };

  const handleSubmit = async () => {
    if (selectedMood === null) return;

    const moodEntry: Omit<MoodEntry, 'id' | 'userId'> = {
      value: selectedMood,
      label: MOOD_SCALE[selectedMood - 1].label,
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      await addMoodEntry(moodEntry);
      setSelectedMood(null);
      setNote('');
      // Show success feedback
    } catch (error) {
      // Handle error
    }
  };

  const getMoodForDate = (date: Date) => {
    return moodHistory.find((mood) => {
      const moodDate = new Date(mood.timestamp);
      return moodDate.toDateString() === date.toDateString();
    });
  };

  const renderMoodCalendar = () => {
    const days: JSX.Element[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const mood = getMoodForDate(date);
      const isToday = i === 0;

      days.push(
        <View key={i} style={styles.calendarDay}>
          <Text style={[styles.calendarDayLabel, { color: colors.textMuted }]}>
            {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
          </Text>
          <View
            style={[
              styles.calendarDayDot,
              {
                backgroundColor: mood
                  ? MOOD_SCALE[mood.value - 1].color
                  : colors.gray200,
                borderWidth: isToday ? 2 : 0,
                borderColor: colors.primary,
              },
            ]}
          />
          <Text style={[styles.calendarDayNumber, { color: colors.textMuted }]}>
            {date.getDate()}
          </Text>
        </View>
      );
    }

    return <View style={styles.calendarContainer}>{days}</View>;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mood Tracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mood Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Last 30 Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderMoodCalendar()}
          </ScrollView>
        </View>

        {/* Log Mood */}
        <View style={[styles.logMoodCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>How are you feeling?</Text>

          <View style={styles.moodScale}>
            {MOOD_SCALE.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && {
                    backgroundColor: mood.color + '20',
                    borderColor: mood.color,
                  },
                ]}
                onPress={() => handleMoodSelect(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    { color: colors.text },
                    selectedMood === mood.value && { color: mood.color },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedMood && (
            <>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.placeholder}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: MOOD_SCALE[selectedMood - 1].color },
                ]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Log Mood</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent Moods */}
        <View style={[styles.recentMoodsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Entries</Text>
          {moodHistory.slice(0, 5).map((mood) => (
            <View key={mood.id} style={styles.moodEntry}>
              <Text style={styles.moodEntryEmoji}>
                {MOOD_SCALE[mood.value - 1].emoji}
              </Text>
              <View style={styles.moodEntryInfo}>
                <Text style={[styles.moodEntryLabel, { color: colors.text }]}>
                  {mood.label}
                </Text>
                <Text style={[styles.moodEntryDate, { color: colors.textSecondary }]}>
                  {new Date(mood.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {mood.note && (
                <Text style={[styles.moodEntryNote, { color: colors.textMuted }]} numberOfLines={1}>
                  {mood.note}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  calendarCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  calendarContainer: {
    flexDirection: 'row',
  },
  calendarDay: {
    alignItems: 'center',
    marginRight: 12,
  },
  calendarDayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  calendarDayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  calendarDayNumber: {
    fontSize: 10,
  },
  logMoodCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  moodScale: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodOption: {
    width: '18%',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: SPACING.sm,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 14,
    marginTop: SPACING.md,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentMoodsCard: {
    borderRadius: 16,
    padding: SPACING.md,
  },
  moodEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  moodEntryEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  moodEntryInfo: {
    flex: 1,
  },
  moodEntryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  moodEntryDate: {
    fontSize: 12,
  },
  moodEntryNote: {
    fontSize: 12,
    maxWidth: width * 0.4,
  },
});
