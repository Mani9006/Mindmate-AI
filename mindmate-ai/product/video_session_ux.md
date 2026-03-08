# MindMate AI - Live Video Therapy Session UX Specification

## Document Information
- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: 2024
- **Author**: Agent 14 - Video Session UX Designer

---

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Pre-Session Check-In](#1-pre-session-check-in)
4. [Session Interface Layout](#2-session-interface-layout)
5. [Emotion Indicator Display](#3-emotion-indicator-display)
6. [Session Controls](#4-session-controls)
7. [Note-Taking System](#5-note-taking-system)
8. [Session Ending Flow](#6-session-ending-flow)
9. [Post-Session Reflection](#7-post-session-reflection-prompt)
10. [Complete UI State Specifications](#complete-ui-state-specifications)
11. [Accessibility Requirements](#accessibility-requirements)
12. [Technical Specifications](#technical-specifications)

---

## Overview

This document provides comprehensive UX specifications for MindMate AI's live video therapy session experience. The design prioritizes user comfort, emotional safety, and seamless interaction while maintaining clinical appropriateness.

### Core Experience Goals
- Create a calm, therapeutic environment
- Minimize cognitive load during vulnerable moments
- Provide clear feedback on system status
- Enable easy access to support features
- Maintain privacy and security at all times

---

## Design Principles

### 1. Therapeutic Calm
- Soft, muted color palette (blues, greens, warm neutrals)
- Rounded corners and organic shapes
- Gentle animations (no jarring transitions)
- Ample whitespace and breathing room

### 2. Transparent Control
- Users always know what's happening
- Clear system status indicators
- Easy access to session controls
- No hidden features or surprise behaviors

### 3. Emotional Safety First
- Crisis detection and response protocols
- Easy session pause/exit options
- Non-judgmental language throughout
- Privacy indicators always visible

### 4. Adaptive Interface
- Interface adjusts to emotional state
- Context-aware feature availability
- Progressive disclosure of advanced features
- Responsive to user comfort level

---

## 1. Pre-Session Check-In

### Purpose
Prepare the user emotionally and technically before entering the session. Gather context for a personalized experience.

### Flow Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Welcome & Intent Check                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [MindMate Logo - Gentle Pulse Animation]                        │
│                                                                   │
│  "Welcome back, [Name]"                                          │
│  "Let's take a moment to check in before we begin"               │
│                                                                   │
│  How are you feeling right now?                                  │
│                                                                   │
│  [😊 Calm]  [😐 Neutral]  [😔 Low]  [😰 Anxious]  [😢 Sad]        │
│                                                                   │
│  [Continue →]                                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Mood Selection Interaction
- **Visual**: Circular emoji buttons with subtle hover lift
- **Animation**: Gentle scale (1.05x) on hover, soft glow on selection
- **Sound**: Optional subtle chime on selection (user preference)
- **Accessibility**: Full keyboard navigation, screen reader labels

---

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Session Focus (Optional)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Is there something specific you'd like to focus on today?       │
│                                                                   │
│  [Quick tags - tap to select multiple]                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Anxiety  │ │ Work     │ │ Relationships│ │ Sleep │            │
│  │ [  ✓   ] │ │ [    ]   │ │ [  ✓   ] │ │ [    ]  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                   │
│  [+ Add custom topic...]                                         │
│                                                                   │
│  Or just have an open conversation →                             │
│                                                                   │
│  [Skip for now]  [Continue →]                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Topic Selection Features
- Pre-defined topics with icons
- Custom topic input with autocomplete
- "Open conversation" option for no specific focus
- Selection persists for future sessions

---

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Technical Check                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Camera Preview - Live Feed]                                    │
│                                                                   │
│  Camera: [● Working]  Microphone: [● Working]                    │
│                                                                   │
│  ┌─────────────────────────────────────┐                        │
│  │                                     │                        │
│  │     [Your Camera Preview]           │                        │
│  │                                     │                        │
│  │     [Test your lighting]            │                        │
│  │                                     │                        │
│  └─────────────────────────────────────┘                        │
│                                                                   │
│  [🔧 Camera Settings]  [🎤 Test Microphone]                     │
│                                                                   │
│  [Start Session →]                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Technical Check Features
- Live camera preview with lighting feedback
- Microphone level indicator (visual bars)
- Quick settings access for device selection
- "Remember my preferences" toggle

---

### Pre-Session State Specifications

| State | Visual | Behavior | Duration |
|-------|--------|----------|----------|
| **Initial Load** | Fade in from center, logo pulse | Auto-advance after 500ms | ~1s |
| **Mood Selection** | Emoji buttons with selection states | User must select to continue | User-paced |
| **Topic Selection** | Tag pills with multi-select | Optional step | User-paced |
| **Tech Check** | Live preview with status indicators | Auto-detect devices | User-paced |
| **Transition to Session** | Full-screen fade to session | Loading overlay | ~2s |

---

## 2. Session Interface Layout

### Primary Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [HEADER BAR - 56px height]                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [🛡️ Secure]  Session with MindMate    [⏱️ 23:45]  [⚙️]  [✕]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐   │
│  │                                 │  │                               │   │
│  │                                 │  │    AI THERAPIST               │   │
│  │      USER VIDEO FEED            │  │    [Animated Avatar/Video]    │   │
│  │                                 │  │                               │   │
│  │      [Primary Focus Area]       │  │    [Subtle breathing          │   │
│  │                                 │  │     animation when idle]      │   │
│  │      [Mirror mode for           │  │                               │   │
│  │       self-awareness]           │  │                               │   │
│  │                                 │  │                               │   │
│  │  ┌─────────────────────────┐   │  │                               │   │
│  │  │ 🎤 [Voice Waveform]     │   │  │  ┌─────────────────────┐     │   │
│  │  │ Active listening...     │   │  │  │ [Emotion Indicator] │     │   │
│  │  └─────────────────────────┘   │  │  │ [Optional - subtle] │     │   │
│  │                                 │  │  └─────────────────────┘     │   │
│  └─────────────────────────────────┘  └───────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [CONTROL BAR - 72px height]                                        │   │
│  │                                                                     │   │
│  │  [🎤 Mute]  [📹 Video]  [⏸️ Pause]  [📝 Notes]  [❌ End]           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout Variants

#### Desktop (≥1024px)
- Side-by-side video feeds (60/40 split)
- Persistent control bar at bottom
- Optional sidebar for notes (collapsible)

#### Tablet (768px - 1023px)
- Stacked video feeds (user on top, AI below)
- Compact control bar
- Slide-out notes panel

#### Mobile (<768px)
- Full-screen AI view with picture-in-picture user
- Floating action button for controls
- Swipe gestures for notes

### Video Feed Specifications

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| User Video | 60% width, full height | 40% height | PiP (corner) |
| AI Avatar | 40% width, full height | 60% height | Full screen |
| Border Radius | 24px | 20px | 16px |
| Shadow | Soft (0 8px 32px rgba(0,0,0,0.12)) | Medium | Minimal |

---

## 3. Emotion Indicator Display

### Design Decision: User-Visible Emotion Indicators

**YES - Users should see emotion indicators**, with the following design philosophy:

1. **Transparency**: Users deserve to know what the AI perceives
2. **Self-Awareness**: Visual feedback can help users recognize their own emotional patterns
3. **Trust Building**: Visible indicators build trust in AI understanding
4. **User Control**: Users can toggle visibility in settings

### Emotion Indicator Design

```
┌─────────────────────────────────────────────────┐
│  EMOTION INDICATOR - SUBTLE PILL DESIGN         │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  [Icon]  [Emotion Label]  [Confidence]  │    │
│  │                                          │    │
│  │  😌  Calm  ████████████████████  92%    │    │
│  │                                          │    │
│  │  Secondary: 🧠 Focused, 💭 Reflective   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Position: Bottom-right of AI avatar area       │
│  Opacity: 70% (subtle, non-intrusive)           │
│  Size: Compact (max 200px width)                │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Emotion States & Visual Representation

| Emotion | Icon | Color | Bar Style |
|---------|------|-------|-----------|
| **Calm** | 😌 | `#4ECDC4` (Teal) | Smooth, slow pulse |
| **Happy** | 😊 | `#FFE66D` (Yellow) | Gentle wave |
| **Focused** | 🧠 | `#95E1D3` (Mint) | Steady solid |
| **Anxious** | 😰 | `#FFA07A` (Coral) | Quick, small pulses |
| **Sad** | 😢 | `#87CEEB` (Sky Blue) | Slow, gentle wave |
| **Frustrated** | 😤 | `#F7B801` (Amber) | Sharp, angular |
| **Neutral** | 😐 | `#B8B8D1` (Lavender Gray) | Minimal pulse |

### Confidence Indicator

```
Confidence Level Visualization:

Low (0-40%):     ░░░░░░░░░░░░░░░░░░░░  Dotted outline, faded
Medium (41-70%): ▒▒▒▒▒▒▒▒░░░░░░░░░░░░  Partial fill
High (71-90%):   ████████████████░░░░  Nearly solid
Very High (91%+):████████████████████  Solid, subtle glow
```

### User Controls for Emotion Indicator

```
┌─────────────────────────────────────────────────┐
│  EMOTION INDICATOR SETTINGS                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  [✓] Show emotion indicator during session      │
│                                                  │
│  Detail Level:                                  │
│  (○) Simple (primary emotion only)              │
│  (●) Detailed (primary + secondary)             │
│  (○) Off (hide completely)                      │
│                                                  │
│  Position:                                      │
│  (●) Bottom-right of AI view                    │
│  (○) Bottom-left of user view                   │
│  (○) Top overlay (minimal)                      │
│                                                  │
│  [✓] Show confidence percentage                 │
│  [✓] Play subtle sound on emotion change        │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 4. Session Controls

### Primary Control Bar

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION CONTROL BAR - 72px height                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │          │  │          │  │          │  │          │  │          │  │
│  │   🎤     │  │   📹     │  │   ⏸️     │  │   📝     │  │   ❌     │  │
│  │          │  │          │  │          │  │          │  │          │  │
│  │   Mute   │  │   Video  │  │   Pause  │  │   Notes  │  │   End    │  │
│  │          │  │          │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                                          │
│  Button Size: 56px diameter                                              │
│  Spacing: 24px between buttons                                           │
│  Active State: Filled background with icon                               │
│  Inactive State: Outlined with subtle background                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Control Button Specifications

| Control | Default State | Active State | Shortcut | Tooltip |
|---------|---------------|--------------|----------|---------|
| **Mute** | 🎤 Unmuted | 🔇 Muted (red bg) | `M` | "Mute/Unmute microphone" |
| **Video** | 📹 On | 📹 Off (red bg) | `V` | "Turn camera on/off" |
| **Pause** | ⏸️ Active | ▶️ Paused (amber bg) | `Space` | "Pause session" |
| **Notes** | 📝 Closed | 📝 Open (blue bg) | `N` | "Take notes" |
| **End** | ❌ Neutral | - | `Esc` (double-tap) | "End session" |

### Secondary Controls (Settings Menu)

```
┌─────────────────────────────────────────────────┐
│  SETTINGS DROPDOWN MENU                          │
├─────────────────────────────────────────────────┤
│                                                  │
│  [🔊] Audio Settings                             │
│  [🎨] Video Effects (blur background)           │
│  [📊] Emotion Indicator Settings                │
│  [🔔] Notification Preferences                  │
│  [♿] Accessibility Options                     │
│  [❓] Help & Support                            │
│  ─────────────────────────                       │
│  [🐛] Report an Issue                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Pause Session Overlay

```
┌─────────────────────────────────────────────────┐
│  PAUSE OVERLAY                                   │
├─────────────────────────────────────────────────┤
│                                                  │
│         ┌─────────────────────┐                 │
│         │                     │                 │
│         │      ⏸️             │                 │
│         │                     │                 │
│         │   Session Paused    │                 │
│         │                     │                 │
│         │  AI is not listening │                 │
│         │  or recording.       │                 │
│         │                     │                 │
│         │  [▶️ Resume Session] │                 │
│         │                     │                 │
│         └─────────────────────┘                 │
│                                                  │
│  Background: Blurred session view               │
│  Overlay: Semi-transparent dark (rgba(0,0,0,0.7))│
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 5. Note-Taking System

### Inline Note Panel

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NOTES PANEL - Slide-out from right (320px width)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📝 Session Notes                                    [✕ Close]  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  [Quick Add Buttons]                                             │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │   │
│  │  │💡 Insight│ │❓ Question│ │📌 Action │ │🎯 Goal  │                    │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘                    │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  [Timestamp] 14:32                                               │   │
│  │  💡 "I realized I've been avoiding difficult conversations"     │   │
│  │                                                                  │   │
│  │  [Timestamp] 18:45                                               │   │
│  │  ❓ "Why do I feel guilty setting boundaries?"                  │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  [Type a note...     ]  [➕ Add]                                │   │
│  │                                                                  │   │
│  │  [🎤 Voice Note]  [📎 Attach]  [🏷️ Tag]                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Note Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| **Insight** | 💡 | `#FFD93D` | Personal realizations |
| **Question** | ❓ | `#6BCB77` | Questions to explore later |
| **Action Item** | 📌 | `#FF6B6B` | Tasks or commitments |
| **Goal** | 🎯 | `#4D96FF` | Progress toward goals |
| **Gratitude** | 🙏 | `#FF9F45` | Positive moments |
| **Pattern** | 🔁 | `#9B59B6` | Recurring themes |

### Voice Note Feature

```
┌─────────────────────────────────────────────────┐
│  VOICE NOTE RECORDING                            │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │    ●━━━●━━━●━━━●━━━●━━━●━━━●━━━●       │    │
│  │    [Recording waveform animation]       │    │
│  │                                         │    │
│  │    Recording...  00:23                  │    │
│  │                                         │    │
│  │    [⏹ Stop]  [⏸️ Pause]                │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Auto-transcribe: [✓] On                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Note-Taking Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Toggle notes panel |
| `Ctrl/Cmd + I` | Add insight note |
| `Ctrl/Cmd + Q` | Add question note |
| `Ctrl/Cmd + A` | Add action item |
| `Ctrl/Cmd + R` | Start voice note |
| `Esc` | Close notes panel |

---

## 6. Session Ending Flow

### End Session Options

```
┌─────────────────────────────────────────────────┐
│  END SESSION CONFIRMATION                        │
├─────────────────────────────────────────────────┤
│                                                  │
│  How would you like to end today's session?     │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  [⏸️]                                   │    │
│  │  Take a Break                           │    │
│  │  Pause and return in a few minutes      │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  [✓]                                    │    │
│  │  Complete Session                       │    │
│  │  End and save your progress             │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [Cancel]                                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Session Summary Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION SUMMARY                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  🎉 Great work today, [Name]!                                   │   │
│  │                                                                  │   │
│  │  Session Duration: 32 minutes                                   │   │
│  │                                                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  📊 EMOTIONAL JOURNEY                                           │   │
│  │                                                                  │   │
│  │  Started: 😐 Neutral → Peak: 😌 Calm → Ended: 😊 Positive      │   │
│  │                                                                  │   │
│  │  [Simple line graph visualization]                              │   │
│  │                                                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  📝 YOUR NOTES (4)                                              │   │
│  │                                                                  │   │
│  │  💡 Insight: "I've been avoiding difficult conversations"      │   │
│  │  ❓ Question: "Why do I feel guilty setting boundaries?"       │   │
│  │  📌 Action: "Practice saying no to small requests"             │   │
│  │  🎯 Goal: "Improve work-life balance"                          │   │
│  │                                                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  🔑 KEY THEMES                                                  │   │
│  │                                                                  │   │
│  │  • Boundaries    • Communication    • Self-care                │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [📤 Export Notes]  [📅 Schedule Next Session]  [✓ Done]               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Export Options

```
┌─────────────────────────────────────────────────┐
│  EXPORT SESSION NOTES                            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Export Format:                                 │
│                                                  │
│  (●) PDF (formatted with session summary)       │
│  (○) Plain Text                                 │
│  (○) Markdown                                   │
│  (○) Email to me                                │
│                                                  │
│  Include:                                       │
│  [✓] Session transcript (anonymized)            │
│  [✓] Emotional journey graph                    │
│  [✓] My notes                                   │
│  [✓] Suggested resources                        │
│                                                  │
│  [📥 Download]  [📧 Email]  [☁️ Save to Cloud] │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 7. Post-Session Reflection Prompt

### Reflection Flow (24-48 hours after session)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  POST-SESSION REFLECTION - Push Notification / Email                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  "Hi [Name], how are you feeling after yesterday's session?"            │
│                                                                          │
│  [Open Reflection →]                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Reflection Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION REFLECTION                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Reflecting on: Tuesday's Session (32 min)                      │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  1. How are you feeling now compared to during the session?    │   │
│  │                                                                  │   │
│  │     [😊 Better]  [😐 Same]  [😔 Worse]  [🤔 Mixed]              │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  2. Did any insights from the session stay with you?           │   │
│  │                                                                  │   │
│  │     [Yes, and I acted on it]                                    │   │
│  │     [Yes, I've been thinking about it]                          │   │
│  │     [Somewhat]                                                  │   │
│  │     [Not really]                                                │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  3. Any additional thoughts? (Optional)                         │   │
│  │                                                                  │   │
│  │     [Text area for free-form reflection]                        │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  [Skip for now]  [Submit Reflection →]                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Reflection Summary & Insights

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REFLECTION INSIGHTS                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Thank you for reflecting! Here's what we've noticed:                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📈 YOUR PROGRESS                                                 │   │
│  │                                                                  │   │
│  │  Session mood: 😐 Neutral → Reflection: 😊 Better               │   │
│  │                                                                  │   │
│  │  This positive shift suggests the session techniques            │   │
│  │  may be helping. Consider practicing the boundary-setting       │   │
│  │  exercises we discussed.                                        │   │
│  │                                                                  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  💡 SUGGESTED NEXT STEPS                                        │   │
│  │                                                                  │   │
│  │  • Schedule a follow-up session this week                       │   │
│  │  • Try the "Saying No" practice exercise                        │   │
│  │  • Read: "Boundaries" resource (linked)                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [📅 Schedule Session]  [📖 View Resources]  [✓ Close]                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Complete UI State Specifications

### 1. LOADING STATE

```
┌─────────────────────────────────────────────────┐
│  LOADING STATE                                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Background: Solid brand color (#F8FAFC)        │
│                                                  │
│  Center Content:                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │      [Animated Logo/Breathing Circle]   │    │
│  │                                         │    │
│  │      ━━━━━━━━━━━━━━━━━━━━━━━━           │    │
│  │      [Progress bar - indeterminate]     │    │
│  │                                         │    │
│  │      "Preparing your session..."        │    │
│  │                                         │    │
│  │      [Subtext: "This may take a moment"]│    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Animations:                                     │
│  - Logo: Gentle pulse (2s cycle)                │
│  - Progress bar: Continuous shimmer             │
│  - Text: Fade in/out subtle                     │
│                                                  │
│  Duration: 2-5 seconds (max 10s with timeout)   │
│                                                  │
│  Error State:                                    │
│  If loading fails:                               │
│  "Having trouble connecting"                     │
│  [Retry]  [Check Connection]  [Contact Support] │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Loading State Specifications:**
| Property | Value |
|----------|-------|
| Background | `#F8FAFC` (Cool gray) |
| Logo Animation | Scale 0.95-1.05, 2s ease-in-out |
| Progress Bar | Indeterminate, brand color gradient |
| Timeout | 10 seconds before error state |
| Accessibility | Screen reader announces "Loading session" |

---

### 2. CONNECTING STATE

```
┌─────────────────────────────────────────────────┐
│  CONNECTING STATE                                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Background: Session layout with placeholder    │
│                                                  │
│  User Video: [Live feed - mirror mode]          │
│  AI Avatar: [Connecting animation]              │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │
│  │      [AI Avatar Placeholder]            │    │
│  │                                         │    │
│  │      🔄 Connecting to MindMate...       │    │
│  │                                         │    │
│  │      ━━━━━━━━━━━━━━━━━━━━━━━━           │    │
│  │      [Progress: 60%]                    │    │
│  │                                         │    │
│  │      "Establishing secure connection"   │    │
│  │      "Initializing AI therapist"        │    │
│  │      "Ready to begin"                   │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Steps (3-5 seconds each):                       │
│  1. "Establishing secure connection" 🔒         │
│  2. "Initializing AI therapist" 🧠              │
│  3. "Calibrating emotion detection" 📊          │
│  4. "Ready to begin" ✓                          │
│                                                  │
│  Control Bar: Disabled (grayed out)             │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Connecting State Specifications:**
| Property | Value |
|----------|-------|
| Progress Steps | 4 steps, 3-5s each |
| Visual Feedback | Checkmark animation on completion |
| User Video | Active, mirror mode for self-check |
| AI Placeholder | Gentle breathing circle animation |
| Controls | Disabled with tooltip "Connecting..." |
| Audio | Subtle connection sound on complete |

---

### 3. ACTIVE STATE (Idle)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ACTIVE STATE - IDLE                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Header: Secure indicator, timer, settings, close]                     │
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │                             │  │                             │      │
│  │    [USER VIDEO FEED]        │  │    [AI AVATAR]              │      │
│  │                             │  │                             │      │
│  │    Active, listening        │  │    Gentle idle animation    │      │
│  │    for your input           │  │    (subtle breathing)       │      │
│  │                             │  │                             │      │
│  │                             │  │  ┌─────────────────────┐    │      │
│  │                             │  │  │ 😐 Neutral  85%     │    │      │
│  │                             │  │  │ [Emotion indicator] │    │      │
│  │                             │  │  └─────────────────────┘    │      │
│  │                             │  │                             │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                          │
│  [CONTROL BAR - All controls active]                                    │
│  [🎤] [📹] [⏸️] [📝] [❌]                                                │
│                                                                          │
│  Status Indicator: "MindMate is ready to listen"                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Active State Specifications:**
| Property | Value |
|----------|-------|
| AI Animation | Subtle breathing (3s cycle) |
| Emotion Indicator | Updates every 2-3 seconds |
| Status Text | "Ready to listen" / "Here for you" |
| Controls | Fully active, hover states |
| Timer | Running, MM:SS format |

---

### 4. USER SPEAKING STATE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER SPEAKING STATE                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │                             │  │                             │      │
│  │    [USER VIDEO FEED]        │  │    [AI AVATAR]              │      │
│  │                             │  │                             │      │
│  │    🎤 [Voice Waveform]      │  │    👂 Listening...          │      │
│  │                             │  │                             │      │
│  │    ━━━━━━●━━━━━━━━━━━━━     │  │    [Attentive posture       │      │
│  │    [Active visualization]   │  │     animation]              │      │
│  │                             │  │                             │      │
│  │  ┌─────────────────────┐    │  │                             │      │
│  │  │ 🎤 Listening...     │    │  │                             │      │
│  │  │ [Live transcript    │    │  │                             │      │
│  │  │  appearing here]    │    │  │                             │      │
│  │  └─────────────────────┘    │  │                             │      │
│  │                             │  │                             │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                          │
│  Status: "Listening..." with animated dots                              │
│                                                                          │
│  Visual Cues:                                                            │
│  - User border: Subtle glow (brand color)                               │
│  - Voice waveform: Real-time visualization                              │
│  - AI avatar: Attentive/listening pose                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**User Speaking Specifications:**
| Property | Value |
|----------|-------|
| Voice Waveform | Real-time bars, 10-15 segments |
| Border Glow | Brand color, 2px, pulse animation |
| AI State | "Listening..." with animated dots |
| Transcript | Optional, appears below user video |
| Timeout | 5s silence → "Are you still there?" prompt |

---

### 5. AI SPEAKING STATE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AI SPEAKING STATE                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │                             │  │                             │      │
│  │    [USER VIDEO FEED]        │  │    [AI AVATAR - ACTIVE]     │      │
│  │                             │  │                             │      │
│  │    [Subtle border,          │  │    🔊 Speaking...           │      │
│  │     passive state]          │  │                             │      │
│  │                             │  │    [Lip sync animation]     │      │
│  │                             │  │    [Expressive gestures]    │      │
│  │                             │  │                             │      │
│  │                             │  │  ┌─────────────────────┐    │      │
│  │                             │  │  │ [Caption text       │    │      │
│  │                             │  │  │  appearing here]    │    │      │
│  │                             │  │  │                     │    │      │
│  │                             │  │  │ "It's completely     │    │      │
│  │                             │  │  │  understandable..." │    │      │
│  │                             │  │  └─────────────────────┘    │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                          │
│  Status: "MindMate is speaking"                                         │
│                                                                          │
│  Visual Cues:                                                            │
│  - AI border: Active glow (teal/blue)                                   │
│  - AI avatar: Lip-sync animation with expression changes                │
│  - Captions: Real-time, optional toggle                                 │
│  - User video: Dimmed slightly (focus on AI)                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**AI Speaking Specifications:**
| Property | Value |
|----------|-------|
| Lip Sync | Phoneme-matched mouth shapes |
| Expressions | Emotion-appropriate facial expressions |
| Border Glow | Teal/blue, 3px, steady |
| Captions | Optional, toggle in settings |
| User Dim | 80% opacity to focus attention |
| Interruption | Click/tap to interrupt (politely) |

---

### 6. CRISIS DETECTED STATE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️ CRISIS DETECTED STATE - HIGH PRIORITY                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️  IMPORTANT NOTICE                                            │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  I've noticed you might be going through a difficult time.      │   │
│  │                                                                  │   │
│  │  Your wellbeing is important. Here are some resources:          │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  🆘 IMMEDIATE HELP                                       │    │   │
│  │  │                                                          │    │   │
│  │  │  988 Suicide & Crisis Lifeline                          │    │   │
│  │  │  Call or text 988                                       │    │   │
│  │  │  [📞 Call Now]  [💬 Text]                               │    │   │
│  │  │                                                          │    │   │
│  │  │  Crisis Text Line: Text HOME to 741741                  │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  📋 ADDITIONAL RESOURCES                                 │    │   │
│  │  │                                                          │    │   │
│  │  │  • Find a therapist near you                            │    │   │
│  │  │  • Emergency services: 911                              │    │   │
│  │  │  • International helplines                              │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                                                                  │   │
│  │  ─────────────────────────────────────────────────────────      │   │
│  │                                                                  │   │
│  │  Would you like to:                                             │   │
│  │                                                                  │   │
│  │  [Continue talking with MindMate]  [End session for now]       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Background: Session continues with overlay                              │
│  Overlay: Semi-transparent with warning tint                             │
│  Audio: Optional gentle alert tone                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Crisis Detection Specifications:**
| Property | Value |
|----------|-------|
| Trigger | AI confidence > 85% on crisis keywords/patterns |
| Response Time | Immediate (< 1 second) |
| Overlay | Non-blocking, dismissible |
| Resources | Localized based on user location |
| Follow-up | Logged for safety review (encrypted) |
| User Choice | Always respects user autonomy |

### Crisis Keywords & Patterns
- Self-harm language
- Suicidal ideation phrases
- Severe hopelessness indicators
- Immediate danger expressions

### Crisis Response Protocol
1. **Detect**: AI identifies crisis indicators
2. **Display**: Show resources overlay immediately
3. **Log**: Secure, encrypted log for safety
4. **Support**: Continue session if user chooses
5. **Follow-up**: Offer check-in within 24 hours

---

### 7. SESSION ENDING STATE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SESSION ENDING STATE                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Background: Session view with fade overlay                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Session ending in 30 seconds...                                │   │
│  │                                                                  │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │   │
│  │  [Countdown progress bar]                                       │   │
│  │                                                                  │   │
│  │  "Thank you for sharing today. I'm here whenever you need me." │   │
│  │                                                                  │   │
│  │  [⏱️ Add 5 minutes]  [End now →]                                │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Auto-end triggers:                                                      │
│  - Scheduled session time reached                                       │
│  - User inactivity for 5+ minutes                                       │
│  - Manual end request                                                   │
│                                                                          │
│  Visual:                                                                 │
│  - Gradual fade to session summary                                      │
│  - Gentle closing message from AI                                       │
│  - Option to extend or end immediately                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Session Ending Specifications:**
| Property | Value |
|----------|-------|
| Warning Time | 30 seconds before auto-end |
| Countdown | Visible progress bar |
| Options | Extend 5min / End now / Continue |
| AI Message | Personalized closing based on session |
| Transition | Smooth fade to summary screen |

---

## Accessibility Requirements

### Visual Accessibility
- [ ] Minimum contrast ratio: 4.5:1 for text
- [ ] Focus indicators visible on all interactive elements
- [ ] Support for reduced motion preferences
- [ ] Scalable text (up to 200%)
- [ ] Color not sole indicator of state

### Audio Accessibility
- [ ] Captions for all AI speech (toggle)
- [ ] Visual indicators for audio states
- [ ] Adjustable volume levels
- [ ] Screen reader compatibility

### Motor Accessibility
- [ ] Full keyboard navigation
- [ ] Large touch targets (min 44x44px)
- [ ] Gesture alternatives
- [ ] Voice control compatibility

### Cognitive Accessibility
- [ ] Clear, simple language
- [ ] Consistent navigation patterns
- [ ] Error prevention and recovery
- [ ] Adequate time for responses

---

## Technical Specifications

### Performance Targets
| Metric | Target |
|--------|--------|
| Initial Load | < 3 seconds |
| Connection Time | < 5 seconds |
| Video Latency | < 150ms |
| AI Response | < 2 seconds |
| Frame Rate | 30fps minimum |

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Network Requirements
- Minimum: 1 Mbps upload/download
- Recommended: 3+ Mbps
- Adaptive bitrate for poor connections

### Security
- End-to-end encryption for video
- HIPAA-compliant data handling
- Secure WebRTC implementation
- Encrypted session recordings (optional)

---

## Appendix: Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Brand Primary | `#4ECDC4` | Primary actions, highlights |
| Brand Secondary | `#95E1D3` | Secondary elements, accents |
| Brand Dark | `#2C3E50` | Text, headers |
| Brand Light | `#F8FAFC` | Backgrounds |

### Emotion Colors
| Emotion | Hex | Usage |
|---------|-----|-------|
| Calm | `#4ECDC4` | Calm indicator |
| Happy | `#FFE66D` | Positive emotions |
| Anxious | `#FFA07A` | Warning states |
| Sad | `#87CEEB` | Blue emotions |
| Crisis | `#FF6B6B` | Alert states |

### UI Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#6BCB77` | Success states |
| Warning | `#F7B801` | Warnings |
| Error | `#FF6B6B` | Errors |
| Info | `#4D96FF` | Information |

---

## Appendix: Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Button hover | 200ms | ease-out |
| Panel slide | 300ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Fade transitions | 250ms | ease-in-out |
| Pulse effects | 2000ms | ease-in-out (infinite) |
| Loading spinner | 1000ms | linear (infinite) |
| Voice waveform | 100ms | linear (real-time) |

---

*Document Version: 1.0.0*
*For implementation questions, refer to the MindMate AI Design System*
