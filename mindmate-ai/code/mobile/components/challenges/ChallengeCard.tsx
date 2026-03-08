/**
 * ChallengeCard.tsx
 * 
 * Animated, engaging challenge card component for MindMate AI
 * Features: Press animations, progress indicators, category icons, difficulty badges
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type ChallengeCategory = 
  | 'mindfulness' 
  | 'breathing' 
  | 'meditation' 
  | 'journaling' 
  | 'gratitude' 
  | 'affirmation' 
  | 'movement';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  durationMinutes: number;
  points: number;
  isCompleted: boolean;
  progress: number; // 0-100
  streakDays?: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
  style?: ViewStyle;
  index?: number;
}

const categoryConfig: Record<ChallengeCategory, { 
  icon: string; 
  colors: [string, string];
  label: string;
}> = {
  mindfulness: {
    icon: 'leaf-outline',
    colors: ['#10B981', '#059669'],
    label: 'Mindfulness',
  },
  breathing: {
    icon: 'airplane-outline',
    colors: ['#3B82F6', '#2563EB'],
    label: 'Breathing',
  },
  meditation: {
    icon: 'moon-outline',
    colors: ['#8B5CF6', '#7C3AED'],
    label: 'Meditation',
  },
  journaling: {
    icon: 'create-outline',
    colors: ['#F59E0B', '#D97706'],
    label: 'Journaling',
  },
  gratitude: {
    icon: 'heart-outline',
    colors: ['#EC4899', '#DB2777'],
    label: 'Gratitude',
  },
  affirmation: {
    icon: 'star-outline',
    colors: ['#F97316', '#EA580C'],
    label: 'Affirmation',
  },
  movement: {
    icon: 'fitness-outline',
    colors: ['#06B6D4', '#0891B2'],
    label: 'Movement',
  },
};

const difficultyColors: Record<ChallengeDifficulty, string> = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  style,
  index = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const config = categoryConfig[challenge.category];

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: challenge.progress,
      duration: 800,
      delay: 300 + index * 100,
      useNativeDriver: false,
    }).start();
  }, [challenge.progress]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePress = () => {
    onPress(challenge);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={config.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Background Pattern */}
          <View style={styles.pattern}>
            <Ionicons
              name={config.icon as any}
              size={120}
              color="rgba(255,255,255,0.08)"
              style={styles.backgroundIcon}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header Row */}
            <View style={styles.header}>
              <View style={styles.categoryBadge}>
                <Ionicons
                  name={config.icon as any}
                  size={14}
                  color="#FFF"
                />
                <Text style={styles.categoryText}>{config.label}</Text>
              </View>
              
              <View style={styles.difficultyBadge}>
                <View
                  style={[
                    styles.difficultyDot,
                    { backgroundColor: difficultyColors[challenge.difficulty] },
                  ]}
                />
                <Text style={styles.difficultyText}>
                  {challenge.difficulty.charAt(0).toUpperCase() +
                    challenge.difficulty.slice(1)}
                </Text>
              </View>
            </View>

            {/* Title & Description */}
            <Text style={styles.title} numberOfLines={2}>
              {challenge.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {challenge.description}
            </Text>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>
                    {challenge.durationMinutes} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="trophy-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>
                    {challenge.points} pts
                  </Text>
                </View>
                {challenge.streakDays && challenge.streakDays > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons name="flame-outline" size={14} color="#FCD34D" />
                    <Text style={[styles.metaText, styles.streakText]}>
                      {challenge.streakDays} day streak
                    </Text>
                  </View>
                )}
              </View>

              {/* Completion Status */}
              {challenge.isCompleted ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                </View>
              ) : (
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#FFF" />
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {!challenge.isCompleted && challenge.progress > 0 && (
              <View style={styles.progressContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    { width: progressWidth },
                  ]}
                />
              </View>
            )}

            {/* Completed Overlay */}
            {challenge.isCompleted && (
              <View style={styles.completedOverlay}>
                <Ionicons name="checkmark-done-circle" size={48} color="#FFF" />
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  touchable: {
    borderRadius: 20,
  },
  gradient: {
    minHeight: 180,
    position: 'relative',
  },
  pattern: {
    position: 'absolute',
    right: -20,
    top: -20,
    opacity: 0.5,
  },
  backgroundIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    padding: 20,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 26,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  streakText: {
    color: '#FCD34D',
    fontWeight: '600',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderTopRightRadius: 4,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  completedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
});

export default ChallengeCard;
