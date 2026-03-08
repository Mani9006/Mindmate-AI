# MindMate AI - Notification & Scheduling System Architecture

## Executive Summary

This document outlines the comprehensive notification and scheduling backend architecture for MindMate AI, a mental wellness application. The system is designed to deliver personalized, context-aware communications through multiple channels while respecting user preferences and behavioral patterns.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Daily Challenge Scheduler](#1-daily-challenge-scheduler)
3. [Proactive Check-in Trigger Engine](#2-proactive-check-in-trigger-engine)
4. [Push Notification Delivery](#3-push-notification-delivery)
5. [SMS Fallback via Twilio](#4-sms-fallback-via-twilio)
6. [In-App Notification Center](#5-in-app-notification-center)
7. [Behavioral Trigger Engine](#6-behavioral-trigger-engine)
8. [Data Models](#data-models)
9. [API Specifications](#api-specifications)
10. [Deployment & Scaling](#deployment--scaling)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION ORCHESTRATION LAYER                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Challenge  │  │   Proactive  │  │  Behavioral  │  │   Campaign   │     │
│  │  Scheduler   │  │   Check-in   │  │   Trigger    │  │   Manager    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │    NOTIFICATION ROUTER          │
                    │  (Channel Selection & Priority) │
                    └────────────────┬────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼─────────┐    ┌───────────▼──────────┐   ┌───────────▼──────────┐
│  PUSH NOTIFICATIONS│    │      SMS FALLBACK    │   │  IN-APP NOTIFICATIONS│
├────────────────────┤    ├──────────────────────┤   ├──────────────────────┤
│ • Firebase FCM     │    │ • Twilio API         │   │ • Real-time WebSocket│
│ • Web Push (VAPID) │    │ • Message Templates  │   │ • Notification Store │
│ • Priority Queue   │    │ • Delivery Tracking  │   │ • Badge Management   │
└────────────────────┘    └──────────────────────┘   └──────────────────────┘
```

### Core Components

| Component | Technology Stack | Purpose |
|-----------|------------------|---------|
| Job Scheduler | BullMQ + Redis | Cron-based task scheduling |
| Trigger Engine | Node.js + TensorFlow.js | AI-driven notification decisions |
| Push Service | Firebase Admin SDK + web-push | Multi-platform push delivery |
| SMS Service | Twilio SDK | Fallback SMS delivery |
| Real-time | Socket.io | In-app notification streaming |
| Analytics | ClickHouse + Grafana | Delivery tracking & insights |

---

## 1. Daily Challenge Scheduler

### 1.1 Architecture Overview

The Daily Challenge Scheduler delivers personalized wellness challenges to users at their preferred time, respecting timezone differences and user activity patterns.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHALLENGE SCHEDULER FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Cron Job  │───▶│  User Query │───▶│  Generate Challenge │  │
│  │  (Every 5m) │    │  (Timezone) │    │    (Personalized)   │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                               │                  │
│                                               ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Deliver   │◀───│  Enqueue    │◀───│   Priority Score    │  │
│  │             │    │   Job       │    │    Calculation      │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Cron Configuration

```typescript
// config/scheduler.config.ts
export const challengeSchedulerConfig = {
  // Runs every 5 minutes to check for users whose preferred time has arrived
  cronExpression: '*/5 * * * *',
  
  // Batch size for processing users
  batchSize: 500,
  
  // Time window for delivery (users get challenge within 5 min of preferred time)
  deliveryWindowMinutes: 5,
  
  // Retry configuration
  retryAttempts: 3,
  retryBackoffMs: 60000, // 1 minute
  
  // Challenge types rotation
  challengeTypes: [
    'mindfulness',
    'gratitude',
    'breathing',
    'journaling',
    'social_connection',
    'physical_activity',
    'sleep_hygiene',
    'cognitive_reframing'
  ]
};
```

### 1.3 User Preference Model

```typescript
// models/userChallengePreferences.model.ts
interface UserChallengePreferences {
  userId: string;
  
  // Timezone-aware scheduling
  timezone: string; // IANA timezone (e.g., "America/New_York")
  preferredTime: {
    hour: number;   // 0-23
    minute: number; // 0-59
  };
  
  // Day preferences
  activeDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  
  // Challenge customization
  preferredCategories: ChallengeCategory[];
  excludedCategories: ChallengeCategory[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Delivery preferences
  notificationChannels: {
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  
  // Smart scheduling
  adaptiveTiming: boolean; // AI adjusts based on engagement patterns
  quietHours: {
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastDeliveredAt?: Date;
  streakCount: number;
}
```

### 1.4 Scheduler Implementation

```typescript
// services/challengeScheduler.service.ts
import { Queue } from 'bullmq';
import { CronJob } from 'cron';

export class ChallengeSchedulerService {
  private challengeQueue: Queue;
  private cronJob: CronJob;

  constructor() {
    this.challengeQueue = new Queue('daily-challenges', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnComplete: { age: 86400 }, // Keep for 24 hours
        removeOnFail: { age: 604800 }     // Keep for 7 days
      }
    });
  }

  async start(): Promise<void> {
    this.cronJob = new CronJob(
      '*/5 * * * *',
      () => this.processScheduledChallenges(),
      null,
      true,
      'UTC'
    );
    
    console.log('[ChallengeScheduler] Started - running every 5 minutes');
  }

  private async processScheduledChallenges(): Promise<void> {
    const now = new Date();
    const batchSize = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await this.getUsersForDelivery(now, batchSize, offset);
      
      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Enqueue challenge generation jobs
      const jobs = users.map(user => ({
        name: 'generate-challenge',
        data: {
          userId: user.id,
          timezone: user.timezone,
          preferences: user.challengePreferences,
          scheduledAt: now.toISOString()
        },
        opts: {
          jobId: `challenge-${user.id}-${now.toISOString().split('T')[0]}`,
          priority: this.calculatePriority(user)
        }
      }));

      await this.challengeQueue.addBulk(jobs);
      
      offset += batchSize;
      hasMore = users.length === batchSize;
    }
  }

  private async getUsersForDelivery(
    now: Date, 
    limit: number, 
    offset: number
  ): Promise<User[]> {
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Query users whose preferred time falls within the current 5-minute window
    return prisma.user.findMany({
      where: {
        challengePreferences: {
          isActive: true,
          activeDays: { has: this.getDayOfWeek(now) },
          // Complex timezone query - convert user's local time to UTC
          AND: [
            {
              // User's preferred time in their timezone equals current UTC time
              // This requires a sophisticated query or pre-calculated UTC times
              nextDeliveryAt: {
                lte: new Date(now.getTime() + 5 * 60 * 1000),
                gte: now
              }
            }
          ]
        },
        // Don't send if already delivered today
        NOT: {
          challengeDeliveries: {
            some: {
              deliveredAt: {
                gte: new Date(now.setHours(0, 0, 0, 0))
              }
            }
          }
        }
      },
      take: limit,
      skip: offset,
      include: {
        challengePreferences: true,
        engagementMetrics: true
      }
    });
  }

  private calculatePriority(user: User): number {
    // Higher priority for:
    // - Users with longer streaks (maintain engagement)
    // - Users who haven't engaged recently (re-engagement)
    // - Premium users
    let priority = 5; // Default
    
    if (user.subscriptionTier === 'premium') priority += 2;
    if (user.challengePreferences.streakCount > 7) priority += 1;
    if (user.engagementMetrics?.lastActiveAt < new Date(Date.now() - 48 * 60 * 60 * 1000)) {
      priority += 2; // Re-engagement priority
    }
    
    return Math.min(priority, 10);
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getUTCDay()];
  }
}
```

### 1.5 Challenge Generation Worker

```typescript
// workers/challengeGenerator.worker.ts
import { Worker } from 'bullmq';

export class ChallengeGeneratorWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'daily-challenges',
      async (job) => {
        const { userId, preferences } = job.data;
        
        // Generate personalized challenge
        const challenge = await this.generatePersonalizedChallenge(userId, preferences);
        
        // Deliver through appropriate channels
        await this.deliverChallenge(userId, challenge, preferences);
        
        // Record delivery
        await this.recordDelivery(userId, challenge);
        
        return { challengeId: challenge.id, delivered: true };
      },
      {
        connection: redisConnection,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 1000
        }
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`[ChallengeWorker] Completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[ChallengeWorker] Failed: ${job?.id}`, err);
    });
  }

  private async generatePersonalizedChallenge(
    userId: string, 
    preferences: UserChallengePreferences
  ): Promise<Challenge> {
    // Get user's history and context
    const userContext = await this.getUserContext(userId);
    
    // Use AI to generate personalized challenge
    const challengePrompt = this.buildChallengePrompt(userContext, preferences);
    
    const aiResponse = await aiService.generateContent({
      model: 'claude-3-sonnet',
      prompt: challengePrompt,
      maxTokens: 500,
      temperature: 0.7
    });

    return {
      id: generateUUID(),
      userId,
      title: aiResponse.title,
      description: aiResponse.description,
      category: aiResponse.category,
      difficulty: preferences.difficultyLevel,
      estimatedDuration: aiResponse.duration,
      instructions: aiResponse.instructions,
      benefits: aiResponse.benefits,
      createdAt: new Date()
    };
  }

  private async deliverChallenge(
    userId: string, 
    challenge: Challenge,
    preferences: UserChallengePreferences
  ): Promise<void> {
    const notificationRouter = new NotificationRouter();
    
    await notificationRouter.send({
      userId,
      type: 'daily_challenge',
      title: `Today's Challenge: ${challenge.title}`,
      body: challenge.description,
      data: {
        challengeId: challenge.id,
        category: challenge.category,
        deepLink: `mindmate://challenge/${challenge.id}`
      },
      channels: this.determineChannels(preferences),
      priority: 'high'
    });
  }

  private determineChannels(preferences: UserChallengePreferences): Channel[] {
    const channels: Channel[] = ['in-app'];
    
    if (preferences.notificationChannels.push) channels.push('push');
    if (preferences.notificationChannels.sms) channels.push('sms');
    
    return channels;
  }
}
```

---

## 2. Proactive Check-in Trigger Engine

### 2.1 Architecture Overview

The Proactive Check-in Trigger Engine uses AI to determine the optimal moments to reach out to users based on their behavioral patterns, emotional state indicators, and contextual signals.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROACTIVE CHECK-IN TRIGGER ENGINE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SIGNAL COLLECTION LAYER                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • App Usage Patterns  • Mood Entries  • Sleep Data  • Activity     │   │
│  │  • Journal Sentiment   • Session Length • Response Times • Crises    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FEATURE ENGINEERING PIPELINE                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Engagement Score │ Emotional Volatility │ Risk Indicators │ Context │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ML PREDICTION MODEL                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  Engagement │  │   Check-in  │  │   Crisis    │  │  Optimal  │  │   │
│  │  │  Likelihood │  │  Appropriateness│  │   Risk     │  │   Timing  │  │   │
│  │  │   Score     │  │    Score    │  │    Level    │  │  Window   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DECISION ENGINE                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  WAIT ◄──── DECISION ────► INITIATE CHECK-IN ────► ESCALATE       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Signal Collection System

```typescript
// services/signalCollector.service.ts
interface UserSignals {
  userId: string;
  timestamp: Date;
  
  // Engagement Signals
  engagement: {
    lastActiveAt: Date;
    sessionCount7d: number;
    avgSessionDuration: number;
    featureUsage: Record<string, number>;
    responseTimeToNotifications: number[];
  };
  
  // Emotional Signals
  emotional: {
    recentMoodEntries: MoodEntry[];
    sentimentTrend: 'improving' | 'stable' | 'declining';
    volatilityScore: number; // 0-1
    journalSentiment: SentimentAnalysis[];
  };
  
  // Behavioral Signals
  behavioral: {
    sleepPatternDeviation: number;
    activityLevelChange: number;
    socialInteractionChange: number;
    routineDisruptionScore: number;
  };
  
  // Contextual Signals
  contextual: {
    timeOfDay: string;
    dayOfWeek: string;
    recentLifeEvents: string[];
    weatherAtLocation?: string;
    upcomingAnniversaries?: string[];
  };
  
  // Risk Signals
  risk: {
    crisisIndicators: string[];
    selfHarmLanguageDetected: boolean;
    isolationScore: number;
    helpSeekingBehavior: boolean;
  };
}

export class SignalCollectorService {
  async collectSignals(userId: string): Promise<UserSignals> {
    const [engagement, emotional, behavioral, contextual, risk] = await Promise.all([
      this.collectEngagementSignals(userId),
      this.collectEmotionalSignals(userId),
      this.collectBehavioralSignals(userId),
      this.collectContextualSignals(userId),
      this.collectRiskSignals(userId)
    ]);

    return {
      userId,
      timestamp: new Date(),
      engagement,
      emotional,
      behavioral,
      contextual,
      risk
    };
  }

  private async collectEngagementSignals(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        startedAt: { gte: sevenDaysAgo }
      }
    });

    const notifications = await prisma.notificationDelivery.findMany({
      where: {
        userId,
        sentAt: { gte: sevenDaysAgo },
        openedAt: { not: null }
      }
    });

    return {
      lastActiveAt: sessions[0]?.endedAt || new Date(0),
      sessionCount7d: sessions.length,
      avgSessionDuration: this.calculateAvgDuration(sessions),
      featureUsage: this.aggregateFeatureUsage(sessions),
      responseTimeToNotifications: notifications.map(n => 
        n.openedAt!.getTime() - n.sentAt.getTime()
      )
    };
  }

  private async collectEmotionalSignals(userId: string): Promise<any> {
    const recentEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 14,
      include: { sentimentAnalysis: true }
    });

    return {
      recentMoodEntries: recentEntries,
      sentimentTrend: this.calculateSentimentTrend(recentEntries),
      volatilityScore: this.calculateVolatility(recentEntries),
      journalSentiment: recentEntries.map(e => e.sentimentAnalysis)
    };
  }

  private async collectRiskSignals(userId: string): Promise<any> {
    const recentJournalEntries = await prisma.journalEntry.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      },
      include: { contentAnalysis: true }
    });

    const crisisIndicators: string[] = [];
    let selfHarmDetected = false;

    for (const entry of recentJournalEntries) {
      if (entry.contentAnalysis?.crisisIndicators) {
        crisisIndicators.push(...entry.contentAnalysis.crisisIndicators);
      }
      if (entry.contentAnalysis?.selfHarmDetected) {
        selfHarmDetected = true;
      }
    }

    return {
      crisisIndicators: [...new Set(crisisIndicators)],
      selfHarmLanguageDetected: selfHarmDetected,
      isolationScore: await this.calculateIsolationScore(userId),
      helpSeekingBehavior: await this.detectHelpSeeking(userId)
    };
  }

  private calculateSentimentTrend(entries: MoodEntry[]): string {
    if (entries.length < 3) return 'stable';
    
    const recent = entries.slice(0, 3).reduce((sum, e) => sum + e.moodScore, 0) / 3;
    const older = entries.slice(-3).reduce((sum, e) => sum + e.moodScore, 0) / 3;
    
    const diff = recent - older;
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  private calculateVolatility(entries: MoodEntry[]): number {
    if (entries.length < 2) return 0;
    
    const scores = entries.map(e => e.moodScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.min(Math.sqrt(variance) / 5, 1); // Normalize to 0-1
  }
}
```

### 2.3 ML Prediction Model

```typescript
// ml/checkinPrediction.model.ts
import * as tf from '@tensorflow/tfjs-node';

interface CheckInPrediction {
  shouldInitiate: boolean;
  confidence: number;
  recommendedApproach: 'casual' | 'supportive' | 'direct' | 'crisis';
  optimalTiming: Date;
  reasoning: string[];
}

export class CheckInPredictionModel {
  private model: tf.LayersModel | null = null;

  async loadModel(): Promise<void> {
    this.model = await tf.loadLayersModel('file://models/checkin-prediction/model.json');
  }

  async predict(signals: UserSignals): Promise<CheckInPrediction> {
    if (!this.model) {
      await this.loadModel();
    }

    const features = this.extractFeatures(signals);
    const tensor = tf.tensor2d([features]);
    
    const prediction = this.model!.predict(tensor) as tf.Tensor;
    const [engagementProb, appropriatenessScore, riskLevel, timingScore] = 
      (await prediction.data()) as Float32Array;

    tensor.dispose();
    prediction.dispose();

    // Decision logic
    const shouldInitiate = this.makeDecision(
      engagementProb, 
      appropriatenessScore, 
      riskLevel,
      signals
    );

    return {
      shouldInitiate,
      confidence: appropriatenessScore,
      recommendedApproach: this.determineApproach(riskLevel, signals),
      optimalTiming: this.calculateOptimalTiming(signals, timingScore),
      reasoning: this.generateReasoning(signals, engagementProb, riskLevel)
    };
  }

  private extractFeatures(signals: UserSignals): number[] {
    return [
      // Engagement features
      Math.min(signals.engagement.sessionCount7d / 10, 1),
      Math.min(signals.engagement.avgSessionDuration / 1800, 1),
      signals.engagement.responseTimeToNotifications.length > 0 
        ? 1 / (signals.engagement.responseTimeToNotifications.reduce((a,b) => a+b, 0) / 
               signals.engagement.responseTimeToNotifications.length / 3600000 + 1)
        : 0,
      
      // Emotional features
      signals.emotional.sentimentTrend === 'improving' ? 1 : 
        signals.emotional.sentimentTrend === 'declining' ? 0 : 0.5,
      signals.emotional.volatilityScore,
      
      // Behavioral features
      Math.max(-1, Math.min(1, signals.behavioral.sleepPatternDeviation)),
      Math.max(-1, Math.min(1, signals.behavioral.activityLevelChange)),
      signals.behavioral.routineDisruptionScore,
      
      // Risk features
      signals.risk.crisisIndicators.length > 0 ? 1 : 0,
      signals.risk.selfHarmLanguageDetected ? 1 : 0,
      signals.risk.isolationScore,
      signals.risk.helpSeekingBehavior ? 1 : 0,
      
      // Contextual features
      this.encodeTimeOfDay(signals.contextual.timeOfDay),
      this.encodeDayOfWeek(signals.contextual.dayOfWeek)
    ];
  }

  private makeDecision(
    engagementProb: number,
    appropriatenessScore: number,
    riskLevel: number,
    signals: UserSignals
  ): boolean {
    // Crisis override - always check in if risk detected
    if (riskLevel > 0.7 || signals.risk.selfHarmLanguageDetected) {
      return true;
    }

    // High engagement probability + appropriate timing
    if (engagementProb > 0.6 && appropriatenessScore > 0.5) {
      return true;
    }

    // Declining sentiment trend with low engagement
    if (signals.emotional.sentimentTrend === 'declining' && engagementProb < 0.4) {
      return true;
    }

    // Significant behavioral changes
    if (Math.abs(signals.behavioral.sleepPatternDeviation) > 0.5 ||
        Math.abs(signals.behavioral.activityLevelChange) > 0.5) {
      return true;
    }

    return false;
  }

  private determineApproach(riskLevel: number, signals: UserSignals): string {
    if (riskLevel > 0.8 || signals.risk.selfHarmLanguageDetected) {
      return 'crisis';
    }
    if (riskLevel > 0.5) {
      return 'direct';
    }
    if (signals.emotional.sentimentTrend === 'declining') {
      return 'supportive';
    }
    return 'casual';
  }

  private calculateOptimalTiming(signals: UserSignals, timingScore: number): Date {
    const now = new Date();
    const userTimezone = signals.contextual.timezone || 'UTC';
    
    // Base timing on user's typical active hours
    const preferredHours = this.getUserActiveHours(signals.userId);
    const hourOffset = Math.floor(timingScore * 12); // 0-12 hours from now
    
    const optimalTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
    
    // Ensure it's within user's preferred hours
    return this.adjustToPreferredHours(optimalTime, preferredHours);
  }

  private generateReasoning(
    signals: UserSignals, 
    engagementProb: number, 
    riskLevel: number
  ): string[] {
    const reasons: string[] = [];

    if (riskLevel > 0.5) {
      reasons.push(`Elevated risk indicators detected (${(riskLevel * 100).toFixed(0)}% confidence)`);
    }
    if (signals.emotional.sentimentTrend === 'declining') {
      reasons.push('Sentiment trend shows decline in recent entries');
    }
    if (signals.emotional.volatilityScore > 0.6) {
      reasons.push('High emotional volatility detected');
    }
    if (signals.engagement.sessionCount7d < 2) {
      reasons.push('Low app engagement in past week');
    }
    if (engagementProb < 0.3) {
      reasons.push('Predicted low engagement with proactive outreach');
    }

    return reasons;
  }
}
```

### 2.4 Trigger Engine Service

```typescript
// services/proactiveCheckIn.service.ts
export class ProactiveCheckInService {
  private signalCollector: SignalCollectorService;
  private predictionModel: CheckInPredictionModel;
  private checkInQueue: Queue;

  constructor() {
    this.signalCollector = new SignalCollectorService();
    this.predictionModel = new CheckInPredictionModel();
    this.checkInQueue = new Queue('proactive-checkins', { connection: redisConnection });
  }

  async startMonitoring(): Promise<void> {
    // Run signal collection every 4 hours for active users
    setInterval(
      () => this.evaluateAllUsers(),
      4 * 60 * 60 * 1000
    );

    // Also evaluate on significant events
    this.setupEventListeners();
  }

  private async evaluateAllUsers(): Promise<void> {
    const activeUsers = await this.getActiveUsersForEvaluation();
    
    for (const user of activeUsers) {
      await this.evaluateUser(user.id);
    }
  }

  async evaluateUser(userId: string): Promise<void> {
    // Collect all signals
    const signals = await this.signalCollector.collectSignals(userId);
    
    // Run prediction
    const prediction = await this.predictionModel.predict(signals);
    
    // Log prediction for analysis
    await this.logPrediction(userId, signals, prediction);

    if (prediction.shouldInitiate) {
      await this.scheduleCheckIn(userId, prediction, signals);
    }
  }

  private async scheduleCheckIn(
    userId: string,
    prediction: CheckInPrediction,
    signals: UserSignals
  ): Promise<void> {
    const delay = prediction.optimalTiming.getTime() - Date.now();
    
    await this.checkInQueue.add(
      'send-checkin',
      {
        userId,
        approach: prediction.recommendedApproach,
        reasoning: prediction.reasoning,
        signals: this.sanitizeSignals(signals)
      },
      {
        delay: Math.max(delay, 0),
        jobId: `checkin-${userId}-${Date.now()}`,
        priority: prediction.recommendedApproach === 'crisis' ? 1 : 5
      }
    );
  }

  private setupEventListeners(): void {
    // Listen for significant events that warrant immediate evaluation
    eventBus.on('mood.crisis_detected', async ({ userId }) => {
      await this.evaluateUser(userId);
    });

    eventBus.on('journal.concerning_content', async ({ userId, severity }) => {
      if (severity > 0.7) {
        await this.triggerImmediateCheckIn(userId, 'crisis');
      }
    });

    eventBus.on('user.significant_gap', async ({ userId, gapHours }) => {
      if (gapHours > 72) {
        await this.evaluateUser(userId);
      }
    });
  }

  private async triggerImmediateCheckIn(
    userId: string, 
    approach: string
  ): Promise<void> {
    await this.checkInQueue.add(
      'send-checkin',
      {
        userId,
        approach,
        immediate: true,
        reasoning: ['Triggered by real-time event']
      },
      {
        priority: 1, // Highest priority
        attempts: 5
      }
    );
  }

  private sanitizeSignals(signals: UserSignals): any {
    // Remove PII before storing in job data
    return {
      emotional: {
        sentimentTrend: signals.emotional.sentimentTrend,
        volatilityScore: signals.emotional.volatilityScore
      },
      risk: {
        riskLevel: signals.risk.crisisIndicators.length > 0 ? 'elevated' : 'normal'
      }
    };
  }
}
```

---

## 3. Push Notification Delivery

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION DELIVERY SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      NOTIFICATION REQUEST                            │   │
│  │  { userId, title, body, data, priority, channels }                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CHANNEL SELECTOR & PRIORITIZER                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          │                         │                         │              │
│          ▼                         ▼                         ▼              │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐       │
│  │  FIREBASE FCM │        │   WEB PUSH    │        │  IN-APP/SMS   │       │
│  │   (Mobile)    │        │   (Browser)   │        │   (Fallback)  │       │
│  ├───────────────┤        ├───────────────┤        ├───────────────┤       │
│  │ • iOS (APNs)  │        │ • VAPID auth  │        │ • WebSocket   │       │
│  │ • Android     │        │ • Service     │        │ • Twilio SMS  │       │
│  │ • Topic sub   │        │   Workers     │        │ • Polling     │       │
│  └───────────────┘        └───────────────┘        └───────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Firebase FCM Integration

```typescript
// services/push/fcm.service.ts
import * as admin from 'firebase-admin';

export class FCMService {
  private firebaseApp: admin.app.App;

  constructor() {
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }

  async sendToDevice(
    tokens: string[],
    notification: PushNotification
  ): Promise<BatchSendResult> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: this.sanitizeData(notification.data),
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: notification.category || 'default',
          sound: 'default',
          icon: '@drawable/ic_notification',
          color: '#4CAF50',
          clickAction: notification.data?.deepLink
        }
      },
      apns: {
        headers: {
          'apns-priority': notification.priority === 'high' ? '10' : '5'
        },
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            badge: notification.badgeCount,
            sound: 'default',
            category: notification.category
          }
        }
      }
    };

    const response = await this.firebaseApp.messaging().sendEachForMulticast(message);

    // Handle token cleanup for invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (error?.code === 'messaging/registration-token-not-registered' ||
            error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await this.cleanupInvalidTokens(invalidTokens);
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens
    };
  }

  async sendToTopic(
    topic: string,
    notification: PushNotification
  ): Promise<string> {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: this.sanitizeData(notification.data)
    };

    return await this.firebaseApp.messaging().send(message);
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseApp.messaging().subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseApp.messaging().unsubscribeFromTopic(tokens, topic);
  }

  private sanitizeData(data?: Record<string, any>): Record<string, string> {
    if (!data) return {};
    
    // FCM requires all data values to be strings
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
      return acc;
    }, {} as Record<string, string>);
  }

  private async cleanupInvalidTokens(tokens: string[]): Promise<void> {
    await prisma.pushToken.deleteMany({
      where: { token: { in: tokens } }
    });
  }
}
```

### 3.3 Web Push Integration

```typescript
// services/push/webPush.service.ts
import * as webpush from 'web-push';

export class WebPushService {
  constructor() {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  async sendToSubscription(
    subscription: PushSubscription,
    notification: PushNotification
  ): Promise<SendResult> {
    const payload = JSON.stringify({
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        image: notification.imageUrl,
        tag: notification.id || Date.now().toString(),
        requireInteraction: notification.priority === 'high',
        actions: notification.actions?.map(action => ({
          action: action.id,
          title: action.title,
          icon: action.icon
        })) || [],
        data: notification.data
      }
    });

    try {
      await webpush.sendNotification(subscription, payload);
      return { success: true };
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid
        return { success: false, shouldRemove: true };
      }
      throw error;
    }
  }

  async sendToUser(
    userId: string,
    notification: PushNotification
  ): Promise<BatchSendResult> {
    const subscriptions = await prisma.webPushSubscription.findMany({
      where: { userId }
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        this.sendToSubscription(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          notification
        )
      )
    );

    const expiredSubscriptions: string[] = [];
    let successCount = 0;

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
        } else if (result.value.shouldRemove) {
          expiredSubscriptions.push(subscriptions[idx].endpoint);
        }
      }
    });

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await prisma.webPushSubscription.deleteMany({
        where: { endpoint: { in: expiredSubscriptions } }
      });
    }

    return {
      successCount,
      failureCount: subscriptions.length - successCount,
      expiredSubscriptions
    };
  }

  getVapidPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY!;
  }

  async saveSubscription(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    await prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date()
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  }
}
```

### 3.4 Push Token Management

```typescript
// services/push/tokenManager.service.ts
export class PushTokenManager {
  async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    deviceInfo?: DeviceInfo
  ): Promise<void> {
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceInfo: deviceInfo || {},
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: generateUUID(),
        userId,
        token,
        platform,
        deviceInfo: deviceInfo || {},
        isActive: true
      }
    });
  }

  async getUserTokens(userId: string): Promise<PushToken[]> {
    return prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true
      }
    });
  }

  async deactivateToken(token: string): Promise<void> {
    await prisma.pushToken.update({
      where: { token },
      data: { isActive: false }
    });
  }

  async deactivateAllUserTokens(userId: string): Promise<void> {
    await prisma.pushToken.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  // Periodic cleanup of stale tokens
  async cleanupStaleTokens(maxAgeDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    
    const result = await prisma.pushToken.deleteMany({
      where: {
        OR: [
          { updatedAt: { lt: cutoffDate } },
          { isActive: false }
        ]
      }
    });

    return result.count;
  }
}
```

---

## 4. SMS Fallback via Twilio

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMS FALLBACK SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SMS TRIGGER CONDITIONS                            │   │
│  │  • Push notification failed after retries                            │   │
│  │  • User has SMS fallback enabled                                     │   │
│  │  • Message priority is HIGH or CRITICAL                              │   │
│  │  • User hasn't opened app in 24+ hours                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TWILIO SMS SERVICE                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  Message    │  │   Phone     │  │  Delivery   │  │  Opt-out  │  │   │
│  │  │  Templates  │  │  Validation │  │  Tracking   │  │  Handling │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DELIVERY & COMPLIANCE                             │   │
│  │  • Rate limiting (per user & global)  • Quiet hours respect          │   │
│  │  • Opt-out processing                 • Delivery receipts            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Twilio Service Implementation

```typescript
// services/sms/twilio.service.ts
import twilio from 'twilio';

export class TwilioService {
  private client: twilio.Twilio;
  private fromNumber: string;
  private messagingServiceSid: string;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER!;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;
  }

  async sendSMS(
    to: string,
    message: string,
    options?: SMSOptions
  ): Promise<SMSResult> {
    // Validate phone number
    const validation = await this.validatePhoneNumber(to);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid phone number: ${validation.error}`
      };
    }

    // Check quiet hours
    if (await this.isInQuietHours(to, options?.userTimezone)) {
      // Schedule for later
      const scheduledTime = this.getNextAllowedTime(options?.userTimezone);
      await this.scheduleSMS(to, message, scheduledTime);
      
      return {
        success: true,
        scheduled: true,
        scheduledFor: scheduledTime
      };
    }

    try {
      const twilioMessage = await this.client.messages.create({
        body: message,
        from: this.messagingServiceSid || this.fromNumber,
        to: validation.formattedNumber,
        statusCallback: `${process.env.WEBHOOK_BASE_URL}/webhooks/twilio/status`,
        ...(options?.mediaUrl && { mediaUrl: options.mediaUrl })
      });

      // Log delivery
      await this.logSMSDelivery({
        messageSid: twilioMessage.sid,
        to: validation.formattedNumber,
        body: message,
        status: twilioMessage.status,
        userId: options?.userId
      });

      return {
        success: true,
        messageSid: twilioMessage.sid,
        status: twilioMessage.status
      };
    } catch (error: any) {
      console.error('[TwilioService] SMS send failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTemplatedSMS(
    to: string,
    templateName: string,
    variables: Record<string, string>,
    options?: SMSOptions
  ): Promise<SMSResult> {
    const template = await this.getTemplate(templateName);
    const message = this.renderTemplate(template.body, variables);
    
    return this.sendSMS(to, message, options);
  }

  async validatePhoneNumber(phoneNumber: string): Promise<PhoneValidation> {
    try {
      const lookup = await this.client.lookups.v2.phoneNumbers(phoneNumber).fetch();
      
      return {
        valid: true,
        formattedNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        carrier: lookup.carrier
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid phone number'
      };
    }
  }

  async handleStatusCallback(
    messageSid: string,
    status: string,
    errorCode?: string
  ): Promise<void> {
    await prisma.smsDelivery.updateMany({
      where: { messageSid },
      data: {
        status,
        errorCode,
        updatedAt: new Date()
      }
    });

    // Handle specific error codes
    if (errorCode === '21610') {
      // User opted out
      await this.handleOptOut(messageSid);
    }
  }

  async handleIncomingSMS(
    from: string,
    body: string,
    messageSid: string
  ): Promise<void> {
    const normalizedBody = body.toLowerCase().trim();
    
    // Check for opt-out keywords
    if (['stop', 'unsubscribe', 'cancel', 'quit'].includes(normalizedBody)) {
      await this.handleOptOutByNumber(from);
      await this.sendSMS(from, 'You have been unsubscribed from MindMate AI SMS notifications. Reply START to resubscribe.');
      return;
    }

    // Check for opt-in keywords
    if (['start', 'subscribe', 'yes'].includes(normalizedBody)) {
      await this.handleOptIn(from);
      await this.sendSMS(from, 'Welcome back! You are now subscribed to MindMate AI SMS notifications.');
      return;
    }

    // Log incoming message for analysis
    await this.logIncomingSMS({
      from,
      body,
      messageSid,
      receivedAt: new Date()
    });

    // Could trigger an AI response here
  }

  private async handleOptOut(messageSid: string): Promise<void> {
    const delivery = await prisma.smsDelivery.findFirst({
      where: { messageSid },
      include: { user: true }
    });

    if (delivery?.userId) {
      await prisma.userNotificationPreferences.update({
        where: { userId: delivery.userId },
        data: { smsEnabled: false }
      });
    }
  }

  private async handleOptOutByNumber(phoneNumber: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { phoneNumber }
    });

    if (user) {
      await prisma.userNotificationPreferences.update({
        where: { userId: user.id },
        data: { smsEnabled: false }
      });
    }
  }

  private async handleOptIn(phoneNumber: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { phoneNumber }
    });

    if (user) {
      await prisma.userNotificationPreferences.update({
        where: { userId: user.id },
        data: { smsEnabled: true }
      });
    }
  }

  private async isInQuietHours(
    phoneNumber: string,
    timezone?: string
  ): Promise<boolean> {
    const tz = timezone || 'America/New_York';
    const now = new Date().toLocaleString('en-US', { timeZone: tz });
    const hour = new Date(now).getHours();
    
    // Quiet hours: 9 PM to 8 AM
    return hour >= 21 || hour < 8;
  }

  private getNextAllowedTime(timezone?: string): Date {
    const tz = timezone || 'America/New_York';
    const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    
    // Schedule for 8 AM next day if in quiet hours
    const nextAllowed = new Date(localNow);
    nextAllowed.setHours(8, 0, 0, 0);
    
    if (localNow.getHours() >= 21) {
      nextAllowed.setDate(nextAllowed.getDate() + 1);
    }
    
    return nextAllowed;
  }

  private async getTemplate(name: string): Promise<SMSTemplate> {
    const template = await prisma.smsTemplate.findUnique({
      where: { name }
    });

    if (!template) {
      throw new Error(`SMS template not found: ${name}`);
    }

    return template;
  }

  private renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }
}
```

### 4.3 SMS Templates

```typescript
// config/smsTemplates.config.ts
export const smsTemplates: Record<string, SMSTemplate> = {
  daily_challenge: {
    name: 'daily_challenge',
    body: 'Hi {{firstName}}! Your daily wellness challenge is ready: {{challengeTitle}}. Open MindMate to complete it and keep your streak going! {{deepLink}}',
    category: 'engagement',
    maxLength: 320
  },
  
  check_in_supportive: {
    name: 'check_in_supportive',
    body: 'Hi {{firstName}}, just checking in. How are you feeling today? Reply or open the app to chat. {{deepLink}}',
    category: 'wellness',
    maxLength: 160
  },
  
  check_in_crisis: {
    name: 'check_in_crisis',
    body: '{{firstName}}, we noticed you might be going through a difficult time. Support is available 24/7 at {{crisisLine}}. You are not alone.',
    category: 'crisis',
    maxLength: 160
  },
  
  streak_reminder: {
    name: 'streak_reminder',
    body: 'You\'re on a {{streakCount}}-day streak, {{firstName}}! Don\'t let it slip - complete today\'s activity. {{deepLink}}',
    category: 'engagement',
    maxLength: 160
  },
  
  appointment_reminder: {
    name: 'appointment_reminder',
    body: 'Reminder: You have a {{appointmentType}} scheduled for {{appointmentTime}}. {{deepLink}}',
    category: 'reminder',
    maxLength: 160
  },
  
  re_engagement: {
    name: 're_engagement',
    body: 'We miss you, {{firstName}}! Your MindMate community is here to support your wellness journey. {{deepLink}}',
    category: 'engagement',
    maxLength: 140
  }
};
```

---

## 5. In-App Notification Center

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IN-APP NOTIFICATION CENTER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    REAL-TIME DELIVERY LAYER                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  WebSocket  │  │   Server-   │  │   Push      │  │  Polling  │  │   │
│  │  │   (Socket)  │  │   Sent      │  │  Events     │  │  Fallback │  │   │
│  │  │             │  │   Events    │  │  (SSE)      │  │           │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NOTIFICATION STORE                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • Persistent notification history  • Read/Unread tracking           │   │
│  │  • Category filtering               • Priority sorting               │   │
│  │  • Action state management          • Archive/Delete                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLIENT-SIDE STATE                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • Redux/Zustand store              • Optimistic updates             │   │
│  │  • Badge count sync                 • Deep link handling             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Notification Store Service

```typescript
// services/inApp/notificationStore.service.ts
export class NotificationStoreService {
  async createNotification(
    userId: string,
    notification: InAppNotificationInput
  ): Promise<InAppNotification> {
    const notificationRecord = await prisma.inAppNotification.create({
      data: {
        id: generateUUID(),
        userId,
        type: notification.type,
        category: notification.category,
        priority: notification.priority || 'normal',
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
        actionUrl: notification.actionUrl,
        actionType: notification.actionType,
        actionData: notification.actionData,
        metadata: notification.metadata,
        expiresAt: notification.expiresAt,
        isRead: false
      }
    });

    // Emit real-time event
    await this.emitToUser(userId, 'notification:new', {
      notification: this.sanitizeForClient(notificationRecord)
    });

    // Update badge count
    await this.updateBadgeCount(userId);

    return notificationRecord;
  }

  async getNotifications(
    userId: string,
    options: NotificationQueryOptions
  ): Promise<PaginatedNotifications> {
    const {
      limit = 20,
      cursor,
      category,
      isRead,
      priority
    } = options;

    const where: any = { userId };
    
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead;
    if (priority) where.priority = priority;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit + 1 // Get one extra to determine if there's more
      }),
      prisma.inAppNotification.count({ where: { userId } }),
      prisma.inAppNotification.count({ where: { userId, isRead: false } })
    ]);

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasMore 
      ? items[items.length - 1]?.createdAt.toISOString() 
      : null;

    return {
      items: items.map(n => this.sanitizeForClient(n)),
      pagination: {
        hasMore,
        nextCursor,
        totalCount,
        unreadCount
      }
    };
  }

  async markAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    await prisma.inAppNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId // Ensure user owns these notifications
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    await this.updateBadgeCount(userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.inAppNotification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    await this.updateBadgeCount(userId);
    return result.count;
  }

  async deleteNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    await prisma.inAppNotification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId
      }
    });

    await this.updateBadgeCount(userId);
  }

  async archiveNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<void> {
    await prisma.inAppNotification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        isArchived: true,
        archivedAt: new Date()
      }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.inAppNotification.count({
      where: {
        userId,
        isRead: false,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
  }

  private async updateBadgeCount(userId: string): Promise<void> {
    const count = await this.getUnreadCount(userId);
    
    // Emit badge update
    await this.emitToUser(userId, 'notification:badge', { count });

    // Update push badge for next notification
    await this.updatePushBadge(userId, count);
  }

  private async updatePushBadge(userId: string, count: number): Promise<void> {
    // Store for next push notification
    await prisma.userMetadata.upsert({
      where: { userId },
      update: { pushBadgeCount: count },
      create: { userId, pushBadgeCount: count }
    });
  }

  private async emitToUser(
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    // Emit via Socket.io
    io.to(`user:${userId}`).emit(event, data);
  }

  private sanitizeForClient(notification: any): ClientNotification {
    return {
      id: notification.id,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
      actionUrl: notification.actionUrl,
      actionType: notification.actionType,
      actionData: notification.actionData,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString()
    };
  }

  // Cleanup old notifications
  async cleanupOldNotifications(maxAgeDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    
    const result = await prisma.inAppNotification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isArchived: true
      }
    });

    return result.count;
  }
}
```

### 5.3 WebSocket Real-Time Service

```typescript
// services/inApp/realtime.service.ts
import { Server, Socket } from 'socket.io';

export class RealtimeNotificationService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // Authenticate and join user room
      socket.on('auth', async (token: string) => {
        try {
          const user = await this.authenticateSocket(token);
          socket.data.userId = user.id;
          socket.join(`user:${user.id}`);
          
          // Send initial unread count
          const unreadCount = await notificationStore.getUnreadCount(user.id);
          socket.emit('notification:badge', { count: unreadCount });
          
          socket.emit('auth:success', { userId: user.id });
        } catch (error) {
          socket.emit('auth:error', { message: 'Authentication failed' });
        }
      });

      // Handle notification read
      socket.on('notification:read', async (data: { notificationIds: string[] }) => {
        const userId = socket.data.userId;
        if (!userId) return;

        await notificationStore.markAsRead(userId, data.notificationIds);
        socket.emit('notification:read:success', { notificationIds: data.notificationIds });
      });

      // Handle mark all read
      socket.on('notification:readAll', async () => {
        const userId = socket.data.userId;
        if (!userId) return;

        const count = await notificationStore.markAllAsRead(userId);
        socket.emit('notification:readAll:success', { count });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });
  }

  async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  async broadcastToUsers(userIds: string[], event: string, data: any): Promise<void> {
    const rooms = userIds.map(id => `user:${id}`);
    this.io.to(rooms).emit(event, data);
  }

  async broadcastToAll(event: string, data: any): Promise<void> {
    this.io.emit(event, data);
  }

  private async authenticateSocket(token: string): Promise<User> {
    // Verify JWT and return user
    return authService.verifyToken(token);
  }
}
```

---

## 6. Behavioral Trigger Engine

### 6.1 Decision Framework

The Behavioral Trigger Engine determines when AI should initiate contact versus wait for user engagement. This is the core intelligence layer of the notification system.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BEHAVIORAL TRIGGER DECISION FRAMEWORK                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              INPUT SIGNALS                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   EMOTIONAL  │ │  ENGAGEMENT  │ │   CONTEXTUAL │ │    CRISIS    │       │
│  │    STATE     │ │    PATTERN   │ │    SIGNALS   │ │  INDICATORS  │       │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘       │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DECISION MATRIX                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │   CRISIS RISK HIGH ───────────────────────────────────────────────▶ │   │
│  │   │                                                                  │   │
│  │   └──► IMMEDIATE CHECK-IN (Crisis Protocol)                         │   │
│  │                                                                      │   │
│  │   EMOTIONAL DECLINE + LOW ENGAGEMENT ─────────────────────────────▶ │   │
│  │   │                                                                  │   │
│  │   └──► PROACTIVE CHECK-IN (Supportive Approach)                     │   │
│  │                                                                      │   │
│  │   ENGAGEMENT OPPORTUNITY + POSITIVE CONTEXT ──────────────────────▶ │   │
│  │   │                                                                  │   │
│  │   └──► PROACTIVE ENGAGEMENT (Casual Approach)                       │   │
│  │                                                                      │   │
│  │   USER IN FLOW STATE / DO NOT DISTURB ────────────────────────────▶ │   │
│  │   │                                                                  │   │
│  │   └──► WAIT (Queue for natural break)                               │   │
│  │                                                                      │   │
│  │   RECENT INTERACTION / SATURATION RISK ───────────────────────────▶ │   │
│  │   │                                                                  │   │
│  │   └──► WAIT (Respect user space)                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ACTION SELECTION                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  • Message tone & content  • Channel selection  • Timing            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Trigger Rules Engine

```typescript
// engine/behavioralTrigger.engine.ts

interface TriggerDecision {
  action: 'initiate' | 'wait' | 'escalate';
  confidence: number;
  approach?: 'casual' | 'supportive' | 'direct' | 'crisis';
  timing?: Date;
  channel?: Channel;
  reasoning: string[];
  suggestedContent?: string;
}

interface TriggerRules {
  // Crisis overrides - always trigger
  crisis: {
    selfHarmDetected: boolean;
    suicideIdeation: boolean;
    crisisKeywords: string[];
    action: 'escalate';
  };
  
  // Emotional distress patterns
  emotionalDistress: {
    moodDeclineDays: number;
    sentimentThreshold: number;
    volatilityThreshold: number;
    action: 'initiate';
    approach: 'supportive';
  };
  
  // Engagement opportunity
  engagementOpportunity: {
    highEngagementProbability: number;
    optimalTimingScore: number;
    userReceptiveContext: boolean;
    action: 'initiate';
    approach: 'casual';
  };
  
  // Wait conditions
  waitConditions: {
    recentInteraction: { hours: number };
    notificationSaturation: { count24h: number };
    doNotDisturb: boolean;
    flowStateDetected: boolean;
    action: 'wait';
  };
}

export class BehavioralTriggerEngine {
  private rules: TriggerRules;
  private mlModel: CheckInPredictionModel;

  constructor() {
    this.rules = this.loadRules();
    this.mlModel = new CheckInPredictionModel();
  }

  async evaluate(userId: string, context: UserContext): Promise<TriggerDecision> {
    const signals = await this.collectSignals(userId);
    
    // Priority 1: Crisis detection (always overrides)
    const crisisCheck = this.checkCrisisIndicators(signals);
    if (crisisCheck.isCrisis) {
      return this.createCrisisDecision(crisisCheck);
    }

    // Priority 2: ML model prediction
    const mlPrediction = await this.mlModel.predict(signals);
    
    // Priority 3: Rule-based evaluation
    const ruleDecision = this.applyRules(signals, context);
    
    // Combine ML and rule decisions
    return this.combineDecisions(mlPrediction, ruleDecision, signals);
  }

  private checkCrisisIndicators(signals: UserSignals): CrisisCheck {
    const indicators: string[] = [];
    let severity = 0;

    // Check for self-harm language
    if (signals.risk.selfHarmLanguageDetected) {
      indicators.push('self_harm_language');
      severity = Math.max(severity, 10);
    }

    // Check crisis keywords in recent content
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'not worth living',
      'better off dead', 'hurt myself', 'self harm'
    ];
    
    const recentContent = this.getRecentUserContent(signals.userId);
    for (const content of recentContent) {
      const lowerContent = content.toLowerCase();
      for (const keyword of crisisKeywords) {
        if (lowerContent.includes(keyword)) {
          indicators.push(`keyword: ${keyword}`);
          severity = Math.max(severity, 9);
        }
      }
    }

    // Check for rapid emotional decline
    if (signals.emotional.sentimentTrend === 'declining' && 
        signals.emotional.volatilityScore > 0.7) {
      indicators.push('rapid_emotional_decline');
      severity = Math.max(severity, 7);
    }

    // Check isolation patterns
    if (signals.risk.isolationScore > 0.8 && 
        signals.engagement.sessionCount7d < 2) {
      indicators.push('severe_isolation');
      severity = Math.max(severity, 6);
    }

    return {
      isCrisis: severity >= 7,
      severity,
      indicators
    };
  }

  private applyRules(signals: UserSignals, context: UserContext): TriggerDecision {
    const reasoning: string[] = [];

    // Check wait conditions first
    if (this.shouldWait(signals, context)) {
      return {
        action: 'wait',
        confidence: 0.8,
        reasoning: this.getWaitReasons(signals, context),
        timing: this.calculateNextCheckTime(signals)
      };
    }

    // Check emotional distress
    if (this.detectEmotionalDistress(signals)) {
      reasoning.push('Emotional distress pattern detected');
      reasoning.push(`Mood trend: ${signals.emotional.sentimentTrend}`);
      reasoning.push(`Volatility: ${(signals.emotional.volatilityScore * 100).toFixed(0)}%`);

      return {
        action: 'initiate',
        confidence: 0.75,
        approach: 'supportive',
        channel: this.selectChannel(signals, 'supportive'),
        timing: this.calculateOptimalTiming(signals),
        reasoning,
        suggestedContent: this.generateSupportiveContent(signals)
      };
    }

    // Check engagement opportunity
    if (this.detectEngagementOpportunity(signals)) {
      reasoning.push('High engagement opportunity detected');
      reasoning.push(`User typically active at this time`);

      return {
        action: 'initiate',
        confidence: 0.7,
        approach: 'casual',
        channel: this.selectChannel(signals, 'casual'),
        timing: this.calculateOptimalTiming(signals),
        reasoning,
        suggestedContent: this.generateCasualContent(signals)
      };
    }

    // Default: wait
    return {
      action: 'wait',
      confidence: 0.6,
      reasoning: ['No trigger conditions met'],
      timing: this.calculateNextCheckTime(signals)
    };
  }

  private shouldWait(signals: UserSignals, context: UserContext): boolean {
    // Recent interaction check
    const hoursSinceLastInteraction = 
      (Date.now() - signals.engagement.lastActiveAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastInteraction < 4) {
      return true;
    }

    // Notification saturation check
    const recentNotifications = this.getRecentNotificationCount(signals.userId, 24);
    if (recentNotifications >= 3) {
      return true;
    }

    // Do not disturb check
    if (context.doNotDisturb || this.isInQuietHours(signals)) {
      return true;
    }

    // Flow state detection (user actively engaged in app)
    if (context.currentSessionDuration > 10 * 60 * 1000) { // 10+ minutes
      return true;
    }

    return false;
  }

  private detectEmotionalDistress(signals: UserSignals): boolean {
    // Sustained mood decline
    if (signals.emotional.sentimentTrend === 'declining' &&
        signals.emotional.recentMoodEntries.length >= 3) {
      return true;
    }

    // High volatility indicating instability
    if (signals.emotional.volatilityScore > 0.7) {
      return true;
    }

    // Significant behavioral changes
    if (Math.abs(signals.behavioral.sleepPatternDeviation) > 0.6 ||
        Math.abs(signals.behavioral.activityLevelChange) > 0.6) {
      return true;
    }

    return false;
  }

  private detectEngagementOpportunity(signals: UserSignals): boolean {
    // User has been inactive but typically engages at this time
    const hoursSinceActive = 
      (Date.now() - signals.engagement.lastActiveAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceActive > 24 && hoursSinceActive < 72) {
      // Check if this is user's typical active time
      if (this.isTypicalActiveTime(signals)) {
        return true;
      }
    }

    // Positive context signals
    if (signals.contextual.dayOfWeek === 'saturday' || 
        signals.contextual.dayOfWeek === 'sunday') {
      // Weekend - higher engagement likelihood
      if (signals.engagement.sessionCount7d > 3) {
        return true;
      }
    }

    return false;
  }

  private selectChannel(
    signals: UserSignals, 
    approach: string
  ): Channel {
    // Priority: Push > In-App > SMS
    
    if (approach === 'crisis') {
      // Crisis: use all available channels
      return 'multi';
    }

    // Check push availability
    const hasPush = this.hasActivePushTokens(signals.userId);
    if (hasPush) {
      return 'push';
    }

    // Check if user is currently active in app
    if (signals.engagement.lastActiveAt > new Date(Date.now() - 5 * 60 * 1000)) {
      return 'in-app';
    }

    // Fallback to SMS for high priority
    if (approach === 'supportive' && signals.userPreferences?.smsEnabled) {
      return 'sms';
    }

    return 'in-app'; // Default - will be seen on next app open
  }

  private calculateOptimalTiming(signals: UserSignals): Date {
    const now = new Date();
    const userTimezone = signals.contextual.timezone || 'UTC';
    
    // Get user's typical active hours
    const activeHours = this.getUserActiveHours(signals.userId);
    
    // If currently in active hours, send now
    const currentHour = parseInt(
      now.toLocaleString('en-US', { 
        timeZone: userTimezone, 
        hour: 'numeric',
        hour12: false 
      })
    );
    
    if (activeHours.includes(currentHour)) {
      return now;
    }

    // Schedule for next active period
    const nextActiveHour = activeHours.find(h => h > currentHour) || activeHours[0];
    const nextTime = new Date(now);
    nextTime.setHours(nextActiveHour, 0, 0, 0);
    
    if (nextActiveHour <= currentHour) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  private generateSupportiveContent(signals: UserSignals): string {
    const templates = [
      "Hi {{name}}, I noticed things might feel a bit heavy right now. I'm here if you want to talk.",
      "{{name}}, checking in with you. How are you feeling today?",
      "Hey {{name}}, sometimes we all need a little support. I'm here for you whenever you're ready."
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateCasualContent(signals: UserSignals): string {
    const templates = [
      "Hi {{name}}! Have a moment for a quick wellness check?",
      "Hey {{name}}! Your daily insight is ready when you are.",
      "{{name}}, a quick thought for your day - want to see?"
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private createCrisisDecision(crisisCheck: CrisisCheck): TriggerDecision {
    return {
      action: 'escalate',
      confidence: 1.0,
      approach: 'crisis',
      channel: 'multi',
      timing: new Date(), // Immediate
      reasoning: [
        'CRISIS INDICATORS DETECTED:',
        ...crisisCheck.indicators,
        `Severity level: ${crisisCheck.severity}/10`
      ],
      suggestedContent: this.getCrisisContent()
    };
  }

  private getCrisisContent(): string {
    return "I'm really concerned about you. Please know that help is available 24/7. " +
           "You can reach the Crisis Text Line by texting HOME to 741741, " +
           "or call the National Suicide Prevention Lifeline at 988. " +
           "You are not alone.";
  }

  private combineDecisions(
    mlPrediction: CheckInPrediction,
    ruleDecision: TriggerDecision,
    signals: UserSignals
  ): TriggerDecision {
    // If ML and rules agree, use that decision
    if (mlPrediction.shouldInitiate && ruleDecision.action === 'initiate') {
      return {
        ...ruleDecision,
        confidence: Math.max(mlPrediction.confidence, ruleDecision.confidence)
      };
    }

    // If ML says initiate but rules say wait, check ML confidence
    if (mlPrediction.shouldInitiate && ruleDecision.action === 'wait') {
      if (mlPrediction.confidence > 0.8) {
        return {
          action: 'initiate',
          confidence: mlPrediction.confidence,
          approach: mlPrediction.recommendedApproach,
          timing: mlPrediction.optimalTiming,
          reasoning: [
            ...ruleDecision.reasoning,
            'ML model strongly suggests engagement',
            ...mlPrediction.reasoning
          ]
        };
      }
    }

    // Default to rule decision
    return ruleDecision;
  }
}
```

### 6.3 Trigger Frequency Limits

```typescript
// config/triggerLimits.config.ts
export const triggerFrequencyLimits = {
  // Maximum proactive check-ins per time period
  proactiveCheckIns: {
    perHour: 1,
    perDay: 3,
    perWeek: 8
  },
  
  // Challenge delivery limits
  challenges: {
    perDay: 1, // One daily challenge
    perWeek: 7 // Max 7 per week
  },
  
  // Crisis overrides (no limits)
  crisis: {
    unlimited: true
  },
  
  // Cooldown periods after user interaction
  cooldowns: {
    afterUserMessage: 30 * 60 * 1000, // 30 minutes
    afterAppOpen: 15 * 60 * 1000,     // 15 minutes
    afterCheckInResponse: 60 * 60 * 1000 // 1 hour
  },
  
  // Quiet hours (no proactive triggers)
  quietHours: {
    start: 21, // 9 PM
    end: 8,    // 8 AM
    timezone: 'user' // Use user's timezone
  }
};

export class FrequencyLimiter {
  async canTrigger(
    userId: string,
    triggerType: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = triggerFrequencyLimits[triggerType];
    
    if (!limits) {
      return { allowed: true };
    }

    // Crisis triggers bypass all limits
    if (limits.unlimited) {
      return { allowed: true };
    }

    // Check per-hour limit
    if (limits.perHour) {
      const hourCount = await this.getTriggerCount(userId, triggerType, '1 hour');
      if (hourCount >= limits.perHour) {
        return { 
          allowed: false, 
          reason: `Hourly limit reached (${limits.perHour})` 
        };
      }
    }

    // Check per-day limit
    if (limits.perDay) {
      const dayCount = await this.getTriggerCount(userId, triggerType, '1 day');
      if (dayCount >= limits.perDay) {
        return { 
          allowed: false, 
          reason: `Daily limit reached (${limits.perDay})` 
        };
      }
    }

    // Check cooldown periods
    const lastInteraction = await this.getLastUserInteraction(userId);
    if (lastInteraction) {
      const cooldown = triggerFrequencyLimits.cooldowns.afterUserMessage;
      if (Date.now() - lastInteraction.getTime() < cooldown) {
        return { 
          allowed: false, 
          reason: 'Cooldown period active' 
        };
      }
    }

    return { allowed: true };
  }

  private async getTriggerCount(
    userId: string,
    triggerType: string,
    timeWindow: string
  ): Promise<number> {
    return prisma.notificationTrigger.count({
      where: {
        userId,
        type: triggerType,
        createdAt: {
          gte: new Date(Date.now() - this.parseTimeWindow(timeWindow))
        }
      }
    });
  }

  private parseTimeWindow(window: string): number {
    const [amount, unit] = window.split(' ');
    const multipliers: Record<string, number> = {
      'minute': 60 * 1000,
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000
    };
    return parseInt(amount) * (multipliers[unit] || 0);
  }
}
```

---

## 7. Data Models

### 7.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

// User notification preferences
model UserNotificationPreferences {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  
  // Channel preferences
  pushEnabled       Boolean  @default(true)
  smsEnabled        Boolean  @default(false)
  emailEnabled      Boolean  @default(true)
  inAppEnabled      Boolean  @default(true)
  
  // Quiet hours
  quietHoursStart   String?  // "21:00"
  quietHoursEnd     String?  // "08:00"
  quietHoursTimezone String? // "America/New_York"
  
  // Category preferences
  allowedCategories String[] @default([])
  blockedCategories String[] @default([])
  
  // Frequency limits
  maxDailyNotifications Int @default(10)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Push notification tokens
model PushToken {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  platform    String   // ios, android
  deviceInfo  Json?
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([token])
}

// Web push subscriptions
model WebPushSubscription {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}

// In-app notifications
model InAppNotification {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  type        String   // challenge, check_in, system, etc.
  category    String   // engagement, wellness, crisis, etc.
  priority    String   @default("normal") // low, normal, high, urgent
  
  title       String
  body        String
  imageUrl    String?
  
  actionUrl   String?
  actionType  String?
  actionData  Json?
  
  metadata    Json?
  
  isRead      Boolean  @default(false)
  readAt      DateTime?
  isArchived  Boolean  @default(false)
  archivedAt  DateTime?
  
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([userId, isRead])
  @@index([createdAt])
}

// SMS deliveries
model SmsDelivery {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  
  messageSid  String   @unique
  to          String
  body        String
  template    String?
  
  status      String   @default("pending") // pending, sent, delivered, failed
  errorCode   String?
  
  sentAt      DateTime @default(now())
  deliveredAt DateTime?
  
  @@index([userId])
  @@index([messageSid])
}

// Notification delivery tracking
model NotificationDelivery {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  notificationId  String
  channel         String   // push, sms, in-app, email
  
  sentAt          DateTime @default(now())
  deliveredAt     DateTime?
  openedAt        DateTime?
  
  metadata        Json?
  
  @@index([userId])
  @@index([notificationId])
}

// Challenge delivery tracking
model ChallengeDelivery {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  challengeId String
  
  deliveredAt DateTime @default(now())
  openedAt    DateTime?
  completedAt DateTime?
  
  @@index([userId])
  @@index([deliveredAt])
}

// Challenge preferences
model ChallengePreferences {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  
  isActive          Boolean  @default(true)
  timezone          String   @default("UTC")
  preferredHour     Int      @default(9)
  preferredMinute   Int      @default(0)
  activeDays        String[] @default(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
  
  preferredCategories String[] @default([])
  excludedCategories  String[] @default([])
  difficultyLevel     String   @default("beginner")
  
  notificationChannels Json    @default("{\"push\": true, \"sms\": false, \"inApp\": true}")
  
  adaptiveTiming      Boolean  @default(true)
  quietHoursStart     String?  // "22:00"
  quietHoursEnd       String?  // "08:00"
  
  streakCount         Int      @default(0)
  lastDeliveredAt     DateTime?
  nextDeliveryAt      DateTime?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// SMS templates
model SmsTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  body        String
  category    String   // engagement, wellness, crisis, reminder
  maxLength   Int      @default(160)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Notification triggers (for analytics)
model NotificationTrigger {
  id          String   @id @default(uuid())
  userId      String
  type        String   // proactive_checkin, challenge, etc.
  triggerReason Json?  // Store the reasoning
  wasAccepted Boolean? // Did user engage?
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
}
```

---

## 8. API Specifications

### 8.1 REST API Endpoints

```yaml
# API Specification

# Push Token Management
POST /api/v1/notifications/push/token
  body:
    token: string
    platform: "ios" | "android"
    deviceInfo: object
  response: { success: boolean }

DELETE /api/v1/notifications/push/token
  body:
    token: string
  response: { success: boolean }

# Web Push Subscription
POST /api/v1/notifications/webpush/subscribe
  body:
    subscription: PushSubscription
  response: { success: boolean }

DELETE /api/v1/notifications/webpush/unsubscribe
  response: { success: boolean }

GET /api/v1/notifications/webpush/vapid-public-key
  response: { publicKey: string }

# In-App Notifications
GET /api/v1/notifications
  query:
    limit: number (default: 20)
    cursor: string (optional)
    category: string (optional)
    isRead: boolean (optional)
  response:
    items: Notification[]
    pagination:
      hasMore: boolean
      nextCursor: string
      totalCount: number
      unreadCount: number

PATCH /api/v1/notifications/read
  body:
    notificationIds: string[]
  response: { updated: number }

PATCH /api/v1/notifications/read-all
  response: { updated: number }

DELETE /api/v1/notifications
  body:
    notificationIds: string[]
  response: { deleted: number }

GET /api/v1/notifications/unread-count
  response: { count: number }

# Challenge Preferences
GET /api/v1/challenges/preferences
  response: ChallengePreferences

PUT /api/v1/challenges/preferences
  body: ChallengePreferences
  response: ChallengePreferences

POST /api/v1/challenges/preferences/pause
  body:
    durationDays: number
  response: { pausedUntil: string }

# Notification Preferences
GET /api/v1/notifications/preferences
  response: NotificationPreferences

PUT /api/v1/notifications/preferences
  body: NotificationPreferences
  response: NotificationPreferences

# SMS Opt-out webhook (Twilio)
POST /webhooks/twilio/incoming
  body:
    From: string
    Body: string
    MessageSid: string
  response: 200 OK

POST /webhooks/twilio/status
  body:
    MessageSid: string
    MessageStatus: string
    ErrorCode: string (optional)
  response: 200 OK
```

### 8.2 WebSocket Events

```typescript
// Client to Server Events
interface ClientEvents {
  'auth': (token: string) => void;
  'notification:read': (data: { notificationIds: string[] }) => void;
  'notification:readAll': () => void;
  'notification:delete': (data: { notificationIds: string[] }) => void;
  'ping': () => void;
}

// Server to Client Events
interface ServerEvents {
  'auth:success': (data: { userId: string }) => void;
  'auth:error': (data: { message: string }) => void;
  
  'notification:new': (data: { notification: ClientNotification }) => void;
  'notification:updated': (data: { notification: ClientNotification }) => void;
  'notification:deleted': (data: { notificationIds: string[] }) => void;
  'notification:badge': (data: { count: number }) => void;
  
  'notification:read:success': (data: { notificationIds: string[] }) => void;
  'notification:readAll:success': (data: { count: number }) => void;
  
  'pong': () => void;
}
```

---

## 9. Deployment & Scaling

### 9.1 Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         KUBERNETES CLUSTER                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │  │  API Servers    │    │  Worker Pods    │    │  WebSocket      │  │   │
│  │  │  (3 replicas)   │    │  (5 replicas)   │    │  Servers        │  │   │
│  │  │                 │    │                 │    │  (3 replicas)   │  │   │
│  │  │ • Challenge API │    │ • Challenge Gen │    │                 │  │   │
│  │  │ • Preferences   │    │ • Check-in Eng  │    │ • Real-time     │  │   │
│  │  │ • Webhooks      │    │ • SMS Worker    │    │   delivery      │  │   │
│  │  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │   │
│  │           │                      │                      │           │   │
│  │           └──────────────────────┼──────────────────────┘           │   │
│  │                                  │                                  │   │
│  │  ┌───────────────────────────────┴───────────────────────────────┐  │   │
│  │  │                      REDIS CLUSTER                             │  │   │
│  │  │  • BullMQ Job Queues  • Session Store  • Rate Limiting        │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │                      EXTERNAL SERVICES                                │  │
│  ├─────────────────────────────────┼─────────────────────────────────────┤  │
│  │  ┌─────────────┐  ┌─────────────┼─────────────┐  ┌─────────────┐     │  │
│  │  │  Firebase   │  │   Twilio    │             │  │  PostgreSQL │     │  │
│  │  │    FCM      │  │    SMS      │             │  │   Primary   │     │  │
│  │  └─────────────┘  └─────────────┘             │  └─────────────┘     │  │
│  │                                               │  ┌─────────────┐     │  │
│  │  ┌─────────────┐  ┌─────────────┐             │  │ ClickHouse  │     │  │
│  │  │   VAPID     │  │   AI/ML     │             │  │  Analytics  │     │  │
│  │  │  Web Push   │  │   Service   │             │  └─────────────┘     │  │
│  │  └─────────────┘  └─────────────┘             │                      │  │
│  └───────────────────────────────────────────────┘                      │  │
│                                                                          │  │
└──────────────────────────────────────────────────────────────────────────┘  │
```

### 9.2 Environment Configuration

```yaml
# config/production.yaml
notification:
  # Challenge Scheduler
  challenge:
    cronExpression: "*/5 * * * *"
    batchSize: 500
    retryAttempts: 3
    retryBackoffMs: 60000
    
  # Push Notifications
  push:
    fcm:
      projectId: "${FIREBASE_PROJECT_ID}"
      credentialsPath: "/secrets/firebase-credentials.json"
    webpush:
      vapidSubject: "mailto:support@mindmate.ai"
      vapidPublicKey: "${VAPID_PUBLIC_KEY}"
      vapidPrivateKey: "${VAPID_PRIVATE_KEY}"
      
  # SMS
  sms:
    provider: "twilio"
    accountSid: "${TWILIO_ACCOUNT_SID}"
    authToken: "${TWILIO_AUTH_TOKEN}"
    fromNumber: "${TWILIO_PHONE_NUMBER}"
    messagingServiceSid: "${TWILIO_MESSAGING_SERVICE_SID}"
    rateLimitPerSecond: 10
    
  # Behavioral Trigger Engine
  triggerEngine:
    evaluationIntervalMinutes: 240  # 4 hours
    mlModelPath: "/models/checkin-prediction"
    
  # Rate Limiting
  rateLimits:
    pushPerUserPerHour: 10
    smsPerUserPerDay: 5
    globalPushPerSecond: 1000
    
  # Quiet Hours
  quietHours:
    enabled: true
    defaultStart: "21:00"
    defaultEnd: "08:00"

redis:
  cluster:
    - host: redis-1.mindmate.internal
      port: 6379
    - host: redis-2.mindmate.internal
      port: 6379
    - host: redis-3.mindmate.internal
      port: 6379

queues:
  dailyChallenges:
    name: "daily-challenges"
    concurrency: 10
    maxAttempts: 3
  proactiveCheckins:
    name: "proactive-checkins"
    concurrency: 5
    maxAttempts: 5
  smsDelivery:
    name: "sms-delivery"
    concurrency: 20
    maxAttempts: 3
```

### 9.3 Monitoring & Alerting

```typescript
// monitoring/notificationMetrics.ts
export class NotificationMetrics {
  // Delivery metrics
  recordDelivery(notification: Notification, channel: string): void {
    metrics.counter('notification_delivered_total', {
      channel,
      type: notification.type,
      priority: notification.priority
    }).inc();
  }

  recordOpen(notification: Notification, channel: string): void {
    metrics.counter('notification_opened_total', {
      channel,
      type: notification.type
    }).inc();
    
    // Track time to open
    const timeToOpen = Date.now() - notification.sentAt.getTime();
    metrics.histogram('notification_time_to_open_seconds')
      .observe(timeToOpen / 1000);
  }

  recordFailure(notification: Notification, channel: string, error: string): void {
    metrics.counter('notification_failed_total', {
      channel,
      type: notification.type,
      error: error.substring(0, 50) // Truncate for label
    }).inc();
  }

  // Trigger engine metrics
  recordTriggerEvaluation(userId: string, decision: TriggerDecision): void {
    metrics.counter('trigger_evaluation_total', {
      action: decision.action,
      approach: decision.approach || 'none'
    }).inc();
    
    metrics.gauge('trigger_confidence')
      .set(decision.confidence);
  }

  // Queue metrics
  recordQueueDepth(queueName: string, depth: number): void {
    metrics.gauge('queue_depth', { queue: queueName }).set(depth);
  }

  recordJobDuration(queueName: string, durationMs: number): void {
    metrics.histogram('job_duration_seconds', { queue: queueName })
      .observe(durationMs / 1000);
  }
}

// Key alerts
const alerts = {
  highFailureRate: {
    condition: 'notification_failed_total / notification_delivered_total > 0.1',
    duration: '5m',
    severity: 'warning'
  },
  queueBacklog: {
    condition: 'queue_depth > 10000',
    duration: '10m',
    severity: 'critical'
  },
  crisisTrigger: {
    condition: 'trigger_evaluation_total{action="escalate"} > 0',
    duration: '0s',
    severity: 'critical'
  },
  smsOptOutSpike: {
    condition: 'rate(sms_opt_out_total[1h]) > 10',
    duration: '5m',
    severity: 'warning'
  }
};
```

---

## 10. Security Considerations

### 10.1 Data Protection

| Concern | Mitigation |
|---------|------------|
| Push Token Storage | Encrypted at rest, access controlled |
| Phone Numbers | Hashed for analytics, encrypted in DB |
| Message Content | PII scrubbed from logs |
| Webhook Security | HMAC signature verification |
| API Rate Limiting | Per-user and global limits |

### 10.2 Compliance

- **GDPR**: User consent tracking, right to deletion, data export
- **TCPA**: Opt-in required for SMS, opt-out handling
- **COPPA**: Age verification for users under 13
- **HIPAA**: BAAs with vendors if handling health data

---

## Appendix A: Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `PUSH_TOKEN_INVALID` | FCM token no longer valid | Remove token, request re-registration |
| `PUSH_RATE_LIMITED` | Too many push notifications | Back off and retry |
| `SMS_OPT_OUT` | User opted out of SMS | Disable SMS for user |
| `SMS_INVALID_NUMBER` | Phone number invalid | Prompt user to update |
| `WEBPUSH_EXPIRED` | Subscription expired | Remove subscription |
| `QUEUE_FULL` | Job queue at capacity | Scale workers |

---

## Appendix B: Testing Strategy

```typescript
// Test scenarios
const testScenarios = {
  // Unit tests
  challengeScheduler: [
    'delivers at correct timezone time',
    'respects user quiet hours',
    'handles daylight saving time transitions',
    'skips if already delivered today'
  ],
  
  triggerEngine: [
    'detects crisis indicators',
    'respects frequency limits',
    'ML model predictions are accurate',
    'combines rules and ML correctly'
  ],
  
  pushDelivery: [
    'sends to all user devices',
    'cleans up invalid tokens',
    'handles FCM errors gracefully',
    'respects platform differences'
  ],
  
  smsFallback: [
    'triggers on push failure',
    'respects quiet hours',
    'handles opt-out correctly',
    'validates phone numbers'
  ],
  
  // Integration tests
  endToEnd: [
    'user receives challenge at preferred time',
    'proactive check-in triggers appropriately',
    'SMS fallback works when push fails',
    'in-app notifications sync across devices'
  ],
  
  // Load tests
  performance: [
    '100K concurrent challenge deliveries',
    '10K WebSocket connections',
    '1M notifications per hour'
  ]
};
```

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: Agent 33 - Notification & Scheduler System Architect*
