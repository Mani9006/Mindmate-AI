/**
 * BreathingExercise.tsx
 * 
 * Animated breathing exercise component for MindMate AI
 * Features: Animated expanding/contracting circle, countdown timer, multiple breathing patterns
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width, height) * 0.6;

export type BreathingPattern = 'box' | '4-7-8' | 'coherent' | 'relaxing';

interface BreathingPhase {
  name: string;
  duration: number; // seconds
  instruction: string;
  scale: number;
}

interface BreathingConfig {
  name: string;
  description: string;
  phases: BreathingPhase[];
  color: [string, string];
}

const breathingPatterns: Record<BreathingPattern, BreathingConfig> = {
  box: {
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, hold - equal counts',
    color: ['#3B82F6', '#8B5CF6'],
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Breathe In', scale: 1.5 },
      { name: 'hold', duration: 4, instruction: 'Hold', scale: 1.5 },
      { name: 'exhale', duration: 4, instruction: 'Breathe Out', scale: 1 },
      { name: 'hold', duration: 4, instruction: 'Hold', scale: 1 },
    ],
  },
  '4-7-8': {
    name: '4-7-8 Breathing',
    description: 'Relaxation technique for stress relief',
    color: ['#10B981', '#06B6D4'],
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Breathe In', scale: 1.5 },
      { name: 'hold', duration: 7, instruction: 'Hold', scale: 1.5 },
      { name: 'exhale', duration: 8, instruction: 'Breathe Out', scale: 1 },
    ],
  },
  coherent: {
    name: 'Coherent Breathing',
    description: '5 breaths per minute for balance',
    color: ['#F59E0B', '#EC4899'],
    phases: [
      { name: 'inhale', duration: 6, instruction: 'Breathe In', scale: 1.5 },
      { name: 'exhale', duration: 6, instruction: 'Breathe Out', scale: 1 },
    ],
  },
  relaxing: {
    name: 'Relaxing Breath',
    description: 'Gentle rhythm for deep relaxation',
    color: ['#8B5CF6', '#3B82F6'],
    phases: [
      { name: 'inhale', duration: 4, instruction: 'Breathe In', scale: 1.4 },
      { name: 'exhale', duration: 6, instruction: 'Breathe Out', scale: 1 },
    ],
  },
};

interface BreathingExerciseProps {
  pattern?: BreathingPattern;
  durationMinutes?: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  pattern = 'box',
  durationMinutes = 3,
  onComplete,
  onCancel,
}) => {
  const config = breathingPatterns[pattern];
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = durationMinutes * 60;

  // Calculate total cycle duration
  const cycleDuration = config.phases.reduce((sum, phase) => sum + phase.duration, 0);

  // Initialize phase timer
  useEffect(() => {
    if (isActive) {
      const currentPhase = config.phases[currentPhaseIndex];
      setPhaseTimeRemaining(currentPhase.duration);
      
      // Animate to phase scale
      Animated.spring(scaleAnim, {
        toValue: currentPhase.scale,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Fade opacity based on phase
      Animated.timing(opacityAnim, {
        toValue: currentPhase.scale > 1 ? 0.8 : 0.4,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, currentPhaseIndex, config.phases]);

  // Breathing animation loop
  useEffect(() => {
    if (isActive) {
      const currentPhase = config.phases[currentPhaseIndex];
      
      phaseTimerRef.current = setInterval(() => {
        setPhaseTimeRemaining((prev) => {
          if (prev <= 1) {
            // Move to next phase
            const nextIndex = (currentPhaseIndex + 1) % config.phases.length;
            if (nextIndex === 0) {
              setCompletedCycles((c) => c + 1);
            }
            setCurrentPhaseIndex(nextIndex);
            return config.phases[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (phaseTimerRef.current) {
          clearInterval(phaseTimerRef.current);
        }
      };
    }
  }, [isActive, currentPhaseIndex, config.phases]);

  // Main countdown timer
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newValue = prev - 1;
          // Update progress
          progressAnim.setValue(1 - newValue / totalDuration);
          
          if (newValue <= 0) {
            handleComplete();
            return 0;
          }
          return newValue;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }
  }, [isActive, timeRemaining]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
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
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleStart = () => {
    setIsActive(true);
    setShowControls(false);
    setCurrentPhaseIndex(0);
    Vibration.vibrate(100);
  };

  const handlePause = () => {
    setIsActive(false);
    setShowControls(true);
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleComplete = useCallback(() => {
    setIsActive(false);
    Vibration.vibrate([100, 100, 100, 100]);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleReset = () => {
    setIsActive(false);
    setTimeRemaining(durationMinutes * 60);
    setCurrentPhaseIndex(0);
    setCompletedCycles(0);
    setShowControls(true);
    scaleAnim.setValue(1);
    progressAnim.setValue(0);
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPhase = config.phases[currentPhaseIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.patternName}>{config.name}</Text>
            <Text style={styles.patternDescription}>{config.description}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: config.color[0],
              },
            ]}
          />
        </View>

        {/* Main Circle Area */}
        <View style={styles.circleContainer}>
          {/* Outer Rings */}
          <Animated.View
            style={[
              styles.outerRing,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: config.color[0],
              },
            ]}
          />
          
          {/* Breathing Circle */}
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <LinearGradient
              colors={config.color}
              style={styles.circleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Inner content */}
              <View style={styles.circleContent}>
                {isActive ? (
                  <>
                    <Text style={styles.phaseInstruction}>
                      {currentPhase.instruction}
                    </Text>
                    <Text style={styles.phaseTimer}>
                      {phaseTimeRemaining}
                    </Text>
                  </>
                ) : (
                  <Ionicons
                    name="airplane-outline"
                    size={60}
                    color="#FFF"
                  />
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Particle effects */}
          {isActive && (
            <>
              {[...Array(6)].map((_, i) => (
                <AnimatedParticle
                  key={i}
                  index={i}
                  color={config.color[0]}
                />
              ))}
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCycles}</Text>
            <Text style={styles.statLabel}>Cycles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {config.phases[currentPhaseIndex]?.name || 'ready'}
            </Text>
            <Text style={styles.statLabel}>Phase</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {showControls ? (
            <>
              {!isActive && timeRemaining < totalDuration ? (
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    onPress={handleReset}
                    style={[styles.controlButton, styles.secondaryButton]}
                  >
                    <Ionicons name="refresh" size={24} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleStart}
                    style={[styles.controlButton, styles.primaryButton]}
                  >
                    <Ionicons name="play" size={32} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleStart}
                  style={[styles.startButton, { backgroundColor: config.color[0] }]}
                >
                  <Text style={styles.startButtonText}>Start Breathing</Text>
                  <Ionicons name="play" size={24} color="#FFF" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              onPress={handlePause}
              style={[styles.controlButton, styles.pauseButton]}
            >
              <Ionicons name="pause" size={32} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Pattern Selector */}
        <View style={styles.patternSelector}>
          {(Object.keys(breathingPatterns) as BreathingPattern[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                if (!isActive) {
                  handleReset();
                }
              }}
              style={[
                styles.patternChip,
                pattern === p && styles.patternChipActive,
              ]}
            >
              <Text
                style={[
                  styles.patternChipText,
                  pattern === p && styles.patternChipTextActive,
                ]}
              >
                {breathingPatterns[p].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Animated Particle Component
interface AnimatedParticleProps {
  index: number;
  color: string;
}

const AnimatedParticle: React.FC<AnimatedParticleProps> = ({ index, color }) => {
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
            toValue: -150,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1500,
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
            duration: 1000,
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

  const angle = (index * 60) * (Math.PI / 180);
  const startX = Math.cos(angle) * 80;
  const startY = Math.sin(angle) * 80;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [
            { translateX: startX },
            { translateY: Animated.add(new Animated.Value(startY), translateY) },
            { scale },
          ],
          opacity,
        },
      ]}
    />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  patternName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  patternDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  placeholder: {
    width: 44,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    borderRadius: (CIRCLE_SIZE + 40) / 2,
    borderWidth: 2,
    opacity: 0.3,
  },
  breathingCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseInstruction: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  phaseTimer: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '300',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  controlsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pauseButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  patternSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  patternChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternChipActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  patternChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  patternChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default BreathingExercise;
