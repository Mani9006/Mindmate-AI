# MindMate AI: Memory & Personalization System

## Document Information
- **Version**: 1.0
- **Status**: Production Specification
- **Author**: Agent 23 - Memory & Personalization System Designer
- **Date**: 2024

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Core Memory System](#core-memory-system)
3. [Life Story Feature](#life-story-feature)
4. [Trigger Map](#trigger-map)
5. [User Interface Specifications](#user-interface-specifications)
6. [Privacy & Security](#privacy--security)
7. [Technical Architecture](#technical-architecture)

---

## Executive Summary

The Memory & Personalization System is the heart of MindMate AI's ability to provide deeply personalized mental health support. Unlike generic AI assistants, MindMate AI builds a rich, contextual understanding of each user over time, enabling:

- **Continuity of Care**: Conversations that reference past experiences, progress, and insights
- **Personalized Interventions**: Recommendations tailored to individual history and triggers
- **Self-Awareness Tools**: Visualizations that help users understand their own patterns
- **User Control**: Complete transparency and control over what the AI remembers

This document specifies the complete system design from the user's perspective.

---

## Core Memory System

### 2.1 What Is Remembered

#### 2.1.1 Explicit Memories (User-Declared)
These are facts and information users explicitly share or confirm:

| Category | Examples | Storage Priority |
|----------|----------|------------------|
| **Personal Facts** | Name, age, location, occupation, pronouns | High |
| **Relationships** | Family members, partner names, relationship status | High |
| **Health Information** | Diagnoses, medications, therapy history | Critical |
| **Preferences** | Communication style, session timing, topics to avoid | High |
| **Goals** | Therapy goals, personal aspirations, growth targets | High |
| **Life Events** | Major milestones, losses, transitions | High |

#### 2.1.2 Implicit Memories (AI-Inferred)
These are patterns and insights the AI learns through conversation:

| Category | Examples | Confidence Threshold |
|----------|----------|---------------------|
| **Emotional Patterns** | "User tends to feel anxious on Sunday evenings" | 3+ occurrences |
| **Coping Strategies** | "Walking helps user calm down" | 2+ confirmed uses |
| **Communication Style** | "User prefers direct, solution-focused responses" | Pattern analysis |
| **Trigger Indicators** | "Mentions of work deadlines precede anxiety spikes" | 3+ correlations |
| **Progress Markers** | "User's self-reported mood has improved 20% over 3 months" | Statistical significance |
| **Topic Sensitivity** | "User deflects when childhood is mentioned" | Behavioral analysis |

#### 2.1.3 Session Memories (Contextual)
Recent conversation context that enables natural dialogue:

| Type | Retention | Example |
|------|-----------|---------|
| **Active Session** | Current conversation | What was just discussed |
| **Recent Sessions** | Last 7 days | Topics from this week's sessions |
| **Session Summaries** | Indefinite | Key insights from past sessions |

### 2.2 Memory Confidence Levels

Every memory has a confidence score that determines how it's used:

```
CONFIDENCE LEVELS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 Unconfirmed (0-40%)    → Not used, flagged for verification
🟡 Probable (41-70%)       → Used tentatively, phrased as possibility
🟢 Confirmed (71-90%)      → Used normally, can be referenced directly
⭐ Verified (91-100%)      → Explicitly confirmed by user, high reliability
```

### 2.3 How Memories Surface in Conversation

#### 2.3.1 Automatic Recall Triggers

The AI automatically recalls relevant memories based on:

| Trigger Type | When It Activates | Example |
|--------------|-------------------|---------|
| **Topic Match** | User mentions related subject | User says "my sister" → AI recalls sister's name |
| **Temporal Pattern** | Known trigger time arrives | Sunday evening → AI checks in about anxiety |
| **Emotional State** | Detected emotion matches pattern | User expresses anxiety → AI recalls effective coping strategies |
| **Goal Reference** | User mentions goals | User discusses career → AI references stated career goals |
| **Anniversary** | Significant date arrives | One year since loss → AI offers gentle acknowledgment |

#### 2.3.2 Surfacing Behavior Rules

```
SURFACING PRINCIPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NATURAL INTEGRATION
   ✓ "How did your conversation with Sarah go?"
   ✗ "According to my memory, you have a sister named Sarah..."

2. CONTEXTUAL RELEVANCE
   ✓ Only surface memories relevant to current conversation
   ✗ Never dump unrelated memories

3. USER CONTROL
   ✓ "Would you like me to remember that?"
   ✓ "I recall you mentioned... Is that still accurate?"

4. GRADUAL CONFIDENCE
   ✓ Tentative: "It seems like work deadlines might be stressful for you"
   ✓ Confirmed: "I know work deadlines have been a trigger for you"
```

#### 2.3.3 Memory Surfacing UI Indicators

When memories influence the AI's response, subtle indicators appear:

```
💭 Memory Active
├─ Hover to see: "Based on: Your sister Sarah, work stress patterns"
└─ Click to: View/edit related memories

🔔 Pattern Detected  
├─ "This seems similar to what you experienced last month"
└─ Click to: See pattern details and history
```

### 2.4 User Memory Management

#### 2.4.1 Memory Dashboard

Users have complete access to their memory profile through the **Memory Center**:

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 YOUR MEMORY CENTER                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 MEMORY OVERVIEW                                          │
│  ├─ Total Memories: 147                                     │
│  ├─ High Confidence: 89                                     │
│  ├─ Pending Verification: 12                                │
│  └─ Last Updated: Today, 2:30 PM                            │
│                                                              │
│  🔍 QUICK SEARCH                                             │
│  [Search your memories...                    ] 🔍           │
│                                                              │
│  📂 CATEGORIES                                               │
│  ├─ 👤 Personal Facts (23)                                  │
│  ├─ 👥 Relationships (18)                                   │
│  ├─ 🏥 Health & Wellness (15)                               │
│  ├─ 🎯 Goals & Aspirations (12)                             │
│  ├─ 📈 Patterns & Insights (42)                             │
│  ├─ ⚠️ Triggers & Challenges (28)                           │
│  └─ 💡 Coping Strategies (9)                                │
│                                                              │
│  🔔 RECENT ACTIVITY                                          │
│  ├─ New memory added: "Prefers morning sessions"            │
│  ├─ Pattern detected: Sunday anxiety                        │
│  └─ Memory verified: Sister's name is Sarah                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Viewing Memories

Each memory displays with full context:

```
┌─────────────────────────────────────────────────────────────┐
│  MEMORY DETAIL                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Category: Relationships                                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Content:                                            │   │
│  │ "User has an older sister named Sarah. They are     │   │
│  │  close but don't talk as often as user would like.  │   │
│  │  Sarah lives in Portland."                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Confidence: ⭐ Verified (95%)                              │
│  Source: Explicitly shared on Jan 15, 2024                  │
│  Last Referenced: Today in conversation about family        │
│  Times Used: 12                                             │
│                                                              │
│  📍 Source Context:                                          │
│  "I have an older sister, Sarah. We used to be really       │
│   close but since she moved to Portland, we don't talk      │
│   as much as I'd like."                                     │
│                                                              │
│  [✏️ Edit] [🗑️ Delete] [🔕 Pause] [📤 Export]               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.3 Editing Memories

Users can edit any memory with a clear audit trail:

```
EDIT MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current: "User has an older sister named Sarah"

Edit as:
○ Correct as-is
○ Minor correction: [_______________]
○ Significant change: [_______________]
○ Remove this memory entirely

Why are you editing?
○ Information has changed
○ AI misunderstood
○ I want to be less specific
○ Privacy concern
○ Other: [_______________]

[Save Changes] [Cancel]

Note: Previous version will be archived for transparency
```

#### 2.4.4 Deleting Memories

Deletion options with appropriate safeguards:

```
DELETE MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are about to delete:
"User experiences anxiety before work presentations"

This will affect:
- Trigger Map visualization
- Pattern detection for work-related stress
- 3 past conversation references

Options:
○ Delete permanently (cannot be undone)
○ Archive (hidden but recoverable for 30 days)
○ Pause (temporarily inactive, can reactivate)

Reason for deletion:
○ This pattern no longer applies to me
○ I don't want this tracked
○ Privacy concern
○ AI inferred incorrectly
○ Other: [_______________]

[Confirm Delete] [Cancel]
```

#### 2.4.5 Bulk Memory Management

For efficient management of multiple memories:

```
BULK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Select All] [Select None] [Invert Selection]

Filter: [All Categories ▼] [All Confidence ▼] [Date Range ▼]

☐ 👤 Sister Sarah - Relationships - Verified
☐ 👤 Works in marketing - Personal Facts - Confirmed
☐ 📈 Anxiety on Sundays - Patterns - Probable
☐ 🏥 Takes sertraline - Health - Verified
☐ ⚠️ Crowded spaces trigger - Triggers - Confirmed

Selected: 2 memories

[🗑️ Delete Selected] [🔕 Pause Selected] [📤 Export Selected]
[🏷️ Change Category] [✅ Mark as Verified]
```

### 2.5 Memory Verification Workflow

#### 2.5.1 Proactive Verification

The AI periodically asks users to verify inferred memories:

```
VERIFICATION REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I've noticed a pattern and want to check if I'm understanding correctly:

"It seems like you tend to feel more anxious on Sunday 
evenings. Is this something you've noticed too?"

[Yes, that's accurate] 
[Sometimes, but not always]
[No, that's not right]
[I'd prefer not to track this]

Your response helps me provide better support.
```

#### 2.5.2 Verification Queue

Users can review pending verifications:

```
PENDING VERIFICATIONS (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "User prefers shorter conversations in the morning"
   Detected: 3 days ago | [Verify] [Dismiss] [Edit]

2. "Work deadlines cause significant stress"
   Detected: 1 week ago | [Verify] [Dismiss] [Edit]

3. "User has difficulty with confrontation"
   Detected: 2 weeks ago | [Verify] [Dismiss] [Edit]

[Review All] [Clear All]
```

---

## Life Story Feature

### 3.1 Overview

The Life Story feature allows users to share their complete background with MindMate AI, creating a foundation for deeply personalized support. This goes beyond isolated facts to build a holistic understanding of the user's journey.

### 3.2 Life Story Sections

```
LIFE STORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: ████████░░░░░░░░ 50% Complete

┌─────────────────────────────────────────┐
│ 📋 SECTIONS                              │
├─────────────────────────────────────────┤
│ ✅ Early Life & Childhood               │
│ ✅ Family Background                      │
│ 🔄 Education & Schooling                │
│ ⏳ Relationships & Love Life            │
│ ⏳ Career & Work Life                    │
│ ⏳ Major Life Events                      │
│ ⏳ Mental Health History                  │
│ ⏳ Trauma & Difficult Experiences        │
│ ⏳ Values & Beliefs                       │
│ ⏳ Dreams & Aspirations                   │
└─────────────────────────────────────────┘

[Continue Where You Left Off] [Jump to Section]
```

### 3.3 Section Details

#### 3.3.1 Early Life & Childhood

```
EARLY LIFE & CHILDHOOD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This helps me understand the foundation of who you are.

Share what you're comfortable with:

🏠 Where did you grow up?
[City/Country or general region]

👨‍👩‍👧 What was your family structure like?
○ Two-parent household
○ Single parent
○ Blended family
○ Raised by relatives
○ Other: [_______________]

😊 What are some positive memories from childhood?
[Share as much or as little as you'd like...]

😔 Were there any difficult experiences growing up?
[This is completely optional...]

💭 How would you describe yourself as a child?
○ Shy and quiet
○ Outgoing and social
○ Somewhere in between
○ Other: [_______________]

[Save & Continue] [Skip This Section] [Save for Later]
```

#### 3.3.2 Trauma & Difficult Experiences

```
TRAUMA & DIFFICULT EXPERIENCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This section contains sensitive topics.

You have complete control:
- Share only what you're comfortable with
- Skip any questions
- Return and add more later
- Delete anything you've shared
- Mark topics as "do not discuss"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Have you experienced any of the following?
(Select all that apply, or none)

□ Loss of a loved one
□ Physical abuse
□ Emotional abuse
□ Sexual abuse
□ Neglect
□ Bullying
□ Accident or injury
□ Natural disaster
□ Witnessing violence
□ Discrimination
□ Other significant trauma: [_______________]
□ Prefer not to answer

For any selected, you can:
[Add Details] → Opens guided, gentle prompt
[Mark as Sensitive] → AI will never bring up unless you do
[Skip Details] → AI knows it happened, no details stored

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ PROTECTION SETTINGS

For each trauma shared, set boundaries:

○ Can reference generally ("I know you've experienced loss")
○ Can reference specifically ("I know you lost your mother in 2019")
○ Do not reference unless I bring it up
○ Do not store details - just know it happened

[Save & Continue] [Skip This Section] [Save for Later]
```

#### 3.3.3 Mental Health History

```
MENTAL HEALTH HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This helps me understand your mental health journey.

Current Mental Health:
□ Depression
□ Anxiety
□ Bipolar Disorder
□ PTSD/C-PTSD
□ OCD
□ ADHD
□ Eating Disorder
□ Substance Use
□ Other: [_______________]
□ None diagnosed
□ Prefer not to say

Have you ever:
□ Been hospitalized for mental health
□ Had thoughts of self-harm
□ Attempted self-harm
□ Had suicidal thoughts
□ Attempted suicide
□ None of the above
□ Prefer not to say

Current Treatment:
□ Therapy/Counseling
   └─ Type: [Individual/Group/Other]
   └─ Frequency: [_______________]
□ Medication
   └─ Names: [_______________]
□ Psychiatric care
□ Support groups
□ Self-help practices
□ No current treatment

What has helped you in the past?
[Share therapies, approaches, or practices that have worked...]

What hasn't worked or has been harmful?
[Share approaches to avoid...]

[Save & Continue] [Skip This Section] [Save for Later]
```

### 3.4 Life Story AI Integration

#### 3.4.1 How Life Story Informs Conversations

```
LIFE STORY INTEGRATION EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENARIO 1: User mentions feeling down
├─ Without Life Story:
│  "I'm sorry you're feeling down. Can you tell me more?"
│
└─ With Life Story (knows about past depression):
   "I notice you're feeling down today. I remember you've 
    experienced depression before. Is this feeling similar 
    to what you've felt in the past, or does it feel different?"

SCENARIO 2: User mentions family conflict
├─ Without Life Story:
│  "Family conflict can be really challenging. Tell me more."
│
└─ With Life Story (knows about difficult family background):
   "Family conflict can be especially difficult given your 
    history. How are you taking care of yourself through this?"

SCENARIO 3: Anniversary of loss approaching
├─ AI proactively acknowledges:
   "I know this time of year can be difficult with the 
    anniversary of your mother's passing coming up. How 
    are you feeling as that date approaches?"
```

#### 3.4.2 Life Story Privacy Controls

```
LIFE STORY PRIVACY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each section, set visibility:

○ Full Access - Can reference in any relevant conversation
○ Limited Access - Only reference when directly relevant
○ High Sensitivity - Never reference unless I explicitly mention it
○ Archive Only - Store for context but never actively use

🚨 EMERGENCY OVERRIDE

In crisis situations, should Life Story information be accessible?
○ Yes - Full access for appropriate crisis response
○ Limited - Only critical information (medications, diagnoses)
○ No - Do not access Life Story during crisis

[Update Privacy Settings]
```

### 3.5 Life Story Completion & Updates

```
LIFE STORY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completion: 75% ████████████░░░░

Last Updated: 2 weeks ago

Recent Additions:
• New relationship status (3 days ago)
• Career change details (1 week ago)
• Updated medication information (2 weeks ago)

Suggested Updates:
⚠️ It's been 6 months since you shared about work stress.
   Has this situation changed?

[Update Section] [Review Full Story] [Download My Story]
```

---

## Trigger Map

### 4.1 Overview

The Trigger Map is a visualization tool that helps users understand patterns in their emotional distress. By tracking correlations between situations, contexts, and emotional responses over time, the AI builds a personalized map of triggers and early warning signs.

### 4.2 Trigger Map Architecture

```
TRIGGER MAP STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    ┌─────────────────┐
                    │  CORE DISTRESS  │
                    │    (Center)     │
                    │  Anxiety: 7.2/10│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │PRIMARY  │          │PRIMARY  │          │PRIMARY  │
   │TRIGGER 1│          │TRIGGER 2│          │TRIGGER 3│
   │Work     │          │Social   │          │Family   │
   │Stress   │          │Situations│         │Conflict │
   │Impact:  │          │Impact:  │          │Impact:  │
   │  8.5/10 │          │  6.2/10 │          │  7.8/10 │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                    │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │Secondary│          │Secondary│          │Secondary│
   │Triggers │          │Triggers │          │Triggers │
   ├─Deadlines│         ├─Crowds  │          ├─Holidays│
   ├─Meetings │         ├─New ppl │          ├─Phone   │
   └─Reviews  │         └─Conflict│          │calls   │
              │                    │                    │
         ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
         │Warning  │          │Warning  │          │Warning  │
         │ Signs   │          │ Signs   │          │ Signs   │
         ├─Sleep   │          ├─Avoidance│         ├─Irritab.│
         ├─Rumination│        ├─Physical │          ├─Withdraw│
         └─Appetite│          │ symptoms│          └─Catastr.│
                   │                    │                    │
              ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
              │Coping   │          │Coping   │          │Coping   │
              │Strategies│         │Strategies│         │Strategies│
              ├─Breathing│         ├─Prep work│         ├─Boundaries│
              ├─Walks   │          ├─Buddy sys│         ├─Time limits│
              └─Talk to │          └─Exit plan│         └─Self-care│
                 therapist                              
```

### 4.3 Trigger Detection System

#### 4.3.1 Data Collection Points

```
TRIGGER DETECTION INPUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXPLICIT REPORTS
   User directly states: "Work presentations make me anxious"
   → High confidence, immediate addition to Trigger Map

2. SESSION PATTERNS
   - Emotional check-in scores
   - Session topics
   - User-reported distress levels
   → Correlation analysis over time

3. CONTEXTUAL SIGNALS
   - Time of day/week
   - Seasonal patterns
   - Life events calendar
   → Temporal trigger detection

4. LANGUAGE ANALYSIS
   - Word choice changes
   - Sentiment shifts
   - Topic recurrence
   → Behavioral pattern recognition

5. PHYSICAL INDICATORS (if shared)
   - Sleep quality reports
   - Appetite changes
   - Physical symptoms
   → Somatic trigger correlation
```

#### 4.3.2 Confidence Scoring for Triggers

```
TRIGGER CONFIDENCE ALGORITHM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confidence = Base Score + Correlation Strength + Temporal Consistency

Base Score (0-30):
• Explicit report: +30
• Inferred pattern: +10

Correlation Strength (0-40):
• Strong correlation (r > 0.7): +40
• Moderate (r 0.4-0.7): +25
• Weak (r < 0.4): +10

Temporal Consistency (0-30):
• 5+ occurrences: +30
• 3-4 occurrences: +20
• 2 occurrences: +10

CONFIDENCE LEVELS:
• 0-40: Hypothesis (not displayed to user)
• 41-60: Possible Trigger (flagged for verification)
• 61-80: Probable Trigger (shown with uncertainty language)
• 81-100: Confirmed Trigger (fully integrated into map)
```

### 4.4 Trigger Map Visualization

#### 4.4.1 Main Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  🗺️ YOUR TRIGGER MAP                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📅 View: [Last 30 Days ▼]  [Anxiety ▼]  [Intensity ▼]     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │           [INTERACTIVE VISUALIZATION]               │   │
│  │                                                     │   │
│  │     • Work Stress (8.5) ──────●────────────        │   │
│  │       /          \                                  │   │
│  │  Deadlines   Performance Reviews                    │   │
│  │  (7.2)         (6.8)                                │   │
│  │                                                     │   │
│  │     • Social Situations (6.2) ──●───────           │   │
│  │       /         \                                   │   │
│  │   Crowds      Meeting New People                    │   │
│  │   (5.5)          (6.0)                              │   │
│  │                                                     │   │
│  │     • Family Conflict (7.8) ─────●────────         │   │
│  │                                                     │   │
│  │  [Zoom] [Pan] [Filter] [Export] [Share with Therapist]│  │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📊 INSIGHTS                                                 │
│  ├─ Most impactful trigger: Work Stress (8.5/10)           │
│  ├─ Most frequent trigger: Social Situations (12x this month)│
│  ├─ Emerging pattern: Sleep quality declining before triggers│
│  └─ Positive trend: Family conflict triggers down 30%        │
│                                                              │
│  🔔 ACTIVE ALERTS                                            │
│  ⚠️ High-risk period detected: Annual review season         │
│     [View Preparation Plan] [Dismiss]                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Trigger Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER DETAIL: Work Stress                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Impact Score: 8.5/10 (High)                                 │
│  Confidence: 94% (Confirmed)                                 │
│  First Detected: 3 months ago                                │
│  Occurrences: 23                                             │
│                                                              │
│  📈 INTENSITY OVER TIME                                      │
│  │                                                          │
│  10│                                          ╭─╮           │
│   8│        ╭─╮    ╭─╮         ╭──╮         │ │           │
│   6│  ╭────╯ ╰────╯ ╰────╭────╯  ╰────╭────╯ │           │
│   4│──╯                   ╰───────────╯       ╰────       │
│   2│                                                        │
│   0└────────────────────────────────────────────────        │
│     Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep             │
│                                                              │
│  🔗 SECONDARY TRIGGERS                                       │
│  ├─ Deadlines (correlation: 0.82)                           │
│  ├─ Performance Reviews (correlation: 0.76)                 │
│  ├─ Public Speaking (correlation: 0.71)                     │
│  └─ Criticism from Supervisor (correlation: 0.68)           │
│                                                              │
│  ⚠️ WARNING SIGNS                                            │
│  These often appear before this trigger:                     │
│  ├─ Difficulty sleeping (appears 2-3 days before, 78% of time)│
│  ├─ Increased rumination (appears 1 day before, 82% of time)│
│  └─ Appetite changes (appears same day, 65% of time)        │
│                                                              │
│  💡 EFFECTIVE COPING STRATEGIES                              │
│  Based on your history, these have helped:                   │
│  ├─ ✅ Deep breathing exercises (reduced intensity 40%)      │
│  ├─ ✅ Walking breaks (reduced intensity 35%)                │
│  ├─ ✅ Talking to therapist (reduced intensity 50%)          │
│  └─ ⚠️ Avoiding (temporarily reduced but increased later)    │
│                                                              │
│  [View Full History] [Edit Trigger] [Delete] [Export Data]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Predictive Alerts

#### 4.5.1 Proactive Trigger Warnings

```
TRIGGER ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔔 Pattern Alert

I noticed something based on your Trigger Map:

"You typically experience increased anxiety around 
work deadlines. I see you have a major deadline 
coming up next Tuesday."

Would you like to:
[Review Your Coping Plan]
[Schedule a Check-in Before Then]
[Practice a Calming Exercise Now]
[Dismiss This Alert]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on your history, here's what's helped before:
• Starting tasks early (you've mentioned this helps)
• Breaking into smaller steps
• Regular check-ins with your team
• Evening wind-down routine
```

#### 4.5.2 Seasonal Pattern Detection

```
SEASONAL PATTERN DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Analysis of your mood data over the past year shows:

Lower mood scores typically occur:
• November through February
• Correlation strength: 0.74 (strong)

This pattern is consistent with seasonal changes.

💡 Suggestions:
• Consider discussing light therapy with your provider
• Your past data shows outdoor walks help even in winter
• Schedule extra self-care during these months

[View Full Seasonal Analysis] [Set Seasonal Reminders]
```

### 4.6 User Control Over Trigger Map

```
TRIGGER MAP SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECTION PREFERENCES

○ Automatic Detection (AI identifies patterns)
○ Assisted Detection (AI suggests, you confirm)
○ Manual Only (you identify all triggers)

PRIVACY LEVEL

○ Full Analysis (all patterns, all detail)
○ Moderate (confirmed patterns only)
○ Minimal (major triggers only, no detail)
○ Custom: [Configure]

ALERT PREFERENCES

☑️ Alert me before high-risk periods
☑️ Suggest coping strategies proactively
☐ Share alerts with my therapist
☑️ Weekly pattern summary

DATA RETENTION

Keep trigger data for:
○ 1 year
○ 2 years  
○ 5 years
○ Indefinitely
○ Custom: [_______]

[Save Settings] [Export All Data] [Delete All Trigger Data]
```

---

## User Interface Specifications

### 5.1 Memory Center Navigation

```
MEMORY CENTER NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│  🧠 MEMORY CENTER                                    [⚙️]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  📋 MEMORIES │  │  📖 LIFE    │  │  🗺️ TRIGGER │        │
│  │             │  │    STORY    │  │    MAP      │        │
│  │  147 items  │  │  75% done   │  │  12 triggers│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [CONTENT AREA - Context dependent]                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  BOTTOM NAVIGATION:                                          │
│  [🏠 Home] [🔍 Search] [➕ Add] [📊 Insights] [⚙️ Settings]  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Quick Memory Actions

```
QUICK ADD MEMORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available from any screen via [+] button:

┌─────────────────────────────────────────┐
│  ADD NEW                                │
├─────────────────────────────────────────┤
│  📝 Quick Note                          │
│     "Something I want to remember..."   │
│                                         │
│  🏷️ Categorized Memory                  │
│     Choose category and add details     │
│                                         │
│  📖 Update Life Story                   │
│     Add to your background              │
│                                         │
│  ⚠️ Report Trigger                      │
│     Something that caused distress      │
│                                         │
│  💡 Share Coping Strategy               │
│     Something that helped               │
│                                         │
│  [🎤 Voice Note] [📎 Attach]            │
└─────────────────────────────────────────┘
```

### 5.3 In-Conversation Memory Controls

```
IN-CONVERSATION MEMORY UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

During any conversation, users can:

1. MEMORY PILL (appears when AI uses a memory)
   ┌─────────────────────────────┐
   │ 💭 Based on 2 memories      │
   └─────────────────────────────┘
   Click to: View memories used | Edit | Delete

2. MEMORY TOOLTIP (hover over relevant AI response)
   "I'm referencing: Your sister Sarah, Work stress patterns"

3. QUICK CORRECTION
   User: "Actually, my sister's name is Sara, not Sarah"
   AI: "Thank you for the correction! I'll update that."
   [Memory updated indicator flashes]

4. MEMORY PANEL (swipe from right)
   ┌─────────────────────────────┐
   │ Memories in this conversation│
   ├─────────────────────────────┤
   │ • Sister: Sara (H)           │
   │ • Work stress (P)            │
   │ • Prefers mornings (C)       │
   │                             │
   │ [View All] [Add New]        │
   └─────────────────────────────┘
   (H=High confidence, P=Probable, C=Confirmed)
```

---

## Privacy & Security

### 6.1 Data Protection Principles

```
PRIVACY BY DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. USER OWNERSHIP
   • Users own all their memory data
   • Can export in standard formats anytime
   • Can delete permanently at any time

2. MINIMUM NECESSARY
   • Only store what's needed for support
   • Regular review of stored memories
   • Automatic purging of outdated data

3. TRANSPARENCY
   • Users can see everything that's stored
   • Clear explanations of why data is kept
   • Audit trail of all memory access

4. CONSENT
   • Explicit consent for sensitive data
   • Granular control over what to share
   • Easy opt-out of any feature

5. SECURITY
   • End-to-end encryption for all memories
   • No third-party access
   • Regular security audits
```

### 6.2 Privacy Controls

```
PRIVACY DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────┐
│  🔒 YOUR PRIVACY                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DATA OVERVIEW                                               │
│  ├─ Total memories stored: 147                              │
│  ├─ Sensitive memories: 23                                  │
│  ├─ Data size: 2.3 MB                                       │
│  └─ Last backup: Today, 3:00 AM                             │
│                                                              │
│  ACCESS LOG (Last 7 Days)                                    │
│  ├─ You: 45 accesses                                        │
│  ├─ AI (conversation): 127 accesses                         │
│  ├─ AI (pattern analysis): 12 accesses                      │
│  └─ Third parties: 0 (never)                                │
│                                                              │
│  SHARING SETTINGS                                            │
│  ├─ Therapist access: ☐ Enabled                             │
│  ├─ Emergency contacts: ☐ Enabled                           │
│  └─ Research participation: ☐ Enabled                       │
│                                                              │
│  SENSITIVE DATA                                              │
│  ├─ Trauma history: 🔒 Encrypted, high protection           │
│  ├─ Mental health details: 🔒 Encrypted, high protection    │
│  └─ Medication info: 🔒 Encrypted, high protection          │
│                                                              │
│  [Download My Data] [Delete Account] [Contact Privacy Team] │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Crisis Override Settings

```
CRISIS PROTOCOL SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In a mental health crisis, should MindMate AI:

○ Access full memory profile for appropriate response
○ Access limited profile (critical info only)
○ Do not access memories during crisis

If crisis detected, should AI:

☑️ Use Life Story context for supportive response
☑️ Reference known support people
☑️ Consider known triggers in response
☐ Share crisis info with emergency contact
☐ Share crisis info with therapist

Emergency Contact: [Configure]
Therapist Contact: [Configure]

[Save Crisis Settings]
```

---

## Technical Architecture

### 7.1 Memory Storage Structure

```
MEMORY DATA MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEMORY ENTITY
{
  id: UUID,
  user_id: UUID,
  
  // Content
  category: ENUM[personal, relationship, health, goal, 
                 pattern, trigger, coping, life_story],
  content: TEXT,
  context: TEXT, // Original conversation context
  
  // Confidence & Verification
  confidence_score: FLOAT (0-100),
  verification_status: ENUM[unconfirmed, probable, 
                            confirmed, verified],
  verified_by: ENUM[ai_inference, user_explicit, 
                    user_confirmation],
  verification_date: TIMESTAMP,
  
  // Usage Tracking
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP,
  last_accessed: TIMESTAMP,
  access_count: INTEGER,
  
  // Privacy
  sensitivity_level: ENUM[low, medium, high, critical],
  can_reference: BOOLEAN,
  can_surface: BOOLEAN,
  
  // Relationships
  related_memories: ARRAY[UUID],
  trigger_map_node: UUID (nullable),
  life_story_section: UUID (nullable),
  
  // Versioning
  version: INTEGER,
  previous_versions: ARRAY[OBJECT],
  
  // Source
  source_session: UUID,
  source_message: UUID
}
```

### 7.2 Trigger Map Data Model

```
TRIGGER MAP DATA MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIGGER NODE
{
  id: UUID,
  user_id: UUID,
  
  // Identity
  name: STRING,
  description: TEXT,
  category: ENUM[situational, temporal, interpersonal, 
                 internal, environmental],
  
  // Metrics
  impact_score: FLOAT (0-10),
  frequency: INTEGER,
  confidence: FLOAT (0-100),
  
  // Relationships
  parent_trigger: UUID (nullable),
  child_triggers: ARRAY[UUID],
  correlated_triggers: ARRAY[{
    trigger_id: UUID,
    correlation_score: FLOAT
  }],
  
  // Patterns
  warning_signs: ARRAY[STRING],
  coping_strategies: ARRAY[{
    strategy: STRING,
    effectiveness: FLOAT
  }],
  
  // Temporal
  temporal_patterns: {
    day_of_week: ARRAY[INTEGER],
    time_of_day: ARRAY[STRING],
    seasonal: BOOLEAN,
    anniversary: BOOLEAN
  },
  
  // History
  occurrences: ARRAY[{
    date: TIMESTAMP,
    intensity: FLOAT,
    context: TEXT
  }],
  
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### 7.3 Memory Retrieval API

```
MEMORY RETRIEVAL API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/v1/memories
  Query params:
  - category: Filter by category
  - confidence_min: Minimum confidence score
  - query: Text search
  - related_to: Find memories related to specific memory
  - limit: Number of results
  - offset: Pagination

Response:
{
  memories: [MemoryEntity],
  total: INTEGER,
  facets: {
    categories: [{name, count}],
    confidence_distribution: OBJECT
  }
}

GET /api/v1/memories/relevant
  Body:
  {
    context: STRING, // Current conversation context
    emotion: STRING, // Current detected emotion
    limit: INTEGER
  }
  
  Returns memories most relevant to current context

POST /api/v1/memories
  Create new memory

PUT /api/v1/memories/{id}
  Update existing memory

DELETE /api/v1/memories/{id}
  Delete memory (with soft delete option)

POST /api/v1/memories/{id}/verify
  Verify or dispute a memory
```

### 7.4 Trigger Map API

```
TRIGGER MAP API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/v1/trigger-map
  Returns complete trigger map for user

GET /api/v1/trigger-map/nodes/{id}
  Get specific trigger node with full details

POST /api/v1/trigger-map/nodes
  Create new trigger (manual entry)

PUT /api/v1/trigger-map/nodes/{id}
  Update trigger details

DELETE /api/v1/trigger-map/nodes/{id}
  Remove trigger from map

GET /api/v1/trigger-map/insights
  Returns:
  - Top triggers
  - Emerging patterns
  - Seasonal trends
  - Coping effectiveness

POST /api/v1/trigger-map/analyze
  Trigger manual pattern analysis
  Body: { start_date, end_date, focus_areas }
```

---

## Implementation Checklist

### Phase 1: Core Memory System
- [ ] Memory storage infrastructure
- [ ] Basic CRUD operations
- [ ] Confidence scoring system
- [ ] In-conversation memory surfacing
- [ ] Memory Center UI
- [ ] User verification workflow

### Phase 2: Life Story Feature
- [ ] Life Story section framework
- [ ] Guided input flows for each section
- [ ] Trauma-sensitive input handling
- [ ] Privacy controls per section
- [ ] AI integration for Life Story context

### Phase 3: Trigger Map
- [ ] Pattern detection algorithms
- [ ] Trigger correlation analysis
- [ ] Visualization components
- [ ] Predictive alert system
- [ ] User control interface

### Phase 4: Advanced Features
- [ ] Memory import/export
- [ ] Therapist sharing
- [ ] Advanced analytics
- [ ] Mobile optimization
- [ ] Accessibility compliance

---

## Appendix

### A. Memory Categories Reference

| Category | Description | Examples |
|----------|-------------|----------|
| Personal | Basic identity information | Name, age, location, occupation |
| Relationship | Connections with others | Family, friends, partner, colleagues |
| Health | Medical and wellness info | Diagnoses, medications, symptoms |
| Goal | Aspirations and targets | Career goals, personal growth aims |
| Pattern | Behavioral observations | Emotional patterns, coping trends |
| Trigger | Distress-causing factors | Situations, people, topics |
| Coping | Helpful strategies | Techniques, activities, supports |
| Life Story | Background narrative | Childhood, major life events |

### B. Confidence Level Definitions

| Level | Score | Description | Usage |
|-------|-------|-------------|-------|
| Unconfirmed | 0-40 | AI hypothesis, not verified | Not used in conversation |
| Probable | 41-70 | Some evidence, needs confirmation | Used tentatively |
| Confirmed | 71-90 | Multiple data points support | Used normally |
| Verified | 91-100 | Explicitly confirmed by user | High reliability usage |

### C. Glossary

- **Memory Entity**: A single piece of information stored about the user
- **Trigger Map**: Visual representation of distress patterns and their relationships
- **Life Story**: Comprehensive background information shared by the user
- **Confidence Score**: Numerical rating of memory reliability (0-100)
- **Pattern Detection**: AI analysis to identify recurring behaviors or responses
- **Surfacing**: The act of recalling and using a memory in conversation

---

*Document Version 1.0 - MindMate AI Product Team*
