/**
 * Emotion Indicator Component for MindMate AI Video Session
 * Subtle visual indicator of detected emotions for user awareness
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Emotion types
export type EmotionType = 
  | 'neutral' 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'fearful' 
  | 'disgusted' 
  | 'surprised';

// Emotion data
export interface EmotionData {
  emotions: Record<EmotionType, number>;
  dominantEmotion: EmotionType;
  confidence: number;
  faceDetected: boolean;
}

// Component props
export interface EmotionIndicatorProps {
  emotionData: EmotionData | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
  showDetails?: boolean;
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

// Emotion configuration
interface EmotionConfig {
  icon: string;
  color: string;
  label: string;
  description: string;
}

const EMOTION_CONFIG: Record<EmotionType, EmotionConfig> = {
  neutral: {
    icon: 'emoticon-neutral',
    color: '#8E8E93',
    label: 'Neutral',
    description: 'Taking it all in',
  },
  happy: {
    icon: 'emoticon-happy',
    color: '#34C759',
    label: 'Positive',
    description: 'Feeling good',
  },
  sad: {
    icon: 'emoticon-sad',
    color: '#5856D6',
    label: 'Reflective',
    description: 'Processing emotions',
  },
  angry: {
    icon: 'emoticon-angry',
    color: '#FF3B30',
    label: 'Intense',
    description: 'Strong feelings',
  },
  fearful: {
    icon: 'emoticon-frown',
    color: '#FF9500',
    label: 'Uncertain',
    description: 'Working through anxiety',
  },
  disgusted: {
    icon: 'emoticon-disgusted',
    color: '#AF52DE',
    label: 'Unsettled',
    description: 'Processing discomfort',
  },
  surprised: {
    icon: 'emoticon-excited',
    color: '#FF2D55',
    label: 'Engaged',
    description: 'New insights',
  },
};

// Mini emotion bar component
interface EmotionBarProps {
  emotion: EmotionType;
  value: number;
  isDominant: boolean;
}

const EmotionBar: React.FC<EmotionBarProps> = ({ emotion, value, isDominant }) => {
  const config = EMOTION_CONFIG[emotion];
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: value * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value, widthAnim]);

  return (
    <View style={styles.barContainer}>
      <Icon 
        name={config.icon} 
        size={14} 
        color={isDominant ? config.color : 'rgba(255,255,255,0.5)'} 
      />
      <View style={styles.barTrack}>
        <Animated.View 
          style={[
            styles.barFill,
            { 
              backgroundColor: config.color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              opacity: isDominant ? 1 : 0.5,
            }
          ]} 
        />
      </View>
      <Text style={[
        styles.barValue,
        isDominant && { color: config.color }
      ]}>
        {Math.round(value * 100)}%
      </Text>
    </View>
  );
};

// Main Emotion Indicator Component
export const EmotionIndicator: React.FC<EmotionIndicatorProps> = ({
  emotionData,
  isVisible,
  onToggleVisibility,
  showDetails = false,
  position = 'topRight',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the indicator
  useEffect(() => {
    if (emotionData?.faceDetected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
    }
  }, [emotionData?.faceDetected, pulseAnim]);

  // Fade animation for visibility
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnim]);

  // Get position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'topLeft':
        return { top: 60, left: 16 };
      case 'topRight':
        return { top: 60, right: 16 };
      case 'bottomLeft':
        return { bottom: 200, left: 16 };
      case 'bottomRight':
        return { bottom: 200, right: 16 };
      default:
        return { top: 60, right: 16 };
    }
  };

  // No face detected
  if (!emotionData?.faceDetected) {
    return (
      <Animated.View style={[
        styles.container,
        getPositionStyle(),
        { opacity: fadeAnim }
      ]}>
        <View style={styles.noFaceContainer}>
          <Icon name="face-recognition" size={20} color="rgba(255,255,255,0.5)" />
          <Text style={styles.noFaceText}>No face detected</Text>
        </View>
      </Animated.View>
    );
  }

  const dominantEmotion = emotionData.dominantEmotion;
  const config = EMOTION_CONFIG[dominantEmotion];
  const confidence = Math.round(emotionData.confidence * 100);

  return (
    <Animated.View style={[
      styles.container,
      getPositionStyle(),
      { opacity: fadeAnim }
    ]}>
      <TouchableOpacity
        onPress={onToggleVisibility}
        activeOpacity={0.8}
      >
        {/* Main Indicator */}
        <View style={styles.indicatorContainer}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { 
                backgroundColor: `${config.color}20`,
                borderColor: config.color,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Icon name={config.icon} size={24} color={config.color} />
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.emotionLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.emotionDescription}>
              {config.description}
            </Text>
          </View>

          {/* Confidence indicator */}
          <View style={styles.confidenceContainer}>
            <View style={[
              styles.confidenceDot,
              { 
                backgroundColor: config.color,
                opacity: emotionData.confidence 
              }
            ]} />
            <Text style={styles.confidenceText}>{confidence}%</Text>
          </View>
        </View>

        {/* Detailed Emotion Bars */}
        {isVisible && showDetails && (
          <View style={styles.detailsContainer}>
            <View style={styles.divider} />
            {(Object.entries(emotionData.emotions) as [EmotionType, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([emotion, value]) => (
                <EmotionBar
                  key={emotion}
                  emotion={emotion}
                  value={value}
                  isDominant={emotion === dominantEmotion}
                />
              ))
            }
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 12,
    minWidth: 160,
    backdropFilter: 'blur(10px)',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  emotionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  emotionDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  confidenceText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Details section
  detailsContainer: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  // Emotion bar styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barValue: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    width: 32,
    textAlign: 'right',
  },
  // No face detected
  noFaceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  noFaceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
});

export default EmotionIndicator;
