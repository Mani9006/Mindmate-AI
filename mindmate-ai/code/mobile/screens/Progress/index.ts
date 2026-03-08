/**
 * Progress Dashboard Components - MindMate AI
 * 
 * This module exports all progress dashboard components for the MindMate AI
 * mental health application. These components provide comprehensive visualization
 * and tracking of user progress, mood patterns, task completion, and emotional triggers.
 * 
 * @module Progress
 * @package MindMateAI
 */

// =============================================================================
// Mood Timeline Chart
// =============================================================================

export {
  default as MoodTimelineChart,
  MoodTimelineChart as MoodTimelineChartComponent,
} from './MoodTimelineChart';

export type {
  MoodTimelineChartProps,
  MoodEntry,
  MoodValue,
} from './MoodTimelineChart';

// =============================================================================
// Emotional Heatmap Calendar
// =============================================================================

export {
  default as EmotionalHeatmapCalendar,
  EmotionalHeatmapCalendar as EmotionalHeatmapCalendarComponent,
} from './EmotionalHeatmapCalendar';

export type {
  EmotionalHeatmapCalendarProps,
  DailyEmotionData,
  EmotionIntensity,
} from './EmotionalHeatmapCalendar';

// =============================================================================
// Task Completion Ring Chart
// =============================================================================

export {
  default as TaskCompletionRingChart,
  TaskCompletionRingChart as TaskCompletionRingChartComponent,
} from './TaskCompletionRingChart';

export type {
  TaskCompletionRingChartProps,
  TaskCategory,
} from './TaskCompletionRingChart';

// =============================================================================
// Weekly Streak Tracker
// =============================================================================

export {
  default as WeeklyStreakTracker,
  WeeklyStreakTracker as WeeklyStreakTrackerComponent,
} from './WeeklyStreakTracker';

export type {
  WeeklyStreakTrackerProps,
  DayData,
  DayStatus,
  StreakMilestone,
} from './WeeklyStreakTracker';

// Re-export milestones for customization
export { DEFAULT_MILESTONES } from './WeeklyStreakTracker';

// =============================================================================
// Milestone Celebration
// =============================================================================

export {
  default as MilestoneCelebration,
  MilestoneCelebration as MilestoneCelebrationComponent,
} from './MilestoneCelebration';

export type {
  MilestoneCelebrationProps,
  Milestone,
  MilestoneType,
} from './MilestoneCelebration';

// =============================================================================
// Progress Report Card
// =============================================================================

export {
  default as ProgressReportCard,
  ProgressReportCard as ProgressReportCardComponent,
} from './ProgressReportCard';

export type {
  ProgressReportCardProps,
  MetricData,
  MetricType,
  TrendDirection,
  ProgressInsight,
} from './ProgressReportCard';

// =============================================================================
// Trigger Map Visualization
// =============================================================================

export {
  default as TriggerMapVisualization,
  TriggerMapVisualization as TriggerMapVisualizationComponent,
} from './TriggerMapVisualization';

export type {
  TriggerMapVisualizationProps,
  Trigger,
  TriggerCategory,
  TriggerSeverity,
  TriggerConnection,
} from './TriggerMapVisualization';

// =============================================================================
// Constants and Utilities
// =============================================================================

/**
 * Color constants for consistent theming across progress components
 */
export const PROGRESS_COLORS = {
  // Mood colors
  mood: {
    veryLow: '#EF4444',
    low: '#F97316',
    neutral: '#EAB308',
    good: '#22C55E',
    excellent: '#10B981',
  },
  
  // Severity colors
  severity: {
    low: '#22C55E',
    medium: '#EAB308',
    high: '#F97316',
    critical: '#EF4444',
  },
  
  // Category colors
  category: {
    social: '#8B5CF6',
    work: '#3B82F6',
    health: '#10B981',
    environment: '#F59E0B',
    relationships: '#EC4899',
    financial: '#6366F1',
    family: '#F97316',
    other: '#6B7280',
  },
  
  // UI colors
  ui: {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
} as const;

/**
 * Animation presets for consistent animations
 */
export const ANIMATION_PRESETS = {
  spring: {
    gentle: { damping: 15, stiffness: 100 },
    bouncy: { damping: 10, stiffness: 200 },
    stiff: { damping: 20, stiffness: 300 },
  },
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
  },
} as const;

/**
 * Helper function to format dates consistently
 */
export const formatProgressDate = (
  date: Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'short', day: 'numeric' }
      : format === 'medium'
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Helper function to calculate percentage change
 */
export const calculatePercentageChange = (
  current: number,
  previous: number
): { value: number; direction: 'up' | 'down' | 'neutral' } => {
  if (!previous || previous === 0) {
    return { value: 0, direction: 'neutral' };
  }
  
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  };
};

/**
 * Helper function to get mood color
 */
export const getMoodColor = (moodScore: number): string => {
  const colors = PROGRESS_COLORS.mood;
  if (moodScore <= 1) return colors.veryLow;
  if (moodScore <= 2) return colors.low;
  if (moodScore <= 3) return colors.neutral;
  if (moodScore <= 4) return colors.good;
  return colors.excellent;
};

/**
 * Helper function to get mood label
 */
export const getMoodLabel = (moodScore: number): string => {
  if (moodScore <= 1) return 'Very Low';
  if (moodScore <= 2) return 'Low';
  if (moodScore <= 3) return 'Neutral';
  if (moodScore <= 4) return 'Good';
  return 'Excellent';
};

// =============================================================================
// Default Export
// =============================================================================

/**
 * Default export containing all progress components
 */
export { default } from './MoodTimelineChart';

// =============================================================================
// Version
// =============================================================================

export const VERSION = '1.0.0';
