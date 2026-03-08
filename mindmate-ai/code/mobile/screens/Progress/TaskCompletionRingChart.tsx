/**
 * TaskCompletionRingChart.tsx
 * 
 * Animated ring chart component for displaying task completion rates.
 * Features multiple rings for different task categories, progress animations,
 * and interactive segments with detailed breakdowns.
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
  useAnimatedProps,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Types
export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  gradientColors?: [string, string];
  completed: number;
  total: number;
}

export interface TaskCompletionRingChartProps {
  categories: TaskCategory[];
  overallCompletion?: number;
  onCategoryPress?: (category: TaskCategory) => void;
  onCenterPress?: () => void;
  style?: ViewStyle;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  showDetails?: boolean;
  animate?: boolean;
  animationDuration?: number;
}

// Default category colors with gradients
const DEFAULT_CATEGORY_COLORS: Record<string, [string, string]> = {
  mindfulness: ['#10B981', '#34D399'],
  exercise: ['#3B82F6', '#60A5FA'],
  journaling: ['#8B5CF6', '#A78BFA'],
  sleep: ['#6366F1', '#818CF8'],
  social: ['#F59E0B', '#FBBF24'],
  therapy: ['#EC4899', '#F472B6'],
  medication: ['#14B8A6', '#2DD4BF'],
  selfcare: ['#F97316', '#FB923C'],
};

/**
 * Calculates the circumference of a circle
 */
const calculateCircumference = (radius: number): number => {
  return 2 * Math.PI * radius;
};

/**
 * Calculates stroke dash offset based on progress
 */
const calculateStrokeOffset = (
  circumference: number,
  progress: number
): number => {
  return circumference - (progress / 100) * circumference;
};

/**
 * Gets gradient colors for a category
 */
const getGradientColors = (categoryId: string, customColors?: [string, string]): [string, string] => {
  return customColors || DEFAULT_CATEGORY_COLORS[categoryId.toLowerCase()] || ['#6B7280', '#9CA3AF'];
};

/**
 * Ring Segment Component
 */
interface RingSegmentProps {
  radius: number;
  strokeWidth: number;
  progress: number;
  color: string;
  gradientColors: [string, string];
  startAngle: number;
  animationProgress: Animated.SharedValue<number>;
  index: number;
  onPress?: () => void;
}

const RingSegment: React.FC<RingSegmentProps> = ({
  radius,
  strokeWidth,
  progress,
  color,
  gradientColors,
  startAngle,
  animationProgress,
  index,
  onPress,
}) => {
  const circumference = calculateCircumference(radius);
  const strokeDasharray = `${circumference} ${circumference}`;

  const animatedProps = useAnimatedProps(() => {
    const currentProgress = interpolate(
      animationProgress.value,
      [0, 1],
      [0, progress]
    );
    const offset = calculateStrokeOffset(circumference, currentProgress);
    return {
      strokeDashoffset: offset,
    };
  });

  const rotation = `${startAngle} ${radius + strokeWidth} ${radius + strokeWidth}`;

  return (
    <G rotation={rotation}>
      <Defs>
        <LinearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </LinearGradient>
      </Defs>
      <AnimatedCircle
        cx={radius + strokeWidth}
        cy={radius + strokeWidth}
        r={radius}
        fill="transparent"
        stroke={`url(#gradient-${index})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        animatedProps={animatedProps}
      />
    </G>
  );
};

export const TaskCompletionRingChart: React.FC<TaskCompletionRingChartProps> = ({
  categories,
  overallCompletion,
  onCategoryPress,
  onCenterPress,
  style,
  size = 200,
  strokeWidth = 12,
  showLegend = true,
  showDetails = true,
  animate = true,
  animationDuration = 1500,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  const animationProgress = useSharedValue(0);

  // Calculate overall completion if not provided
  const calculatedOverall = useMemo(() => {
    if (overallCompletion !== undefined) return overallCompletion;
    const totalTasks = categories.reduce((sum, cat) => sum + cat.total, 0);
    const completedTasks = categories.reduce((sum, cat) => sum + cat.completed, 0);
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [categories, overallCompletion]);

  // Calculate ring positions
  const rings = useMemo(() => {
    const maxRadius = (size - strokeWidth * 2) / 2;
    const ringSpacing = strokeWidth + 4;

    return categories.map((category, index) => {
      const radius = maxRadius - index * ringSpacing;
      const progress = category.total > 0
        ? Math.round((category.completed / category.total) * 100)
        : 0;
      const gradientColors = getGradientColors(category.id, category.gradientColors);

      return {
        ...category,
        radius,
        progress,
        gradientColors,
        circumference: calculateCircumference(radius),
      };
    });
  }, [categories, size, strokeWidth]);

  // Start animation
  useEffect(() => {
    if (animate) {
      animationProgress.value = withTiming(
        1,
        {
          duration: animationDuration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setIsAnimating)(false);
          }
        }
      );
    } else {
      animationProgress.value = 1;
      setIsAnimating(false);
    }
  }, [animate, animationDuration]);

  const handleCategoryPress = useCallback(
    (category: TaskCategory) => {
      setSelectedCategory(category.id === selectedCategory?.id ? null : category);
      onCategoryPress?.(category);
    },
    [onCategoryPress, selectedCategory]
  );

  const handleCenterPress = useCallback(() => {
    setSelectedCategory(null);
    onCenterPress?.();
  }, [onCenterPress]);

  // Animated center text
  const centerTextAnimatedStyle = useAnimatedProps(() => {
    const scale = interpolate(animationProgress.value, [0, 1], [0.8, 1]);
    return {
      transform: [{ scale }],
    };
  });

  const centerSize = size - strokeWidth * 4;
  const centerRadius = centerSize / 2;

  return (
    <View style={[styles.container, style]}>
      {/* Chart Container */}
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          {/* Background rings */}
          {rings.map((ring, index) => (
            <Circle
              key={`bg-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={ring.radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />
          ))}

          {/* Progress rings */}
          {rings.map((ring, index) => (
            <RingSegment
              key={`progress-${index}`}
              radius={ring.radius}
              strokeWidth={strokeWidth}
              progress={ring.progress}
              color={ring.color}
              gradientColors={ring.gradientColors}
              startAngle={-90}
              animationProgress={animationProgress}
              index={index}
            />
          ))}

          {/* Center content */}
          <G>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={centerRadius}
              fill="#FFFFFF"
            />
            <SvgText
              x={size / 2}
              y={size / 2 - 8}
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              fill="#111827"
            >
              {calculatedOverall}%
            </SvgText>
            <SvgText
              x={size / 2}
              y={size / 2 + 14}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              Complete
            </SvgText>
          </G>
        </Svg>

        {/* Touch overlay for center */}
        <TouchableOpacity
          style={[
            styles.centerTouch,
            { width: centerSize, height: centerSize, borderRadius: centerRadius },
          ]}
          onPress={handleCenterPress}
          activeOpacity={0.8}
        />
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {rings.map((ring, index) => (
            <TouchableOpacity
              key={ring.id}
              style={[
                styles.legendItem,
                selectedCategory?.id === ring.id && styles.legendItemSelected,
              ]}
              onPress={() => handleCategoryPress(ring)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: ring.gradientColors[0] },
                ]}
              />
              <View style={styles.legendInfo}>
                <Text style={styles.legendName}>{ring.name}</Text>
                <Text style={styles.legendProgress}>
                  {ring.completed}/{ring.total} ({ring.progress}%)
                </Text>
              </View>
              <View style={styles.legendBarContainer}>
                <View
                  style={[
                    styles.legendBar,
                    {
                      width: `${ring.progress}%`,
                      backgroundColor: ring.gradientColors[0],
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Details Panel */}
      {showDetails && selectedCategory && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <View
              style={[
                styles.detailsColor,
                {
                  backgroundColor: rings.find((r) => r.id === selectedCategory.id)
                    ?.gradientColors[0],
                },
              ]}
            />
            <Text style={styles.detailsTitle}>{selectedCategory.name}</Text>
            <Text style={styles.detailsPercentage}>
              {rings.find((r) => r.id === selectedCategory.id)?.progress}%
            </Text>
          </View>

          <View style={styles.detailsStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{selectedCategory.completed}</Text>
              <Text style={styles.detailStatLabel}>Completed</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>
                {selectedCategory.total - selectedCategory.completed}
              </Text>
              <Text style={styles.detailStatLabel}>Remaining</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{selectedCategory.total}</Text>
              <Text style={styles.detailStatLabel}>Total</Text>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${rings.find((r) => r.id === selectedCategory.id)?.progress || 0}%`,
                    backgroundColor: rings.find((r) => r.id === selectedCategory.id)
                      ?.gradientColors[0],
                  },
                ]}
              />
            </View>
          </View>
        </View>
      )}

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {categories.reduce((sum, cat) => sum + cat.completed, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Done</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {categories.reduce((sum, cat) => sum + cat.total, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {categories.filter((cat) => cat.completed === cat.total).length}
          </Text>
          <Text style={styles.summaryLabel}>Perfect</Text>
        </View>
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
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerTouch: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  legendItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  legendProgress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  legendBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  legendBar: {
    height: '100%',
    borderRadius: 3,
  },
  detailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  detailsPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  detailsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  detailStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  detailStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
});

export default TaskCompletionRingChart;
