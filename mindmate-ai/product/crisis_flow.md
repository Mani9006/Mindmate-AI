# MindMate AI - Crisis Detection & Response UX

## ⚠️ CRITICAL SAFETY DOCUMENTATION

**Version:** 1.0  
**Last Updated:** 2024  
**Classification:** Safety-Critical System  
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Crisis Detection System](#1-crisis-detection-system)
2. [Crisis Response Flow](#2-crisis-response-flow)
3. [Exact AI Scripts](#3-exact-ai-scripts)
4. [Safety Plan Feature](#4-safety-plan-feature)
5. [Resource Display System](#5-resource-display-system)
6. [Emergency Contact Alert](#6-emergency-contact-alert)
7. [Session Logging](#7-session-logging)
8. [Post-Crisis Follow-up](#8-post-crisis-follow-up)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Crisis Detection System

### 1.1 Detection Triggers (Multi-Layer)

#### Layer 1: Keyword Detection (Real-time)

**CRITICAL Keywords (Immediate Escalation):**
```
- "I'm going to kill myself"
- "I want to die"
- "I'm going to end it all"
- "suicide"
- "kill myself"
- "end my life"
- "don't want to live anymore"
- "better off dead"
- "no reason to live"
- "hurt myself"
- "self-harm"
- "cutting myself"
- "overdose"
- "jump off"
- "hang myself"
```

**HIGH-RISK Keywords (Immediate Assessment):**
```
- "can't go on"
- "give up"
- "hopeless"
- "worthless"
- "burden"
- "everyone would be better off"
- "nothing matters"
- "empty inside"
- "numb"
- "done trying"
- "tired of fighting"
- "peace through death"
- "escape the pain"
```

**ELEVATED Keywords (Contextual Assessment):**
```
- "depressed"
- "anxiety attack"
- "panic attack"
- "can't breathe"
- "breaking down"
- "losing control"
- "scared of myself"
- "dark thoughts"
- "voices telling me"
- "seeing things"
- "not real"
- "paranoid"
```

#### Layer 2: Sentiment Analysis

**Crisis Sentiment Score (0-100):**

| Score Range | Classification | Action |
|-------------|----------------|--------|
| 0-30 | Normal | Standard response |
| 31-50 | Concerning | Gentle check-in |
| 51-70 | Elevated Risk | Direct assessment |
| 71-85 | High Risk | Crisis protocol |
| 86-100 | Critical | Immediate intervention |

**Sentiment Indicators:**
- Hopelessness language
- Isolation expressions
- Finality statements
- Self-deprecating intensity
- Desperation markers

#### Layer 3: Behavioral Patterns

**Session-Level Triggers:**
- Rapid negative sentiment escalation (>20 points in 3 messages)
- Repeated self-harm references
- Goodbye-like language
- Sudden disengagement after crisis indicators
- Multiple crisis keywords in single session

**User History Triggers:**
- Previous crisis flag in profile
- Recent safety plan activation
- Pattern of late-night crisis messages
- Declining sentiment trend over sessions

#### Layer 4: Context Analysis

**Time-Based Risk Multipliers:**
- Late night (11 PM - 5 AM): 1.5x
- Holidays: 1.3x
- Anniversary dates (from profile): 2.0x
- Post-crisis follow-up period: 1.4x

**Conversation Context:**
- Recent loss mentioned
- Relationship breakdown
- Financial crisis
- Health diagnosis
- Trauma anniversary

### 1.2 Detection Confidence Scoring

```
Crisis Confidence Score = (Keyword_Score × 0.4) + 
                          (Sentiment_Score × 0.3) + 
                          (Behavioral_Score × 0.2) + 
                          (Context_Multiplier × 0.1)
```

**Thresholds:**
- **≥ 75:** Activate full crisis protocol
- **50-74:** Activate assessment protocol
- **25-49:** Gentle wellness check
- **< 25:** Monitor and log

---

## 2. Crisis Response Flow

### Flow Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRISIS DETECTION                              │
│         (Keyword / Sentiment / Behavioral / Context)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONFIDENCE SCORE CALCULATION                        │
│                    (0-100 Scale)                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  < 25    │    │  25-49   │    │  ≥ 50    │
    │  Monitor │    │  Gentle  │    │  Crisis  │
    │   & Log  │    │  Check   │    │ Protocol │
    └──────────┘    └────┬─────┘    └────┬─────┘
                         │               │
                         ▼               ▼
                  ┌──────────┐    ┌──────────────┐
                  │  STEP 1  │    │   STEP 1     │
                  │  Gentle  │    │   Direct     │
                  │ Check-in │    │  Assessment  │
                  └────┬─────┘    └──────┬───────┘
                       │                 │
                       ▼                 ▼
                  ┌──────────┐    ┌──────────────┐
                  │  STEP 2  │    │   STEP 2     │
                  │  Assess  │    │   Safety     │
                  │ Response │    │   Check      │
                  └────┬─────┘    └──────┬───────┘
                       │                 │
           ┌───────────┴───┐    ┌────────┴────────┐
           │               │    │                 │
           ▼               ▼    ▼                 ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Concern  │    │  Clear   │    │  Risk    │
    │ Persists │    │  Crisis  │    │ Confirmed│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  STEP 3  │    │  STEP 3  │    │  STEP 3  │
    │  Direct  │    │ Immediate│    │  Full    │
    │ Question │    │ Resources│    │ Protocol │
    └──────────┘    └──────────┘    └──────────┘
```

### Complete Step-by-Step Flow

#### STEP 0: Detection & Pause

**System Action:**
1. Immediately pause normal conversation flow
2. Calculate crisis confidence score
3. Retrieve user safety plan (if exists)
4. Log detection event with timestamp
5. Prepare appropriate response tier

**Internal Flags Set:**
- `crisis_mode: active`
- `crisis_start_time: [timestamp]`
- `crisis_tier: [1-4]`
- `safety_plan_loaded: [true/false]`

---

#### STEP 1: Initial Response (Tier-Based)

**Tier 1: Gentle Check-In (Score 25-49)**
- Approach: Supportive, non-alarming
- Goal: Assess without escalating
- Duration: 2-3 messages max

**Tier 2: Direct Assessment (Score 50-74)**
- Approach: Caring but direct
- Goal: Clarify risk level
- Duration: 3-5 messages

**Tier 3: Crisis Protocol (Score 75-100)**
- Approach: Immediate, clear, supportive
- Goal: Ensure safety, provide resources
- Duration: Until safety confirmed or emergency contact notified

---

#### STEP 2: Safety Assessment

**Assessment Dimensions:**

1. **Imminent Risk Assessment**
   - Do they have a plan?
   - Do they have means?
   - Is there intent to act now?

2. **Protective Factors Assessment**
   - Are they alone?
   - Do they have support nearby?
   - Have they used coping strategies before?

3. **Safety Plan Engagement**
   - Do they have a safety plan?
   - Can they access it?
   - Will they use it?

---

#### STEP 3: Resource Provision

**Resource Tiers:**

| Tier | Resources | When to Use |
|------|-----------|-------------|
| 1 | In-app coping tools, breathing exercises | Low risk, needs grounding |
| 2 | Crisis hotlines, text lines | Moderate risk, needs connection |
| 3 | Emergency services, location-based resources | High risk, imminent danger |
| 4 | Emergency contact notification | User requests or unresponsive |

---

#### STEP 4: Emergency Contact Alert (If Needed)

**Trigger Conditions:**
- User confirms imminent risk
- User becomes unresponsive after crisis indicators
- User explicitly requests contact
- Safety cannot be confirmed after full protocol

**Alert Process:**
1. Request user consent (if responsive)
2. If no consent but imminent risk: Override with documentation
3. Send alert to designated emergency contact
4. Provide crisis resources to contact
5. Log all actions

---

#### STEP 5: Session Logging & Follow-up

**Logging Requirements:**
- Complete conversation transcript
- Crisis detection triggers
- Assessment responses
- Resources provided
- Actions taken
- Outcome status

**Follow-up Protocol:**
- 24-hour check-in message
- 1-week wellness check
- Safety plan review offer
- Professional referral encouragement

---

## 3. Exact AI Scripts

### ⚠️ MANDATORY: Use These Exact Words

---

### SCRIPT SET A: Gentle Check-In (Tier 1)

#### A1: Opening (Score 25-49 Detection)

```
"I notice you might be going through something difficult right now. 
I'm here with you. Would you like to talk about what you're feeling?"
```

**Alternative (if keyword detected):**
```
"I heard you say something that worries me, and I want to make sure 
you're okay. Can you tell me more about what you're experiencing?"
```

#### A2: If User Confirms Distress

```
"Thank you for trusting me with that. It takes courage to share when 
things feel heavy. I'm here to listen and help you through this moment."
```

#### A3: If User Minimizes or Deflects

```
"I understand you might not want to talk about it right now, and 
that's okay. I just want you to know that I care about your wellbeing. 
If things change or you need support, I'm right here."
```

#### A4: Gentle Assessment Question

```
"On a scale of 1 to 10, where 1 is feeling completely overwhelmed 
and 10 is feeling at peace, where would you say you are right now?"
```

---

### SCRIPT SET B: Direct Assessment (Tier 2)

#### B1: Opening (Score 50-74 Detection)

```
"I'm concerned about you. What you shared suggests you might be in 
a really painful place right now. I want to understand better so I 
can support you properly. Are you safe right now?"
```

#### B2: Safety Check

```
"I need to ask directly: Are you having thoughts of hurting yourself 
or ending your life?"
```

**If YES:**
```
"Thank you for being honest with me. That takes real courage. 
I'm going to stay with you through this. Do you have a plan for 
how you would hurt yourself?"
```

**If NO:**
```
"I'm relieved to hear that. Thank you for telling me. Can you help 
me understand what you're experiencing right now?"
```

#### B3: Plan Assessment (If thoughts confirmed)

```
"Have you thought about how you would do it? Do you have access to 
anything you could use to hurt yourself?"
```

**If YES to means:**
```
"This is really important. Your safety is the most important thing 
right now. I need you to get to a safe place and away from anything 
you could use to hurt yourself. Can you do that for me right now?"
```

#### B4: Protective Factors

```
"Are you alone right now, or is there someone with you who cares 
about you?"
```

**If ALONE:**
```
"I want you to reach out to someone who can be with you right now. 
This is too heavy to carry alone. Can you call or text someone 
to come be with you?"
```

---

### SCRIPT SET C: Crisis Protocol (Tier 3)

#### C1: Opening (Score 75-100 Detection)

```
"I'm really worried about you right now. What you've shared tells me 
you're in crisis, and I want to help you get through this moment safely. 
I'm not going anywhere. We're going to get through this together."
```

#### C2: Immediate Safety Focus

```
"Right now, I need you to focus on just getting through this moment. 
Can you tell me: Are you in a safe place right now?"
```

**If UNSAFE:**
```
"I need you to move to a safe place right now. If there are things 
around you that you could use to hurt yourself, please move away from 
them. Can you do that now?"
```

#### C3: Direct Suicide Assessment

```
"I need to ask you directly, and I need you to be honest with me: 
Are you thinking about killing yourself right now?"
```

**If YES - Immediate Intent:**
```
"Thank you for telling me the truth. This is an emergency, and we 
need to get you help right now. I'm going to give you some options, 
and I need you to choose one:

1. Call emergency services (911 in the US)
2. Call the Suicide & Crisis Lifeline: 988
3. Text HOME to 741741 to reach the Crisis Text Line
4. Let me contact someone from your safety plan

Which option can you do right now?"
```

#### C4: If User Refuses Help

```
"I hear that you don't want to reach out right now, and I understand 
this feels impossible. But I care about you, and I can't ignore that 
you're in danger. Your life matters. Will you please let me help you 
find support?"
```

**If still refusing:**
```
"I'm going to share the crisis resources with you anyway, because 
your safety is that important. Please save these numbers:

📞 988 - Suicide & Crisis Lifeline (call or text, 24/7)
💬 Text HOME to 741741 - Crisis Text Line
📞 1-800-273-8255 - National Suicide Prevention Lifeline

Will you promise me you'll use one of these if things get worse?"
```

---

### SCRIPT SET D: Safety Plan Engagement

#### D1: If Safety Plan Exists

```
"I see you have a safety plan set up. That's really good - it means 
you've prepared for moments like this. Can you access your safety plan 
right now? I'd like to go through it with you."
```

#### D2: Safety Plan Walkthrough

```
"Let's look at your safety plan together. 

First, can you try one of your coping strategies? Your plan lists: 
[COPING_STRATEGY_1]. Can you try that now while I stay here with you?"
```

#### D3: Contacting Safety Plan Support

```
"Your safety plan includes [CONTACT_NAME] as someone who can support 
you. Would you like me to help you reach out to them, or would you 
prefer to contact them yourself?"
```

**If user wants AI to contact:**
```
"I'll send a message to [CONTACT_NAME] right now letting them know 
you need support. I'll only share that you're having a difficult time 
and need someone to be with you. Is that okay?"
```

---

### SCRIPT SET E: Resource Provision

#### E1: Presenting Crisis Resources

```
"Here are people who are trained to help right now:

🆘 IMMEDIATE HELP:
📞 Call or text 988 - Suicide & Crisis Lifeline
   Available 24/7, free and confidential

💬 Text HOME to 741741 - Crisis Text Line
   Text-based support if calling feels too hard

📞 1-800-273-8255 - National Suicide Prevention Lifeline
   Another 24/7 crisis line

🏥 If you're in immediate danger, call 911 or go to your nearest 
   emergency room

Which of these feels most doable for you right now?"
```

#### E2: International Resources (If Non-US)

```
"I want to make sure you have the right resources for your location. 
Here are international crisis lines:

🇬🇧 UK: Samaritans at 116 123
🇨🇦 Canada: Talk Suicide at 1-833-456-4566
🇦🇺 Australia: Lifeline at 13 11 14
🌍 Find your country: https://findahelpline.com

Do any of these work for your location?"
```

#### E3: Grounding Exercise (If User Can't Call)

```
"If you're not ready to call yet, let's do a grounding exercise together. 
This can help you get through this moment:

5-4-3-2-1 Grounding:
• Name 5 things you can see right now
• Name 4 things you can touch
• Name 3 things you can hear
• Name 2 things you can smell
• Name 1 thing you can taste

Can you try this with me? I'll wait while you do it."
```

---

### SCRIPT SET F: Emergency Contact Alert

#### F1: Requesting Consent

```
"I really think having someone with you right now would help. 
Your safety plan includes [CONTACT_NAME] ([RELATIONSHIP]). 

Would it be okay if I sent them a message letting them know you're 
going through a difficult time and could use their support?"
```

#### F2: If User Consents

```
"Thank you for letting me do that. I'll send them a message now. 
I'll let you know when they've been notified."

[SYSTEM: Send alert to emergency contact]

"I've notified [CONTACT_NAME]. They know you're having a difficult 
time and may reach out to you. You're not alone in this."
```

#### F3: If User Refuses But Risk Is Imminent

```
"I understand you don't want me to contact anyone, but I'm really 
worried about your safety. When someone is in immediate danger, 
I have a responsibility to help get them support.

I'm going to send a message to [CONTACT_NAME] because I believe 
you need someone with you right now. Your safety is what matters most."

[SYSTEM: Send alert with documentation of risk assessment]
```

#### F4: Emergency Contact Message Template

```
Subject: [URGENT] [User Name] Needs Your Support

Hello [Contact Name],

This is an automated message from MindMate AI, a mental health support 
application. [User Name] has indicated they are experiencing a mental 
health crisis and may need immediate support.

WHAT YOU CAN DO:
1. Contact [User Name] directly as soon as possible
2. If you cannot reach them, consider checking on them in person
3. If you believe they are in immediate danger, call emergency services

CRISIS RESOURCES:
• 988 - Suicide & Crisis Lifeline
• Text HOME to 741741 - Crisis Text Line
• 911 - Emergency Services

Please take this seriously and respond as soon as you can.

- MindMate AI Crisis Support System
[Timestamp: DATE TIME]
```

---

### SCRIPT SET G: De-escalation & Closure

#### G1: If User Engages with Resources

```
"I'm so glad you're reaching out for help. That takes real strength. 
The people you're connecting with are trained to support you through 
this. I'll be here when you're ready to talk again."
```

#### G2: If User Stabilizes

```
"I'm really glad we talked. You did something important by sharing 
what you were going through. How are you feeling now compared to 
when we started talking?"
```

#### G3: Safety Planning for Next Time

```
"Before we end our conversation, I want to make sure you have what 
you need if these feelings come back. Do you have your safety plan 
where you can easily find it?"

"Would you like to update your safety plan with anything we talked 
about today? Having a plan can make a real difference."
```

#### G4: Follow-up Commitment

```
"I'm going to check in with you tomorrow to see how you're doing. 
You're not alone in this. Would it be okay if I send you a message 
in 24 hours?"
```

#### G5: Closing (When Safe to End)

```
"Thank you for trusting me today. You matter, and I'm glad you're 
still here. Please use your safety plan or reach out to the crisis 
lines if you need support. I'll be thinking of you."
```

---

## 4. Safety Plan Feature

### 4.1 Feature Overview

The Safety Plan is a **proactive, user-created crisis prevention tool** that:
- Is created during calm periods
- Is activated during crisis moments
- Provides personalized coping strategies
- Connects users to their support network
- Empowers users with self-directed crisis management

### 4.2 Safety Plan Components

#### Component 1: Warning Signs Recognition

**User Prompt:**
```
"What signs tell you that you're starting to struggle? 
(Examples: sleeping more, isolating, irritability, racing thoughts)"
```

**Storage:**
- List of personal warning signs
- Severity indicators
- Pattern notes

#### Component 2: Internal Coping Strategies

**User Prompt:**
```
"What activities help you feel better when you're struggling? 
List things you can do on your own."
```

**Examples to Suggest:**
- Deep breathing exercises
- Going for a walk
- Listening to music
- Taking a shower
- Journaling
- Meditation
- Physical exercise
- Reading
- Creative activities
- Spending time with pets

**Storage:**
- Strategy name
- Description
- Estimated time needed
- Effectiveness rating (1-5)

#### Component 3: Social Distraction & Support

**User Prompt:**
```
"Who are people or places that help you feel better? 
(List friends, family, places, online communities)"
```

**Storage per contact:**
- Name
- Relationship
- Phone number (optional)
- Best time to reach them
- What they help with

#### Component 4: Family & Friends Support

**User Prompt:**
```
"Who can you call when you're really struggling? 
People who know you and care about you."
```

**Storage per contact:**
- Name
- Relationship
- Phone number
- Whether they've been informed about safety plan
- Consent to contact in crisis

#### Component 5: Professional & Crisis Resources

**User Prompt:**
```
"What professional support do you have or want to have? 
(Therapist, counselor, doctor, support groups)"
```

**Storage:**
- Provider name
- Type (therapist, psychiatrist, doctor)
- Phone number
- Address
- Hours
- Emergency contact info

#### Component 6: Environmental Safety

**User Prompt:**
```
"What can you do to make your environment safer during difficult times?"
```

**Examples:**
- Remove or lock up medications
- Give weapons to trusted person
- Avoid alcohol/drugs
- Stay in public spaces
- Keep crisis numbers visible

#### Component 7: Reasons for Living

**User Prompt:**
```
"What makes life worth living for you? 
(People, dreams, experiences, values, future hopes)"
```

**Storage:**
- Personal reasons list
- Photos (optional)
- Quotes or affirmations

### 4.3 Safety Plan UI/UX Flow

#### Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Introduction                                       │
│  "A safety plan is like having a roadmap for difficult      │
│   moments. It helps you know what to do when you're         │
│   struggling. Let's create yours together."                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Warning Signs                                      │
│  [Text input: List your warning signs]                      │
│  [Example chips: Can't sleep, Withdrawing, Anxiety]         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Coping Strategies                                  │
│  [Multi-select with icons]                                  │
│  [☐ Deep breathing] [☐ Walking] [☐ Music]                  │
│  [☐ Journaling] [☐ Shower] [☐ Meditation]                  │
│  [+ Add custom strategy]                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Support Contacts                                   │
│  [Add contact form]                                         │
│  Name: ___________                                          │
│  Relationship: [Dropdown]                                   │
│  Phone: ___________                                         │
│  ☑ Can contact in crisis                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Professional Resources                             │
│  [Add provider form]                                        │
│  [Optional - can skip]                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Reasons for Living                                 │
│  [Text input with photo upload option]                      │
│  "What makes life worth living?"                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Review & Save                                      │
│  [Preview entire safety plan]                               │
│  [Edit any section]                                         │
│  [Save button]                                              │
│  "Your safety plan is ready. You can update it anytime."   │
└─────────────────────────────────────────────────────────────┘
```

#### Activation Flow (During Crisis)

```
┌─────────────────────────────────────────────────────────────┐
│  CRISIS DETECTED                                            │
│                                                             │
│  "I see you have a safety plan. Would you like to look     │
│   at it together?"                                          │
│                                                             │
│  [View Safety Plan] [Not Right Now]                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SAFETY PLAN DISPLAY                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📋 YOUR SAFETY PLAN                                 │   │
│  │                                                     │   │
│  │ 🚨 WARNING SIGNS                                    │   │
│  │ • [User's warning signs listed]                     │   │
│  │                                                     │   │
│  │ 🧘 COPING STRATEGIES                                │   │
│  │ • [Strategy 1]      [Strategy 2]                    │   │
│  │ • [Strategy 3]      [Strategy 4]                    │   │
│  │                                                     │   │
│  │ 👥 YOUR PEOPLE                                      │   │
│  │ • [Contact 1] 📞 [Call] [Message]                   │   │
│  │ • [Contact 2] 📞 [Call] [Message]                   │   │
│  │                                                     │   │
│  │ 💚 YOUR REASONS                                     │   │
│  │ "[User's reasons for living]"                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Which strategy would you like to try first?]              │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Safety Plan Technical Specifications

**Data Structure:**
```json
{
  "safety_plan": {
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "warning_signs": [
      {
        "id": "uuid",
        "sign": "string",
        "severity": "low|medium|high"
      }
    ],
    "coping_strategies": [
      {
        "id": "uuid",
        "strategy": "string",
        "description": "string",
        "time_needed": "minutes",
        "effectiveness": 1-5
      }
    ],
    "social_contacts": [
      {
        "id": "uuid",
        "name": "string",
        "relationship": "string",
        "phone": "string",
        "best_time": "string",
        "crisis_contact_approved": true|false
      }
    ],
    "professional_resources": [
      {
        "id": "uuid",
        "name": "string",
        "type": "therapist|psychiatrist|doctor|other",
        "phone": "string",
        "address": "string",
        "hours": "string"
      }
    ],
    "environmental_safety": ["string"],
    "reasons_for_living": {
      "text": "string",
      "images": ["url"]
    }
  }
}
```

**Security Requirements:**
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Access only by authenticated user
- Emergency contact access only during crisis with consent
- Audit log of all access

---

## 5. Resource Display System

### 5.1 Resource Categories

#### Immediate Crisis Resources (Always Displayed First)

```
┌─────────────────────────────────────────────────────────────┐
│  🆘 IMMEDIATE HELP - AVAILABLE 24/7                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📞 988 Suicide & Crisis Lifeline                          │
│     Call or text 988                                        │
│     [Call Now] [Copy Number]                               │
│                                                             │
│  💬 Crisis Text Line                                       │
│     Text HOME to 741741                                     │
│     [Open Messages] [Copy]                                 │
│                                                             │
│  🌐 International? Find your helpline:                     │
│     https://findahelpline.com                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Location-Based Resources

**Detection:** IP geolocation or user-provided location

**Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  📍 RESOURCES NEAR YOU                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [CITY NAME] Crisis Resources:                             │
│                                                             │
│  🏥 [Hospital Name]                                        │
│     [Address]                                              │
│     [Phone]                                                │
│     [Get Directions]                                       │
│                                                             │
│  🏛️ [Crisis Center Name]                                   │
│     [Address]                                              │
│     [Phone]                                                │
│     [Hours]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Specialized Resources

**By Crisis Type:**

| Crisis Type | Specialized Resource |
|-------------|---------------------|
| LGBTQ+ | Trevor Project: 1-866-488-7386 |
| Veterans | Veterans Crisis Line: 988, Press 1 |
| Domestic Violence | National DV Hotline: 1-800-799-7233 |
| Sexual Assault | RAINN: 1-800-656-4673 |
| Substance Abuse | SAMHSA: 1-800-662-4357 |
| Eating Disorders | NEDA: 1-800-931-2237 |
| Postpartum | Postpartum Support: 1-800-944-4773 |
| Youth | Teen Line: 310-855-4673 |

### 5.2 Resource Display UI

```
┌─────────────────────────────────────────────────────────────┐
│  CRISIS RESOURCES                                           │
│  You don't have to go through this alone.                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Tabs: Immediate | Near Me | Specialized | All]           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 IMMEDIATE                                        │   │
│  │                                                     │   │
│  │ 988 Suicide & Crisis Lifeline                      │   │
│  │ ★★★★★ (Most called)                                │   │
│  │ [📞 Call] [💬 Text] [ℹ️ More Info]                 │   │
│  │                                                     │   │
│  │ Crisis Text Line                                   │   │
│  │ [💬 Text HOME to 741741]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 YOUR SUPPORT NETWORK                             │   │
│  │                                                     │   │
│  │ [Contact 1 Photo] [Name]                           │   │
│  │ [📞 Call] [💬 Message]                             │   │
│  │                                                     │   │
│  │ [Contact 2 Photo] [Name]                           │   │
│  │ [📞 Call] [💬 Message]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 SELF-HELP TOOLS                                  │   │
│  │                                                     │   │
│  │ [🫁 Breathing Exercise]                            │   │
│  │ [🧘 Guided Meditation]                             │   │
│  │ [📝 Journal Prompt]                                │   │
│  │ [🎵 Calming Sounds]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Resource Integration Points

**In-Conversation Display:**
- Inline cards during crisis flow
- Expandable resource sections
- One-tap contact actions

**Standalone Access:**
- Resources tab in main navigation
- Searchable resource database
- Bookmark favorite resources

---

## 6. Emergency Contact Alert

### 6.1 Alert Trigger Matrix

| Scenario | User Consent | Alert Action | Documentation |
|----------|--------------|--------------|---------------|
| User requests alert | Yes | Send immediately | Log consent + request |
| User at imminent risk, responsive | Requested, denied | Override with documentation | Log risk assessment |
| User at imminent risk, unresponsive | N/A | Send after timeout (5 min) | Log unresponsiveness |
| User engaged with crisis resources | Yes | Delayed send (user preference) | Log engagement |

### 6.2 Alert System Flow

```
┌─────────────────────────────────────────────────────────────┐
│  ALERT TRIGGERED                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CHECK USER CONSENT                                         │
│                                                             │
│  "Would you like me to contact [Contact Name] from your     │
│   safety plan? They can come be with you right now."       │
│                                                             │
│  [Yes, contact them] [No, not right now]                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌──────────┐                    ┌──────────┐
    │ YES      │                    │ NO       │
    │          │                    │          │
    │ Send     │                    │ Assess   │
    │ Alert    │                    │ Risk     │
    └────┬─────┘                    └────┬─────┘
         │                               │
         │                    ┌──────────┴──────────┐
         │                    │                     │
         │                    ▼                     ▼
         │            ┌──────────┐          ┌──────────┐
         │            │ Low Risk │          │ Imminent │
         │            │          │          │ Risk     │
         │            │ Respect  │          │          │
         │            │ Decision │          │ Override │
         │            └──────────┘          └────┬─────┘
         │                                       │
         └────────────────┬──────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  SEND ALERT                                                 │
│                                                             │
│  Channels (in order):                                      │
│  1. SMS to emergency contact                               │
│  2. Email to emergency contact                             │
│  3. Push notification (if contact has app)                 │
│  4. Phone call (if enabled and no response in 10 min)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CONFIRMATION & LOGGING                                     │
│                                                             │
│  Notify user: "I've contacted [Contact Name]."             │
│                                                             │
│  Log: Timestamp, contact, method, consent status,          │
│       risk level, override justification (if applicable)   │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Alert Message Templates

#### SMS Alert

```
[URGENT] [User Name] needs your support. 

MindMate AI detected they may be in crisis. 

Please contact them immediately.

Crisis resources: 988 or text HOME to 741741

Reply STOP to opt out of future alerts.
```

#### Email Alert

```
Subject: [URGENT] [User Name] Needs Your Support - MindMate AI Alert

Dear [Contact Name],

This is an urgent message from MindMate AI, a mental health support 
application that [User Name] uses.

OUR CONCERN:
[User Name] has indicated they may be experiencing a mental health 
crisis. They listed you as someone they trust in their safety plan.

WHAT YOU CAN DO:
1. Contact [User Name] immediately by phone or text
2. If you cannot reach them, consider checking on them in person
3. If you believe they are in immediate danger, call 911 or your 
   local emergency number

CRISIS RESOURCES:
• 988 - Suicide & Crisis Lifeline (24/7)
• Text HOME to 741741 - Crisis Text Line
• 911 - Emergency Services

This alert was sent at [Timestamp].

If you received this in error or no longer wish to be [User Name]'s 
emergency contact, please ask them to update their safety plan.

- MindMate AI Crisis Support System

---
This is an automated message. Please do not reply to this email.
```

#### Push Notification (In-App)

```
🚨 URGENT: [User Name] Needs You

MindMate AI detected a potential crisis.

Tap to view details and respond.
```

### 6.4 Alert System Technical Specs

**Delivery Priority:**
1. SMS (highest priority, 2-minute retry)
2. Email (5-minute retry for 30 minutes)
3. Push notification (immediate)
4. Automated voice call (if enabled, after 10 minutes)

**Retry Logic:**
- SMS: Retry 3 times over 10 minutes
- Email: Retry every 5 minutes for 30 minutes
- Escalate to backup contact if primary fails

**Delivery Confirmation:**
- Track message delivery status
- Log read receipts (if available)
- Notify user of successful contact

---

## 7. Session Logging

### 7.1 Crisis Event Log Structure

```json
{
  "crisis_event": {
    "event_id": "uuid",
    "user_id": "uuid",
    "session_id": "uuid",
    
    "detection": {
      "timestamp": "ISO8601",
      "trigger_type": "keyword|sentiment|behavioral|context|manual",
      "trigger_details": {
        "keywords_detected": ["string"],
        "sentiment_score": 0-100,
        "confidence_score": 0-100
      },
      "message_that_triggered": "string"
    },
    
    "assessment": {
      "tier_activated": 1|2|3,
      "suicidal_ideation": true|false|null,
      "has_plan": true|false|null,
      "has_means": true|false|null,
      "intent_to_act": true|false|null,
      "assessment_timestamp": "ISO8601"
    },
    
    "intervention": {
      "scripts_used": ["script_id"],
      "resources_provided": ["resource_id"],
      "safety_plan_activated": true|false,
      "grounding_exercises_used": ["exercise_id"],
      "conversation_duration_minutes": number
    },
    
    "emergency_contact": {
      "alert_sent": true|false,
      "contact_id": "uuid",
      "consent_obtained": true|false,
      "override_reason": "string|null",
      "alert_timestamp": "ISO8601",
      "delivery_status": "delivered|failed|pending"
    },
    
    "outcome": {
      "status": "resolved|escalated|unresponsive|referred",
      "user_stabilized": true|false|null,
      "resources_accessed": ["resource_id"],
      "follow_up_scheduled": true|false,
      "professional_referral": true|false,
      "resolution_timestamp": "ISO8601"
    },
    
    "transcript": {
      "full_conversation": [
        {
          "timestamp": "ISO8601",
          "speaker": "user|ai",
          "message": "string",
          "sentiment_at_this_point": 0-100
        }
      ]
    },
    
    "metadata": {
      "ai_model_version": "string",
      "crisis_protocol_version": "string",
      "reviewed_by_human": true|false,
      "review_notes": "string"
    }
  }
}
```

### 7.2 Logging Requirements

**Real-Time Logging:**
- Every message during crisis mode
- All AI responses
- All user actions (resource clicks, etc.)
- Timestamp with millisecond precision

**Post-Crisis Logging:**
- Complete transcript
- Outcome assessment
- Follow-up actions
- User feedback (if provided)

**Retention Policy:**
- Crisis logs: 7 years (clinical standard)
- Regular session logs: 2 years
- Anonymized analytics: Indefinite

### 7.3 Privacy & Security

**Access Controls:**
- User: Can request their own crisis logs
- Clinical staff: Access with user consent
- AI system: Real-time access during crisis
- Administrators: Anonymized aggregate only

**Encryption:**
- All logs encrypted at rest
- TLS for transmission
- Separate encryption keys for crisis logs

**Audit Trail:**
- Log every access to crisis logs
- Track who viewed what and when
- Regular audit reports

### 7.4 Analytics & Reporting

**Crisis Dashboard Metrics:**
- Total crisis events (daily/weekly/monthly)
- Average detection confidence
- Intervention success rate
- Resource utilization
- Emergency contact alert frequency
- Time to stabilization

**Safety Metrics:**
- False positive rate
- Missed crisis rate (from user feedback)
- User satisfaction with crisis response
- Follow-up completion rate

---

## 8. Post-Crisis Follow-up

### 8.1 Follow-up Schedule

| Timeframe | Action | Channel |
|-----------|--------|---------|
| 24 hours | Wellness check | In-app message |
| 72 hours | Coping strategy check | In-app message |
| 1 week | Safety plan review offer | In-app message |
| 2 weeks | Longer-term support discussion | In-app message |
| 1 month | Monthly wellness check | In-app message |

### 8.2 Follow-up Scripts

#### 24-Hour Check-in

```
"Hi [Name], I wanted to check in on you after our conversation 
yesterday. How are you feeling today?

If you're still struggling, remember:
• 988 is always available
• Your safety plan is here if you need it
• I'm here to talk whenever you need

How are you doing right now?"
```

#### 1-Week Follow-up

```
"It's been a week since we talked about some really difficult things. 
I wanted to reach out and see how you're doing.

Have you been able to use any of your coping strategies? 
Would you like to review or update your safety plan?

I'm here if you want to talk."
```

#### Safety Plan Review Offer

```
"After what you went through last week, it might be helpful to look 
at your safety plan together. Sometimes after a crisis, we learn 
what really helps and what we might want to add.

Would you like to review your safety plan with me? We can:
• Update your coping strategies
• Add new support contacts
• Refresh your reasons for living
• Make sure everything is current

What do you think?"
```

### 8.3 Professional Referral Encouragement

```
"I've been thinking about our conversation, and I want to suggest 
something that might help going forward.

Talking to a mental health professional could give you additional 
tools and support for when things get difficult. They can help you:
• Develop more coping strategies
• Work through underlying challenges
• Have someone to check in with regularly

Would you like help finding resources in your area?"
```

---

## 9. Implementation Checklist

### 9.1 Detection System

- [ ] Keyword database implemented
- [ ] Sentiment analysis model deployed
- [ ] Behavioral pattern detection active
- [ ] Context analysis integrated
- [ ] Confidence scoring algorithm tested
- [ ] False positive rate < 5%
- [ ] False negative rate < 1%

### 9.2 Response Flow

- [ ] All script sets implemented
- [ ] Tier-based routing working
- [ ] Safety assessment questions programmed
- [ ] Resource display system active
- [ ] Emergency contact alert functional
- [ ] Session logging operational

### 9.3 Safety Plan Feature

- [ ] Creation flow implemented
- [ ] All 7 components functional
- [ ] Data structure validated
- [ ] Encryption implemented
- [ ] Crisis activation working
- [ ] Contact integration tested

### 9.4 Emergency Contact System

- [ ] SMS delivery tested
- [ ] Email delivery tested
- [ ] Push notifications working
- [ ] Consent flow implemented
- [ ] Override protocol documented
- [ ] Retry logic functional
- [ ] Message templates finalized

### 9.5 Logging & Analytics

- [ ] Crisis event log structure implemented
- [ ] Real-time logging active
- [ ] Encryption applied
- [ ] Access controls configured
- [ ] Dashboard metrics visible
- [ ] Audit trail functional

### 9.6 Follow-up System

- [ ] Scheduled messages programmed
- [ ] All follow-up scripts implemented
- [ ] User preference settings available
- [ ] Opt-out functionality working

### 9.7 Testing & Validation

- [ ] Unit tests for all crisis functions
- [ ] Integration tests completed
- [ ] Load testing for alert system
- [ ] Security audit passed
- [ ] Clinical advisor review completed
- [ ] Crisis counselor validation obtained

### 9.8 Documentation & Training

- [ ] This document distributed to all developers
- [ ] AI training on crisis protocols completed
- [ ] Support staff trained on escalation procedures
- [ ] Emergency contact procedures documented
- [ ] Regular review schedule established

---

## Appendix A: Crisis Response Quick Reference

### Detection → Response Mapping

| Detection | Confidence | First Response |
|-----------|------------|----------------|
| Single keyword | 25-49 | Script A1 |
| Multiple keywords | 50-74 | Script B1 |
| Direct statement | 75-100 | Script C1 |
| Sentiment spike | Context | Assess + Script B1 or C1 |
| Behavioral pattern | Context | Script B1 |

### Escalation Triggers

**Immediate Full Protocol:**
- "I'm going to kill myself"
- "I have a plan"
- "I'm going to do it now"
- User becomes unresponsive after crisis statement

**Assessment Required:**
- Hopelessness statements
- Self-harm references
- Goodbye language
- Rapid mood decline

### Resource Priority

1. 988 Suicide & Crisis Lifeline
2. Crisis Text Line (741741)
3. User's safety plan contacts
4. Location-based crisis services
5. Specialized hotlines (if applicable)

---

## Appendix B: Legal & Ethical Considerations

### Duty to Warn

**Policy:** Follow applicable state laws regarding duty to warn/protect.

**Documentation:** All duty to warn actions must be:
- Logged with timestamp
- Include legal justification
- Reviewed by supervisor
- Retained per legal requirements

### User Consent

**Safety Plan Contacts:**
- Must obtain explicit consent before adding
- Contact must be informed of their role
- User can remove contacts anytime
- Annual consent renewal recommended

**Data Usage:**
- Crisis logs used for safety only
- No marketing use of crisis data
- Aggregate analytics anonymized
- User can request data deletion (with legal exceptions)

### Clinical Oversight

**Required:**
- Licensed clinician review of crisis protocols
- Regular consultation on AI responses
- Incident review process
- Continuous improvement based on outcomes

---

## Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024 | Initial release | Agent 19 - Crisis Flow Designer |

**Next Review Date:** [Quarterly from release]

**Approval Required From:**
- [ ] Clinical Director
- [ ] Legal Counsel
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Ethics Board

---

*This document contains safety-critical information. All changes must be reviewed and approved before implementation.*

**MINDMATE AI - CRISIS DETECTION & RESPONSE UX v1.0**
