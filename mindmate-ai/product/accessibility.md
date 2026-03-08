# MindMate AI - Accessibility & Inclusion Design Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production-Ready Specification  
**Compliance Target:** WCAG 2.1 Level AA, HHS Section 504, ADA Title II

---

## Executive Summary

This document provides comprehensive accessibility and inclusion design specifications for MindMate AI, a mental health support platform. All features are designed to meet or exceed WCAG 2.1 Level AA standards, with specific attention to the requirements outlined in the U.S. Department of Health and Human Services (HHS) Section 504 update (May 2024) and ADA Title II requirements (compliance deadline: May 2026 for organizations with 15+ employees).

### Key Compliance Deadlines
- **May 11, 2026**: WCAG 2.1 AA compliance required for organizations with 15+ employees
- **May 10, 2027**: Compliance deadline for smaller organizations (< 15 employees)
- **September 3, 2024**: FCC captioning requirements for video platforms (already in effect)

---

## Table of Contents

1. [Screen Reader Support](#1-screen-reader-support)
2. [Font Size Controls](#2-font-size-controls)
3. [High Contrast Mode](#3-high-contrast-mode)
4. [Closed Captions on Video Sessions](#4-closed-captions-on-video-sessions)
5. [Color-Blind Safe Palette](#5-color-blind-safe-palette)
6. [Low-Bandwidth User Features](#6-low-bandwidth-user-features)
7. [Elderly User Design](#7-elderly-user-design)
8. [Multilingual Support Priorities](#8-multilingual-support-priorities)
9. [Implementation Checklist](#9-implementation-checklist)
10. [Testing & Validation](#10-testing--validation)

---

## 1. Screen Reader Support

### 1.1 Overview

Screen reader support ensures that users with visual impairments can fully interact with MindMate AI using assistive technologies such as NVDA, JAWS, VoiceOver (iOS/macOS), and TalkBack (Android).

### 1.2 Technical Requirements

#### Semantic HTML Structure
```html
<!-- Required semantic structure -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main">
  <h1>Page Title</h1>
  <section aria-labelledby="section-heading">
    <h2 id="section-heading">Section Title</h2>
    <!-- Content -->
  </section>
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

#### ARIA Implementation Standards

| Element Type | ARIA Attributes Required | Priority |
|--------------|-------------------------|----------|
| Buttons | `aria-label` or `aria-labelledby` | Critical |
| Form Inputs | `aria-describedby` for error messages | Critical |
| Modal Dialogs | `role="dialog"`, `aria-modal="true"` | Critical |
| Navigation | `aria-current="page"` for active item | High |
| Alerts | `role="alert"`, `aria-live="polite"` | Critical |
| Progress Indicators | `role="progressbar"`, `aria-valuenow` | High |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"` | High |
| Accordion | `aria-expanded`, `aria-controls` | High |

### 1.3 Focus Management

#### Focus Indicators
- **Minimum focus ring size**: 2px solid outline
- **Focus color**: Must meet 3:1 contrast ratio against adjacent colors
- **Focus offset**: Minimum 2px from element boundary
- **Never remove default focus**: Only enhance, never suppress

```css
/* Required focus styles */
*:focus-visible {
  outline: 2px solid #0056b3;
  outline-offset: 2px;
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
}
```

#### Focus Order
- Logical tab order following visual layout
- No keyboard traps
- Focus returns to trigger element when modal closes
- Focus visible on all interactive elements

### 1.4 Screen Reader Announcements

#### Live Regions
```html
<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-region">
  <!-- Dynamic status updates -->
</div>

<!-- Alert announcements -->
<div aria-live="assertive" aria-atomic="true" class="sr-only" id="alert-region">
  <!-- Critical alerts -->
</div>
```

#### Dynamic Content Updates
- Chat messages: Announce with sender name and message preview
- Mood tracking updates: Confirm submission with date/time
- Appointment reminders: Announce 15 minutes before
- Emergency resources: Immediate assertive announcement

### 1.5 Alternative Text Standards

| Image Type | Alt Text Requirement | Example |
|------------|---------------------|---------|
| Decorative | `alt=""` (empty) | Background patterns |
| Functional | Describe action | "Play meditation audio" |
| Informative | Describe content | "Line graph showing mood trends over 7 days" |
| Complex Charts | Detailed description + data table | "Bar chart: Anxiety levels decreased from 8 to 3 over 4 weeks" |
| Therapist Photos | Name + credentials | "Dr. Sarah Johnson, Licensed Clinical Psychologist" |

### 1.6 Screen Reader Testing Matrix

| Screen Reader | Browser | Platform | Testing Priority |
|---------------|---------|----------|------------------|
| NVDA | Chrome, Firefox | Windows | Critical |
| JAWS | Chrome, Edge | Windows | Critical |
| VoiceOver | Safari | macOS | Critical |
| VoiceOver | Safari | iOS | Critical |
| TalkBack | Chrome | Android | Critical |
| Narrator | Edge | Windows | High |

---

## 2. Font Size Controls

### 2.1 Overview

Font size controls allow users to adjust text size according to their visual needs. This feature supports users with low vision, presbyopia, and other visual impairments.

### 2.2 Technical Specifications

#### Base Font Sizes

| Element | Default Size | Minimum Size | Maximum Size |
|---------|-------------|--------------|--------------|
| Body Text | 16px (1rem) | 16px | 32px |
| H1 | 32px (2rem) | 32px | 48px |
| H2 | 24px (1.5rem) | 24px | 40px |
| H3 | 20px (1.25rem) | 20px | 36px |
| Small/Caption | 14px (0.875rem) | 14px | 24px |
| Button Text | 16px (1rem) | 16px | 28px |

#### Font Size Scaling Options

```javascript
// Font size levels
const FONT_SIZES = {
  small: { multiplier: 1, label: 'Standard (100%)' },
  medium: { multiplier: 1.25, label: 'Large (125%)' },
  large: { multiplier: 1.5, label: 'Extra Large (150%)' },
  xlarge: { multiplier: 2, label: 'Maximum (200%)' }
};
```

### 2.3 User Interface Implementation

#### Font Size Control Component
```jsx
// React component example
<FontSizeControl 
  currentSize={userPreferences.fontSize}
  onChange={handleFontSizeChange}
  options={[
    { value: 'small', label: 'A', description: 'Standard' },
    { value: 'medium', label: 'A+', description: 'Large' },
    { value: 'large', label: 'A++', description: 'Extra Large' },
    { value: 'xlarge', label: 'A+++', description: 'Maximum' }
  ]}
/>
```

#### CSS Implementation
```css
/* Root font size scaling */
:root {
  --font-size-multiplier: 1;
}

[data-font-size="small"] { --font-size-multiplier: 1; }
[data-font-size="medium"] { --font-size-multiplier: 1.25; }
[data-font-size="large"] { --font-size-multiplier: 1.5; }
[data-font-size="xlarge"] { --font-size-multiplier: 2; }

/* Scaled typography */
body {
  font-size: calc(16px * var(--font-size-multiplier));
}

h1 {
  font-size: calc(2rem * var(--font-size-multiplier));
}

/* Container constraints */
.text-container {
  max-width: 75ch; /* Maintain readable line length */
  line-height: 1.5;
}
```

### 2.4 Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 320px | Maintain minimum font sizes, enable horizontal scroll for tables |
| 320px - 768px | Scale proportionally, adjust layout to single column |
| 768px - 1024px | Full scaling support, maintain multi-column where appropriate |
| > 1024px | Full scaling support, optimal reading experience |

### 2.5 Accessibility Requirements

- **WCAG 1.4.4 Resize Text**: Support up to 200% zoom without loss of content or functionality
- **WCAG 1.4.10 Reflow**: Content reflows without horizontal scrolling at 320px viewport
- **System Integration**: Respect system font size settings (iOS Dynamic Type, Android font scaling)

### 2.6 Font Recommendations

#### Primary Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

#### Accessible Font Alternatives
- **Atkinson Hyperlegible**: Designed for low vision users (Braille Institute)
- **OpenDyslexic**: For users with dyslexia
- **Inter**: High x-height, excellent readability
- **Roboto**: Optimized for mobile screens

---

## 3. High Contrast Mode

### 3.1 Overview

High contrast mode enhances visibility by maximizing the contrast between foreground and background elements. This is essential for users with low vision, cataracts, glaucoma, and other visual impairments.

### 3.2 Contrast Requirements

#### WCAG 2.1 Contrast Ratios

| Element Type | Normal Text | Large Text (18pt+/14pt+ bold) | UI Components |
|--------------|-------------|------------------------------|---------------|
| Level AA (Minimum) | 4.5:1 | 3:1 | 3:1 |
| Level AAA (Enhanced) | 7:1 | 4.5:1 | 3:1 |
| MindMate Target | 7:1 | 4.5:1 | 4.5:1 |

### 3.3 High Contrast Mode Themes

#### Theme 1: Dark High Contrast (Default)
```css
[data-theme="high-contrast-dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #ffff00; /* Yellow for emphasis */
  --accent-primary: #00ffff; /* Cyan for interactive */
  --accent-secondary: #ff00ff; /* Magenta for alerts */
  --border-color: #ffffff;
  --focus-ring: #ffff00;
}
```

#### Theme 2: Light High Contrast
```css
[data-theme="high-contrast-light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f0f0f0;
  --text-primary: #000000;
  --text-secondary: #000080; /* Navy for emphasis */
  --accent-primary: #0000ff; /* Blue for interactive */
  --accent-secondary: #ff0000; /* Red for alerts */
  --border-color: #000000;
  --focus-ring: #0000ff;
}
```

#### Theme 3: Yellow on Black (Maximum Contrast)
```css
[data-theme="yellow-black"] {
  --bg-primary: #000000;
  --bg-secondary: #000000;
  --text-primary: #ffff00;
  --text-secondary: #ffffff;
  --accent-primary: #00ff00;
  --accent-secondary: #ff0000;
  --border-color: #ffff00;
  --focus-ring: #00ff00;
}
```

### 3.4 System Integration

#### Detect System High Contrast
```css
/* Windows High Contrast Mode */
@media (prefers-contrast: high) {
  /* Apply high contrast styles */
}

/* Forced Colors Mode */
@media (forced-colors: active) {
  /* Respect system color preferences */
}
```

#### JavaScript Detection
```javascript
// Detect high contrast preference
const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
const forcedColors = window.matchMedia('(forced-colors: active)').matches;

// Auto-enable high contrast if system preference detected
if (prefersHighContrast || forcedColors) {
  enableHighContrastMode();
}
```

### 3.5 UI Components in High Contrast

| Component | High Contrast Treatment |
|-----------|------------------------|
| Buttons | Solid border (2px), distinct background |
| Links | Underlined, high contrast color |
| Form Inputs | 2px border, clear focus state |
| Cards | Strong border, no subtle shadows |
| Icons | Outlined style, minimum 3:1 contrast |
| Charts | Pattern fills + color, clear labels |
| Divider Lines | Minimum 2px thickness |

### 3.6 Implementation Checklist

- [ ] All text meets 7:1 contrast ratio
- [ ] Interactive elements have visible borders
- [ ] Focus indicators are highly visible
- [ ] No information conveyed by color alone
- [ ] Images have high contrast alternatives
- [ ] Charts use patterns in addition to colors

---

## 4. Closed Captions on Video Sessions

### 4.1 Overview

Closed captions provide text representation of audio content for users who are deaf or hard of hearing. As of September 3, 2024, FCC regulations require all video platforms, including telehealth services, to provide captions.

### 4.2 Legal Requirements

#### FCC Requirements (Effective September 3, 2024)
- All video platforms must provide captions
- Caption accuracy standards apply
- User controls for captions required
- Third-party caption service guidelines established

#### WCAG 2.1 Requirements
- **Level A (1.2.2)**: Captions for prerecorded audio
- **Level AA (1.2.4)**: Captions for live audio content
- **Level AA (1.2.5)**: Audio description for prerecorded video

### 4.3 Caption Technical Specifications

#### Caption Format Support
| Format | File Extension | Use Case |
|--------|---------------|----------|
| WebVTT | .vtt | Web-based video (preferred) |
| SRT | .srt | Legacy support |
| TTML | .ttml | Broadcast compatibility |
| DFXP | .dfxp | Streaming platforms |

#### Caption Display Settings
```css
/* Default caption styles */
.video-captions {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 24px; /* Scalable */
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.75);
  text-shadow: 1px 1px 2px #000000;
  line-height: 1.4;
  padding: 4px 8px;
  border-radius: 4px;
}

/* High contrast captions */
.video-captions.high-contrast {
  color: #ffff00;
  background-color: #000000;
  text-shadow: none;
  border: 2px solid #ffffff;
}
```

### 4.4 Caption Quality Standards

#### Accuracy Requirements
- **Minimum Accuracy**: 99% for prerecorded content
- **Live Caption Accuracy**: 95% minimum
- **Speaker Identification**: Required for multiple speakers
- **Non-Speech Information**: Include [music], [laughter], [pause]

#### Timing Specifications
- **Caption Duration**: Minimum 1 second, maximum 6 seconds
- **Reading Rate**: Maximum 160 words per minute
- **Synchronization**: Within 0.5 seconds of audio
- **Line Length**: Maximum 32 characters per line
- **Lines per Caption**: Maximum 2 lines

### 4.5 User Caption Controls

```jsx
<CaptionControls 
  isEnabled={captionsEnabled}
  onToggle={toggleCaptions}
  settings={{
    fontSize: ['small', 'medium', 'large'],
    fontFamily: ['default', 'monospace', 'sans-serif'],
    background: ['black', 'blue', 'transparent'],
    textColor: ['white', 'yellow', 'green'],
    position: ['bottom', 'top', 'middle'],
    opacity: [0.5, 0.75, 1.0]
  }}
/>
```

### 4.6 Live Session Captioning

#### Real-Time Caption Options

| Method | Latency | Accuracy | Cost | Best For |
|--------|---------|----------|------|----------|
| Professional CART | 1-3 sec | 98%+ | $$$$ | Critical sessions |
| AI Speech-to-Text | 0.5-2 sec | 90-95% | $$ | Standard sessions |
| Respeaking | 2-4 sec | 95%+ | $$$ | High-accuracy needs |
| Pre-scripted | 0 sec | 100% | $ | Educational content |

#### AI Captioning Implementation
```javascript
// Web Speech API for live captions
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = Array.from(event.results)
    .map(result => result[0].transcript)
    .join('');
  
  displayCaption(transcript, event.results[0].isFinal);
};
```

### 4.7 Caption Display During Video Sessions

#### Layout Options

```
┌─────────────────────────────────────┐
│                                     │
│         Video Content               │
│                                     │
├─────────────────────────────────────┤
│ [Speaker Name] Caption text here   │
│ Second line of caption if needed   │
└─────────────────────────────────────┘

Alternative: Side-by-side (desktop)
┌──────────────────┬──────────────────┐
│                  │                  │
│   Video          │   Captions       │
│                  │   Panel          │
│                  │                  │
└──────────────────┴──────────────────┘
```

### 4.8 Post-Session Caption Access

- Full transcript available immediately after session
- Downloadable as text file, PDF, or SRT
- Searchable transcript with timestamps
- Highlighted key moments/insights

---

## 5. Color-Blind Safe Palette

### 5.1 Overview

Approximately 8% of men and 0.5% of women have some form of color vision deficiency. The MindMate AI color palette is designed to be accessible to users with all types of color blindness.

### 5.2 Types of Color Blindness

| Type | Affected Colors | Population |
|------|-----------------|------------|
| Deuteranomaly | Green-Red | 5% of males |
| Protanomaly | Red-Green | 1% of males |
| Deuteranopia | Green (complete) | 1% of males |
| Protanopia | Red (complete) | 1% of males |
| Tritanomaly | Blue-Yellow | 0.01% |
| Tritanopia | Blue-Green, Yellow-Pink | 0.01% |
| Achromatopsia | All colors (grayscale) | 0.003% |

### 5.3 Color Palette Design Principles

#### Primary Rule: Never Rely on Color Alone
- Always pair color with text labels, icons, or patterns
- Use shape, size, and position as additional differentiators
- Test all designs in grayscale

### 5.4 MindMate AI Accessible Color Palette

#### Primary Colors
| Color Name | Hex Code | Usage | Contrast Ratio (on white) |
|------------|----------|-------|--------------------------|
| Calm Blue | #0066CC | Primary actions, links | 5.4:1 |
| Trust Teal | #008080 | Secondary actions | 4.8:1 |
| Growth Green | #2E7D32 | Success states, progress | 5.1:1 |
| Warm Amber | #E65100 | Warnings, cautions | 4.6:1 |
| Alert Red | #C62828 | Errors, emergencies | 6.6:1 |

#### Neutral Colors
| Color Name | Hex Code | Usage | Contrast Ratio |
|------------|----------|-------|----------------|
| Charcoal | #212121 | Primary text | 16.1:1 |
| Slate | #616161 | Secondary text | 6.6:1 |
| Silver | #9E9E9E | Disabled states | 3.0:1 |
| Cloud | #F5F5F5 | Backgrounds | N/A |
| White | #FFFFFF | Backgrounds | N/A |

#### Semantic Color Combinations
```css
/* Success - Green + Checkmark icon */
.status-success {
  color: #2E7D32;
  background-color: #E8F5E9;
  border: 2px solid #2E7D32;
}
.status-success::before {
  content: "✓ "; /* Icon + color */
}

/* Warning - Amber + Exclamation icon */
.status-warning {
  color: #E65100;
  background-color: #FFF3E0;
  border: 2px solid #E65100;
}
.status-warning::before {
  content: "⚠ "; /* Icon + color */
}

/* Error - Red + X icon */
.status-error {
  color: #C62828;
  background-color: #FFEBEE;
  border: 2px solid #C62828;
}
.status-error::before {
  content: "✕ "; /* Icon + color */
}
```

### 5.5 Color Combinations to Avoid

| Combination | Problem | Alternative |
|-------------|---------|-------------|
| Red + Green | Deuteranopia/Protanopia | Red + Blue, or add patterns |
| Pink + Turquoise + Gray | Tritanopia | Add text labels |
| Purple + Blue | Hard to distinguish | Use different shades or add icons |
| Green + Orange + Red | Multiple deficiencies | Use patterns + labels |
| Pastel colors (same lightness) | All types | Increase contrast, add borders |

### 5.6 Data Visualization Guidelines

#### Charts and Graphs
```javascript
// Accessible chart color palette
const ACCESSIBLE_COLORS = [
  '#0066CC', // Blue
  '#E65100', // Orange
  '#2E7D32', // Green
  '#6A1B9A', // Purple
  '#C62828', // Red
  '#008080', // Teal
];

// Pattern fills for additional differentiation
const PATTERN_FILLS = [
  'solid',
  'diagonal-stripes',
  'dots',
  'crosshatch',
  'horizontal-stripes',
  'vertical-stripes',
];
```

#### Mood Tracking Visualization
```
Mood Scale with Multiple Cues:

😊 Excellent  [Green]  [Solid]     5
🙂 Good       [Teal]   [Dots]      4
😐 Neutral    [Gray]   [Diagonal]  3
🙁 Low        [Orange] [Stripes]   2
😞 Critical   [Red]    [Crosshatch] 1 + Alert icon

Each level has: Emoji + Color + Pattern + Number
```

### 5.7 Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Color Oracle | Simulate color blindness | colororacle.org |
| Coblis | Color blindness simulator | coblis.com |
| WebAIM Contrast Checker | Check contrast ratios | webaim.org/resources/contrastchecker |
| Who Can Use | Color combination accessibility | whocanuse.com |
| Stark | Figma/Sketch plugin | getstark.co |

### 5.8 Color Blind Mode Toggle

```jsx
<AccessibilitySettings>
  <Toggle 
    label="Color Blind Friendly Mode"
    description="Enhances patterns and labels for better differentiation"
    onChange={enableColorBlindMode}
  />
  
  <RadioGroup 
    label="Color Blindness Type Simulation"
    options={[
      { value: 'none', label: 'None' },
      { value: 'deuteranopia', label: 'Deuteranopia (Green-Red)' },
      { value: 'protanopia', label: 'Protanopia (Red-Green)' },
      { value: 'tritanopia', label: 'Tritanopia (Blue-Yellow)' },
      { value: 'achromatopsia', label: 'Achromatopsia (Grayscale)' }
    ]}
  />
</AccessibilitySettings>
```

---

## 6. Low-Bandwidth User Features

### 6.1 Overview

Users in areas with limited internet connectivity or on data-restricted plans need alternative ways to access MindMate AI. This section specifies text-only mode and compressed audio features.

### 6.2 Text-Only Mode

#### Activation Methods
- User preference in settings
- Automatic detection of slow connection (< 500kbps)
- Manual toggle in navigation
- URL parameter: `?mode=text-only`

#### Text-Only Mode Features

| Feature | Full Mode | Text-Only Mode |
|---------|-----------|----------------|
| Profile Images | Full resolution | Initials avatar only |
| Therapist Photos | Full resolution | Text name + credentials |
| Mood Charts | Interactive SVG | ASCII/Unicode charts |
| Educational Videos | Video player | Transcript + summary |
| Guided Meditations | Audio + visuals | Text instructions |
| Session Video | Full video | Chat transcript |
| Animations | Full CSS/JS | Static states |
| Icons | SVG icons | Unicode/text equivalents |

#### Text-Only Mode Implementation
```javascript
// Network detection
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

if (connection) {
  connection.addEventListener('change', () => {
    if (connection.effectiveType === '2g' || connection.downlink < 0.5) {
      enableTextOnlyMode();
    }
  });
}

// Text-only mode component
const TextOnlyMoodChart = ({ data }) => (
  <pre className="ascii-chart">
    {generateASCIIChart(data)}
  </pre>
);

// Example ASCII chart output:
// Mood Over 7 Days
// Mon: ████████░░ 8/10
// Tue: ███████░░░ 7/10
// Wed: █████████░ 9/10
// Thu: ██████░░░░ 6/10
// Fri: ██████████ 10/10
```

#### Data Usage Comparison

| Feature | Full Mode | Text-Only Mode | Savings |
|---------|-----------|----------------|---------|
| Homepage Load | 2.5 MB | 150 KB | 94% |
| Session (30 min) | 45 MB (video) | 50 KB (chat) | 99.9% |
| Daily Check-in | 500 KB | 25 KB | 95% |
| Weekly Report | 1.2 MB | 80 KB | 93% |

### 6.3 Compressed Audio Mode

#### Audio Compression Settings

| Quality Level | Bitrate | Format | Use Case |
|---------------|---------|--------|----------|
| Standard | 128 kbps | AAC | Default (WiFi) |
| Compressed | 64 kbps | AAC | Mobile data |
| Low | 32 kbps | Opus | Poor connection |
| Minimal | 16 kbps | Opus | Emergency/text-to-speech |

#### Implementation
```javascript
// Audio quality selection
const AUDIO_QUALITY = {
  standard: { bitrate: 128, format: 'aac', bandwidth: 'high' },
  compressed: { bitrate: 64, format: 'aac', bandwidth: 'medium' },
  low: { bitrate: 32, format: 'opus', bandwidth: 'low' },
  minimal: { bitrate: 16, format: 'opus', bandwidth: 'minimal' }
};

// Adaptive streaming
function getOptimalAudioQuality() {
  const connection = navigator.connection;
  
  if (!connection) return AUDIO_QUALITY.standard;
  
  if (connection.effectiveType === '4g' && connection.downlink > 2) {
    return AUDIO_QUALITY.standard;
  } else if (connection.effectiveType === '3g') {
    return AUDIO_QUALITY.compressed;
  } else {
    return AUDIO_QUALITY.low;
  }
}
```

#### Offline Audio Support
- Download meditations for offline playback
- Compressed audio caching (max 100MB)
- Progressive download for longer sessions
- Automatic quality adjustment based on storage

### 6.4 Progressive Loading Strategy

```
Loading Priority:

Priority 1 (Immediate):
├── Critical CSS (inline)
├── Text content
├── Navigation
└── Form labels

Priority 2 (Within 2 seconds):
├── Main content images (compressed)
├── Secondary CSS
├── JavaScript (async)
└── Icons

Priority 3 (Lazy load):
├── Below-fold images
├── Videos
├── Charts/Graphs
└── Non-critical animations

Priority 4 (On demand):
├── Full-resolution images
├── Downloadable resources
├── Optional features
└── Analytics
```

### 6.5 Data Saver Integration

```jsx
<DataSaverSettings>
  <Toggle 
    label="Data Saver Mode"
    description="Reduces data usage by up to 90%"
  />
  
  <Select
    label="Image Quality"
    options={[
      { value: 'auto', label: 'Auto-detect' },
      { value: 'high', label: 'High (WiFi only)' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
      { value: 'none', label: 'No images' }
    ]}
  />
  
  <Select
    label="Audio Quality"
    options={[
      { value: 'auto', label: 'Auto-detect' },
      { value: 'standard', label: 'Standard (128 kbps)' },
      { value: 'compressed', label: 'Compressed (64 kbps)' },
      { value: 'low', label: 'Low (32 kbps)' }
    ]}
  />
  
  <InfoBox>
    Estimated data usage this month: 45 MB
    (Without Data Saver: ~450 MB)
  </InfoBox>
</DataSaverSettings>
```

---

## 7. Elderly User Design

### 7.1 Overview

Designing for elderly users (65+) requires special consideration for age-related changes in vision, hearing, motor control, and cognition. These features benefit all users while being essential for older adults.

### 7.2 Simplified Interface Option

#### Simplified Mode Features

| Feature | Standard Mode | Simplified Mode |
|---------|---------------|-----------------|
| Navigation | 5-7 items | 3-4 core items |
| Home Screen | Dashboard + widgets | Large action buttons only |
| Settings | 20+ options | 8 essential options |
| Onboarding | 5 steps | 2-3 steps |
| Notifications | All types | Critical only |
| Visual Elements | Rich graphics | Clean, minimal |
| Terminology | Standard | Plain language |

#### Simplified Navigation Structure
```
Simplified Mode Navigation:

┌─────────────────────────────────────┐
│  [Home]  [Talk]  [Track]  [Help]   │
└─────────────────────────────────────┘

Home Screen:
┌─────────────────────────────────────┐
│                                     │
│   [  Talk to Someone  ]            │
│        (Large Button)               │
│                                     │
│   [  How Are You Today?  ]         │
│        (Mood Check-in)              │
│                                     │
│   [  View Your Progress  ]         │
│        (Reports)                    │
│                                     │
│   [  Get Help Now  ]               │
│        (Emergency - Red)            │
│                                     │
└─────────────────────────────────────┘
```

#### Cognitive Load Reduction
- **One task per screen**: No multi-step forms on single page
- **Clear progress indicators**: "Step 1 of 3" for all multi-step processes
- **Confirmation dialogs**: For all destructive or important actions
- **Undo functionality**: Available for 30 seconds after action
- **Auto-save**: All forms auto-save every 10 seconds
- **Plain language**: 6th-8th grade reading level (Flesch-Kincaid)

### 7.3 Larger Tap Targets

#### Touch Target Specifications

| Element | Standard Size | Elderly-Optimized | WCAG Minimum |
|---------|---------------|-------------------|--------------|
| Primary Buttons | 44x44 px | 60x60 px | 44x44 px |
| Secondary Buttons | 44x44 px | 52x52 px | 44x44 px |
| Form Inputs | 44px height | 56px height | 44px |
| Checkboxes/Radio | 24x24 px | 32x32 px | 24x24 px |
| Navigation Items | 44px height | 56px height | 44px |
| List Items | 44px height | 60px height | 44px |
| Icon Buttons | 40x40 px | 48x48 px | 44x44 px |

#### Spacing Requirements
- **Minimum spacing between targets**: 16px
- **Recommended spacing**: 20px for elderly users
- **Touch target padding**: 8px minimum beyond visual element

```css
/* Elderly-optimized touch targets */
.elderly-mode .btn-primary {
  min-width: 60px;
  min-height: 60px;
  padding: 16px 24px;
  font-size: 18px;
  border-radius: 12px;
}

.elderly-mode .form-input {
  min-height: 56px;
  padding: 16px;
  font-size: 18px;
}

.elderly-mode .touch-spacer {
  min-height: 20px;
}
```

#### Touch Target Implementation
```jsx
// Touch-friendly button component
<AccessibleButton
  size="elderly" // or "standard"
  onPress={handlePress}
  onPressIn={showVisualFeedback}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  accessibilityLabel="Book appointment"
  accessibilityHint="Double-tap to schedule"
>
  Book Appointment
</AccessibleButton>
```

### 7.4 Visual Design for Elderly Users

#### Typography
| Element | Standard | Elderly Mode |
|---------|----------|--------------|
| Body Text | 16px | 20px (minimum) |
| Headings | 24-32px | 28-40px |
| Button Text | 16px | 20px |
| Labels | 14px | 18px |
| Line Height | 1.5 | 1.6 |
| Letter Spacing | normal | 0.5px |

#### Color Contrast
- **Minimum contrast**: 7:1 (exceeds WCAG AAA)
- **Preferred contrast**: 10:1 for critical text
- **Avoid**: Blue text on dark backgrounds (cataracts)
- **Preferred**: Black text on white or cream backgrounds

#### Visual Cues
- **Button states**: Clear color change + shadow change
- **Loading states**: Progress bar (not just spinner)
- **Errors**: Red border + icon + text explanation
- **Success**: Green checkmark + confirmation message

### 7.5 Interaction Design

#### Gesture Alternatives
| Gesture | Alternative for Elderly Users |
|---------|------------------------------|
| Swipe | Arrow buttons or tap |
| Pinch to zoom | +/- buttons or double-tap |
| Long press | Context menu button |
| Pull to refresh | Refresh button |
| Two-finger scroll | Scroll buttons |

#### Feedback Requirements
- **Immediate visual feedback**: Within 100ms of touch
- **Haptic feedback**: Optional, for important actions
- **Audio feedback**: Optional, for confirmations
- **Persistent confirmation**: Toast/snackbar stays 5+ seconds

### 7.6 Elderly Mode Settings

```jsx
<ElderlyModeSettings>
  <Toggle 
    label="Simplified Interface"
    description="Shows only essential features with larger buttons"
  />
  
  <Toggle 
    label="Extra Large Text"
    description="Increases text size throughout the app"
  />
  
  <Toggle 
    label="High Contrast"
    description="Maximum contrast for better visibility"
  />
  
  <Toggle 
    label="Enhanced Touch Targets"
    description="Larger buttons and spacing"
  />
  
  <Toggle 
    label="Extended Timeouts"
    description="More time for reading and responding"
  />
  
  <Toggle 
    label="Voice Guidance"
    description="Reads important information aloud"
  />
  
  <Select
    label="Reading Speed"
    options={[
      { value: 'slow', label: 'Slow (more time)' },
      { value: 'normal', label: 'Normal' },
      { value: 'fast', label: 'Fast' }
    ]}
  />
</ElderlyModeSettings>
```

---

## 8. Multilingual Support Priorities

### 8.1 Overview

MindMate AI aims to provide mental health support globally. Language selection prioritizes:
1. Number of native speakers
2. Mental health service gaps
3. Cultural stigma around mental health
4. Economic accessibility
5. Regulatory requirements

### 8.2 Priority Languages (Phase 1)

#### Tier 1: Critical Priority (Launch)

| Rank | Language | Native Speakers | Justification |
|------|----------|-----------------|---------------|
| 1 | **English** | 380M | Global standard, primary development language |
| 2 | **Spanish** | 485M | Largest underserved population in US; high stigma |
| 3 | **Mandarin Chinese** | 920M | Largest speaker base; growing mental health awareness |
| 4 | **Hindi** | 345M | Major service gap in India; 50+ derogatory terms for mental illness |
| 5 | **Arabic** | 310M | 26 countries; severe resource scarcity; cultural barriers |

#### Tier 2: High Priority (6 months post-launch)

| Rank | Language | Native Speakers | Justification |
|------|----------|-----------------|---------------|
| 6 | **Bengali** | 230M | Bangladesh/India; mental health rarely discussed |
| 7 | **Portuguese** | 220M | Brazil has high demand; European Portuguese variant needed |
| 8 | **French** | 80M | Canada requirement; France recently funded mental healthcare |
| 9 | **Japanese** | 125M | High suicide rate; workplace mental health crisis |
| 10 | **Korean** | 80M | High stress society; growing acceptance of mental health support |

### 8.3 Language Selection Rationale

#### Spanish (Priority #2)
- **Population**: 41 million US Spanish speakers
- **Gap**: Only 5.6% of US mental health facilities offer Spanish services
- **Stigma**: "La ropa sucia se lava en casa" (dirty laundry washed at home)
- **Opportunity**: Largest underserved mental health population in North America

#### Mandarin Chinese (Priority #3)
- **Population**: 920 million native speakers
- **Context**: Mental health historically taboo; recent 2013 Mental Health Law
- **Growth**: Rapidly increasing mental health awareness
- **Challenge**: Simplified vs. Traditional characters (support both)

#### Hindi (Priority #4)
- **Population**: 345 million native speakers
- **Gap**: "Mental health" and "depression" not in most Indian languages
- **Stigma**: 50+ derogatory terms; viewed as untrustworthy/incompetent
- **Opportunity**: Culturally sensitive education desperately needed

#### Arabic (Priority #5)
- **Population**: 310 million across 26 countries
- **Gap**: Very limited mental health resources
- **Stigma**: Source of fear, embarrassment, disgrace for families
- **Challenge**: Right-to-left (RTL) UI required

### 8.4 Localization Requirements

#### Cultural Adaptation
| Element | Adaptation Required |
|---------|---------------------|
| Mental Health Terms | Culturally appropriate translations |
| Examples/Scenarios | Localized to cultural context |
| Therapist Matching | Preference for same-cultural-background |
| Religious Content | Optional faith-based resources |
| Family Dynamics | Respect for collectivist cultures |
| Crisis Resources | Local emergency numbers |

#### Technical Implementation
```javascript
// i18n configuration
const i18nConfig = {
  locales: ['en', 'es', 'zh', 'hi', 'ar', 'bn', 'pt', 'fr', 'ja', 'ko'],
  defaultLocale: 'en',
  
  // RTL support
  rtlLocales: ['ar', 'ur', 'fa'],
  
  // Date/time formatting
  dateFormats: {
    en: 'MM/DD/YYYY',
    es: 'DD/MM/YYYY',
    zh: 'YYYY-MM-DD',
    // ... etc
  },
  
  // Number formatting
  numberFormats: {
    en: { decimal: '.', thousands: ',' },
    es: { decimal: ',', thousands: '.' },
    // ... etc
  }
};
```

### 8.5 Translation Quality Standards

| Content Type | Translation Method | Review Process |
|--------------|-------------------|----------------|
| UI Text | Professional translators | Native speaker review |
| Therapeutic Content | Mental health professionals | Cultural consultant review |
| Crisis Resources | Certified translators | Local mental health org validation |
| Educational Content | Subject matter experts | Native speaker + expert review |
| User-Generated Content | AI translation + warning | Community moderation |

### 8.6 Phase 2+ Language Roadmap

#### Phase 2 (12-18 months)
- German (Germany, Austria, Switzerland)
- Russian (Russia, Eastern Europe)
- Indonesian (Southeast Asia)
- Turkish (Turkey, Central Asia)
- Vietnamese (US + Vietnam)

#### Phase 3 (18-24 months)
- Italian
- Polish
- Ukrainian
- Thai
- Tagalog (Philippines)

---

## 9. Implementation Checklist

### 9.1 Screen Reader Support
- [ ] Semantic HTML structure implemented
- [ ] ARIA labels on all interactive elements
- [ ] Focus management system
- [ ] Skip navigation links
- [ ] Alt text for all images
- [ ] Live regions for dynamic content
- [ ] Tested with NVDA, JAWS, VoiceOver, TalkBack

### 9.2 Font Size Controls
- [ ] 4 font size levels implemented
- [ ] System font size integration
- [ ] Line length constraints (75ch max)
- [ ] Responsive behavior at all sizes
- [ ] No horizontal scroll at 200% zoom

### 9.3 High Contrast Mode
- [ ] 3 high contrast themes
- [ ] System preference detection
- [ ] 7:1 contrast ratio minimum
- [ ] Visible borders on all elements
- [ ] Pattern alternatives for charts

### 9.4 Closed Captions
- [ ] WebVTT caption support
- [ ] Live captioning integration
- [ ] User caption controls
- [ ] 99% accuracy for prerecorded
- [ ] 95% accuracy for live
- [ ] Post-session transcript access

### 9.5 Color-Blind Safe Palette
- [ ] 6-color accessible palette
- [ ] Pattern/texture alternatives
- [ ] Icon + color combinations
- [ ] Grayscale test passed
- [ ] Color blind simulation tested

### 9.6 Low-Bandwidth Features
- [ ] Text-only mode toggle
- [ ] Automatic network detection
- [ ] Compressed audio (16-128 kbps)
- [ ] Offline content support
- [ ] Data usage tracking

### 9.7 Elderly User Features
- [ ] Simplified mode toggle
- [ ] 60px minimum touch targets
- [ ] 20px body text option
- [ ] 7:1 contrast ratio
- [ ] Gesture alternatives
- [ ] Extended timeout options

### 9.8 Multilingual Support
- [ ] 10 priority languages
- [ ] RTL support (Arabic)
- [ ] Cultural adaptation process
- [ ] Professional translation workflow
- [ ] Local crisis resources

---

## 10. Testing & Validation

### 10.1 Automated Testing Tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| axe DevTools | WCAG compliance | CI/CD pipeline |
| Lighthouse | Accessibility audit | Pre-deployment |
| WAVE | Visual accessibility check | Manual testing |
| Pa11y | Automated accessibility testing | CI/CD pipeline |
| Color Contrast Analyzer | Contrast verification | Design review |

### 10.2 Manual Testing Protocol

#### Screen Reader Testing
1. Navigate entire app using only keyboard
2. Complete core tasks (check-in, book session, view progress)
3. Verify all information is announced correctly
4. Test with at least 2 different screen readers

#### Color Blindness Testing
1. Test with Color Oracle (all 3 types)
2. Verify grayscale usability
3. Check pattern/icon alternatives
4. Validate no color-only information

#### Elderly User Testing
1. Recruit participants aged 65-85
2. Test with varying tech experience
3. Measure task completion times
4. Collect qualitative feedback
5. Iterate based on findings

### 10.3 User Testing Recruitment

| User Group | Minimum Participants | Testing Focus |
|------------|---------------------|---------------|
| Screen Reader Users | 5 | Navigation, content access |
| Low Vision Users | 5 | Contrast, font size, zoom |
| Color Blind Users | 3 | Color independence |
| Deaf/HoH Users | 5 | Caption quality, alternatives |
| Elderly Users (65+) | 8 | Simplified mode, touch targets |
| Low Bandwidth Users | 3 | Text-only mode, performance |
| Non-English Speakers | 5 per language | Localization quality |

### 10.4 Compliance Validation

#### WCAG 2.1 Level AA Checklist
- [ ] 1.1.1 Non-text Content
- [ ] 1.2.2 Captions (Prerecorded)
- [ ] 1.2.4 Captions (Live)
- [ ] 1.3.1 Info and Relationships
- [ ] 1.4.3 Contrast (Minimum)
- [ ] 1.4.4 Resize Text
- [ ] 1.4.10 Reflow
- [ ] 2.1.1 Keyboard
- [ ] 2.4.3 Focus Order
- [ ] 2.4.7 Focus Visible
- [ ] 2.5.5 Target Size
- [ ] 3.3.1 Error Identification
- [ ] 3.3.2 Labels or Instructions
- [ ] 4.1.2 Name, Role, Value

#### Legal Compliance
- [ ] HHS Section 504 (May 2024 update)
- [ ] ADA Title II (DOJ Rule)
- [ ] FCC Captioning Requirements (September 2024)
- [ ] State-level accessibility laws (CA, NY, etc.)

---

## Appendix A: Resources

### Accessibility Guidelines
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Section 508](https://www.section508.gov/)
- [ADA.gov](https://www.ada.gov/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [WAVE](https://wave.webaim.org/)
- [Color Oracle](https://colororacle.org/)

### Design Resources
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| ARIA | Accessible Rich Internet Applications |
| CART | Communication Access Realtime Translation |
| CVAA | 21st Century Communications and Video Accessibility Act |
| HHS | U.S. Department of Health and Human Services |
| HoH | Hard of Hearing |
| RTL | Right-to-Left (text direction) |
| VPAT | Voluntary Product Accessibility Template |
| WCAG | Web Content Accessibility Guidelines |

---

*Document Version: 1.0*  
*Next Review Date: April 2025*  
*Owner: Accessibility & Inclusion Team*  
*Approved by: Product, Engineering, Legal*
