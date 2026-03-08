# MindMate AI - User Progress Dashboard Specification

## Document Information
- **Version**: 1.0
- **Status**: Production Ready
- **Last Updated**: 2024
- **Owner**: MindMate AI Product Team

---

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Architecture](#dashboard-architecture)
3. [Data Visualizations](#data-visualizations)
   - 3.1 [Mood Timeline Graph](#31-mood-timeline-graph)
   - 3.2 [Task Completion Rate](#32-task-completion-rate)
   - 3.3 [Emotional Trigger Map](#33-emotional-trigger-map)
   - 3.4 [Weekly/Monthly Progress Reports](#34-weeklymonthly-progress-reports)
   - 3.5 [Milestone Celebrations](#35-milestone-celebrations)
4. [Weekly AI-Generated Insight Report](#4-weekly-ai-generated-insight-report)
5. [Technical Implementation Notes](#5-technical-implementation-notes)
6. [Data Models](#6-data-models)

---

## 1. Overview

The MindMate AI Progress Dashboard provides users with comprehensive insights into their mental wellness journey. It combines quantitative metrics with qualitative insights, powered by AI analysis to deliver personalized recommendations and celebrate achievements.

### Core Principles
- **Privacy First**: All data is encrypted and user-controlled
- **Actionable Insights**: Every visualization leads to actionable recommendations
- **Positive Reinforcement**: Focus on progress, not perfection
- **Accessibility**: WCAG 2.1 AA compliant visualizations

---

## 2. Dashboard Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: User greeting, streak counter, quick actions        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ MOOD TIMELINE   │  │ TASK COMPLETION │                   │
│  │ (Main chart)    │  │ (Donut + Trend) │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EMOTIONAL TRIGGER MAP (Interactive Network Graph)   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ WEEKLY INSIGHTS │  │ MILESTONE       │                   │
│  │ (AI Report)     │  │ CELEBRATIONS    │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  FOOTER: Export options, share progress, settings            │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Visualizations

### 3.1 Mood Timeline Graph

#### Purpose
Visualize emotional patterns over time to help users identify trends, triggers, and progress in their mental wellness journey.

#### Chart Type: **Interactive Multi-Line Area Chart with Heatmap Overlay**

#### Data Points
| Metric | Type | Collection Frequency | Description |
|--------|------|---------------------|-------------|
| `mood_score` | Integer (1-10) | Daily (user input) | Overall mood rating |
| `energy_level` | Integer (1-10) | Daily | Energy level assessment |
| `anxiety_level` | Integer (1-10) | Daily | Anxiety intensity (inverted for visualization) |
| `sleep_quality` | Integer (1-10) | Daily | Self-reported sleep quality |
| `journal_sentiment` | Float (-1 to 1) | Per journal entry | AI-analyzed sentiment from journal entries |

#### Timeframes
- **Day View**: Hourly mood snapshots (if available)
- **Week View**: Default view, 7-day rolling window
- **Month View**: 30-day trend with weekly averages
- **Quarter View**: 90-day trend with monthly averages
- **Year View**: 365-day trend with monthly highlights

#### Visualization Specifications

```
Chart Configuration:
├── Type: Stacked Area Chart with Gradient Fill
├── X-Axis: Date (adaptive formatting based on timeframe)
├── Y-Axis: Score (0-10 scale)
├── Series:
│   ├── Primary: Mood Score (solid line, #6366F1 - Indigo)
│   ├── Secondary: Energy Level (dashed line, #10B981 - Emerald)
│   ├── Tertiary: Sleep Quality (dotted line, #8B5CF6 - Violet)
│   └── Background: Anxiety Heatmap (opacity overlay, #EF4444 - Red)
├── Interactions:
│   ├── Hover: Tooltip with all metrics for that day
│   ├── Click: Open detailed day view
│   └── Brush: Zoom into specific date range
└── Annotations:
    ├── Milestone markers (star icons)
    ├── Journal entry indicators (dot markers)
    └── Significant events (user-tagged)
```

#### Key Metrics Displayed
| Metric | Calculation | Display Format |
|--------|-------------|----------------|
| Average Mood | Mean of mood_score over period | "7.2/10" with trend arrow |
| Mood Variance | Standard deviation | "Low variability" indicator |
| Best Day | Max mood_score date | Date + score |
| Improvement Rate | Linear regression slope | "+0.3/week" or trending indicator |
| Consistency Score | % of days with entries | "85% logged" |

#### Color Scheme (Mood Gradient)
| Score Range | Color | Hex Code | Semantic |
|-------------|-------|----------|----------|
| 1-3 | Deep Red | #DC2626 | Critical - needs attention |
| 4-5 | Orange | #F97316 | Warning - monitoring needed |
| 6-7 | Yellow | #EAB308 | Moderate - stable |
| 8-9 | Light Green | #22C55E | Good - positive |
| 10 | Emerald | #059669 | Excellent - thriving |

#### Mobile Adaptations
- Simplified to single-line chart (mood only)
- Swipe gestures for timeframe switching
- Tap to expand detailed view

---

### 3.2 Task Completion Rate

#### Purpose
Track engagement with wellness activities, coping strategies, and self-care tasks to measure proactive mental health management.

#### Chart Type: **Composite Dashboard with Multiple Visualizations**

#### Components

##### 3.2.1 Primary: Donut Chart (Current Period)
```
┌─────────────────────────────┐
│                             │
│      ┌─────────────┐        │
│     /   COMPLETED   \       │
│    │     73%        │       │
│     \   22 of 30   /        │
│      └─────────────┘        │
│                             │
│  ● Completed  #10B981       │
│  ○ In Progress  #F59E0B     │
│  ○ Overdue  #EF4444         │
│                             │
└─────────────────────────────┘
```

##### 3.2.2 Secondary: Horizontal Bar Chart (By Category)
| Category | Chart Type | Metrics |
|----------|------------|---------|
| Mindfulness | Progress bar | Meditation sessions completed |
| Journaling | Progress bar | Entries written vs. goal |
| Coping Strategies | Progress bar | Techniques practiced |
| Self-Care | Progress bar | Activities completed |
| Social Connection | Progress bar | Check-ins/connections made |

##### 3.2.3 Tertiary: Line Chart (Trend Over Time)
- 7-day rolling completion rate
- Comparison to previous week (percentage point change)
- Goal line (user-defined target, default 70%)

#### Task Categories & Definitions

| Category | Task Examples | Weight | Default Weekly Goal |
|----------|--------------|--------|---------------------|
| `mindfulness` | Meditation, breathing exercises, grounding | 1.0 | 5 sessions |
| `journaling` | Daily journal entries, gratitude lists | 1.0 | 7 entries |
| `coping_strategies` | CBT exercises, coping technique practice | 1.5 | 3 practices |
| `self_care` | Exercise, healthy eating, sleep hygiene | 1.0 | 4 activities |
| `social_connection` | Reaching out to friends/family, support groups | 1.5 | 2 connections |
| `professional_support` | Therapy sessions, medication adherence | 2.0 | As prescribed |

#### Completion Rate Formula
```
Completion Rate = (Weighted Completed Tasks / Weighted Total Tasks) × 100

Weighted Score = Σ(Task Completed × Category Weight)
```

#### Timeframes
- **Today**: Current day's task list with completion status
- **This Week**: 7-day aggregate (default view)
- **This Month**: 30-day trend with weekly breakdown
- **Custom**: User-defined date range

#### Gamification Elements
| Achievement | Trigger | Visual Reward |
|-------------|---------|---------------|
| Daily Streak | 3+ consecutive days | Flame icon with count |
| Weekly Warrior | 80%+ completion for week | Badge + confetti |
| Category Master | Complete all in category | Category-specific icon |
| Perfect Week | 100% completion | Golden trophy animation |

---

### 3.3 Emotional Trigger Map

#### Purpose
Help users visualize connections between situations, emotions, and reactions to identify patterns and develop targeted coping strategies.

#### Chart Type: **Interactive Network Graph (Force-Directed Graph)**

#### Node Types

```
NODE TYPES:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [TRIGGER] ──────► [EMOTION] ──────► [REACTION]       │
│      🔥                    😊                  ✅       │
│   (Square)             (Circle)            (Diamond)    │
│                                                         │
│   Color intensity = Frequency/Intensity                 │
│   Node size = Impact score                              │
│   Edge thickness = Correlation strength                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Node Definitions

| Node Type | Shape | Color Range | Size Factor |
|-----------|-------|-------------|-------------|
| **Triggers** (External) | Square | Blue gradient (#3B82F6 to #1E40AF) | Frequency × Severity |
| **Emotions** (Internal) | Circle | Mood gradient (see 3.1) | Intensity × Duration |
| **Reactions** (Behavioral) | Diamond | Green (#10B981) or Red (#EF4444) based on helpfulness | Frequency |
| **Coping Strategies** (Hexagon) | Hexagon | Purple (#8B5CF6) | Success rate |

#### Predefined Trigger Categories

| Category | Examples | Icon |
|----------|----------|------|
| `work_stress` | Deadlines, conflicts, workload | 💼 |
| `relationships` | Family, friends, romantic | 💕 |
| `health_concerns` | Physical symptoms, medical | 🏥 |
| `financial` | Money worries, expenses | 💰 |
| `social_situations` | Crowds, social anxiety, events | 👥 |
| `environmental` | Weather, noise, location | 🌍 |
| `sleep_related` | Insomnia, nightmares, fatigue | 😴 |
| `substance_use` | Alcohol, caffeine, medications | 🍷 |

#### Interaction Features

1. **Click Node**: Show detailed information panel
   - Frequency statistics
   - Related journal entries
   - Suggested coping strategies
   - Trend over time

2. **Drag Node**: Rearrange for personal clarity

3. **Filter Controls**:
   - Time range selector
   - Category toggles
   - Intensity threshold slider
   - Show/hide helpful reactions

4. **Zoom & Pan**: Navigate large networks

#### Insights Generated

| Insight Type | Description | Display |
|--------------|-------------|---------|
| Top Trigger | Most frequent trigger | Highlighted node |
| Strongest Connection | Highest correlation pair | Thickest edge |
| Coping Success | Most effective strategy | Green glow effect |
| Pattern Alert | Emerging pattern detected | Notification badge |

#### Alternative View: Heatmap Matrix

For users who prefer structured data:

```
           Work   Family   Health   Social   Sleep
Happy       ░░      ▓▓       ░░       ▓▓      ▓▓
Anxious     ████    ▓▓       ░░       ████    ▓▓
Sad         ▓▓      ████     ▓▓       ░░      ████
Angry       ▓▓      ▓▓       ░░       ░░      ░░
Calm        ▓▓      ░░       ▓▓       ░░      ░░

Legend: ░░=Rare  ▓▓=Sometimes  ████=Often
```

---

### 3.4 Weekly/Monthly Progress Reports

#### Purpose
Provide comprehensive summaries of mental wellness progress with AI-powered insights and actionable recommendations.

#### Report Structure

##### 3.4.1 Weekly Report

**Delivery**: Every Monday at 9:00 AM (user-local time)
**Format**: In-app view + optional email/PDF export

```
┌─────────────────────────────────────────────────────────────┐
│  WEEKLY WELLNESS REPORT                                     │
│  January 8-14, 2024                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 AT A GLANCE                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Average Mood: 7.2/10  ▲ +0.5 vs last week          │   │
│  │ Tasks Completed: 85%  ▲ +12% vs last week          │   │
│  │ Journal Entries: 5    ▼ -2 vs last week            │   │
│  │ Streak: 12 days 🔥                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📈 MOOD TRENDS                                             │
│  [Mini line chart showing daily mood scores]                │
│                                                             │
│  Best Day: Wednesday (9/10) - "Felt accomplished at work"  │
│  Challenging Day: Sunday (4/10) - "Difficulty sleeping"    │
│                                                             │
│  🎯 TASK BREAKDOWN                                          │
│  [Horizontal bar chart by category]                         │
│                                                             │
│  Completed: 17 | In Progress: 2 | Missed: 1                 │
│                                                             │
│  💡 AI INSIGHTS                                             │
│  [See Section 4 for detailed format]                        │
│                                                             │
│  🏆 THIS WEEK'S WINS                                        │
│  • Completed 7-day meditation streak                        │
│  • Identified work meetings as anxiety trigger              │
│  • Used breathing technique 3 times                         │
│                                                             │
│  📋 RECOMMENDED FOCUS FOR NEXT WEEK                         │
│  • Try journaling on Sunday evenings                        │
│  • Practice sleep hygiene routine                           │
│  • Schedule social activity mid-week                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

##### 3.4.2 Monthly Report

**Delivery**: 1st of each month at 9:00 AM
**Format**: Comprehensive PDF + interactive dashboard

**Additional Sections (vs. Weekly)**:

| Section | Content | Visualization |
|---------|---------|---------------|
| Month-over-Month Comparison | Key metrics vs. previous month | Side-by-side charts |
| Trend Analysis | 30-day patterns identified | Line charts with annotations |
| Trigger Evolution | How triggers changed | Before/after trigger maps |
| Goal Progress | Progress toward monthly goals | Progress bars + status |
| Coping Strategy Effectiveness | Which strategies worked best | Ranked list with scores |
| Professional Insights | Patterns to discuss with therapist | Exportable summary |

#### Report Metrics Summary

| Metric | Weekly | Monthly | Calculation |
|--------|--------|---------|-------------|
| Mood Average | ✓ | ✓ | Mean of daily scores |
| Mood Range | ✓ | ✓ | Max - Min |
| Mood Volatility | ✗ | ✓ | Standard deviation |
| Task Completion Rate | ✓ | ✓ | Weighted average |
| Task Consistency | ✗ | ✓ | Coefficient of variation |
| Journal Frequency | ✓ | ✓ | Entries / Days |
| Journal Sentiment Trend | ✓ | ✓ | Linear regression |
| Trigger Frequency | ✓ | ✓ | Count by category |
| Coping Success Rate | ✓ | ✓ | Successful / Total attempts |
| Sleep Correlation | ✗ | ✓ | Correlation with mood |
| Social Connection Impact | ✗ | ✓ | Before/after analysis |

---

### 3.5 Milestone Celebrations

#### Purpose
Recognize and reinforce positive behaviors and achievements to increase engagement and motivation.

#### Milestone Categories

##### 3.5.1 Consistency Milestones

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| First Entry | First journal entry | Welcome message + confetti |
| 3-Day Streak | 3 consecutive days | Bronze star + encouragement |
| 7-Day Streak | Week of consistency | Silver star + "Weekly Warrior" badge |
| 30-Day Streak | Month of consistency | Gold star + "Monthly Master" badge |
| 100-Day Streak | 100 consecutive days | Diamond badge + shareable certificate |
| 365-Day Streak | Full year | Special animation + "Mindfulness Master" title |

##### 3.5.2 Achievement Milestones

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| Mood Improvement | 7-day avg > previous 7-day avg by 1+ point | "On the Rise" badge |
| Sustained Wellness | 14 days with mood >= 7 | "Thriving" badge |
| Task Master | 100 tasks completed | Counter celebration |
| Journal Pro | 50 journal entries | "Storyteller" badge |
| Trigger Insight | First pattern identified | "Self-Aware" badge |
| Coping Champion | 10 successful coping strategy uses | "Resilient" badge |

##### 3.5.3 Special Milestones

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| First Check-in | First app open after onboarding | Personalized welcome |
| Profile Complete | All onboarding questions answered | "Ready to Grow" badge |
| First Share | First progress share | "Community Builder" badge |
| Crisis Resource Used | Accessed crisis support (handled sensitively) | Supportive message |
| Professional Connect | Linked with therapist in app | "Team Player" badge |

#### Celebration Visual Design

```
CELEBRATION ANIMATION SEQUENCE:

1. TRIGGER: Milestone achieved
   ↓
2. OVERLAY: Semi-transparent dark overlay appears
   ↓
3. ANIMATION: 
   - Confetti burst (color-coded by milestone type)
   - Badge/Trophy scales up with bounce effect
   - Particle effects (sparkles, stars)
   ↓
4. CONTENT DISPLAY:
   ┌─────────────────────────────────────┐
   │                                     │
   │         [ANIMATED BADGE]            │
   │                                     │
   │     🎉 Congratulations! 🎉          │
   │                                     │
   │   You've earned the "Weekly         │
   │   Warrior" badge for completing     │
   │   7 days of consistent journaling!   │
   │                                     │
   │   [Share]  [View Progress]  [Close] │
   │                                     │
   └─────────────────────────────────────┘
   ↓
5. DISMISSAL: User taps close or auto-dismiss after 10s
```

#### Celebration Sound Design
- Subtle, uplifting chime (optional, user-controlled)
- Different tones for different milestone types
- Vibration pattern on mobile (optional)

#### Share Functionality

| Platform | Content | Format |
|----------|---------|--------|
| In-App Feed | Badge + achievement text | Card with animation |
| Social Media | Image with badge + stats | PNG/JPEG export |
| Messaging | Pre-written message + link | Text + deep link |
| Email | Full milestone certificate | HTML email |

#### Privacy Controls
- User must opt-in to share
- Shareable content excludes sensitive details
- Option to anonymize before sharing
- Preview before sharing

---

## 4. Weekly AI-Generated Insight Report

### 4.1 Format Specification

#### Structure

```markdown
# Your Weekly Wellness Insights
## January 8-14, 2024

---

### 🧠 Executive Summary
[2-3 sentence overview of the week]

### 📊 Key Patterns Identified
[3-5 bullet points with specific observations]

### 💡 Personalized Insights
[2-3 paragraphs of AI analysis]

### 🎯 Recommendations for Next Week
[3-5 actionable suggestions]

### 📈 Progress Context
[Comparison to previous weeks/months]

### 💬 Reflection Prompt
[1 thought-provoking question]
```

### 4.2 Tone Guidelines

| Aspect | Guideline | Example |
|--------|-----------|---------|
| **Voice** | Empathetic, supportive, non-judgmental | "It looks like you had a challenging moment..." |
| **Perspective** | Collaborative, not prescriptive | "You might consider..." vs "You should..." |
| **Language** | Clear, accessible, avoiding clinical jargon | "feeling on edge" vs "experiencing heightened anxiety" |
| **Framing** | Strengths-based, growth-oriented | "You're building resilience by..." |
| **Length** | Concise but comprehensive | 300-500 words total |
| **Personalization** | Use user's name, reference specific entries | "Hi Sarah, I noticed in your Wednesday entry..." |

### 4.3 Content Coverage

#### Section 1: Executive Summary (50-75 words)
- Overall week assessment
- Highlight one significant positive
- Acknowledge any challenges with empathy

**Example**:
> Hi [Name], this week showed some wonderful progress in your morning routine consistency. While Tuesday and Friday had some dips, your overall mood trend is moving upward. You're demonstrating real commitment to your wellness practices.

#### Section 2: Key Patterns Identified (5-7 bullets)
Data-driven observations from:
- Mood score correlations
- Trigger frequency analysis
- Task completion patterns
- Journal sentiment trends
- Sleep-mood relationships

**Example Bullets**:
- 🌅 **Morning moods are consistently higher** (avg 8.2) than evening moods (avg 6.1)
- 📅 **Workdays show 23% more task completion** than weekends
- 😴 **Sleep quality below 6 correlates with next-day mood drops** (observed 4 times)
- 🧘 **Meditation days show 1.2 point higher mood average**
- 💼 **Monday entries frequently mention work anticipation anxiety**

#### Section 3: Personalized Insights (100-150 words)
Deeper analysis connecting patterns to user's context:
- Reference specific journal entries (with permission)
- Connect to user's stated goals
- Identify growth opportunities
- Validate efforts

**Example**:
> Your pattern of higher morning moods suggests your current morning routine is working well for you. The consistent meditation practice you've built is likely contributing to this positive start. However, the evening mood drops, especially on Sundays, indicate an opportunity to develop a wind-down routine that helps you transition into rest more smoothly.
>
> I noticed you mentioned feeling "accomplished" on Wednesday after completing a challenging work project. This connection between achievement and mood is a strength you can leverage—consider setting small, achievable goals throughout the week to create more of these positive moments.

#### Section 4: Recommendations (3-5 specific actions)
Actionable, prioritized suggestions:

| Priority | Recommendation | Rationale | Category |
|----------|----------------|-----------|----------|
| High | Try 5-minute evening journaling | Address Sunday mood pattern | Journaling |
| Medium | Schedule social activity mid-week | Boost Wednesday energy | Social |
| Medium | Practice 4-7-8 breathing before bed | Improve sleep quality | Sleep |
| Low | Explore work stress coping strategies | Address Monday anxiety | Coping |

**Format**:
> 🎯 **This Week's Focus**: Evening Wind-Down
> 
> Based on your Sunday evening pattern, try adding a 10-minute wind-down routine before bed. This could include:
> - Light stretching
> - Gratitude journaling (3 things from the day)
> - Setting intentions for tomorrow
>
> 📚 **Learn More**: [Link to relevant resource in app]

#### Section 5: Progress Context
Comparison metrics with visual indicators:

```
This Week vs. Last Week:
├── Mood Average: 7.2 ▲ (+0.5)
├── Task Completion: 85% ▲ (+12%)
├── Journal Entries: 5 ▼ (-2)
└── Meditation Sessions: 4 ▲ (+1)

This Week vs. 4-Week Average:
├── Mood Average: 7.2 ▲ (+0.3)
├── Task Completion: 85% ▲ (+8%)
├── Journal Entries: 5 = (same)
└── Meditation Sessions: 4 ▲ (+2)
```

#### Section 6: Reflection Prompt
One thought-provoking question to encourage self-reflection:

**Examples**:
- "What was one small moment this week that brought you joy?"
- "When did you feel most like yourself this week?"
- "What would you tell a friend who had a week like yours?"
- "What's one thing you'd like to carry forward into next week?"

### 4.4 AI Generation Parameters

```python
INSIGHT_GENERATION_CONFIG = {
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1500,
    "temperature": 0.7,
    "system_prompt": """
    You are MindMate AI, an empathetic mental wellness companion.
    Generate weekly insights based on user data with the following priorities:
    1. Accuracy - Only make claims supported by data
    2. Empathy - Acknowledge challenges with compassion
    3. Actionability - Provide specific, achievable recommendations
    4. Privacy - Never reference external people by name without consent
    5. Safety - Flag concerning patterns for human review
    """,
    "safety_checks": [
        "mood_score_below_3_for_3_plus_days",
        "suicide_ideation_keywords",
        "self_harm_indicators",
        "severe_isolation_pattern"
    ]
}
```

### 4.5 Delivery & Display

| Channel | Timing | Format |
|---------|--------|--------|
| In-App Notification | Monday 9:00 AM | Rich push with preview |
| Dashboard Widget | Always visible | Collapsible card |
| Email (optional) | Monday 9:30 AM | HTML with CTA to app |
| PDF Export | On-demand | Formatted report |

---

## 5. Technical Implementation Notes

### 5.1 Performance Requirements

| Component | Load Time Target | Data Freshness |
|-----------|------------------|----------------|
| Dashboard Overview | < 2 seconds | Real-time |
| Mood Timeline | < 3 seconds | 5-minute cache |
| Trigger Map | < 4 seconds | 1-hour cache |
| Weekly Report | < 2 seconds | Pre-generated |
| Monthly Report | < 3 seconds | Pre-generated |

### 5.2 Chart Library Recommendations

| Visualization | Recommended Library | Rationale |
|---------------|---------------------|-----------|
| Mood Timeline | Chart.js / Recharts | Responsive, customizable |
| Task Completion | D3.js | Complex interactions |
| Trigger Map | D3.js Force Simulation | Network graphs |
| Heatmaps | Chart.js Matrix Plugin | Standard implementation |
| Animations | Framer Motion / Lottie | Smooth, performant |

### 5.3 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Color Independence | Patterns + labels, not just color |
| Screen Reader | ARIA labels for all charts |
| Keyboard Navigation | Tab-through all interactive elements |
| Reduced Motion | Respect `prefers-reduced-motion` |
| Contrast | WCAG 2.1 AA minimum (4.5:1) |

### 5.4 Data Retention

| Data Type | Retention Period | Anonymization |
|-----------|------------------|---------------|
| Raw mood scores | 2 years | After 2 years |
| Journal entries | Until deletion | User-controlled |
| Aggregated metrics | Indefinite | Immediate |
| AI insights | 1 year | After 1 year |

---

## 6. Data Models

### 6.1 Core Entities

```typescript
// Mood Entry
interface MoodEntry {
  id: string;
  userId: string;
  timestamp: Date;
  moodScore: number; // 1-10
  energyLevel: number; // 1-10
  anxietyLevel: number; // 1-10
  sleepQuality: number; // 1-10
  notes?: string;
  tags: string[];
  location?: GeoLocation;
}

// Task
interface Task {
  id: string;
  userId: string;
  title: string;
  category: TaskCategory;
  scheduledFor: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  weight: number;
  recurrence?: RecurrencePattern;
}

// Trigger Entry
interface TriggerEntry {
  id: string;
  userId: string;
  timestamp: Date;
  triggerCategory: TriggerCategory;
  triggerDescription: string;
  intensity: number; // 1-10
  resultingEmotion: EmotionType;
  reaction: string;
  copingStrategyUsed?: string;
  effectiveness?: number; // 1-10
}

// Milestone
interface Milestone {
  id: string;
  userId: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  badgeUrl: string;
  shareable: boolean;
  metadata: Record<string, any>;
}

// Weekly Report
interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  summary: ReportSummary;
  moodAnalysis: MoodAnalysis;
  taskAnalysis: TaskAnalysis;
  triggerAnalysis: TriggerAnalysis;
  aiInsights: string;
  recommendations: Recommendation[];
  generatedAt: Date;
}
```

### 6.2 Aggregation Queries

```sql
-- Weekly Mood Statistics
SELECT 
  user_id,
  DATE_TRUNC('week', timestamp) as week,
  AVG(mood_score) as avg_mood,
  MIN(mood_score) as min_mood,
  MAX(mood_score) as max_mood,
  STDDEV(mood_score) as mood_volatility,
  COUNT(*) as entry_count
FROM mood_entries
WHERE timestamp >= NOW() - INTERVAL '1 year'
GROUP BY user_id, DATE_TRUNC('week', timestamp);

-- Task Completion Rate by Category
SELECT 
  user_id,
  category,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completion_rate
FROM tasks
WHERE scheduled_for >= DATE_TRUNC('week', NOW())
GROUP BY user_id, category;

-- Top Triggers
SELECT 
  user_id,
  trigger_category,
  COUNT(*) as frequency,
  AVG(intensity) as avg_intensity
FROM trigger_entries
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_id, trigger_category
ORDER BY frequency DESC;
```

---

## Appendix A: Color Palette Reference

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Indigo | #6366F1 | Primary brand, mood line |
| Emerald | #10B981 | Success, positive trends |
| Violet | #8B5CF6 | Secondary accents |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Red | #EF4444 | Critical, negative, anxiety |
| Orange | #F97316 | Warning, caution |
| Yellow | #EAB308 | Moderate, neutral |
| Green | #22C55E | Good, positive |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| Slate 900 | #0F172A | Primary text |
| Slate 600 | #475569 | Secondary text |
| Slate 200 | #E2E8F0 | Borders, dividers |
| Slate 50 | #F8FAFC | Backgrounds |

---

## Appendix B: Mobile Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked charts |
| Tablet | 640-1024px | Two columns, simplified graphs |
| Desktop | > 1024px | Full layout, all features |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | MindMate AI Team | Initial specification |

---

*This document is a living specification. Updates should be reviewed by the Product, Design, and Engineering teams before implementation.*
