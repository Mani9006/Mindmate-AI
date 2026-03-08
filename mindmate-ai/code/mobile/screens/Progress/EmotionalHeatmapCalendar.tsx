/**
 * EmotionalHeatmapCalendar.tsx
 * 
 * Interactive emotional heatmap calendar component for React Native.
 * Visualizes mood patterns across days with color-coded intensity.
 * Supports month navigation, day selection, and detailed insights.
 * 
 * @module Progress
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
export type EmotionIntensity = 1 | 2 | 3 | 4 | 5;

export interface DailyEmotionData {
  date: Date;
  primaryEmotion: string;
  intensity: EmotionIntensity;
  moodScore: number; // 1-5 scale
  entryCount: number;
  notes?: string[];
}

export interface EmotionalHeatmapCalendarProps {
  data: DailyEmotionData[];
  onDayPress?: (dayData: DailyEmotionData) => void;
  onMonthChange?: (month: Date) => void;
  style?: ViewStyle;
  showLegend?: boolean;
  showInsights?: boolean;
  startOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday
}

// Color scales for different emotion types
const EMOTION_COLORS: Record<string, string[]> = {
  joy: ['#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706'],
  sadness: ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'],
  anger: ['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444'],
  fear: ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7'],
  disgust: ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399'],
  surprise: ['#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316'],
  neutral: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'],
  mixed: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'],
};

const DEFAULT_COLOR_SCALE = ['#F3F4F6', '#D1FAE5', '#6EE7B7', '#10B981', '#059669'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_MONDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Gets color for a specific emotion intensity
 */
const getEmotionColor = (
  emotion: string,
  intensity: EmotionIntensity
): string => {
  const colorScale = EMOTION_COLORS[emotion.toLowerCase()] || DEFAULT_COLOR_SCALE;
  return colorScale[intensity - 1] || colorScale[0];
};

/**
 * Gets mood-based color (simplified version)
 */
const getMoodColor = (moodScore: number): string => {
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];
  return colors[Math.min(Math.max(Math.round(moodScore) - 1, 0), 4)];
};

/**
 * Gets intensity color based on mood score
 */
const getIntensityColor = (moodScore: number, intensity: number): string => {
  const baseColors = ['#FEE2E2', '#FEF3C7', '#ECFDF5', '#D1FAE5', '#059669'];
  const colorIndex = Math.min(Math.max(Math.round(moodScore) - 1, 0), 4);
  return baseColors[colorIndex];
};

/**
 * Generates calendar days for a given month
 */
const generateCalendarDays = (
  year: number,
  month: number,
  startOfWeek: 0 | 1
): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let firstDayOfWeek = firstDay.getDay();
  if (startOfWeek === 1) {
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  }

  const days: (Date | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
};

/**
 * Calculates monthly insights
 */
const calculateInsights = (data: DailyEmotionData[]) => {
  if (data.length === 0) {
    return {
      mostFrequentEmotion: '-',
      averageMood: 0,
      bestDay: '-',
      totalEntries: 0,
      moodTrend: 'neutral',
    };
  }

  // Most frequent emotion
  const emotionCounts: Record<string, number> = {};
  data.forEach((d) => {
    emotionCounts[d.primaryEmotion] = (emotionCounts[d.primaryEmotion] || 0) + 1;
  });
  const mostFrequentEmotion = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] || '-';

  // Average mood
  const averageMood =
    data.reduce((sum, d) => sum + d.moodScore, 0) / data.length;

  // Best day
  const bestDay = data.reduce((best, current) =>
    current.moodScore > best.moodScore ? current : best
  );

  // Total entries
  const totalEntries = data.reduce((sum, d) => sum + d.entryCount, 0);

  // Mood trend
  const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
  const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.moodScore, 0) / (firstHalf.length || 1);
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.moodScore, 0) / (secondHalf.length || 1);
  const moodTrend =
    secondAvg > firstAvg + 0.3 ? 'improving' : secondAvg < firstAvg - 0.3 ? 'declining' : 'stable';

  return {
    mostFrequentEmotion,
    averageMood,
    bestDay: bestDay.date.toLocaleDateString('en-US', { weekday: 'long' }),
    totalEntries,
    moodTrend,
  };
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const EmotionalHeatmapCalendar: React.FC<EmotionalHeatmapCalendarProps> = ({
  data,
  onDayPress,
  onMonthChange,
  style,
  showLegend = true,
  showInsights = true,
  startOfWeek = 1,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekdays = startOfWeek === 1 ? WEEKDAYS_MONDAY : WEEKDAYS;

  const calendarDays = useMemo(
    () => generateCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth(), startOfWeek),
    [currentMonth, startOfWeek]
  );

  const monthData = useMemo(() => {
    return data.filter(
      (d) =>
        d.date.getMonth() === currentMonth.getMonth() &&
        d.date.getFullYear() === currentMonth.getFullYear()
    );
  }, [data, currentMonth]);

  const insights = useMemo(() => calculateInsights(monthData), [monthData]);

  const getDayData = useCallback(
    (date: Date): DailyEmotionData | undefined => {
      return data.find(
        (d) =>
          d.date.getDate() === date.getDate() &&
          d.date.getMonth() === date.getMonth() &&
          d.date.getFullYear() === date.getFullYear()
      );
    },
    [data]
  );

  const handleMonthChange = useCallback(
    (direction: 'prev' | 'next') => {
      const newMonth = new Date(currentMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setCurrentMonth(newMonth);
      onMonthChange?.(newMonth);
    },
    [currentMonth, onMonthChange]
  );

  const handleDayPress = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const dayData = getDayData(date);
      if (dayData) {
        onDayPress?.(dayData);
      }
    },
    [getDayData, onDayPress]
  );

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleMonthChange('prev')}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={() => handleMonthChange('next')}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {weekdays.map((day) => (
          <Text key={day} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const dayData = getDayData(date);
          const hasData = !!dayData;
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <AnimatedTouchable
              key={date.toISOString()}
              style={[
                styles.dayCell,
                hasData && {
                  backgroundColor: dayData
                    ? getIntensityColor(dayData.moodScore, dayData.intensity)
                    : '#F3F4F6',
                },
                isTodayDate && styles.todayCell,
                isSelectedDate && styles.selectedCell,
              ]}
              onPress={() => handleDayPress(date)}
              entering={FadeIn.delay(index * 20)}
              layout={Layout.springify()}
            >
              <Text
                style={[
                  styles.dayText,
                  isTodayDate && styles.todayText,
                  isSelectedDate && styles.selectedText,
                  hasData && dayData && dayData.moodScore <= 2 && styles.lowMoodText,
                ]}
              >
                {date.getDate()}
              </Text>
              {hasData && dayData && dayData.entryCount > 1 && (
                <View style={styles.entryIndicator}>
                  <Text style={styles.entryCount}>{dayData.entryCount}</Text>
                </View>
              )}
            </AnimatedTouchable>
          );
        })}
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Mood Intensity</Text>
          <View style={styles.legendScale}>
            <Text style={styles.legendLabel}>Low</Text>
            {DEFAULT_COLOR_SCALE.map((color, index) => (
              <View
                key={index}
                style={[styles.legendColor, { backgroundColor: color }]}
              />
            ))}
            <Text style={styles.legendLabel}>High</Text>
          </View>
        </View>
      )}

      {/* Insights */}
      {showInsights && (
        <Animated.View style={styles.insightsContainer} entering={FadeInUp.delay(300)}>
          <Text style={styles.insightsTitle}>Monthly Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>
                {insights.mostFrequentEmotion}
              </Text>
              <Text style={styles.insightLabel}>Top Emotion</Text>
            </View>
            <View style={styles.insightItem}>
              <Text
                style={[
                  styles.insightValue,
                  insights.averageMood >= 3.5
                    ? styles.positiveValue
                    : insights.averageMood <= 2.5
                    ? styles.negativeValue
                    : null,
                ]}
              >
                {insights.averageMood.toFixed(1)}
              </Text>
              <Text style={styles.insightLabel}>Avg Mood</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{insights.bestDay}</Text>
              <Text style={styles.insightLabel}>Best Day</Text>
            </View>
            <View style={styles.insightItem}>
              <Text
                style={[
                  styles.insightValue,
                  insights.moodTrend === 'improving'
                    ? styles.positiveValue
                    : insights.moodTrend === 'declining'
                    ? styles.negativeValue
                    : null,
                ]}
              >
                {insights.moodTrend === 'improving'
                  ? '↗'
                  : insights.moodTrend === 'declining'
                  ? '↘'
                  : '→'}
              </Text>
              <Text style={styles.insightLabel}>Trend</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Selected Day Detail */}
      {selectedDate && (
        <Animated.View style={styles.selectedDayContainer} entering={FadeInUp}>
          {(() => {
            const dayData = getDayData(selectedDate);
            if (!dayData) {
              return (
                <Text style={styles.noDataText}>
                  No entries for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              );
            }
            return (
              <>
                <View style={styles.selectedDayHeader}>
                  <View
                    style={[
                      styles.emotionIndicator,
                      {
                        backgroundColor: getEmotionColor(
                          dayData.primaryEmotion,
                          dayData.intensity
                        ),
                      },
                    ]}
                  />
                  <Text style={styles.selectedDayEmotion}>
                    {dayData.primaryEmotion}
                  </Text>
                  <Text style={styles.selectedDayDate}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.selectedDayStats}>
                  <View style={styles.selectedDayStat}>
                    <Text style={styles.selectedDayStatValue}>
                      {dayData.moodScore}/5
                    </Text>
                    <Text style={styles.selectedDayStatLabel}>Mood Score</Text>
                  </View>
                  <View style={styles.selectedDayStat}>
                    <Text style={styles.selectedDayStatValue}>
                      {dayData.intensity}/5
                    </Text>
                    <Text style={styles.selectedDayStatLabel}>Intensity</Text>
                  </View>
                  <View style={styles.selectedDayStat}>
                    <Text style={styles.selectedDayStatValue}>
                      {dayData.entryCount}
                    </Text>
                    <Text style={styles.selectedDayStatLabel}>Entries</Text>
                  </View>
                </View>
                {dayData.notes && dayData.notes.length > 0 && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesTitle}>Notes:</Text>
                    {dayData.notes.map((note, idx) => (
                      <Text key={idx} style={styles.noteText}>
                        • {note}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            );
          })()}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  todayText: {
    fontWeight: '700',
    color: '#10B981',
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  selectedText: {
    fontWeight: '700',
    color: '#6366F1',
  },
  lowMoodText: {
    color: '#FFFFFF',
  },
  entryIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#6366F1',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryCount: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendColor: {
    width: 24,
    height: 16,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  insightsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  insightLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  selectedDayContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedDayEmotion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  selectedDayDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedDayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  selectedDayStat: {
    alignItems: 'center',
  },
  selectedDayStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  selectedDayStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default EmotionalHeatmapCalendar;
