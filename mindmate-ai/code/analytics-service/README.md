# MindMate AI - Analytics Service

A comprehensive analytics computation service for mental wellness tracking, providing mood trend analysis, task completion metrics, emotional trigger pattern detection, personalized weekly reports, progress scoring, and milestone celebrations.

## Features

### 1. Mood Trend Calculator
- **Rolling averages** (daily, weekly, exponential moving average)
- **Trend detection** (improving, declining, stable, volatile)
- **Volatility analysis** and mood variability tracking
- **Time-based patterns** (time of day, day of week)
- **Emotion frequency analysis**
- **Mood predictions** for upcoming days
- **Period comparisons** (current vs. previous)

### 2. Task Completion Rate Calculator
- **Completion rate analysis** by status, priority, and category
- **Trend tracking** over time
- **On-time performance metrics**
- **Productivity scoring** (0-100 with letter grades)
- **Task forecasting** for upcoming periods
- **Velocity tracking** and consistency measurement

### 3. Emotional Trigger Pattern Detector
- **Pattern detection** by trigger type
- **Mood correlation analysis**
- **Risk factor identification**
- **Time pattern analysis** (when triggers occur)
- **Coping strategy effectiveness** tracking
- **Trigger predictions** with preventive measures
- **Intervention recommendations** by trigger type

### 4. Weekly Report Generator
- **Comprehensive weekly summaries** with Claude AI-powered narratives
- **Mood, task, and trigger analysis** integration
- **Personalized insights** and recommendations
- **Progress metrics** and trend visualization
- **Multiple narrative tones** (supportive, clinical, casual, motivational)
- **Fallback narrative generation** when Claude is unavailable

### 5. Progress Score Calculator
- **Composite wellness score** (0-100)
- **Component scoring**:
  - Mood Stability (20%)
  - Emotional Awareness (15%)
  - Task Management (20%)
  - Trigger Management (20%)
  - Consistency (15%)
  - Improvement (10%)
- **Category scores**: Emotional Wellness, Productivity, Resilience, Self-Awareness
- **Historical comparisons** and trend analysis
- **Personalized recommendations** for improvement
- **Score projections** for future periods

### 6. Milestone Detector & Celebrator
- **Automatic milestone detection** for:
  - Streaks (3, 7, 14, 30, 60, 100 days)
  - Improvements (mood, score)
  - Consistency achievements
  - Awareness milestones
  - Resilience markers
  - Mastery achievements
  - Engagement milestones
- **Custom milestone definitions**
- **Celebration events** with animations
- **Progress tracking** for upcoming milestones
- **Shareable achievements**

## Installation

```bash
npm install @mindmate/analytics-service
```

## Usage

### Basic Usage

```typescript
import { 
  createAnalyticsService,
  createMoodTrendCalculator,
  createTaskCompletionCalculator,
  createTriggerPatternDetector,
  createWeeklyReportGenerator,
  createProgressScoreCalculator,
  createMilestoneDetector
} from '@mindmate/analytics-service';

// Create the main analytics service
const analytics = createAnalyticsService({
  claudeApiClient: new AnthropicClaudeClient('your-api-key')
});

// Run full analytics
const result = await analytics.runFullAnalytics(userId, {
  moodEntries,
  tasks,
  triggers,
  progressScores,
  existingMilestones
});

if (result.success) {
  console.log('Mood Analysis:', result.data.moodAnalysis);
  console.log('Task Analysis:', result.data.taskAnalysis);
  console.log('Progress Score:', result.data.progressScore);
  console.log('New Milestones:', result.data.milestones?.newMilestones);
}
```

### Individual Calculators

```typescript
// Mood Trend Analysis
const moodCalculator = createMoodTrendCalculator();
const moodAnalysis = moodCalculator.analyzeMoodTrends(moodEntries);

// Get quick summary
const quickMood = moodCalculator.getQuickSummary(moodEntries);
console.log(`Current mood: ${quickMood.currentMood}, Trend: ${quickMood.trend}`);

// Predict future mood
const predictions = moodCalculator.predictMood(moodEntries, 7);
```

```typescript
// Task Completion Analysis
const taskCalculator = createTaskCompletionCalculator();
const taskAnalysis = taskCalculator.analyzeTaskCompletion(tasks);

// Get productivity score
const productivityScore = taskCalculator.calculateProductivityScore(tasks);
console.log(`Productivity: ${productivityScore.score}/100 (Grade: ${productivityScore.grade})`);

// Forecast completion
const forecast = taskCalculator.forecastTaskCompletion(tasks, pendingTasks, 7);
```

```typescript
// Trigger Pattern Analysis
const triggerDetector = createTriggerPatternDetector();
const triggerAnalysis = triggerDetector.analyzeTriggerPatterns(
  triggers, 
  moodEntries
);

// Get interventions
const interventions = triggerDetector.getRecommendedInterventions('social');
```

```typescript
// Weekly Report Generation
const reportGenerator = createWeeklyReportGenerator(
  {},
  new AnthropicClaudeClient('your-api-key')
);

const report = await reportGenerator.generateReport(
  { userId, includeNarrative: true, narrativeTone: 'supportive' },
  { moodEntries, tasks, triggers }
);
```

```typescript
// Progress Score Calculation
const progressCalculator = createProgressScoreCalculator();
const progressScore = progressCalculator.calculateProgressScore(userId, {
  moodEntries,
  tasks,
  triggers,
  historicalScores
});

console.log(`Overall Score: ${progressScore.overallScore}/100`);
console.log(`Grade: ${progressScore.interpretation.grade}`);
console.log('Recommendations:', progressScore.recommendations);
```

```typescript
// Milestone Detection
const milestoneDetector = createMilestoneDetector();
const milestoneResult = milestoneDetector.checkMilestones({
  userId,
  moodEntries,
  tasks,
  triggers,
  progressScores,
  existingMilestones
});

// Celebrate new milestones
milestoneResult.celebrationQueue.forEach(event => {
  console.log(`🎉 ${event.message}`);
});
```

### Dashboard Data

```typescript
// Get data for dashboard
const dashboardData = analytics.getDashboardData(userId, {
  moodEntries,
  tasks,
  triggers,
  existingMilestones
});

console.log('Quick Stats:', dashboardData.quickStats);
console.log('Recent Milestones:', dashboardData.recentMilestones);
console.log('Insights:', dashboardData.insights);
```

## API Reference

### Types

All TypeScript types are exported from the main module:

```typescript
import {
  MoodEntry,
  Task,
  TriggerEvent,
  ProgressScore,
  WeeklyReport,
  Milestone,
  TrendDirection,
  // ... and more
} from '@mindmate/analytics-service';
```

### AnalyticsService

Main orchestrator class that coordinates all analytics components.

#### Methods

- `runFullAnalytics(userId, data)` - Run complete analytics suite
- `generateWeeklyReport(userId, data, options)` - Generate personalized weekly report
- `getDashboardData(userId, data)` - Get dashboard-ready data
- `checkMilestones(userId, data)` - Check for new milestones
- `predictMood(entries, days)` - Predict future mood
- `forecastTasks(tasks, pending, days)` - Forecast task completion
- `predictTriggers(triggers, days)` - Predict potential triggers
- `getInterventions(triggerType)` - Get recommended interventions
- `updateConfig(config)` - Update service configuration

## Configuration

### AnalyticsServiceConfig

```typescript
interface AnalyticsServiceConfig {
  // Claude API client for narrative generation
  claudeApiClient?: ClaudeApiClient;
  
  // Milestone configuration
  milestones?: {
    enabledTypes: MilestoneType[];
    celebrationIntensity: 'subtle' | 'normal' | 'enthusiastic';
    autoShare: boolean;
    customMilestones?: CustomMilestoneDefinition[];
  };
}
```

### Custom Claude Client

```typescript
import { ClaudeApiClient } from '@mindmate/analytics-service';

class MyClaudeClient implements ClaudeApiClient {
  async generateResponse(options: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }> {
    // Your implementation
  }
}
```

## Data Requirements

### Minimum Data for Analysis

| Analysis Type | Minimum Data |
|--------------|--------------|
| Mood Trend | 3 mood entries |
| Task Completion | 3 tasks |
| Trigger Pattern | 2 triggers |
| Weekly Report | 3 mood entries OR 3 tasks |
| Progress Score | 5 mood entries OR 3 tasks |
| Milestone Detection | Varies by milestone type |

### Optimal Data for Best Results

| Analysis Type | Optimal Data |
|--------------|--------------|
| Mood Trend | 14+ entries over 2+ weeks |
| Task Completion | 20+ tasks over 1+ weeks |
| Trigger Pattern | 10+ triggers with mood data |
| Weekly Report | Full week of data |
| Progress Score | 30 days of data |
| Milestone Detection | Continuous tracking |

## Performance

All calculations are optimized for performance:
- Typical analysis completes in <100ms
- Full analytics suite completes in <500ms
- Memory efficient with streaming data processing

## Error Handling

All methods return `AnalyticsResult<T>` with standardized error handling:

```typescript
interface AnalyticsResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    timestamp: Date;
    processingTime: number;
    dataPoints: number;
  };
}
```

## License

MIT License - MindMate AI
