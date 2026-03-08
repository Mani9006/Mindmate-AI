# MindMate AI - Daily Challenges & Micro-Interactions UX Specification

## Document Information
- **Version**: 1.0.0
- **Last Updated**: 2024
- **Status**: Production Ready
- **Author**: Agent 15 - Daily Check-in & Challenge UX Designer

---

## Table of Contents
1. [Daily Micro-Interaction Flows](#1-daily-micro-interaction-flows)
   - Morning Check-in Flow
   - Mood Rating Flow
   - Challenge Assignment Flow
   - Task Completion Flow
   - Evening Wind-down Flow
2. [Challenge/Task Card UI Designs](#2-challengetask-card-ui-designs)
   - Breathing Exercise UI
   - Meditation Timer UI
   - Journaling Prompt UI
   - Gratitude Log UI
3. [100 Challenge Prompts](#3-100-challenge-prompts)
   - Breathwork (1-12)
   - Cognitive (13-24)
   - Behavioral (25-36)
   - Social (37-48)
   - Physical (49-60)
   - Mindfulness (61-72)
   - Journaling (73-84)
   - Gratitude (85-92)
   - Sleep (93-100)

---

## 1. Daily Micro-Interaction Flows

### 1.1 Morning Check-in Flow

#### Flow Overview
```
[Push Notification] → [Splash Screen] → [Greeting Animation] → [Energy Check] → [Intention Setting] → [Dashboard]
```

#### Screen Specifications

##### Push Notification
```
Title: "Good morning, [Name] 🌅"
Body: "Ready to start your day with intention?"
Action Buttons: [Check In] [Snooze 10min]
Deep Link: mindmate://morning-checkin
```

##### Splash Screen
```
Animation: Gentle sunrise gradient (5s loop)
Background: Linear gradient from #1a1a2e → #16213e → #0f3460
Elements:
  - Animated sun rising from bottom
  - Subtle particle effects (floating light orbs)
  - "Good Morning" text fade-in (2s)
  - User's name personalization
  - Date display: "Monday, January 15"
  - Weather widget (optional integration)
```

##### Greeting Animation
```
Animation Sequence:
  1. "Good Morning, [Name]" (fade in, 0.5s)
  2. Inspirational quote card slides up (0.3s)
  3. CTA button pulses gently

Quote Examples:
  - "Today is a new beginning."
  - "Your mental health matters."
  - "Small steps lead to big changes."

CTA: "Begin Check-in" (primary button)
```

##### Energy Check Screen
```
Header: "How's your energy today?"

Visual Scale (Horizontal Slider):
  [😴] ----[😕]----[😐]----[🙂]----[⚡]
   1      2      3      4      5

Labels:
  1: "Exhausted"
  2: "Low Energy"
  3: "Neutral"
  4: "Good"
  5: "Energized"

Interaction:
  - Drag slider with haptic feedback at each point
  - Selected emoji scales up (1.2x) with bounce animation
  - Color changes: gray → yellow → green gradient

Follow-up (conditional):
  If energy ≤ 2: "What's draining your energy?" [Text input]
  If energy ≥ 4: "What's fueling you today?" [Text input]
```

##### Intention Setting Screen
```
Header: "Set your intention for today"
Subheader: "What would make today meaningful?"

Input Options:
  1. Quick Select (chips):
     - "Be present"
     - "Practice self-care"
     - "Connect with others"
     - "Learn something new"
     - "Be kind to myself"
     - "Stay focused"
     - Custom: [+ Add your own]

  2. Custom Input:
     Text field with placeholder:
     "I intend to..."
     Character limit: 100

Visual Feedback:
  - Selected chip gets checkmark and highlight
  - Custom input expands with animated height

CTA: "Set Intention" → transitions to dashboard
```

##### Dashboard Entry Animation
```
Sequence:
  1. Intention card slides down and shrinks into dashboard widget
  2. Today's challenges fade in with stagger (0.1s each)
  3. Progress ring animates to current completion %
  4. Streak counter flips like an odometer

Dashboard Elements:
  - Date header with greeting
  - Intention widget (collapsible)
  - Today's challenges list
  - Progress overview
  - Streak indicator
  - Quick action FAB
```

---

### 1.2 Mood Rating Flow

#### Flow Overview
```
[Trigger] → [Mood Selector] → [Intensity Scale] → [Context Tags] → [Optional Note] → [Completion]
```

#### Trigger Points
- Scheduled: 3x daily (morning, afternoon, evening)
- Post-challenge completion
- User-initiated from dashboard
- Contextual: After detecting low app engagement

#### Mood Selector Screen
```
Header: "How are you feeling right now?"
Subheader: "Tap the emotion that best describes you"

Mood Grid (2x4):
┌─────────┬─────────┐
│  😊     │  😔     │
│ Happy   │ Sad     │
├─────────┼─────────┤
│  😰     │  😠     │
│ Anxious │ Angry   │
├─────────┼─────────┤
│  😌     │  😴     │
│ Calm    │ Tired   │
├─────────┼─────────┤
│  🤔     │  🌟     │
│ Neutral │ Excited │
└─────────┴─────────┘

Visual Design:
  - Each mood: 80x80px circular button
  - Background: Subtle color tint per mood
    - Happy: #FFD93D (warm yellow)
    - Sad: #6C7A89 (cool gray-blue)
    - Anxious: #E74C3C (alert red)
    - Angry: #C0392B (deep red)
    - Calm: #52B788 (soft green)
    - Tired: #8E44AD (muted purple)
    - Neutral: #95A5A6 (neutral gray)
    - Excited: #F39C12 (energetic orange)

Interaction:
  - Tap: Scale up (1.1x), ripple effect
  - Selected: Border highlight, checkmark appears
  - Haptic: Light impact feedback
```

#### Intensity Scale Screen
```
Header: "How intense is this feeling?"
Selected Mood: [Large emoji display with label]

Visual Scale (Vertical Slider Alternative):
  ┌─────────────────┐
  │     🌊          │
  │    Mild         │ ← 1-2
  │  ━━━━━━━━━━━━   │
  │    Moderate     │ ← 3-4
  │  ━━━━━━━━━━━━   │
  │     Strong      │ ← 5-6
  │  ━━━━━━━━━━━━   │
  │   Overwhelming  │ ← 7-8
  │  ━━━━━━━━━━━━   │
  │    Extreme      │ ← 9-10
  └─────────────────┘

Alternative: Circular dial (0-10)
  - Drag to adjust
  - Number displays in center
  - Color gradient: green → yellow → orange → red

Labels:
  1-3: "Mild - I can manage this"
  4-6: "Moderate - It's noticeable"
  7-8: "Strong - It's affecting me"
  9-10: "Extreme - I need support"
```

#### Context Tags Screen
```
Header: "What's contributing to this feeling?"
Subheader: "Select all that apply"

Tag Categories:

Work/School:
  □ Work stress
  □ Deadlines
  □ Success/achievement
  □ Learning/growth
  □ Colleagues/peers

Relationships:
  □ Family
  □ Friends
  □ Partner
  □ Conflict
  □ Connection

Health:
  □ Physical health
  □ Sleep quality
  □ Exercise
  □ Nutrition

Environment:
  □ Weather
  □ Location
  □ News/events
  □ Social media

Personal:
  □ Finances
  □ Future plans
  □ Self-image
  □ Creativity
  □ Spirituality

Visual Design:
  - Chips with rounded corners (16px radius)
  - Selected: Filled background, white text
  - Unselected: Outlined, colored text
  - Max selection: 5 tags

Interaction:
  - Tap to toggle
  - Selected chips animate into a "selected" row at top
```

#### Optional Note Screen
```
Header: "Want to add more context?"
Subheader: "This helps you track patterns over time"

Input:
  Text area with placeholder:
  "What's on your mind? (optional)"
  
Quick prompts (if user hesitates):
  - "I noticed..."
  - "I'm thinking about..."
  - "I want to remember..."

Voice input option:
  🎤 "Record a voice note"

Character limit: 500
Auto-save: Every 3 seconds

CTA: "Save Mood Entry" (primary)
Skip option: "Save without note" (text link)
```

#### Completion Screen
```
Animation: Success checkmark with confetti
Message: "Mood logged! 🎉"

Insights (if applicable):
  "You've been feeling [trend] lately."
  "This is your [X] day tracking moods!"

Next Actions:
  - "View your mood history"
  - "Try a quick exercise"
  - "Back to dashboard"

Auto-dismiss: 5 seconds
```

---

### 1.3 Challenge Assignment Flow

#### Flow Overview
```
[Assessment] → [Algorithm Match] → [Challenge Presentation] → [Accept/Decline] → [Schedule] → [Confirmation]
```

#### Assessment Inputs
```
Data Points Considered:
1. User Profile:
   - Goals (selected during onboarding)
   - Preferred challenge types
   - Time availability
   - Experience level

2. Recent Activity:
   - Last 7 days completion rate
   - Preferred challenge categories
   - Average time spent per challenge
   - Skipped challenges (avoid patterns)

3. Current State:
   - Today's mood rating
   - Energy level (morning check-in)
   - Time of day
   - Day of week

4. Historical Patterns:
   - Most successful challenge types
   - Best completion times
   - Streak maintenance factors
```

#### Algorithm Logic
```
Challenge Selection Algorithm:

IF energy_level <= 2:
    PRIORITY = [breathwork, mindfulness, sleep]
    difficulty = "gentle"
    duration = "short" (2-5 min)

ELSE IF mood == "anxious" OR mood == "stressed":
    PRIORITY = [breathwork, mindfulness, grounding]
    difficulty = "moderate"
    duration = "medium" (5-10 min)

ELSE IF time_of_day == "morning":
    PRIORITY = [physical, mindfulness, gratitude]
    difficulty = "moderate"
    duration = "medium" (5-15 min)

ELSE IF time_of_day == "evening":
    PRIORITY = [journaling, sleep, gratitude]
    difficulty = "gentle"
    duration = "flexible"

ELSE IF streak_at_risk:
    PRIORITY = [quickest_completion_categories]
    difficulty = "easy"
    duration = "short" (1-3 min)

ELSE:
    PRIORITY = [user_preferences, variety_rotation]
    difficulty = "adaptive"
    duration = "user_preferred"

Diversity Rule:
    - No same category 2 days in a row (unless user preference)
    - Rotate through all categories every 7 days
    - Include at least 1 new challenge type per week
```

#### Challenge Presentation Screen
```
Header: "Today's Challenge for You"

Challenge Card:
┌─────────────────────────────────────┐
│  [Category Icon]  [Difficulty Badge]│
│                                     │
│         Challenge Title             │
│                                     │
│   Brief description of what the     │
│   user will do in this challenge.   │
│                                     │
│  ⏱️ 5 min  |  🎯 Beginner  |  🔥 15 │
│                                     │
│  [Why this helps]                   │
│  "This exercise helps reduce        │
│   anxiety by activating your        │
│   parasympathetic nervous system."  │
│                                     │
│  [Accept Challenge]  [See Options]  │
└─────────────────────────────────────┘

Visual Elements:
  - Category color coding
  - Animated preview (if applicable)
  - Completion count: "[X] people completed today"
  - Your streak impact: "+1 day streak!"

Animation:
  - Card slides up from bottom
  - Elements fade in with stagger
  - CTA button pulses subtly
```

#### Alternative Options Screen
```
Header: "Other Challenges for Today"
Subheader: "Based on your goals and mood"

Challenge List (3 alternatives):
┌─────────────────────────────────────┐
│ [🧘] Mindful Morning Meditation     │
│ 10 min • Intermediate • 45 done     │
│ "Start your day with clarity"       │
├─────────────────────────────────────┤
│ [📝] Three Good Things              │
│ 5 min • Beginner • 120 done         │
│ "Boost positivity with gratitude"   │
├─────────────────────────────────────┤
│ [💪] Energy Movement                │
│ 8 min • Beginner • 89 done          │
│ "Gentle stretches to wake up"       │
└─────────────────────────────────────┘

Interaction:
  - Swipe to see more
  - Tap to preview
  - Pull to refresh for new options
```

#### Schedule Screen
```
Header: "When would you like to do this?"

Options:
  ○ Right now
  ○ Later today (time picker)
  ○ Add to my schedule

Time Picker:
  - Scroll wheel for hour/minute
  - Smart suggestions:
    - "After lunch (1:00 PM)"
    - "Evening wind-down (8:00 PM)"
    - "Before bed (10:00 PM)"

Reminder Toggle:
  ☑️ Remind me 15 minutes before

CTA: "Confirm & Schedule"
```

#### Confirmation Screen
```
Animation: Challenge card locks into dashboard

Message: "Challenge accepted! 💪"

Summary:
  - Challenge name
  - Scheduled time (if applicable)
  - Reminder set (if applicable)
  - Estimated completion: +[X] points

Motivational Message:
  - "You've got this!"
  - "Small steps, big impact."
  - "Your future self will thank you."

Next:
  - "Start now" (if scheduled for now)
  - "Back to dashboard"
```

---

### 1.4 Task Completion Flow

#### Flow Overview
```
[Start Challenge] → [In-Progress UI] → [Completion Action] → [Celebration] → [Reflection] → [Reward] → [Next Steps]
```

#### Start Challenge Screen
```
Header: [Challenge Name]
Progress: Step 1 of [N]

Visual:
  - Challenge-specific background
  - Progress indicator (dots or bar)
  - Timer (if applicable)
  - Instructions card

CTA: "Begin" / "Start Exercise"

Pre-start Checklist:
  □ Find a comfortable position
  □ Minimize distractions
  □ Take a deep breath

Optional:
  - Background music selector
  - Do Not Disturb toggle
```

#### In-Progress UI States

##### For Breathing Exercises:
```
Visual: Animated circle/breathing guide
  - Expands on inhale
  - Holds at peak
  - Contracts on exhale

Text Cues:
  "Breathe in..." (4 counts)
  "Hold..." (4 counts)
  "Breathe out..." (4 counts)

Controls:
  - Pause/Resume
  - Adjust pace (slower/faster)
  - Skip to next phase
  - Sound on/off

Progress:
  - Cycle counter: "3 of 10"
  - Time elapsed
```

##### For Meditation:
```
Visual: Calm background with subtle animation
  - Floating particles
  - Gentle wave motion
  - Ambient gradient shifts

Timer Display:
  Large centered countdown
  "05:00" → counts down

Controls:
  - Play/Pause
  - +1 min / -1 min
  - End early
  - Background sounds

Guidance:
  - Voice prompts (optional)
  - Text prompts at intervals
  - Bell sounds at start/end
```

##### For Journaling:
```
Visual: Clean, distraction-free writing space

Prompt Display:
  Sticky note style card at top

Text Area:
  - Full screen
  - Comfortable font size (18px)
  - Line spacing: 1.6
  - Auto-save indicator

Tools:
  - Word count
  - Timer (optional)
  - Voice-to-text
  - Formatting (minimal)

Progress:
  - "You've written [X] words"
  - Encouragement messages at milestones
```

##### For Physical Challenges:
```
Visual: Exercise demonstration
  - Animated GIF or video
  - Step-by-step images

Timer:
  - Rep counter or duration
  - Rest periods

Instructions:
  - Current step highlighted
  - Next step preview

Controls:
  - Pause for breaks
  - Mark as complete
  - Skip exercise
```

#### Completion Action
```
Trigger Options:
  - Timer completes
  - User taps "Complete"
  - Required reps/actions done
  - Minimum time threshold met

Validation:
  - Minimum engagement check (anti-gaming)
  - Confirm completion dialog (optional)
```

#### Celebration Screen
```
Animation Sequence:
  1. Success sound effect
  2. Confetti explosion (varies by streak)
  3. Achievement badge appears
  4. Stats update with number flip animation

Message:
  "Challenge Complete! 🎉"

Stats Display:
  ┌─────────────────────────────────────┐
  │  ⏱️ Time: 5:32                      │
  │  ⭐ Points: +50                     │
  │  🔥 Streak: 7 days                  │
  │  🏆 Total: 45 challenges            │
  └─────────────────────────────────────┘

Streak Animation:
  - Fire emoji grows and pulses
  - Number flips like odometer
  - If new record: "New personal best!"
```

#### Reflection Screen (Optional)
```
Header: "How do you feel now?"

Post-Challenge Mood:
  Same scale as mood rating (simplified)
  "Better / Same / Worse" quick option

Reflection Prompts:
  - "What did you notice?"
  - "What was challenging?"
  - "What would you do differently?"

Input:
  - Quick emoji reaction
  - Optional text note
  - Skip option

Purpose:
  - Track challenge effectiveness
  - Personal growth insights
```

#### Reward Screen
```
Header: "You earned rewards!"

Rewards Display:
  - Points earned (animation)
  - Badge unlocked (if applicable)
  - Level progress bar fills

Badge Examples:
  - "First Steps" - Complete 1 challenge
  - "Consistency King/Queen" - 7-day streak
  - "Breath Master" - 10 breathing exercises
  - "Mindful Maven" - 30 days of tracking

Share Option:
  "Share your achievement"
  - Generate shareable image
  - Social media integration

CTA: "Continue"
```

#### Next Steps Screen
```
Header: "What's next?"

Options:
  1. "Do another challenge" → Back to challenge list
  2. "Log your mood" → Mood rating flow
  3. "View your progress" → Stats dashboard
  4. "Back to home" → Main dashboard

Smart Suggestion:
  Based on time/context:
  - Morning: "Ready for your next challenge?"
  - Evening: "Time to wind down?"
  - After intense: "How about something gentle?"
```

---

### 1.5 Evening Wind-down Flow

#### Flow Overview
```
[Notification] → [Day Review] → [Gratitude Prompt] → [Tomorrow Preview] → [Sleep Prep] → [Goodnight]
```

#### Notification
```
Title: "Time to wind down 🌙"
Body: "Reflect on your day and prepare for rest"
Time: User-configured (default: 8:00 PM)
Action: [Start Wind-down]
```

#### Day Review Screen
```
Header: "Your Day in Review"
Date: [Today's Date]

Summary Cards:
┌─────────────────────────────────────┐
│  📊 Today's Stats                   │
│  • Mood entries: 3                  │
│  • Challenges completed: 2          │
│  • Total mindful minutes: 15        │
│  • Streak maintained: 🔥 7 days     │
└─────────────────────────────────────┘

Mood Timeline:
  Visual graph of day's moods
  Morning: 😊 → Afternoon: 😐 → Evening: 😌

Challenge Recap:
  List of completed challenges with timestamps
  - "Morning: 5-min breathing"
  - "Afternoon: Gratitude log"

Highlights:
  "Today's win: You practiced self-care!"
  "You're building healthy habits."

CTA: "Continue to reflection"
```

#### Gratitude Prompt Screen
```
Header: "What are you grateful for today?"
Subheader: "Take a moment to appreciate the good"

Format Options:
  1. Quick Select (chips):
     - Health
     - Family
     - Friends
     - Work/Study
     - Nature
     - Small moments
     - Personal growth
     - Challenges overcome

  2. Write Your Own:
     Text area with prompts:
     - "Today I'm grateful for..."
     - "Something that made me smile..."
     - "Someone who helped me..."

Guided Structure (optional):
  "Three Good Things:
   1. ________________
   2. ________________
   3. ________________"

Visual:
  - Calm evening color palette
  - Subtle star animations
  - Soft background music option

CTA: "Save Gratitude" / "Skip for tonight"
```

#### Tomorrow Preview Screen
```
Header: "Looking Ahead to Tomorrow"

Calendar Preview:
  - Tomorrow's date
  - Any scheduled events (if integrated)
  - Suggested challenge time slots

Intention Carryover:
  "Your intention today was: [intention]"
  "Would you like to set a new one for tomorrow?"

Quick Set:
  [Same as today] [New intention] [Decide tomorrow]

Gentle Reminder:
  "Challenges scheduled for tomorrow:
   - Morning check-in: 7:00 AM
   - Mindful moment: 1:00 PM"

CTA: "Continue"
```

#### Sleep Prep Screen
```
Header: "Prepare for Restful Sleep"

Sleep Hygiene Checklist:
  □ Put away screens (or use night mode)
  □ Dim the lights
  □ Cool down the room
  □ Avoid caffeine/alcohol
  □ Do a quick body scan

Quick Exercise Options:
  1. "2-minute breathing" - Start now
  2. "Body scan meditation" - Start now
  3. "Sleep story" - Play audio
  4. "I'm ready for bed" - Skip exercises

Sleep Timer:
  "Set sleep reminder for: [time]"
  Default: Based on wake time - 8 hours

Do Not Disturb:
  ☑️ Enable DND mode until morning

CTA: "Goodnight"
```

#### Goodnight Screen
```
Animation: Moon rises, stars twinkle

Message:
  "Goodnight, [Name] 🌙"
  "Sleep well and rest easy."

Tomorrow's Promise:
  "I'll be here when you wake up."

Visual:
  - Dark blue gradient background
  - Animated moon and stars
  - Subtle lullaby music (optional)
  - Auto-fade to black after 10 seconds

Final Action:
  - App enters sleep mode
  - Notifications silenced
  - Morning alarm set (if requested)
```

---

## 2. Challenge/Task Card UI Designs

### 2.1 Breathing Exercise UI

#### Card Layout
```
┌─────────────────────────────────────────────────────┐
│  [🫁] BREATHING EXERCISE          [Beginner] [5min] │
├─────────────────────────────────────────────────────┤
│                                                     │
│              ┌───────────────┐                      │
│             /                 \                     │
│            │    ╭───────╮     │                    │
│            │   ╱         ╲    │    ← Animated      │
│            │  │    😌     │   │      breathing      │
│            │   ╲         ╱    │      circle         │
│            │    ╰───────╯     │                     │
│             \                 /                      │
│              └───────────────┘                      │
│                                                     │
│              "Breathe In..."                        │
│                  [4]                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Technique: Box Breathing                           │
│  Inhale 4s → Hold 4s → Exhale 4s → Hold 4s          │
├─────────────────────────────────────────────────────┤
│  [⏸️ Pause]  [🔊 Sound]  [⚙️ Settings]              │
└─────────────────────────────────────────────────────┘
```

#### Animation Specifications
```
Breathing Circle Animation:

Inhale Phase (4 seconds):
  - Circle scales from 1.0x to 1.5x
  - Color: Blue (#3498DB) → Cyan (#00CED1)
  - Text: "Breathe In..." with countdown
  - Easing: ease-in-out

Hold Phase (4 seconds):
  - Circle maintains 1.5x scale
  - Color: Cyan (#00CED1) holds
  - Text: "Hold..." with countdown
  - Subtle pulse animation

Exhale Phase (4 seconds):
  - Circle scales from 1.5x to 1.0x
  - Color: Cyan (#00CED1) → Blue (#3498DB)
  - Text: "Breathe Out..." with countdown
  - Easing: ease-in-out

Hold Phase (4 seconds):
  - Circle maintains 1.0x scale
  - Color: Blue (#3498DB) holds
  - Text: "Hold..." with countdown

Cycle Counter:
  - Displays "Cycle X of Y"
  - Updates after each complete breath
```

#### Interactive Elements
```
Controls:

Pause/Resume:
  - Tap to pause animation
  - Shows "Paused" overlay
  - Resume continues from current phase

Sound Toggle:
  - Bell at phase transitions
  - Ambient background sound
  - Voice guidance option

Settings:
  - Adjust breath duration (2-8 seconds)
  - Change technique:
    * Box Breathing (4-4-4-4)
    * 4-7-8 Breathing (4-7-8)
    * Coherent Breathing (5-5)
    * Custom
  - Visual theme selector
  - Background options

Progress Indicator:
  - Circular progress ring around main circle
  - Fills as cycles complete
  - Estimated time remaining
```

#### States
```
Idle State:
  - Circle gently pulses
  - "Tap to begin" prompt
  - Instructions visible

Active State:
  - Full animation running
  - Controls accessible
  - Timer counting

Paused State:
  - Animation frozen
  - "Paused" overlay
  - Resume button prominent

Completed State:
  - Final relaxation animation
  - Stats summary
  - "Well done!" message
```

---

### 2.2 Meditation Timer UI

#### Card Layout
```
┌─────────────────────────────────────────────────────┐
│  [🧘] MEDITATION                    [Any] [Custom]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                  ┌─────────┐                        │
│                 ╱   10:00   ╲                       │
│                │             │    ← Timer display   │
│                │   [play]    │                      │
│                │             │                      │
│                 ╲           ╱                       │
│                  └─────────┘                        │
│                                                     │
│              "Focus on your breath"                 │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Quick Durations:  [5]  [10]  [15]  [20]  [Custom]  │
├─────────────────────────────────────────────────────┤
│  🎵 Rain Sounds    [🔊]  [⏸️]  [⏹️]                 │
└─────────────────────────────────────────────────────┘
```

#### Timer Display
```
Visual Design:
  - Large, centered time display
  - Font: Sans-serif, weight 300
  - Size: 72px (responsive)
  - Color: White on dark background

Progress Ring:
  - SVG circular progress
  - Stroke: 4px
  - Color gradient based on time remaining
    * >50%: Green (#52B788)
    * 25-50%: Yellow (#F4D03F)
    * <25%: Orange (#E67E22)
  - Animated fill as time passes

Play/Pause Button:
  - Center of timer
  - Large touch target (80x80px)
  - Icon changes based on state
  - Ripple effect on tap
```

#### Duration Selection
```
Quick Presets:
  - 5 minutes (micro-meditation)
  - 10 minutes (standard)
  - 15 minutes (deeper practice)
  - 20 minutes (extended)
  - Custom (time picker)

Custom Picker:
  - Hours: 0-2
  - Minutes: 0-59
  - 5-minute increments for ease

Smart Suggestions:
  - Based on user's history
  - "You often choose 10 minutes"
  - Context-aware defaults
```

#### Sound Options
```
Background Sounds:
  - Rain
  - Ocean waves
  - Forest ambience
  - White noise
  - Pink noise
  - Brown noise
  - Silence

Bell Options:
  - Start bell
  - End bell
  - Interval bells (every X minutes)
  - No bells

Volume Control:
  - Separate sliders for:
    * Background sound
    * Bell volume
  - Master volume

Voice Guidance:
  - None
  - Beginner (frequent cues)
  - Intermediate (occasional cues)
  - Advanced (minimal cues)
```

#### Session Features
```
During Meditation:
  - Minimal UI (tap to show controls)
  - Swipe to adjust volume
  - Double-tap to pause
  - Shake to end (with confirmation)

Distraction Log:
  - Subtle button to note distractions
  - "Noticed a thought? Tap gently."
  - Logs timestamp for post-session review

Gentle Alarms:
  - Fade in (not jarring)
  - Multiple bell strikes option
  - Auto-snooze (1 min) option
```

#### Post-Session
```
Summary Screen:
  - Duration completed
  - Distractions noted
  - Mood before/after (if tracked)
  - Streak update

Journal Prompt:
  "How was your practice?"
  Optional quick note

Share Option:
  "I meditated for [X] minutes today!"
```

---

### 2.3 Journaling Prompt UI

#### Card Layout
```
┌─────────────────────────────────────────────────────┐
│  [📝] JOURNALING                    [Open] [10min]  │
├─────────────────────────────────────────────────────┤
│  Today's Prompt:                                    │
│  ┌─────────────────────────────────────────────┐    │
│  │ "What would you tell your younger self      │    │
│  │  about the challenges you've overcome?"     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  Start writing here...                      │    │
│  │                                             │    │
│  │                                             │    │
│  │                                             │    │
│  │                                             │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  💾 Auto-saved    🎤 Voice    🔄 New Prompt         │
│  [Words: 0]                                         │
├─────────────────────────────────────────────────────┤
│  [Save Entry]  [Save & Complete Challenge]          │
└─────────────────────────────────────────────────────┘
```

#### Prompt Display
```
Visual Design:
  - Card with subtle shadow
  - Background: Light cream (#FDF6E3)
  - Border-left: 4px accent color
  - Quote-style formatting

Prompt Categories (color-coded):
  - Self-reflection: Purple (#9B59B6)
  - Growth: Green (#27AE60)
  - Gratitude: Yellow (#F1C40F)
  - Challenge: Orange (#E67E22)
  - Creativity: Pink (#FF6B9D)

Interaction:
  - Tap to expand prompt details
  - Swipe for new prompt
  - Save favorite prompts
```

#### Writing Area
```
Typography:
  - Font: System serif or sans-serif (user choice)
  - Size: 18px (adjustable 14-24px)
  - Line height: 1.6
  - Paragraph spacing: 1em

Features:
  - Distraction-free mode (hide UI)
  - Full-screen writing option
  - Dark mode support
  - Focus mode (highlight current sentence)

Formatting (minimal):
  - Bold/italic
  - Bullet lists
  - Headers (H1, H2)

Word Count:
  - Live counter
  - Goal indicator (if set)
  - Milestone celebrations (100, 250, 500 words)
```

#### Input Methods
```
Text Input:
  - Native keyboard
  - External keyboard support
  - Auto-correct toggle

Voice-to-Text:
  - Hold microphone button
  - Real-time transcription
  - Punctuation commands
  - Edit after recording

Photo/Attachment:
  - Add images to entry
  - Camera integration
  - Photo journal option
```

#### Progress & Motivation
```
Writing Streak:
  - Days in a row counter
  - Longest streak record
  - Streak recovery option

Milestones:
  - Total words written
  - Total entries
  - Writing time accumulated

Encouragement Messages:
  - "You're doing great!"
  - "Your thoughts matter."
  - "Keep going!"
  - "Beautiful reflection."
```

#### Privacy & Security
```
Privacy Indicators:
  - Lock icon on entries
  - "Private by default" badge
  - Cloud sync status

Security Options:
  - Biometric lock
  - PIN protection
  - Export encrypted backup
```

---

### 2.4 Gratitude Log UI

#### Card Layout
```
┌─────────────────────────────────────────────────────┐
│  [🙏] GRATITUDE LOG                 [Daily] [5min]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  "Gratitude turns what we have into enough."        │
│                              — Melody Beattie       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Today I'm grateful for:                            │
│                                                     │
│  1. ┌─────────────────────────────────────────┐     │
│     │ My morning coffee and quiet time        │     │
│     └─────────────────────────────────────────┘     │
│                                                     │
│  2. ┌─────────────────────────────────────────┐     │
│     │ A supportive message from my friend     │     │
│     └─────────────────────────────────────────┘     │
│                                                     │
│  3. ┌─────────────────────────────────────────┐     │
│     │ The beautiful sunset I saw today        │     │
│     └─────────────────────────────────────────┘     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [+ Add another]  [🎲 Surprise Me]                  │
├─────────────────────────────────────────────────────┤
│  [Save Gratitude Entry]                             │
└─────────────────────────────────────────────────────┘
```

#### Entry Structure
```
Default Format: Three Good Things
  - Research-backed: 3 items optimal
  - Not too few, not overwhelming
  - Encourages specificity

Alternative Formats:
  - Free-form paragraph
  - One deep reflection
  - Person/thing/reason structure
  - Photo + caption

Input Fields:
  - Placeholder text per field
  - Auto-expand as user types
  - Character limit: 200 per item
  - Optional detail expansion
```

#### Prompts & Inspiration
```
Category Prompts:
  - Relationships: "Someone who made me smile..."
  - Nature: "Something beautiful I noticed..."
  - Health: "My body allowed me to..."
  - Learning: "Something new I discovered..."
  - Comfort: "A small joy today was..."
  - Challenge: "A difficulty that taught me..."

"Surprise Me" Button:
  - Random prompt generator
  - Unusual angles:
    * "A mistake I'm grateful for..."
    * "Something I usually take for granted..."
    * "A challenge that made me stronger..."

Weekly Themes:
  - Monday: New beginnings
  - Tuesday: People
  - Wednesday: Self
  - Thursday: Nature
  - Friday: Small things
  - Saturday: Experiences
  - Sunday: Reflection
```

#### Visual Design
```
Aesthetic:
  - Warm, inviting colors
  - Soft gradients
  - Handwritten font option
  - Paper texture background

Animations:
  - Entries fade in as added
  - Hearts float up on save
  - Streak counter sparkles

Mood Enhancement:
  - Positive affirmations
  - Gratitude statistics
  - "Your gratitude journey" timeline
```

#### History & Patterns
```
Gratitude Timeline:
  - Calendar view with entries
  - Search functionality
  - Tag/filter by category
  - Export options

Insights:
  - Most common themes
  - Gratitude streak
  - Mood correlation
  - Word cloud of gratitude

Reminders:
  - "Remember when you were grateful for..."
  - Random past entries
  - Anniversary of entries
```

#### Social Features (Optional)
```
Sharing:
  - Anonymous sharing option
  - Gratitude community feed
  - React to others' entries
  - Gratitude challenges with friends

Privacy Controls:
  - Public/Private per entry
  - Friends-only option
  - Complete privacy mode
```

---

## 3. 100 Challenge Prompts

### Breathwork (1-12)

```
B001: Box Breathing Basics
Category: Breathwork
Duration: 5 minutes
Difficulty: Beginner
Description: Practice the 4-4-4-4 breathing pattern used by Navy SEALs to stay calm under pressure. Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat for 5 minutes.
Benefit: Reduces stress and improves focus

B002: 4-7-8 Relaxation Breath
Category: Breathwork
Duration: 4 minutes
Difficulty: Beginner
Description: Inhale quietly through your nose for 4 counts, hold for 7, exhale completely through your mouth for 8. This natural tranquilizer calms the nervous system.
Benefit: Promotes relaxation and helps with sleep

B003: Coherent Breathing
Category: Breathwork
Duration: 5 minutes
Difficulty: Beginner
Description: Breathe at a rate of 5 breaths per minute. Inhale for 5 counts, exhale for 5 counts. This synchronizes your heart rate variability.
Benefit: Balances autonomic nervous system

B004: Alternate Nostril Breathing
Category: Breathwork
Duration: 5 minutes
Difficulty: Intermediate
Description: Close right nostril, inhale left. Close left, exhale right. Inhale right, close, exhale left. Continue alternating for 5 minutes.
Benefit: Balances energy and calms the mind

B005: Lion's Breath
Category: Breathwork
Duration: 3 minutes
Difficulty: Beginner
Description: Inhale deeply through your nose, then exhale forcefully through your mouth while sticking out your tongue and roaring softly. Releases tension in face and throat.
Benefit: Relieves stress and stimulates throat chakra

B006: Resonant Breathing
Category: Breathwork
Duration: 10 minutes
Difficulty: Intermediate
Description: Breathe at exactly 5.5 breaths per minute (5.5 seconds in, 5.5 seconds out). Use a timer or app to maintain rhythm.
Benefit: Optimizes heart rate variability

B007: Breath of Fire
Category: Breathwork
Duration: 3 minutes
Difficulty: Advanced
Description: Rapid, rhythmic breaths through the nose with equal inhale and exhale. Pull navel toward spine on exhale. Start with 30 seconds, build up.
Benefit: Energizes and detoxifies

B008: Sama Vritti (Equal Breathing)
Category: Breathwork
Duration: 5 minutes
Difficulty: Beginner
Description: Match your inhale and exhale to the same count. Start with 3 counts, gradually increase to 6 or 8 as comfortable.
Benefit: Creates mental calm and balance

B009: Cooling Breath (Sitali)
Category: Breathwork
Duration: 3 minutes
Difficulty: Beginner
Description: Roll your tongue (or part lips), inhale through the mouth creating a cooling sensation, exhale through nose. Perfect for hot days or anger.
Benefit: Cools body and reduces anger

B010: Humming Bee Breath (Bhramari)
Category: Breathwork
Duration: 5 minutes
Difficulty: Beginner
Description: Close ears with thumbs, place fingers on forehead. Inhale deeply, exhale while making a humming sound like a bee.
Benefit: Calms mind and reduces anxiety

B011: Wim Hof Method Intro
Category: Breathwork
Duration: 8 minutes
Difficulty: Intermediate
Description: 30 deep breaths (inhale fully, exhale naturally), hold breath after last exhale, then recovery breath. Research-backed for stress resilience.
Benefit: Boosts immunity and energy

B012: Pursed Lip Breathing
Category: Breathwork
Duration: 5 minutes
Difficulty: Beginner
Description: Inhale through nose for 2 counts, exhale through pursed lips for 4 counts. Like blowing out a candle slowly.
Benefit: Slows breathing and relieves shortness of breath
```

### Cognitive (13-24)

```
C013: Thought Challenging
Category: Cognitive
Duration: 10 minutes
Difficulty: Intermediate
Description: Write down a negative thought. Ask: Is it true? What's the evidence? What's a more balanced perspective? Reframe it.
Benefit: Reduces cognitive distortions

C014: Worry Time Scheduling
Category: Cognitive
Duration: 15 minutes
Difficulty: Intermediate
Description: Set a timer for 15 minutes. Write all your worries. When timer ends, close the notebook. If worries arise later, remind yourself of worry time tomorrow.
Benefit: Contains anxiety and prevents rumination

C015: Cognitive Defusion Exercise
Category: Cognitive
Duration: 5 minutes
Difficulty: Intermediate
Description: Take a negative thought and repeat it rapidly for 30 seconds until it becomes just sounds. Notice how it loses power.
Benefit: Reduces thought fusion and distress

C016: Best Possible Self Visualization
Category: Cognitive
Duration: 10 minutes
Difficulty: Beginner
Description: Imagine yourself in the future having achieved your goals. Write about it in detail. What are you doing? How do you feel?
Benefit: Increases optimism and motivation

C017: Worst-Case Scenario Planning
Category: Cognitive
Duration: 10 minutes
Difficulty: Intermediate
Description: For something you're anxious about, write the worst-case scenario. Then write how you'd cope. Usually, you can handle more than you think.
Benefit: Reduces anxiety through preparation

C018: Evidence For and Against
Category: Cognitive
Duration: 10 minutes
Difficulty: Intermediate
Description: Draw a line down the page. List evidence supporting a worry on one side, evidence against on the other. Be your own lawyer.
Benefit: Promotes balanced thinking

C019: The Observer Meditation
Category: Cognitive
Duration: 10 minutes
Difficulty: Intermediate
Description: Sit quietly and observe your thoughts as if they were clouds passing in the sky. Don't engage, just notice and let them float by.
Benefit: Creates distance from thoughts

C020: Perspective Taking
Category: Cognitive
Duration: 5 minutes
Difficulty: Beginner
Description: Think of a current problem. Ask: How will I view this in 1 week? 1 month? 1 year? 10 years? Write your answers.
Benefit: Reduces catastrophizing

C021: Strengths Spotting
Category: Cognitive
Duration: 10 minutes
Difficulty: Beginner
Description: List 5 times you overcame challenges. Identify the strengths you used. How can you apply them to current situations?
Benefit: Builds self-efficacy and resilience

C022: Values Clarification
Category: Cognitive
Duration: 15 minutes
Difficulty: Intermediate
Description: From a list of values (family, creativity, health, etc.), select your top 5. Rank them. Write how you're living each one.
Benefit: Increases life satisfaction and direction

C023: Problem-Solving Worksheet
Category: Cognitive
Duration: 15 minutes
Difficulty: Intermediate
Description: Define a problem. Brainstorm 10 solutions (no judgment). Evaluate pros/cons of top 3. Choose one and plan implementation.
Benefit: Builds practical problem-solving skills

C024: Self-Compassion Break
Category: Cognitive
Duration: 5 minutes
Difficulty: Beginner
Description: When struggling, say: "This is a moment of suffering. Suffering is part of life. May I be kind to myself in this moment."
Benefit: Reduces self-criticism and shame
```

### Behavioral (25-36)

```
B025: Behavioral Activation - Pleasant Activity
Category: Behavioral
Duration: 30 minutes
Difficulty: Beginner
Description: Choose one activity you used to enjoy but haven't done lately. Schedule and do it today. Notice how you feel before, during, and after.
Benefit: Combats depression through action

B026: Opposite Action
Category: Behavioral
Duration: Varies
Difficulty: Intermediate
Description: When emotion doesn't fit the facts, do the opposite. Sad → engage. Anxious → approach. Angry → be kind. Act contrary to the urge.
Benefit: Regulates emotions through behavior change

B027: The 5-Minute Rule
Category: Behavioral
Duration: 5 minutes
Difficulty: Beginner
Description: Commit to any task for just 5 minutes. Set a timer. After 5 minutes, you can stop. Usually, you'll continue.
Benefit: Overcomes procrastination

B028: Behavioral Experiment
Category: Behavioral
Duration: 15 minutes
Difficulty: Intermediate
Description: Test a negative prediction. If you think "I'll fail," try anyway. Record what actually happened vs. what you predicted.
Benefit: Challenges limiting beliefs

B029: Activity Scheduling
Category: Behavioral
Duration: 20 minutes
Difficulty: Intermediate
Description: Plan one enjoyable activity and one mastery activity (something you're good at) for each day this week. Write them in your calendar.
Benefit: Structures time and increases positive experiences

B030: Exposure Hierarchy
Category: Behavioral
Duration: Varies
Difficulty: Advanced
Description: List feared situations from least to most scary (1-10). Start with a 3-4 rated item. Stay in situation until anxiety drops by half.
Benefit: Reduces avoidance and anxiety

B031: Behavioral Chain Analysis
Category: Behavioral
Duration: 15 minutes
Difficulty: Advanced
Description: Map out a problematic behavior: vulnerability factors → prompting event → links (thoughts, feelings, actions) → consequence. Identify intervention points.
Benefit: Increases self-awareness and change opportunities

B032: The Two-Minute Rule
Category: Behavioral
Duration: 2 minutes
Difficulty: Beginner
Description: If a task takes less than 2 minutes, do it now. Apply this to emails, dishes, messages, small chores throughout the day.
Benefit: Reduces task accumulation and overwhelm

B033: Implementation Intentions
Category: Behavioral
Duration: 5 minutes
Difficulty: Beginner
Description: Create if-then plans: "If [situation], then I will [behavior]." Example: "If I feel anxious, then I will take 3 deep breaths."
Benefit: Increases follow-through on goals

B034: Activity Monitoring
Category: Behavioral
Duration: 10 minutes/day
Difficulty: Beginner
Description: Track your activities and mood ratings hourly for 3 days. Look for patterns: What activities boost your mood? Which drain you?
Benefit: Identifies mood-behavior connections

B035: Behavioral Rehearsal
Category: Behavioral
Duration: 15 minutes
Difficulty: Intermediate
Description: Practice a difficult conversation or situation in your mind or with a friend. Walk through what you'll say and do.
Benefit: Reduces anxiety and improves performance

B036: The 20-Second Rule
Category: Behavioral
Duration: 20 minutes setup
Difficulty: Beginner
Description: Make good habits 20 seconds easier to start (lay out gym clothes). Make bad habits 20 seconds harder (hide the cookies).
Benefit: Shapes environment for success
```

### Social (37-48)

```
S037: Reach Out to Someone
Category: Social
Duration: 10 minutes
Difficulty: Beginner
Description: Send a message to someone you haven't talked to in a while. Ask how they're doing. Share something about your life.
Benefit: Strengthens social connections

S038: Active Listening Practice
Category: Social
Duration: Varies
Difficulty: Intermediate
Description: In your next conversation, focus entirely on listening. Don't plan your response. Summarize what they said before adding your thoughts.
Benefit: Improves relationships and understanding

S039: Express Appreciation
Category: Social
Duration: 5 minutes
Difficulty: Beginner
Description: Tell someone specific why you appreciate them. Be detailed: "I appreciate when you ___ because it makes me feel ___."
Benefit: Strengthens bonds and increases positivity

S040: Set a Boundary
Category: Social
Duration: Varies
Difficulty: Advanced
Description: Identify one boundary you need to set. Practice saying no or expressing your needs. Use "I" statements and be clear.
Benefit: Improves self-respect and relationships

S041: Ask for Help
Category: Social
Duration: Varies
Difficulty: Intermediate
Description: Identify something you need help with. Ask someone specific. Notice that people often want to help and it strengthens connections.
Benefit: Reduces isolation and builds support

S042: Give a Genuine Compliment
Category: Social
Duration: 2 minutes
Difficulty: Beginner
Description: Give someone a specific, genuine compliment today. Notice something they did well or a quality you admire.
Benefit: Boosts others' mood and your own

S043: Difficult Conversation Prep
Category: Social
Duration: 15 minutes
Difficulty: Advanced
Description: Plan a difficult conversation. Write: your goal, their possible perspective, what you'll say, possible responses. Practice.
Benefit: Increases confidence and effectiveness

S044: Social Media Detox Hour
Category: Social
Duration: 60 minutes
Difficulty: Beginner
Description: Put away all social media for one hour. Use that time for in-person connection, a hobby, or simply being present.
Benefit: Reduces comparison and increases presence

S045: Join a Group or Community
Category: Social
Duration: Varies
Difficulty: Intermediate
Description: Find one group aligned with your interests (meetup, class, club). Attend one meeting or event this week.
Benefit: Expands social network and belonging

S046: Practice Vulnerability
Category: Social
Duration: Varies
Difficulty: Advanced
Description: Share something personal or a struggle with someone you trust. Notice that vulnerability often creates deeper connection.
Benefit: Deepens relationships and authenticity

S047: Random Act of Kindness
Category: Social
Duration: 5 minutes
Difficulty: Beginner
Description: Do something kind for a stranger or acquaintance. Hold a door, pay for coffee, leave a nice note. Expect nothing in return.
Benefit: Increases happiness and connection

S048: Quality Time Without Devices
Category: Social
Duration: 30 minutes
Difficulty: Beginner
Description: Spend 30 minutes with someone you care about with phones put away. Be fully present and engaged.
Benefit: Deepens connection and presence
```

### Physical (49-60)

```
P049: 5-Minute Stretch Routine
Category: Physical
Duration: 5 minutes
Difficulty: Beginner
Description: Do gentle stretches for neck, shoulders, back, and legs. Hold each for 30 seconds. Breathe deeply throughout.
Benefit: Reduces tension and increases flexibility

P050: Walking Meditation
Category: Physical
Duration: 10 minutes
Difficulty: Beginner
Description: Walk slowly and mindfully. Focus on the sensation of each step. Notice heel, ball, toe contact. Breathe with your steps.
Benefit: Combines movement with mindfulness

P051: Desk Yoga Break
Category: Physical
Duration: 5 minutes
Difficulty: Beginner
Description: At your desk: neck rolls, shoulder shrugs, seated twists, wrist circles, ankle pumps. Perfect for work breaks.
Benefit: Reduces desk-job physical strain

P052: Progressive Muscle Relaxation
Category: Physical
Duration: 15 minutes
Difficulty: Beginner
Description: Tense and release each muscle group: feet, legs, stomach, chest, arms, face. Hold tension 5 seconds, release 10 seconds.
Benefit: Reduces physical tension and anxiety

P053: 4-7-8 Walking
Category: Physical
Duration: 10 minutes
Difficulty: Beginner
Description: Walk while doing 4-7-8 breathing. Inhale 4 steps, hold 7 steps, exhale 8 steps. Adjust pace to your comfort.
Benefit: Combines exercise with relaxation

P054: Body Scan Meditation
Category: Physical
Duration: 15 minutes
Difficulty: Beginner
Description: Lie down and mentally scan your body from toes to head. Notice sensations without judgment. Release tension as you go.
Benefit: Increases body awareness and relaxation

P055: Sun Salutation Sequence
Category: Physical
Duration: 10 minutes
Difficulty: Intermediate
Description: Practice 3-5 rounds of sun salutations. Move with breath. Modify as needed for your body.
Benefit: Energizes and stretches entire body

P056: Cold Shower Finish
Category: Physical
Duration: 2 minutes
Difficulty: Intermediate
Description: End your shower with 30-60 seconds of cold water. Focus on your breath. Build up duration gradually.
Benefit: Boosts mood and resilience

P057: Nature Connection Walk
Category: Physical
Duration: 20 minutes
Difficulty: Beginner
Description: Walk in nature (park, trail, beach). Notice 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.
Benefit: Reduces stress and increases well-being

P058: Chair Yoga Flow
Category: Physical
Duration: 10 minutes
Difficulty: Beginner
Description: Gentle yoga using a chair for support. Seated poses, forward folds, gentle twists. Accessible for all abilities.
Benefit: Increases mobility and reduces stiffness

P059: Shaking/TRE Practice
Category: Physical
Duration: 10 minutes
Difficulty: Beginner
Description: Stand with knees slightly bent, let body shake/tremor naturally. This releases stored tension and trauma.
Benefit: Releases physical stress and tension

P060: Face Massage and Relaxation
Category: Physical
Duration: 5 minutes
Difficulty: Beginner
Description: Gently massage your face: temples, jaw, forehead, around eyes. Notice where you hold tension and release it.
Benefit: Reduces facial tension and headaches
```

### Mindfulness (61-72)

```
M061: 5-4-3-2-1 Grounding
Category: Mindfulness
Duration: 3 minutes
Difficulty: Beginner
Description: Notice 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste. Brings you to the present moment.
Benefit: Reduces anxiety and dissociation

M062: Mindful Eating
Category: Mindfulness
Duration: 15 minutes
Difficulty: Beginner
Description: Eat one meal or snack mindfully. Notice colors, textures, smells, tastes. Chew slowly. Put utensil down between bites.
Benefit: Improves digestion and food relationship

M063: Urge Surfing
Category: Mindfulness
Duration: 10 minutes
Difficulty: Intermediate
Description: When an urge arises (to eat, smoke, check phone), observe it like a wave. Notice it build, peak, and pass without acting.
Benefit: Builds impulse control

M064: Leaves on a Stream
Category: Mindfulness
Duration: 10 minutes
Difficulty: Beginner
Description: Visualize a stream. Place each thought on a leaf and watch it float away. Don't judge thoughts, just observe and release.
Benefit: Creates distance from thoughts

M065: Mindful Hand Washing
Category: Mindfulness
Duration: 2 minutes
Difficulty: Beginner
Description: Wash your hands mindfully. Feel the water temperature, soap texture, rubbing sensation. Be fully present.
Benefit: Integrates mindfulness into daily routine

M066: Raisin Meditation (or any food)
Category: Mindfulness
Duration: 5 minutes
Difficulty: Beginner
Description: Examine a raisin (or small food) as if you've never seen it. Notice texture, smell, appearance. Eat slowly with full attention.
Benefit: Builds focused attention and presence

M067: Mindful Technology Use
Category: Mindfulness
Duration: Ongoing
Difficulty: Intermediate
Description: Before opening any app or device, pause. Ask: Why am I doing this? What do I hope to get? Set an intention.
Benefit: Reduces mindless scrolling

M068: Open Awareness Meditation
Category: Mindfulness
Duration: 10 minutes
Difficulty: Intermediate
Description: Instead of focusing on one thing, allow awareness to be open. Notice whatever arises—sounds, sensations, thoughts—without focusing on any.
Benefit: Develops spacious awareness

M069: STOP Practice
Category: Mindfulness
Duration: 1 minute
Difficulty: Beginner
Description: S - Stop what you're doing. T - Take a breath. O - Observe thoughts, feelings, body. P - Proceed with awareness.
Benefit: Creates pause before reacting

M070: Mindful Listening to Music
Category: Mindfulness
Duration: 10 minutes
Difficulty: Beginner
Description: Listen to a song with full attention. Notice instruments, vocals, emotions evoked. Don't do anything else.
Benefit: Deepens appreciation and presence

M071: Noting Practice
Category: Mindfulness
Duration: 10 minutes
Difficulty: Intermediate
Description: As thoughts, feelings, or sensations arise, silently note them: "thinking," "hearing," "feeling," then return to breath.
Benefit: Increases awareness and reduces reactivity

M072: Mindful Transition Moments
Category: Mindfulness
Duration: 1 minute each
Difficulty: Beginner
Description: Use transition moments (entering/leaving a room, starting a task) as mindfulness bells. Pause, breathe, be present.
Benefit: Integrates mindfulness throughout day
```

### Journaling (73-84)

```
J073: Morning Pages
Category: Journaling
Duration: 15 minutes
Difficulty: Beginner
Description: Write 3 pages of stream-of-consciousness first thing in morning. No editing, no judgment. Just get thoughts on paper.
Benefit: Clears mental clutter and boosts creativity

J074: Worry Dump
Category: Journaling
Duration: 10 minutes
Difficulty: Beginner
Description: Set a timer and write every worry, fear, or anxiety. Don't censor. When timer ends, close the notebook. Leave worries there.
Benefit: Contains anxiety and provides relief

J075: Letter to Your Future Self
Category: Journaling
Duration: 15 minutes
Difficulty: Beginner
Description: Write a letter to yourself one year from now. What do you hope for? What are you working on? What would you want to remember?
Benefit: Creates perspective and intention

J076: Unsent Letter
Category: Journaling
Duration: 15 minutes
Difficulty: Intermediate
Description: Write a letter to someone you have feelings for (anger, love, regret). Say everything you need to say. Don't send it.
Benefit: Processes emotions safely

J077: Self-Compassion Letter
Category: Journaling
Duration: 10 minutes
Difficulty: Intermediate
Description: Write to yourself as you would to a dear friend going through what you're experiencing. Offer kindness and understanding.
Benefit: Reduces self-criticism

J078: Values-Based Goal Setting
Category: Journaling
Duration: 15 minutes
Difficulty: Intermediate
Description: Identify your top 3 values. Write one goal for each that aligns with that value. Plan one small step for each goal.
Benefit: Creates meaningful direction

J079: Challenge Reframe
Category: Journaling
Duration: 10 minutes
Difficulty: Intermediate
Description: Write about a current challenge. How might this be an opportunity? What could you learn? How might it help you grow?
Benefit: Builds resilience and growth mindset

J080: Peak Experience Reflection
Category: Journaling
Duration: 10 minutes
Difficulty: Beginner
Description: Describe a peak experience in your life. What happened? How did you feel? What strengths were you using? How can you recreate this?
Benefit: Identifies strengths and joy sources

J081: Fear Setting
Category: Journaling
Duration: 20 minutes
Difficulty: Advanced
Description: Define a fear. Ask: What's the worst that could happen? How could you prevent it? How could you repair it? What are benefits of attempt?
Benefit: Reduces fear through analysis

J082: Daily Review
Category: Journaling
Duration: 10 minutes
Difficulty: Beginner
Description: At day's end, write: What went well? What was challenging? What did I learn? What will I do differently tomorrow?
Benefit: Builds self-awareness and growth

J083: Identity Narrative
Category: Journaling
Duration: 15 minutes
Difficulty: Intermediate
Description: Write your life story in 3 paragraphs: past, present, future. Notice the narrative you're telling. Is it helpful? How could you rewrite it?
Benefit: Explores and reshapes self-concept

J084: Forgiveness Practice
Category: Journaling
Duration: 15 minutes
Difficulty: Advanced
Description: Write about someone you need to forgive (could be yourself). What happened? How did it affect you? What would forgiveness look like?
Benefit: Releases resentment and heals
```

### Gratitude (85-92)

```
G085: Three Good Things
Category: Gratitude
Duration: 5 minutes
Difficulty: Beginner
Description: Write three things that went well today and why they went well. Be specific. Include the "why" for deeper impact.
Benefit: Increases happiness and optimism

G086: Gratitude Letter
Category: Gratitude
Duration: 15 minutes
Difficulty: Beginner
Description: Write a letter to someone who positively impacted your life. Describe what they did and how it affected you. Consider sending it.
Benefit: Strengthens relationships and well-being

G087: Gratitude Walk
Category: Gratitude
Duration: 15 minutes
Difficulty: Beginner
Description: Take a walk and notice things you're grateful for. Say them out loud or mentally. Engage all your senses.
Benefit: Combines gratitude with movement

G088: Gratitude for Challenges
Category: Gratitude
Duration: 10 minutes
Difficulty: Intermediate
Description: Write about a difficulty you're facing. What can you appreciate about it? What is it teaching you? How is it helping you grow?
Benefit: Builds resilience and perspective

G089: Savoring Practice
Category: Gratitude
Duration: 5 minutes
Difficulty: Beginner
Description: Choose one positive experience from today. Relive it in detail. Engage all senses. Let the positive feelings wash over you.
Benefit: Increases positive emotion and memory

G090: Gratitude for Your Body
Category: Gratitude
Duration: 5 minutes
Difficulty: Beginner
Description: Write 5 things your body allows you to do that you're grateful for. Focus on function, not appearance.
Benefit: Improves body image and appreciation

G091: Gratitude Collage
Category: Gratitude
Duration: 20 minutes
Difficulty: Beginner
Description: Create a visual collage (physical or digital) of things you're grateful for. Use photos, drawings, words, magazine cutouts.
Benefit: Engages creativity with gratitude

G092: Gratitude for Ordinary Things
Category: Gratitude
Duration: 5 minutes
Difficulty: Beginner
Description: Write about things you usually take for granted: running water, electricity, a bed, food, safety. Imagine life without them.
Benefit: Increases appreciation for basics
```

### Sleep (93-100)

```
S093: Bedtime Body Scan
Category: Sleep
Duration: 15 minutes
Difficulty: Beginner
Description: Lie in bed and mentally scan from toes to head. Notice sensations, release tension. Let yourself drift off naturally.
Benefit: Promotes relaxation and sleep onset

S094: Sleep Hygiene Check
Category: Sleep
Duration: 5 minutes
Difficulty: Beginner
Description: Review sleep hygiene: cool room, dark, quiet, no screens 1 hour before bed, consistent schedule. Make one improvement tonight.
Benefit: Improves sleep quality

S095: Worry Time Before Bed
Category: Sleep
Duration: 15 minutes
Difficulty: Intermediate
Description: 2 hours before bed, write all worries. Tell yourself you'll address them tomorrow. When worries arise in bed, remind yourself of this.
Benefit: Reduces bedtime rumination

S096: Bedtime Gratitude
Category: Sleep
Duration: 5 minutes
Difficulty: Beginner
Description: Before sleep, think of 3 things you're grateful for. Focus on the feeling of gratitude as you drift to sleep.
Benefit: Ends day positively and promotes sleep

S097: 4-7-8 Sleep Breath
Category: Sleep
Duration: 5 minutes
Difficulty: Beginner
Description: Practice 4-7-8 breathing in bed. Inhale 4, hold 7, exhale 8. Repeat 4 times. Let yourself drift off.
Benefit: Activates relaxation response

S098: Cognitive Shuffle
Category: Sleep
Duration: 10 minutes
Difficulty: Beginner
Description: Think of random, neutral items (apple, cloud, bicycle, etc.) one after another. Don't make connections. Bores the mind to sleep.
Benefit: Prevents rumination and induces sleep

S099: Paradoxical Intention
Category: Sleep
Duration: Ongoing
Difficulty: Intermediate
Description: Instead of trying to sleep, try to stay awake. Keep eyes open. Challenge yourself to stay awake. Reduces sleep performance anxiety.
Benefit: Reduces sleep effort and anxiety

S100: Sleep Story Visualization
Category: Sleep
Duration: 15 minutes
Difficulty: Beginner
Description: Create a peaceful mental story (walking on a beach, exploring a garden). Add rich sensory details. Let the story lull you to sleep.
Benefit: Occupies mind with pleasant imagery
```

---

## Appendix A: Challenge Card Component Library

### Card States
```
1. Locked (not yet available)
2. Available (ready to start)
3. In Progress (partially completed)
4. Completed (done today)
5. Missed (not completed, past date)
6. Streak at Risk (due soon)
```

### Card Elements
```
Required:
- Category icon
- Title
- Duration
- Difficulty badge
- Description
- CTA button

Optional:
- Completion count
- User rating
- Streak impact
- Points reward
- Preview animation
- Related challenges
```

### Accessibility Requirements
```
- Minimum touch target: 44x44px
- Color contrast: WCAG AA minimum
- Screen reader labels for all elements
- Reduced motion support
- Voice control compatibility
```

---

## Appendix B: Notification Strategy

### Push Notification Types
```
Morning Check-in: 7:00 AM (customizable)
Mood Check: 12:00 PM, 6:00 PM
Challenge Reminder: 15 min before scheduled
Evening Wind-down: 8:00 PM (customizable)
Streak at Risk: 9:00 PM if no completion
Weekly Summary: Sunday evening
Achievement Unlocked: Immediate
```

### In-App Notifications
```
- Toast messages for quick actions
- Modal for important updates
- Badge counts on tab icons
- Banner for streak milestones
```

---

## Appendix C: Gamification Elements

### Points System
```
Challenge Completion:
- Easy: 25 points
- Medium: 50 points
- Hard: 100 points

Streak Bonuses:
- 3-day streak: +10%
- 7-day streak: +25%
- 30-day streak: +50%

Additional Points:
- Reflection note: +10
- Sharing: +15
- Perfect week: +100
```

### Badges
```
Getting Started:
- First Steps (1 challenge)
- Early Bird (morning completion)
- Night Owl (evening completion)

Consistency:
- Week Warrior (7-day streak)
- Monthly Master (30-day streak)
- Century Club (100 challenges)

Category Mastery:
- Breath Master (25 breathwork)
- Mindful Maven (25 mindfulness)
- Journal Keeper (25 journal entries)
- Gratitude Guru (25 gratitude logs)
```

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024 | Initial release with complete UX flows, card designs, and 100 challenge prompts | Agent 15 |

---

*This document is part of the MindMate AI product specification. For questions or updates, contact the product team.*
