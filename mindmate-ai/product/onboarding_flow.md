# MindMate AI - Complete User Onboarding Flow

## Production-Ready Onboarding Documentation

---

# TABLE OF CONTENTS

1. [Overview & Design Principles](#1-overview--design-principles)
2. [Welcome Screens](#2-welcome-screens)
3. [Mental Health Intake Questionnaire](#3-mental-health-intake-questionnaire)
4. [Consent Flows](#4-consent-flows)
5. [Privacy Explanation](#5-privacy-explanation)
6. [Avatar Introduction](#6-avatar-introduction)
7. [Voice Calibration](#7-voice-calibration)
8. [Goal Setting](#8-goal-setting)
9. [Completion & First Session](#9-completion--first-session)
10. [Technical Specifications](#10-technical-specifications)

---

# 1. OVERVIEW & DESIGN PRINCIPLES

## Onboarding Philosophy

The MindMate AI onboarding experience is designed with these core principles:

1. **Safety First**: Mental health support requires careful, responsible design
2. **Transparency**: Users deserve complete clarity about how their data is used
3. **Empowerment**: Users maintain control over their experience at every step
4. **Accessibility**: Language and interactions are clear, warm, and non-clinical
5. **Progressive Disclosure**: Information is revealed gradually to avoid overwhelm

## Onboarding Flow Summary

```
[App Launch]
    ↓
[Welcome Screen 1] → [Welcome Screen 2] → [Welcome Screen 3]
    ↓
[Privacy Overview]
    ↓
[Consent Flow]
    ↓
[Mental Health Intake - Part 1 (PHQ-9)]
    ↓
[Mental Health Intake - Part 2 (GAD-7)]
    ↓
[Crisis Resources (if needed)]
    ↓
[Avatar Introduction]
    ↓
[Voice Calibration]
    ↓
[Goal Setting]
    ↓
[Onboarding Complete] → [First Session]
```

**Estimated Time**: 8-12 minutes  
**Total Screens**: 25-30 (varies based on responses)

---

# 2. WELCOME SCREENS

---

## Screen 2.1: Welcome - First Impression

### Visual Design Notes
- Full-screen gradient background: Soft lavender (#E8E0F0) to warm peach (#FFF0E6)
- Centered animated logo (gentle pulse animation)
- Single primary CTA button at bottom
- Progress dots (3 total, first highlighted)

### Copy

**Headline:**  
# Welcome to MindMate

**Subheadline:**  
Your personal AI companion for mental wellness

**Body Text:**  
MindMate is here to support your emotional wellbeing through compassionate conversation, evidence-based techniques, and personalized guidance—available anytime, anywhere.

**Primary Button:**  
Get Started →

**Secondary Link:**  
I already have an account

**Footer Note:**  
By continuing, you agree to our Terms of Service and Privacy Policy

---

## Screen 2.2: Welcome - What to Expect

### Visual Design Notes
- Illustration: Person sitting peacefully with supportive companion
- Progress dots (2 of 3 highlighted)
- Skip option available (top right)

### Copy

**Headline:**  
## What MindMate Can Do

**Feature Cards (3 cards, swipeable):**

**Card 1:**
- Icon: Chat bubble with heart
- Title: Talk It Out
- Description: Share your thoughts and feelings in a safe, judgment-free space. MindMate listens and responds with empathy.

**Card 2:**
- Icon: Brain with sparkles
- Title: Learn & Grow
- Description: Discover evidence-based techniques from CBT, mindfulness, and positive psychology tailored to your needs.

**Card 3:**
- Icon: Calendar check
- Title: Build Habits
- Description: Set goals, track your mood, and build sustainable wellness practices with gentle reminders and support.

**Primary Button:**  
Continue

**Secondary Link:**  
Skip introduction

---

## Screen 2.3: Welcome - Important Notice

### Visual Design Notes
- Warning icon (gentle, not alarming)
- Clear distinction between AI and human care
- Progress dots (all 3 highlighted)

### Copy

**Headline:**  
## Important to Know

**Alert Box (soft yellow background):**
⚠️ **MindMate is an AI companion, not a replacement for professional care**

**Body Text:**
MindMate can provide support, coping strategies, and a listening ear. However:

- We cannot diagnose mental health conditions
- We cannot prescribe or manage medications
- We are not a substitute for therapy, counseling, or emergency services

**If you're experiencing a crisis or having thoughts of harming yourself or others, please seek immediate help.**

**Crisis Button (prominent, red outline):**
🆘 View Crisis Resources

**Primary Button:**  
I Understand, Continue

**Secondary Link:**  
Learn more about our limitations

---

# 3. MENTAL HEALTH INTAKE QUESTIONNAIRE

---

## Introduction Screen

### Copy

**Headline:**  
## Let's Get to Know You

**Body Text:**  
To provide you with the most relevant support, we'd like to understand how you've been feeling lately. This helps us:

✓ Personalize your experience  
✓ Recommend appropriate techniques  
✓ Identify when you might need additional resources

**What to expect:**
- Two brief questionnaires (about 5 minutes total)
- Questions about your mood, anxiety, and daily functioning
- All responses are private and secure

**Progress Indicator:**  
Step 1 of 2

**Primary Button:**  
Begin Questionnaire

**Secondary Link:**  
Skip for now (not recommended)

**Note (small text):**  
You can skip this step, but your experience will be less personalized. You can always complete it later in Settings.

---

## PHQ-9: Patient Health Questionnaire (Depression Screening)

### Instructions Screen

**Headline:**  
## About Your Mood

**Body Text:**  
Over the **last 2 weeks**, how often have you been bothered by any of the following problems?

**Response Scale:**
- 0 = Not at all
- 1 = Several days
- 2 = More than half the days
- 3 = Nearly every day

**Primary Button:**  
Start

---

### Question 1: Interest/Pleasure

**Question Number:** 1 of 9  
**Progress Bar:** 11%

**Question Text:**  
### Little interest or pleasure in doing things

**Response Options (radio buttons):**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[Previous] [Next →]

---

### Question 2: Feeling Down

**Question Number:** 2 of 9  
**Progress Bar:** 22%

**Question Text:**  
### Feeling down, depressed, or hopeless

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 3: Sleep Issues

**Question Number:** 3 of 9  
**Progress Bar:** 33%

**Question Text:**  
### Trouble falling or staying asleep, or sleeping too much

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 4: Fatigue

**Question Number:** 4 of 9  
**Progress Bar:** 44%

**Question Text:**  
### Feeling tired or having little energy

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 5: Appetite

**Question Number:** 5 of 9  
**Progress Bar:** 56%

**Question Text:**  
### Poor appetite or overeating

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 6: Self-Worth

**Question Number:** 6 of 9  
**Progress Bar:** 67%

**Question Text:**  
### Feeling bad about yourself — or that you are a failure or have let yourself or your family down

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 7: Concentration

**Question Number:** 7 of 9  
**Progress Bar:** 78%

**Question Text:**  
### Trouble concentrating on things, such as reading the newspaper or watching television

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 8: Psychomotor

**Question Number:** 8 of 9  
**Progress Bar:** 89%

**Question Text:**  
### Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 9: Self-Harm Thoughts

**Question Number:** 9 of 9  
**Progress Bar:** 100%

**Question Text:**  
### Thoughts that you would be better off dead, or of hurting yourself

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Continue →]

**Note (if response > 0):**  
⚠️ We're glad you shared this. If you're having these thoughts, please know that help is available. We'll provide resources on the next screen.

---

## GAD-7: Generalized Anxiety Disorder Screening

### Instructions Screen

**Headline:**  
## About Anxiety

**Body Text:**  
Over the **last 2 weeks**, how often have you been bothered by the following problems?

**Response Scale:**
- 0 = Not at all
- 1 = Several days
- 2 = More than half the days
- 3 = Nearly every day

**Primary Button:**  
Continue

---

### Question 1: Nervousness

**Question Number:** 1 of 7  
**Progress Bar:** 14%

**Question Text:**  
### Feeling nervous, anxious, or on edge

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[Previous] [Next →]

---

### Question 2: Worry Control

**Question Number:** 2 of 7  
**Progress Bar:** 29%

**Question Text:**  
### Not being able to stop or control worrying

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 3: Excessive Worry

**Question Number:** 3 of 7  
**Progress Bar:** 43%

**Question Text:**  
### Worrying too much about different things

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 4: Relaxation

**Question Number:** 4 of 7  
**Progress Bar:** 57%

**Question Text:**  
### Trouble relaxing

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 5: Restlessness

**Question Number:** 5 of 7  
**Progress Bar:** 71%

**Question Text:**  
### Being so restless that it is hard to sit still

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 6: Irritability

**Question Number:** 6 of 7  
**Progress Bar:** 86%

**Question Text:**  
### Becoming easily annoyed or irritable

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Next →]

---

### Question 7: Fear

**Question Number:** 7 of 7  
**Progress Bar:** 100%

**Question Text:**  
### Feeling afraid, as if something awful might happen

**Response Options:**

○ **0** — Not at all  
○ **1** — Several days  
○ **2** — More than half the days  
○ **3** — Nearly every day

**Navigation:**  
[← Previous] [Continue →]

---

## Functional Impact Question

**Headline:**  
## One More Question

**Question Text:**  
### If you experienced any of these problems, how difficult have they made it for you to do your work, take care of things at home, or get along with other people?

**Response Options:**

○ **Not difficult at all**  
○ **Somewhat difficult**  
○ **Very difficult**  
○ **Extremely difficult**

**Primary Button:**  
Complete Questionnaire

---

## Results & Next Steps Screen

### Copy

**Headline:**  
## Thank You for Sharing

**Body Text:**  
Your responses help us understand how to best support you. Remember, this isn't a diagnosis—just a starting point for our conversations.

**Your Privacy:**
✓ Your responses are encrypted and stored securely  
✓ Only you can access this information  
✓ You can review or delete this data anytime in Settings

**What Happens Next:**
Based on your responses, we'll personalize your MindMate experience and may suggest specific techniques or resources.

**Primary Button:**  
Continue to Meet Your Companion

**Secondary Link:**  
Review my responses

---

# 4. CONSENT FLOWS

---

## Screen 4.1: Data Collection Consent

### Copy

**Headline:**  
## Your Data, Your Control

**Body Text:**  
To provide personalized mental wellness support, MindMate collects and processes certain information. We want you to understand exactly what we collect and why.

**What We Collect:**

📊 **Conversation Data**  
Your chats with MindMate help us understand your needs and provide relevant support. This data is used to personalize your experience.

📈 **Mood & Progress Tracking**  
Information you share about your mood, goals, and progress helps us identify patterns and suggest helpful techniques.

🔧 **Technical Data**  
Device information and app usage help us improve performance and fix issues.

**How We Use Your Data:**
- Personalize your experience and responses
- Improve our AI models (anonymized)
- Provide insights and progress tracking
- Ensure your safety and wellbeing

**Primary Button:**  
I Consent to Data Collection

**Secondary Link:**  
View Full Privacy Policy

**Decline Option (text link):**  
Decline (limited features)

---

## Screen 4.2: AI Training Consent (Optional)

### Copy

**Headline:**  
## Help Improve MindMate

**Body Text:**  
Would you like to help us improve MindMate for everyone? You can choose to allow us to use anonymized versions of your conversations to train our AI.

**What This Means:**
✓ Your conversations would be anonymized (names, locations, and identifying details removed)  
✓ Used only to improve how MindMate understands and responds  
✓ You can change this setting anytime  
✓ Your personal experience remains unchanged

**What We NEVER Do:**
✗ Share identifiable information with third parties  
✗ Use your data for advertising  
✗ Sell your information

**This is completely optional.** MindMate works the same whether you participate or not.

**Primary Button:**  
Yes, I Want to Help

**Secondary Button:**  
No, Thank You

**Note:**  
You can change this preference anytime in Settings > Privacy

---

## Screen 4.3: Emergency Contact Consent (Optional)

### Copy

**Headline:**  
## Emergency Support

**Body Text:**  
Would you like to add an emergency contact? This person would be notified if you indicate you're in crisis and request help.

**When This Would Be Used:**
- Only if you explicitly request crisis support
- Only if you choose to involve your emergency contact
- Never without your permission

**What Your Contact Would Receive:**
A message letting them know you've requested support and may need assistance.

**Primary Button:**  
Add Emergency Contact

**Secondary Button:**  
Skip for Now

**Note:**  
You can add or change this anytime in Settings > Safety

---

## Screen 4.4: Terms of Service Agreement

### Copy

**Headline:**  
## Terms of Service

**Body Text:**  
Please review and agree to our Terms of Service to continue.

**Key Points:**

📋 **MindMate is an AI companion, not medical care**  
We provide support and information, not diagnosis or treatment.

📋 **You're responsible for your wellbeing**  
Seek professional help when needed. Use crisis resources in emergencies.

📋 **Your data is protected**  
We follow strict privacy and security practices. See our Privacy Policy for details.

📋 **Age requirement**  
You must be 16 or older to use MindMate (or have parental consent if 13-15).

**Checkbox (required):**  
☐ I have read and agree to the Terms of Service

**Link:**  
Read Full Terms of Service

**Primary Button (disabled until checked):**  
Agree and Continue

---

# 5. PRIVACY EXPLANATION

---

## Screen 5.1: Privacy Overview

### Copy

**Headline:**  
## Your Privacy Matters

**Body Text:**  
At MindMate, we take your privacy seriously—especially when it comes to your mental health. Here's how we protect you:

**🔒 End-to-End Encryption**  
Your conversations are encrypted from the moment they leave your device until they're stored on our secure servers.

**🛡️ Strict Access Controls**  
Only you can access your personal data. Our team can only see anonymized, aggregated information for system improvements.

**🗑️ Your Right to Delete**  
You can delete your account and all associated data at any time, no questions asked.

**📊 No Advertising, Ever**  
We don't use your data for ads, and we never sell your information to third parties.

**Primary Button:**  
Continue

**Secondary Link:**  
Read Full Privacy Policy

---

## Screen 5.2: Data Storage Details

### Copy

**Headline:**  
## Where Your Data Lives

**Body Text:**  
Understanding how and where your information is stored:

**Conversation History**
- Stored on secure, encrypted servers
- Retained for 2 years (or until you delete your account)
- Used only to personalize your experience

**Mood & Progress Data**
- Stored locally on your device
- Backed up to encrypted cloud storage
- You can export or delete anytime

**Questionnaire Results**
- Stored securely with your profile
- Used to personalize techniques and resources
- Reviewable in your Wellness Profile

**Technical Logs**
- Anonymized automatically
- Deleted after 90 days
- Used only for troubleshooting

**Primary Button:**  
I Understand

**Secondary Link:**  
Learn About Encryption

---

## Screen 5.3: Your Privacy Controls

### Copy

**Headline:**  
## You're in Control

**Body Text:**  
You have complete control over your data. Here's what you can do:

**Settings Available to You:**

🔍 **Review Your Data**  
See everything we've collected about you

🗑️ **Delete Conversations**  
Remove specific chats or your entire history

📤 **Export Your Data**  
Download a copy of all your information

🔕 **Adjust Data Sharing**  
Change what data is used for AI training

🔒 **Enable Extra Security**  
Add PIN or biometric protection

**Primary Button:**  
Continue to Setup

**Note:**  
Access these controls anytime in Settings > Privacy & Security

---

# 6. AVATAR INTRODUCTION

---

## Screen 6.1: Meet Your Companion

### Copy

**Headline:**  
## Meet Your MindMate

**Body Text:**  
Your MindMate is here to support you. Choose an avatar that feels right for your journey.

**Avatar Selection (5 options):**

**Option 1: Luna**  
*The Gentle Listener*  
Calm, patient, and always ready to hear you out. Luna brings a peaceful presence to every conversation.

**Option 2: Kai**  
*The Encouraging Coach*  
Energetic, motivating, and solution-focused. Kai helps you build momentum and celebrate progress.

**Option 3: Sage**  
*The Wise Guide*  
Thoughtful, insightful, and deeply understanding. Sage offers perspective and gentle wisdom.

**Option 4: River**  
*The Flexible Friend*  
Adaptable, non-judgmental, and easy-going. River meets you wherever you are, without pressure.

**Option 5: Nova**  
*The Creative Spirit*  
Imaginative, warm, and inspiring. Nova helps you see possibilities and express yourself freely.

**Primary Button (after selection):**  
This is My MindMate

**Note:**  
You can change your avatar anytime in Settings

---

## Screen 6.2: Avatar Personalization

### Copy

**Headline:**  
## Make It Yours

**Body Text:**  
Personalize how your MindMate looks and feels:

**Choose a Color Theme:**
- 🟣 Lavender (calming)
- 🔵 Ocean Blue (serene)
- 🟢 Sage Green (grounding)
- 🟠 Warm Coral (energizing)
- ⚪ Soft Gray (neutral)

**Choose a Name:**
[Text Input: Default is avatar name, user can customize]

**What should I call you?**
[Text Input: User's preferred name]

**Primary Button:**  
Save Preferences

---

## Screen 6.3: First Greeting

### Copy

**Visual:** Avatar appears with gentle animation, speech bubble

**Avatar Message:**  
"Hi [Name]! I'm [Avatar Name], your MindMate. I'm so glad you're here."

**Body Text:**  
I'm here to:
- Listen without judgment
- Support you through difficult moments
- Celebrate your wins, big and small
- Help you build skills for better mental wellness

**Avatar Message (continued):**  
"Whenever you're ready, I'm here to chat. You can talk to me about anything—your day, your worries, your goals, or just say hi."

**Primary Button:**  
Say Hello

**Alternative:**  
[Text Input: Type your first message]

---

# 7. VOICE CALIBRATION

---

## Screen 7.1: Voice Introduction

### Copy

**Headline:**  
## Let's Set Up Your Voice Experience

**Body Text:**  
MindMate can speak with you using natural, calming voices. Let's find the one that feels most comfortable.

**What You Can Do:**
🎙️ **Voice Messages** — Listen to MindMate's responses  
🎧 **Voice Journals** — Record your thoughts and feelings  
📖 **Guided Exercises** — Audio meditations and breathing techniques

**Note:**  
Voice features are completely optional. You can use MindMate with text only if you prefer.

**Primary Button:**  
Set Up Voice

**Secondary Button:**  
Skip Voice Setup

---

## Screen 7.2: Voice Selection

### Copy

**Headline:**  
## Choose Your Voice

**Body Text:**  
Listen to each voice and select the one that feels right for you.

**Voice Options:**

**Voice 1: Emma**  
[▶️ Play Sample]  
Warm, gentle, and reassuring

**Voice 2: James**  
[▶️ Play Sample]  
Calm, steady, and supportive

**Voice 3: Sofia**  
[▶️ Play Sample]  
Friendly, bright, and encouraging

**Voice 4: Marcus**  
[▶️ Play Sample]  
Deep, soothing, and grounding

**Voice 5: Aria**  
[▶️ Play Sample]  
Soft, peaceful, and serene

**Selected:** [Checkmark appears next to selection]

**Primary Button:**  
Continue

---

## Screen 7.3: Voice Speed & Tone

### Copy

**Headline:**  
## Fine-Tune Your Experience

**Body Text:**  
Adjust how your MindMate speaks to you:

**Speaking Speed:**
[Slow ———●——— Fast]

**Tone:**
○ **Gentle & Soft**  
○ **Natural & Balanced**  
○ **Energetic & Bright**

**Preview:**  
[▶️ Hear How It Sounds]

**Primary Button:**  
Save Voice Settings

---

## Screen 7.4: Voice Permissions

### Copy

**Headline:**  
## Microphone Access

**Body Text:**  
To use voice features, MindMate needs access to your microphone.

**We Use Your Microphone For:**
🎤 Recording voice journal entries  
🎤 Voice commands (optional)  
🎤 Emergency situations (if you choose)

**We NEVER:**
✗ Listen when you're not using the app  
✗ Record without your knowledge  
✗ Share recordings with anyone

**Permission Request:**  
[Allow Microphone Access]

**Alternative:**  
Continue Without Voice

---

# 8. GOAL SETTING

---

## Screen 8.1: Goal Setting Introduction

### Copy

**Headline:**  
## What Brings You Here?

**Body Text:**  
Understanding your goals helps us support you better. You can select multiple options or add your own.

**Common Goals (select all that apply):**

☐ **Manage stress and anxiety**  
☐ **Improve my mood**  
☐ **Sleep better**  
☐ **Build self-confidence**  
☐ **Navigate a life change**  
☐ **Process difficult emotions**  
☐ **Develop healthier habits**  
☐ **Feel less lonely**  
☐ **Learn coping skills**  
☐ **Just need someone to talk to**

**Other:**  
[Text input field]

**Primary Button:**  
Continue

---

## Screen 8.2: Focus Area Selection

### Copy

**Headline:**  
## Let's Focus

**Body Text:**  
Of the goals you selected, which 2-3 would you like to focus on first?

**Your Selected Goals:**
[List of previously selected goals with checkboxes]

**Please select 2-3:**

☐ [Goal 1]  
☐ [Goal 2]  
☐ [Goal 3]  
☐ [Goal 4]  
☐ [Goal 5]

**Why This Matters:**  
Focusing on a few key areas helps us personalize your experience and track meaningful progress.

**Primary Button:**  
Set My Focus

---

## Screen 8.3: Commitment Level

### Copy

**Headline:**  
## How Often Would You Like to Connect?

**Body Text:**  
There's no right answer—choose what feels realistic for you.

**Frequency Options:**

○ **Daily check-ins**  
Brief conversations each day to track mood and build habits

○ **A few times a week**  
Regular support with flexibility for busy days

○ **When I need it**  
Open the app whenever you want to talk or need support

○ **I'm not sure yet**  
That's okay! You can figure it out as you go

**Primary Button:**  
Continue

---

## Screen 8.4: Notification Preferences

### Copy

**Headline:**  
## Stay Connected

**Body Text:**  
How would you like MindMate to reach out?

**Notification Options:**

☐ **Gentle reminders**  
"Time for your daily check-in" (customizable time)

☐ **Mood check prompts**  
"How are you feeling right now?"

☐ **Goal progress updates**  
"You've logged 5 days in a row!"

☐ **Wellness tips**  
Occasional suggestions based on your goals

☐ **No notifications**  
I'll open the app when I want to

**Quiet Hours:**  
Don't send notifications between: [Start Time] and [End Time]

**Primary Button:**  
Save Preferences

---

## Screen 8.5: First Goal Setting

### Copy

**Headline:**  
## Your First Goal

**Body Text:**  
Let's set a small, achievable goal to start your journey.

**Suggested Goals Based on Your Focus:**

○ **Check in with MindMate 3 times this week**  

○ **Practice a 5-minute breathing exercise daily**  

○ **Log my mood each evening**  

○ **Write one thing I'm grateful for each day**  

○ **Create my own goal:**  
[Text input]

**Why Small Goals Matter:**  
Small, consistent steps lead to lasting change. We'll celebrate every win along the way.

**Primary Button:**  
Set My First Goal

---

# 9. COMPLETION & FIRST SESSION

---

## Screen 9.1: Onboarding Complete

### Copy

**Headline:**  
## You're All Set!

**Body Text:**  
Welcome to MindMate, [Name]. You've taken an important step toward better mental wellness.

**What You've Set Up:**
✓ Your wellness profile  
✓ Your companion, [Avatar Name]  
✓ Your voice preferences  
✓ Your goals and focus areas  
✓ Your notification settings

**Remember:**
- MindMate is here 24/7, whenever you need support
- Your conversations are private and secure
- You can update any of these settings anytime
- Seeking professional help is always a valid and important choice

**Primary Button:**  
Start My First Session

**Secondary Link:**  
Review my settings

---

## Screen 9.2: First Session Prompt

### Copy

**Visual:** Avatar appears with welcoming animation

**Avatar Message:**  
"Hi [Name]! I'm so glad we're starting this journey together. How are you feeling right now?"

**Quick Response Options:**

😊 **Good** — "I'm doing pretty well today"  
😐 **Okay** — "I'm feeling neutral, not great but not bad"  
😔 **Not Great** — "I'm struggling a bit right now"  
😢 **Difficult** — "Today is really hard for me"

**Or type your own response:**  
[Text input field]

**Primary Button:**  
Send Message

---

## Screen 9.3: Crisis Resources (Conditional)

### Copy

**This screen appears if user indicates significant distress or selects crisis-related responses**

**Headline:**  
## We're Here for You

**Body Text:**  
It sounds like you're going through a really difficult time. Please know that you're not alone, and help is available right now.

**Immediate Support:**

🆘 **Crisis Text Line**  
Text HOME to 741741  
Free, 24/7 support via text

📞 **988 Suicide & Crisis Lifeline**  
Call or text 988  
Free, confidential, 24/7

🏥 **Emergency Services**  
Call 911 if you're in immediate danger

**In MindMate:**
- You can continue talking to [Avatar Name]
- Your conversations are private and supportive
- We can help you find additional resources

**Primary Button:**  
Talk to [Avatar Name]

**Secondary Button:**  
View All Crisis Resources

**Crisis Disclaimer:**  
If you're having thoughts of harming yourself or others, please reach out to one of the resources above. Your safety is the most important thing.

---

# 10. TECHNICAL SPECIFICATIONS

---

## Screen States & Logic

### Conditional Screen Flows

```
IF PHQ-9 Question 9 > 0 OR GAD-7 indicates severe anxiety:
    → Show Crisis Resources Screen
    → Log safety flag (internal)
    → Offer immediate support options

IF user declines all data collection:
    → Enable limited mode
    → No conversation history
    → No personalization
    → Basic crisis resources only

IF user skips intake questionnaire:
    → Use default personalization
    → Prompt to complete later (day 3, day 7)
    → Reduced feature set until completed
```

### Progress Tracking

| Section | Screens | Est. Time | Progress % |
|---------|---------|-----------|------------|
| Welcome | 3 | 2 min | 0-10% |
| Privacy & Consent | 4 | 2 min | 10-25% |
| Intake (PHQ-9) | 10 | 3 min | 25-50% |
| Intake (GAD-7) | 8 | 2 min | 50-70% |
| Avatar Setup | 3 | 1 min | 70-80% |
| Voice Setup | 4 | 1 min | 80-90% |
| Goal Setting | 5 | 2 min | 90-100% |

### Accessibility Requirements

- All screens support VoiceOver/TalkBack
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 minimum
- Text scaling support up to 200%
- Reduced motion support for animations
- Screen reader optimized content order

### Error States

**Network Error:**
"We're having trouble connecting. Your progress is saved. Please try again when you have a stable connection."

**Data Save Error:**
"We couldn't save your response. Please try again or skip this step."

**Microphone Permission Denied:**
"Microphone access is needed for voice features. You can enable this in Settings > Privacy > Microphone."

---

## Copy Tone Guidelines

### Voice & Tone Principles

1. **Empathetic, Not Clinical**  
   ❌ "Your depression score indicates moderate severity"  
   ✅ "It sounds like you've been having a tough time lately"

2. **Empowering, Not Prescriptive**  
   ❌ "You must complete this questionnaire"  
   ✅ "This helps us understand how to best support you"

3. **Transparent, Not Alarming**  
   ❌ "WARNING: High suicide risk detected"  
   ✅ "We're glad you shared this. Help is available."

4. **Warm, Not Overly Familiar**  
   ❌ "Hey bestie! Let's fix your mental health!"  
   ✅ "Hi there. I'm here to support you."

5. **Clear, Not Simplistic**  
   ❌ "Feel bad? We help!"  
   ✅ "MindMate provides evidence-based support for your emotional wellbeing"

---

## Localization Notes

### Key Terms for Translation

| English | Context | Notes |
|---------|---------|-------|
| MindMate | Product name | Keep as brand name in most languages |
| Check-in | Regular conversation | Use casual, friendly equivalent |
| Companion | AI role | Avoid "therapist," "doctor," "coach" |
| Crisis | Emergency situation | Use culturally appropriate term |
| Wellness | Overall health | Broader than "mental health" |

### Cultural Considerations

- Adapt crisis resources for each region
- Consider stigma around mental health in copy
- Adjust formality level based on culture
- Use appropriate color symbolism
- Adapt avatar designs for cultural relevance

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial release |
| 1.1 | 2024-02-01 | Added voice calibration section |
| 1.2 | 2024-02-15 | Updated crisis flow language |
| 1.3 | 2024-03-01 | Added accessibility specifications |

---

## Document Information

**Document Owner:** MindMate AI Product Team  
**Last Updated:** 2024  
**Review Cycle:** Quarterly  
**Distribution:** Internal Use Only  

**Related Documents:**
- MindMate AI Design System
- Crisis Response Protocol
- Privacy Policy
- Terms of Service
- Clinical Advisory Guidelines

---

*This document contains production-ready copy for all MindMate AI onboarding screens. All text has been reviewed for clarity, empathy, and compliance with mental health app best practices.*
