/**
 * WeeklyStreakTracker.tsx
 * 
 * Animated weekly streak tracker component for React Native.
 * Displays daily streak progress with fire animations, streak counters,
 * and motivational messages based on user progress.
 * 
 * @module Progress
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  Layout,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
export type DayStatus = 'completed' | 'missed' | 'today' | 'upcoming' | 'future';

export interface DayData {
  date: Date;
  status: DayStatus;
  activityType?: string;
  moodScore?: number;
}

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  reward?: string;
}

export interface WeeklyStreakTrackerProps {
  days: DayData[];
  currentStreak: number;
  longestStreak: number;
  onDayPress?: (day: DayData) => void;
  onMilestoneReach?: (milestone: StreakMilestone) => void;
  style?: ViewStyle;
  showMilestones?: boolean;
  showMotivation?: boolean;
  animate?: boolean;
}

// Default milestones
const DEFAULT_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Getting Started', description: 'You\'re building momentum!', reward: '🌟' },
  { days: 7, title: 'Week Warrior', description: 'A full week of consistency!', reward: '🔥' },
  { days: 14, title: 'Two Week Champion', description: 'Double digits achieved!', reward: '⚡' },
  { days: 21, title: 'Habit Former', description: 'You\'re creating lasting change!', reward: '🏆' },
  { days: 30, title: 'Monthly Master', description: 'A month of dedication!', reward: '💎' },
  { days: 60, title: 'Consistency King', description: 'Two months strong!', reward: '👑' },
  { days: 90, title: 'Quarter Century', description: 'A quarter of transformation!', reward: '🌈' },
  { days: 180, title: 'Half Year Hero', description: 'Six months of growth!', reward: '🚀' },
  { days: 365, title: 'Year Legend', description: 'A full year of self-care!', reward: '🌟' },
];

// Motivational messages based on streak
const getMotivationalMessage = (streak: number): string => {
  if (streak === 0) return 'Every journey begins with a single step.';
  if (streak === 1) return 'Great start! Keep it going!';
  if (streak < 3) return 'You\'re building momentum!';
  if (streak < 7) return 'Consistency is key - you\'re doing great!';
  if (streak < 14) return 'Week warrior in the making!';
  if (streak < 21) return 'Your dedication is inspiring!';
  if (streak < 30) return 'Habit formation in progress!';
  if (streak < 60) return 'Monthly master - incredible!';
  if (streak < 90) return 'You\'re unstoppable!';
  if (streak < 180) return 'A quarter of transformation!';
  if (streak < 365) return 'Half year hero - legendary!';
  return 'A full year of self-care - you\'re truly amazing!';
};

// Get next milestone
const getNextMilestone = (streak: number): StreakMilestone | null => {
  return (
    DEFAULT_MILESTONES.find((m) => m.days > streak) || null
  );
};

// Get current milestone
const getCurrentMilestone = (streak: number): StreakMilestone | null => {
  const milestones = DEFAULT_MILESTONES.filter((m) => m.days <= streak);
  return milestones[milestones.length - 1] || null;
};

// Day names
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Animated components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FireParticleProps {
  delay: number;
}

const FireParticle: React.FC<FireParticleProps> = ({ delay }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const timeout = setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-30, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(-50, { duration: 400, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.fireParticle, animatedStyle]}>
      <Text style={styles.fireParticleText}>🔥</Text>
    </Animated.View>
  );
};

interface DayCellProps {
  day: DayData;
  index: number;
  isStreakActive: boolean;
  onPress: () => void;
  animate: boolean;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  index,
  isStreakActive,
  onPress,
  animate,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, { duration: 300, delay: index * 50 });
    } else {
      opacity.value = 1;
    }
  }, [animate, index]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getStatusStyle = () => {
    switch (day.status) {
      case 'completed':
        return styles.dayCompleted;
      case 'missed':
        return styles.dayMissed;
      case 'today':
        return styles.dayToday;
      case 'upcoming':
        return styles.dayUpcoming;
      default:
        return styles.dayFuture;
    }
  };

  const getStatusIcon = () => {
    switch (day.status) {
      case 'completed':
        return '✓';
      case 'missed':
        return '✕';
      case 'today':
        return '●';
      default:
        return '';
    }
  };

  return (
    <AnimatedTouchable
      style={[styles.dayCell, getStatusStyle(), animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
      entering={FadeIn.delay(index * 50)}
    >
      <Text style={styles.dayName}>{DAY_NAMES[day.date.getDay()]}</Text>
      <Text style={styles.dayNumber}>{day.date.getDate()}</Text>
      <View style={styles.statusIndicator}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
      </View>
      {day.status === 'completed' && isStreakActive && (
        <View style={styles.streakIndicator}>
          <Text style={styles.streakIcon}>🔥</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
};

export const WeeklyStreakTracker: React.FC<WeeklyStreakTrackerProps> = ({
  days,
  currentStreak,
  longestStreak,
  onDayPress,
  onMilestoneReach,
  style,
  showMilestones = true,
  showMotivation = true,
  animate = true,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievedMilestone, setAchievedMilestone] = useState<StreakMilestone | null>(null);

  const streakScale = useSharedValue(1);
  const fireScale = useSharedValue(1);
  const fireRotate = useSharedValue(0);

  // Check for milestone achievement
  useEffect(() => {
    const milestone = DEFAULT_MILESTONES.find((m) => m.days === currentStreak);
    if (milestone) {
      setAchievedMilestone(milestone);
      setShowCelebration(true);
      onMilestoneReach?.(milestone);

      // Celebration animation
      streakScale.value = withSequence(
        withSpring(1.3, { damping: 5 }),
        withSpring(1, { damping: 10 })
      );

      const timeout = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [currentStreak, onMilestoneReach]);

  // Fire animation
  useEffect(() => {
    if (currentStreak > 0) {
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      fireRotate.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 300 }),
          withTiming(3, { duration: 300 })
        ),
        -1,
        true
      );
    }
  }, [currentStreak]);

  const handleDayPress = useCallback(
    (day: DayData) => {
      onDayPress?.(day);
    },
    [onDayPress]
  );

  const nextMilestone = useMemo(() => getNextMilestone(currentStreak), [currentStreak]);
  const currentMilestone = useMemo(() => getCurrentMilestone(currentStreak), [currentStreak]);
  const motivationalMessage = useMemo(
    () => getMotivationalMessage(currentStreak),
    [currentStreak]
  );

  const isStreakActive = useMemo(() => {
    const today = new Date();
    const lastCompleted = days
      .filter((d) => d.status === 'completed')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    if (!lastCompleted) return false;
    const diffDays = Math.floor(
      (today.getTime() - lastCompleted.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 1;
  }, [days]);

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fireScale.value },
      { rotate: `${fireRotate.value}deg` },
    ],
  }));

  const progressToNext = nextMilestone
    ? (currentStreak / nextMilestone.days) * 100
    : 100;

  return (
    <View style={[styles.container, style]}>
      {/* Streak Counter Header */}
      <View style={styles.header}>
        <View style={styles.streakContainer}>
          <Animated.View style={[styles.fireContainer, fireAnimatedStyle]}>
            <Text style={styles.fireEmoji}>🔥</Text>
            {currentStreak >= 7 && (
              <>
                <FireParticle delay={0} />
                <FireParticle delay={200} />
                <FireParticle delay={400} />
              </>
            )}
          </Animated.View>
          <Animated.View style={streakAnimatedStyle}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </Animated.View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {nextMilestone ? nextMilestone.days - currentStreak : 0}
            </Text>
            <Text style={styles.statLabel}>To Next</Text>
          </View>
        </View>
      </View>

      {/* Motivational Message */}
      {showMotivation && (
        <Animated.View style={styles.motivationContainer} entering={FadeInUp}>
          <Text style={styles.motivationText}>{motivationalMessage}</Text>
        </Animated.View>
      )}

      {/* Weekly Grid */}
      <View style={styles.weekGrid}>
        {days.map((day, index) => (
          <DayCell
            key={day.date.toISOString()}
            day={day}
            index={index}
            isStreakActive={isStreakActive}
            onPress={() => handleDayPress(day)}
            animate={animate}
          />
        ))}
      </View>

      {/* Progress to Next Milestone */}
      {showMilestones && nextMilestone && (
        <View style={styles.milestoneProgress}>
          <View style={styles.milestoneHeader}>
            <Text style={styles.milestoneTitle}>Next: {nextMilestone.title}</Text>
            <Text style={styles.milestoneDays}>
              {currentStreak}/{nextMilestone.days} days
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: `${progressToNext}%` },
              ]}
              entering={FadeIn}
            />
          </View>
          <Text style={styles.milestoneDescription}>{nextMilestone.description}</Text>
        </View>
      )}

      {/* Current Milestone Badge */}
      {showMilestones && currentMilestone && (
        <Animated.View style={styles.currentMilestone} entering={FadeInUp.delay(200)}>
          <Text style={styles.currentMilestoneReward}>{currentMilestone.reward}</Text>
          <View style={styles.currentMilestoneInfo}>
            <Text style={styles.currentMilestoneTitle}>{currentMilestone.title}</Text>
            <Text style={styles.currentMilestoneDesc}>Achieved!</Text>
          </View>
        </Animated.View>
      )}

      {/* Milestone Celebration */}
      {showCelebration && achievedMilestone && (
        <Animated.View style={styles.celebrationOverlay} entering={FadeIn}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>{achievedMilestone.reward}</Text>
            <Text style={styles.celebrationTitle}>Milestone Reached!</Text>
            <Text style={styles.celebrationName}>{achievedMilestone.title}</Text>
            <Text style={styles.celebrationDescription}>
              {achievedMilestone.description}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Streak Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Streak Tips</Text>
        <Text style={styles.tipText}>
          {currentStreak === 0
            ? 'Start your streak today by completing an activity!'
            : currentStreak < 3
            ? 'Consistency builds habits. Keep going!'
            : currentStreak < 7
            ? 'You\'re building momentum. Don\'t break the chain!'
            : 'Amazing dedication! Your streak is inspiring!'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireContainer: {
    position: 'relative',
    marginRight: 12,
  },
  fireEmoji: {
    fontSize: 48,
  },
  fireParticle: {
    position: 'absolute',
    top: -10,
    left: 10,
  },
  fireParticleText: {
    fontSize: 16,
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  motivationContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCell: {
    width: 44,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  dayCompleted: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dayMissed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  dayToday: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  dayUpcoming: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  dayFuture: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  statusIndicator: {
    marginTop: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakIcon: {
    fontSize: 12,
  },
  milestoneProgress: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  milestoneDays: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  milestoneDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  currentMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  currentMilestoneReward: {
    fontSize: 32,
    marginRight: 12,
  },
  currentMilestoneInfo: {
    flex: 1,
  },
  currentMilestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  currentMilestoneDesc: {
    fontSize: 12,
    color: '#B45309',
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    zIndex: 100,
  },
  celebrationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 280,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  celebrationName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 8,
  },
  celebrationDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default WeeklyStreakTracker;
