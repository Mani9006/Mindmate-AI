/**
 * MindMate AI - Weekly Report Generator
 * Generates personalized weekly wellness reports with Claude-powered narrative
 */

import {
  WeeklyReport,
  ReportSummary,
  MoodAnalysis,
  TaskAnalysis,
  TriggerAnalysis,
  ProgressMetrics,
  Recommendation,
  MoodEntry,
  Task,
  TriggerEvent,
  AnalyticsResult,
  AnalyticsError
} from './types';

import {
  getStartOfWeek,
  getEndOfDay,
  addDays,
  getDaysBetween,
  formatDateISO,
  calculateMean,
  groupBy,
  scoreToDescription
} from './utils';

import { MoodTrendCalculator, MoodTrendAnalysis } from './mood-trend-calculator';
import { TaskCompletionCalculator, TaskCompletionAnalysis } from './task-completion-calculator';
import { TriggerPatternDetector, TriggerPatternAnalysis } from './trigger-pattern-detector';

// ============================================================================
// Types
// ============================================================================

export interface ReportGenerationOptions {
  userId: string;
  weekStart?: Date;
  includeNarrative?: boolean;
  narrativeTone?: 'supportive' | 'clinical' | 'casual' | 'motivational';
  includePredictions?: boolean;
  language?: string;
}

export interface ReportDataInput {
  moodEntries: MoodEntry[];
  tasks: Task[];
  triggers: TriggerEvent[];
  previousWeekMoodEntries?: MoodEntry[];
  previousWeekTasks?: Task[];
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  name?: string;
  goals?: string[];
  focusAreas?: string[];
  preferredCopingStrategies?: string[];
  supportSystem?: string[];
}

export interface ClaudeNarrativeRequest {
  reportData: WeeklyReport;
  userPreferences?: UserPreferences;
  tone: string;
  language: string;
}

export interface ClaudeNarrativeResponse {
  narrative: string;
  keyInsights: string[];
  personalizedRecommendations: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  reportGenerationDay: 0, // Sunday
  minimumDataPoints: {
    mood: 3,
    tasks: 3,
    triggers: 2
  },
  narrativeTone: 'supportive' as const,
  defaultLanguage: 'en'
};

// ============================================================================
// Weekly Report Generator Class
// ============================================================================

export class WeeklyReportGenerator {
  private config: typeof DEFAULT_CONFIG;
  private moodCalculator: MoodTrendCalculator;
  private taskCalculator: TaskCompletionCalculator;
  private triggerDetector: TriggerPatternDetector;
  private claudeApiClient?: ClaudeApiClient;

  constructor(
    config?: Partial<typeof DEFAULT_CONFIG>,
    claudeApiClient?: ClaudeApiClient
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.moodCalculator = new MoodTrendCalculator();
    this.taskCalculator = new TaskCompletionCalculator();
    this.triggerDetector = new TriggerPatternDetector();
    this.claudeApiClient = claudeApiClient;
  }

  /**
   * Generate a complete weekly report
   */
  async generateReport(
    options: ReportGenerationOptions,
    data: ReportDataInput
  ): Promise<AnalyticsResult<WeeklyReport>> {
    const startTime = performance.now();

    try {
      // Determine week period
      const weekStart = options.weekStart || this.getDefaultWeekStart();
      const weekEnd = addDays(weekStart, 6);

      // Filter data to the week
      const weekMoodEntries = this.filterToWeek(data.moodEntries, weekStart);
      const weekTasks = this.filterToWeek(data.tasks, weekStart);
      const weekTriggers = this.filterToWeek(data.triggers, weekStart);

      // Check minimum data requirements
      if (weekMoodEntries.length < this.config.minimumDataPoints.mood &&
          weekTasks.length < this.config.minimumDataPoints.tasks) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_DATA',
            message: `Insufficient data for report generation. Need at least ${this.config.minimumDataPoints.mood} mood entries or ${this.config.minimumDataPoints.tasks} tasks.`
          },
          metadata: {
            timestamp: new Date(),
            processingTime: 0,
            dataPoints: weekMoodEntries.length + weekTasks.length + weekTriggers.length
          }
        };
      }

      // Generate component analyses
      const moodAnalysis = await this.generateMoodAnalysis(
        weekMoodEntries,
        data.previousWeekMoodEntries
      );

      const taskAnalysis = await this.generateTaskAnalysis(
        weekTasks,
        data.previousWeekTasks
      );

      const triggerAnalysis = await this.generateTriggerAnalysis(
        weekTriggers,
        weekMoodEntries
      );

      const progressMetrics = await this.calculateProgressMetrics(
        weekMoodEntries,
        weekTasks,
        weekTriggers,
        data.previousWeekMoodEntries,
        data.previousWeekTasks
      );

      // Generate insights
      const insights = this.generateInsights(
        moodAnalysis,
        taskAnalysis,
        triggerAnalysis,
        progressMetrics
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        moodAnalysis,
        taskAnalysis,
        triggerAnalysis,
        progressMetrics,
        data.userPreferences
      );

      // Create report summary
      const summary = this.createReportSummary(
        moodAnalysis,
        taskAnalysis,
        triggerAnalysis,
        progressMetrics
      );

      // Build base report
      const report: WeeklyReport = {
        userId: options.userId,
        weekStart,
        weekEnd,
        generatedAt: new Date(),
        summary,
        moodAnalysis,
        taskAnalysis,
        triggerAnalysis,
        progressMetrics,
        insights,
        recommendations,
        narrative: '' // Will be populated if Claude is available
      };

      // Generate narrative with Claude if requested and available
      if (options.includeNarrative !== false && this.claudeApiClient) {
        try {
          const narrative = await this.generateNarrativeWithClaude(report, {
            tone: options.narrativeTone || this.config.narrativeTone,
            language: options.language || this.config.defaultLanguage,
            userPreferences: data.userPreferences
          });
          report.narrative = narrative;
        } catch (error) {
          console.warn('[WeeklyReportGenerator] Claude narrative generation failed:', error);
          report.narrative = this.generateFallbackNarrative(report);
        }
      } else {
        report.narrative = this.generateFallbackNarrative(report);
      }

      const duration = performance.now() - startTime;

      return {
        success: true,
        data: report,
        metadata: {
          timestamp: new Date(),
          processingTime: duration,
          dataPoints: weekMoodEntries.length + weekTasks.length + weekTriggers.length
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error during report generation',
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
   * Generate mood analysis section
   */
  private async generateMoodAnalysis(
    currentEntries: MoodEntry[],
    previousEntries?: MoodEntry[]
  ): Promise<MoodAnalysis> {
    if (currentEntries.length === 0) {
      return {
        averageMood: 0,
        moodTrend: {
          direction: 'stable',
          strength: 0,
          confidence: 0,
          slope: 0,
          intercept: 0,
          dataPoints: 0,
          startValue: 0,
          endValue: 0,
          changePercent: 0
        },
        moodVolatility: 0,
        dominantEmotions: [],
        bestDay: { day: 'N/A', averageMood: 0 },
        challengingDay: { day: 'N/A', averageMood: 5 }
      };
    }

    // Use mood trend calculator
    const moodAnalysis = this.moodCalculator.analyzeMoodTrends(currentEntries);

    // Find best and challenging days
    const dailyGroups = groupBy(currentEntries, e => formatDateISO(e.timestamp));
    const dailyAverages = Object.entries(dailyGroups).map(([day, entries]) => ({
      day,
      averageMood: calculateMean(entries.map(e => e.moodLevel))
    }));

    const sortedDays = dailyAverages.sort((a, b) => a.averageMood - b.averageMood);
    const bestDay = sortedDays[sortedDays.length - 1] || { day: 'N/A', averageMood: 0 };
    const challengingDay = sortedDays[0] || { day: 'N/A', averageMood: 5 };

    // Get dominant emotions
    const allEmotions = currentEntries.flatMap(e => e.emotions || []);
    const emotionCounts: Record<string, number> = {};
    allEmotions.forEach(e => {
      emotionCounts[e.name] = (emotionCounts[e.name] || 0) + 1;
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return {
      averageMood: moodAnalysis.summary.averageMood,
      moodTrend: moodAnalysis.trend,
      moodVolatility: moodAnalysis.summary.moodVolatility,
      dominantEmotions,
      bestDay,
      challengingDay
    };
  }

  /**
   * Generate task analysis section
   */
  private async generateTaskAnalysis(
    currentTasks: Task[],
    previousTasks?: Task[]
  ): Promise<TaskAnalysis> {
    if (currentTasks.length === 0) {
      return {
        completionRate: 0,
        tasksCompleted: 0,
        tasksCreated: 0,
        overdueTasks: 0,
        averageCompletionTime: 0,
        productivityTrend: 'stable'
      };
    }

    // Use task completion calculator
    const taskAnalysis = this.taskCalculator.analyzeTaskCompletion(currentTasks);

    return {
      completionRate: taskAnalysis.summary.completionRate,
      tasksCompleted: taskAnalysis.summary.completedTasks,
      tasksCreated: taskAnalysis.summary.totalTasks,
      overdueTasks: taskAnalysis.summary.overdueTasks,
      averageCompletionTime: taskAnalysis.timing.averageCompletionTime,
      productivityTrend: taskAnalysis.trends.completionTrend
    };
  }

  /**
   * Generate trigger analysis section
   */
  private async generateTriggerAnalysis(
    currentTriggers: TriggerEvent[],
    moodEntries: MoodEntry[]
  ): Promise<TriggerAnalysis> {
    if (currentTriggers.length === 0) {
      return {
        totalTriggers: 0,
        topTriggers: [],
        triggerFrequencyChange: 0,
        mostChallengingContext: 'N/A'
      };
    }

    // Use trigger pattern detector
    const triggerAnalysis = this.triggerDetector.analyzeTriggerPatterns(
      currentTriggers,
      moodEntries.length > 0 ? moodEntries : undefined
    );

    // Get most challenging context
    const contextTriggers = currentTriggers.filter(t => t.context);
    const contextCounts: Record<string, number> = {};
    contextTriggers.forEach(t => {
      if (t.context) {
        contextCounts[t.context] = (contextCounts[t.context] || 0) + 1;
      }
    });

    const mostChallengingContext = Object.entries(contextCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalTriggers: triggerAnalysis.summary.totalTriggers,
      topTriggers: triggerAnalysis.patterns.slice(0, 3),
      triggerFrequencyChange: 0, // Would need previous week data
      mostChallengingContext
    };
  }

  /**
   * Calculate progress metrics
   */
  private async calculateProgressMetrics(
    currentMoodEntries: MoodEntry[],
    currentTasks: Task[],
    currentTriggers: TriggerEvent[],
    previousMoodEntries?: MoodEntry[],
    previousTasks?: Task[]
  ): Promise<ProgressMetrics> {
    // Calculate wellness score (simplified version)
    let moodScore = 50;
    let taskScore = 50;
    let triggerScore = 50;

    if (currentMoodEntries.length > 0) {
      const avgMood = calculateMean(currentMoodEntries.map(e => e.moodLevel));
      moodScore = (avgMood / 5) * 100;
    }

    if (currentTasks.length > 0) {
      const completed = currentTasks.filter(t => t.status === 'completed').length;
      taskScore = (completed / currentTasks.length) * 100;
    }

    if (currentTriggers.length > 0) {
      const resolved = currentTriggers.filter(t => t.resolvedAt).length;
      triggerScore = (resolved / currentTriggers.length) * 100;
    }

    // Weighted composite score
    const wellnessScore = Math.round(
      moodScore * 0.4 + taskScore * 0.35 + triggerScore * 0.25
    );

    // Calculate streak (consecutive days with activity)
    const allDates = new Set([
      ...currentMoodEntries.map(e => formatDateISO(e.timestamp)),
      ...currentTasks.map(t => formatDateISO(t.createdAt))
    ]);
    const sortedDates = Array.from(allDates).sort();
    
    let streakDays = 0;
    const today = formatDateISO(new Date());
    
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const expectedDate = formatDateISO(addDays(new Date(today), -(sortedDates.length - 1 - i)));
      if (sortedDates[i] === expectedDate || (i === sortedDates.length - 1 && sortedDates[i] === today)) {
        streakDays++;
      } else {
        break;
      }
    }

    // Calculate consistency score
    const daysInWeek = 7;
    const activeDays = allDates.size;
    const consistencyScore = Math.round((activeDays / daysInWeek) * 100);

    // Calculate score change from previous week
    let scoreChange = 0;
    if (previousMoodEntries && previousTasks) {
      const prevMoodScore = previousMoodEntries.length > 0
        ? (calculateMean(previousMoodEntries.map(e => e.moodLevel)) / 5) * 100
        : 50;
      const prevCompleted = previousTasks.filter(t => t.status === 'completed').length;
      const prevTaskScore = previousTasks.length > 0
        ? (prevCompleted / previousTasks.length) * 100
        : 50;
      const prevScore = prevMoodScore * 0.4 + prevTaskScore * 0.35 + 50 * 0.25;
      
      scoreChange = wellnessScore - prevScore;
    }

    return {
      wellnessScore,
      scoreChange,
      streakDays,
      consistencyScore
    };
  }

  /**
   * Generate insights from all analyses
   */
  private generateInsights(
    moodAnalysis: MoodAnalysis,
    taskAnalysis: TaskAnalysis,
    triggerAnalysis: TriggerAnalysis,
    progressMetrics: ProgressMetrics
  ): string[] {
    const insights: string[] = [];

    // Mood insights
    if (moodAnalysis.moodTrend.direction === 'improving') {
      insights.push('Your mood has been trending upward this week. Keep up the positive momentum!');
    } else if (moodAnalysis.moodTrend.direction === 'declining') {
      insights.push('Your mood has shown some decline this week. Consider reaching out for support.');
    }

    if (moodAnalysis.moodVolatility > 0.4) {
      insights.push('Your mood has shown significant variability. Tracking triggers may help identify patterns.');
    }

    // Task insights
    if (taskAnalysis.completionRate >= 80) {
      insights.push(`Excellent task completion rate at ${taskAnalysis.completionRate.toFixed(0)}%!`);
    } else if (taskAnalysis.completionRate < 50) {
      insights.push('Consider breaking tasks into smaller, more manageable pieces.');
    }

    if (taskAnalysis.overdueTasks > 0) {
      insights.push(`You have ${taskAnalysis.overdueTasks} overdue tasks. Prioritizing these may help reduce stress.`);
    }

    // Trigger insights
    if (triggerAnalysis.totalTriggers > 5) {
      insights.push(`You experienced ${triggerAnalysis.totalTriggers} triggers this week. Remember to use your coping strategies.`);
    }

    // Progress insights
    if (progressMetrics.streakDays >= 7) {
      insights.push('Amazing! You\'ve maintained a full week streak of activity.');
    }

    if (progressMetrics.scoreChange > 5) {
      insights.push('Your wellness score improved significantly from last week!');
    }

    return insights;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    moodAnalysis: MoodAnalysis,
    taskAnalysis: TaskAnalysis,
    triggerAnalysis: TriggerAnalysis,
    progressMetrics: ProgressMetrics,
    userPreferences?: UserPreferences
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Mood-based recommendations
    if (moodAnalysis.moodVolatility > 0.4) {
      recommendations.push({
        category: 'Mood Regulation',
        title: 'Practice Grounding Techniques',
        description: 'Your mood variability suggests grounding exercises could help stabilize your emotional state.',
        priority: 'high',
        actionItems: [
          'Try the 5-4-3-2-1 grounding technique',
          'Practice deep breathing when you notice mood shifts',
          'Keep a mood journal to identify patterns'
        ]
      });
    }

    // Task-based recommendations
    if (taskAnalysis.completionRate < 60) {
      recommendations.push({
        category: 'Task Management',
        title: 'Break Down Large Tasks',
        description: 'Breaking tasks into smaller steps can make them more manageable.',
        priority: 'medium',
        actionItems: [
          'Divide tasks into 15-30 minute chunks',
          'Focus on one task at a time',
          'Celebrate small wins'
        ]
      });
    }

    if (taskAnalysis.overdueTasks > 2) {
      recommendations.push({
        category: 'Task Management',
        title: 'Address Overdue Tasks',
        description: 'Overdue tasks can create stress. Let\'s tackle them systematically.',
        priority: 'high',
        actionItems: [
          'List all overdue tasks',
          'Prioritize by impact and effort',
          'Schedule specific times to work on them'
        ]
      });
    }

    // Trigger-based recommendations
    if (triggerAnalysis.totalTriggers > 3) {
      recommendations.push({
        category: 'Trigger Management',
        title: 'Develop Coping Strategies',
        description: 'You experienced several triggers this week. Having strategies ready can help.',
        priority: 'medium',
        actionItems: [
          'Identify your top 3 triggers',
          'Create a coping strategy for each',
          'Practice strategies when calm'
        ]
      });
    }

    // Progress-based recommendations
    if (progressMetrics.consistencyScore < 50) {
      recommendations.push({
        category: 'Consistency',
        title: 'Build a Daily Routine',
        description: 'Regular engagement with MindMate helps build healthy habits.',
        priority: 'medium',
        actionItems: [
          'Set a daily reminder to log your mood',
          'Schedule weekly task reviews',
          'Connect with your support system regularly'
        ]
      });
    }

    // Add user preference-based recommendations
    if (userPreferences?.focusAreas?.includes('anxiety') && moodAnalysis.moodVolatility > 0.3) {
      recommendations.push({
        category: 'Anxiety Management',
        title: 'Anxiety Support Resources',
        description: 'Based on your focus area, here are some anxiety-specific strategies.',
        priority: 'high',
        actionItems: [
          'Practice progressive muscle relaxation',
          'Try guided meditation',
          'Consider speaking with a therapist'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Create report summary
   */
  private createReportSummary(
    moodAnalysis: MoodAnalysis,
    taskAnalysis: TaskAnalysis,
    triggerAnalysis: TriggerAnalysis,
    progressMetrics: ProgressMetrics
  ): ReportSummary {
    const keyHighlights: string[] = [];
    const areasOfConcern: string[] = [];
    const wins: string[] = [];

    // Highlights
    if (moodAnalysis.moodTrend.direction === 'improving') {
      keyHighlights.push('Mood trending upward');
    }
    if (taskAnalysis.completionRate >= 70) {
      keyHighlights.push('Strong task completion rate');
    }
    if (progressMetrics.streakDays >= 5) {
      keyHighlights.push(`${progressMetrics.streakDays}-day activity streak`);
    }

    // Concerns
    if (moodAnalysis.moodTrend.direction === 'declining') {
      areasOfConcern.push('Mood showing decline');
    }
    if (taskAnalysis.overdueTasks > 0) {
      areasOfConcern.push(`${taskAnalysis.overdueTasks} overdue tasks`);
    }
    if (triggerAnalysis.totalTriggers > 5) {
      areasOfConcern.push('Multiple triggers experienced');
    }

    // Wins
    if (moodAnalysis.averageMood >= 3.5) {
      wins.push('Maintained positive average mood');
    }
    if (taskAnalysis.completionRate >= 80) {
      wins.push('Excellent task completion');
    }
    if (progressMetrics.wellnessScore >= 70) {
      wins.push('Strong overall wellness score');
    }

    return {
      overallMood: this.getOverallMoodDescription(moodAnalysis),
      keyHighlights,
      areasOfConcern,
      wins
    };
  }

  /**
   * Get overall mood description
   */
  private getOverallMoodDescription(moodAnalysis: MoodAnalysis): string {
    if (moodAnalysis.averageMood === 0) return 'No mood data available';
    
    const descriptions: Record<number, string> = {
      1: 'Very Challenging',
      2: 'Challenging',
      3: 'Neutral',
      4: 'Positive',
      5: 'Very Positive'
    };

    const roundedMood = Math.round(moodAnalysis.averageMood);
    return descriptions[roundedMood] || 'Mixed';
  }

  /**
   * Generate narrative using Claude API
   */
  private async generateNarrativeWithClaude(
    report: WeeklyReport,
    options: {
      tone: string;
      language: string;
      userPreferences?: UserPreferences;
    }
  ): Promise<string> {
    if (!this.claudeApiClient) {
      throw new Error('Claude API client not configured');
    }

    const prompt = this.buildClaudePrompt(report, options);
    
    const response = await this.claudeApiClient.generateResponse({
      prompt,
      maxTokens: 1500,
      temperature: 0.7
    });

    return response.text;
  }

  /**
   * Build prompt for Claude
   */
  private buildClaudePrompt(
    report: WeeklyReport,
    options: {
      tone: string;
      language: string;
      userPreferences?: UserPreferences;
    }
  ): string {
    const userName = options.userPreferences?.name || 'there';
    
    const toneInstructions: Record<string, string> = {
      supportive: 'Be warm, encouraging, and empathetic. Use a supportive tone that validates the user\'s experiences.',
      clinical: 'Use professional, objective language. Focus on data and evidence-based observations.',
      casual: 'Use friendly, conversational language. Keep it light and approachable.',
      motivational: 'Be inspiring and action-oriented. Encourage the user to keep pushing forward.'
    };

    return `
You are MindMate AI, a compassionate mental wellness companion. Write a personalized weekly wellness report narrative for ${userName}.

${toneInstructions[options.tone] || toneInstructions.supportive}

WEEKLY DATA SUMMARY:
- Week of: ${report.weekStart.toDateString()} to ${report.weekEnd.toDateString()}
- Overall Mood: ${report.summary.overallMood}
- Average Mood Score: ${report.moodAnalysis.averageMood.toFixed(1)}/5
- Mood Trend: ${report.moodAnalysis.moodTrend.direction}
- Tasks Completed: ${report.taskAnalysis.tasksCompleted}/${report.taskAnalysis.tasksCreated}
- Task Completion Rate: ${report.taskAnalysis.completionRate.toFixed(1)}%
- Triggers Logged: ${report.triggerAnalysis.totalTriggers}
- Wellness Score: ${report.progressMetrics.wellnessScore}/100
- Activity Streak: ${report.progressMetrics.streakDays} days

KEY HIGHLIGHTS:
${report.summary.keyHighlights.map(h => `- ${h}`).join('\n') || '- No major highlights this week'}

AREAS OF CONCERN:
${report.summary.areasOfConcern.map(c => `- ${c}`).join('\n') || '- No major concerns this week'}

WINS:
${report.summary.wins.map(w => `- ${w}`).join('\n') || '- Keep tracking to identify wins'}

DOMINANT EMOTIONS:
${report.moodAnalysis.dominantEmotions.join(', ') || 'No emotion data available'}

TOP RECOMMENDATIONS:
${report.recommendations.slice(0, 3).map(r => `- ${r.title}: ${r.description}`).join('\n')}

Please write a personalized, engaging narrative (300-500 words) that:
1. Opens with a warm greeting and acknowledges the week's overall pattern
2. Highlights specific achievements and positive moments
3. Gently addresses any areas of concern with supportive language
4. Provides context for the data in an accessible way
5. Ends with encouragement and a look forward to the coming week

Make it feel personal and human, not like a data report. Use the person's name naturally.
`;
  }

  /**
   * Generate fallback narrative without Claude
   */
  private generateFallbackNarrative(report: WeeklyReport): string {
    const parts: string[] = [];

    // Opening
    parts.push(`# Your Weekly Wellness Report`);
    parts.push(`\n**Week of ${report.weekStart.toDateString()} - ${report.weekEnd.toDateString()}**\n`);

    // Overall summary
    parts.push(`## Overall Summary`);
    parts.push(`Your overall mood this week was **${report.summary.overallMood}**. `);
    
    if (report.moodAnalysis.moodTrend.direction === 'improving') {
      parts.push('Great news - your mood showed an upward trend! ');
    } else if (report.moodAnalysis.moodTrend.direction === 'declining') {
      parts.push('Your mood showed some challenges this week. ');
    } else {
      parts.push('Your mood remained relatively stable. ');
    }

    parts.push(`Your wellness score is **${report.progressMetrics.wellnessScore}/100**.\n`);

    // Mood section
    parts.push(`## Mood Analysis`);
    parts.push(`- Average mood: ${report.moodAnalysis.averageMood.toFixed(1)}/5`);
    parts.push(`- Mood trend: ${report.moodAnalysis.moodTrend.direction}`);
    parts.push(`- Best day: ${report.moodAnalysis.bestDay.day} (${report.moodAnalysis.bestDay.averageMood.toFixed(1)}/5)`);
    if (report.moodAnalysis.dominantEmotions.length > 0) {
      parts.push(`- Dominant emotions: ${report.moodAnalysis.dominantEmotions.join(', ')}`);
    }
    parts.push('');

    // Tasks section
    parts.push(`## Task Progress`);
    parts.push(`- Tasks completed: ${report.taskAnalysis.tasksCompleted}/${report.taskAnalysis.tasksCreated}`);
    parts.push(`- Completion rate: ${report.taskAnalysis.completionRate.toFixed(1)}%`);
    if (report.taskAnalysis.overdueTasks > 0) {
      parts.push(`- Overdue tasks: ${report.taskAnalysis.overdueTasks}`);
    }
    parts.push('');

    // Triggers section
    if (report.triggerAnalysis.totalTriggers > 0) {
      parts.push(`## Triggers & Challenges`);
      parts.push(`- Total triggers logged: ${report.triggerAnalysis.totalTriggers}`);
      if (report.triggerAnalysis.topTriggers.length > 0) {
        parts.push(`- Most common: ${report.triggerAnalysis.topTriggers[0].triggerType}`);
      }
      parts.push('');
    }

    // Insights
    if (report.insights.length > 0) {
      parts.push(`## Key Insights`);
      report.insights.forEach(insight => parts.push(`- ${insight}`));
      parts.push('');
    }

    // Recommendations
    parts.push(`## Recommendations for Next Week`);
    report.recommendations.slice(0, 3).forEach(rec => {
      parts.push(`**${rec.title}** (${rec.priority} priority)`);
      parts.push(`${rec.description}`);
      if (rec.actionItems) {
        parts.push('Action items:');
        rec.actionItems.forEach(item => parts.push(`  - ${item}`));
      }
      parts.push('');
    });

    // Closing
    parts.push(`---`);
    parts.push(`*Keep up the great work! Consistent tracking helps you understand your patterns and make positive changes.*`);

    return parts.join('\n');
  }

  /**
   * Filter data to a specific week
   */
  private filterToWeek<T extends { timestamp: Date } | { createdAt: Date }>(
    items: T[],
    weekStart: Date
  ): T[] {
    const weekEnd = getEndOfDay(addDays(weekStart, 6));
    const start = weekStart.getTime();
    const end = weekEnd.getTime();

    return items.filter(item => {
      const itemTime = 'timestamp' in item 
        ? item.timestamp.getTime() 
        : item.createdAt.getTime();
      return itemTime >= start && itemTime <= end;
    });
  }

  /**
   * Get default week start (previous Sunday)
   */
  private getDefaultWeekStart(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysSinceSunday = dayOfWeek;
    const lastSunday = addDays(today, -daysSinceSunday - 7);
    return getStartOfWeek(lastSunday);
  }
}

// ============================================================================
// Claude API Client Interface
// ============================================================================

export interface ClaudeApiClient {
  generateResponse(options: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }>;
}

// ============================================================================
// Example Claude API Client Implementation
// ============================================================================

export class AnthropicClaudeClient implements ClaudeApiClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = 'claude-3-sonnet-20240229') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async generateResponse(options: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        messages: [{ role: 'user', content: options.prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      text: data.content[0].text,
      usage: data.usage
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createWeeklyReportGenerator(
  config?: Partial<typeof DEFAULT_CONFIG>,
  claudeApiClient?: ClaudeApiClient
): WeeklyReportGenerator {
  return new WeeklyReportGenerator(config, claudeApiClient);
}

// ============================================================================
// Default Export
// ============================================================================

export default WeeklyReportGenerator;
