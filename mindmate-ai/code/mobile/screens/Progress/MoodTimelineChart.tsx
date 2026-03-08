/**
 * MoodTimelineChart.tsx
 * 
 * Interactive mood timeline chart using Victory Native for React Native.
 * Displays mood trends over time with smooth animations and touch interactions.
 * 
 * @module Progress
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryArea,
  VictoryLabel,
} from 'victory-native';
import { Svg, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 20, bottom: 40, left: 50, right: 30 };

// Mood scale definitions
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: Date;
  mood: MoodValue;
  note?: string;
  tags?: string[];
}

export interface MoodTimelineChartProps {
  data: MoodEntry[];
  timeRange?: 'week' | 'month' | '3months' | 'year';
  onDataPointPress?: (entry: MoodEntry) => void;
  onTimeRangeChange?: (range: string) => void;
  style?: ViewStyle;
  showGradient?: boolean;
  animate?: boolean;
}

// Mood color mapping
const MOOD_COLORS: Record<MoodValue, string> = {
  1: '#EF4444', // Very Low - Red
  2: '#F97316', // Low - Orange
  3: '#EAB308', // Neutral - Yellow
  4: '#22C55E', // Good - Green
  5: '#10B981', // Excellent - Emerald
};

const MOOD_LABELS: Record<MoodValue, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

const TIME_RANGES = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '3months', label: '3M' },
  { key: 'year', label: 'Year' },
];

/**
 * Formats date for chart display
 */
const formatDate = (date: Date, timeRange: string): string => {
  const options: Intl.DateTimeFormatOptions =
    timeRange === 'week'
      ? { weekday: 'short' }
      : timeRange === 'month'
      ? { day: 'numeric' }
      : { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Filters and processes data based on time range
 */
const processDataForRange = (
  data: MoodEntry[],
  timeRange: string
): { x: Date; y: number; entry: MoodEntry }[] => {
  const now = new Date();
  let cutoffDate = new Date();

  switch (timeRange) {
    case 'week':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return data
    .filter((entry) => entry.date >= cutoffDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((entry) => ({
      x: entry.date,
      y: entry.mood,
      entry,
    }));
};

/**
 * Calculates mood statistics
 */
const calculateStats = (data: { y: number }[]) => {
  if (data.length === 0) return { average: 0, trend: 0, highest: 0, lowest: 0 };

  const values = data.map((d) => d.y);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);

  // Calculate trend (comparing first half to second half)
  const midPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midPoint);
  const secondHalf = values.slice(midPoint);
  const firstAvg =
    firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
  const secondAvg =
    secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
  const trend = secondAvg - firstAvg;

  return { average, trend, highest, lowest };
};

export const MoodTimelineChart: React.FC<MoodTimelineChartProps> = ({
  data,
  timeRange = 'week',
  onDataPointPress,
  onTimeRangeChange,
  style,
  showGradient = true,
  animate = true,
}) => {
  const [selectedRange, setSelectedRange] = useState(timeRange);
  const [selectedPoint, setSelectedPoint] = useState<MoodEntry | null>(null);

  const processedData = useMemo(
    () => processDataForRange(data, selectedRange),
    [data, selectedRange]
  );

  const stats = useMemo(() => calculateStats(processedData), [processedData]);

  const handleTimeRangeChange = useCallback(
    (range: string) => {
      setSelectedRange(range);
      onTimeRangeChange?.(range);
    },
    [onTimeRangeChange]
  );

  const handlePointPress = useCallback(
    (datum: { entry: MoodEntry }) => {
      setSelectedPoint(datum.entry);
      onDataPointPress?.(datum.entry);
    },
    [onDataPointPress]
  );

  // Animation values
  const chartOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  React.useEffect(() => {
    chartOpacity.value = withTiming(1, { duration: 500 });
    statsOpacity.value = withTiming(1, { duration: 700 });
  }, [processedData]);

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [
      {
        translateY: interpolate(statsOpacity.value, [0, 1], [20, 0]),
      },
    ],
  }));

  if (processedData.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noDataText}>No mood data available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.rangeButton,
              selectedRange === range.key && styles.rangeButtonActive,
            ]}
            onPress={() => handleTimeRangeChange(range.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === range.key && styles.rangeButtonTextActive,
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Summary */}
      <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.average.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              stats.trend > 0
                ? styles.trendUp
                : stats.trend < 0
                ? styles.trendDown
                : styles.trendNeutral,
            ]}
          >
            {stats.trend > 0 ? '↗' : stats.trend < 0 ? '↘' : '→'}
            {Math.abs(stats.trend).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Trend</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: MOOD_COLORS[stats.highest as MoodValue] }]}>
            {MOOD_LABELS[stats.highest as MoodValue]}
          </Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
      </Animated.View>

      {/* Chart */}
      <Animated.View style={[styles.chartContainer, chartAnimatedStyle]}>
        <Svg width={SCREEN_WIDTH - 32} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
              <Stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
        </Svg>

        <VictoryChart
          width={SCREEN_WIDTH - 32}
          height={CHART_HEIGHT}
          padding={CHART_PADDING}
          containerComponent={
            <VictoryVoronoiContainer
              onActivated={(points) => {
                if (points.length > 0) {
                  handlePointPress(points[0] as { entry: MoodEntry });
                }
              }}
            />
          }
        >
          {/* Y Axis - Mood Scale */}
          <VictoryAxis
            dependentAxis
            domain={[0.5, 5.5]}
            tickValues={[1, 2, 3, 4, 5]}
            tickFormat={(t) => MOOD_LABELS[t as MoodValue]?.charAt(0) || ''}
            style={{
              axis: { stroke: '#E5E7EB' },
              tickLabels: { fontSize: 10, fill: '#6B7280' },
              grid: { stroke: '#F3F4F6', strokeDasharray: '4,4' },
            }}
          />

          {/* X Axis - Dates */}
          <VictoryAxis
            tickFormat={(x) => formatDate(x as Date, selectedRange)}
            style={{
              axis: { stroke: '#E5E7EB' },
              tickLabels: { fontSize: 10, fill: '#6B7280', angle: -45 },
              grid: { stroke: 'transparent' },
            }}
            fixLabelOverlap={true}
          />

          {/* Area under the line */}
          {showGradient && (
            <VictoryArea
              data={processedData}
              x="x"
              y="y"
              interpolation="monotoneX"
              style={{
                data: {
                  fill: 'url(#moodGradient)',
                  stroke: 'none',
                },
              }}
              animate={
                animate
                  ? {
                      duration: 500,
                      onLoad: { duration: 500 },
                    }
                  : undefined
              }
            />
          )}

          {/* Mood Line */}
          <VictoryLine
            data={processedData}
            x="x"
            y="y"
            interpolation="monotoneX"
            style={{
              data: {
                stroke: '#10B981',
                strokeWidth: 3,
              },
            }}
            animate={
              animate
                ? {
                    duration: 500,
                    onLoad: { duration: 500 },
                  }
                : undefined
            }
          />

          {/* Data Points */}
          <VictoryScatter
            data={processedData}
            x="x"
            y="y"
            size={6}
            style={{
              data: {
                fill: ({ datum }) => MOOD_COLORS[datum.y as MoodValue],
                stroke: '#FFFFFF',
                strokeWidth: 2,
              },
            }}
            labels={({ datum }) =>
              `${MOOD_LABELS[datum.y as MoodValue]}\n${formatDate(
                datum.x as Date,
                selectedRange
              )}`
            }
            labelComponent={
              <VictoryTooltip
                flyoutStyle={{
                  stroke: '#E5E7EB',
                  fill: '#FFFFFF',
                }}
                style={{
                  fontSize: 12,
                  fill: '#374151',
                }}
                flyoutPadding={10}
              />
            }
            animate={
              animate
                ? {
                    duration: 500,
                    onLoad: { duration: 500 },
                  }
                : undefined
            }
          />
        </VictoryChart>
      </Animated.View>

      {/* Selected Point Detail */}
      {selectedPoint && (
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.moodIndicator,
                { backgroundColor: MOOD_COLORS[selectedPoint.mood] },
              ]}
            />
            <Text style={styles.detailMood}>
              {MOOD_LABELS[selectedPoint.mood]}
            </Text>
            <Text style={styles.detailDate}>
              {selectedPoint.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          {selectedPoint.note && (
            <Text style={styles.detailNote}>{selectedPoint.note}</Text>
          )}
          {selectedPoint.tags && selectedPoint.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {selectedPoint.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  rangeButtonTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
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
  chartContainer: {
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 40,
  },
  detailContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  detailMood: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  detailDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailNote: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
  },
});

export default MoodTimelineChart;
