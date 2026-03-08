/**
 * MindMate AI - Milestone Detector and Celebrator
 * Detects achievements, milestones, and generates celebration events
 */

import {
  Milestone,
  MilestoneType,
  MilestoneCriteria,
  MilestoneReward,
  CelebrationType,
  CelebrationEvent,
  MilestoneCheckResult,
  MoodEntry,
  Task,
  TriggerEvent,
  ProgressScore
} from './types';

import {
  calculateMean,
  getDaysBetween,
  addDays,
  formatDateISO,
  groupBy,
  clamp
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface MilestoneConfig {
  enabledTypes: MilestoneType[];
  celebrationIntensity: 'subtle' | 'normal' | 'enthusiastic';
  autoShare: boolean;
  customMilestones?: CustomMilestoneDefinition[];
}

export interface CustomMilestoneDefinition {
  id: string;
  name: string;
  description: string;
  criteria: MilestoneCriteria;
  reward: MilestoneReward;
}

export interface MilestoneDetectionInput {
  userId: string;
  moodEntries: MoodEntry[];
  tasks: Task[];
  triggers: TriggerEvent[];
  progressScores: ProgressScore[];
  existingMilestones: Milestone[];
  checkDate?: Date;
}

export interface MilestoneStatistics {
  totalMilestones: number;
  byType: Record<MilestoneType, number>;
  recentAchievements: Milestone[];
  upcomingMilestones: UpcomingMilestone[];
  celebrationCount: number;
}

export interface UpcomingMilestone {
  type: MilestoneType;
  name: string;
  description: string;
  progress: number; // 0-100
  estimatedDaysToAchieve: number;
  criteria: MilestoneCriteria;
}

export interface CelebrationPreferences {
  enableAnimations: boolean;
  enableSounds: boolean;
  shareToSocial: boolean;
  privacyLevel: 'private' | 'friends' | 'public';
}

// ============================================================================
// Default Milestone Definitions
// ============================================================================

const DEFAULT_MILESTONES: Record<MilestoneType, CustomMilestoneDefinition[]> = {
  streak: [
    {
      id: 'streak-3',
      name: '3-Day Streak',
      description: 'Logged activity for 3 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 3 },
      reward: {
        badgeName: 'Getting Started',
        message: 'Great start! You\'re building a healthy habit.',
        celebrationType: 'simple'
      }
    },
    {
      id: 'streak-7',
      name: 'Week Warrior',
      description: 'Logged activity for 7 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 7 },
      reward: {
        badgeName: 'Week Warrior',
        message: 'A full week of consistency! You\'re on fire!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'streak-14',
      name: 'Two-Week Titan',
      description: 'Logged activity for 14 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 14 },
      reward: {
        badgeName: 'Two-Week Titan',
        message: 'Two weeks strong! Your dedication is inspiring!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'streak-30',
      name: 'Monthly Master',
      description: 'Logged activity for 30 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 30 },
      reward: {
        badgeName: 'Monthly Master',
        message: 'A whole month! You\'ve built an incredible habit!',
        celebrationType: 'major'
      }
    },
    {
      id: 'streak-60',
      name: 'Consistency Champion',
      description: 'Logged activity for 60 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 60 },
      reward: {
        badgeName: 'Consistency Champion',
        message: '60 days of dedication! You\'re unstoppable!',
        celebrationType: 'major'
      }
    },
    {
      id: 'streak-100',
      name: 'Century Club',
      description: 'Logged activity for 100 consecutive days',
      criteria: { metric: 'consecutiveDays', threshold: 100 },
      reward: {
        badgeName: 'Century Club',
        message: '100 DAYS! This is truly extraordinary! You\'re a wellness legend!',
        celebrationType: 'epic'
      }
    }
  ],
  improvement: [
    {
      id: 'improvement-mood-10',
      name: 'Mood Booster',
      description: 'Improved average mood by 10%',
      criteria: { metric: 'moodImprovement', threshold: 10 },
      reward: {
        badgeName: 'Mood Booster',
        message: 'Your mood is on the rise! Keep that positive energy flowing!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'improvement-mood-25',
      name: 'Mood Elevator',
      description: 'Improved average mood by 25%',
      criteria: { metric: 'moodImprovement', threshold: 25 },
      reward: {
        badgeName: 'Mood Elevator',
        message: 'What a transformation! Your mood has significantly improved!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'improvement-score-10',
      name: 'Progress Pioneer',
      description: 'Increased wellness score by 10 points',
      criteria: { metric: 'scoreImprovement', threshold: 10 },
      reward: {
        badgeName: 'Progress Pioneer',
        message: 'Your wellness journey is gaining momentum!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'improvement-score-25',
      name: 'Wellness Warrior',
      description: 'Increased wellness score by 25 points',
      criteria: { metric: 'scoreImprovement', threshold: 25 },
      reward: {
        badgeName: 'Wellness Warrior',
        message: 'Incredible progress! You\'re becoming a wellness warrior!',
        celebrationType: 'major'
      }
    }
  ],
  consistency: [
    {
      id: 'consistency-50',
      name: 'Halfway There',
      description: 'Maintained 50% consistency over 30 days',
      criteria: { metric: 'consistencyRate', threshold: 50, timeWindow: 30 },
      reward: {
        badgeName: 'Halfway There',
        message: 'You\'re building solid consistency!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'consistency-75',
      name: 'Consistency Star',
      description: 'Maintained 75% consistency over 30 days',
      criteria: { metric: 'consistencyRate', threshold: 75, timeWindow: 30 },
      reward: {
        badgeName: 'Consistency Star',
        message: 'Amazing consistency! You\'re a star!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'consistency-90',
      name: 'Consistency King/Queen',
      description: 'Maintained 90% consistency over 30 days',
      criteria: { metric: 'consistencyRate', threshold: 90, timeWindow: 30 },
      reward: {
        badgeName: 'Consistency Royalty',
        message: 'Royal-level consistency! You\'re absolutely crushing it!',
        celebrationType: 'major'
      }
    }
  ],
  awareness: [
    {
      id: 'awareness-10-emotions',
      name: 'Emotion Explorer',
      description: 'Logged 10 different emotions',
      criteria: { metric: 'uniqueEmotions', threshold: 10 },
      reward: {
        badgeName: 'Emotion Explorer',
        message: 'You\'re becoming more aware of your emotional landscape!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'awareness-50-entries',
      name: 'Mindful Tracker',
      description: 'Logged 50 mood entries',
      criteria: { metric: 'totalMoodEntries', threshold: 50 },
      reward: {
        badgeName: 'Mindful Tracker',
        message: '50 entries of self-reflection! Your awareness is growing!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'awareness-100-entries',
      name: 'Self-Awareness Sage',
      description: 'Logged 100 mood entries',
      criteria: { metric: 'totalMoodEntries', threshold: 100 },
      reward: {
        badgeName: 'Self-Awareness Sage',
        message: '100 moments of self-reflection! You\'re a true sage of self-awareness!',
        celebrationType: 'major'
      }
    }
  ],
  resilience: [
    {
      id: 'resilience-5-resolved',
      name: 'Trigger Tamer',
      description: 'Resolved 5 triggers',
      criteria: { metric: 'resolvedTriggers', threshold: 5 },
      reward: {
        badgeName: 'Trigger Tamer',
        message: 'You\'re learning to handle challenges like a pro!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'resilience-10-resolved',
      name: 'Resilience Builder',
      description: 'Resolved 10 triggers',
      criteria: { metric: 'resolvedTriggers', threshold: 10 },
      reward: {
        badgeName: 'Resilience Builder',
        message: 'Your resilience is building with every challenge you overcome!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'resilience-recovery',
      name: 'Bounce-Back Hero',
      description: 'Recovered from a low mood period',
      criteria: { metric: 'moodRecovery', threshold: 1 },
      reward: {
        badgeName: 'Bounce-Back Hero',
        message: 'You bounced back! That\'s the power of resilience!',
        celebrationType: 'moderate'
      }
    }
  ],
  mastery: [
    {
      id: 'mastery-80-completion',
      name: 'Task Master',
      description: 'Achieved 80% task completion rate',
      criteria: { metric: 'taskCompletionRate', threshold: 80 },
      reward: {
        badgeName: 'Task Master',
        message: 'You\'re mastering your tasks with incredible efficiency!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'mastery-50-tasks',
      name: 'Productivity Pro',
      description: 'Completed 50 tasks',
      criteria: { metric: 'totalTasksCompleted', threshold: 50 },
      reward: {
        badgeName: 'Productivity Pro',
        message: '50 tasks conquered! You\'re a productivity powerhouse!',
        celebrationType: 'major'
      }
    },
    {
      id: 'mastery-score-80',
      name: 'Wellness Master',
      description: 'Achieved wellness score of 80+',
      criteria: { metric: 'wellnessScore', threshold: 80 },
      reward: {
        badgeName: 'Wellness Master',
        message: 'Exceptional wellness! You\'ve reached master level!',
        celebrationType: 'major'
      }
    }
  ],
  engagement: [
    {
      id: 'engagement-first-week',
      name: 'First Week Complete',
      description: 'Completed your first week with MindMate',
      criteria: { metric: 'daysActive', threshold: 7 },
      reward: {
        badgeName: 'First Week',
        message: 'Welcome to the MindMate family! Your first week is complete!',
        celebrationType: 'simple'
      }
    },
    {
      id: 'engagement-first-month',
      name: 'First Month Milestone',
      description: 'Completed your first month with MindMate',
      criteria: { metric: 'daysActive', threshold: 30 },
      reward: {
        badgeName: 'First Month',
        message: 'One month of growth and self-discovery! Here\'s to many more!',
        celebrationType: 'moderate'
      }
    },
    {
      id: 'engagement-all-features',
      name: 'Feature Explorer',
      description: 'Used all MindMate features',
      criteria: { metric: 'featuresUsed', threshold: 5 },
      reward: {
        badgeName: 'Feature Explorer',
        message: 'You\'ve explored all we have to offer! You\'re getting the full MindMate experience!',
        celebrationType: 'moderate'
      }
    }
  ],
  custom: []
};

// ============================================================================
// Celebration Messages
// ============================================================================

const CELEBRATION_MESSAGES: Record<CelebrationType, string[]> = {
  simple: [
    'Nice work!',
    'Way to go!',
    'Keep it up!',
    'You\'re doing great!',
    'Small steps, big progress!'
  ],
  moderate: [
    'Fantastic achievement!',
    'You\'re on a roll!',
    'Impressive progress!',
    'You should be proud!',
    'Momentum is building!'
  ],
  major: [
    'Outstanding accomplishment!',
    'You\'re absolutely crushing it!',
    'This is incredible progress!',
    'You\'re an inspiration!',
    'Major milestone achieved!'
  ],
  epic: [
    'LEGENDARY achievement!',
    'You\'ve reached the pinnacle!',
    'This is absolutely extraordinary!',
    'You\'re rewriting what\'s possible!',
    'EPIC milestone unlocked!'
  ]
};

// ============================================================================
// Milestone Detector Class
// ============================================================================

export class MilestoneDetector {
  private config: MilestoneConfig;
  private milestoneDefinitions: Map<string, CustomMilestoneDefinition>;

  constructor(config?: Partial<MilestoneConfig>) {
    this.config = {
      enabledTypes: ['streak', 'improvement', 'consistency', 'awareness', 'resilience', 'mastery', 'engagement'],
      celebrationIntensity: 'normal',
      autoShare: false,
      ...config
    };

    this.milestoneDefinitions = this.initializeMilestoneDefinitions();
  }

  /**
   * Initialize milestone definitions map
   */
  private initializeMilestoneDefinitions(): Map<string, CustomMilestoneDefinition> {
    const map = new Map<string, CustomMilestoneDefinition>();

    // Add default milestones
    Object.values(DEFAULT_MILESTONES).flat().forEach(milestone => {
      map.set(milestone.id, milestone);
    });

    // Add custom milestones
    this.config.customMilestones?.forEach(milestone => {
      map.set(milestone.id, milestone);
    });

    return map;
  }

  /**
   * Check for new milestones
   */
  checkMilestones(input: MilestoneDetectionInput): MilestoneCheckResult {
    const startTime = performance.now();
    
    const newMilestones: Milestone[] = [];
    const updatedMilestones: Milestone[] = [];
    const celebrationQueue: CelebrationEvent[] = [];

    const existingIds = new Set(input.existingMilestones.map(m => m.id));

    // Calculate metrics
    const metrics = this.calculateMetrics(input);

    // Check each enabled milestone type
    for (const type of this.config.enabledTypes) {
      const typeMilestones = DEFAULT_MILESTONES[type] || [];

      for (const definition of typeMilestones) {
        // Skip if already achieved
        if (existingIds.has(definition.id)) continue;

        // Check if criteria is met
        if (this.checkCriteria(definition.criteria, metrics)) {
          const milestone: Milestone = {
            id: definition.id,
            userId: input.userId,
            type,
            title: definition.name,
            description: definition.description,
            achievedAt: input.checkDate || new Date(),
            criteria: definition.criteria,
            reward: definition.reward,
            shared: false
          };

          newMilestones.push(milestone);

          // Create celebration event
          const celebration = this.createCelebrationEvent(milestone);
          celebrationQueue.push(celebration);
        }
      }
    }

    const duration = performance.now() - startTime;
    console.log(`[MilestoneDetector] Checked milestones in ${duration.toFixed(2)}ms. Found ${newMilestones.length} new milestones.`);

    return {
      newMilestones,
      updatedMilestones,
      celebrationQueue
    };
  }

  /**
   * Calculate metrics for milestone checking
   */
  private calculateMetrics(input: MilestoneDetectionInput): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Consecutive days streak
    metrics.consecutiveDays = this.calculateStreak(input.moodEntries, input.tasks);

    // Mood improvement
    if (input.moodEntries.length >= 14) {
      const sorted = [...input.moodEntries].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      const firstWeek = sorted.slice(0, 7);
      const lastWeek = sorted.slice(-7);
      
      const firstAvg = calculateMean(firstWeek.map(e => e.moodLevel));
      const lastAvg = calculateMean(lastWeek.map(e => e.moodLevel));
      
      metrics.moodImprovement = firstAvg > 0 
        ? ((lastAvg - firstAvg) / firstAvg) * 100 
        : 0;
    }

    // Score improvement
    if (input.progressScores.length >= 2) {
      const sorted = [...input.progressScores].sort(
        (a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime()
      );
      const first = sorted[0].overallScore;
      const last = sorted[sorted.length - 1].overallScore;
      metrics.scoreImprovement = last - first;
    }

    // Consistency rate
    const allDates = new Set([
      ...input.moodEntries.map(e => formatDateISO(e.timestamp)),
      ...input.tasks.map(t => formatDateISO(t.createdAt))
    ]);
    const thirtyDaysAgo = addDays(new Date(), -30);
    const activeDays30 = Array.from(allDates).filter(d => 
      new Date(d) >= thirtyDaysAgo
    ).length;
    metrics.consistencyRate = (activeDays30 / 30) * 100;

    // Unique emotions
    const allEmotions = input.moodEntries.flatMap(e => e.emotions || []);
    metrics.uniqueEmotions = new Set(allEmotions.map(e => e.name)).size;

    // Total mood entries
    metrics.totalMoodEntries = input.moodEntries.length;

    // Resolved triggers
    metrics.resolvedTriggers = input.triggers.filter(t => t.resolvedAt).length;

    // Mood recovery (detected if recent average > previous low)
    if (input.moodEntries.length >= 14) {
      const sorted = [...input.moodEntries].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
      const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
      const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
      
      const firstAvg = calculateMean(firstHalf.map(e => e.moodLevel));
      const secondAvg = calculateMean(secondHalf.map(e => e.moodLevel));
      
      metrics.moodRecovery = secondAvg > firstAvg ? 1 : 0;
    }

    // Task completion rate
    const completedTasks = input.tasks.filter(t => t.status === 'completed').length;
    metrics.taskCompletionRate = input.tasks.length > 0 
      ? (completedTasks / input.tasks.length) * 100 
      : 0;

    // Total tasks completed
    metrics.totalTasksCompleted = completedTasks;

    // Wellness score
    if (input.progressScores.length > 0) {
      const latest = input.progressScores[input.progressScores.length - 1];
      metrics.wellnessScore = latest.overallScore;
    }

    // Days active
    metrics.daysActive = allDates.size;

    // Features used (simplified)
    let featuresUsed = 0;
    if (input.moodEntries.length > 0) featuresUsed++;
    if (input.tasks.length > 0) featuresUsed++;
    if (input.triggers.length > 0) featuresUsed++;
    if (input.progressScores.length > 0) featuresUsed++;
    metrics.featuresUsed = featuresUsed;

    return metrics;
  }

  /**
   * Calculate current streak
   */
  private calculateStreak(moodEntries: MoodEntry[], tasks: Task[]): number {
    const allDates = new Set([
      ...moodEntries.map(e => formatDateISO(e.timestamp)),
      ...tasks.map(t => formatDateISO(t.createdAt))
    ]);

    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = formatDateISO(new Date());
    
    // Check if active today or yesterday
    const lastDate = sortedDates[sortedDates.length - 1];
    const daysSinceLastActivity = getDaysBetween(new Date(lastDate), new Date());
    
    if (daysSinceLastActivity > 1) return 0; // Streak broken

    // Count consecutive days
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const expectedDate = formatDateISO(addDays(new Date(today), -(sortedDates.length - 1 - i)));
      if (sortedDates[i] === expectedDate || 
          (i === sortedDates.length - 1 && sortedDates[i] === today) ||
          (i === sortedDates.length - 1 && sortedDates[i] === formatDateISO(addDays(new Date(), -1)))) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Check if criteria is met
   */
  private checkCriteria(criteria: MilestoneCriteria, metrics: Record<string, number>): boolean {
    const value = metrics[criteria.metric];
    if (value === undefined) return false;

    // Check time window if specified
    if (criteria.timeWindow) {
      // Time window logic would be implemented here
      // For now, we assume metrics are already calculated for the appropriate window
    }

    return value >= criteria.threshold;
  }

  /**
   * Create celebration event for a milestone
   */
  private createCelebrationEvent(milestone: Milestone): CelebrationEvent {
    const celebrationType = milestone.reward?.celebrationType || 'simple';
    
    // Select random message for celebration type
    const messages = CELEBRATION_MESSAGES[celebrationType];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // Determine animation type based on celebration type
    const animationTypes: Record<CelebrationType, string> = {
      simple: 'confetti-burst',
      moderate: 'fireworks-display',
      major: 'trophy-celebration',
      epic: 'legendary-unlock'
    };

    return {
      milestone,
      animationType: animationTypes[celebrationType],
      message: `${randomMessage} ${milestone.reward?.message || ''}`,
      shareable: this.config.autoShare
    };
  }

  /**
   * Get milestone statistics
   */
  getMilestoneStatistics(
    milestones: Milestone[],
    input: MilestoneDetectionInput
  ): MilestoneStatistics {
    const byType: Record<MilestoneType, number> = {
      streak: 0,
      improvement: 0,
      consistency: 0,
      awareness: 0,
      resilience: 0,
      mastery: 0,
      engagement: 0,
      custom: 0
    };

    milestones.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });

    // Recent achievements (last 30 days)
    const thirtyDaysAgo = addDays(new Date(), -30);
    const recentAchievements = milestones
      .filter(m => m.achievedAt >= thirtyDaysAgo)
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());

    // Calculate upcoming milestones
    const upcomingMilestones = this.calculateUpcomingMilestones(input);

    return {
      totalMilestones: milestones.length,
      byType,
      recentAchievements,
      upcomingMilestones,
      celebrationCount: milestones.filter(m => !m.shared).length
    };
  }

  /**
   * Calculate upcoming milestones and progress
   */
  private calculateUpcomingMilestones(input: MilestoneDetectionInput): UpcomingMilestone[] {
    const upcoming: UpcomingMilestone[] = [];
    const metrics = this.calculateMetrics(input);

    for (const type of this.config.enabledTypes) {
      const typeMilestones = DEFAULT_MILESTONES[type] || [];

      for (const definition of typeMilestones) {
        const currentValue = metrics[definition.criteria.metric] || 0;
        const threshold = definition.criteria.threshold;

        if (currentValue < threshold) {
          const progress = (currentValue / threshold) * 100;
          
          // Estimate days to achieve (simplified)
          let estimatedDays = 0;
          if (definition.criteria.metric === 'consecutiveDays') {
            estimatedDays = threshold - currentValue;
          } else if (progress > 0) {
            estimatedDays = Math.ceil((100 - progress) / (progress / 7)); // Assume weekly progress
          }

          upcoming.push({
            type,
            name: definition.name,
            description: definition.description,
            progress: clamp(progress, 0, 99),
            estimatedDaysToAchieve: estimatedDays,
            criteria: definition.criteria
          });
        }
      }
    }

    return upcoming
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  }

  /**
   * Share a milestone
   */
  shareMilestone(milestone: Milestone): Milestone {
    return {
      ...milestone,
      shared: true
    };
  }

  /**
   * Get celebration preferences for a milestone
   */
  getCelebrationPreferences(milestone: Milestone): CelebrationPreferences {
    const intensity = this.config.celebrationIntensity;
    
    return {
      enableAnimations: true,
      enableSounds: intensity !== 'subtle',
      shareToSocial: this.config.autoShare,
      privacyLevel: 'friends'
    };
  }

  /**
   * Add custom milestone definition
   */
  addCustomMilestone(definition: CustomMilestoneDefinition): void {
    this.milestoneDefinitions.set(definition.id, definition);
    
    if (!this.config.customMilestones) {
      this.config.customMilestones = [];
    }
    this.config.customMilestones.push(definition);
  }

  /**
   * Get all milestone definitions
   */
  getAllMilestoneDefinitions(): CustomMilestoneDefinition[] {
    return Array.from(this.milestoneDefinitions.values());
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createMilestoneDetector(
  config?: Partial<MilestoneConfig>
): MilestoneDetector {
  return new MilestoneDetector(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default MilestoneDetector;
