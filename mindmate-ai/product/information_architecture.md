# MindMate AI - Information Architecture

## Complete App Structure Blueprint
**Version:** 1.0  
**Last Updated:** 2024  
**Platform:** Mobile-First (iOS/Android) + Web Responsive

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User States & Contexts](#2-user-states--contexts)
3. [Global Navigation Structure](#3-global-navigation-structure)
4. [Complete Sitemap](#4-complete-sitemap)
5. [Screen Inventory by Category](#5-screen-inventory-by-category)
6. [User Flows](#6-user-flows)
7. [Modal & Overlay System](#7-modal--overlay-system)
8. [Component Library Mapping](#8-component-library-mapping)
9. [State Management Matrix](#9-state-management-matrix)
10. [Accessibility & UX Considerations](#10-accessibility--ux-considerations)

---

## 1. Executive Summary

### App Overview
MindMate AI is a comprehensive mental wellness companion that combines AI-powered conversations, mood tracking, guided exercises, crisis support, and personalized insights to support users' mental health journey.

### Architecture Principles
- **Mobile-First Design:** All screens designed for 375px base width
- **Progressive Disclosure:** Complex features revealed gradually
- **Crisis-First Accessibility:** Emergency support always one tap away
- **Contextual Navigation:** Navigation adapts to user state and needs
- **Seamless Cross-Platform:** Consistent experience across mobile and web

---

## 2. User States & Contexts

### 2.1 Primary User States

| State | Description | Available Features |
|-------|-------------|-------------------|
| **Logged Out** | Anonymous visitor | Landing, Auth, Crisis Support (limited) |
| **Onboarding** | New user completing setup | Welcome flow, Assessment, Preferences |
| **Active Free** | Logged in, free tier | Core chat, Basic tracking, Limited exercises |
| **Active Premium** | Subscribed user | Full feature access |
| **Active Session** | Currently in chat/exercise | Session controls, Quick actions |
| **Crisis State** | User indicates distress | Immediate support, Safety resources |
| **Offline** | No network connection | Cached content, Offline mode |

### 2.2 Contextual States

| Context | Trigger | UI Adaptation |
|---------|---------|---------------|
| **First Launch** | App first opened | Full onboarding sequence |
| **Return Visit** | Subsequent opens | Quick start, Resume where left off |
| **Morning Check-in** | 6-10 AM | Morning mood prompt, Daily intention |
| **Evening Wind-down** | 8 PM-12 AM | Sleep prep, Evening reflection |
| **Session Active** | Chat/Exercise in progress | Persistent session bar, quick return |
| **Notification Deep-link** | Push notification tap | Contextual landing screen |

---

## 3. Global Navigation Structure

### 3.1 Mobile Navigation (Bottom Tab Bar)

```
┌─────────────────────────────────────────┐
│  [Home]  [Chat]  [Tools]  [Insights]  [Profile]  │
│   🏠      💬      🧰       📊         👤      │
└─────────────────────────────────────────┘
```

**Tab Details:**

| Tab | Icon | Primary Purpose | Badge Support |
|-----|------|-----------------|---------------|
| **Home** | 🏠 House | Daily dashboard, quick actions, reminders | Notification dot |
| **Chat** | 💬 Bubble | AI conversation, message history | Unread count |
| **Tools** | 🧰 Toolbox | Exercises, techniques, resources | New content dot |
| **Insights** | 📊 Chart | Analytics, patterns, progress | Weekly summary |
| **Profile** | 👤 Person | Settings, account, preferences | - |

### 3.2 Web Navigation (Side Navigation + Top Bar)

**Desktop (>1024px):**
```
┌────────────────────────────────────────────────────────────┐
│  🧠 MindMate AI    [Search]    [Notifications]  [Profile]  │
├──────┬─────────────────────────────────────────────────────┤
│      │                                                     │
│ Home │              MAIN CONTENT AREA                      │
│ Chat │                                                     │
│ Tools│                                                     │
│Insig │                                                     │
│Profil│                                                     │
│      │                                                     │
├──────┴─────────────────────────────────────────────────────┤
│  [Crisis Support - Always Visible]                         │
└────────────────────────────────────────────────────────────┘
```

**Tablet (768-1024px):**
- Collapsible side nav with icons + labels
- Top bar with essential actions

### 3.3 Navigation Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Bottom Tabs** | Primary app sections | Persistent on main screens |
| **Side Drawer** | Secondary actions, settings | Swipe or hamburger menu |
| **Top Navigation** | Contextual actions within screens | Screen-specific toolbar |
| **Floating Action Button (FAB)** | Primary action on screen | Chat start, Quick check-in |
| **Breadcrumbs** | Deep navigation (web only) | Hierarchical path display |
| **Back Button** | Return to previous screen | System back / App back |

---

## 4. Complete Sitemap

### 4.1 Hierarchical Structure

```
MINDMATE AI
│
├── 🌐 PUBLIC (Logged Out)
│   ├── Landing Page
│   ├── About MindMate
│   ├── Features Overview
│   ├── Pricing Plans
│   ├── Crisis Resources (Public)
│   ├── Privacy Policy
│   ├── Terms of Service
│   └── Support / Help Center
│
├── 🔐 AUTHENTICATION
│   ├── Login
│   ├── Sign Up
│   ├── Forgot Password
│   ├── Reset Password
│   ├── Email Verification
│   ├── Social Auth (Google, Apple)
│   └── Biometric Setup (post-login)
│
├── 🚀 ONBOARDING
│   ├── Welcome Sequence
│   ├── User Profile Setup
│   ├── Wellness Assessment
│   ├── Goal Setting
│   ├── Preference Configuration
│   ├── Notification Permissions
│   └── Onboarding Complete
│
├── 🏠 HOME (Dashboard)
│   ├── Daily Dashboard
│   ├── Morning Check-in
│   ├── Evening Wind-down
│   ├── Quick Actions Grid
│   ├── Daily Quote/Insight
│   ├── Upcoming Reminders
│   └── Recent Activity
│
├── 💬 CHAT
│   ├── Chat Home
│   ├── Active Conversation
│   ├── Chat History
│   ├── Session Summary
│   ├── Chat Settings
│   └── AI Personality Selector
│
├── 🧰 TOOLS & EXERCISES
│   ├── Tools Library
│   ├── Categories Browse
│   ├── Favorites
│   ├── Recently Used
│   ├── Exercise Player
│   ├── Breathing Exercise
│   ├── Meditation Guide
│   ├── Grounding Techniques
│   ├── CBT Worksheets
│   ├── Journaling Prompts
│   ├── Mood Boosters
│   └── Sleep Stories
│
├── 📊 INSIGHTS
│   ├── Insights Dashboard
│   ├── Mood Tracker
│   ├── Mood Calendar
│   ├── Mood Patterns
│   ├── Progress Reports
│   ├── Weekly Summary
│   ├── Monthly Review
│   ├── Achievement Gallery
│   ├── Streak Tracker
│   └── Export Data
│
├── 👤 PROFILE & SETTINGS
│   ├── Profile Overview
│   ├── Edit Profile
│   ├── Account Settings
│   ├── Subscription Management
│   ├── Notification Settings
│   ├── Privacy Settings
│   ├── Data Export/Delete
│   ├── App Settings
│   ├── Theme Settings
│   ├── Language Settings
│   ├── Accessibility Settings
│   ├── Help & Support
│   ├── Feedback
│   └── About
│
├── 🆘 CRISIS SUPPORT
│   ├── Crisis Home
│   ├── Immediate Help
│   ├── Crisis Resources
│   ├── Emergency Contacts
│   ├── Safety Planning
│   ├── Coping Strategies
│   └── Post-Crisis Support
│
└── 🔔 NOTIFICATIONS
    ├── Notification Center
    ├── Notification Settings
    └── Push History
```

---

## 5. Screen Inventory by Category

### 5.1 PUBLIC SCREENS (Logged Out)

#### 5.1.1 Landing Page
**Route:** `/`  
**Purpose:** Convert visitors to users  
**Components:**
- Hero section with value proposition
- Feature highlights (3-4 key features)
- Social proof (testimonials, user count)
- Pricing teaser
- Primary CTA (Get Started)
- Secondary CTA (Learn More)
- Trust indicators (security badges)
- Footer with links

**States:**
- Default: Full landing experience
- Loading: Skeleton loader
- Error: Connection error message

---

#### 5.1.2 About MindMate
**Route:** `/about`  
**Purpose:** Build trust and explain mission  
**Components:**
- Mission statement
- Team section
- Science/Research backing
- Press mentions
- Partner organizations
- Contact information

---

#### 5.1.3 Features Overview
**Route:** `/features`  
**Purpose:** Showcase all app capabilities  
**Components:**
- Feature grid with icons
- Interactive demos (if possible)
- Comparison table (Free vs Premium)
- Use case scenarios
- Screenshots/GIFs

---

#### 5.1.4 Pricing Plans
**Route:** `/pricing`  
**Purpose:** Convert to paid subscription  
**Components:**
- Plan comparison cards
- Monthly/Annual toggle
- Feature checklist per plan
- FAQ accordion
- Payment security badges
- CTA buttons per plan
- Money-back guarantee notice

**Plans:**
- Free: Basic chat, limited exercises
- Premium: Unlimited chat, all exercises, insights
- Premium Plus: + Human coaching sessions

---

#### 5.1.5 Crisis Resources (Public)
**Route:** `/crisis-resources`  
**Purpose:** Provide immediate help to anyone  
**Components:**
- Emergency hotlines (country-specific)
- Crisis text lines
- Immediate safety information
- Disclaimer
- Link to full app

---

#### 5.1.6 Support / Help Center
**Route:** `/support`  
**Purpose:** Self-service support  
**Components:**
- Search bar
- FAQ categories
- Popular articles
- Contact support button
- Video tutorials section

---

### 5.2 AUTHENTICATION SCREENS

#### 5.2.1 Login
**Route:** `/login`  
**Purpose:** Authenticate existing users  
**Components:**
- Email input field
- Password input field (with visibility toggle)
- "Remember me" checkbox
- Login button
- "Forgot password?" link
- Social login buttons (Google, Apple)
- "Don't have an account? Sign up" link
- Biometric prompt (if enabled)

**States:**
- Default: Empty form
- Loading: Button spinner
- Error: Invalid credentials message
- Success: Redirect to home

---

#### 5.2.2 Sign Up
**Route:** `/signup`  
**Purpose:** Create new user account  
**Components:**
- Email input with validation
- Password input with strength indicator
- Confirm password field
- Terms acceptance checkbox
- Privacy policy link
- Sign up button
- Social sign up buttons
- "Already have an account? Login" link

**Validation:**
- Email format validation
- Password: 8+ chars, 1 uppercase, 1 number, 1 special
- Password match confirmation

---

#### 5.2.3 Forgot Password
**Route:** `/forgot-password`  
**Purpose:** Initiate password reset  
**Components:**
- Email input field
- Submit button
- Success message (email sent)
- Back to login link

---

#### 5.2.4 Reset Password
**Route:** `/reset-password?token={token}`  
**Purpose:** Set new password  
**Components:**
- New password field
- Confirm password field
- Submit button
- Password requirements list
- Success message
- Login redirect

---

#### 5.2.5 Email Verification
**Route:** `/verify-email?token={token}`  
**Purpose:** Confirm email address  
**Components:**
- Verification status message
- Resend email button
- Continue to app button
- Email preview illustration

---

### 5.3 ONBOARDING SCREENS

#### 5.3.1 Welcome Sequence
**Route:** `/onboarding/welcome`  
**Purpose:** Introduce app and build excitement  
**Components:**
- Animated logo reveal
- Welcome message
- Value proposition slides (3-5)
- Swipe/scroll indicators
- "Get Started" button
- Skip option

**Slides:**
1. Welcome to MindMate AI
2. Your personal wellness companion
3. Available 24/7, judgment-free
4. Evidence-based techniques
5. Your journey starts here

---

#### 5.3.2 User Profile Setup
**Route:** `/onboarding/profile`  
**Purpose:** Collect basic user information  
**Components:**
- Name input
- Preferred name/nickname
- Profile photo upload (optional)
- Age range selector
- Pronouns selector
- Location (for resources)
- Progress indicator

---

#### 5.3.3 Wellness Assessment
**Route:** `/onboarding/assessment`  
**Purpose:** Understand user's current state  
**Components:**
- Progress bar (X of Y questions)
- Question card with context
- Response options (scale, multiple choice, text)
- Skip button
- "Why we ask" info tooltip
- Back button

**Assessment Areas:**
1. Current mood baseline
2. Stress level
3. Sleep quality
4. Support system
5. Previous therapy experience
6. Primary concerns/goals
7. Preferred support style

---

#### 5.3.4 Goal Setting
**Route:** `/onboarding/goals`  
**Purpose:** Define what user wants to achieve  
**Components:**
- Goal categories (chips)
- Custom goal input
- Priority ranking
- Timeline selector
- Goal preview card

**Predefined Goals:**
- Reduce anxiety
- Improve sleep
- Build resilience
- Manage stress
- Increase happiness
- Process emotions
- Develop coping skills

---

#### 5.3.5 Preference Configuration
**Route:** `/onboarding/preferences`  
**Purpose:** Personalize the experience  
**Components:**
- AI personality selector (compassionate, direct, gentle, motivational)
- Chat style preference
- Notification frequency
- Preferred check-in times
- Content interests
- Exercise duration preference

---

#### 5.3.6 Notification Permissions
**Route:** `/onboarding/notifications`  
**Purpose:** Set up engagement channels  
**Components:**
- Permission request explanation
- iOS/Android permission prompt
- Notification type toggles
- Time preference selectors
- Sample notification preview

---

#### 5.3.7 Onboarding Complete
**Route:** `/onboarding/complete`  
**Purpose:** Celebrate and transition to app  
**Components:**
- Celebration animation
- Summary of setup
- Quick start suggestions
- "Start Your Journey" button
- Optional: Share achievement

---

### 5.4 HOME SCREENS (Dashboard)

#### 5.4.1 Daily Dashboard
**Route:** `/home` (Default logged-in landing)  
**Purpose:** Central hub for daily wellness activities  
**Components:**
- Greeting with user's name
- Current date display
- Mood check-in prompt/card
- Daily quote/insight card
- Quick actions grid (4-6 actions)
- Today's schedule/reminders
- Recent chat summary
- Streak indicator
- Daily challenge/suggestion
- Weather/mood correlation (optional)

**Quick Actions:**
- Start Chat
- Log Mood
- Breathing Exercise
- Journal Entry
- Emergency Support
- View Insights

**States:**
- Morning: Check-in focus
- Afternoon: Activity suggestions
- Evening: Wind-down prompts
- Post-session: Summary card

---

#### 5.4.2 Morning Check-in
**Route:** `/home/morning-checkin`  
**Purpose:** Start the day with intention  
**Components:**
- Good morning greeting
- Sleep quality slider
- Mood selector
- Energy level indicator
- Daily intention input
- Today's priorities
- Quick exercise suggestion

---

#### 5.4.3 Evening Wind-down
**Route:** `/home/evening-winddown`  
**Purpose:** Reflect and prepare for rest  
**Components:**
- Evening greeting
- Day reflection prompts
- Mood check
- Gratitude input
- Tomorrow preview
- Sleep story/exercise suggestion
- Do-not-disturb toggle

---

### 5.5 CHAT SCREENS

#### 5.5.1 Chat Home
**Route:** `/chat`  
**Purpose:** Entry point to all conversations  
**Components:**
- New chat button (FAB)
- Recent conversations list
- Conversation preview cards
- Search conversations
- Filter options (date, topic)
- Empty state illustration
- Suggested conversation starters

**Conversation Card:**
- Preview of last message
- Timestamp
- Unread indicator
- Topic/category tag
- Mood indicator

---

#### 5.5.2 Active Conversation
**Route:** `/chat/session/{sessionId}`  
**Purpose:** Main chat interface with AI  
**Components:**
- Header: AI avatar, name, status indicator
- Message bubble list (user + AI)
- Typing indicator
- Text input field
- Send button
- Attachment/media button
- Quick reply suggestions
- Exercise suggestion cards (inline)
- Mood check prompt (inline)
- Session controls (pause, end, settings)
- Scroll to bottom button
- Timestamp group headers

**Message Types:**
- Text message
- Image message
- Audio message
- Exercise card
- Resource link card
- Mood check card
- Session summary card

**States:**
- Active: Real-time messaging
- AI Typing: Loading indicator
- Paused: Session on hold
- Ended: Summary view
- Error: Connection issue

---

#### 5.5.3 Chat History
**Route:** `/chat/history`  
**Purpose:** Browse past conversations  
**Components:**
- Calendar/date filter
- Search bar
- Conversation list with summaries
- Export option
- Delete/archive actions
- Favorite/star conversations

---

#### 5.5.4 Session Summary
**Route:** `/chat/session/{sessionId}/summary`  
**Purpose:** Review key takeaways from chat  
**Components:**
- Session metadata (date, duration)
- Key themes/topics
- Insights/exercises suggested
- Mood before/after
- Action items
- Save/bookmark option
- Share (optional)
- Start follow-up button

---

#### 5.5.5 Chat Settings
**Route:** `/chat/settings`  
**Purpose:** Customize chat experience  
**Components:**
- AI personality selector
- Response length preference
- Notification settings for chat
- Auto-save settings
- Data retention settings

---

### 5.6 TOOLS & EXERCISES SCREENS

#### 5.6.1 Tools Library
**Route:** `/tools`  
**Purpose:** Browse all available exercises  
**Components:**
- Search bar
- Category tabs/chips
- Featured exercises carousel
- Recently used section
- Favorites section
- New additions section
- Duration filter
- Difficulty filter

**Categories:**
- Breathing
- Meditation
- Grounding
- CBT Techniques
- Journaling
- Sleep
- Anxiety Relief
- Mood Boosters
- Crisis Coping

---

#### 5.6.2 Exercise Player
**Route:** `/tools/exercise/{exerciseId}`  
**Purpose:** Guided exercise experience  
**Components:**
- Exercise title and description
- Duration indicator
- Progress bar/timer
- Audio player controls
- Visual guide/animation
- Text instructions
- Pause/resume button
- Skip/advance option
- Background sound selector
- Completion celebration

**Exercise Types:**
- Audio-guided (meditation)
- Interactive (breathing bubble)
- Reading (CBT worksheet)
- Writing (journal prompt)
- Visual (grounding 5-4-3-2-1)

---

#### 5.6.3 Breathing Exercise
**Route:** `/tools/breathing/{techniqueId}`  
**Purpose:** Guided breathing patterns  
**Components:**
- Animated breathing circle
- Inhale/hold/exhale indicators
- Timer display
- Pattern selector (4-7-8, box, etc.)
- Repetition counter
- Sound cues toggle
- Vibration toggle
- Background options

**Techniques:**
- 4-7-8 Breathing
- Box Breathing
- Coherent Breathing
- Deep Breathing
- Calm Breathing

---

#### 5.6.4 Meditation Guide
**Route:** `/tools/meditation/{meditationId}`  
**Purpose:** Guided meditation sessions  
**Components:**
- Meditation title/theme
- Duration selector
- Background image/video
- Audio player with progress
- Transcript toggle
- Background sounds mixer
- Bookmark/save button
- Rating after completion

**Categories:**
- Sleep
- Anxiety
- Focus
- Self-compassion
- Body scan
- Loving-kindness

---

#### 5.6.5 Grounding Techniques
**Route:** `/tools/grounding`  
**Purpose:** Present-moment awareness exercises  
**Components:**
- Technique selector
- 5-4-3-2-1 senses exercise
- Physical grounding prompts
- Mental grounding games
- Soothing touch guide
- Interactive checklist

---

#### 5.6.6 CBT Worksheets
**Route:** `/tools/cbt/{worksheetId}`  
**Purpose:** Cognitive behavioral therapy exercises  
**Components:**
- Worksheet title and explanation
- Step-by-step form
- Thought record table
- Cognitive distortion checker
- Reframe suggestions
- Save progress
- Export/share option

**Worksheets:**
- Thought Record
- Worry Time
- Behavioral Activation
- Cognitive Restructuring
- Problem Solving

---

#### 5.6.7 Journaling Prompts
**Route:** `/tools/journal`  
**Purpose:** Guided writing exercises  
**Components:**
- Prompt selector/randomizer
- Writing area with formatting
- Mood tag selector
- Photo attachment option
- Voice-to-text option
- Save as draft
- Previous entries list
- Streak counter

**Prompt Categories:**
- Gratitude
- Reflection
- Goals
- Emotions
- Growth
- Creativity

---

#### 5.6.8 Sleep Stories
**Route:** `/tools/sleep/stories`  
**Purpose:** Bedtime audio content  
**Components:**
- Story library with categories
- Duration filter
- Narrator selector
- Background sounds
- Sleep timer
- Download for offline
- Continue where left off

---

### 5.7 INSIGHTS SCREENS

#### 5.7.1 Insights Dashboard
**Route:** `/insights`  
**Purpose:** Overview of wellness data  
**Components:**
- Date range selector
- Key metrics cards (mood avg, streak, sessions)
- Mood trend chart
- Activity summary
- Pattern highlights
- Achievement badges
- Weekly summary card
- Export data button

---

#### 5.7.2 Mood Tracker
**Route:** `/insights/mood`  
**Purpose:** Log and view mood data  
**Components:**
- Mood selector (emoji scale)
- Intensity slider
- Mood factors/tags
- Notes input
- Photo attachment
- Time stamp
- Save button
- Recent entries list

**Mood Scale:**
- 5: Great 😄
- 4: Good 🙂
- 3: Okay 😐
- 2: Low 😕
- 1: Rough 😢

---

#### 5.7.3 Mood Calendar
**Route:** `/insights/mood/calendar`  
**Purpose:** Visual mood history  
**Components:**
- Monthly calendar view
- Color-coded mood dots
- Day detail popup
- Month/year navigation
- Filter by mood
- Patterns overlay
- Export option

---

#### 5.7.4 Mood Patterns
**Route:** `/insights/mood/patterns`  
**Purpose:** Identify trends and triggers  
**Components:**
- Time of day analysis
- Day of week patterns
- Correlation charts (sleep, exercise, etc.)
- Trigger word cloud
- Insight cards with observations
- Recommendation suggestions

---

#### 5.7.5 Progress Reports
**Route:** `/insights/progress`  
**Purpose:** Long-term progress visualization  
**Components:**
- Time period selector
- Progress charts (line, bar)
- Goal tracking
- Comparison to baseline
- Milestone timeline
- AI-generated insights
- Share progress option

---

#### 5.7.6 Weekly Summary
**Route:** `/insights/weekly`  
**Purpose:** Review week's wellness  
**Components:**
- Week selector
- Mood average and trend
- Chat session count
- Exercises completed
- Journal entries
- Insights discovered
- Next week suggestions
- Share/celebrate button

---

#### 5.7.7 Achievement Gallery
**Route:** `/insights/achievements`  
**Purpose:** Gamification and motivation  
**Components:**
- Achievement grid
- Locked/unlocked states
- Progress indicators
- Category filters
- Share achievement
- Streak display
- Points/level indicator

**Achievement Categories:**
- Consistency (streaks)
- Exploration (try new features)
- Growth (mood improvement)
- Social (share, invite)
- Special (milestones)

---

### 5.8 PROFILE & SETTINGS SCREENS

#### 5.8.1 Profile Overview
**Route:** `/profile`  
**Purpose:** View and manage account  
**Components:**
- Profile header with photo
- Name and member since
- Subscription status badge
- Stats summary (streak, sessions, etc.)
- Quick settings list
- Account actions

---

#### 5.8.2 Edit Profile
**Route:** `/profile/edit`  
**Purpose:** Update personal information  
**Components:**
- Profile photo upload/edit
- Name fields
- Email display (with change option)
- Phone number (optional)
- Bio/about me
- Preferences review
- Save button

---

#### 5.8.3 Account Settings
**Route:** `/profile/account`  
**Purpose:** Manage account security and access  
**Components:**
- Change password
- Two-factor authentication
- Biometric login toggle
- Active sessions list
- Login history
- Account deletion option

---

#### 5.8.4 Subscription Management
**Route:** `/profile/subscription`  
**Purpose:** Manage premium membership  
**Components:**
- Current plan display
- Features included
- Billing cycle info
- Payment method
- Upgrade/downgrade options
- Cancel subscription
- Billing history
- Restore purchases

---

#### 5.8.5 Notification Settings
**Route:** `/profile/notifications`  
**Purpose:** Control all notification preferences  
**Components:**
- Master toggle
- Category toggles:
  - Daily reminders
  - Chat notifications
  - Mood check-ins
  - Weekly summaries
  - New content
  - Tips and insights
  - Special offers
- Quiet hours settings
- Notification preview

---

#### 5.8.6 Privacy Settings
**Route:** `/profile/privacy`  
**Purpose:** Control data and privacy  
**Components:**
- Data sharing preferences
- Analytics opt-in/out
- Personalized content toggle
- Chat history retention
- Profile visibility
- Blocked users (if applicable)

---

#### 5.8.7 Data Export/Delete
**Route:** `/profile/data`  
**Purpose:** GDPR/CCPA compliance  
**Components:**
- Export data button (JSON/PDF)
- Data categories list
- Delete account option
- Data retention info
- Confirmation dialogs
- Contact DPO link

---

#### 5.8.8 App Settings
**Route:** `/profile/app-settings`  
**Purpose:** Customize app behavior  
**Components:**
- Theme (light/dark/system)
- Font size
- Language selector
- Sound effects toggle
- Haptic feedback toggle
- Auto-play media
- Cache management

---

#### 5.8.9 Theme Settings
**Route:** `/profile/theme`  
**Purpose:** Visual customization  
**Components:**
- Theme preview cards
- Color scheme selector
- Accent color picker
- Background options
- Custom theme save

---

#### 5.8.10 Language Settings
**Route:** `/profile/language`  
**Purpose:** Change app language  
**Components:**
- Language list
- Search languages
- Current selection indicator
- Auto-detect option
- Translation quality note

**Supported Languages:**
- English (US/UK)
- Spanish
- French
- German
- Portuguese
- Chinese (Simplified)
- Japanese
- Korean
- Hindi
- Arabic

---

#### 5.8.11 Accessibility Settings
**Route:** `/profile/accessibility`  
**Purpose:** Ensure app is usable by all  
**Components:**
- Screen reader optimizations
- Text size slider
- High contrast mode
- Reduce motion toggle
- Closed captions toggle
- Voice control support info
- Accessibility statement

---

#### 5.8.12 Help & Support
**Route:** `/profile/help`  
**Purpose:** Get assistance  
**Components:**
- Search help articles
- FAQ categories
- Contact support button
- Live chat option (if available)
- Video tutorials
- Community forum link

---

#### 5.8.13 Feedback
**Route:** `/profile/feedback`  
**Purpose:** Collect user input  
**Components:**
- Feedback type selector
- Rating slider
- Comment textarea
- Screenshot attachment
- Contact email (optional)
- Submit button

---

#### 5.8.14 About
**Route:** `/profile/about`  
**Purpose:** App information  
**Components:**
- App version
- Build number
- Update check
- Release notes
- Credits/attribution
- Open source licenses
- Terms & Privacy links

---

### 5.9 CRISIS SUPPORT SCREENS

#### 5.9.1 Crisis Home
**Route:** `/crisis`  
**Purpose:** Immediate access to support resources  
**Components:**
- Crisis banner with warning
- Immediate help button (prominent)
- Crisis resources list
- Emergency contacts
- Coping tools quick access
- Safety plan button
- Disclaimer

---

#### 5.9.2 Immediate Help
**Route:** `/crisis/immediate`  
**Purpose:** Connect to emergency services  
**Components:**
- Emergency call button (911/local)
- Crisis text line button
- Hotline numbers by country
- Chat with crisis counselor
- Location services prompt
- "I'm with someone" option

---

#### 5.9.3 Crisis Resources
**Route:** `/crisis/resources`  
**Purpose:** Comprehensive support directory  
**Components:**
- Search resources
- Filter by type (phone, text, chat)
- Country selector
- Resource cards with:
  - Organization name
  - Services offered
  - Hours
  - Contact info
  - Website link
- Save favorites

---

#### 5.9.4 Emergency Contacts
**Route:** `/crisis/contacts`  
**Purpose:** Personal support network  
**Components:**
- Add contact button
- Contact list with:
  - Name
  - Relationship
  - Phone number
  - Quick call button
- ICE (In Case of Emergency) designation
- Import from phone contacts

---

#### 5.9.5 Safety Planning
**Route:** `/crisis/safety-plan`  
**Purpose:** Personalized crisis prevention  
**Components:**
- Warning signs section
- Coping strategies list
- Distraction techniques
- People/places for support
- Professional contacts
- Environment safety checklist
- Plan review reminder

---

#### 5.9.6 Coping Strategies
**Route:** `/crisis/coping`  
**Purpose:** Immediate relief techniques  
**Components:**
- Quick techniques grid
- Grounding exercises
- Breathing shortcuts
- Distraction activities
- Self-soothing suggestions
- Crisis chat shortcut

---

#### 5.9.7 Post-Crisis Support
**Route:** `/crisis/post-crisis`  
**Purpose:** Follow-up after crisis situation  
**Components:**
- Check-in message
- Follow-up resources
- Professional referral suggestions
- Safety plan review prompt
- Schedule follow-up chat
- Self-care suggestions

---

### 5.10 NOTIFICATION SCREENS

#### 5.10.1 Notification Center
**Route:** `/notifications`  
**Purpose:** View all notifications  
**Components:**
- Notification list
- Filter tabs (All, Unread, Mentions)
- Mark all as read
- Clear notifications
- Empty state
- Settings shortcut

**Notification Types:**
- Chat messages
- Mood reminders
- Daily insights
- Achievement unlocks
- System announcements
- Session summaries

---

## 6. User Flows

### 6.1 New User Onboarding Flow

```
Landing Page
    ↓
Sign Up / Social Auth
    ↓
Welcome Sequence (swipeable)
    ↓
Profile Setup (name, photo, preferences)
    ↓
Wellness Assessment (7-10 questions)
    ↓
Goal Setting (select priorities)
    ↓
Preference Configuration (AI style, notifications)
    ↓
Notification Permissions
    ↓
Onboarding Complete → Home Dashboard
```

**Duration:** 3-5 minutes  
**Exit Points:** Skip available at each step (except auth)  
**Completion Reward:** First achievement badge

---

### 6.2 Returning User Flow

```
App Open / Login
    ↓
[Check: Time of day?]
    ├── Morning (6-10 AM) → Morning Check-in
    ├── Evening (8 PM-12 AM) → Evening Wind-down
    └── Other → Home Dashboard
    ↓
[Check: Active session?]
    ├── Yes → Resume session prompt
    └── No → Normal dashboard
    ↓
User selects action or browses
```

---

### 6.3 Chat Session Flow

```
Chat Home
    ↓
New Chat / Select Existing
    ↓
Active Conversation
    ├── User sends message
    ├── AI responds
    ├── Exercise suggested (optional)
    ├── Mood check (optional)
    └── Session continues...
    ↓
End Session (user or timeout)
    ↓
Session Summary
    ├── Key takeaways
    ├── Exercises suggested
    ├── Mood comparison
    └── Action items
    ↓
Return to Chat Home
```

---

### 6.4 Crisis Support Flow

```
[Triggered by: Crisis button tap OR AI detection OR user statement]
    ↓
Crisis Home / Immediate Help
    ↓
[Assess: Immediate danger?]
    ├── Yes → Emergency services prompt
    │           ├── Call 911/local emergency
    │           ├── Crisis text line
    │           └── Chat with counselor
    └── No → Crisis Resources
                ├── Hotlines
                ├── Text lines
                ├── Chat services
                └── Coping strategies
    ↓
[Offer: Safety Plan]
    ├── Create new plan
    ├── Review existing plan
    └── Skip for now
    ↓
Post-Crisis Support (follow-up)
```

---

### 6.5 Mood Tracking Flow

```
[Triggered by: Manual entry OR reminder OR post-chat]
    ↓
Mood Selector Screen
    ├── Select mood emoji (1-5)
    ├── Adjust intensity
    └── Add factors/tags
    ↓
Optional: Add notes/photo
    ↓
Save Entry
    ↓
[If pattern detected]
    └── Show insight/recommendation
    ↓
Return to previous screen
```

---

### 6.6 Exercise Completion Flow

```
Tools Library / Direct Link
    ↓
Exercise Selection
    ↓
Exercise Player
    ├── Instructions/read intro
    ├── Start exercise
    ├── Follow guidance
    └── Complete
    ↓
Completion Screen
    ├── Celebration animation
    ├── Time spent
    ├── Rating request
    └── Reflection prompt (optional)
    ↓
[Options]
    ├── Save to favorites
    ├── Share achievement
    ├── Try similar exercise
    └── Return to library
```

---

### 6.7 Subscription Upgrade Flow

```
[Triggered by: Premium feature attempt OR settings OR pricing page]
    ↓
Plan Comparison
    ├── Free features
    ├── Premium features
    └── Premium Plus features
    ↓
Select Plan
    ↓
Payment Screen
    ├── Payment method
    ├── Promo code
    └── Terms acceptance
    ↓
Confirmation
    ↓
Welcome to Premium
    └── Feature tour
```

---

## 7. Modal & Overlay System

### 7.1 Global Modals

| Modal | Trigger | Content |
|-------|---------|---------|
| **Crisis Banner** | AI detects distress keywords | Immediate help options |
| **Rate App** | After N sessions or time | App store rating request |
| **Upgrade Prompt** | Premium feature attempt | Plan comparison |
| **Network Error** | Connection lost | Retry/Offline mode options |
| **Session Timeout** | Inactivity | Continue/End session |
| **Daily Reminder** | Scheduled time | Check-in prompt |
| **Achievement Unlock** | Badge earned | Celebration + share |

### 7.2 Screen-Specific Modals

| Screen | Modal | Purpose |
|--------|-------|---------|
| Chat | End Session Confirm | Confirm before ending |
| Chat | Exercise Suggestion | Offer related exercise |
| Chat | Mood Check | Inline mood prompt |
| Tools | Exercise Complete | Celebration + next steps |
| Insights | Delete Entry | Confirm data deletion |
| Profile | Delete Account | Multi-step confirmation |
| Profile | Logout Confirm | Confirm logout |

### 7.3 Bottom Sheets (Mobile)

| Sheet | Use Case |
|-------|----------|
| **Share Sheet** | Share content/achievements |
| **Filter Sheet** | Filter exercises/insights |
| **Sort Sheet** | Sort lists |
| **Date Picker** | Select date ranges |
| **Action Sheet** | Contextual actions |
| **Mood Quick-Add** | Fast mood entry |

### 7.4 Toast Notifications

| Type | Trigger | Duration |
|------|---------|----------|
| Success | Action completed | 3s |
| Error | Action failed | 5s |
| Info | General update | 4s |
| Warning | Attention needed | 5s |

---

## 8. Component Library Mapping

### 8.1 Navigation Components

```
├── BottomTabBar
│   ├── TabItem (5 items)
│   ├── Active indicator
│   └── Badge support
│
├── TopNavigationBar
│   ├── Back button
│   ├── Title
│   ├── Action buttons
│   └── Progress indicator
│
├── SideNavigation (Web)
│   ├── Logo
│   ├── Nav items
│   ├── Collapse toggle
│   └── User mini-profile
│
└── Breadcrumbs (Web)
    ├── Path segments
    └── Current page
```

### 8.2 Input Components

```
├── TextInput
│   ├── Label
│   ├── Input field
│   ├── Error message
│   ├── Helper text
│   └── Icon support
│
├── PasswordInput
│   ├── Visibility toggle
│   └── Strength indicator
│
├── Select/Dropdown
│   ├── Options list
│   ├── Search
│   └── Multi-select
│
├── Slider
│   ├── Track
│   ├── Thumb
│   └── Value label
│
├── DatePicker
│   ├── Calendar view
│   └── Time selector
│
└── MoodSelector
    ├── Emoji buttons
    └── Intensity slider
```

### 8.3 Display Components

```
├── Card
│   ├── Header
│   ├── Content
│   ├── Actions
│   └── Image support
│
├── ListItem
│   ├── Icon/Avatar
│   ├── Title
│   ├── Subtitle
│   └── Action
│
├── Chart
│   ├── Line chart
│   ├── Bar chart
│   ├── Pie chart
│   └── Calendar heatmap
│
├── ProgressIndicator
│   ├── Linear
│   ├── Circular
│   └── Step indicator
│
├── Badge
│   ├── Count badge
│   ├── Status badge
│   └── Achievement badge
│
└── EmptyState
    ├── Illustration
    ├── Title
    ├── Description
    └── Action button
```

### 8.4 Feedback Components

```
├── Modal
│   ├── Alert modal
│   ├── Confirm modal
│   └── Custom content modal
│
├── BottomSheet
│   ├── Fixed height
│   ├── Expandable
│   └── Full screen
│
├── Toast
│   ├── Position options
│   └── Auto-dismiss
│
├── Snackbar
│   └── Action button
│
├── LoadingSpinner
│   ├── Full screen
│   ├── Inline
│   └── Skeleton
│
└── SkeletonLoader
    ├── Text lines
    ├── Cards
    └── Charts
```

### 8.5 Chat Components

```
├── ChatBubble
│   ├── User bubble
│   ├── AI bubble
│   ├── Timestamp
│   └── Status indicator
│
├── MessageInput
│   ├── Text field
│   ├── Send button
│   └── Attachment button
│
├── TypingIndicator
│   └── Animated dots
│
├── QuickReplies
│   └── Button chips
│
├── ExerciseCard
│   ├── Preview
│   ├── Start button
│   └── Duration
│
└── SessionSummary
    ├── Key points
    └── Action items
```

---

## 9. State Management Matrix

### 9.1 Screen State Definitions

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| **Default** | Normal operation | Standard UI |
| **Loading** | Data fetching | Spinner/Skeleton |
| **Empty** | No data to display | Empty state illustration |
| **Error** | Operation failed | Error message + retry |
| **Success** | Action completed | Success toast/checkmark |
| **Active** | User interaction | Highlight/focus |
| **Disabled** | Not available | Grayed out |
| **Selected** | Item chosen | Checkmark/highlight |

### 9.2 Global State

```typescript
interface GlobalState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  subscription: 'free' | 'premium' | 'premium_plus';
  
  // App
  theme: 'light' | 'dark' | 'system';
  language: string;
  onboardingComplete: boolean;
  
  // Session
  currentChatSession: ChatSession | null;
  activeExercise: Exercise | null;
  
  // Notifications
  unreadCount: number;
  notifications: Notification[];
  
  // Crisis
  crisisMode: boolean;
  
  // Network
  isOnline: boolean;
  isSyncing: boolean;
}
```

### 9.3 Screen-Specific State

| Screen | Key States |
|--------|------------|
| Home | `loading`, `hasCheckIn`, `streakCount` |
| Chat | `sessionActive`, `aiTyping`, `messageCount` |
| Tools | `categoryFilter`, `searchQuery`, `favoritesOnly` |
| Insights | `dateRange`, `chartType`, `dataLoading` |
| Profile | `editMode`, `saving`, `hasChanges` |

---

## 10. Accessibility & UX Considerations

### 10.1 Accessibility Requirements

| Feature | Implementation |
|---------|----------------|
| **Screen Reader** | All elements labeled, logical focus order |
| **Text Size** | Support up to 200% scaling |
| **Color Contrast** | WCAG AA minimum (4.5:1) |
| **Touch Targets** | Minimum 44x44dp/pt |
| **Reduce Motion** | Respect system preference |
| **Voice Control** | All actions voice-accessible |
| **Closed Captions** | All video content captioned |

### 10.2 Crisis Accessibility

- Crisis button always visible (bottom right)
- Crisis banner cannot be dismissed without action
- Emergency numbers clickable to call
- Crisis resources available offline
- Simple language for crisis content

### 10.3 Performance Targets

| Metric | Target |
|--------|--------|
| Time to Interactive | < 3s |
| First Contentful Paint | < 1.5s |
| Chat response time | < 2s |
| Screen transition | < 300ms |
| Offline functionality | Core features work |

### 10.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Bottom tabs, single column |
| Tablet | 768-1024px | Collapsible side nav |
| Desktop | > 1024px | Full side nav, multi-column |

---

## Appendix A: Route Reference

### Mobile Routes

```
/                           → Landing (logged out) or Home (logged in)
/login                      → Login screen
/signup                     → Sign up screen
/forgot-password            → Password reset request
/reset-password             → Password reset confirmation
/verify-email               → Email verification
/onboarding/*               → Onboarding flow screens
/home                       → Daily dashboard
/home/morning-checkin       → Morning check-in
/home/evening-winddown      → Evening wind-down
/chat                       → Chat home
/chat/session/:id           → Active conversation
/chat/history               → Chat history
/tools                      → Tools library
/tools/exercise/:id         → Exercise player
/tools/breathing/:id        → Breathing exercise
/tools/meditation/:id       → Meditation guide
/tools/grounding            → Grounding techniques
/tools/cbt/:id              → CBT worksheets
/tools/journal              → Journaling prompts
/tools/sleep/stories        → Sleep stories
/insights                   → Insights dashboard
/insights/mood              → Mood tracker
/insights/mood/calendar     → Mood calendar
/insights/mood/patterns     → Mood patterns
/insights/progress          → Progress reports
/insights/weekly            → Weekly summary
/insights/achievements      → Achievement gallery
/profile                    → Profile overview
/profile/edit               → Edit profile
/profile/account            → Account settings
/profile/subscription       → Subscription management
/profile/notifications      → Notification settings
/profile/privacy            → Privacy settings
/profile/data               → Data export/delete
/profile/app-settings       → App settings
/profile/theme              → Theme settings
/profile/language           → Language settings
/profile/accessibility      → Accessibility settings
/profile/help               → Help & support
/profile/feedback           → Feedback
/profile/about              → About
/crisis                     → Crisis home
/crisis/immediate           → Immediate help
/crisis/resources           → Crisis resources
/crisis/contacts            → Emergency contacts
/crisis/safety-plan         → Safety planning
/crisis/coping              → Coping strategies
/crisis/post-crisis         → Post-crisis support
/notifications              → Notification center
```

### Web Routes

Same as mobile with additional:

```
/about                      → About MindMate
/features                   → Features overview
/pricing                    → Pricing plans
/support                    → Support center
/crisis-resources           → Public crisis resources
/privacy-policy             → Privacy policy
/terms-of-service           → Terms of service
```

---

## Appendix B: Screen Count Summary

| Category | Screen Count |
|----------|--------------|
| Public (Logged Out) | 7 |
| Authentication | 6 |
| Onboarding | 7 |
| Home/Dashboard | 3 |
| Chat | 5 |
| Tools & Exercises | 9 |
| Insights | 8 |
| Profile & Settings | 15 |
| Crisis Support | 7 |
| Notifications | 1 |
| **TOTAL** | **68 screens** |

---

## Appendix C: User Journey Map

### Journey Stages

```
AWARENESS → CONSIDERATION → ONBOARDING → ACTIVATION → ENGAGEMENT → RETENTION → ADVOCACY
    ↓           ↓              ↓            ↓            ↓           ↓           ↓
  Landing    Features      Welcome      First        Regular      Streaks    Referral
  Page       Overview      Sequence     Chat         Usage        Goals      Reviews
  Ads        Testimonials  Assessment   First        Habit        Premium    Sharing
  Social     Pricing       Goals        Exercise     Insights     Renewal
  Proof                      Setup        Mood         Community
                            Complete     Log
```

---

**Document End**

*This Information Architecture document serves as the complete blueprint for MindMate AI's app structure. All screens, flows, and components are documented for development reference.*
