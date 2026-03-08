# MindMate AI - Complete Notification System Specification

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Author**: Agent 17 - Notification System Designer
- **Status**: Production Ready
- **Target Platform**: Mobile (iOS/Android) & Web

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Notification Types & Categories](#2-notification-types--categories)
3. [Scheduling Logic](#3-scheduling-logic)
4. [Personalization Engine](#4-personalization-engine)
5. [Frequency Caps & Limits](#5-frequency-caps--limits)
6. [Quiet Hours & Do Not Disturb](#6-quiet-hours--do-not-disturb)
7. [User Preferences System](#7-user-preferences-system)
8. [Notification Message Templates (100+)](#8-notification-message-templates)
9. [AI Decision Logic](#9-ai-decision-logic)
10. [Notification Preference Settings Screen](#10-notification-preference-settings-screen)
11. [Technical Implementation](#11-technical-implementation)
12. [Analytics & Monitoring](#12-analytics--monitoring)

---

## 1. Executive Summary

The MindMate AI Notification System is an intelligent, adaptive notification framework designed to deliver timely, relevant, and personalized communications to users while respecting their preferences and minimizing notification fatigue.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Relevance** | Every notification must provide clear value to the user |
| **Timeliness** | Deliver notifications at optimal moments for engagement |
| **Respect** | Honor user preferences, quiet hours, and frequency limits |
| **Personalization** | Adapt content and timing based on user behavior and context |
| **Transparency** | Clear explanations for why notifications are sent |

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Triggers   │  │   Content    │  │   Delivery   │          │
│  │   Engine     │→ │   Engine     │→ │   Engine     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↑                 ↑                 ↑                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              PERSONALIZATION ENGINE                   │      │
│  │  • User Profile  • Context Awareness  • ML Models    │      │
│  └──────────────────────────────────────────────────────┘      │
│         ↑                                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              USER PREFERENCES STORE                   │      │
│  │  • Categories  • Quiet Hours  • Frequency Caps       │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Notification Types & Categories

### 2.1 Primary Categories

| Category | Code | Priority | Default State | Description |
|----------|------|----------|---------------|-------------|
| **Wellness Check-ins** | WC | High | Enabled | Daily mood and wellness prompts |
| **Mental Health Insights** | MHI | Medium | Enabled | AI-generated insights and patterns |
| **Session Reminders** | SR | High | Enabled | Therapy session and appointment alerts |
| **Journal Prompts** | JP | Medium | Enabled | Guided journaling suggestions |
| **Mindfulness Moments** | MM | Low | Enabled | Breathing and meditation reminders |
| **Goal Progress** | GP | Medium | Enabled | Milestone and achievement updates |
| **Crisis Support** | CS | Critical | Always On | Emergency resources and interventions |
| **Community Updates** | CU | Low | Disabled | Forum activity and peer support |
| **Educational Content** | EC | Low | Enabled | Tips, articles, and learning materials |
| **App Updates** | AU | Low | Enabled | Feature updates and improvements |
| **Social Connections** | SC | Medium | Disabled | Messages from connections |
| **Habit Reminders** | HR | Medium | Enabled | Custom habit tracking prompts |

### 2.2 Priority Levels

```typescript
enum NotificationPriority {
  CRITICAL = 0,    // Always delivered, bypasses all restrictions
  HIGH = 1,        // Delivered unless explicitly disabled
  MEDIUM = 2,      // Respects frequency caps and quiet hours
  LOW = 3,         // Heavily throttled, first to be dropped
  BACKGROUND = 4   // Silent, in-app only
}
```

### 2.3 Delivery Channels

| Channel | Use Cases | User Control |
|---------|-----------|--------------|
| **Push Notification** | High priority, time-sensitive | Full control |
| **In-App Banner** | Medium priority, contextual | Partial control |
| **Badge Update** | Passive awareness | No control |
| **Email Digest** | Summaries, low priority | Full control |
| **SMS** | Critical only | Critical only |
| **Widget Update** | At-a-glance info | No control |

### 2.4 Notification Subtypes

#### Wellness Check-ins (WC)
- `WC-MORNING`: Morning mood check
- `WC-EVENING`: Evening reflection
- `WC-WEEKLY`: Weekly wellness summary
- `WC-STRESS`: Stress level assessment
- `WC-SLEEP`: Sleep quality check

#### Mental Health Insights (MHI)
- `MHI-PATTERN`: Pattern detection alerts
- `MHI-CORRELATION`: Correlation discoveries
- `MHI-MOOD-TREND`: Mood trend analysis
- `MHI-TRIGGER`: Trigger identification
- `MHI-PROGRESS`: Progress insights

#### Session Reminders (SR)
- `SR-UPCOMING`: Upcoming session reminder
- `SR-PREP`: Session preparation prompt
- `SR-FOLLOWUP`: Post-session follow-up
- `SR-RESCHEDULE`: Reschedule suggestions
- `SR-CANCELLED`: Cancellation notifications

#### Journal Prompts (JP)
- `JP-DAILY`: Daily journaling prompt
- `JP-THEMED`: Themed journal entries
- `JP-GRATITUDE`: Gratitude prompts
- `JP-CHALLENGE`: Journal challenges
- `JP-REFLECT`: Reflection prompts

#### Mindfulness Moments (MM)
- `MM-BREATHING`: Breathing exercise
- `MM-MEDITATION`: Meditation session
- `MM-GROUNDING`: Grounding technique
- `MM-BODY-SCAN`: Body scan prompt
- `MM-MICRO`: Micro-mindfulness moment

#### Goal Progress (GP)
- `GP-MILESTONE`: Goal milestone reached
- `GP-STREAK`: Streak maintenance
- `GP-COMPLETION`: Goal completion
- `GP-CHECKIN`: Progress check-in
- `GP-ADJUST`: Goal adjustment suggestion

#### Crisis Support (CS)
- `CS-ESCALATION`: Risk escalation alert
- `CS-RESOURCE`: Crisis resource sharing
- `CS-CHECKIN`: Safety check-in
- `CS-SUPPORT`: Support network activation
- `CS-FOLLOWUP`: Post-crisis follow-up

#### Community Updates (CU)
- `CU-REPLY`: Reply to your post
- `CU-MENTION`: Mention notification
- `CU-SUPPORT`: Support from community
- `CU-MODERATOR`: Moderator message
- `CU-FEATURED`: Featured content

#### Educational Content (EC)
- `EC-ARTICLE`: New article available
- `EC-TIP`: Daily tip
- `EC-COURSE`: Course progress
- `EC-QUIZ`: Assessment reminder
- `EC-RECOMMENDATION`: Content recommendation

#### App Updates (AU)
- `AU-FEATURE`: New feature announcement
- `AU-IMPROVEMENT`: Improvement notification
- `AU-MAINTENANCE`: Maintenance notice
- `AU-TUTORIAL`: Feature tutorial
- `AU-FEEDBACK`: Feedback request

#### Social Connections (SC)
- `SC-MESSAGE`: Direct message
- `SC-REQUEST`: Connection request
- `SC-ACTIVITY`: Connection activity
- `SC-GROUP`: Group activity
- `SC-EVENT`: Event invitation

#### Habit Reminders (HR)
- `HR-DAILY`: Daily habit reminder
- `HR-STREAK`: Streak alert
- `HR-COMPLETION`: Habit completion
- `HR-REMINDER`: Custom reminder
- `HR-INSIGHT`: Habit insight

---

## 3. Scheduling Logic

### 3.1 Time-Based Scheduling

#### Optimal Delivery Windows

| Notification Type | Primary Window | Secondary Window | Avoid Window |
|-------------------|----------------|------------------|--------------|
| Morning Check-ins | 7:00-9:00 AM | 6:00-7:00 AM | Before 6 AM |
| Midday Prompts | 12:00-2:00 PM | 11:00-12:00 PM | 2:00-5:00 PM |
| Evening Reflections | 7:00-9:00 PM | 9:00-10:00 PM | After 10 PM |
| Mindfulness Moments | 2:00-4:00 PM | 10:00-11:00 AM | Morning rush |
| Journal Prompts | 8:00-10:00 PM | 6:00-7:00 AM | Work hours |
| Progress Updates | 6:00-8:00 PM | 12:00-1:00 PM | Morning |
| Educational Content | 7:00-9:00 PM | 12:00-2:00 PM | Morning |

### 3.2 Event-Based Scheduling

| Trigger Event | Notification Sent | Delay |
|---------------|-------------------|-------|
| Mood score drops >20% | Support check-in | Immediate |
| 3+ consecutive low moods | Pattern alert | 2 hours |
| Journal entry with negative sentiment | Follow-up prompt | 4 hours |
| Session booked | Confirmation + prep | Immediate + 24h |
| Goal created | First milestone reminder | 24 hours |
| Streak at risk | Streak alert | 4 hours before reset |
| New insight available | Insight notification | Next optimal window |
| Crisis keyword detected | Crisis intervention | Immediate |
| Inactive for 7 days | Re-engagement | Next optimal window |
| App not opened for 3 days | Gentle reminder | Evening window |

### 3.3 Smart Delay Logic

```typescript
interface SmartDelayConfig {
  minIntervalMinutes: number;
  maxBatchWindowMinutes: number;
  contextDelays: {
    inMeeting: 60;
    driving: 30;
    sleeping: 480;
    exercising: 45;
    eating: 30;
  };
  engagementMultiplier: {
    high: 0.5;    // 50% faster delivery
    medium: 1.0;  // Normal delivery
    low: 1.5;     // 50% slower delivery
  };
}
```

### 3.4 Batching Rules

| Batch Type | Max Items | Max Age | Delivery Time |
|------------|-----------|---------|---------------|
| Morning Digest | 5 | 12 hours | 7:00 AM |
| Evening Summary | 8 | 18 hours | 8:00 PM |
| Weekly Roundup | 15 | 7 days | Sunday 6:00 PM |
| Achievement Batch | 10 | 24 hours | Next optimal window |
| Community Digest | 10 | 6 hours | User-defined |

---

## 4. Personalization Engine

### 4.1 User Profile Dimensions

```typescript
interface UserNotificationProfile {
  engagement: {
    averageResponseTime: number;
    peakEngagementHours: number[];
    preferredDays: number[];
    notificationOpenRate: number;
    actionRate: number;
  };
  content: {
    preferredTone: 'supportive' | 'motivational' | 'neutral' | 'professional';
    preferredLength: 'short' | 'medium' | 'long';
    emojiPreference: boolean;
    personalizationLevel: 'minimal' | 'moderate' | 'high';
  };
  behavior: {
    morningPerson: boolean;
    nightOwl: boolean;
    weekendActive: boolean;
    weekdayActive: boolean;
    vacationMode: boolean;
    stressLevel: 'low' | 'medium' | 'high';
  };
  history: {
    lastNotificationTime: Date;
    notificationsToday: number;
    notificationsThisWeek: number;
    dismissedCategories: string[];
    snoozedUntil: Date | null;
  };
}
```

### 4.2 Context Awareness

| Context Signal | Source | Impact on Notifications |
|----------------|--------|------------------------|
| Location | GPS, WiFi | Delay if at work, accelerate if at home |
| Activity | Accelerometer, HealthKit | Delay during exercise, sleep |
| Calendar | Phone calendar | Respect meetings, appointments |
| Screen State | Device API | Delay if screen off, immediate if active |
| App Usage | In-app tracking | Adapt based on recent app engagement |
| Weather | Weather API | Adjust mood-related content |
| Season | Date | Seasonal wellness themes |
| Life Events | User input | Adjust for major life changes |

### 4.3 Machine Learning Models

| Model | Purpose | Features | Output |
|-------|---------|----------|--------|
| **Engagement Predictor** | Predict notification open probability | User history, time, content type, context | Probability score 0-1 |
| **Optimal Time Model** | Predict best delivery time | Historical engagement, day of week, season | Optimal hour + confidence |
| **Content Preference Model** | Predict preferred content type | Past interactions, explicit preferences | Content type ranking |
| **Churn Risk Model** | Identify users at risk of disengagement | Activity patterns, response rates | Risk score + intervention |
| **Sentiment Adapter** | Adapt tone to user's current state | Recent mood entries, journal sentiment | Tone recommendation |

---

## 5. Frequency Caps & Limits

### 5.1 Global Frequency Caps

| Time Period | Max Notifications | Applies To |
|-------------|-------------------|------------|
| Per Hour | 3 | All non-critical |
| Per Day | 8 | All non-critical |
| Per Week | 25 | All non-critical |
| Per Month | 80 | All non-critical |

### 5.2 Category-Specific Caps

| Category | Daily Cap | Weekly Cap | Notes |
|----------|-----------|------------|-------|
| Wellness Check-ins | 2 | 10 | Morning + evening |
| Mental Health Insights | 1 | 5 | Quality over quantity |
| Session Reminders | 3 | 10 | Per scheduled session |
| Journal Prompts | 1 | 5 | User can request more |
| Mindfulness Moments | 2 | 8 | Respects user activity |
| Goal Progress | 2 | 7 | Milestone focused |
| Crisis Support | No cap | No cap | Safety priority |
| Community Updates | 3 | 15 | User controlled |
| Educational Content | 1 | 5 | Digest preferred |
| App Updates | 1 | 3 | Important only |
| Social Connections | 5 | 20 | User controlled |
| Habit Reminders | 5 | 25 | Per active habit |

### 5.3 Burst Protection

```typescript
interface BurstProtectionConfig {
  maxConsecutiveSameType: 2;
  cooldownMinutes: {
    wellnessCheckin: 240;
    insight: 360;
    journalPrompt: 480;
    mindfulness: 180;
    goalProgress: 300;
    educational: 720;
  };
  backoffMultiplier: {
    firstIgnore: 1.5;
    secondIgnore: 2.0;
    thirdIgnore: 3.0;
    fourthIgnore: 5.0;
  };
}
```

### 5.4 Priority Override Rules

| Scenario | Override Behavior |
|----------|-------------------|
| Crisis detection | Bypass all caps, immediate delivery |
| Session in <1 hour | Bypass daily cap |
| User explicitly requested | Bypass category cap |
| Goal deadline approaching | Increase category cap by 50% |
| New user (<7 days) | Increase caps by 100% |
| Premium subscriber | Increase caps by 50% |

---

## 6. Quiet Hours & Do Not Disturb

### 6.1 Default Quiet Hours

| Day Type | Start Time | End Time |
|----------|------------|----------|
| Weekdays | 10:00 PM | 7:00 AM |
| Weekends | 11:00 PM | 8:00 AM |

### 6.2 Quiet Hours Configuration

```typescript
interface QuietHoursConfig {
  enabled: boolean;
  schedule: {
    weekday: { start: '22:00'; end: '07:00'; };
    weekend: { start: '23:00'; end: '08:00'; };
  };
  customSchedule?: {
    monday?: TimeRange;
    tuesday?: TimeRange;
    wednesday?: TimeRange;
    thursday?: TimeRange;
    friday?: TimeRange;
    saturday?: TimeRange;
    sunday?: TimeRange;
  };
  exceptions: {
    crisisSupport: true;
    sessionReminders: true;
    userRequested: true;
    goalDeadlines: false;
  };
  behavior: {
    queueForLater: true;
    sendSilently: false;
    badgeOnly: true;
    emailInstead: false;
  };
}
```

### 6.3 Do Not Disturb Modes

| Mode | Description | Allowed Notifications |
|------|-------------|----------------------|
| **Focus Mode** | User-defined focus time | Crisis only |
| **Sleep Mode** | Extended quiet hours | Crisis only |
| **Vacation Mode** | Reduced notification frequency | Critical + weekly digest |
| **Work Mode** | Work hours focus | Session reminders + crisis |
| **Custom Mode** | User-defined rules | User-selected categories |

---

## 7. User Preferences System

### 7.1 Preference Hierarchy

```
User Preferences
├── Global Settings
│   ├── Master toggle
│   ├── Default quiet hours
│   ├── Global frequency cap
│   └── Default delivery channel
├── Category Settings (per category)
│   ├── Enabled/Disabled
│   ├── Delivery channel
│   ├── Frequency cap override
│   └── Quiet hours override
├── Subtype Settings (per subtype)
│   ├── Enabled/Disabled
│   ├── Preferred time window
│   └── Content preferences
└── Context Overrides
    ├── Vacation mode
    ├── Work mode
    ├── Sleep mode
    └── Custom modes
```

### 7.2 Preference Data Model

```typescript
interface NotificationPreferences {
  version: '1.0.0';
  lastUpdated: Date;
  global: {
    enabled: boolean;
    defaultChannel: DeliveryChannel;
    defaultQuietHours: QuietHoursConfig;
    maxNotificationsPerDay: number;
    digestMode: 'none' | 'morning' | 'evening' | 'both';
  };
  categories: { [categoryCode: string]: CategoryPreferences; };
  subtypes: { [subtypeCode: string]: SubtypePreferences; };
  contextModes: { [modeName: string]: ContextModeConfig; };
}

interface CategoryPreferences {
  enabled: boolean;
  channel: DeliveryChannel;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  dailyCap: number | null;
  respectQuietHours: boolean | null;
  preferredWindow: { start: string | null; end: string | null; };
  content: {
    tone: 'auto' | 'supportive' | 'motivational' | 'neutral' | 'professional';
    includeEmoji: 'auto' | boolean;
    personalization: 'auto' | 'minimal' | 'moderate' | 'high';
  };
}
```

### 7.3 Default Preferences by User Segment

| Segment | Default Settings |
|---------|------------------|
| **New User** | All categories enabled, medium caps, standard quiet hours |
| **Active User** | All enabled, higher caps, personalized times |
| **Low Engagement** | Reduced categories, lower caps, digest mode |
| **Premium** | All enabled, highest caps, full personalization |
| **Crisis Support** | Crisis always on, others reduced |
| **Therapy Client** | Session reminders prioritized, others balanced |


---

## 8. Notification Message Templates (100+)

### Template Count Summary

| Category | Template Count |
|----------|----------------|
| Wellness Check-ins (WC) | 15 |
| Mental Health Insights (MHI) | 15 |
| Session Reminders (SR) | 15 |
| Journal Prompts (JP) | 12 |
| Mindfulness Moments (MM) | 12 |
| Goal Progress (GP) | 12 |
| Crisis Support (CS) | 10 |
| Community Updates (CU) | 10 |
| Educational Content (EC) | 10 |
| App Updates (AU) | 8 |
| Social Connections (SC) | 8 |
| Habit Reminders (HR) | 8 |
| **TOTAL** | **145** |

### 8.1 Wellness Check-ins (WC) - 15 Templates

#### Morning Mood Check (WC-MORNING)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| WC-MORNING-001 | Good morning, {{firstName}}! | How are you feeling today? Take a moment to check in with yourself. | Open mood tracker | HIGH |
| WC-MORNING-002 | Rise and shine! | {{firstName}}, let's start your day with a quick wellness check. | Open mood tracker | HIGH |
| WC-MORNING-003 | Morning check-in | Hey {{firstName}}, on a scale of 1-10, how's your mood this morning? | Quick mood input | HIGH |
| WC-MORNING-004 | How are you, {{firstName}}? | A new day begins. Take 30 seconds to reflect on how you're feeling. | Open mood tracker | HIGH |
| WC-MORNING-005 | {{greeting}}, {{firstName}}! | Start your day mindfully. How are you feeling right now? | Open mood tracker | HIGH |

#### Evening Reflection (WC-EVENING)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| WC-EVENING-001 | Evening reflection | {{firstName}}, how was your day? Take a moment to reflect before bed. | Open evening check-in | MEDIUM |
| WC-EVENING-002 | Time to unwind | As your day ends, {{firstName}}, how are you feeling? | Open evening check-in | MEDIUM |
| WC-EVENING-003 | Daily wrap-up | Hey {{firstName}}, let's look back on today. What stood out? | Open reflection prompt | MEDIUM |
| WC-EVENING-004 | How did today go? | {{firstName}}, reflecting on your day can help you process and grow. | Open evening check-in | MEDIUM |
| WC-EVENING-005 | Before you rest... | {{firstName}}, a quick check-in: what's one word to describe your day? | Quick mood input | MEDIUM |

#### Weekly Wellness Summary (WC-WEEKLY)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| WC-WEEKLY-001 | Your week in review | {{firstName}}, see how your wellness journey progressed this week. | Open weekly summary | MEDIUM |
| WC-WEEKLY-002 | Weekly insights ready | {{firstName}}, your wellness patterns from this week are ready to view. | Open weekly report | MEDIUM |
| WC-WEEKLY-003 | This week's wellness journey | {{firstName}}, discover patterns in your mood and activities this week. | Open insights | MEDIUM |

#### Stress Level Assessment (WC-STRESS)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| WC-STRESS-001 | Stress check | {{firstName}}, your stress levels seem elevated. Want to talk about it? | Open stress assessment | HIGH |
| WC-STRESS-002 | Feeling overwhelmed? | {{firstName}}, let's check in on your stress levels together. | Open coping tools | HIGH |

#### Sleep Quality Check (WC-SLEEP)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| WC-SLEEP-001 | How did you sleep? | {{firstName}}, quality sleep is key to wellness. How was your rest? | Open sleep tracker | MEDIUM |
| WC-SLEEP-002 | Sleep check-in | Track your sleep quality, {{firstName}}, to understand your patterns. | Open sleep log | MEDIUM |

### 8.2 Mental Health Insights (MHI) - 15 Templates

#### Pattern Detection Alerts (MHI-PATTERN)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MHI-PATTERN-001 | We noticed a pattern | {{firstName}}, your mood tends to dip on {{patternDay}}s. Want to explore why? | Open pattern analysis | MEDIUM |
| MHI-PATTERN-002 | Insight: Your mood pattern | {{firstName}}, we've identified a recurring pattern in your wellness data. | View pattern details | MEDIUM |
| MHI-PATTERN-003 | Pattern discovered | {{firstName}}, your data reveals something interesting about your {{aspect}}. | Open insights | MEDIUM |

#### Correlation Discoveries (MHI-CORRELATION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MHI-CORRELATION-001 | Connection found! | {{firstName}}, your mood improves when you {{activity}}. Coincidence? | View correlation | MEDIUM |
| MHI-CORRELATION-002 | Your wellness link | {{firstName}}, we found a connection between {{factorA}} and {{factorB}}. | Explore correlation | MEDIUM |
| MHI-CORRELATION-003 | Insight: What affects your mood | {{firstName}}, {{activity}} seems to boost your wellness. Here's the data. | View detailed analysis | MEDIUM |

#### Mood Trend Analysis (MHI-MOOD-TREND)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MHI-MOOD-TREND-001 | Your mood is trending {{direction}} | {{firstName}}, over the past {{timeframe}}, your mood has {{trend}}. | View trend chart | MEDIUM |
| MHI-MOOD-TREND-002 | Positive momentum! | {{firstName}}, your mood has been improving. Keep up the great work! | View progress | MEDIUM |
| MHI-MOOD-TREND-003 | Mood update | {{firstName}}, here's how your mood has changed over {{timeframe}}. | Open mood history | MEDIUM |

#### Trigger Identification (MHI-TRIGGER)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MHI-TRIGGER-001 | Possible trigger identified | {{firstName}}, {{trigger}} seems to affect your mood. Awareness is the first step. | View trigger analysis | MEDIUM |
| MHI-TRIGGER-002 | Understanding your triggers | {{firstName}}, your data suggests {{situation}} may impact your wellness. | Explore coping strategies | MEDIUM |
| MHI-TRIGGER-003 | Trigger insight | {{firstName}}, we've identified something that may affect your mental health. | View insights | MEDIUM |

#### Progress Insights (MHI-PROGRESS)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MHI-PROGRESS-001 | You're making progress! | {{firstName}}, your wellness metrics show positive changes. Here's what's improved. | View progress report | MEDIUM |
| MHI-PROGRESS-002 | Progress check-in | {{firstName}}, let's celebrate how far you've come on your wellness journey. | View achievements | MEDIUM |
| MHI-PROGRESS-003 | Your growth, visualized | {{firstName}}, see how your mental wellness has evolved over time. | Open progress dashboard | MEDIUM |

### 8.3 Session Reminders (SR) - 15 Templates

#### Upcoming Session Reminder (SR-UPCOMING)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SR-UPCOMING-001 | Session in 24 hours | {{firstName}}, you have a session with {{therapistName}} tomorrow at {{time}}. | View session details | HIGH |
| SR-UPCOMING-002 | Reminder: Tomorrow's session | {{firstName}}, don't forget your appointment with {{therapistName}} at {{time}}. | Confirm attendance | HIGH |
| SR-UPCOMING-003 | Session tomorrow | Hi {{firstName}}, just a friendly reminder about your session tomorrow. | View details | HIGH |
| SR-UPCOMING-004 | Upcoming: {{sessionType}} | {{firstName}}, your {{sessionType}} is scheduled for {{time}} tomorrow. | Open session prep | HIGH |
| SR-UPCOMING-005 | {{time}} tomorrow: Your session | {{firstName}}, we're looking forward to seeing you at {{time}} tomorrow. | Add to calendar | HIGH |

#### Session Preparation (SR-PREP)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SR-PREP-001 | Session in 1 hour | {{firstName}}, your session with {{therapistName}} starts in an hour. Ready? | Open prep materials | HIGH |
| SR-PREP-002 | Almost time! | {{firstName}}, your session begins in 1 hour. Here's your prep guide. | View prep checklist | HIGH |
| SR-PREP-003 | Get ready for your session | {{firstName}}, take a few minutes to prepare before your {{time}} session. | Open session prep | HIGH |
| SR-PREP-004 | 1 hour until session | {{firstName}}, here's what to expect and how to prepare for your upcoming session. | View session info | HIGH |
| SR-PREP-005 | Session prep time | {{firstName}}, your session is in 1 hour. Find a quiet space and get comfortable. | Join waiting room | HIGH |

#### Post-Session Follow-up (SR-FOLLOWUP)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SR-FOLLOWUP-001 | How was your session? | {{firstName}}, we'd love to hear how your session with {{therapistName}} went. | Rate session | MEDIUM |
| SR-FOLLOWUP-002 | Session reflection | {{firstName}}, take a moment to reflect on today's session. Any insights? | Open reflection | MEDIUM |
| SR-FOLLOWUP-003 | After your session | {{firstName}}, here are some resources related to what you discussed today. | View resources | MEDIUM |
| SR-FOLLOWUP-004 | Session notes available | {{firstName}}, your session summary and any assigned exercises are ready. | View notes | MEDIUM |
| SR-FOLLOWUP-005 | Continuing your progress | {{firstName}}, here's how to build on what you worked on in today's session. | View action items | MEDIUM |

### 8.4 Journal Prompts (JP) - 12 Templates

#### Daily Journaling Prompt (JP-DAILY)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| JP-DAILY-001 | Today's journal prompt | {{firstName}}, What are three things you're grateful for today? | Open journal | MEDIUM |
| JP-DAILY-002 | Time to journal | {{firstName}}, grab your journal and reflect: What's one challenge you faced and how did you handle it? | Start journaling | MEDIUM |
| JP-DAILY-003 | Journal prompt: {{theme}} | {{firstName}}, today's theme is {{theme}}. Describe a moment that made you smile today. | Open journal | MEDIUM |
| JP-DAILY-004 | Your daily reflection | {{firstName}}, spend 5 minutes with this prompt: What would you tell your past self from a year ago? | Start writing | MEDIUM |
| JP-DAILY-005 | Journal time, {{firstName}} | Here's your prompt for today: What's something you're looking forward to? | Open journal | MEDIUM |

#### Gratitude Prompts (JP-GRATITUDE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| JP-GRATITUDE-001 | Gratitude moment | {{firstName}}, what are you thankful for right now? | Open gratitude journal | MEDIUM |
| JP-GRATITUDE-002 | Count your blessings | {{firstName}}, list three things that brought you joy today. | Start gratitude entry | MEDIUM |
| JP-GRATITUDE-003 | Gratitude practice | {{firstName}}, who's someone you're grateful for and why? | Open journal | MEDIUM |

#### Themed Journal Entries (JP-THEMED)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| JP-THEMED-001 | This week's theme: {{theme}} | {{firstName}}, explore {{theme}} in your journal this week. Today's prompt: {{prompt}} | Open themed journal | MEDIUM |
| JP-THEMED-002 | Weekly reflection: {{theme}} | {{firstName}}, this week we're focusing on {{theme}}. {{prompt}} | Start themed entry | MEDIUM |
| JP-THEMED-003 | Deep dive: {{theme}} | {{firstName}}, let's explore {{theme}} together. {{prompt}} | Open journal | MEDIUM |

### 8.5 Mindfulness Moments (MM) - 12 Templates

#### Breathing Exercise (MM-BREATHING)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MM-BREATHING-001 | Take a breath | {{firstName}}, pause for 2 minutes. Try box breathing: 4 counts in, hold, out, hold. | Start breathing exercise | LOW |
| MM-BREATHING-002 | Breathe with us | {{firstName}}, feeling stressed? Try a quick breathing exercise. | Start guided breathing | LOW |
| MM-BREATHING-003 | 2-minute reset | {{firstName}}, take 2 minutes for yourself with this breathing exercise. | Start exercise | LOW |
| MM-BREATHING-004 | Mindful breathing | {{firstName}}, let's take a moment to breathe together. | Start breathing guide | LOW |
| MM-BREATHING-005 | Pause and breathe | {{firstName}}, step away for a moment and focus on your breath. | Start exercise | LOW |

#### Meditation Session (MM-MEDITATION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MM-MEDITATION-001 | Meditation time | {{firstName}}, your {{duration}} meditation is ready when you are. | Start meditation | LOW |
| MM-MEDITATION-002 | Ready to meditate? | {{firstName}}, find a comfortable spot and let's begin. | Open meditation library | LOW |
| MM-MEDITATION-003 | Your daily meditation | {{firstName}}, today's meditation focuses on {{theme}}. | Start meditation | LOW |

#### Grounding Technique (MM-GROUNDING)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| MM-GROUNDING-001 | Ground yourself | {{firstName}}, try the 5-4-3-2-1 technique: 5 things you see, 4 you hear... | Open grounding guide | MEDIUM |
| MM-GROUNDING-002 | Feeling anxious? | {{firstName}}, this grounding exercise can help bring you back to the present. | Start grounding | MEDIUM |
| MM-GROUNDING-003 | Back to the present | {{firstName}}, use this grounding technique when you feel overwhelmed. | Open grounding tools | MEDIUM |

### 8.6 Goal Progress (GP) - 12 Templates

#### Milestone Reached (GP-MILESTONE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| GP-MILESTONE-001 | Milestone reached! | {{firstName}}, you hit {{milestone}}! Amazing work! | View goal progress | MEDIUM |
| GP-MILESTONE-002 | Goal milestone: {{milestone}} | {{firstName}}, you've reached a significant milestone. Take a moment to celebrate! | View details | MEDIUM |
| GP-MILESTONE-003 | You're halfway there! | {{firstName}}, you've completed 50% of {{goalName}}. Keep going! | View goal | MEDIUM |
| GP-MILESTONE-004 | Almost there! | {{firstName}}, you're 75% of the way to {{goalName}}. Finish strong! | View goal | MEDIUM |
| GP-MILESTONE-005 | Goal update: {{goalName}} | {{firstName}}, you've made significant progress on {{goalName}}. | View progress | MEDIUM |

#### Streak Maintenance (GP-STREAK)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| GP-STREAK-001 | {{streak}} day streak! | {{firstName}}, you've been consistent for {{streak}} days. Keep it up! | View streak | MEDIUM |
| GP-STREAK-002 | Streak alert! | {{firstName}}, complete today's activity to maintain your {{streak}}-day streak. | Complete activity | HIGH |
| GP-STREAK-003 | Don't break the chain! | {{firstName}}, you have 4 hours left to keep your {{streak}}-day streak alive. | Quick action | HIGH |

#### Goal Completion (GP-COMPLETION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| GP-COMPLETION-001 | Goal achieved! | {{firstName}}, you completed {{goalName}}! You did it! | Celebrate and set new goal | HIGH |
| GP-COMPLETION-002 | You did it, {{firstName}}! | {{goalName}} is complete! Time to celebrate your achievement. | View celebration | HIGH |
| GP-COMPLETION-003 | Congratulations! | {{firstName}}, you reached your goal. What's next on your journey? | Set new goal | HIGH |

### 8.7 Crisis Support (CS) - 10 Templates

#### Risk Escalation Alert (CS-ESCALATION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CS-ESCALATION-001 | We're here for you | {{firstName}}, we noticed you might be going through a difficult time. You don't have to face this alone. | Access crisis resources | CRITICAL |
| CS-ESCALATION-002 | Support is available | {{firstName}}, if you're struggling, please reach out. Help is available 24/7. | Contact crisis line | CRITICAL |
| CS-ESCALATION-003 | You matter, {{firstName}} | If you're having thoughts of self-harm, please contact a crisis counselor immediately. | Emergency resources | CRITICAL |

#### Crisis Resource Sharing (CS-RESOURCE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CS-RESOURCE-001 | Crisis support | {{firstName}}, here are resources that can help right now: Crisis Text Line (text HOME to 741741) | View resources | CRITICAL |
| CS-RESOURCE-002 | Help is here | {{firstName}}, these resources are available 24/7: Crisis Text Line (text HOME to 741741) | Access resources | CRITICAL |
| CS-RESOURCE-003 | Immediate support | {{firstName}}, if you need to talk to someone now: 988 Suicide & Crisis Lifeline | Call crisis line | CRITICAL |

#### Safety Check-in (CS-CHECKIN)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CS-CHECKIN-001 | Safety check-in | {{firstName}}, we're checking in. Are you safe right now? | Respond to check-in | CRITICAL |
| CS-CHECKIN-002 | How are you feeling? | {{firstName}}, your recent entries concern us. Please let us know you're okay. | Safety response | CRITICAL |

#### Post-Crisis Follow-up (CS-FOLLOWUP)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CS-FOLLOWUP-001 | Following up | {{firstName}}, we wanted to check in after yesterday. How are you feeling today? | Mood check-in | HIGH |
| CS-FOLLOWUP-002 | Thinking of you | {{firstName}}, we hope you're doing better. Remember, support is always available. | Access support | HIGH |

### 8.8 Community Updates (CU) - 10 Templates

#### Reply to Your Post (CU-REPLY)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CU-REPLY-001 | New reply to your post | {{firstName}}, {{username}} replied to your post about {{topic}}. | View reply | LOW |
| CU-REPLY-002 | Someone responded to you | {{firstName}}, check out what {{username}} said in response to your post. | View conversation | LOW |
| CU-REPLY-003 | Reply from {{username}} | {{firstName}}, {{username}} shared their thoughts on your post. | Read reply | LOW |

#### Mention Notification (CU-MENTION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CU-MENTION-001 | You were mentioned | {{firstName}}, {{username}} mentioned you in a post about {{topic}}. | View mention | LOW |
| CU-MENTION-002 | {{username}} mentioned you | {{firstName}}, someone mentioned you in the community. | View post | LOW |

#### Support from Community (CU-SUPPORT)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CU-SUPPORT-001 | Community support | {{firstName}}, {{count}} people showed support for your post. | View reactions | LOW |
| CU-SUPPORT-002 | You're not alone | {{firstName}}, the community is here for you. {{count}} people reached out. | View messages | LOW |

#### Featured Content (CU-FEATURED)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| CU-FEATURED-001 | Your post was featured! | {{firstName}}, your post about {{topic}} was featured in the community. | View feature | LOW |
| CU-FEATURED-002 | Featured post | {{firstName}}, your contribution is helping others. Your post was featured! | View recognition | LOW |

### 8.9 Educational Content (EC) - 10 Templates

#### New Article Available (EC-ARTICLE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| EC-ARTICLE-001 | New article: {{title}} | {{firstName}}, we think you'll find this article about {{topic}} helpful. | Read article | LOW |
| EC-ARTICLE-002 | Recommended reading | {{firstName}}, based on your interests, check out this article on {{topic}}. | Open article | LOW |
| EC-ARTICLE-003 | Learn something new | {{firstName}}, expand your knowledge with this article about {{topic}}. | Read now | LOW |

#### Daily Tip (EC-TIP)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| EC-TIP-001 | Today's tip | {{firstName}}, Take 3 deep breaths when you feel stressed. | Learn more | LOW |
| EC-TIP-002 | Wellness tip | {{firstName}}, here's a tip for better mental health: Practice gratitude daily. | View tips | LOW |
| EC-TIP-003 | Quick tip | {{firstName}}, A 10-minute walk can boost your mood significantly. | Explore more | LOW |

#### Course Progress (EC-COURSE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| EC-COURSE-001 | Course progress update | {{firstName}}, you're {{percent}} through {{courseName}}. Keep learning! | Continue course | LOW |
| EC-COURSE-002 | Continue learning | {{firstName}}, ready for the next lesson in {{courseName}}? | Resume course | LOW |

### 8.10 App Updates (AU) - 8 Templates

#### New Feature Announcement (AU-FEATURE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| AU-FEATURE-001 | New feature: {{featureName}} | {{firstName}}, check out {{featureName}} - {{description}} | Try feature | LOW |
| AU-FEATURE-002 | We added something new! | {{firstName}}, {{featureName}} is now available. Here's how it helps you. | Explore feature | LOW |
| AU-FEATURE-003 | Introducing {{featureName}} | {{firstName}}, we're excited to share our latest feature with you. | Learn more | LOW |

#### Improvement Notification (AU-IMPROVEMENT)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| AU-IMPROVEMENT-001 | App improvements | {{firstName}}, we've made MindMate faster and better based on your feedback. | View changelog | LOW |
| AU-IMPROVEMENT-002 | Updates available | {{firstName}}, update MindMate for the latest improvements and fixes. | Update app | LOW |

#### Tutorial Notification (AU-TUTORIAL)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| AU-TUTORIAL-001 | New to {{feature}}? | {{firstName}}, here's a quick guide to help you get the most from {{feature}}. | View tutorial | LOW |
| AU-TUTORIAL-002 | Get more from MindMate | {{firstName}}, discover tips and tricks to enhance your experience. | View tips | LOW |

### 8.11 Social Connections (SC) - 8 Templates

#### Direct Message (SC-MESSAGE)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SC-MESSAGE-001 | Message from {{senderName}} | {{firstName}}, {{senderName}} sent you a message: {{preview}} | Read message | MEDIUM |
| SC-MESSAGE-002 | New message | {{firstName}}, you have a new message from {{senderName}}. | Open chat | MEDIUM |
| SC-MESSAGE-003 | {{senderName}} messaged you | {{firstName}}, check your messages to see what {{senderName}} shared. | View message | MEDIUM |

#### Connection Request (SC-REQUEST)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SC-REQUEST-001 | Connection request | {{firstName}}, {{requesterName}} wants to connect with you. | View request | MEDIUM |
| SC-REQUEST-002 | New connection | {{firstName}}, {{requesterName}} invited you to connect. | Respond | MEDIUM |

#### Event Invitation (SC-EVENT)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| SC-EVENT-001 | You're invited! | {{firstName}}, {{inviterName}} invited you to {{eventName}}. | View event | MEDIUM |
| SC-EVENT-002 | Event invitation | {{firstName}}, check out this event: {{eventName}} on {{date}}. | RSVP | MEDIUM |

### 8.12 Habit Reminders (HR) - 8 Templates

#### Daily Habit Reminder (HR-DAILY)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| HR-DAILY-001 | Time for {{habitName}} | {{firstName}}, it's time for your daily {{habitName}}. You've got this! | Log habit | MEDIUM |
| HR-DAILY-002 | {{habitName}} reminder | {{firstName}}, don't forget your {{habitName}} today! | Complete habit | MEDIUM |
| HR-DAILY-003 | Daily habit: {{habitName}} | {{firstName}}, keep your streak going with {{habitName}}. | Log completion | MEDIUM |

#### Streak Alert (HR-STREAK)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| HR-STREAK-001 | {{streak}} day streak! | {{firstName}}, you've kept up {{habitName}} for {{streak}} days. Amazing! | View streak | MEDIUM |
| HR-STREAK-002 | Streak in danger! | {{firstName}}, complete {{habitName}} today to keep your {{streak}}-day streak! | Complete now | HIGH |

#### Habit Completion (HR-COMPLETION)

| Template ID | Title | Body | Action | Priority |
|-------------|-------|------|--------|----------|
| HR-COMPLETION-001 | Habit completed! | {{firstName}}, you completed {{habitName}}. Great job staying consistent! | View progress | LOW |
| HR-COMPLETION-002 | Nice work! | {{firstName}}, {{habitName}} done for today. You're building great habits! | Celebrate | LOW |


---

## 9. AI Decision Logic

### 9.1 Decision Framework Overview

The AI notification system makes three key decisions for every potential notification:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI DECISION FRAMEWORK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   WHAT to send?                                                  │
│   ├── Content Selection Engine                                   │
│   ├── Template Matching                                          │
│   └── Personalization Layer                                      │
│                           ↓                                      │
│   WHEN to send?                                                  │
│   ├── Optimal Time Calculation                                   │
│   ├── Context Awareness                                          │
│   └── Schedule Optimization                                      │
│                           ↓                                      │
│   HOW OFTEN to send?                                             │
│   ├── Frequency Cap Enforcement                                  │
│   ├── Engagement-Based Throttling                                │
│   └── Fatigue Detection                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 WHAT to Send - Content Selection Logic

#### Content Selection Pipeline

```python
class ContentSelectionEngine:
    """Determines what notification content to send based on context and user state"""
    
    def select_content(self, user_id: str, trigger: TriggerEvent, context: UserContext) -> NotificationContent:
        # Step 1: Identify relevant categories
        relevant_categories = self.identify_relevant_categories(trigger, context)
        
        # Step 2: Filter by user preferences
        allowed_categories = self.filter_by_preferences(user_id, relevant_categories)
        
        # Step 3: Score each category by relevance
        scored_categories = self.score_categories(allowed_categories, trigger, context)
        
        # Step 4: Select best category
        selected_category = self.select_best_category(scored_categories)
        
        # Step 5: Select template within category
        template = self.select_template(user_id, selected_category, context)
        
        # Step 6: Personalize content
        personalized_content = self.personalize(template, user_id, context)
        
        return personalized_content
    
    def identify_relevant_categories(self, trigger: TriggerEvent, context: UserContext) -> List[str]:
        """Map triggers to relevant notification categories"""
        trigger_category_map = {
            'mood_entry_low': ['WC', 'MHI', 'MM'],
            'mood_entry_high': ['MHI', 'GP', 'JP'],
            'journal_negative': ['MHI', 'WC', 'CS'],
            'journal_positive': ['MHI', 'GP', 'JP'],
            'session_booked': ['SR'],
            'session_approaching': ['SR'],
            'goal_created': ['GP', 'HR'],
            'goal_milestone': ['GP'],
            'streak_at_risk': ['GP', 'HR'],
            'inactivity_3days': ['WC', 'EC'],
            'inactivity_7days': ['WC', 'EC', 'AU'],
            'crisis_keyword': ['CS'],
            'pattern_detected': ['MHI'],
            'insight_available': ['MHI'],
            'morning_time': ['WC', 'MM', 'HR'],
            'evening_time': ['WC', 'JP', 'MM'],
        }
        return trigger_category_map.get(trigger.type, ['EC'])
    
    def score_categories(self, categories: List[str], trigger: TriggerEvent, context: UserContext) -> List[ScoredCategory]:
        """Score each category based on multiple factors"""
        scored = []
        for category in categories:
            score = 0.0
            # Factor 1: Trigger relevance (0-40 points)
            score += self.calculate_trigger_relevance(category, trigger) * 40
            # Factor 2: User engagement history (0-30 points)
            score += self.get_engagement_score(category, context.user) * 30
            # Factor 3: Context appropriateness (0-20 points)
            score += self.calculate_context_fit(category, context) * 20
            # Factor 4: Recency (0-10 points)
            score += self.calculate_recency_score(category, context.user) * 10
            scored.append(ScoredCategory(category, score))
        return sorted(scored, key=lambda x: x.score, reverse=True)
```

#### Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Trigger Relevance | 40% | How well category matches the trigger event |
| Engagement History | 30% | User's historical response to this category |
| Context Fit | 20% | Appropriateness given current context |
| Recency | 10% | Time since last notification in this category |

### 9.3 WHEN to Send - Timing Optimization

#### Optimal Time Calculation

```python
class TimingOptimizer:
    """Calculates the optimal delivery time for notifications"""
    
    def calculate_optimal_time(self, user_id: str, notification: Notification, constraints: TimingConstraints) -> datetime:
        user = self.get_user(user_id)
        
        # Get base time window
        base_window = self.get_category_time_window(notification.category)
        
        # Get user's engagement pattern
        engagement_pattern = self.get_engagement_pattern(user_id)
        
        # Calculate optimal hour within window
        optimal_hour = self.find_peak_engagement_hour(engagement_pattern, base_window)
        
        # Check for conflicts
        conflicts = self.check_conflicts(user_id, optimal_hour, notification)
        
        if conflicts:
            optimal_hour = self.find_alternative_time(base_window, conflicts, engagement_pattern)
        
        # Apply smart delay based on context
        final_time = self.apply_context_delay(optimal_hour, user.context)
        
        # Ensure within constraints
        final_time = self.constrain_time(final_time, constraints)
        
        return final_time
    
    def find_peak_engagement_hour(self, pattern: EngagementPattern, window: TimeWindow) -> int:
        """Find the hour with highest engagement within window"""
        hour_scores = []
        for hour in range(window.start, window.end):
            score = pattern.get_engagement_rate(hour)
            hour_scores.append((hour, score))
        hour_scores.sort(key=lambda x: x[1], reverse=True)
        return hour_scores[0][0]
    
    def check_conflicts(self, user_id: str, proposed_time: datetime, notification: Notification) -> List[Conflict]:
        """Check for timing conflicts"""
        conflicts = []
        # Check quiet hours
        if self.in_quiet_hours(user_id, proposed_time):
            if notification.priority < Priority.HIGH:
                conflicts.append(Conflict.QUIET_HOURS)
        # Check calendar
        if self.has_calendar_conflict(user_id, proposed_time):
            conflicts.append(Conflict.CALENDAR_EVENT)
        # Check recent notification density
        recent_count = self.get_recent_notification_count(user_id, proposed_time - timedelta(hours=1), proposed_time)
        if recent_count >= 3:
            conflicts.append(Conflict.HIGH_DENSITY)
        # Check user activity
        if self.user_likely_unavailable(user_id, proposed_time):
            conflicts.append(Conflict.USER_UNAVAILABLE)
        return conflicts
```

#### Timing Factors

| Factor | Impact | Data Source |
|--------|--------|-------------|
| Historical Engagement | Primary | App analytics |
| Quiet Hours | Blocking | User preferences |
| Calendar Events | Delay | Calendar integration |
| Sleep Patterns | Blocking | Health data, usage |
| Location | Adjustment | GPS, WiFi |
| Activity | Delay | Device sensors |
| Weather | Minor | Weather API |
| Day of Week | Adjustment | Historical patterns |

### 9.4 HOW OFTEN to Send - Frequency Management

#### Frequency Decision Logic

```python
class FrequencyManager:
    """Manages notification frequency to prevent fatigue"""
    
    def should_send_notification(self, user_id: str, notification: Notification) -> FrequencyDecision:
        user = self.get_user(user_id)
        
        # Check 1: Global caps
        global_check = self.check_global_caps(user, notification)
        if not global_check.allowed:
            return FrequencyDecision(allowed=False, reason="Global cap exceeded", retry_after=global_check.retry_after)
        
        # Check 2: Category caps
        category_check = self.check_category_caps(user, notification)
        if not category_check.allowed:
            return FrequencyDecision(allowed=False, reason="Category cap exceeded", retry_after=category_check.retry_after)
        
        # Check 3: Engagement-based throttling
        engagement_check = self.check_engagement_throttling(user, notification)
        if not engagement_check.allowed:
            return FrequencyDecision(allowed=False, reason="Low engagement - throttling", retry_after=engagement_check.retry_after)
        
        # Check 4: Fatigue detection
        fatigue_check = self.check_fatigue(user, notification)
        if fatigue_check.fatigue_detected:
            return FrequencyDecision(allowed=False, reason="Notification fatigue detected", retry_after=timedelta(hours=24), suggest_break=True)
        
        # Check 5: Cooldown periods
        cooldown_check = self.check_cooldown(user, notification)
        if not cooldown_check.cooled_down:
            return FrequencyDecision(allowed=False, reason="Cooldown period active", retry_after=cooldown_check.remaining_time)
        
        return FrequencyDecision(allowed=True)
    
    def check_engagement_throttling(self, user: User, notification: Notification) -> EngagementCheck:
        """Apply throttling based on engagement patterns"""
        engagement_score = self.calculate_engagement_score(user)
        
        if engagement_score > 0.7:
            return EngagementCheck(allowed=True)  # High engagement - normal frequency
        elif engagement_score > 0.4:
            if random.random() < 0.8:  # 80% chance to send
                return EngagementCheck(allowed=True)
            else:
                return EngagementCheck(allowed=False, retry_after=timedelta(hours=2))
        else:
            if random.random() < 0.5:  # 50% chance to send
                return EngagementCheck(allowed=True)
            else:
                return EngagementCheck(allowed=False, retry_after=timedelta(hours=4))
    
    def calculate_engagement_score(self, user: User) -> float:
        """Calculate overall engagement score (0-1)"""
        open_rate = user.get_notification_open_rate(days=30)
        action_rate = user.get_notification_action_rate(days=30)
        session_score = min(user.get_sessions_per_week() / 7, 1.0)
        feature_score = user.get_feature_usage_breadth()
        return open_rate * 0.3 + action_rate * 0.3 + session_score * 0.2 + feature_score * 0.2
```

#### Frequency Decision Matrix

| User State | Global Cap | Category Cap | Throttling | Result |
|------------|------------|--------------|------------|--------|
| New user (<7 days) | 2x normal | 2x normal | None | Higher frequency |
| Highly engaged | Normal | Normal | None | Normal frequency |
| Moderately engaged | Normal | Normal | 20% reduction | Slight reduction |
| Low engagement | Normal | 0.75x | 50% reduction | Significant reduction |
| At-risk churn | 0.5x | 0.5x | 70% reduction | Minimal + win-back |
| Fatigue detected | 0.25x | 0.25x | 90% reduction | Break + gentle re-engage |

### 9.5 Complete Decision Flow

```
TRIGGER EVENT OCCURS
        │
        ▼
┌─────────────────┐
│ 1. CHECK IF     │────NO────▶ [EXIT - Don't send]
│    NOTIFICATION │
│    IS NEEDED    │
└─────────────────┘
        │ YES
        ▼
┌─────────────────┐
│ 2. DETERMINE    │
│    CONTENT      │
│    (WHAT)       │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 3. CALCULATE    │
│    OPTIMAL TIME │
│    (WHEN)       │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 4. CHECK        │────EXCEEDS───▶ [QUEUE for later]
│    FREQUENCY    │    CAPS
│    CAPS         │
│    (HOW OFTEN)  │
└─────────────────┘
        │ WITHIN CAPS
        ▼
┌─────────────────┐
│ 5. CHECK QUIET  │────IN QUIET───▶ [QUEUE until quiet ends]
│    HOURS        │    HOURS
└─────────────────┘
        │ OUTSIDE QUIET HOURS
        ▼
┌─────────────────┐
│ 6. CHECK USER   │────UNAVAILABLE──▶ [DELAY 30 min, recheck]
│    CONTEXT      │
└─────────────────┘
        │ AVAILABLE
        ▼
┌─────────────────┐
│ 7. PERSONALIZE  │
│    CONTENT      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 8. SEND         │
│    NOTIFICATION │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 9. LOG & TRACK  │
│    FOR ANALYTICS│
└─────────────────┘
```

---

## 10. Notification Preference Settings Screen

### 10.1 Main Settings Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Notification Settings                              [Reset]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MASTER NOTIFICATIONS                                [ON]       │
│  Receive all notifications from MindMate AI                     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  QUIET HOURS                                         [ON]       │
│  Weekdays: 10:00 PM - 7:00 AM                                   │
│  Weekends: 11:00 PM - 8:00 AM                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  DAILY LIMIT                                                    │
│  Maximum notifications per day: 8                               │
│  [Flexible] allow important notifications                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  NOTIFICATION CATEGORIES                                        │
│                                                                  │
│  Wellness Check-ins .................................. [ON] >  │
│  Mental Health Insights .............................. [ON] >  │
│  Session Reminders ................................... [ON] >  │
│  Journal Prompts ..................................... [ON] >  │
│  Mindfulness Moments ................................. [ON] >  │
│  Goal Progress ....................................... [ON] >  │
│  Crisis Support ................................ [ALWAYS ON]   │
│  Community Updates ................................... [OFF] > │
│  Educational Content ................................. [ON] >  │
│  App Updates ......................................... [ON] >  │
│  Social Connections .................................. [OFF] > │
│  Habit Reminders ..................................... [ON] >  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  CONTEXT MODES                                                  │
│  [Configure Work Mode]  [Configure Sleep Mode]                  │
│  [Configure Vacation Mode]  [+ Create Custom Mode]              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  DIGEST PREFERENCES                                             │
│  (*) Send notifications as they happen                          │
│  ( ) Morning digest (7:00 AM)                                   │
│  ( ) Evening digest (8:00 PM)                                   │
│  ( ) Both morning and evening                                   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  SOUND & VIBRATION                                              │
│  Notification Sound: Chime                                      │
│  [X] Vibrate                                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  PERSONALIZATION                                                │
│  Preferred Tone: Supportive                                     │
│  [X] Use emojis in notifications                                │
│  Personalization Level: High                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  YOUR NOTIFICATION STATS                                        │
│  This week: 24 notifications received                           │
│  Open rate: 78% (above average!)                                │
│  Most engaged category: Wellness Check-ins                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Category Detail Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  Wellness Check-ins                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Enable Wellness Check-ins                           [ON]       │
│  Daily mood and wellness prompts                                │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  DELIVERY CHANNEL                                               │
│  (*) Push notification  ( ) In-app only  ( ) Email only        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  FREQUENCY                                                      │
│  Maximum per day: 2                                             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  PREFERRED TIME WINDOW                                          │
│  (*) Use optimal times (AI-recommended)                         │
│  ( ) Custom times:                                              │
│      Morning check-in: 7:00 AM                                  │
│      Evening check-in: 8:00 PM                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  QUIET HOURS                                                    │
│  [X] Respect quiet hours                                        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  NOTIFICATION TYPES                                             │
│  [X] Morning mood check                                         │
│  [X] Evening reflection                                         │
│  [X] Weekly wellness summary                                    │
│  [ ] Stress level assessments                                   │
│  [ ] Sleep quality checks                                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  CONTENT PREFERENCES                                            │
│  Tone: Supportive                                               │
│  [X] Include emoji                                              │
│  Length: Medium                                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  SOUND                                                          │
│  [X] Use custom sound: Gentle chime                             │
│  [X] Vibrate                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Context Mode Configuration Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  Work Mode Configuration                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Enable Work Mode                                    [ON]       │
│  Reduce notifications during work hours                         │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ACTIVATION                                                     │
│  (*) Manual (toggle on/off)                                     │
│  ( ) Scheduled                                                  │
│      Days: [Mon][Tue][Wed][Thu][Fri][ ][ ]                      │
│      Time: 9:00 AM to 5:00 PM                                   │
│  ( ) Calendar-based (detect work events)                        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ALLOWED CATEGORIES                                             │
│  These notifications will still come through:                   │
│                                                                  │
│  [X] Crisis Support (always)                                    │
│  [X] Session Reminders                                          │
│  [ ] Wellness Check-ins                                         │
│  [ ] Goal Progress                                              │
│  [ ] All others silenced                                        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  BEHAVIOR                                                       │
│  (*) Queue notifications for later                              │
│  ( ) Send silently (no sound/vibration)                         │
│  ( ) Badge only (no alert)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Component Specifications

| Component | Type | Behavior |
|-----------|------|----------|
| Toggle Switch | Boolean | Immediate save, haptic feedback |
| Dropdown | Selection | Opens bottom sheet on mobile |
| Time Picker | Time | Native time picker, 15-min intervals |
| Day Selector | Multi-select | Toggle buttons, at least one required |
| Slider | Range | 1-20 for frequency caps |
| Category Card | Expandable | Tap to expand, shows summary |
| Reset Button | Action | Confirmation dialog before reset |
| Stats Card | Display | Read-only, auto-updated weekly |

### 10.5 Accessibility Considerations

- All toggles have clear labels and descriptions
- Color not used as sole indicator (icons + text)
- Minimum touch target: 44x44 points
- Screen reader optimized with proper labels
- High contrast mode support
- Dynamic type support for text scaling

---

## 11. Technical Implementation

### 11.1 Data Models

```typescript
// Core notification model
interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  subtype: NotificationSubtype;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledAt: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  status: 'pending' | 'scheduled' | 'delivered' | 'failed' | 'cancelled';
  channel: DeliveryChannel;
  openedAt?: Date;
  actionTaken?: string;
  dismissedAt?: Date;
}

// User preference model
interface UserNotificationPreferences {
  userId: string;
  version: string;
  global: GlobalPreferences;
  categories: Record<string, CategoryPreferences>;
  subtypes: Record<string, SubtypePreferences>;
  contextModes: Record<string, ContextModeConfig>;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery tracking model
interface NotificationDelivery {
  notificationId: string;
  userId: string;
  attempts: DeliveryAttempt[];
  finalStatus: DeliveryStatus;
  deliveredAt?: Date;
  openedAt?: Date;
  actionTaken?: string;
  timeToOpen?: number;
}
```

### 11.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | List user's notifications |
| `/notifications/:id` | GET | Get notification details |
| `/notifications/:id/read` | POST | Mark notification as read |
| `/notifications/:id/action` | POST | Record notification action |
| `/notifications/preferences` | GET | Get user preferences |
| `/notifications/preferences` | PUT | Update user preferences |
| `/notifications/categories` | GET | List available categories |
| `/notifications/stats` | GET | Get notification statistics |
| `/notifications/quiet-hours` | PUT | Update quiet hours |
| `/notifications/test` | POST | Send test notification |

### 11.3 Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(50) NOT NULL,
    subtype VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    channel VARCHAR(20) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE,
    action_taken VARCHAR(100),
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    version VARCHAR(10) NOT NULL,
    global_config JSONB NOT NULL,
    categories JSONB NOT NULL DEFAULT '{}',
    subtypes JSONB NOT NULL DEFAULT '{}',
    context_modes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue for delayed delivery
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id),
    user_id UUID NOT NULL,
    deliver_after TIMESTAMP WITH TIME ZONE NOT NULL,
    priority INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at);
CREATE INDEX idx_notifications_category ON notifications(user_id, category);
CREATE INDEX idx_queue_deliver_after ON notification_queue(deliver_after);
```

---

## 12. Analytics & Monitoring

### 12.1 Key Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Delivery Rate** | % of notifications successfully delivered | >99% |
| **Open Rate** | % of delivered notifications opened | >40% |
| **Action Rate** | % of opened notifications with action taken | >30% |
| **Time to Open** | Average time from delivery to open | <2 hours |
| **Notification Fatigue Score** | Users with <20% open rate | <10% |
| **Preference Update Rate** | % of users who customize preferences | >50% |
| **Quiet Hours Violations** | Critical notifications during quiet hours | 0 |
| **User Satisfaction** | Rating of notification usefulness | >4.0/5 |

### 12.2 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION DASHBOARD                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TODAY'S OVERVIEW                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   1,247    │  │    892     │  │    412     │  │   68%      ││
│  │  Scheduled │  │  Delivered │  │   Opened   │  │ Open Rate  ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│                                                                  │
│  CATEGORY PERFORMANCE                                            │
│  Wellness Check-ins    ████████████████████░░░░░  78% open rate │
│  Session Reminders     ██████████████████████░░░░  85% open rate│
│  Journal Prompts       ██████████████░░░░░░░░░░░░  52% open rate│
│  Mindfulness Moments   ██████████░░░░░░░░░░░░░░░░  35% open rate│
│  Goal Progress         ██████████████████░░░░░░░░  68% open rate│
│                                                                  │
│  REAL-TIME ALERTS                                                │
│  ⚠️  3 users with notification fatigue detected                  │
│  ✅ All systems operational                                      │
│  📊 Quiet hours compliance: 100%                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 Alerting Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Delivery rate <95% | Critical | Page on-call engineer |
| Open rate <20% for 7 days | Warning | Review notification strategy |
| Fatigue score >15% | Warning | Reduce frequency caps |
| Quiet hours violation | Critical | Immediate investigation |
| Queue backlog >1000 | Warning | Scale delivery workers |
| Error rate >1% | Critical | Investigate and fix |

---

## Appendix A: Notification Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{firstName}}` | User's first name | "Sarah" |
| `{{username}}` | User's username | "sarah_j" |
| `{{time}}` | Formatted time | "3:00 PM" |
| `{{date}}` | Formatted date | "Monday, Jan 15" |
| `{{therapistName}}` | Assigned therapist name | "Dr. Johnson" |
| `{{goalName}}` | Goal name | "Daily Meditation" |
| `{{streak}}` | Current streak count | "7" |
| `{{milestone}}` | Milestone description | "7 days of journaling" |
| `{{percent}}` | Completion percentage | "75%" |
| `{{topic}}` | Content topic | "anxiety management" |
| `{{senderName}}` | Message sender name | "Alex" |
| `{{habitName}}` | Habit name | "Morning Stretch" |
| `{{featureName}}` | Feature name | "Mood Insights" |
| `{{courseName}}` | Course name | "Mindfulness 101" |
| `{{eventName}}` | Event name | "Wellness Workshop" |
| `{{greeting}}` | Time-appropriate greeting | "Good morning" |
| `{{prompt}}` | Journal prompt text | "What are you grateful for?" |
| `{{tip}}` | Tip content | "Take 3 deep breaths" |
| `{{patternDay}}` | Day with pattern | "Tuesday" |
| `{{activity}}` | Activity name | "morning walks" |
| `{{factorA}}` | First correlation factor | "sleep quality" |
| `{{factorB}}` | Second correlation factor | "mood" |
| `{{theme}}` | Content theme | "gratitude" |
| `{{direction}}` | Trend direction | "up" |
| `{{trend}}` | Trend description | "improved" |
| `{{timeframe}}` | Time period | "this week" |
| `{{aspect}}` | Wellness aspect | "energy levels" |
| `{{situation}}` | Trigger situation | "work deadlines" |
| `{{trigger}}` | Identified trigger | "lack of sleep" |
| `{{sessionType}}` | Type of session | "therapy session" |
| `{{celebration}}` | Celebration message | "You did it!" |
| `{{resources}}` | Crisis resources | "Crisis Text Line: 741741" |
| `{{count}}` | Numeric count | "5" |
| `{{title}}` | Content title | "Managing Anxiety" |
| `{{description}}` | Feature description | "Track your mood patterns" |
| `{{preview}}` | Message preview | "Hey, how are you?" |
| `{{inviterName}}` | Event inviter name | "Jamie" |
| `{{requesterName}}` | Connection requester | "Taylor" |
| `{{duration}}` | Duration | "10-minute" |

---

## Appendix B: Quick Reference

### Priority Override Matrix

| Priority | Quiet Hours | Frequency Caps | User Disabled |
|----------|-------------|----------------|---------------|
| CRITICAL | Bypass | Bypass | Bypass |
| HIGH | Bypass | Respect | Respect |
| MEDIUM | Respect | Respect | Respect |
| LOW | Respect | Respect | Block |
| BACKGROUND | Silent | Respect | Block |

### Category Codes Reference

| Code | Category | Default Priority |
|------|----------|------------------|
| WC | Wellness Check-ins | HIGH |
| MHI | Mental Health Insights | MEDIUM |
| SR | Session Reminders | HIGH |
| JP | Journal Prompts | MEDIUM |
| MM | Mindfulness Moments | LOW |
| GP | Goal Progress | MEDIUM |
| CS | Crisis Support | CRITICAL |
| CU | Community Updates | LOW |
| EC | Educational Content | LOW |
| AU | App Updates | LOW |
| SC | Social Connections | MEDIUM |
| HR | Habit Reminders | MEDIUM |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024 | Agent 17 | Initial release |

---

*End of MindMate AI Notification System Specification*
