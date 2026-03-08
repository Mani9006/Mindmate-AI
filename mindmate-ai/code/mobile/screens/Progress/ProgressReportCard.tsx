/**
 * ProgressReportCard.tsx
 * 
 * Expandable progress report card component for React Native.
 * Displays comprehensive progress metrics with smooth expand/collapse animations,
 * trend indicators, and detailed breakdowns of mental health journey progress.
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
  ViewStyle,
  LayoutAnimation,
  Platform,
  UIManager,
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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animated components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Types
export type TrendDirection = 'up' | 'down' | 'neutral';
export type MetricType = 'mood' | 'sleep' | 'activity' | 'social' | 'therapy' | 'custom';

export interface MetricData {
  id: string;
  type: MetricType;
  label: string;
  value: number;
  unit?: string;
  previousValue?: number;
  target?: number;
  trend?: TrendDirection;
  trendValue?: number;
  icon: string;
  color: string;
}

export interface ProgressInsight {
  id: string;
  type: 'positive' | 'improvement' | 'observation' | 'suggestion';
  title: string;
  description: string;
  relatedMetricId?: string;
}

export interface ProgressReportCardProps {
  title: string;
  subtitle?: string;
  period: string;
  metrics: MetricData[];
  insights?: ProgressInsight[];
  onExpand?: (expanded: boolean) => void;
  onMetricPress?: (metric: MetricData) => void;
  onExport?: () => void;
  onShare?: () => void;
  style?: ViewStyle;
  initiallyExpanded?: boolean;
  showTrends?: boolean;
  showTargets?: boolean;
}

// Default colors by metric type
const METRIC_COLORS: Record<MetricType, string> = {
  mood: '#10B981',
  sleep: '#6366F1',
  activity: '#F59E0B',
  social: '#EC4899',
  therapy: '#8B5CF6',
  custom: '#6B7280',
};

// Default icons by metric type
const METRIC_ICONS: Record<MetricType, string> = {
  mood: '😊',
  sleep: '😴',
  activity: '🏃',
  social: '👥',
  therapy: '🧠',
  custom: '📊',
};

/**
 * Calculates trend direction and value
 */
const calculateTrend = (current: number, previous: number): { direction: TrendDirection; value: number } => {
  if (!previous || previous === 0) return { direction: 'neutral', value: 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
    value: Math.abs(change),
  };
};

/**
 * Progress bar component
 */
interface ProgressBarProps {
  progress: number;
  color: string;
  height?: number;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 8,
  animated = true,
}) => {
  const widthAnim = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      widthAnim.value = withTiming(progress, { duration: 800 });
    } else {
      widthAnim.value = progress;
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));

  return (
    <View style={[styles.progressTrack, { height }]}>
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: color, height },
          animatedStyle,
        ]}
      />
    </View>
  );
};

/**
 * Metric card component
 */
interface MetricCardProps {
  metric: MetricData;
  onPress: () => void;
  showTrend: boolean;
  showTarget: boolean;
  index: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  onPress,
  showTrend,
  showTarget,
  index,
}) => {
  const trend = useMemo(() => {
    if (metric.trend) {
      return { direction: metric.trend, value: metric.trendValue || 0 };
    }
    if (metric.previousValue !== undefined) {
      return calculateTrend(metric.value, metric.previousValue);
    }
    return { direction: 'neutral' as TrendDirection, value: 0 };
  }, [metric]);

  const progressToTarget = metric.target
    ? Math.min((metric.value / metric.target) * 100, 100)
    : 0;

  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = () => {
    // For mood/sleep, up is good. For others, depends on context
    if (metric.type === 'mood' || metric.type === 'sleep') {
      return trend.direction === 'up' ? '#10B981' : trend.direction === 'down' ? '#EF4444' : '#6B7280';
    }
    return trend.direction === 'up' ? '#10B981' : trend.direction === 'down' ? '#EF4444' : '#6B7280';
  };

  return (
    <AnimatedTouchable
      style={[styles.metricCard, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
      entering={FadeInUp.delay(index * 50)}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconContainer, { backgroundColor: `${metric.color}20` }]}>
          <Text style={styles.metricIcon}>{metric.icon}</Text>
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          {showTrend && trend.value > 0 && (
            <View style={styles.trendContainer}>
              <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
                {getTrendIcon()}
              </Text>
              <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                {trend.value.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.metricValueContainer}>
          <Text style={[styles.metricValue, { color: metric.color }]}>
            {metric.value}
          </Text>
          {metric.unit && <Text style={styles.metricUnit}>{metric.unit}</Text>}
        </View>
      </View>

      {showTarget && metric.target && (
        <View style={styles.targetContainer}>
          <ProgressBar progress={progressToTarget} color={metric.color} />
          <View style={styles.targetLabels}>
            <Text style={styles.targetLabel}>0</Text>
            <Text style={styles.targetLabel}>Target: {metric.target}</Text>
          </View>
        </View>
      )}
    </AnimatedTouchable>
  );
};

/**
 * Insight item component
 */
interface InsightItemProps {
  insight: ProgressInsight;
  index: number;
}

const InsightItem: React.FC<InsightItemProps> = ({ insight, index }) => {
  const getInsightStyle = () => {
    switch (insight.type) {
      case 'positive':
        return styles.insightPositive;
      case 'improvement':
        return styles.insightImprovement;
      case 'suggestion':
        return styles.insightSuggestion;
      default:
        return styles.insightObservation;
    }
  };

  const getInsightIcon = () => {
    switch (insight.type) {
      case 'positive':
        return '✨';
      case 'improvement':
        return '📈';
      case 'suggestion':
        return '💡';
      default:
        return '👁';
    }
  };

  return (
    <Animated.View
      style={[styles.insightItem, getInsightStyle()]}
      entering={FadeInUp.delay(index * 100)}
    >
      <Text style={styles.insightIcon}>{getInsightIcon()}</Text>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>
      </View>
    </Animated.View>
  );
};

export const ProgressReportCard: React.FC<ProgressReportCardProps> = ({
  title,
  subtitle,
  period,
  metrics,
  insights,
  onExpand,
  onMetricPress,
  onExport,
  onShare,
  style,
  initiallyExpanded = false,
  showTrends = true,
  showTargets = true,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const rotateAnim = useSharedValue(initiallyExpanded ? 180 : 0);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    rotateAnim.value = withSpring(newExpanded ? 180 : 0, { damping: 15 });
    onExpand?.(newExpanded);
  }, [expanded, onExpand]);

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const metricsWithTargets = metrics.filter((m) => m.target);
    if (metricsWithTargets.length === 0) return 0;
    const totalProgress = metricsWithTargets.reduce(
      (sum, m) => sum + Math.min((m.value / (m.target || 1)) * 100, 100),
      0
    );
    return totalProgress / metricsWithTargets.length;
  }, [metrics]);

  // Calculate average trend
  const averageTrend = useMemo(() => {
    const metricsWithTrends = metrics.filter((m) => m.previousValue !== undefined);
    if (metricsWithTrends.length === 0) return { direction: 'neutral' as TrendDirection, value: 0 };
    const totalChange = metricsWithTrends.reduce((sum, m) => {
      const change = ((m.value - (m.previousValue || 0)) / (m.previousValue || 1)) * 100;
      return sum + change;
    }, 0);
    const avgChange = totalChange / metricsWithTrends.length;
    return {
      direction: avgChange > 5 ? 'up' : avgChange < -5 ? 'down' : 'neutral',
      value: Math.abs(avgChange),
    };
  }, [metrics]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{period}</Text>
            </View>
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerRight}>
          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <Text style={styles.overallProgressValue}>{overallProgress.toFixed(0)}%</Text>
            {averageTrend.value > 0 && (
              <Text
                style={[
                  styles.overallTrend,
                  averageTrend.direction === 'up'
                    ? styles.trendUp
                    : averageTrend.direction === 'down'
                    ? styles.trendDown
                    : styles.trendNeutral,
                ]}
              >
                {averageTrend.direction === 'up'
                  ? '↗'
                  : averageTrend.direction === 'down'
                  ? '↘'
                  : '→'}
              </Text>
            )}
          </View>

          {/* Expand/Chevron */}
          <Animated.View style={[styles.chevron, chevronAnimatedStyle]}>
            <Text style={styles.chevronText}>▼</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Collapsed Summary */}
      {!expanded && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryMetrics}>
            {metrics.slice(0, 3).map((metric, index) => (
              <View key={metric.id} style={styles.summaryMetric}>
                <Text style={styles.summaryMetricIcon}>{metric.icon}</Text>
                <Text style={styles.summaryMetricValue}>{metric.value}</Text>
                <Text style={styles.summaryMetricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <Animated.View style={styles.expandedContent} entering={FadeIn}>
          {/* Metrics Grid */}
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                onPress={() => onMetricPress?.(metric)}
                showTrend={showTrends}
                showTarget={showTargets}
                index={index}
              />
            ))}
          </View>

          {/* Insights Section */}
          {insights && insights.length > 0 && (
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Insights</Text>
              {insights.map((insight, index) => (
                <InsightItem key={insight.id} insight={insight} index={index} />
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onExport}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📥</Text>
              <Text style={styles.actionText}>Export</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onShare}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  periodBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  overallProgressValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  overallTrend: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  trendUp: {
    color: '#10B981',
  },
  trendDown: {
    color: '#EF4444',
  },
  trendNeutral: {
    color: '#6B7280',
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    padding: 16,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryMetric: {
    alignItems: 'center',
  },
  summaryMetricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  summaryMetricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  expandedContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  targetContainer: {
    marginTop: 10,
  },
  progressTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 4,
  },
  targetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  targetLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  insightPositive: {
    backgroundColor: '#D1FAE5',
  },
  insightImprovement: {
    backgroundColor: '#DBEAFE',
  },
  insightSuggestion: {
    backgroundColor: '#FEF3C7',
  },
  insightObservation: {
    backgroundColor: '#F3F4F6',
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  insightDescription: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});

export default ProgressReportCard;
