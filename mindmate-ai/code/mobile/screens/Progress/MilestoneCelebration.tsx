/**
 * MilestoneCelebration.tsx
 * 
 * Full-featured milestone celebration component for React Native.
 * Displays animated confetti, badges, and celebration effects when users
 * reach significant milestones in their mental health journey.
 * 
 * @module Progress
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ViewStyle,
  Share,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animated components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Types
export type MilestoneType =
  | 'streak'
  | 'sessions'
  | 'mood_improvement'
  | 'journal_entries'
  | 'meditation_minutes'
  | 'custom';

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  value: number;
  unit?: string;
  icon: string;
  reward?: string;
  badgeColor?: string;
  shareMessage?: string;
}

export interface MilestoneCelebrationProps {
  milestone: Milestone | null;
  visible: boolean;
  onClose: () => void;
  onShare?: (milestone: Milestone) => void;
  onContinue?: () => void;
  style?: ViewStyle;
  autoCloseDelay?: number;
  showConfetti?: boolean;
  showBadge?: boolean;
  hapticFeedback?: boolean;
}

// Confetti particle types
interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  shape: 'circle' | 'square' | 'triangle';
}

// Confetti colors
const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#6C5CE7',
  '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894',
];

// Badge colors by type
const BADGE_COLORS: Record<MilestoneType, string> = {
  streak: '#FF9500',
  sessions: '#5856D6',
  mood_improvement: '#34C759',
  journal_entries: '#FF2D55',
  meditation_minutes: '#5AC8FA',
  custom: '#AF52DE',
};

// Default milestone messages
const DEFAULT_MESSAGES: Record<MilestoneType, string> = {
  streak: "You're building an amazing habit!",
  sessions: "Every session brings you closer to your goals!",
  mood_improvement: "Your dedication is paying off!",
  journal_entries: "Your reflections are powerful!",
  meditation_minutes: "Inner peace takes practice!",
  custom: "You've achieved something special!",
};

/**
 * Generates random confetti particles
 */
const generateConfetti = (count: number): ConfettiParticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 10 + 8,
    delay: Math.random() * 1000,
    duration: Math.random() * 2000 + 2000,
    rotation: Math.random() * 360,
    shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
  }));
};

/**
 * Confetti Particle Component
 */
interface ConfettiPieceProps {
  particle: ConfettiParticle;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ particle }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(particle.x);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(
        SCREEN_HEIGHT + 100,
        { duration: particle.duration, easing: Easing.out(Easing.quad) }
      );
      translateX.value = withTiming(
        particle.x + (Math.random() - 0.5) * 200,
        { duration: particle.duration }
      );
      rotate.value = withTiming(
        particle.rotation + Math.random() * 720,
        { duration: particle.duration }
      );
      opacity.value = withDelay(
        particle.duration - 500,
        withTiming(0, { duration: 500 })
      );
    }, particle.delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const renderShape = () => {
    switch (particle.shape) {
      case 'circle':
        return (
          <View
            style={[
              styles.confettiShape,
              {
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
              },
            ]}
          />
        );
      case 'triangle':
        return (
          <View
            style={[
              styles.confettiTriangle,
              {
                borderLeftWidth: particle.size / 2,
                borderRightWidth: particle.size / 2,
                borderBottomWidth: particle.size,
                borderBottomColor: particle.color,
              },
            ]}
          />
        );
      default:
        return (
          <View
            style={[
              styles.confettiShape,
              {
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              },
            ]}
          />
        );
    }
  };

  return (
    <Animated.View style={[styles.confettiPiece, animatedStyle]}>
      {renderShape()}
    </Animated.View>
  );
};

/**
 * Badge Component
 */
interface BadgeProps {
  milestone: Milestone;
  animate: boolean;
}

const Badge: React.FC<BadgeProps> = ({ milestone, animate }) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withDelay(
          300,
          withSpring(1.2, { damping: 8, stiffness: 100 })
        ),
        withSpring(1, { damping: 12, stiffness: 100 })
      );

      rotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [animate]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.5, 1], [1, 1.1]) }],
  }));

  const badgeColor = milestone.badgeColor || BADGE_COLORS[milestone.type];

  return (
    <View style={styles.badgeContainer}>
      <Animated.View
        style={[
          styles.badgeGlow,
          { backgroundColor: badgeColor },
          glowAnimatedStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.badge,
          { backgroundColor: badgeColor },
          badgeAnimatedStyle,
        ]}
      >
        <Text style={styles.badgeIcon}>{milestone.icon}</Text>
        <View style={styles.badgeValueContainer}>
          <Text style={styles.badgeValue}>{milestone.value}</Text>
          {milestone.unit && (
            <Text style={styles.badgeUnit}>{milestone.unit}</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

/**
 * Star burst effect component
 */
const StarBurst: React.FC = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1.5, { duration: 400, easing: Easing.out(Easing.quad) }),
      withTiming(2, { duration: 600, easing: Easing.in(Easing.quad) })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.starBurst, animatedStyle]}>
      {[...Array(8)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.starRay,
            { transform: [{ rotate: `${i * 45}deg` }] },
          ]}
        />
      ))}
    </Animated.View>
  );
};

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  visible,
  onClose,
  onShare,
  onContinue,
  style,
  autoCloseDelay = 8000,
  showConfetti = true,
  showBadge = true,
  hapticFeedback = true,
}) => {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  // Generate confetti when visible
  useEffect(() => {
    if (visible && showConfetti) {
      setConfetti(generateConfetti(50));
      setShowStarBurst(true);

      const timeout = setTimeout(() => {
        setShowStarBurst(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [visible, showConfetti]);

  // Animation on visibility change
  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentScale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }))
      );
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));

      // Auto close timer
      if (autoCloseDelay > 0) {
        autoCloseTimer.current = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      contentScale.value = withTiming(0.8, { duration: 200 });
      contentOpacity.value = withTiming(0, { duration: 200 });
    }

    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [visible, autoCloseDelay]);

  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(
      0,
      { duration: 200 },
      () => {
        runOnJS(onClose)();
      }
    );
    contentOpacity.value = withTiming(0, { duration: 200 });
    contentScale.value = withTiming(0.8, { duration: 200 });
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (milestone) {
      const message =
        milestone.shareMessage ||
        `I just reached ${milestone.value} ${milestone.unit || ''} ${milestone.title} on MindMate AI! 🎉`;

      try {
        await Share.share({
          message,
          title: 'Milestone Achieved!',
        });
        onShare?.(milestone);
      } catch (error) {
        console.error('Error sharing milestone:', error);
      }
    }
  }, [milestone, onShare]);

  const handleContinue = useCallback(() => {
    handleClose();
    onContinue?.();
  }, [handleClose, onContinue]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: contentOpacity.value,
  }));

  if (!milestone) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        {/* Confetti */}
        {showConfetti && confetti.map((particle) => (
          <ConfettiPiece key={particle.id} particle={particle} />
        ))}

        {/* Content */}
        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          {/* Star Burst */}
          {showStarBurst && <StarBurst />}

          {/* Badge */}
          {showBadge && <Badge milestone={milestone} animate={visible} />}

          {/* Title */}
          <Animated.Text
            style={styles.title}
            entering={FadeInDown.delay(400)}
          >
            Milestone Reached!
          </Animated.Text>

          {/* Milestone Name */}
          <Animated.Text
            style={styles.milestoneName}
            entering={FadeInDown.delay(500)}
          >
            {milestone.title}
          </Animated.Text>

          {/* Description */}
          <Animated.Text
            style={styles.description}
            entering={FadeInDown.delay(600)}
          >
            {milestone.description || DEFAULT_MESSAGES[milestone.type]}
          </Animated.Text>

          {/* Reward */}
          {milestone.reward && (
            <Animated.View
              style={styles.rewardContainer}
              entering={FadeInUp.delay(700)}
            >
              <Text style={styles.rewardEmoji}>{milestone.reward}</Text>
              <Text style={styles.rewardText}>Reward Unlocked!</Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View
            style={styles.buttonsContainer}
            entering={FadeInUp.delay(800)}
          >
            <AnimatedTouchable
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </AnimatedTouchable>

            <AnimatedTouchable
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </AnimatedTouchable>
          </Animated.View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  confettiShape: {
    position: 'absolute',
  },
  confettiTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.9,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  starBurst: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starRay: {
    position: 'absolute',
    width: 4,
    height: 80,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    top: 20,
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  badgeGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  badge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  badgeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  milestoneName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  continueButton: {
    flex: 1.5,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default MilestoneCelebration;
