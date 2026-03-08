/**
 * MindMate AI - Progress Score Calculator
 * Calculates composite mental wellness scores with component breakdowns
 */

import {
  ProgressScore,
  ComponentScores,
  HistoricalComparison,
  TrendDirection,
  MoodEntry,
  Task,
  TriggerEvent
} from './types';

import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateVariance,
  calculatePercentile,
  normalizeValue,
  clamp,
  getDaysBetween,
  addDays,
  formatDateISO,
  groupBy,
  detectTrend,
  scoreToGrade,
  scoreToDescription
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface ProgressScoreAnalysis {
  userId: string;
  calculatedAt: Date;
  overallScore: number;
  componentScores: ComponentScores;
  categoryScores: CategoryScores;
  historicalComparison?: HistoricalComparison;
  interpretation: ScoreInterpretation;
  recommendations: ScoreRecommendation[];
  trends: ScoreTrends;
}

export interface CategoryScores {
  emotionalWellness: number;
  productivity: number;
  resilience: number;
  selfAwareness: number;
  consistency: number;
}

export interface ScoreInterpretation {
  overall: string;
  grade: string;
  description: string;
  strengths: string[];
  growthAreas: string[];
}

export interface ScoreRecommendation {
  category: string;
  currentScore: number;
  targetScore: number;
  actions: string[];
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
}

export interface ScoreTrends {
  overallTrend: TrendDirection;
  componentTrends: Partial<Record<keyof ComponentScores, TrendDirection>>;
  projectedScore: number;
  projectionConfidence: number;
}

export interface ScoreCalculationInput {
  moodEntries: MoodEntry[];
  tasks: Task[];
  triggers: TriggerEvent[];
  historicalScores?: ProgressScore[];
  timeWindowDays?: number;
}

export interface ScoreBenchmark {
  percentile: number;
  averageScore: number;
  topPerformersThreshold: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  weights: {
    moodStability: 0.20,
    emotionalAwareness: 0.15,
    taskManagement: 0.20,
    triggerManagement: 0.20,
    consistency: 0.15,
    improvement: 0.10
  },
  thresholds: {
    excellent: 85,
    good: 70,
    fair: 55,
    needsAttention: 40
  },
  minimumDataPoints: {
    mood: 5,
    tasks: 3,
    triggers: 2
  },
  timeWindowDays: 30
};

// ============================================================================
// Progress Score Calculator Class
// ============================================================================

export class ProgressScoreCalculator {
  private config: typeof DEFAULT_CONFIG;

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate comprehensive progress score
   */
  calculateProgressScore(
    userId: string,
    input: ScoreCalculationInput
  ): ProgressScoreAnalysis {
    const startTime = performance.now();

    const { moodEntries, tasks, triggers, historicalScores, timeWindowDays } = input;
    const windowDays = timeWindowDays || this.config.timeWindowDays;

    // Validate minimum data
    this.validateData(moodEntries, tasks, triggers);

    // Calculate component scores
    const componentScores = this.calculateComponentScores(
      moodEntries,
      tasks,
      triggers,
      historicalScores,
      windowDays
    );

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(componentScores);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(componentScores);

    // Calculate historical comparison
    const historicalComparison = this.calculateHistoricalComparison(
      overallScore,
      historicalScores
    );

    // Generate interpretation
    const interpretation = this.generateInterpretation(
      overallScore,
      componentScores,
      categoryScores
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      componentScores,
      categoryScores
    );

    // Calculate trends
    const trends = this.calculateTrends(
      overallScore,
      componentScores,
      historicalScores
    );

    const analysis: ProgressScoreAnalysis = {
      userId,
      calculatedAt: new Date(),
      overallScore: Math.round(overallScore),
      componentScores,
      categoryScores,
      historicalComparison,
      interpretation,
      recommendations,
      trends
    };

    const duration = performance.now() - startTime;
    console.log(`[ProgressScoreCalculator] Score calculated in ${duration.toFixed(2)}ms`);

    return analysis;
  }

  /**
   * Validate minimum data requirements
   */
  private validateData(
    moodEntries: MoodEntry[],
    tasks: Task[],
    triggers: TriggerEvent[]
  ): void {
    const hasMoodData = moodEntries.length >= this.config.minimumDataPoints.mood;
    const hasTaskData = tasks.length >= this.config.minimumDataPoints.tasks;
    const hasTriggerData = triggers.length >= this.config.minimumDataPoints.triggers;

    if (!hasMoodData && !hasTaskData) {
      throw new Error(
        `Insufficient data for score calculation. Need at least ${this.config.minimumDataPoints.mood} mood entries or ${this.config.minimumDataPoints.tasks} tasks.`
      );
    }
  }

  /**
   * Calculate all component scores
   */
  private calculateComponentScores(
    moodEntries: MoodEntry[],
    tasks: Task[],
    triggers: TriggerEvent[],
    historicalScores?: ProgressScore[],
    windowDays: number = 30
  ): ComponentScores {
    return {
      moodStability: this.calculateMoodStabilityScore(moodEntries),
      emotionalAwareness: this.calculateEmotionalAwarenessScore(moodEntries),
      taskManagement: this.calculateTaskManagementScore(tasks),
      triggerManagement: this.calculateTriggerManagementScore(triggers),
      consistency: this.calculateConsistencyScore(moodEntries, tasks, windowDays),
      improvement: this.calculateImprovementScore(moodEntries, tasks, historicalScores)
    };
  }

  /**
   * Calculate mood stability score (0-100)
   */
  private calculateMoodStabilityScore(moodEntries: MoodEntry[]): number {
    if (moodEntries.length < 3) return 50; // Default neutral score

    const moodValues = moodEntries.map(e => e.moodLevel);
    const mean = calculateMean(moodValues);
    const stdDev = calculateStandardDeviation(moodValues);

    // Higher average mood and lower volatility = higher score
    const averageScore = (mean / 5) * 50; // 0-50 points for average mood
    
    // Volatility penalty (lower std dev is better)
    const volatilityScore = Math.max(0, 50 - (stdDev * 25)); // 0-50 points for stability

    return clamp(averageScore + volatilityScore, 0, 100);
  }

  /**
   * Calculate emotional awareness score (0-100)
   */
  private calculateEmotionalAwarenessScore(moodEntries: MoodEntry[]): number {
    if (moodEntries.length === 0) return 50;

    // Score based on:
    // 1. Frequency of emotion logging
    // 2. Variety of emotions logged
    // 3. Presence of notes/context

    const entriesWithEmotions = moodEntries.filter(e => e.emotions && e.emotions.length > 0);
    const emotionLoggingRate = entriesWithEmotions.length / moodEntries.length;

    // Count unique emotions
    const allEmotions = moodEntries.flatMap(e => e.emotions || []);
    const uniqueEmotions = new Set(allEmotions.map(e => e.name)).size;
    const emotionVariety = Math.min(1, uniqueEmotions / 10); // Normalize to 0-1

    // Notes/context presence
    const entriesWithContext = moodEntries.filter(e => e.notes || e.context).length;
    const contextRate = entriesWithContext / moodEntries.length;

    // Calculate score
    const score = (
      emotionLoggingRate * 40 +
      emotionVariety * 30 +
      contextRate * 30
    );

    return clamp(score, 0, 100);
  }

  /**
   * Calculate task management score (0-100)
   */
  private calculateTaskManagementScore(tasks: Task[]): number {
    if (tasks.length === 0) return 50;

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionRate = completedTasks.length / tasks.length;

    // On-time completion
    const tasksWithDueDate = tasks.filter(t => t.dueDate);
    const tasksCompletedOnTime = completedTasks.filter(t => 
      t.dueDate && t.completedAt && t.completedAt <= t.dueDate
    );
    const onTimeRate = tasksWithDueDate.length > 0 
      ? tasksCompletedOnTime.length / tasksWithDueDate.length 
      : 1;

    // Priority management (bonus for completing high priority tasks)
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const completedHighPriority = highPriorityTasks.filter(t => t.status === 'completed');
    const priorityScore = highPriorityTasks.length > 0
      ? completedHighPriority.length / highPriorityTasks.length
      : 1;

    // Calculate weighted score
    const score = (
      completionRate * 40 +
      onTimeRate * 30 +
      priorityScore * 30
    ) * 100;

    return clamp(score, 0, 100);
  }

  /**
   * Calculate trigger management score (0-100)
   */
  private calculateTriggerManagementScore(triggers: TriggerEvent[]): number {
    if (triggers.length === 0) return 50;

    // Resolution rate
    const resolvedTriggers = triggers.filter(t => t.resolvedAt);
    const resolutionRate = resolvedTriggers.length / triggers.length;

    // Average severity (lower is better)
    const avgSeverity = calculateMean(triggers.map(t => t.severity));
    const severityScore = Math.max(0, 100 - (avgSeverity * 10));

    // Coping strategy usage
    const triggersWithStrategies = triggers.filter(
      t => t.copingStrategiesUsed && t.copingStrategiesUsed.length > 0
    );
    const strategyUsageRate = triggersWithStrategies.length / triggers.length;

    // Mood impact recovery (triggers with less negative impact)
    const avgMoodImpact = calculateMean(triggers.map(t => Math.abs(t.moodImpact)));
    const impactScore = Math.max(0, 100 - (avgMoodImpact * 20));

    const score = (
      resolutionRate * 30 +
      (severityScore / 100) * 20 +
      strategyUsageRate * 25 +
      (impactScore / 100) * 25
    ) * 100;

    return clamp(score, 0, 100);
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(
    moodEntries: MoodEntry[],
    tasks: Task[],
    windowDays: number
  ): number {
    if (moodEntries.length === 0 && tasks.length === 0) return 50;

    // Get all activity dates
    const moodDates = moodEntries.map(e => formatDateISO(e.timestamp));
    const taskDates = tasks.map(t => formatDateISO(t.createdAt));
    const allDates = new Set([...moodDates, ...taskDates]);

    // Calculate active days ratio
    const activeDays = allDates.size;
    const consistencyRatio = activeDays / windowDays;

    // Streak bonus
    const sortedDates = Array.from(allDates).sort();
    let currentStreak = 0;
    const today = formatDateISO(new Date());
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const expectedDate = formatDateISO(addDays(new Date(today), -(sortedDates.length - 1 - i)));
      if (sortedDates[i] === expectedDate || (i === sortedDates.length - 1 && sortedDates[i] === today)) {
        currentStreak++;
      } else {
        break;
      }
    }

    const streakBonus = Math.min(20, currentStreak * 2);

    const score = (consistencyRatio * 80) + streakBonus;
    return clamp(score, 0, 100);
  }

  /**
   * Calculate improvement score (0-100)
   */
  private calculateImprovementScore(
    moodEntries: MoodEntry[],
    tasks: Task[],
    historicalScores?: ProgressScore[]
  ): number {
    // If we have historical scores, use them
    if (historicalScores && historicalScores.length >= 2) {
      const sorted = [...historicalScores].sort(
        (a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime()
      );
      const recent = sorted.slice(-3);
      const older = sorted.slice(0, Math.min(3, sorted.length - 3));

      if (older.length > 0) {
        const recentAvg = calculateMean(recent.map(s => s.overallScore));
        const olderAvg = calculateMean(older.map(s => s.overallScore));
        
        const improvement = recentAvg - olderAvg;
        // Scale improvement to 0-100 score
        return clamp(50 + improvement, 0, 100);
      }
    }

    // Otherwise, calculate from entry trends
    if (moodEntries.length >= 7) {
      const sortedMoods = [...moodEntries].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      const firstHalf = sortedMoods.slice(0, Math.floor(sortedMoods.length / 2));
      const secondHalf = sortedMoods.slice(Math.floor(sortedMoods.length / 2));
      
      const firstAvg = calculateMean(firstHalf.map(e => e.moodLevel));
      const secondAvg = calculateMean(secondHalf.map(e => e.moodLevel));
      
      const improvement = (secondAvg - firstAvg) / 5 * 100;
      return clamp(50 + improvement, 0, 100);
    }

    // Default neutral score
    return 50;
  }

  /**
   * Calculate category scores from component scores
   */
  private calculateCategoryScores(componentScores: ComponentScores): CategoryScores {
    return {
      emotionalWellness: calculateMean([
        componentScores.moodStability,
        componentScores.emotionalAwareness
      ]),
      productivity: componentScores.taskManagement,
      resilience: calculateMean([
        componentScores.triggerManagement,
        componentScores.improvement
      ]),
      selfAwareness: componentScores.emotionalAwareness,
      consistency: componentScores.consistency
    };
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(componentScores: ComponentScores): number {
    const weightedSum =
      componentScores.moodStability * this.config.weights.moodStability +
      componentScores.emotionalAwareness * this.config.weights.emotionalAwareness +
      componentScores.taskManagement * this.config.weights.taskManagement +
      componentScores.triggerManagement * this.config.weights.triggerManagement +
      componentScores.consistency * this.config.weights.consistency +
      componentScores.improvement * this.config.weights.improvement;

    return clamp(weightedSum, 0, 100);
  }

  /**
   * Calculate historical comparison
   */
  private calculateHistoricalComparison(
    currentScore: number,
    historicalScores?: ProgressScore[]
  ): HistoricalComparison | undefined {
    if (!historicalScores || historicalScores.length === 0) {
      return undefined;
    }

    const sorted = [...historicalScores].sort(
      (a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime()
    );

    const previousScore = sorted[sorted.length - 1].overallScore;
    const change = currentScore - previousScore;
    const changePercent = previousScore > 0 ? (change / previousScore) * 100 : 0;

    let trend: TrendDirection;
    if (changePercent > 5) trend = 'improving';
    else if (changePercent < -5) trend = 'declining';
    else trend = 'stable';

    return {
      previousScore,
      change,
      changePercent,
      trend
    };
  }

  /**
   * Generate score interpretation
   */
  private generateInterpretation(
    overallScore: number,
    componentScores: ComponentScores,
    categoryScores: CategoryScores
  ): ScoreInterpretation {
    const grade = scoreToGrade(overallScore);
    const description = scoreToDescription(overallScore);

    // Identify strengths (top 2 components)
    const sortedComponents = Object.entries(componentScores)
      .sort((a, b) => b[1] - a[1]);
    
    const strengths = sortedComponents
      .slice(0, 2)
      .filter(([_, score]) => score >= 60)
      .map(([name, score]) => {
        const labels: Record<string, string> = {
          moodStability: 'Mood Stability',
          emotionalAwareness: 'Emotional Awareness',
          taskManagement: 'Task Management',
          triggerManagement: 'Trigger Management',
          consistency: 'Consistency',
          improvement: 'Improvement'
        };
        return `${labels[name]} (${Math.round(score)})`;
      });

    // Identify growth areas (bottom 2 components)
    const growthAreas = sortedComponents
      .slice(-2)
      .filter(([_, score]) => score < 70)
      .map(([name, score]) => {
        const labels: Record<string, string> = {
          moodStability: 'Mood Stability',
          emotionalAwareness: 'Emotional Awareness',
          taskManagement: 'Task Management',
          triggerManagement: 'Trigger Management',
          consistency: 'Consistency',
          improvement: 'Improvement'
        };
        return `${labels[name]} (${Math.round(score)})`;
      });

    // Overall interpretation
    let overall: string;
    if (overallScore >= this.config.thresholds.excellent) {
      overall = 'Excellent overall wellness! You are thriving in multiple areas.';
    } else if (overallScore >= this.config.thresholds.good) {
      overall = 'Good overall wellness. You have a solid foundation with room for growth.';
    } else if (overallScore >= this.config.thresholds.fair) {
      overall = 'Fair wellness. Some areas are going well, others need attention.';
    } else if (overallScore >= this.config.thresholds.needsAttention) {
      overall = 'Wellness needs attention. Focus on the recommended areas for improvement.';
    } else {
      overall = 'Significant wellness challenges detected. Consider seeking professional support.';
    }

    return {
      overall,
      grade,
      description,
      strengths,
      growthAreas
    };
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(
    componentScores: ComponentScores,
    categoryScores: CategoryScores
  ): ScoreRecommendation[] {
    const recommendations: ScoreRecommendation[] = [];

    // Find lowest scoring components
    const sortedComponents = Object.entries(componentScores)
      .sort((a, b) => a[1] - b[1]);

    for (const [component, score] of sortedComponents.slice(0, 3)) {
      if (score < 70) {
        const rec = this.getRecommendationForComponent(
          component as keyof ComponentScores,
          score
        );
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  /**
   * Get specific recommendation for a component
   */
  private getRecommendationForComponent(
    component: keyof ComponentScores,
    currentScore: number
  ): ScoreRecommendation {
    const recommendations: Record<keyof ComponentScores, ScoreRecommendation> = {
      moodStability: {
        category: 'Mood Stability',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Practice daily mood tracking at consistent times',
          'Identify and avoid mood destabilizers',
          'Establish a regular sleep schedule',
          'Engage in regular physical activity'
        ],
        priority: currentScore < 50 ? 'high' : 'medium',
        expectedImpact: 10
      },
      emotionalAwareness: {
        category: 'Emotional Awareness',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Name emotions when you feel them',
          'Keep an emotion journal',
          'Practice mindfulness meditation',
          'Learn about different emotion types'
        ],
        priority: currentScore < 50 ? 'high' : 'medium',
        expectedImpact: 8
      },
      taskManagement: {
        category: 'Task Management',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Break large tasks into smaller steps',
          'Set realistic deadlines',
          'Prioritize tasks by importance',
          'Celebrate task completions'
        ],
        priority: currentScore < 50 ? 'high' : 'medium',
        expectedImpact: 12
      },
      triggerManagement: {
        category: 'Trigger Management',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Identify your top triggers',
          'Develop coping strategies for each',
          'Practice strategies when calm',
          'Track trigger resolution'
        ],
        priority: currentScore < 50 ? 'high' : 'medium',
        expectedImpact: 10
      },
      consistency: {
        category: 'Consistency',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Set daily reminders for tracking',
          'Create a routine around wellness activities',
          'Start with small, manageable goals',
          'Track your streak progress'
        ],
        priority: currentScore < 50 ? 'high' : 'medium',
        expectedImpact: 8
      },
      improvement: {
        category: 'Improvement',
        currentScore: Math.round(currentScore),
        targetScore: Math.min(100, Math.round(currentScore) + 15),
        actions: [
          'Review your progress regularly',
          'Celebrate small improvements',
          'Learn from setbacks',
          'Set achievable growth goals'
        ],
        priority: 'low',
        expectedImpact: 5
      }
    };

    return recommendations[component];
  }

  /**
   * Calculate score trends
   */
  private calculateTrends(
    overallScore: number,
    componentScores: ComponentScores,
    historicalScores?: ProgressScore[]
  ): ScoreTrends {
    const componentTrends: Partial<Record<keyof ComponentScores, TrendDirection>> = {};

    if (historicalScores && historicalScores.length >= 2) {
      const sorted = [...historicalScores].sort(
        (a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime()
      );

      (Object.keys(componentScores) as Array<keyof ComponentScores>).forEach(component => {
        const values = sorted.map(s => s.componentScores[component]);
        values.push(componentScores[component]);

        const trend = this.detectSimpleTrend(values);
        componentTrends[component] = trend;
      });
    }

    // Project future score
    const recentScores = historicalScores 
      ? [...historicalScores.slice(-3).map(s => s.overallScore), overallScore]
      : [overallScore];
    
    const trend = this.detectSimpleTrend(recentScores);
    const slope = recentScores.length > 1
      ? (recentScores[recentScores.length - 1] - recentScores[0]) / recentScores.length
      : 0;
    
    const projectedScore = clamp(overallScore + slope * 4, 0, 100); // Project 4 periods ahead
    const projectionConfidence = Math.min(0.9, 0.3 + recentScores.length * 0.15);

    return {
      overallTrend: trend,
      componentTrends,
      projectedScore: Math.round(projectedScore),
      projectionConfidence
    };
  }

  /**
   * Simple trend detection for score arrays
   */
  private detectSimpleTrend(values: number[]): TrendDirection {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Get quick score summary
   */
  getQuickScore(input: ScoreCalculationInput): {
    overall: number;
    grade: string;
    trend: TrendDirection;
    topCategory: string;
  } {
    const analysis = this.calculateProgressScore('quick', input);
    
    const topCategory = Object.entries(analysis.categoryScores)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'overall';

    return {
      overall: analysis.overallScore,
      grade: analysis.interpretation.grade,
      trend: analysis.trends.overallTrend,
      topCategory
    };
  }

  /**
   * Calculate percentile rank (requires benchmark data)
   */
  calculatePercentileRank(
    score: number,
    benchmarkScores: number[]
  ): number {
    const sorted = [...benchmarkScores, score].sort((a, b) => a - b);
    const rank = sorted.indexOf(score);
    return Math.round((rank / sorted.length) * 100);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createProgressScoreCalculator(
  config?: Partial<typeof DEFAULT_CONFIG>
): ProgressScoreCalculator {
  return new ProgressScoreCalculator(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default ProgressScoreCalculator;
