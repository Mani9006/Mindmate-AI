/**
 * MindMate AI - Task Completion Rate Calculator
 * Calculates task completion metrics, productivity trends, and efficiency analysis
 */

import {
  Task,
  TaskStatus,
  TaskPriority,
  TrendDirection
} from './types';

import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getDaysBetween,
  addDays,
  formatDateISO,
  groupBy,
  countBy,
  normalizeValue,
  clamp,
  detectTrend
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface TaskCompletionAnalysis {
  userId: string;
  analysisPeriod: {
    start: Date;
    end: Date;
    days: number;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
    overdueRate: number;
    cancelledTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
  };
  trends: {
    completionTrend: TrendDirection;
    dailyCompletionRate: { date: string; rate: number; count: number }[];
    weeklyTrend: { week: string; rate: number; completed: number; total: number }[];
  };
  byPriority: Record<TaskPriority, PriorityStats>;
  byCategory: Record<string, CategoryStats>;
  timing: {
    averageCompletionTime: number; // hours
    medianCompletionTime: number;
    tasksCompletedOnTime: number;
    onTimeRate: number;
    averageDelay: number; // hours
  };
  productivity: {
    mostProductiveDay: string;
    mostProductiveTime: string;
    consistencyScore: number;
    velocityTrend: number[];
  };
  insights: TaskInsight[];
}

export interface PriorityStats {
  total: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueCount: number;
}

export interface CategoryStats {
  total: number;
  completed: number;
  completionRate: number;
  averagePriority: number;
}

export interface TaskInsight {
  type: 'positive' | 'negative' | 'neutral' | 'pattern' | 'alert';
  title: string;
  description: string;
  confidence: number;
  category?: string;
}

export interface ProductivityScore {
  score: number; // 0-100
  components: {
    completionRate: number;
    onTimePerformance: number;
    consistency: number;
    efficiency: number;
    priorityManagement: number;
  };
  grade: string;
  interpretation: string;
}

export interface TaskForecast {
  predictedCompletionRate: number;
  confidence: number;
  recommendedDailyTasks: number;
  riskTasks: string[];
  suggestions: string[];
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  workHoursPerDay: 8,
  highPriorityWeight: 2,
  mediumPriorityWeight: 1.5,
  lowPriorityWeight: 1,
  onTimeBonus: 10,
  overduePenalty: 15,
  streakThreshold: 3,
  minimumTasksForAnalysis: 5
};

// ============================================================================
// Task Completion Calculator Class
// ============================================================================

export class TaskCompletionCalculator {
  private config: typeof DEFAULT_CONFIG;

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform comprehensive task completion analysis
   */
  analyzeTaskCompletion(
    tasks: Task[],
    startDate?: Date,
    endDate?: Date
  ): TaskCompletionAnalysis {
    const startTime = performance.now();

    if (tasks.length < this.config.minimumTasksForAnalysis) {
      throw new Error(
        `至少需要 ${this.config.minimumTasksForAnalysis} tasks for analysis. Got ${tasks.length}.`
      );
    }

    // Filter tasks within date range
    const sortedTasks = [...tasks].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const periodStart = startDate || sortedTasks[0].createdAt;
    const periodEnd = endDate || new Date();
    const days = getDaysBetween(periodStart, periodEnd) + 1;

    // Filter to analysis period
    const periodTasks = sortedTasks.filter(
      t => t.createdAt >= periodStart && t.createdAt <= periodEnd
    );

    // Calculate summary statistics
    const summary = this.calculateSummary(periodTasks);

    // Calculate trends
    const trends = this.calculateTrends(periodTasks, periodStart, periodEnd);

    // Calculate by priority
    const byPriority = this.analyzeByPriority(periodTasks);

    // Calculate by category
    const byCategory = this.analyzeByCategory(periodTasks);

    // Calculate timing metrics
    const timing = this.calculateTimingMetrics(periodTasks);

    // Calculate productivity metrics
    const productivity = this.calculateProductivityMetrics(periodTasks);

    // Generate insights
    const insights = this.generateInsights(
      summary, 
      byPriority, 
      timing, 
      productivity
    );

    const analysis: TaskCompletionAnalysis = {
      userId: tasks[0]?.userId || '',
      analysisPeriod: { start: periodStart, end: periodEnd, days },
      summary,
      trends,
      byPriority,
      byCategory,
      timing,
      productivity,
      insights
    };

    const duration = performance.now() - startTime;
    console.log(`[TaskCompletionCalculator] Analysis completed in ${duration.toFixed(2)}ms`);

    return analysis;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(tasks: Task[]) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
      t => t.status !== 'completed' && t.dueDate && t.dueDate < new Date()
    ).length;
    const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    return {
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      overdueTasks,
      overdueRate: totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0,
      cancelledTasks,
      inProgressTasks,
      pendingTasks
    };
  }

  /**
   * Calculate completion trends over time
   */
  private calculateTrends(
    tasks: Task[],
    startDate: Date,
    endDate: Date
  ): TaskCompletionAnalysis['trends'] {
    // Daily completion rates
    const dailyStats: { date: string; completed: number; total: number }[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = getStartOfDay(currentDate);
      const dayEnd = getEndOfDay(currentDate);
      const dateStr = formatDateISO(currentDate);

      const dayTasks = tasks.filter(t => 
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      );

      const completed = dayTasks.filter(t => t.status === 'completed').length;
      
      dailyStats.push({
        date: dateStr,
        completed,
        total: dayTasks.length
      });

      currentDate = addDays(currentDate, 1);
    }

    const dailyCompletionRate = dailyStats.map(d => ({
      date: d.date,
      rate: d.total > 0 ? (d.completed / d.total) * 100 : 0,
      count: d.total
    }));

    // Weekly trend
    const weeklyGroups = groupBy(tasks, t => {
      const weekStart = getStartOfWeek(t.createdAt);
      return formatDateISO(weekStart);
    });

    const weeklyTrend = Object.entries(weeklyGroups)
      .map(([week, weekTasks]) => {
        const completed = weekTasks.filter(t => t.status === 'completed').length;
        return {
          week,
          rate: weekTasks.length > 0 ? (completed / weekTasks.length) * 100 : 0,
          completed,
          total: weekTasks.length
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));

    // Detect overall trend
    const trendData = dailyCompletionRate
      .filter(d => d.count > 0)
      .map((d, i) => ({ timestamp: addDays(startDate, i), value: d.rate }));

    const trend = detectTrend(trendData);

    return {
      completionTrend: trend.direction,
      dailyCompletionRate,
      weeklyTrend
    };
  }

  /**
   * Analyze tasks by priority
   */
  private analyzeByPriority(tasks: Task[]): Record<TaskPriority, PriorityStats> {
    const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    const stats: Partial<Record<TaskPriority, PriorityStats>> = {};

    priorities.forEach(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority);
      const completed = priorityTasks.filter(t => t.status === 'completed');
      
      // Calculate average completion time
      const completionTimes = completed
        .filter(t => t.dueDate && t.completedAt)
        .map(t => {
          const due = t.dueDate!.getTime();
          const completed = t.completedAt!.getTime();
          return (due - completed) / (1000 * 60 * 60); // hours before/after due date
        });

      const overdueCount = priorityTasks.filter(
        t => t.status !== 'completed' && t.dueDate && t.dueDate < new Date()
      ).length;

      stats[priority] = {
        total: priorityTasks.length,
        completed: completed.length,
        completionRate: priorityTasks.length > 0 
          ? (completed.length / priorityTasks.length) * 100 
          : 0,
        averageCompletionTime: completionTimes.length > 0
          ? calculateMean(completionTimes)
          : 0,
        overdueCount
      };
    });

    return stats as Record<TaskPriority, PriorityStats>;
  }

  /**
   * Analyze tasks by category
   */
  private analyzeByCategory(tasks: Task[]): Record<string, CategoryStats> {
    const categories = groupBy(tasks, t => t.category || 'uncategorized');
    const stats: Record<string, CategoryStats> = {};

    Object.entries(categories).forEach(([category, categoryTasks]) => {
      const completed = categoryTasks.filter(t => t.status === 'completed').length;
      
      // Map priority to numeric value
      const priorityValues: Record<TaskPriority, number> = {
        low: 1,
        medium: 2,
        high: 3,
        urgent: 4
      };

      const avgPriority = calculateMean(
        categoryTasks.map(t => priorityValues[t.priority])
      );

      stats[category] = {
        total: categoryTasks.length,
        completed,
        completionRate: categoryTasks.length > 0 
          ? (completed / categoryTasks.length) * 100 
          : 0,
        averagePriority: avgPriority
      };
    });

    return stats;
  }

  /**
   * Calculate timing-related metrics
   */
  private calculateTimingMetrics(tasks: Task[]): TaskCompletionAnalysis['timing'] {
    const completedTasks = tasks.filter(
      t => t.status === 'completed' && t.completedAt
    );

    if (completedTasks.length === 0) {
      return {
        averageCompletionTime: 0,
        medianCompletionTime: 0,
        tasksCompletedOnTime: 0,
        onTimeRate: 0,
        averageDelay: 0
      };
    }

    // Calculate completion times (from creation to completion)
    const completionTimes = completedTasks.map(t => {
      const created = t.createdAt.getTime();
      const completed = t.completedAt!.getTime();
      return (completed - created) / (1000 * 60 * 60); // hours
    });

    // Calculate on-time performance
    const tasksWithDueDate = completedTasks.filter(t => t.dueDate);
    const tasksOnTime = tasksWithDueDate.filter(t => 
      t.completedAt! <= t.dueDate!
    );

    // Calculate delays for overdue tasks
    const delayedTasks = tasksWithDueDate.filter(t => 
      t.completedAt! > t.dueDate!
    );
    const delays = delayedTasks.map(t => 
      (t.completedAt!.getTime() - t.dueDate!.getTime()) / (1000 * 60 * 60)
    );

    return {
      averageCompletionTime: calculateMean(completionTimes),
      medianCompletionTime: calculateMedian(completionTimes),
      tasksCompletedOnTime: tasksOnTime.length,
      onTimeRate: tasksWithDueDate.length > 0 
        ? (tasksOnTime.length / tasksWithDueDate.length) * 100 
        : 0,
      averageDelay: delays.length > 0 ? calculateMean(delays) : 0
    };
  }

  /**
   * Calculate productivity metrics
   */
  private calculateProductivityMetrics(tasks: Task[]): TaskCompletionAnalysis['productivity'] {
    // Find most productive day
    const completedByDay = groupBy(
      tasks.filter(t => t.status === 'completed' && t.completedAt),
      t => formatDateISO(t.completedAt!)
    );

    const dayCounts = Object.entries(completedByDay).map(([date, dayTasks]) => ({
      date,
      count: dayTasks.length
    }));

    const mostProductiveDayEntry = dayCounts.sort((a, b) => b.count - a.count)[0];
    const mostProductiveDay = mostProductiveDayEntry?.date || 'N/A';

    // Find most productive time of day
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
    const hourCounts: Record<number, number> = {};
    
    completedTasks.forEach(t => {
      const hour = t.completedAt!.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const timeRanges: Record<string, string> = {
      '5': 'Early Morning (5-8 AM)',
      '8': 'Morning (8-12 PM)',
      '12': 'Afternoon (12-5 PM)',
      '17': 'Evening (5-9 PM)',
      '21': 'Night (9 PM-12 AM)',
      '0': 'Late Night (12-5 AM)'
    };

    const hour = parseInt(mostProductiveHour?.[0] || '12');
    let timeKey = '12';
    if (hour >= 5 && hour < 8) timeKey = '5';
    else if (hour >= 8 && hour < 12) timeKey = '8';
    else if (hour >= 12 && hour < 17) timeKey = '12';
    else if (hour >= 17 && hour < 21) timeKey = '17';
    else if (hour >= 21) timeKey = '21';
    else timeKey = '0';

    const mostProductiveTime = timeRanges[timeKey];

    // Calculate consistency score
    const dailyCompletionRates = Object.values(completedByDay).map(dayTasks => dayTasks.length);
    const consistencyScore = dailyCompletionRates.length > 1
      ? 100 - (calculateStandardDeviation(dailyCompletionRates) / calculateMean(dailyCompletionRates)) * 100
      : 100;

    // Calculate velocity trend (tasks completed per day)
    const velocityTrend = Object.entries(completedByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, dayTasks]) => dayTasks.length);

    return {
      mostProductiveDay,
      mostProductiveTime,
      consistencyScore: clamp(consistencyScore, 0, 100),
      velocityTrend
    };
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    summary: TaskCompletionAnalysis['summary'],
    byPriority: TaskCompletionAnalysis['byPriority'],
    timing: TaskCompletionAnalysis['timing'],
    productivity: TaskCompletionAnalysis['productivity']
  ): TaskInsight[] {
    const insights: TaskInsight[] = [];

    // Completion rate insight
    if (summary.completionRate >= 80) {
      insights.push({
        type: 'positive',
        title: 'Excellent Completion Rate',
        description: `You're completing ${summary.completionRate.toFixed(1)}% of your tasks. Great job!`,
        confidence: 0.9
      });
    } else if (summary.completionRate < 50) {
      insights.push({
        type: 'alert',
        title: 'Low Completion Rate',
        description: `Your completion rate is ${summary.completionRate.toFixed(1)}%. Consider breaking tasks into smaller pieces.`,
        confidence: 0.8
      });
    }

    // Overdue tasks insight
    if (summary.overdueRate > 20) {
      insights.push({
        type: 'alert',
        title: 'Many Overdue Tasks',
        description: `You have ${summary.overdueTasks} overdue tasks. Consider reviewing your deadlines or prioritizing.`,
        confidence: 0.85
      });
    }

    // Priority management insight
    const highPriorityStats = byPriority.high || byPriority.urgent;
    if (highPriorityStats && highPriorityStats.completionRate < 60) {
      insights.push({
        type: 'negative',
        title: 'High Priority Tasks Need Attention',
        description: `Your high priority task completion rate is ${highPriorityStats.completionRate.toFixed(1)}%. Try focusing on these first.`,
        confidence: 0.8,
        category: 'priority'
      });
    }

    // On-time performance insight
    if (timing.onTimeRate >= 80) {
      insights.push({
        type: 'positive',
        title: 'Great Time Management',
        description: `You're completing ${timing.onTimeRate.toFixed(1)}% of tasks on time.`,
        confidence: 0.85
      });
    } else if (timing.onTimeRate < 50) {
      insights.push({
        type: 'alert',
        title: 'Time Management Opportunity',
        description: `Only ${timing.onTimeRate.toFixed(1)}% of tasks are completed on time. Consider setting more realistic deadlines.`,
        confidence: 0.8
      });
    }

    // Consistency insight
    if (productivity.consistencyScore >= 80) {
      insights.push({
        type: 'positive',
        title: 'Consistent Productivity',
        description: 'Your task completion is very consistent. Keep up the steady pace!',
        confidence: 0.85
      });
    }

    // Most productive time insight
    insights.push({
      type: 'pattern',
      title: `Most Productive: ${productivity.mostProductiveTime}`,
      description: `You tend to complete the most tasks during ${productivity.mostProductiveTime.toLowerCase()}.`,
      confidence: 0.75
    });

    return insights;
  }

  /**
   * Calculate overall productivity score
   */
  calculateProductivityScore(tasks: Task[]): ProductivityScore {
    const analysis = this.analyzeTaskCompletion(tasks);
    const { summary, byPriority, timing, productivity } = analysis;

    // Component scores (0-100)
    const completionRate = summary.completionRate;
    const onTimePerformance = timing.onTimeRate;
    const consistency = productivity.consistencyScore;
    
    // Efficiency score based on average completion time
    const avgCompletionDays = timing.averageCompletionTime / 24;
    const efficiency = avgCompletionDays <= 1 ? 100 
      : avgCompletionDays <= 3 ? 80
      : avgCompletionDays <= 7 ? 60
      : 40;

    // Priority management score
    const highPriorityCompletion = (byPriority.high?.completionRate || 0) * 0.6 
      + (byPriority.urgent?.completionRate || 0) * 0.4;
    const priorityManagement = highPriorityCompletion;

    // Calculate weighted score
    const components = {
      completionRate: clamp(completionRate, 0, 100),
      onTimePerformance: clamp(onTimePerformance, 0, 100),
      consistency: clamp(consistency, 0, 100),
      efficiency: clamp(efficiency, 0, 100),
      priorityManagement: clamp(priorityManagement, 0, 100)
    };

    const weights = {
      completionRate: 0.25,
      onTimePerformance: 0.25,
      consistency: 0.2,
      efficiency: 0.15,
      priorityManagement: 0.15
    };

    const score = 
      components.completionRate * weights.completionRate +
      components.onTimePerformance * weights.onTimePerformance +
      components.consistency * weights.consistency +
      components.efficiency * weights.efficiency +
      components.priorityManagement * weights.priorityManagement;

    // Determine grade and interpretation
    const grade = score >= 90 ? 'A' :
      score >= 80 ? 'B' :
      score >= 70 ? 'C' :
      score >= 60 ? 'D' : 'F';

    const interpretations: Record<string, string> = {
      'A': 'Exceptional productivity! You are excelling at task management.',
      'B': 'Very good productivity. Keep up the great work!',
      'C': 'Good productivity with room for improvement.',
      'D': 'Fair productivity. Consider reviewing your task management approach.',
      'F': 'Productivity needs attention. Try breaking tasks into smaller steps.'
    };

    return {
      score: Math.round(score),
      components,
      grade,
      interpretation: interpretations[grade]
    };
  }

  /**
   * Forecast task completion for upcoming period
   */
  forecastTaskCompletion(
    tasks: Task[],
    pendingTasks: Task[],
    daysAhead: number = 7
  ): TaskForecast {
    const analysis = this.analyzeTaskCompletion(tasks);
    const { summary, trends, productivity } = analysis;

    // Predict completion rate based on recent trend
    const recentTrend = trends.weeklyTrend.slice(-3);
    const avgRecentRate = recentTrend.length > 0
      ? calculateMean(recentTrend.map(w => w.rate))
      : summary.completionRate;

    const trendFactor = trends.completionTrend === 'improving' ? 1.1 :
      trends.completionTrend === 'declining' ? 0.9 : 1;

    const predictedCompletionRate = clamp(avgRecentRate * trendFactor, 0, 100);

    // Calculate confidence based on data consistency
    const rateVariance = calculateStandardDeviation(
      trends.dailyCompletionRate.map(d => d.rate).filter(r => r > 0)
    );
    const confidence = clamp(1 - (rateVariance / 100), 0.3, 0.95);

    // Recommend daily task count based on historical velocity
    const avgDailyCompleted = summary.completedTasks / analysis.analysisPeriod.days;
    const recommendedDailyTasks = Math.max(1, Math.round(avgDailyCompleted * 1.2));

    // Identify at-risk tasks
    const riskTasks = pendingTasks
      .filter(t => {
        if (!t.dueDate) return false;
        const daysUntilDue = getDaysBetween(new Date(), t.dueDate);
        return daysUntilDue <= 2 && t.priority === 'high' || t.priority === 'urgent';
      })
      .map(t => t.id);

    // Generate suggestions
    const suggestions: string[] = [];

    if (summary.overdueRate > 15) {
      suggestions.push('Review and reschedule overdue tasks');
    }
    if ((byPriority.high?.completionRate || 100) < 70) {
      suggestions.push('Focus on completing high-priority tasks first');
    }
    if (timing.onTimeRate < 70) {
      suggestions.push('Set more realistic deadlines for future tasks');
    }
    if (productivity.consistencyScore < 60) {
      suggestions.push('Try to maintain a more consistent daily task completion rate');
    }

    return {
      predictedCompletionRate: Math.round(predictedCompletionRate),
      confidence: Math.round(confidence * 100) / 100,
      recommendedDailyTasks,
      riskTasks,
      suggestions
    };
  }

  /**
   * Get quick task statistics
   */
  getQuickStats(tasks: Task[]): {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  } {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(
      t => t.status !== 'completed' && t.dueDate && t.dueDate < new Date()
    ).length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTaskCompletionCalculator(
  config?: Partial<typeof DEFAULT_CONFIG>
): TaskCompletionCalculator {
  return new TaskCompletionCalculator(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default TaskCompletionCalculator;
