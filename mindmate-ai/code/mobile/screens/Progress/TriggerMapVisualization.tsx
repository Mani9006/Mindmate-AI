/**
 * TriggerMapVisualization.tsx
 * 
 * Interactive trigger map visualization component for React Native.
 * Displays emotional triggers as a network/graph visualization with
 * connections, intensity indicators, and detailed analysis.
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
  ScrollView,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  FadeIn,
  FadeInUp,
  Layout,
  runOnJS,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated components
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

// Types
export type TriggerCategory =
  | 'social'
  | 'work'
  | 'health'
  | 'environment'
  | 'relationships'
  | 'financial'
  | 'family'
  | 'other';

export type TriggerSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Trigger {
  id: string;
  name: string;
  category: TriggerCategory;
  severity: TriggerSeverity;
  frequency: number; // Times triggered in period
  avgMoodImpact: number; // -5 to 5 scale
  lastTriggered?: Date;
  relatedTriggers?: string[]; // IDs of related triggers
  notes?: string;
  copingStrategies?: string[];
}

export interface TriggerConnection {
  from: string;
  to: string;
  strength: number; // 0-1
}

export interface TriggerMapVisualizationProps {
  triggers: Trigger[];
  connections?: TriggerConnection[];
  onTriggerPress?: (trigger: Trigger) => void;
  onAddTrigger?: () => void;
  onEditTrigger?: (trigger: Trigger) => void;
  style?: ViewStyle;
  showNetwork?: boolean;
  showAnalysis?: boolean;
  showCopingStrategies?: boolean;
  timeRange?: 'week' | 'month' | '3months';
}

// Category colors
const CATEGORY_COLORS: Record<TriggerCategory, string> = {
  social: '#8B5CF6',
  work: '#3B82F6',
  health: '#10B981',
  environment: '#F59E0B',
  relationships: '#EC4899',
  financial: '#6366F1',
  family: '#F97316',
  other: '#6B7280',
};

// Severity colors
const SEVERITY_COLORS: Record<TriggerSeverity, string> = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

// Category icons
const CATEGORY_ICONS: Record<TriggerCategory, string> = {
  social: '👥',
  work: '💼',
  health: '❤️',
  environment: '🌍',
  relationships: '💕',
  financial: '💰',
  family: '🏠',
  other: '📌',
};

// Severity labels
const SEVERITY_LABELS: Record<TriggerSeverity, string> = {
  low: 'Low Impact',
  medium: 'Medium Impact',
  high: 'High Impact',
  critical: 'Critical',
};

// Time range labels
const TIME_RANGE_LABELS: Record<string, string> = {
  week: 'This Week',
  month: 'This Month',
  '3months': 'Last 3 Months',
};

/**
 * Calculates node positions for network visualization
 */
const calculateNodePositions = (
  triggers: Trigger[],
  width: number,
  height: number
): Map<string, { x: number; y: number; radius: number }> => {
  const positions = new Map<string, { x: number; y: number; radius: number }>();
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;

  // Group triggers by category
  const categoryGroups: Record<string, Trigger[]> = {};
  triggers.forEach((trigger) => {
    if (!categoryGroups[trigger.category]) {
      categoryGroups[trigger.category] = [];
    }
    categoryGroups[trigger.category].push(trigger);
  });

  const categories = Object.keys(categoryGroups);
  const angleStep = (2 * Math.PI) / Math.max(categories.length, 1);

  categories.forEach((category, catIndex) => {
    const categoryTriggers = categoryGroups[category];
    const categoryAngle = catIndex * angleStep - Math.PI / 2;
    const categoryRadius = maxRadius * 0.6;

    categoryTriggers.forEach((trigger, triggerIndex) => {
      const triggerAngle =
        categoryAngle + (triggerIndex - categoryTriggers.length / 2) * 0.3;
      const triggerRadius =
        categoryRadius + (triggerIndex % 2) * 30 + trigger.frequency * 5;

      const x = centerX + Math.cos(triggerAngle) * triggerRadius;
      const y = centerY + Math.sin(triggerAngle) * triggerRadius;
      const radius = 20 + trigger.frequency * 3 + Math.abs(trigger.avgMoodImpact) * 2;

      positions.set(trigger.id, { x, y, radius: Math.min(radius, 50) });
    });
  });

  return positions;
};

/**
 * Trigger node component for network visualization
 */
interface TriggerNodeProps {
  trigger: Trigger;
  position: { x: number; y: number; radius: number };
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({
  trigger,
  position,
  isSelected,
  onPress,
  index,
}) => {
  const scale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (trigger.severity === 'critical' || trigger.severity === 'high') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [trigger.severity]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseAnim.value }],
  }));

  const severityColor = SEVERITY_COLORS[trigger.severity];
  const categoryColor = CATEGORY_COLORS[trigger.category];

  return (
    <AnimatedTouchable
      style={[
        styles.nodeContainer,
        {
          left: position.x - position.radius,
          top: position.y - position.radius,
          width: position.radius * 2,
          height: position.radius * 2,
        },
        animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      entering={FadeIn.delay(index * 50)}
    >
      <View
        style={[
          styles.node,
          {
            width: position.radius * 2,
            height: position.radius * 2,
            borderRadius: position.radius,
            backgroundColor: categoryColor,
            borderWidth: isSelected ? 3 : 2,
            borderColor: isSelected ? '#FFFFFF' : severityColor,
          },
        ]}
      >
        <Text style={styles.nodeIcon}>{CATEGORY_ICONS[trigger.category]}</Text>
        {trigger.frequency > 1 && (
          <View style={[styles.frequencyBadge, { backgroundColor: severityColor }]}>
            <Text style={styles.frequencyText}>{trigger.frequency}</Text>
          </View>
        )}
      </View>
      <Text style={styles.nodeLabel} numberOfLines={1}>
        {trigger.name}
      </Text>
    </AnimatedTouchable>
  );
};

/**
 * Connection line component
 */
interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strength: number;
  index: number;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  strength,
  index,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 30, withTiming(strength * 0.6, { duration: 500 }));
  }, []);

  const animatedProps = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.connectionLine,
        {
          left: from.x,
          top: from.y,
          width: Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)),
          transform: [
            {
              rotate: `${Math.atan2(to.y - from.y, to.x - from.x)}rad`,
            },
          ],
        },
        animatedProps,
      ]}
    />
  );
};

/**
 * Trigger list item component
 */
interface TriggerListItemProps {
  trigger: Trigger;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

const TriggerListItem: React.FC<TriggerListItemProps> = ({
  trigger,
  isSelected,
  onPress,
  index,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.98, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[
        styles.listItem,
        isSelected && styles.listItemSelected,
        animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      entering={FadeInUp.delay(index * 30)}
    >
      <View
        style={[
          styles.listItemIcon,
          { backgroundColor: `${CATEGORY_COLORS[trigger.category]}20` },
        ]}
      >
        <Text style={styles.listItemIconText}>
          {CATEGORY_ICONS[trigger.category]}
        </Text>
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemName}>{trigger.name}</Text>
        <View style={styles.listItemMeta}>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: `${SEVERITY_COLORS[trigger.severity]}20` },
            ]}
          >
            <View
              style={[
                styles.severityDot,
                { backgroundColor: SEVERITY_COLORS[trigger.severity] },
              ]}
            />
            <Text
              style={[
                styles.severityText,
                { color: SEVERITY_COLORS[trigger.severity] },
              ]}
            >
              {SEVERITY_LABELS[trigger.severity]}
            </Text>
          </View>
          <Text style={styles.frequencyLabel}>
            {trigger.frequency}x this period
          </Text>
        </View>
      </View>
      <View style={styles.listItemImpact}>
        <Text
          style={[
            styles.impactValue,
            { color: trigger.avgMoodImpact < 0 ? '#EF4444' : '#10B981' },
          ]}
        >
          {trigger.avgMoodImpact > 0 ? '+' : ''}
          {trigger.avgMoodImpact.toFixed(1)}
        </Text>
        <Text style={styles.impactLabel}>Mood</Text>
      </View>
    </AnimatedTouchable>
  );
};

export const TriggerMapVisualization: React.FC<TriggerMapVisualizationProps> = ({
  triggers,
  connections = [],
  onTriggerPress,
  onAddTrigger,
  onEditTrigger,
  style,
  showNetwork = true,
  showAnalysis = true,
  showCopingStrategies = true,
  timeRange = 'month',
}) => {
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [viewMode, setViewMode] = useState<'network' | 'list'>('network');
  const [filterCategory, setFilterCategory] = useState<TriggerCategory | 'all'>('all');

  const networkWidth = SCREEN_WIDTH - 32;
  const networkHeight = 300;

  // Filter triggers
  const filteredTriggers = useMemo(() => {
    if (filterCategory === 'all') return triggers;
    return triggers.filter((t) => t.category === filterCategory);
  }, [triggers, filterCategory]);

  // Calculate node positions
  const nodePositions = useMemo(
    () => calculateNodePositions(filteredTriggers, networkWidth, networkHeight),
    [filteredTriggers, networkWidth, networkHeight]
  );

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalTriggers = triggers.length;
    const criticalTriggers = triggers.filter((t) => t.severity === 'critical').length;
    const highTriggers = triggers.filter((t) => t.severity === 'high').length;
    const totalFrequency = triggers.reduce((sum, t) => sum + t.frequency, 0);
    const avgMoodImpact =
      triggers.length > 0
        ? triggers.reduce((sum, t) => sum + t.avgMoodImpact, 0) / triggers.length
        : 0;

    // Most common category
    const categoryCounts: Record<string, number> = {};
    triggers.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    const mostCommonCategory = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] as TriggerCategory | undefined;

    return {
      totalTriggers,
      criticalTriggers,
      highTriggers,
      totalFrequency,
      avgMoodImpact,
      mostCommonCategory,
    };
  }, [triggers]);

  const handleTriggerPress = useCallback(
    (trigger: Trigger) => {
      setSelectedTrigger(trigger.id === selectedTrigger?.id ? null : trigger);
      onTriggerPress?.(trigger);
    },
    [onTriggerPress, selectedTrigger]
  );

  // Get related triggers
  const getRelatedTriggers = (trigger: Trigger): Trigger[] => {
    if (!trigger.relatedTriggers) return [];
    return triggers.filter((t) => trigger.relatedTriggers?.includes(t.id));
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trigger Map</Text>
          <Text style={styles.subtitle}>{TIME_RANGE_LABELS[timeRange]}</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'network' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('network')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'network' && styles.viewToggleTextActive,
              ]}
            >
              🕸️
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === 'list' && styles.viewToggleTextActive,
              ]}
            >
              📋
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.totalTriggers}</Text>
          <Text style={styles.statLabel}>Triggers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              statistics.criticalTriggers > 0 && styles.statValueWarning,
            ]}
          >
            {statistics.criticalTriggers}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{statistics.totalFrequency}</Text>
          <Text style={styles.statLabel}>Occurrences</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              statistics.avgMoodImpact < 0 ? styles.statValueNegative : styles.statValuePositive,
            ]}
          >
            {statistics.avgMoodImpact > 0 ? '+' : ''}
            {statistics.avgMoodImpact.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Avg Impact</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterCategory === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterCategory('all')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterCategory === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              filterCategory === category && { backgroundColor: `${color}30` },
            ]}
            onPress={() => setFilterCategory(category as TriggerCategory)}
          >
            <Text style={styles.filterIcon}>{CATEGORY_ICONS[category as TriggerCategory]}</Text>
            <Text
              style={[
                styles.filterButtonText,
                filterCategory === category && { color, fontWeight: '600' },
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Network View */}
      {viewMode === 'network' && showNetwork && (
        <View style={styles.networkContainer}>
          <View style={[styles.networkCanvas, { width: networkWidth, height: networkHeight }]}>
            {/* Connection lines */}
            {connections.map((conn, index) => {
              const fromPos = nodePositions.get(conn.from);
              const toPos = nodePositions.get(conn.to);
              if (!fromPos || !toPos) return null;
              return (
                <ConnectionLine
                  key={`${conn.from}-${conn.to}`}
                  from={{ x: fromPos.x, y: fromPos.y }}
                  to={{ x: toPos.x, y: toPos.y }}
                  strength={conn.strength}
                  index={index}
                />
              );
            })}

            {/* Trigger nodes */}
            {filteredTriggers.map((trigger, index) => {
              const position = nodePositions.get(trigger.id);
              if (!position) return null;
              return (
                <TriggerNode
                  key={trigger.id}
                  trigger={trigger}
                  position={position}
                  isSelected={selectedTrigger?.id === trigger.id}
                  onPress={() => handleTriggerPress(trigger)}
                  index={index}
                />
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Severity</Text>
            <View style={styles.legendItems}>
              {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
                <View key={severity} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>
                    {SEVERITY_LABELS[severity as TriggerSeverity]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <View style={styles.listContainer}>
          {filteredTriggers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📭</Text>
              <Text style={styles.emptyStateText}>No triggers found</Text>
            </View>
          ) : (
            filteredTriggers.map((trigger, index) => (
              <TriggerListItem
                key={trigger.id}
                trigger={trigger}
                isSelected={selectedTrigger?.id === trigger.id}
                onPress={() => handleTriggerPress(trigger)}
                index={index}
              />
            ))
          )}
        </View>
      )}

      {/* Selected Trigger Detail */}
      {selectedTrigger && (
        <Animated.View style={styles.detailContainer} entering={FadeInUp}>
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.detailIcon,
                { backgroundColor: `${CATEGORY_COLORS[selectedTrigger.category]}20` },
              ]}
            >
              <Text style={styles.detailIconText}>
                {CATEGORY_ICONS[selectedTrigger.category]}
              </Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{selectedTrigger.name}</Text>
              <Text style={styles.detailCategory}>
                {selectedTrigger.category.charAt(0).toUpperCase() +
                  selectedTrigger.category.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEditTrigger?.(selectedTrigger)}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{selectedTrigger.frequency}</Text>
              <Text style={styles.detailStatLabel}>Times</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStat}>
              <Text
                style={[
                  styles.detailStatValue,
                  { color: SEVERITY_COLORS[selectedTrigger.severity] },
                ]}
              >
                {selectedTrigger.severity.charAt(0).toUpperCase() +
                  selectedTrigger.severity.slice(1)}
              </Text>
              <Text style={styles.detailStatLabel}>Severity</Text>
            </View>
            <View style={styles.detailStatDivider} />
            <View style={styles.detailStat}>
              <Text
                style={[
                  styles.detailStatValue,
                  { color: selectedTrigger.avgMoodImpact < 0 ? '#EF4444' : '#10B981' },
                ]}
              >
                {selectedTrigger.avgMoodImpact > 0 ? '+' : ''}
                {selectedTrigger.avgMoodImpact.toFixed(1)}
              </Text>
              <Text style={styles.detailStatLabel}>Mood Impact</Text>
            </View>
          </View>

          {selectedTrigger.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{selectedTrigger.notes}</Text>
            </View>
          )}

          {showCopingStrategies && selectedTrigger.copingStrategies && (
            <View style={styles.copingContainer}>
              <Text style={styles.copingLabel}>Coping Strategies:</Text>
              {selectedTrigger.copingStrategies.map((strategy, index) => (
                <View key={index} style={styles.copingItem}>
                  <Text style={styles.copingBullet}>•</Text>
                  <Text style={styles.copingText}>{strategy}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedTrigger.relatedTriggers && selectedTrigger.relatedTriggers.length > 0 && (
            <View style={styles.relatedContainer}>
              <Text style={styles.relatedLabel}>Related Triggers:</Text>
              <View style={styles.relatedList}>
                {getRelatedTriggers(selectedTrigger).map((related) => (
                  <View
                    key={related.id}
                    style={[
                      styles.relatedItem,
                      { backgroundColor: `${CATEGORY_COLORS[related.category]}20` },
                    ]}
                  >
                    <Text style={styles.relatedIcon}>
                      {CATEGORY_ICONS[related.category]}
                    </Text>
                    <Text style={styles.relatedName}>{related.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Add Trigger Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAddTrigger} activeOpacity={0.8}>
        <Text style={styles.addButtonIcon}>+</Text>
        <Text style={styles.addButtonText}>Add Trigger</Text>
      </TouchableOpacity>

      {/* Analysis Section */}
      {showAnalysis && (
        <Animated.View style={styles.analysisContainer} entering={FadeInUp.delay(200)}>
          <Text style={styles.analysisTitle}>💡 Insights</Text>
          {statistics.criticalTriggers > 0 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>⚠️</Text>
              <Text style={styles.insightText}>
                You have {statistics.criticalTriggers} critical trigger
                {statistics.criticalTriggers > 1 ? 's' : ''} that may need immediate attention.
              </Text>
            </View>
          )}
          {statistics.mostCommonCategory && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📊</Text>
              <Text style={styles.insightText}>
                Most triggers are related to{' '}
                <Text style={styles.insightHighlight}>
                  {statistics.mostCommonCategory}
                </Text>
                . Consider focusing coping strategies in this area.
              </Text>
            </View>
          )}
          {statistics.avgMoodImpact < -2 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>💚</Text>
              <Text style={styles.insightText}>
                Your triggers are having a significant negative impact on your mood.
                Consider speaking with a therapist.
              </Text>
            </View>
          )}
        </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleText: {
    fontSize: 14,
  },
  viewToggleTextActive: {},
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statValueWarning: {
    color: '#EF4444',
  },
  statValueNegative: {
    color: '#EF4444',
  },
  statValuePositive: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  networkContainer: {
    marginBottom: 16,
  },
  networkCanvas: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#CBD5E1',
    transformOrigin: 'left center',
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeIcon: {
    fontSize: 16,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
  },
  frequencyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  frequencyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legendContainer: {
    marginTop: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  listItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemIconText: {
    fontSize: 18,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  frequencyLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  listItemImpact: {
    alignItems: 'flex-end',
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  impactLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailIconText: {
    fontSize: 22,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detailCategory: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    fontSize: 16,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 18,
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
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  copingContainer: {
    marginBottom: 12,
  },
  copingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  copingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  copingBullet: {
    fontSize: 12,
    color: '#10B981',
    marginRight: 6,
    marginTop: 1,
  },
  copingText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  relatedContainer: {
    marginBottom: 8,
  },
  relatedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  relatedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  relatedIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  relatedName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  addButtonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
    marginRight: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  analysisContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  insightText: {
    fontSize: 13,
    color: '#78350F',
    flex: 1,
    lineHeight: 18,
  },
  insightHighlight: {
    fontWeight: '700',
    color: '#92400E',
  },
});

export default TriggerMapVisualization;
