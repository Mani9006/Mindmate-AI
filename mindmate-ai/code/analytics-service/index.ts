/**
 * MindMate AI - Analytics Service
 * Main orchestrator for all analytics computations
 * 
 * This module provides a unified interface for:
 * - Mood trend calculation (rolling average, trend detection)
 * - Task completion rate calculator
 * - Emotional trigger pattern detector
 * - Weekly report generator (with Claude integration)
 * - Progress score calculator (composite mental wellness score)
 * - Milestone detector and celebrator
 */

// ============================================================================
// Re-exports from submodules
// ============================================================================

// Types
export * from './types';

// Utilities
export * from './utils';

// Mood Trend Calculator
export {
  MoodTrendCalculator,
  MoodTrendAnalysis,
  DailyMoodSummary,
  MoodInsight,
  MoodComparison,
  MoodPrediction,
  createMoodTrendCalculator
} from './mood-trend-calculator';

// Task Completion Calculator
export {
  TaskCompletionCalculator,
  TaskCompletionAnalysis,
  PriorityStats,
  CategoryStats,
  TaskInsight,
  ProductivityScore,
  TaskForecast,
  createTaskCompletionCalculator
} from './task-completion-calculator';

// Trigger Pattern Detector
export {
  TriggerPatternDetector,
  TriggerPatternAnalysis,
  TriggerMoodCorrelation,
  RiskFactor,
  TriggerInsight,
  TriggerPrediction,
  TriggerIntervention,
  Intervention,
  createTriggerPatternDetector
} from './trigger-pattern-detector';

// Weekly Report Generator
export {
  WeeklyReportGenerator,
  ReportGenerationOptions,
  ReportDataInput,
  UserPreferences,
  ClaudeApiClient,
  AnthropicClaudeClient,
  createWeeklyReportGenerator
} from './weekly-report-generator';

// Progress Score Calculator
export {
  ProgressScoreCalculator,
  ProgressScoreAnalysis,
  CategoryScores,
  ScoreInterpretation,
  ScoreRecommendation,
  ScoreTrends,
  ScoreCalculationInput,
  ScoreBenchmark,
  createProgressScoreCalculator
} from './progress-score-calculator';

// Milestone Detector
export {
  MilestoneDetector,
  MilestoneConfig,
  CustomMilestoneDefinition,
  MilestoneDetectionInput,
  MilestoneStatistics,
  UpcomingMilestone,
  CelebrationPreferences,
  createMilestoneDetector
} from './milestone-detector';

// ============================================================================
// Main Analytics Service Orchestrator
// ============================================================================

import { MoodTrendCalculator } from './mood-trend-calculator';
import { TaskCompletionCalculator } from './task-completion-calculator';
import { TriggerPatternDetector } from './trigger-pattern-detector';
import { WeeklyReportGenerator, ClaudeApiClient } from './weekly-report-generator';
import { ProgressScoreCalculator } from './progress-score-calculator';
import { MilestoneDetector, MilestoneConfig } from './milestone-detector';

import {
  MoodEntry,
  Task,
  TriggerEvent,
  ProgressScore,
  WeeklyReport,
  Milestone,
  MilestoneCheckResult,
  AnalyticsResult,
  AnalyticsConfig
} from './types';

export interface AnalyticsServiceConfig {
  mood?: Parameters<typeof MoodTrendCalculator.prototype.analyzeMoodTrends>[2];
  tasks?: Parameters<typeof TaskCompletionCalculator.prototype.analyzeTaskCompletion>[2];
  triggers?: Parameters<typeof TriggerPatternDetector.prototype.analyzeTriggerPatterns>[2];
  reports?: Parameters<typeof WeeklyReportGenerator.prototype.generateReport>[0];
  progress?: Parameters<typeof ProgressScoreCalculator.prototype.calculateProgressScore>[2];
  milestones?: Partial<MilestoneConfig>;
  claudeApiClient?: ClaudeApiClient;
}

export interface FullAnalyticsResult {
  userId: string;
  generatedAt: Date;
  moodAnalysis?: ReturnType<MoodTrendCalculator['analyzeMoodTrends']>;
  taskAnalysis?: ReturnType<TaskCompletionCalculator['analyzeTaskCompletion']>;
  triggerAnalysis?: ReturnType<TriggerPatternDetector['analyzeTriggerPatterns']>;
  progressScore?: ReturnType<ProgressScoreCalculator['calculateProgressScore']>;
  milestones?: MilestoneCheckResult;
  weeklyReport?: WeeklyReport;
}

export interface DashboardData {
  userId: string;
  generatedAt: Date;
  quickStats: {
    currentMood: number;
    moodTrend: string;
    streakDays: number;
    tasksCompleted: number;
    tasksTotal: number;
    completionRate: number;
    wellnessScore: number;
    triggersThisWeek: number;
  };
  recentMilestones: Milestone[];
  upcomingMilestones: { name: string; progress: number }[];
  insights: string[];
  recommendations: string[];
}

export class AnalyticsService {
  private moodCalculator: MoodTrendCalculator;
  private taskCalculator: TaskCompletionCalculator;
  private triggerDetector: TriggerPatternDetector;
  private reportGenerator: WeeklyReportGenerator;
  private progressCalculator: ProgressScoreCalculator;
  private milestoneDetector: MilestoneDetector;
  private config: AnalyticsServiceConfig;

  constructor(config: AnalyticsServiceConfig = {}) {
    this.config = config;
    
    this.moodCalculator = new MoodTrendCalculator();
    this.taskCalculator = new TaskCompletionCalculator();
    this.triggerDetector = new TriggerPatternDetector();
    this.reportGenerator = new WeeklyReportGenerator(
      undefined,
      config.claudeApiClient
    );
    this.progressCalculator = new ProgressScoreCalculator();
    this.milestoneDetector = new MilestoneDetector(config.milestones);
  }

  /**
   * Run complete analytics for a user
   */
  async runFullAnalytics(
    userId: string,
    data: {
      moodEntries: MoodEntry[];
      tasks: Task[];
      triggers: TriggerEvent[];
      progressScores?: ProgressScore[];
      existingMilestones?: Milestone[];
      previousWeekMoodEntries?: MoodEntry[];
      previousWeekTasks?: Task[];
    }
  ): Promise<AnalyticsResult<FullAnalyticsResult>> {
    const startTime = performance.now();

    try {
      const result: FullAnalyticsResult = {
        userId,
        generatedAt: new Date()
      };

      // Run mood analysis
      if (data.moodEntries.length >= 3) {
        result.moodAnalysis = this.moodCalculator.analyzeMoodTrends(data.moodEntries);
      }

      // Run task analysis
      if (data.tasks.length >= 3) {
        result.taskAnalysis = this.taskCalculator.analyzeTaskCompletion(data.tasks);
      }

      // Run trigger analysis
      if (data.triggers.length >= 2) {
        result.triggerAnalysis = this.triggerDetector.analyzeTriggerPatterns(
          data.triggers,
          data.moodEntries.length > 0 ? data.moodEntries : undefined
        );
      }

      // Calculate progress score
      result.progressScore = this.progressCalculator.calculateProgressScore(userId, {
        moodEntries: data.moodEntries,
        tasks: data.tasks,
        triggers: data.triggers,
        historicalScores: data.progressScores
      });

      // Check milestones
      result.milestones = this.milestoneDetector.checkMilestones({
        userId,
        moodEntries: data.moodEntries,
        tasks: data.tasks,
        triggers: data.triggers,
        progressScores: data.progressScores || [],
        existingMilestones: data.existingMilestones || []
      });

      const duration = performance.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          processingTime: duration,
          dataPoints: data.moodEntries.length + data.tasks.length + data.triggers.length
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown analytics error',
          details: { error }
        },
        metadata: {
          timestamp: new Date(),
          processingTime: duration,
          dataPoints: 0
        }
      };
    }
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(
    userId: string,
    data: {
      moodEntries: MoodEntry[];
      tasks: Task[];
      triggers: TriggerEvent[];
      previousWeekMoodEntries?: MoodEntry[];
      previousWeekTasks?: Task[];
      userPreferences?: Parameters<typeof WeeklyReportGenerator.prototype.generateReport>[1]['userPreferences'];
    },
    options?: {
      weekStart?: Date;
      includeNarrative?: boolean;
      narrativeTone?: 'supportive' | 'clinical' | 'casual' | 'motivational';
    }
  ): Promise<AnalyticsResult<WeeklyReport>> {
    return this.reportGenerator.generateReport(
      {
        userId,
        weekStart: options?.weekStart,
        includeNarrative: options?.includeNarrative,
        narrativeTone: options?.narrativeTone
      },
      {
        moodEntries: data.moodEntries,
        tasks: data.tasks,
        triggers: data.triggers,
        previousWeekMoodEntries: data.previousWeekMoodEntries,
        previousWeekTasks: data.previousWeekTasks,
        userPreferences: data.userPreferences
      }
    );
  }

  /**
   * Get dashboard data
   */
  getDashboardData(
    userId: string,
    data: {
      moodEntries: MoodEntry[];
      tasks: Task[];
      triggers: TriggerEvent[];
      existingMilestones: Milestone[];
    }
  ): DashboardData {
    const quickStats = this.calculateQuickStats(data);
    
    // Get milestone info
    const milestoneStats = this.milestoneDetector.getMilestoneStatistics(
      data.existingMilestones,
      {
        userId,
        moodEntries: data.moodEntries,
        tasks: data.tasks,
        triggers: data.triggers,
        progressScores: [],
        existingMilestones: data.existingMilestones
      }
    );

    // Get insights
    const insights: string[] = [];
    
    if (data.moodEntries.length >= 3) {
      const quickMood = this.moodCalculator.getQuickSummary(data.moodEntries);
      if (quickMood.trend === 'improving') {
        insights.push('Your mood has been trending upward!');
      } else if (quickMood.trend === 'declining') {
        insights.push('Your mood has shown some challenges recently.');
      }
    }

    if (data.tasks.length > 0) {
      const quickTasks = this.taskCalculator.getQuickStats(data.tasks);
      if (quickTasks.completionRate >= 80) {
        insights.push('Excellent task completion rate!');
      } else if (quickTasks.overdue > 0) {
        insights.push(`You have ${quickTasks.overdue} overdue tasks to address.`);
      }
    }

    // Get recommendations
    const recommendations: string[] = [];
    
    if (quickStats.streakDays < 3) {
      recommendations.push('Try to log your mood daily to build a streak!');
    }
    if (quickStats.completionRate < 60) {
      recommendations.push('Break tasks into smaller steps for better completion.');
    }
    if (quickStats.wellnessScore < 60) {
      recommendations.push('Consider practicing self-care activities daily.');
    }

    return {
      userId,
      generatedAt: new Date(),
      quickStats,
      recentMilestones: milestoneStats.recentAchievements.slice(0, 3),
      upcomingMilestones: milestoneStats.upcomingMilestones.slice(0, 3).map(m => ({
        name: m.name,
        progress: m.progress
      })),
      insights,
      recommendations
    };
  }

  /**
   * Calculate quick stats for dashboard
   */
  private calculateQuickStats(data: {
    moodEntries: MoodEntry[];
    tasks: Task[];
    triggers: TriggerEvent[];
  }): DashboardData['quickStats'] {
    // Mood stats
    let currentMood = 0;
    let moodTrend = 'stable';
    let streakDays = 0;

    if (data.moodEntries.length > 0) {
      const quickMood = this.moodCalculator.getQuickSummary(data.moodEntries);
      currentMood = quickMood.currentMood;
      moodTrend = quickMood.trend;
      streakDays = quickMood.streak;
    }

    // Task stats
    let tasksCompleted = 0;
    let tasksTotal = 0;
    let completionRate = 0;

    if (data.tasks.length > 0) {
      const quickTasks = this.taskCalculator.getQuickStats(data.tasks);
      tasksCompleted = quickTasks.completed;
      tasksTotal = quickTasks.total;
      completionRate = quickTasks.completionRate;
    }

    // Wellness score
    let wellnessScore = 50;
    if (data.moodEntries.length > 0 || data.tasks.length > 0) {
      const quickScore = this.progressCalculator.getQuickScore({
        moodEntries: data.moodEntries,
        tasks: data.tasks,
        triggers: data.triggers,
        progressScores: []
      });
      wellnessScore = quickScore.overall;
    }

    // Triggers this week
    const oneWeekAgo = addDays(new Date(), -7);
    const triggersThisWeek = data.triggers.filter(t => 
      t.timestamp >= oneWeekAgo
    ).length;

    return {
      currentMood,
      moodTrend,
      streakDays,
      tasksCompleted,
      tasksTotal,
      completionRate,
      wellnessScore,
      triggersThisWeek
    };
  }

  /**
   * Check for new milestones
   */
  checkMilestones(
    userId: string,
    data: {
      moodEntries: MoodEntry[];
      tasks: Task[];
      triggers: TriggerEvent[];
      progressScores: ProgressScore[];
      existingMilestones: Milestone[];
    }
  ): MilestoneCheckResult {
    return this.milestoneDetector.checkMilestones({
      userId,
      moodEntries: data.moodEntries,
      tasks: data.tasks,
      triggers: data.triggers,
      progressScores: data.progressScores,
      existingMilestones: data.existingMilestones
    });
  }

  /**
   * Get mood predictions
   */
  predictMood(
    moodEntries: MoodEntry[],
    daysAhead: number = 7
  ): ReturnType<MoodTrendCalculator['predictMood']> {
    return this.moodCalculator.predictMood(moodEntries, daysAhead);
  }

  /**
   * Forecast task completion
   */
  forecastTasks(
    tasks: Task[],
    pendingTasks: Task[],
    daysAhead: number = 7
  ): ReturnType<TaskCompletionCalculator['forecastTaskCompletion']> {
    return this.taskCalculator.forecastTaskCompletion(tasks, pendingTasks, daysAhead);
  }

  /**
   * Predict triggers
   */
  predictTriggers(
    triggers: TriggerEvent[],
    daysAhead: number = 7
  ): ReturnType<TriggerPatternDetector['predictTriggers']> {
    return this.triggerDetector.predictTriggers(triggers, daysAhead);
  }

  /**
   * Get recommended interventions for a trigger type
   */
  getInterventions(
    triggerType: Parameters<TriggerPatternDetector['getRecommendedInterventions']>[0]
  ): ReturnType<TriggerPatternDetector['getRecommendedInterventions']> {
    return this.triggerDetector.getRecommendedInterventions(triggerType);
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<AnalyticsServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Re-initialize components if needed
    if (config.claudeApiClient) {
      this.reportGenerator = new WeeklyReportGenerator(
        undefined,
        config.claudeApiClient
      );
    }
    
    if (config.milestones) {
      this.milestoneDetector = new MilestoneDetector(config.milestones);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAnalyticsService(
  config?: AnalyticsServiceConfig
): AnalyticsService {
  return new AnalyticsService(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default AnalyticsService;
