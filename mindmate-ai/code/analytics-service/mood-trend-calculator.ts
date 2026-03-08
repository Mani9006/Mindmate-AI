/**
 * MindMate AI - Mood Trend Calculator
 * Calculates rolling averages, trend detection, and volatility analysis for mood data
 */

import {
  MoodEntry,
  MoodLevel,
  TrendResult,
  RollingAverage,
  Emotion,
  EmotionCategory
} from './types';

import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateVariance,
  calculateRollingAverage,
  calculateExponentialMovingAverage,
  detectTrend,
  getStartOfDay,
  getDaysBetween,
  addDays,
  formatDateISO,
  groupBy,
  normalizeValue,
  clamp,
  detectTimePatterns,
  detectDayOfWeekPattern
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface MoodTrendAnalysis {
  userId: string;
  analysisPeriod: {
    start: Date;
    end: Date;
    days: number;
  };
  summary: {
    averageMood: number;
    medianMood: number;
    moodVolatility: number;
    totalEntries: number;
    entriesPerDay: number;
  };
  rollingAverages: {
    daily: RollingAverage;
    weekly: RollingAverage;
    exponential: RollingAverage;
  };
  trend: TrendResult;
  patterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    emotionFrequency: Record<string, number>;
    emotionCategories: Record<EmotionCategory, number>;
  };
  dailyBreakdown: DailyMoodSummary[];
  insights: MoodInsight[];
}

export interface DailyMoodSummary {
  date: string;
  averageMood: number;
  entryCount: number;
  dominantEmotions: string[];
  moodRange: { min: number; max: number };
  volatility: number;
}

export interface MoodInsight {
  type: 'positive' | 'negative' | 'neutral' | 'pattern' | 'alert';
  title: string;
  description: string;
  confidence: number;
  supportingData?: Record<string, unknown>;
}

export interface MoodComparison {
  currentPeriod: MoodPeriodStats;
  previousPeriod: MoodPeriodStats;
  change: {
    averageMood: number;
    volatility: number;
    entryCount: number;
  };
  significance: 'significant' | 'moderate' | 'minimal';
}

export interface MoodPeriodStats {
  averageMood: number;
  volatility: number;
  entryCount: number;
  dominantEmotions: string[];
  bestDay: { date: string; mood: number };
  worstDay: { date: string; mood: number };
}

export interface MoodPrediction {
  predictedMood: number;
  confidenceInterval: { lower: number; upper: number };
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  rollingWindow: {
    daily: 3,
    weekly: 7,
    emaAlpha: 0.3
  },
  volatilityThreshold: {
    low: 0.2,
    moderate: 0.4,
    high: 0.6
  },
  trendConfidenceThreshold: 0.3,
  minimumEntriesForAnalysis: 3,
  predictionHorizon: 7 // days
};

// ============================================================================
// Mood Trend Calculator Class
// ============================================================================

export class MoodTrendCalculator {
  private config: typeof DEFAULT_CONFIG;

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform comprehensive mood trend analysis
   */
  analyzeMoodTrends(
    entries: MoodEntry[],
    startDate?: Date,
    endDate?: Date
  ): MoodTrendAnalysis {
    const startTime = performance.now();
    
    if (entries.length < this.config.minimumEntriesForAnalysis) {
      throw new Error(
        `Insufficient data:至少需要 ${this.config.minimumEntriesForAnalysis} mood entries for analysis. Got ${entries.length}.`
      );
    }

    // Sort entries chronologically
    const sortedEntries = [...entries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Determine analysis period
    const periodStart = startDate || sortedEntries[0].timestamp;
    const periodEnd = endDate || sortedEntries[sortedEntries.length - 1].timestamp;
    const days = getDaysBetween(periodStart, periodEnd) + 1;

    // Calculate basic statistics
    const moodValues = sortedEntries.map(e => e.moodLevel);
    const averageMood = calculateMean(moodValues);
    const medianMood = calculateMedian(moodValues);
    const moodVolatility = this.calculateMoodVolatility(sortedEntries);

    // Calculate rolling averages
    const timestampedValues = sortedEntries.map(e => ({
      timestamp: e.timestamp,
      value: e.moodLevel
    }));

    const dailyRolling = calculateRollingAverage(
      timestampedValues, 
      this.config.rollingWindow.daily
    );
    const weeklyRolling = calculateRollingAverage(
      timestampedValues, 
      this.config.rollingWindow.weekly
    );
    const exponentialMA = calculateExponentialMovingAverage(
      timestampedValues, 
      this.config.rollingWindow.emaAlpha
    );

    // Detect trend
    const trend = detectTrend(timestampedValues, this.config.trendConfidenceThreshold);

    // Analyze patterns
    const patterns = this.analyzePatterns(sortedEntries);

    // Generate daily breakdown
    const dailyBreakdown = this.generateDailyBreakdown(sortedEntries);

    // Generate insights
    const insights = this.generateInsights(
      sortedEntries, 
      trend, 
      moodVolatility, 
      patterns
    );

    const analysis: MoodTrendAnalysis = {
      userId: entries[0]?.userId || '',
      analysisPeriod: { start: periodStart, end: periodEnd, days },
      summary: {
        averageMood,
        medianMood,
        moodVolatility,
        totalEntries: entries.length,
        entriesPerDay: entries.length / days
      },
      rollingAverages: {
        daily: dailyRolling,
        weekly: weeklyRolling,
        exponential: exponentialMA
      },
      trend,
      patterns,
      dailyBreakdown,
      insights
    };

    const duration = performance.now() - startTime;
    console.log(`[MoodTrendCalculator] Analysis completed in ${duration.toFixed(2)}ms`);

    return analysis;
  }

  /**
   * Calculate mood volatility (coefficient of variation)
   */
  calculateMoodVolatility(entries: MoodEntry[]): number {
    if (entries.length < 2) return 0;

    // Group by day
    const dailyGroups = groupBy(entries, e => formatDateISO(e.timestamp));
    const dailyAverages = Object.values(dailyGroups).map(dayEntries => 
      calculateMean(dayEntries.map(e => e.moodLevel))
    );

    const mean = calculateMean(dailyAverages);
    const stdDev = calculateStandardDeviation(dailyAverages);

    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Analyze mood patterns (time of day, day of week, emotions)
   */
  private analyzePatterns(entries: MoodEntry[]): MoodTrendAnalysis['patterns'] {
    // Time of day patterns
    const timeOfDay = detectTimePatterns(entries);

    // Day of week patterns
    const dayOfWeek = detectDayOfWeekPattern(entries);

    // Emotion frequency
    const allEmotions: Emotion[] = entries.flatMap(e => e.emotions || []);
    const emotionFrequency: Record<string, number> = {};
    allEmotions.forEach(emotion => {
      emotionFrequency[emotion.name] = (emotionFrequency[emotion.name] || 0) + 1;
    });

    // Normalize emotion frequencies
    const totalEmotions = allEmotions.length;
    if (totalEmotions > 0) {
      Object.keys(emotionFrequency).forEach(key => {
        emotionFrequency[key] = emotionFrequency[key] / totalEmotions;
      });
    }

    // Emotion categories
    const emotionCategories: Record<EmotionCategory, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      anxious: 0,
      energetic: 0,
      calm: 0
    };

    allEmotions.forEach(emotion => {
      emotionCategories[emotion.category] += emotion.intensity;
    });

    // Normalize categories
    const totalIntensity = Object.values(emotionCategories).reduce((a, b) => a + b, 0);
    if (totalIntensity > 0) {
      (Object.keys(emotionCategories) as EmotionCategory[]).forEach(cat => {
        emotionCategories[cat] = emotionCategories[cat] / totalIntensity;
      });
    }

    return {
      timeOfDay,
      dayOfWeek,
      emotionFrequency,
      emotionCategories
    };
  }

  /**
   * Generate daily mood summaries
   */
  private generateDailyBreakdown(entries: MoodEntry[]): DailyMoodSummary[] {
    const dailyGroups = groupBy(entries, e => formatDateISO(e.timestamp));

    return Object.entries(dailyGroups)
      .map(([date, dayEntries]) => {
        const moodValues = dayEntries.map(e => e.moodLevel);
        const emotions = dayEntries.flatMap(e => e.emotions || []);
        
        // Get dominant emotions
        const emotionCounts: Record<string, number> = {};
        emotions.forEach(e => {
          emotionCounts[e.name] = (emotionCounts[e.name] || 0) + e.intensity;
        });
        
        const sortedEmotions = Object.entries(emotionCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name);

        return {
          date,
          averageMood: calculateMean(moodValues),
          entryCount: dayEntries.length,
          dominantEmotions: sortedEmotions,
          moodRange: {
            min: Math.min(...moodValues),
            max: Math.max(...moodValues)
          },
          volatility: calculateStandardDeviation(moodValues)
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate insights from mood analysis
   */
  private generateInsights(
    entries: MoodEntry[],
    trend: TrendResult,
    volatility: number,
    patterns: MoodTrendAnalysis['patterns']
  ): MoodInsight[] {
    const insights: MoodInsight[] = [];

    // Trend insight
    if (trend.direction === 'improving' && trend.confidence > 0.4) {
      insights.push({
        type: 'positive',
        title: 'Mood Trending Upward',
        description: `Your mood has been improving over this period with a ${trend.changePercent.toFixed(1)}% positive change.`,
        confidence: trend.confidence,
        supportingData: { slope: trend.slope, changePercent: trend.changePercent }
      });
    } else if (trend.direction === 'declining' && trend.confidence > 0.4) {
      insights.push({
        type: 'alert',
        title: 'Mood Declining',
        description: `Your mood has shown a downward trend. Consider reaching out for support or reviewing your self-care routines.`,
        confidence: trend.confidence,
        supportingData: { slope: trend.slope, changePercent: trend.changePercent }
      });
    }

    // Volatility insight
    if (volatility > this.config.volatilityThreshold.high) {
      insights.push({
        type: 'pattern',
        title: 'High Mood Variability',
        description: 'Your mood has shown significant fluctuations. Tracking triggers may help identify patterns.',
        confidence: 0.8,
        supportingData: { volatility }
      });
    } else if (volatility < this.config.volatilityThreshold.low) {
      insights.push({
        type: 'positive',
        title: 'Stable Mood',
        description: 'Your mood has been relatively stable, indicating good emotional regulation.',
        confidence: 0.8,
        supportingData: { volatility }
      });
    }

    // Time of day pattern
    const peakTime = Object.entries(patterns.timeOfDay)
      .sort((a, b) => b[1] - a[1])[0];
    if (peakTime && peakTime[1] > 0.4) {
      insights.push({
        type: 'pattern',
        title: `Most Active During ${peakTime[0]}`,
        description: `You tend to log moods most frequently in the ${peakTime[0]}.`,
        confidence: peakTime[1],
        supportingData: { timeOfDay: patterns.timeOfDay }
      });
    }

    // Day of week pattern
    const bestDay = Object.entries(patterns.dayOfWeek)
      .sort((a, b) => b[1] - a[1])[0];
    if (bestDay && bestDay[1] > 0.2) {
      insights.push({
        type: 'pattern',
        title: `${bestDay[0]} is Your Most Active Day`,
        description: `You log moods most frequently on ${bestDay[0]}s.`,
        confidence: bestDay[1],
        supportingData: { dayOfWeek: patterns.dayOfWeek }
      });
    }

    // Emotion category insight
    const dominantCategory = Object.entries(patterns.emotionCategories)
      .sort((a, b) => b[1] - a[1])[0];
    if (dominantCategory && dominantCategory[1] > 0.3) {
      const categoryDescriptions: Record<EmotionCategory, string> = {
        positive: 'You have been experiencing many positive emotions.',
        negative: 'You have been experiencing challenging emotions. Consider self-care activities.',
        neutral: 'Your emotions have been relatively balanced.',
        anxious: 'Anxiety-related emotions have been prominent. Consider relaxation techniques.',
        energetic: 'You have been feeling energetic and active.',
        calm: 'You have been experiencing calm and peaceful emotions.'
      };

      insights.push({
        type: dominantCategory[0] === 'positive' || dominantCategory[0] === 'calm' 
          ? 'positive' 
          : dominantCategory[0] === 'negative' || dominantCategory[0] === 'anxious'
            ? 'alert'
            : 'neutral',
        title: `${dominantCategory[0].charAt(0).toUpperCase() + dominantCategory[0].slice(1)} Emotions Dominant`,
        description: categoryDescriptions[dominantCategory[0] as EmotionCategory],
        confidence: dominantCategory[1],
        supportingData: { emotionCategories: patterns.emotionCategories }
      });
    }

    return insights;
  }

  /**
   * Compare mood between two periods
   */
  comparePeriods(
    currentEntries: MoodEntry[],
    previousEntries: MoodEntry[]
  ): MoodComparison {
    const currentStats = this.calculatePeriodStats(currentEntries);
    const previousStats = this.calculatePeriodStats(previousEntries);

    const change = {
      averageMood: currentStats.averageMood - previousStats.averageMood,
      volatility: currentStats.volatility - previousStats.volatility,
      entryCount: currentStats.entryCount - previousStats.entryCount
    };

    // Determine significance
    let significance: 'significant' | 'moderate' | 'minimal' = 'minimal';
    const moodChangePercent = Math.abs(change.averageMood / previousStats.averageMood * 100);
    if (moodChangePercent > 20) {
      significance = 'significant';
    } else if (moodChangePercent > 10) {
      significance = 'moderate';
    }

    return {
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      change,
      significance
    };
  }

  /**
   * Calculate statistics for a period
   */
  private calculatePeriodStats(entries: MoodEntry[]): MoodPeriodStats {
    if (entries.length === 0) {
      return {
        averageMood: 0,
        volatility: 0,
        entryCount: 0,
        dominantEmotions: [],
        bestDay: { date: '', mood: 0 },
        worstDay: { date: '', mood: 5 }
      };
    }

    const moodValues = entries.map(e => e.moodLevel);
    const dailyGroups = groupBy(entries, e => formatDateISO(e.timestamp));
    
    const dailyAverages = Object.entries(dailyGroups).map(([date, dayEntries]) => ({
      date,
      mood: calculateMean(dayEntries.map(e => e.moodLevel))
    }));

    const emotions = entries.flatMap(e => e.emotions || []);
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e.name] = (emotionCounts[e.name] || 0) + 1;
    });

    const sortedDays = dailyAverages.sort((a, b) => a.mood - b.mood);

    return {
      averageMood: calculateMean(moodValues),
      volatility: this.calculateMoodVolatility(entries),
      entryCount: entries.length,
      dominantEmotions: Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name),
      bestDay: sortedDays[sortedDays.length - 1] || { date: '', mood: 0 },
      worstDay: sortedDays[0] || { date: '', mood: 5 }
    };
  }

  /**
   * Predict future mood based on historical patterns
   */
  predictMood(entries: MoodEntry[], daysAhead: number = 7): MoodPrediction[] {
    if (entries.length < 7) {
      throw new Error('至少需要 7 天的 mood entries for prediction');
    }

    const predictions: MoodPrediction[] = [];
    const sortedEntries = [...entries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Get recent trend
    const timestampedValues = sortedEntries.map(e => ({
      timestamp: e.timestamp,
      value: e.moodLevel
    }));
    const trend = detectTrend(timestampedValues);

    // Get day of week patterns
    const dayOfWeekPattern = detectDayOfWeekPattern(sortedEntries);
    const dailyGroups = groupBy(sortedEntries, e => formatDateISO(e.timestamp));
    const dailyAverages = Object.entries(dailyGroups).map(([date, dayEntries]) => ({
      date,
      average: calculateMean(dayEntries.map(e => e.moodLevel)),
      dayOfWeek: new Date(date).getDay()
    }));

    const lastDate = sortedEntries[sortedEntries.length - 1].timestamp;
    const recentAverage = calculateMean(
      sortedEntries.slice(-7).map(e => e.moodLevel)
    );

    for (let i = 1; i <= daysAhead; i++) {
      const predictionDate = addDays(lastDate, i);
      const dayOfWeek = predictionDate.getDay();
      
      // Base prediction on trend
      let predictedMood = recentAverage + (trend.slope * i);
      
      // Adjust for day of week pattern
      const dayAdjustment = (dayOfWeekPattern[['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]] - 0.14) * 2;
      predictedMood += dayAdjustment;

      // Clamp to valid range
      predictedMood = clamp(predictedMood, 1, 5);

      // Calculate confidence based on data quality
      const confidence = Math.min(0.9, 0.3 + (entries.length / 100) + (trend.confidence * 0.3));
      const margin = (1 - confidence) * 2;

      const factors: PredictionFactor[] = [
        {
          factor: 'Recent trend',
          impact: Math.abs(trend.slope) * 10,
          direction: trend.slope > 0 ? 'positive' : trend.slope < 0 ? 'negative' : 'neutral'
        },
        {
          factor: 'Day of week pattern',
          impact: Math.abs(dayAdjustment) * 10,
          direction: dayAdjustment > 0 ? 'positive' : dayAdjustment < 0 ? 'negative' : 'neutral'
        }
      ];

      predictions.push({
        predictedMood: Math.round(predictedMood * 10) / 10,
        confidenceInterval: {
          lower: Math.max(1, predictedMood - margin),
          upper: Math.min(5, predictedMood + margin)
        },
        confidence,
        factors
      });
    }

    return predictions;
  }

  /**
   * Get quick mood summary
   */
  getQuickSummary(entries: MoodEntry[]): {
    currentMood: number;
    trend: TrendDirection;
    streak: number;
    averageThisWeek: number;
  } {
    if (entries.length === 0) {
      return { currentMood: 0, trend: 'stable', streak: 0, averageThisWeek: 0 };
    }

    const sorted = [...entries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const currentMood = sorted[sorted.length - 1].moodLevel;
    
    const timestampedValues = sorted.map(e => ({
      timestamp: e.timestamp,
      value: e.moodLevel
    }));
    const trend = detectTrend(timestampedValues);

    // Calculate streak (consecutive days with entries)
    const dailyGroups = groupBy(sorted, e => formatDateISO(e.timestamp));
    const dates = Object.keys(dailyGroups).sort();
    let streak = 0;
    const today = formatDateISO(new Date());
    
    for (let i = dates.length - 1; i >= 0; i--) {
      const expectedDate = formatDateISO(addDays(new Date(today), -(dates.length - 1 - i)));
      if (dates[i] === expectedDate || (i === dates.length - 1 && dates[i] === today)) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate this week's average
    const oneWeekAgo = addDays(new Date(), -7);
    const thisWeekEntries = sorted.filter(e => e.timestamp >= oneWeekAgo);
    const averageThisWeek = thisWeekEntries.length > 0
      ? calculateMean(thisWeekEntries.map(e => e.moodLevel))
      : currentMood;

    return {
      currentMood,
      trend: trend.direction,
      streak,
      averageThisWeek
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMoodTrendCalculator(
  config?: Partial<typeof DEFAULT_CONFIG>
): MoodTrendCalculator {
  return new MoodTrendCalculator(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default MoodTrendCalculator;
