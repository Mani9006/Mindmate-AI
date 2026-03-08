/**
 * MindMate AI - Emotional Trigger Pattern Detector
 * Detects patterns in emotional triggers, correlations with mood, and risk factors
 */

import {
  TriggerEvent,
  TriggerType,
  TriggerPattern,
  TimePattern,
  MoodEntry
} from './types';

import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculateCorrelation,
  getStartOfDay,
  getDaysBetween,
  addDays,
  formatDateISO,
  groupBy,
  countBy,
  mostFrequent,
  normalizeValue,
  clamp,
  detectTimePatterns,
  detectDayOfWeekPattern,
  getTimeOfDay
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface TriggerPatternAnalysis {
  userId: string;
  analysisPeriod: {
    start: Date;
    end: Date;
    days: number;
  };
  summary: {
    totalTriggers: number;
    uniqueTriggerTypes: number;
    averageSeverity: number;
    averageMoodImpact: number;
    resolutionRate: number;
    mostCommonTrigger: TriggerType;
    mostSevereTrigger: TriggerType;
  };
  patterns: TriggerPattern[];
  correlations: TriggerMoodCorrelation[];
  riskFactors: RiskFactor[];
  timeAnalysis: {
    timeOfDay: TimePattern;
    dayOfWeek: Record<string, number>;
    seasonalPattern: boolean;
  };
  copingAnalysis: {
    mostUsedStrategies: string[];
    mostEffectiveStrategies: string[];
    strategyEffectiveness: Record<string, number>;
  };
  insights: TriggerInsight[];
}

export interface TriggerMoodCorrelation {
  triggerType: TriggerType;
  correlationStrength: number; // -1 to 1
  confidence: number;
  sampleSize: number;
  description: string;
}

export interface RiskFactor {
  factor: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  frequency: number;
  averageImpact: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface TriggerInsight {
  type: 'pattern' | 'risk' | 'positive' | 'suggestion';
  title: string;
  description: string;
  confidence: number;
  relatedTriggers?: TriggerType[];
  actionItems?: string[];
}

export interface TriggerPrediction {
  predictedTriggers: PredictedTrigger[];
  riskWindow: {
    start: Date;
    end: Date;
  };
  confidence: number;
  preventiveMeasures: string[];
}

export interface PredictedTrigger {
  triggerType: TriggerType;
  probability: number;
  estimatedSeverity: number;
  context: string;
  warningSigns: string[];
}

export interface TriggerIntervention {
  triggerType: TriggerType;
  interventions: Intervention[];
  effectiveness: number;
}

export interface Intervention {
  name: string;
  description: string;
  type: 'immediate' | 'short_term' | 'long_term';
  difficulty: 'easy' | 'moderate' | 'challenging';
  estimatedEffectiveness: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG = {
  minimumTriggersForAnalysis: 5,
  correlationThreshold: 0.3,
  highRiskThreshold: 0.7,
  moderateRiskThreshold: 0.4,
  patternConfidenceThreshold: 0.5,
  timeWindowDays: 30
};

// Trigger type descriptions and typical contexts
const TRIGGER_TYPE_INFO: Record<TriggerType, { description: string; typicalContexts: string[] }> = {
  social: {
    description: 'Interactions with others, social situations, relationship issues',
    typicalContexts: ['conflict', 'rejection', 'social gathering', 'communication breakdown']
  },
  work: {
    description: 'Job-related stress, deadlines, performance pressure',
    typicalContexts: ['deadline', 'criticism', 'workload', 'meeting', 'presentation']
  },
  family: {
    description: 'Family dynamics, household issues, parenting',
    typicalContexts: ['argument', 'expectations', 'responsibilities', 'visits']
  },
  health: {
    description: 'Physical or mental health concerns',
    typicalContexts: ['illness', 'pain', 'fatigue', 'medication', 'appointment']
  },
  financial: {
    description: 'Money-related stress, expenses, income',
    typicalContexts: ['bill', 'expense', 'debt', 'unexpected cost', 'budget']
  },
  environmental: {
    description: 'External environment factors',
    typicalContexts: ['weather', 'noise', 'clutter', ' commute', 'location']
  },
  internal: {
    description: 'Internal thoughts, self-criticism, memories',
    typicalContexts: ['rumination', 'self-doubt', 'memory', 'perfectionism']
  },
  unknown: {
    description: 'Unclear or unidentified trigger',
    typicalContexts: ['unexplained', 'sudden', 'unclear cause']
  }
};

// ============================================================================
// Trigger Pattern Detector Class
// ============================================================================

export class TriggerPatternDetector {
  private config: typeof DEFAULT_CONFIG;

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform comprehensive trigger pattern analysis
   */
  analyzeTriggerPatterns(
    triggers: TriggerEvent[],
    moodEntries?: MoodEntry[],
    startDate?: Date,
    endDate?: Date
  ): TriggerPatternAnalysis {
    const startTime = performance.now();

    if (triggers.length < this.config.minimumTriggersForAnalysis) {
      throw new Error(
        `至少需要 ${this.config.minimumTriggersForAnalysis} triggers for analysis. Got ${triggers.length}.`
      );
    }

    // Sort triggers chronologically
    const sortedTriggers = [...triggers].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Determine analysis period
    const periodStart = startDate || sortedTriggers[0].timestamp;
    const periodEnd = endDate || sortedTriggers[sortedTriggers.length - 1].timestamp;
    const days = getDaysBetween(periodStart, periodEnd) + 1;

    // Calculate summary statistics
    const summary = this.calculateSummary(sortedTriggers);

    // Analyze patterns by trigger type
    const patterns = this.analyzePatterns(sortedTriggers);

    // Calculate correlations with mood if available
    const correlations = moodEntries 
      ? this.calculateCorrelations(sortedTriggers, moodEntries)
      : [];

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(sortedTriggers, patterns);

    // Analyze time patterns
    const timeAnalysis = this.analyzeTimePatterns(sortedTriggers);

    // Analyze coping strategies
    const copingAnalysis = this.analyzeCopingStrategies(sortedTriggers);

    // Generate insights
    const insights = this.generateInsights(
      summary,
      patterns,
      correlations,
      riskFactors,
      copingAnalysis
    );

    const analysis: TriggerPatternAnalysis = {
      userId: triggers[0]?.userId || '',
      analysisPeriod: { start: periodStart, end: periodEnd, days },
      summary,
      patterns,
      correlations,
      riskFactors,
      timeAnalysis,
      copingAnalysis,
      insights
    };

    const duration = performance.now() - startTime;
    console.log(`[TriggerPatternDetector] Analysis completed in ${duration.toFixed(2)}ms`);

    return analysis;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(triggers: TriggerEvent[]) {
    const totalTriggers = triggers.length;
    const triggerTypes = new Set(triggers.map(t => t.triggerType));
    
    const severities = triggers.map(t => t.severity);
    const moodImpacts = triggers.map(t => t.moodImpact);
    
    const resolvedTriggers = triggers.filter(t => t.resolvedAt);
    
    // Find most common trigger type
    const typeCounts = countBy(triggers, t => t.triggerType);
    const mostCommonTrigger = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TriggerType || 'unknown';
    
    // Find most severe trigger type (by average severity)
    const severityByType = groupBy(triggers, t => t.triggerType);
    const avgSeverityByType = Object.entries(severityByType).map(([type, typeTriggers]) => ({
      type: type as TriggerType,
      avgSeverity: calculateMean(typeTriggers.map(t => t.severity))
    }));
    const mostSevereTrigger = avgSeverityByType
      .sort((a, b) => b.avgSeverity - a.avgSeverity)[0]?.type || 'unknown';

    return {
      totalTriggers,
      uniqueTriggerTypes: triggerTypes.size,
      averageSeverity: calculateMean(severities),
      averageMoodImpact: calculateMean(moodImpacts),
      resolutionRate: totalTriggers > 0 ? (resolvedTriggers.length / totalTriggers) * 100 : 0,
      mostCommonTrigger,
      mostSevereTrigger
    };
  }

  /**
   * Analyze patterns for each trigger type
   */
  private analyzePatterns(triggers: TriggerEvent[]): TriggerPattern[] {
    const triggersByType = groupBy(triggers, t => t.triggerType);
    const patterns: TriggerPattern[] = [];

    for (const [type, typeTriggers] of Object.entries(triggersByType)) {
      const severities = typeTriggers.map(t => t.severity);
      const moodImpacts = typeTriggers.map(t => t.moodImpact);
      
      // Extract common contexts
      const contextWords = typeTriggers
        .flatMap(t => (t.context || '').toLowerCase().split(/\s+/))
        .filter(w => w.length > 3);
      
      const contextCounts: Record<string, number> = {};
      contextWords.forEach(word => {
        contextCounts[word] = (contextCounts[word] || 0) + 1;
      });
      
      const commonContexts = Object.entries(contextCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

      // Time patterns
      const timeOfDayPattern = detectTimePatterns(typeTriggers);
      const dayOfWeekPattern = detectDayOfWeekPattern(typeTriggers);

      patterns.push({
        triggerType: type as TriggerType,
        frequency: typeTriggers.length,
        averageSeverity: calculateMean(severities),
        averageMoodImpact: calculateMean(moodImpacts),
        commonContexts,
        timeOfDayPattern,
        dayOfWeekPattern,
        correlationWithMood: Math.abs(calculateMean(moodImpacts)) / 5
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate correlations between triggers and mood
   */
  private calculateCorrelations(
    triggers: TriggerEvent[],
    moodEntries: MoodEntry[]
  ): TriggerMoodCorrelation[] {
    const correlations: TriggerMoodCorrelation[] = [];
    
    // Group mood entries by day
    const moodByDay = groupBy(moodEntries, m => formatDateISO(m.timestamp));
    const dailyMood: Record<string, number> = {};
    
    Object.entries(moodByDay).forEach(([date, entries]) => {
      dailyMood[date] = calculateMean(entries.map(e => e.moodLevel));
    });

    // Group triggers by day
    const triggersByType = groupBy(triggers, t => t.triggerType);

    for (const [type, typeTriggers] of Object.entries(triggersByType)) {
      // Create aligned arrays for correlation
      const triggerDays = typeTriggers.map(t => formatDateISO(t.timestamp));
      const triggerCounts: Record<string, number> = {};
      triggerDays.forEach(day => {
        triggerCounts[day] = (triggerCounts[day] || 0) + 1;
      });

      // Get all unique days
      const allDays = new Set([...Object.keys(dailyMood), ...Object.keys(triggerCounts)]);
      
      const moodValues: number[] = [];
      const triggerValues: number[] = [];

      allDays.forEach(day => {
        if (dailyMood[day] !== undefined) {
          moodValues.push(dailyMood[day]);
          triggerValues.push(triggerCounts[day] || 0);
        }
      });

      if (moodValues.length >= 5) {
        const correlation = calculateCorrelation(moodValues, triggerValues);
        
        // Determine description based on correlation
        let description: string;
        const absCorr = Math.abs(correlation);
        
        if (absCorr < 0.3) {
          description = `Weak correlation with mood changes`;
        } else if (absCorr < 0.5) {
          description = correlation < 0 
            ? `Moderate negative correlation - this trigger tends to coincide with lower mood`
            : `Moderate positive correlation - this trigger may have less negative impact than expected`;
        } else {
          description = correlation < 0
            ? `Strong negative correlation - this trigger significantly impacts your mood`
            : `Strong positive correlation - unusual pattern detected`;
        }

        correlations.push({
          triggerType: type as TriggerType,
          correlationStrength: correlation,
          confidence: Math.min(1, moodValues.length / 30),
          sampleSize: moodValues.length,
          description
        });
      }
    }

    return correlations.sort((a, b) => 
      Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength)
    );
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    triggers: TriggerEvent[],
    patterns: TriggerPattern[]
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    const days = getDaysBetween(triggers[0].timestamp, triggers[triggers.length - 1].timestamp) + 1;

    for (const pattern of patterns) {
      // Calculate frequency rate (triggers per week)
      const frequencyRate = (pattern.frequency / days) * 7;
      
      // Determine risk level
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
      const riskScore = (frequencyRate / 5) * (pattern.averageSeverity / 10) * (Math.abs(pattern.averageMoodImpact) / 5);
      
      if (riskScore >= this.config.highRiskThreshold) {
        riskLevel = 'critical';
      } else if (riskScore >= this.config.moderateRiskThreshold) {
        riskLevel = 'high';
      } else if (riskScore >= 0.2) {
        riskLevel = 'moderate';
      } else {
        riskLevel = 'low';
      }

      // Determine trend
      const triggersByWeek = groupBy(
        triggers.filter(t => t.triggerType === pattern.triggerType),
        t => {
          const date = new Date(t.timestamp);
          return `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        }
      );
      
      const weeklyCounts = Object.values(triggersByWeek).map(t => t.length);
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (weeklyCounts.length >= 3) {
        const recent = weeklyCounts.slice(-3);
        const avgRecent = calculateMean(recent);
        const avgEarlier = calculateMean(weeklyCounts.slice(0, -3));
        
        if (avgRecent > avgEarlier * 1.3) trend = 'increasing';
        else if (avgRecent < avgEarlier * 0.7) trend = 'decreasing';
      }

      // Generate recommendation
      const recommendations: Record<TriggerType, string> = {
        social: 'Consider practicing assertive communication and setting boundaries.',
        work: 'Explore stress management techniques and time management strategies.',
        family: 'Family therapy or open communication sessions may help.',
        health: 'Consult with healthcare providers and maintain self-care routines.',
        financial: 'Create a budget plan and consider financial counseling.',
        environmental: 'Make environmental changes or develop coping strategies.',
        internal: 'Practice mindfulness and cognitive reframing techniques.',
        unknown: 'Keep a detailed journal to identify patterns and triggers.'
      };

      riskFactors.push({
        factor: `${pattern.triggerType} triggers`,
        riskLevel,
        frequency: frequencyRate,
        averageImpact: Math.abs(pattern.averageMoodImpact),
        trend,
        recommendation: recommendations[pattern.triggerType]
      });
    }

    return riskFactors.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  }

  /**
   * Analyze time-based patterns
   */
  private analyzeTimePatterns(triggers: TriggerEvent[]) {
    const timeOfDay = detectTimePatterns(triggers);
    const dayOfWeek = detectDayOfWeekPattern(triggers);

    // Check for seasonal pattern (would need more data)
    const monthlyGroups = groupBy(triggers, t => 
      `${t.timestamp.getFullYear()}-${t.timestamp.getMonth()}`
    );
    const monthlyCounts = Object.values(monthlyGroups).map(t => t.length);
    const seasonalVariance = calculateStandardDeviation(monthlyCounts);
    const seasonalPattern = seasonalVariance > calculateMean(monthlyCounts) * 0.3;

    return {
      timeOfDay,
      dayOfWeek,
      seasonalPattern
    };
  }

  /**
   * Analyze coping strategies effectiveness
   */
  private analyzeCopingStrategies(triggers: TriggerEvent[]) {
    const triggersWithStrategies = triggers.filter(
      t => t.copingStrategiesUsed && t.copingStrategiesUsed.length > 0
    );

    if (triggersWithStrategies.length === 0) {
      return {
        mostUsedStrategies: [],
        mostEffectiveStrategies: [],
        strategyEffectiveness: {}
      };
    }

    // Count strategy usage
    const strategyCounts: Record<string, number> = {};
    triggersWithStrategies.forEach(t => {
      t.copingStrategiesUsed?.forEach(strategy => {
        strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
      });
    });

    const mostUsedStrategies = Object.entries(strategyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);

    // Calculate effectiveness (based on resolution rate and mood impact)
    const strategyEffectiveness: Record<string, number> = {};
    
    Object.keys(strategyCounts).forEach(strategy => {
      const triggersWithStrategy = triggersWithStrategies.filter(t =>
        t.copingStrategiesUsed?.includes(strategy)
      );
      
      const resolvedCount = triggersWithStrategy.filter(t => t.resolvedAt).length;
      const avgMoodImpact = calculateMean(triggersWithStrategy.map(t => t.moodImpact));
      
      // Higher resolution rate and less negative mood impact = more effective
      const resolutionRate = triggersWithStrategy.length > 0 
        ? resolvedCount / triggersWithStrategy.length 
        : 0;
      
      strategyEffectiveness[strategy] = (resolutionRate * 0.6 + (1 - Math.abs(avgMoodImpact) / 5) * 0.4) * 100;
    });

    const mostEffectiveStrategies = Object.entries(strategyEffectiveness)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy]) => strategy);

    return {
      mostUsedStrategies,
      mostEffectiveStrategies,
      strategyEffectiveness
    };
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(
    summary: TriggerPatternAnalysis['summary'],
    patterns: TriggerPattern[],
    correlations: TriggerMoodCorrelation[],
    riskFactors: RiskFactor[],
    copingAnalysis: TriggerPatternAnalysis['copingAnalysis']
  ): TriggerInsight[] {
    const insights: TriggerInsight[] = [];

    // High frequency trigger insight
    const topPattern = patterns[0];
    if (topPattern && topPattern.frequency > 3) {
      insights.push({
        type: 'pattern',
        title: `Frequent ${topPattern.triggerType} Triggers`,
        description: `${topPattern.triggerType} triggers occur most frequently (${topPattern.frequency} times). Common contexts: ${topPattern.commonContexts.slice(0, 3).join(', ')}.`,
        confidence: 0.85,
        relatedTriggers: [topPattern.triggerType],
        actionItems: TRIGGER_TYPE_INFO[topPattern.triggerType].typicalContexts.map(c => 
          `Prepare for ${c} situations`
        )
      });
    }

    // Strong correlation insight
    const strongCorrelation = correlations.find(c => Math.abs(c.correlationStrength) > 0.5);
    if (strongCorrelation) {
      insights.push({
        type: 'risk',
        title: `Strong Mood Impact from ${strongCorrelation.triggerType} Triggers`,
        description: strongCorrelation.description,
        confidence: strongCorrelation.confidence,
        relatedTriggers: [strongCorrelation.triggerType],
        actionItems: [
          'Track trigger occurrences more closely',
          'Develop preemptive coping strategies',
          'Consider professional support'
        ]
      });
    }

    // High risk factor insight
    const highRisk = riskFactors.find(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    if (highRisk) {
      insights.push({
        type: 'risk',
        title: `High Risk: ${highRisk.factor}`,
        description: `${highRisk.factor} show ${highRisk.trend} frequency with significant mood impact. ${highRisk.recommendation}`,
        confidence: 0.8,
        actionItems: [
          highRisk.recommendation,
          'Monitor frequency weekly',
          'Practice stress reduction techniques'
        ]
      });
    }

    // Time pattern insight
    const peakTime = Object.entries(patterns[0]?.timeOfDayPattern || {})
      .sort((a, b) => b[1] - a[1])[0];
    if (peakTime && peakTime[1] > 0.4) {
      insights.push({
        type: 'pattern',
        title: `Triggers Peak in the ${peakTime[0]}`,
        description: `Your triggers are most likely to occur during ${peakTime[0]} hours.`,
        confidence: peakTime[1],
        actionItems: [
          `Prepare coping strategies for ${peakTime[0]}`,
          'Schedule supportive activities during this time'
        ]
      });
    }

    // Coping strategy insight
    if (copingAnalysis.mostEffectiveStrategies.length > 0) {
      insights.push({
        type: 'positive',
        title: 'Effective Coping Strategies Identified',
        description: `Your most effective strategies are: ${copingAnalysis.mostEffectiveStrategies.slice(0, 3).join(', ')}.`,
        confidence: 0.75,
        actionItems: [
          'Continue using these strategies',
          'Share what works with your support system'
        ]
      });
    } else if (triggers.length > 5) {
      insights.push({
        type: 'suggestion',
        title: 'Try Recording Coping Strategies',
        description: 'Recording which strategies you use can help identify what works best for you.',
        confidence: 0.7,
        actionItems: [
          'Note coping strategies when logging triggers',
          'Track which strategies lead to faster resolution'
        ]
      });
    }

    // Resolution rate insight
    if (summary.resolutionRate < 50) {
      insights.push({
        type: 'suggestion',
        title: 'Low Trigger Resolution Rate',
        description: `Only ${summary.resolutionRate.toFixed(0)}% of triggers are being marked as resolved. Consider using coping strategies or seeking support.`,
        confidence: 0.8,
        actionItems: [
          'Practice active coping strategies',
          'Reach out to your support network',
          'Consider professional guidance'
        ]
      });
    }

    return insights;
  }

  /**
   * Predict potential triggers for upcoming period
   */
  predictTriggers(
    triggers: TriggerEvent[],
    daysAhead: number = 7
  ): TriggerPrediction {
    const patterns = this.analyzePatterns(triggers);
    const timeAnalysis = this.analyzeTimePatterns(triggers);
    
    const predictedTriggers: PredictedTrigger[] = [];
    const today = new Date();

    for (const pattern of patterns.slice(0, 3)) {
      // Calculate probability based on frequency
      const days = getDaysBetween(triggers[0].timestamp, triggers[triggers.length - 1].timestamp) + 1;
      const weeklyFrequency = (pattern.frequency / days) * 7;
      const probability = Math.min(100, weeklyFrequency * (daysAhead / 7) * 100);

      if (probability > 20) {
        // Find peak time for this trigger type
        const peakTime = Object.entries(pattern.timeOfDayPattern || {})
          .sort((a, b) => b[1] - a[1])[0];

        predictedTriggers.push({
          triggerType: pattern.triggerType,
          probability: Math.round(probability),
          estimatedSeverity: Math.round(pattern.averageSeverity),
          context: `Likely during ${peakTime?.[0] || 'any time'}`,
          warningSigns: TRIGGER_TYPE_INFO[pattern.triggerType].typicalContexts.slice(0, 3)
        });
      }
    }

    // Generate preventive measures
    const preventiveMeasures: string[] = [];
    predictedTriggers.forEach(pt => {
      const info = TRIGGER_TYPE_INFO[pt.triggerType];
      preventiveMeasures.push(
        `Prepare for ${pt.triggerType} triggers: ${info.description}`,
        `Watch for warning signs: ${pt.warningSigns.join(', ')}`
      );
    });

    return {
      predictedTriggers: predictedTriggers.sort((a, b) => b.probability - a.probability),
      riskWindow: {
        start: today,
        end: addDays(today, daysAhead)
      },
      confidence: predictedTriggers.length > 0 
        ? calculateMean(predictedTriggers.map(pt => pt.probability)) / 100 
        : 0.5,
      preventiveMeasures
    };
  }

  /**
   * Get recommended interventions for a trigger type
   */
  getRecommendedInterventions(triggerType: TriggerType): TriggerIntervention {
    const interventions: Record<TriggerType, Intervention[]> = {
      social: [
        { name: 'Deep Breathing', description: 'Take 5 deep breaths before responding', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 70 },
        { name: 'Assertive Communication', description: 'Use "I" statements to express feelings', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 80 },
        { name: 'Boundary Setting', description: 'Establish and communicate personal boundaries', type: 'long_term', difficulty: 'challenging', estimatedEffectiveness: 85 }
      ],
      work: [
        { name: '5-Minute Break', description: 'Step away and reset', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 65 },
        { name: 'Priority Matrix', description: 'Organize tasks by urgency and importance', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 75 },
        { name: 'Time Blocking', description: 'Schedule focused work periods', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 80 }
      ],
      family: [
        { name: 'Active Listening', description: 'Focus on understanding before responding', type: 'immediate', difficulty: 'moderate', estimatedEffectiveness: 75 },
        { name: 'Family Meeting', description: 'Schedule regular family check-ins', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 70 },
        { name: 'Family Therapy', description: 'Professional family counseling', type: 'long_term', difficulty: 'challenging', estimatedEffectiveness: 85 }
      ],
      health: [
        { name: 'Grounding Exercise', description: '5-4-3-2-1 sensory grounding', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 75 },
        { name: 'Self-Care Routine', description: 'Establish daily self-care practices', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 80 },
        { name: 'Medical Consultation', description: 'Regular check-ups with healthcare providers', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 85 }
      ],
      financial: [
        { name: 'Expense Tracking', description: 'Log all expenses for one week', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 70 },
        { name: 'Budget Planning', description: 'Create a monthly budget', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 80 },
        { name: 'Financial Counseling', description: 'Professional financial advice', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 85 }
      ],
      environmental: [
        { name: 'Environment Change', description: 'Move to a different space', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 70 },
        { name: 'Decluttering', description: 'Organize and clean your space', type: 'short_term', difficulty: 'moderate', estimatedEffectiveness: 75 },
        { name: 'Environmental Design', description: 'Create a calming environment', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 80 }
      ],
      internal: [
        { name: 'Thought Stopping', description: 'Say "stop" and redirect thoughts', type: 'immediate', difficulty: 'moderate', estimatedEffectiveness: 70 },
        { name: 'Cognitive Reframing', description: 'Challenge negative thoughts', type: 'short_term', difficulty: 'challenging', estimatedEffectiveness: 80 },
        { name: 'Mindfulness Practice', description: 'Regular meditation or mindfulness', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 85 }
      ],
      unknown: [
        { name: 'Journaling', description: 'Write about what you\'re experiencing', type: 'immediate', difficulty: 'easy', estimatedEffectiveness: 65 },
        { name: 'Pattern Tracking', description: 'Log details to identify patterns', type: 'short_term', difficulty: 'easy', estimatedEffectiveness: 75 },
        { name: 'Professional Assessment', description: 'Consult with a mental health professional', type: 'long_term', difficulty: 'moderate', estimatedEffectiveness: 85 }
      ]
    };

    const interventionList = interventions[triggerType];
    const avgEffectiveness = calculateMean(interventionList.map(i => i.estimatedEffectiveness));

    return {
      triggerType,
      interventions: interventionList,
      effectiveness: avgEffectiveness
    };
  }

  /**
   * Get quick trigger statistics
   */
  getQuickStats(triggers: TriggerEvent[]): {
    total: number;
    thisWeek: number;
    unresolved: number;
    topType: TriggerType;
    averageSeverity: number;
  } {
    const total = triggers.length;
    
    const oneWeekAgo = addDays(new Date(), -7);
    const thisWeek = triggers.filter(t => t.timestamp >= oneWeekAgo).length;
    
    const unresolved = triggers.filter(t => !t.resolvedAt).length;
    
    const typeCounts = countBy(triggers, t => t.triggerType);
    const topType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TriggerType || 'unknown';
    
    const averageSeverity = calculateMean(triggers.map(t => t.severity));

    return {
      total,
      thisWeek,
      unresolved,
      topType,
      averageSeverity: Math.round(averageSeverity * 10) / 10
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTriggerPatternDetector(
  config?: Partial<typeof DEFAULT_CONFIG>
): TriggerPatternDetector {
  return new TriggerPatternDetector(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default TriggerPatternDetector;
