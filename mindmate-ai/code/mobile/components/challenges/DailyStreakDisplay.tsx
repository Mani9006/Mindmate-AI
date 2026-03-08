/**
 * DailyStreakDisplay.tsx
 * 
 * Daily streak display component for MindMate AI
 * Features: Weekly calendar view, streak counter, progress rings, milestone celebrations
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type DayStatus = 'completed' | 'missed' | 'upcoming' | 'today';

export interface DayData {
  date: Date;
  status: DayStatus;
  challengesCompleted: number;
  totalChallenges: number;
}

export interface StreakMilestone {
  days: number;
  title: string;
  reward: string;
  achieved: boolean;
}

interface DailyStreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  weekData: DayData[];
  milestones?: StreakMilestone[];
  onDayPress?: (day: DayData) => void;
  onMilestonePress?: (milestone: StreakMilestone) => void;
  compact?: boolean;
}

const defaultMilestones: StreakMilestone[] = [
  { days: 3, title: 'Getting Started', reward: '50 bonus points', achieved: false },
  { days: 7, title: 'Week Warrior', reward: '100 bonus points', achieved: false },
  { days: 14, title: 'Two Week Streak', reward: '200 bonus points', achieved: false },
  { days: 30, title: 'Month Master', reward: '500 bonus points + Badge', achieved: false },
  { days: 60, title: 'Consistency King', reward: '1000 bonus points + Badge', achieved: false },
  { days: 100, title: 'Century Club', reward: '2000 bonus points + Exclusive Badge', achieved: false },
];

// Circular Progress Component
const CircularProgress: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  children: React.ReactNode;
}> = ({ progress, size, strokeWidth, color, children }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: progress,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circleSvg, { width: size, height: size }]}>
        {/* Background Circle */}
        <View
          style={[
            styles.circleBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'rgba(255,255,255,0.1)',
            },
          ]}
        />
        {/* Progress Circle */}
        <Animated.View
          style={[
            styles.circleProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderDasharray: `${circumference}`,
              borderDashoffset: strokeDashoffset,
            },
          ]}
        />
      </View>
      <View style={[styles.circleContent, { width: size, height: size }]}>
        {children}
      </View>
    </View>
  );
};

// Day Circle Component
const DayCircle: React.FC<{
  day: DayData;
  index: number;
  onPress: () => void;
}> = ({ day, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  const dayName = day.date.toLocaleDateString('en-US', { weekday: 'narrow' });
  const dayNumber = day.date.getDate();

  const getStatusColors = () => {
    switch (day.status) {
      case 'completed':
        return ['#10B981', '#059669'];
      case 'today':
        return ['#8B5CF6', '#7C3AED'];
      case 'missed':
        return ['#EF4444', '#DC2626'];
      default:
        return ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'];
    }
  };

  const getStatusIcon = () => {
    switch (day.status) {
      case 'completed':
        return <Ionicons name="checkmark" size={16} color="#FFF" />;
      case 'missed':
        return <Ionicons name="close" size={16} color="#FFF" />;
      case 'today':
        return <Ionicons name="sunny" size={16} color="#FFF" />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity onPress={onPress} style={styles.dayCircleContainer}>
        <LinearGradient
          colors={getStatusColors()}
          style={[
            styles.dayCircle,
            day.status === 'today' && styles.todayCircle,
          ]}
        >
          {getStatusIcon()}
        </LinearGradient>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayNumber}>{dayNumber}</Text>
        {day.status === 'completed' && day.challengesCompleted > 0 && (
          <View style={styles.miniProgress}>
            <View
              style={[
                styles.miniProgressFill,
                {
                  width: `${(day.challengesCompleted / day.totalChallenges) * 100}%`,
                },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Flame Animation Component
const AnimatedFlame: React.FC<{ count: number }> = ({ count }) => {
  const flames = useRef(
    Array(Math.min(count, 7)).fill(0).map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    flames.forEach((flame, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 80),
          Animated.timing(flame, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(flame, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [count]);

  return (
    <View style={styles.flameContainer}>
      {flames.map((flame, i) => (
        <Animated.View
          key={i}
          style={[
            styles.flame,
            { transform: [{ scale: flame }] },
          ]}
        >
          <Ionicons name="flame" size={28} color="#F97316" />
        </Animated.View>
      ))}
    </View>
  );
};

export const DailyStreakDisplay: React.FC<DailyStreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  weekData,
  milestones = defaultMilestones,
  onDayPress,
  onMilestonePress,
  compact = false,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<StreakMilestone | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const streakBounce = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Calculate next milestone
  const nextMilestone = milestones.find((m) => m.days > currentStreak && !m.achieved);
  const progressToNext = nextMilestone
    ? (currentStreak / nextMilestone.days) * 100
    : 100;

  useEffect(() => {
    // Entry animation
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
      Animated.spring(streakBounce, {
        toValue: 1,
        friction: 4,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for streak
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {}}
          style={styles.compactTouch}
        >
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            style={styles.compactGradient}
          >
            <AnimatedFlame count={Math.min(currentStreak, 5)} />
            <View style={styles.compactTextContainer}>
              <Text style={styles.compactStreakNumber}>{currentStreak}</Text>
              <Text style={styles.compactStreakLabel}>day streak</Text>
            </View>
            {nextMilestone && (
              <View style={styles.compactProgress}>
                <View
                  style={[
                    styles.compactProgressFill,
                    { width: `${progressToNext}%` },
                  ]}
                />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="flame" size={24} color="#F97316" />
            <Text style={styles.headerTitle}>Your Streak</Text>
          </View>
          <View style={styles.headerRight}>
            <Ionicons name="trophy" size={18} color="#FCD34D" />
            <Text style={styles.bestStreak}>Best: {longestStreak}</Text>
          </View>
        </View>

        {/* Main Streak Display */}
        <View style={styles.streakMain}>
          <Animated.View
            style={{
              transform: [{ scale: Animated.multiply(streakBounce, pulseAnim) }],
            }}
          >
            <CircularProgress
              progress={progressToNext / 100}
              size={140}
              strokeWidth={8}
              color="#F97316"
            >
              <View style={styles.streakCenter}>
                <AnimatedFlame count={Math.min(currentStreak, 5)} />
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>days</Text>
              </View>
            </CircularProgress>
          </Animated.View>

          {/* Next Milestone */}
          {nextMilestone && (
            <View style={styles.nextMilestone}>
              <Text style={styles.nextLabel}>Next: {nextMilestone.title}</Text>
              <View style={styles.milestoneProgress}>
                <View style={styles.milestoneBar}>
                  <Animated.View
                    style={[
                      styles.milestoneFill,
                      { width: `${progressToNext}%` },
                    ]}
                  />
                </View>
                <Text style={styles.milestoneText}>
                  {currentStreak}/{nextMilestone.days} days
                </Text>
              </View>
              <Text style={styles.milestoneReward}>🎁 {nextMilestone.reward}</Text>
            </View>
          )}
        </View>

        {/* Weekly Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.calendarTitle}>This Week</Text>
          <View style={styles.calendarRow}>
            {weekData.map((day, index) => (
              <DayCircle
                key={day.date.toISOString()}
                day={day}
                index={index}
                onPress={() => onDayPress?.(day)}
              />
            ))}
          </View>
        </View>

        {/* Milestones Scroll */}
        <View style={styles.milestonesSection}>
          <Text style={styles.milestonesTitle}>Milestones</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScroll}
          >
            {milestones.map((milestone, index) => (
              <TouchableOpacity
                key={milestone.days}
                onPress={() => onMilestonePress?.(milestone)}
                style={[
                  styles.milestoneCard,
                  milestone.achieved && styles.milestoneCardAchieved,
                  currentStreak >= milestone.days && !milestone.achieved &&
                    styles.milestoneCardCurrent,
                ]}
              >
                <LinearGradient
                  colors={
                    milestone.achieved
                      ? ['#10B981', '#059669']
                      : currentStreak >= milestone.days
                      ? ['#8B5CF6', '#7C3AED']
                      : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                  }
                  style={styles.milestoneGradient}
                >
                  <View style={styles.milestoneIcon}>
                    {milestone.achieved ? (
                      <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                    ) : currentStreak >= milestone.days ? (
                      <Ionicons name="lock-open" size={28} color="#FFF" />
                    ) : (
                      <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.5)" />
                    )}
                  </View>
                  <Text style={styles.milestoneDays}>{milestone.days}</Text>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  {milestone.achieved && (
                    <View style={styles.achievedBadge}>
                      <Text style={styles.achievedText}>Achieved!</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {weekData.filter((d) => d.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="checkmark-done-circle" size={20} color="#10B981" />
            <Text style={styles.statValue}>
              {weekData.reduce((sum, d) => sum + d.challengesCompleted, 0)}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>
              {Math.round((currentStreak / (longestStreak || 1)) * 100)}%
            </Text>
            <Text style={styles.statLabel}>To Best</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  background: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 77, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  bestStreak: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  circleSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  circleBackground: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  circleContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakCenter: {
    alignItems: 'center',
  },
  flameContainer: {
    flexDirection: 'row',
    marginBottom: -5,
  },
  flame: {
    marginHorizontal: -3,
  },
  streakNumber: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '800',
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  nextMilestone: {
    flex: 1,
    marginLeft: 20,
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  milestoneProgress: {
    marginBottom: 8,
  },
  milestoneBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  milestoneFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 4,
  },
  milestoneText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  milestoneReward: {
    color: '#FCD34D',
    fontSize: 12,
  },
  calendarSection: {
    marginBottom: 24,
  },
  calendarTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircleContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  todayCircle: {
    borderWidth: 3,
    borderColor: '#FCD34D',
  },
  dayName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 2,
  },
  dayNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  miniProgress: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  milestonesSection: {
    marginBottom: 20,
  },
  milestonesTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  milestonesScroll: {
    gap: 10,
    paddingRight: 20,
  },
  milestoneCard: {
    width: 110,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
  },
  milestoneCardAchieved: {
    elevation: 5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  milestoneCardCurrent: {
    elevation: 5,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  milestoneGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIcon: {
    marginBottom: 8,
  },
  milestoneDays: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  milestoneTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
  },
  achievedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  achievedText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // Compact styles
  compactContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 120,
  },
  compactTouch: {
    width: '100%',
  },
  compactGradient: {
    padding: 12,
    alignItems: 'center',
  },
  compactTextContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  compactStreakNumber: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  compactStreakLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  compactProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
});

export default DailyStreakDisplay;
