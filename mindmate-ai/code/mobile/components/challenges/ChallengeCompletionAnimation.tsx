/**
 * ChallengeCompletionAnimation.tsx
 * 
 * Celebration animation component for MindMate AI challenge completion
 * Features: Confetti, particle effects, achievement badges, streak celebration
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export interface CompletionData {
  challengeName: string;
  pointsEarned: number;
  streakDays: number;
  isNewStreakRecord?: boolean;
  badges?: string[];
  nextChallenge?: string;
}

interface ChallengeCompletionAnimationProps {
  data: CompletionData;
  onContinue?: () => void;
  onShare?: () => void;
  autoDismissDelay?: number;
}

// Confetti Particle Component
interface ConfettiPieceProps {
  color: string;
  delay: number;
  index: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, delay, index }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(Math.random() * 0.5 + 0.5)).current;

  useEffect(() => {
    const fallDuration = 3000 + Math.random() * 2000;
    const drift = (Math.random() - 0.5) * 200;
    
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: fallDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: Math.random() * width + drift,
          duration: fallDuration,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 360,
            duration: 500 + Math.random() * 500,
            useNativeDriver: true,
          })
        ),
        Animated.timing(opacity, {
          toValue: 0,
          duration: fallDuration * 0.3,
          delay: fallDuration * 0.7,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [delay]);

  const rotation = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const shapes = ['circle', 'square', 'triangle'];
  const shape = shapes[index % 3];

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotation },
            { scale },
          ],
          opacity,
          borderRadius: shape === 'circle' ? 4 : shape === 'square' ? 0 : 2,
          width: shape === 'triangle' ? 0 : 8,
          height: shape === 'triangle' ? 0 : 8,
          borderLeftWidth: shape === 'triangle' ? 6 : 0,
          borderRightWidth: shape === 'triangle' ? 6 : 0,
          borderBottomWidth: shape === 'triangle' ? 10 : 0,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: shape === 'triangle' ? color : 'transparent',
          backgroundColor: shape === 'triangle' ? 'transparent' : color,
        },
      ]}
    />
  );
};

// Floating Star Component
const FloatingStar: React.FC<{ delay: number; x: number }> = ({ delay, x }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
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
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.floatingStar,
        {
          left: x,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Ionicons name="star" size={24} color="#FCD34D" />
    </Animated.View>
  );
};

// Streak Flame Component
const StreakFlame: React.FC<{ count: number }> = ({ count }) => {
  const flames = useRef(
    Array(Math.min(count, 5)).fill(0).map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    flames.forEach((flame, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 100),
          Animated.timing(flame, {
            toValue: 1.3,
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
    <View style={styles.streakFlames}>
      {flames.map((flame, i) => (
        <Animated.View
          key={i}
          style={{
            transform: [{ scale: flame }],
          }}
        >
          <Ionicons name="flame" size={32} color="#F97316" />
        </Animated.View>
      ))}
    </View>
  );
};

export const ChallengeCompletionAnimation: React.FC<ChallengeCompletionAnimationProps> = ({
  data,
  onContinue,
  onShare,
  autoDismissDelay = 5000,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.5)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;
  const pointsBounce = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  const confettiColors = [
    '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA',
    '#F87171', '#22D3EE', '#FCD34D', '#C084FC', '#6EE7B7',
  ];

  useEffect(() => {
    // Vibrate on completion
    Vibration.vibrate([0, 100, 50, 100, 50, 200]);

    // Entry animations
    Animated.sequence([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Badge spin
      Animated.timing(badgeRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Points bounce
      Animated.spring(pointsBounce, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Streak pulse
    if (data.streakDays > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulse, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Auto dismiss
    if (autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue?.();
    });
  };

  const badgeRotation = badgeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const pointsScale = pointsBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: overlayAnim },
      ]}
    >
      {/* Confetti */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              color={confettiColors[i % confettiColors.length]}
              delay={i * 50}
              index={i}
            />
          ))}
        </View>
      )}

      {/* Floating Stars */}
      <View style={styles.starsContainer}>
        {[...Array(8)].map((_, i) => (
          <FloatingStar
            key={i}
            delay={i * 200}
            x={width * 0.1 + (i * width * 0.1)}
          />
        ))}
      </View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          style={styles.cardGradient}
        >
          {/* Success Badge */}
          <Animated.View
            style={[
              styles.badgeContainer,
              { transform: [{ rotate: badgeRotation }] },
            ]}
          >
            <View style={styles.badge}>
              <Ionicons name="checkmark-done" size={48} color="#FFF" />
            </View>
            <View style={styles.badgeRing} />
          </Animated.View>

          {/* Title */}
          <Text style={styles.congratsText}>Congratulations!</Text>
          <Text style={styles.challengeText}>{data.challengeName}</Text>
          <Text style={styles.completedText}>Completed</Text>

          {/* Points Earned */}
          <Animated.View
            style={[
              styles.pointsContainer,
              { transform: [{ scale: pointsScale }] },
            ]}
          >
            <LinearGradient
              colors={['#FCD34D', '#F59E0B']}
              style={styles.pointsBadge}
            >
              <Ionicons name="trophy" size={24} color="#FFF" />
              <Text style={styles.pointsText}>+{data.pointsEarned}</Text>
            </LinearGradient>
            <Text style={styles.pointsLabel}>Points Earned</Text>
          </Animated.View>

          {/* Streak Display */}
          {data.streakDays > 0 && (
            <Animated.View
              style={[
                styles.streakContainer,
                { transform: [{ scale: streakPulse }] },
              ]}
            >
              <StreakFlame count={Math.min(data.streakDays, 5)} />
              <View style={styles.streakBadge}>
                <Text style={styles.streakCount}>{data.streakDays}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              {data.isNewStreakRecord && (
                <View style={styles.recordBadge}>
                  <Ionicons name="trending-up" size={14} color="#FFF" />
                  <Text style={styles.recordText}>New Record!</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Badges Earned */}
          {data.badges && data.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesTitle}>Badges Earned</Text>
              <View style={styles.badgesRow}>
                {data.badges.map((badge, i) => (
                  <View key={i} style={styles.earnedBadge}>
                    <Ionicons name="medal" size={20} color="#FCD34D" />
                    <Text style={styles.earnedBadgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Next Challenge */}
          {data.nextChallenge && (
            <View style={styles.nextChallenge}>
              <Text style={styles.nextLabel}>Up Next</Text>
              <Text style={styles.nextName}>{data.nextChallenge}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {onShare && (
            <TouchableOpacity onPress={onShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={22} color="#7C3AED" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.continueButton}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  floatingStar: {
    position: 'absolute',
    bottom: '30%',
  },
  card: {
    width: width * 0.85,
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  cardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  badgeRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    top: -8,
    left: -8,
  },
  congratsText: {
    color: '#FCD34D',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  challengeText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  completedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 24,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    elevation: 5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pointsText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 8,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakFlames: {
    flexDirection: 'row',
    gap: -5,
    marginBottom: -10,
  },
  streakBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.5)',
  },
  streakCount: {
    color: '#F97316',
    fontSize: 32,
    fontWeight: '800',
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  recordText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  badgesContainer: {
    width: '100%',
    marginBottom: 16,
  },
  badgesTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  earnedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  nextChallenge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  shareText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  continueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ChallengeCompletionAnimation;
