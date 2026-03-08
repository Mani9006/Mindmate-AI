# Progress Dashboard Components - MindMate AI

A comprehensive collection of React Native components for visualizing and tracking mental health progress in the MindMate AI application.

## Components

### 1. MoodTimelineChart
Interactive mood timeline chart using Victory Native for React Native.

**Features:**
- Smooth line chart with area fill
- Time range selection (week, month, 3 months, year)
- Data point tooltips
- Statistics summary (average, trend, best)
- Detailed day view with notes and tags

**Props:**
```typescript
interface MoodTimelineChartProps {
  data: MoodEntry[];
  timeRange?: 'week' | 'month' | '3months' | 'year';
  onDataPointPress?: (entry: MoodEntry) => void;
  onTimeRangeChange?: (range: string) => void;
  showGradient?: boolean;
  animate?: boolean;
}
```

### 2. EmotionalHeatmapCalendar
Interactive emotional heatmap calendar with monthly navigation.

**Features:**
- Color-coded day cells based on mood intensity
- Month navigation
- Monthly insights and statistics
- Selected day detail view
- Progress to next milestone

**Props:**
```typescript
interface EmotionalHeatmapCalendarProps {
  data: DailyEmotionData[];
  onDayPress?: (dayData: DailyEmotionData) => void;
  onMonthChange?: (month: Date) => void;
  showLegend?: boolean;
  showInsights?: boolean;
  startOfWeek?: 0 | 1;
}
```

### 3. TaskCompletionRingChart
Animated ring chart for displaying task completion rates.

**Features:**
- Multiple concentric rings for different categories
- Progress animations
- Category selection with details
- Overall completion percentage
- Summary statistics

**Props:**
```typescript
interface TaskCompletionRingChartProps {
  categories: TaskCategory[];
  overallCompletion?: number;
  onCategoryPress?: (category: TaskCategory) => void;
  onCenterPress?: () => void;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  showDetails?: boolean;
  animate?: boolean;
}
```

### 4. WeeklyStreakTracker
Animated weekly streak tracker with fire animations.

**Features:**
- Day-by-day streak visualization
- Fire animations and particle effects
- Milestone celebrations
- Motivational messages
- Progress to next milestone
- Streak tips

**Props:**
```typescript
interface WeeklyStreakTrackerProps {
  days: DayData[];
  currentStreak: number;
  longestStreak: number;
  onDayPress?: (day: DayData) => void;
  onMilestoneReach?: (milestone: StreakMilestone) => void;
  showMilestones?: boolean;
  showMotivation?: boolean;
  animate?: boolean;
}
```

### 5. MilestoneCelebration
Full-featured milestone celebration with confetti and badges.

**Features:**
- Animated confetti particles
- Badge display with glow effects
- Star burst animations
- Share functionality
- Auto-close timer
- Modal overlay

**Props:**
```typescript
interface MilestoneCelebrationProps {
  milestone: Milestone | null;
  visible: boolean;
  onClose: () => void;
  onShare?: (milestone: Milestone) => void;
  onContinue?: () => void;
  autoCloseDelay?: number;
  showConfetti?: boolean;
  showBadge?: boolean;
}
```

### 6. ProgressReportCard
Expandable progress report card with metrics and insights.

**Features:**
- Expandable/collapsible design
- Multiple metric displays
- Trend indicators
- Progress bars with targets
- Insights section
- Export and share actions

**Props:**
```typescript
interface ProgressReportCardProps {
  title: string;
  subtitle?: string;
  period: string;
  metrics: MetricData[];
  insights?: ProgressInsight[];
  onExpand?: (expanded: boolean) => void;
  onMetricPress?: (metric: MetricData) => void;
  onExport?: () => void;
  onShare?: () => void;
  initiallyExpanded?: boolean;
  showTrends?: boolean;
  showTargets?: boolean;
}
```

### 7. TriggerMapVisualization
Interactive trigger map with network visualization.

**Features:**
- Network graph visualization
- List view alternative
- Category filtering
- Trigger connections
- Severity indicators
- Coping strategies display
- Related triggers

**Props:**
```typescript
interface TriggerMapVisualizationProps {
  triggers: Trigger[];
  connections?: TriggerConnection[];
  onTriggerPress?: (trigger: Trigger) => void;
  onAddTrigger?: () => void;
  onEditTrigger?: (trigger: Trigger) => void;
  showNetwork?: boolean;
  showAnalysis?: boolean;
  showCopingStrategies?: boolean;
  timeRange?: 'week' | 'month' | '3months';
}
```

## Installation

```bash
# Install required dependencies
npm install victory-native react-native-svg react-native-reanimated

# For iOS
cd ios && pod install
```

## Usage

```typescript
import {
  MoodTimelineChart,
  EmotionalHeatmapCalendar,
  TaskCompletionRingChart,
  WeeklyStreakTracker,
  MilestoneCelebration,
  ProgressReportCard,
  TriggerMapVisualization,
} from './screens/Progress';

// Example usage
function ProgressScreen() {
  return (
    <ScrollView>
      <MoodTimelineChart
        data={moodData}
        timeRange="week"
        onDataPointPress={(entry) => console.log(entry)}
      />
      
      <EmotionalHeatmapCalendar
        data={emotionData}
        onDayPress={(day) => console.log(day)}
      />
      
      <TaskCompletionRingChart
        categories={taskCategories}
        onCategoryPress={(cat) => console.log(cat)}
      />
      
      <WeeklyStreakTracker
        days={streakDays}
        currentStreak={7}
        longestStreak={14}
      />
      
      <ProgressReportCard
        title="Weekly Progress"
        period="Nov 1-7"
        metrics={metrics}
        insights={insights}
      />
      
      <TriggerMapVisualization
        triggers={triggers}
        connections={connections}
      />
    </ScrollView>
  );
}
```

## Dependencies

- `react-native`: >= 0.70.0
- `react-native-svg`: For SVG rendering
- `victory-native`: For chart components
- `react-native-reanimated`: For animations

## Theming

All components support consistent theming through the `PROGRESS_COLORS` export:

```typescript
import { PROGRESS_COLORS } from './screens/Progress';

const colors = PROGRESS_COLORS;
// colors.mood.veryLow, colors.severity.critical, etc.
```

## License

MIT License - MindMate AI
