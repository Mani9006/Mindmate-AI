/**
 * MeditationPlayer.tsx
 * 
 * Full-featured meditation player component for MindMate AI
 * Features: Audio playback, timer, visualizations, session tracking
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
  Slider,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export type MeditationType = 'guided' | 'unguided' | 'sleep' | 'focus' | 'anxiety';

export interface MeditationSession {
  id: string;
  title: string;
  description: string;
  type: MeditationType;
  durationMinutes: number;
  audioUrl?: string;
  backgroundImage?: string;
  teacherName?: string;
  tags: string[];
}

interface MeditationPlayerProps {
  session: MeditationSession;
  onComplete?: () => void;
  onClose?: () => void;
}

// Sound wave visualization component
const SoundWave: React.FC<{ isPlaying: boolean; color: string }> = ({ isPlaying, color }) => {
  const bars = useRef(
    Array(20).fill(0).map(() => ({
      height: new Animated.Value(10),
      anim: null as Animated.CompositeAnimation | null,
    }))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      bars.forEach((bar, i) => {
        bar.anim = Animated.loop(
          Animated.sequence([
            Animated.timing(bar.height, {
              toValue: Math.random() * 60 + 20,
              duration: 400 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar.height, {
              toValue: 10,
              duration: 400 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ])
        );
        setTimeout(() => bar.anim?.start(), i * 50);
      });
    } else {
      bars.forEach((bar) => {
        bar.anim?.stop();
        Animated.timing(bar.height, {
          toValue: 10,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      bars.forEach((bar) => bar.anim?.stop());
    };
  }, [isPlaying]);

  return (
    <View style={styles.waveContainer}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: bar.height,
              backgroundColor: color,
              marginHorizontal: 2,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Orbiting particles for visual effect
const OrbitingParticles: React.FC<{ isPlaying: boolean; color: string }> = ({ isPlaying, color }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 360,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotation.stopAnimation();
    }
  }, [isPlaying]);

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.particlesContainer,
        { transform: [{ rotate: spin }] },
      ]}
    >
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = Math.cos(angle) * 120;
        const y = Math.sin(angle) * 120;
        return (
          <View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: color,
                transform: [{ translateX: x }, { translateY: y }],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

export const MeditationPlayer: React.FC<MeditationPlayerProps> = ({
  session,
  onComplete,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(session.durationMinutes * 60);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isSoundLoaded, setIsSoundLoaded] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = session.durationMinutes * 60;

  // Color scheme based on meditation type
  const typeColors: Record<MeditationType, [string, string]> = {
    guided: ['#8B5CF6', '#A78BFA'],
    unguided: ['#10B981', '#34D399'],
    sleep: ['#3B82F6', '#60A5FA'],
    focus: ['#F59E0B', '#FBBF24'],
    anxiety: ['#06B6D4', '#22D3EE'],
  };

  const colors = typeColors[session.type];

  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        if (session.audioUrl) {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: session.audioUrl },
            { shouldPlay: false, volume },
            onPlaybackStatusUpdate
          );
          setSound(newSound);
          setIsSoundLoaded(true);
        }
      } catch (error) {
        console.log('Audio init error:', error);
      }
    };

    initAudio();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [session.audioUrl]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        handleComplete();
      }
    }
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  // Countdown timer
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newValue = prev - 1;
          const newProgress = 1 - newValue / totalDuration;
          setProgress(newProgress);
          progressAnim.setValue(newProgress);

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
  }, [isPlaying, timeRemaining]);

  const handlePlay = async () => {
    setIsPlaying(true);
    setIsPaused(false);
    
    if (sound && isSoundLoaded) {
      await sound.playAsync();
    }
    
    Vibration.vibrate(50);
  };

  const handlePause = async () => {
    setIsPlaying(false);
    setIsPaused(true);
    
    if (sound && isSoundLoaded) {
      await sound.pauseAsync();
    }
  };

  const handleStop = async () => {
    setIsPlaying(false);
    setIsPaused(false);
    setTimeRemaining(totalDuration);
    setProgress(0);
    progressAnim.setValue(0);
    
    if (sound && isSoundLoaded) {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };

  const handleComplete = useCallback(async () => {
    setIsPlaying(false);
    Vibration.vibrate([100, 100, 100]);
    
    if (sound && isSoundLoaded) {
      await sound.stopAsync();
    }
    
    if (onComplete) {
      onComplete();
    }
  }, [onComplete, sound, isSoundLoaded]);

  const handleVolumeChange = async (value: number) => {
    setVolume(value);
    if (sound && isSoundLoaded) {
      await sound.setVolumeAsync(value);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = () => {
    switch (session.type) {
      case 'sleep': return 'moon-outline';
      case 'focus': return 'eye-outline';
      case 'anxiety': return 'heart-outline';
      case 'guided': return 'mic-outline';
      default: return 'leaf-outline';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Background */}
      <ImageBackground
        source={
          session.backgroundImage
            ? { uri: session.backgroundImage }
            : require('../../../assets/images/meditation-bg.jpg')
        }
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.typeBadge}>
              <Ionicons name={getTypeIcon() as any} size={14} color="#FFF" />
              <Text style={styles.typeText}>
                {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowVolume(!showVolume)}
              style={styles.volumeButton}
            >
              <Ionicons
                name={volume > 0 ? 'volume-medium-outline' : 'volume-mute-outline'}
                size={24}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>

          {/* Volume Control */}
          {showVolume && (
            <Animated.View style={styles.volumeContainer}>
              <Ionicons name="volume-low" size={16} color="#FFF" />
              <Slider
                style={styles.volumeSlider}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumValue={0}
                maximumValue={1}
                minimumTrackTintColor={colors[0]}
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#FFF"
              />
              <Ionicons name="volume-high" size={16} color="#FFF" />
            </Animated.View>
          )}

          {/* Main Content */}
          <View style={styles.content}>
            {/* Session Info */}
            <View style={styles.sessionInfo}>
              <Text style={styles.title}>{session.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {session.description}
              </Text>
              {session.teacherName && (
                <View style={styles.teacherRow}>
                  <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.teacherName}>{session.teacherName}</Text>
                </View>
              )}
            </View>

            {/* Visualization Circle */}
            <View style={styles.visualizationContainer}>
              <OrbitingParticles isPlaying={isPlaying} color={colors[0]} />
              
              <Animated.View
                style={[
                  styles.circle,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: colors[0],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.circleGradient}
                >
                  {/* Progress Ring */}
                  <View style={styles.progressRing}>
                    <Animated.View
                      style={[
                        styles.progressArc,
                        {
                          borderColor: colors[0],
                          transform: [
                            {
                              rotate: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>

                  {/* Time Display */}
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeRemaining}>
                      {formatTime(timeRemaining)}
                    </Text>
                    <Text style={styles.timeLabel}>remaining</Text>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Sound Wave */}
              <View style={styles.waveWrapper}>
                <SoundWave isPlaying={isPlaying} color={colors[1]} />
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {session.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: colors[0],
                    },
                  ]}
                />
              </View>
              <View style={styles.timeLabels}>
                <Text style={styles.timeLabelSmall}>
                  {formatTime(totalDuration - timeRemaining)}
                </Text>
                <Text style={styles.timeLabelSmall}>
                  {formatTime(totalDuration)}
                </Text>
              </View>
            </View>

            {/* Control Buttons */}
            <View style={styles.controlButtons}>
              <TouchableOpacity
                onPress={handleStop}
                style={[styles.controlButton, styles.secondaryButton]}
              >
                <Ionicons name="stop" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={isPlaying ? handlePause : handlePlay}
                style={[
                  styles.controlButton,
                  styles.playButton,
                  { backgroundColor: colors[0] },
                ]}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#FFF"
                  style={isPlaying ? {} : { marginLeft: 4 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const newTime = Math.min(timeRemaining + 60, totalDuration);
                  setTimeRemaining(newTime);
                }}
                style={[styles.controlButton, styles.secondaryButton]}
              >
                <Ionicons name="add" size={24} color="#FFF" />
                <Text style={styles.addTimeText}>1m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  typeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  volumeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  sessionInfo: {
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teacherName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  particlesContainer: {
    position: 'absolute',
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArc: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeRemaining: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  waveWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 80,
    paddingHorizontal: 20,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  controls: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  progressBarContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabelSmall: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addTimeText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 2,
  },
});

export default MeditationPlayer;
