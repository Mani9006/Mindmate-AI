# MindMate AI - Subscription & Paywall Flows
## Complete Monetization UX Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Subscription Tier Structure](#subscription-tier-structure)
3. [Feature Gating & Paywall Placement](#feature-gating--paywall-placement)
4. [Upgrade Prompt Design](#upgrade-prompt-design)
5. [Trial Experience](#trial-experience)
6. [Pricing Page Copy](#pricing-page-copy)
7. [Subscription Management Screens](#subscription-management-screens)
8. [Upgrade Prompt Copy Library](#upgrade-prompt-copy-library)
9. [Email Communications](#email-communications)
10. [Analytics & Tracking](#analytics--tracking)

---

## Executive Summary

This document defines the complete subscription monetization strategy for MindMate AI, including four subscription tiers, strategic paywall placement, upgrade flows, and subscription management experiences. The design prioritizes:

- **Value-first approach**: Users experience core value before hitting paywalls
- **Contextual upgrades**: Upgrade prompts appear at moments of need
- **Frictionless trials**: 7-day free trial with full feature access
- **Transparent pricing**: Clear feature differentiation and pricing
- **Easy management**: Simple upgrade, downgrade, cancel, and pause flows

---

## Subscription Tier Structure

### Overview

| Tier | Price | Billing | Target User | Value Proposition |
|------|-------|---------|-------------|-------------------|
| **Free** | $0 | - | Curious explorers | Experience basic AI therapy features |
| **Core** | $19/mo | Monthly/Annual | Individual users | Personal mental wellness journey |
| **Premium** | $49/mo | Monthly/Annual | Power users | Advanced features + human support |
| **Family** | $79/mo | Monthly/Annual | Households | Up to 6 family members |

### Annual Discount

- **Core Annual**: $190/year (17% savings = 2 months free)
- **Premium Annual**: $490/year (17% savings = 2 months free)
- **Family Annual**: $790/year (17% savings = 2 months free)

### Detailed Feature Matrix

| Feature | Free | Core | Premium | Family |
|---------|:--:|:--:|:--:|:--:|
| **AI Conversations** | | | | |
| Daily message limit | 20/day | Unlimited | Unlimited | Unlimited |
| Conversation history | 7 days | Unlimited | Unlimited | Unlimited |
| Voice conversations | ❌ | ✅ | ✅ | ✅ |
| **Therapy Modes** | | | | |
| Check-in chats | ✅ | ✅ | ✅ | ✅ |
| Guided journaling | 3 entries/wk | Unlimited | Unlimited | Unlimited |
| CBT exercises | Basic only | Full library | Full library | Full library |
| Meditation library | 10 sessions | 100+ sessions | 200+ sessions | 200+ sessions |
| Crisis support | ✅ | ✅ | ✅ | ✅ |
| **Personalization** | | | | |
| AI personality | Standard | Customizable | Customizable | Customizable |
| Mood tracking | 7 days | Unlimited | Unlimited | Unlimited |
| Progress insights | Basic | Advanced | Advanced + Reports | Advanced + Reports |
| Goal setting | 1 active | 5 active | Unlimited | Unlimited |
| **Support** | | | | |
| Community access | ✅ | ✅ | ✅ | ✅ |
| Email support | ❌ | ✅ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| Live therapist chat | ❌ | ❌ | 4 sessions/mo | 8 sessions/mo |
| **Advanced Features** | | | | |
| Custom exercises | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Data export | ❌ | CSV | Full | Full |
| **Family Features** | | | | |
| Member accounts | 1 | 1 | 1 | Up to 6 |
| Family dashboard | ❌ | ❌ | ❌ | ✅ |
| Parental controls | ❌ | ❌ | ❌ | ✅ |
| Shared insights | ❌ | ❌ | ❌ | ✅ |

---

## Feature Gating & Paywall Placement

### Philosophy

Paywalls should appear at **moments of intent** - when users actively want to use a feature, not as barriers to exploration. The free tier provides genuine value while creating natural upgrade moments.

### Paywall Triggers

#### 1. Usage Limit Paywalls

| Limit Type | Free Threshold | Paywall Trigger | Upgrade Message |
|------------|----------------|-----------------|-----------------|
| Daily messages | 20/day | On 21st message | "You've reached your daily limit" |
| Journal entries | 3/week | On 4th attempt | "Unlock unlimited journaling" |
| Meditation access | 10 sessions | On 11th selection | "Explore 200+ meditation sessions" |
| Mood history | 7 days | Viewing older data | "See your complete journey" |
| Goal setting | 1 active | Adding 2nd goal | "Set unlimited goals" |

#### 2. Feature Access Paywalls

| Feature | When Paywall Appears | Preview Experience |
|---------|---------------------|-------------------|
| Voice conversations | First voice button tap | 30-second preview |
| Live therapist chat | First "Talk to Therapist" tap | Modal with therapist intro |
| Custom exercises | "Create Custom" button tap | 3 pre-made examples |
| Advanced insights | Clicking "Detailed Report" | Sample report preview |
| Data export | Export button tap | Sample CSV download |
| API access | API settings click | Documentation preview |

#### 3. Contextual Upgrade Moments

| Context | Trigger | Paywall Style |
|---------|---------|---------------|
| After positive session | Mood improvement detected | Celebration + upgrade suggestion |
| Streak milestone | 7, 14, 30-day streaks | Achievement modal with upgrade |
| Crisis resolution | Post-crisis follow-up | Support upgrade offer |
| Goal completion | Achieving set goal | Success + advanced features tease |
| Time-based | 3 days of consistent use | "Ready to go deeper?" |

### Paywall Modal Design

#### Standard Paywall Modal Structure

```
┌─────────────────────────────────────────┐
│  ✨ Unlock [Feature Name]              │
│                                         │
│  [Feature Icon/Illustration]            │
│                                         │
│  You're currently on the Free plan.     │
│  Upgrade to access:                     │
│                                         │
│  ✓ [Benefit 1]                          │
│  ✓ [Benefit 2]                          │
│  ✓ [Benefit 3]                          │
│                                         │
│  [Start Free Trial - 7 Days]            │
│  [Maybe Later]                          │
│                                         │
│  💡 Compare all plans →                 │
└─────────────────────────────────────────┘
```

#### Paywall Modal Specifications

| Element | Specification |
|---------|--------------|
| Modal size | 480px max-width, centered |
| Animation | Fade in + slight scale (0.95 → 1) |
| Backdrop | 50% opacity black overlay |
| Close option | X button + click outside + ESC |
| Primary CTA | Green (#10B981), full width |
| Secondary CTA | Text link, below primary |
| Trial badge | "7 days free" pill badge on CTA |

---

## Upgrade Prompt Design

### Types of Upgrade Prompts

#### 1. Soft Prompts (Non-blocking)

**Inline Banners**
- Appear at bottom of relevant screens
- Dismissible with X
- Reappear after 7 days if dismissed

**Tooltip Hints**
- Appear on hover/long-press of premium features
- "Upgrade to unlock this feature"
- Link to pricing page

**Progress Indicators**
- Show usage vs. limit
- "15/20 messages used today"
- Upgrade link when >75% used

#### 2. Medium Prompts (Contextual)

**Post-Action Modals**
- After completing free-tier action
- "Want to do more?"
- Show related premium features

**Milestone Celebrations**
- Achievement unlocked + upgrade path
- "You've journaled for 7 days!"
- "Premium users get advanced insights..."

#### 3. Hard Prompts (Blocking)

**Feature Paywalls**
- When attempting premium feature
- Full modal blocking access
- Clear upgrade path

**Limit Reached Screens**
- When hitting usage cap
- Cannot proceed without upgrade
- Alternative: wait for reset

### Upgrade Prompt Flow Diagram

```
User Action
    │
    ▼
┌─────────────────┐
│ Check Feature   │
│ Access Level    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌────────┐
│ Free  │  │ Premium│
│Access │  │ Access │
└───┬───┘  └───┬────┘
    │          │
    ▼          ▼
┌─────────┐  ┌──────────┐
│ Feature │  │ Feature  │
│ Enabled │  │ Enabled  │
└─────────┘  └──────────┘
    │
    ▼
┌─────────────────┐
│ Check Usage     │
│ Limit           │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌────────┐
│ Under │  │ Limit  │
│ Limit │  │Reached │
└───┬───┘  └───┬────┘
    │          │
    ▼          ▼
┌─────────┐  ┌──────────┐
│ Feature │  │ Paywall  │
│ Enabled │  │ Modal    │
└─────────┘  └──────────┘
```

### Smart Prompt Timing

| User Behavior | Prompt Timing | Prompt Type |
|---------------|---------------|-------------|
| New user (<3 days) | No prompts | - |
| Engaged user (3-7 days) | Day 7 | Soft milestone prompt |
| Power user (7+ days) | Day 10 | Medium feature tease |
| Hitting limits | At limit | Hard paywall |
| Returning after 7+ days | On return | "Welcome back" + upgrade |
| Consistent evening use | Day 14 | "Evening ritual" upgrade |

---

## Trial Experience

### Trial Overview

- **Duration**: 7 days
- **Access**: Full Premium features
- **Payment**: Required upfront (authorized, not charged)
- **Conversion**: Auto-converts to paid unless cancelled
- **Reminder**: 2 days before trial ends

### Trial Flow

#### Day 0: Trial Activation

```
┌─────────────────────────────────────────┐
│  🎉 Your 7-Day Free Trial Starts Now!  │
│                                         │
│  You now have access to:                │
│                                         │
│  ✓ Unlimited AI conversations           │
│  ✓ Voice therapy sessions               │
│  ✓ Full meditation library              │
│  ✓ 4 live therapist sessions            │
│  ✓ Advanced progress insights           │
│                                         │
│  [Explore Premium Features]             │
│                                         │
│  Your trial ends: January 15, 2025      │
│  You'll be charged $49 on Jan 16        │
│  (Cancel anytime - no charge today)     │
└─────────────────────────────────────────┘
```

#### Trial Onboarding Checklist

| Day | Action | Purpose |
|-----|--------|---------|
| 0 | Welcome modal | Set expectations |
| 0 | Feature tour | Highlight premium value |
| 1 | First therapist session offer | Drive core value |
| 2 | Progress check-in | Reinforce habit |
| 3 | Voice session prompt | Feature discovery |
| 5 | Trial reminder email | Conversion prep |
| 6 | Final reminder + discount offer | Conversion push |
| 7 | Trial ends | Auto-convert or cancel |

#### Trial Reminder Email (Day 5)

**Subject**: Your MindMate trial ends in 2 days

```
Hi [Name],

Your 7-day Premium trial ends in 2 days.

Here's what you've accomplished:
✓ [X] AI conversations
✓ [X] Journal entries  
✓ [X] Meditation minutes
✓ [X] Mood improvements

Stay on your wellness journey for just $49/month.

[Continue with Premium]
[Explore Other Plans]

Not ready? You can cancel anytime in Settings.

---
Questions? Reply to this email.
```

#### Trial End Experience

**If Converting:**
```
┌─────────────────────────────────────────┐
│  ✓ Welcome to Premium!                 │
│                                         │
│  Your trial has ended and you're now   │
│  subscribed to MindMate Premium.        │
│                                         │
│  Next billing date: February 16, 2025  │
│  Amount: $49.00                         │
│                                         │
│  [View Subscription]                    │
└─────────────────────────────────────────┘
```

**If Cancelling:**
```
┌─────────────────────────────────────────┐
│  😔 We're Sorry to See You Go          │
│                                         │
│  Your Premium access ends today.        │
│                                         │
│  You can still use MindMate Free:       │
│  • 20 messages per day                  │
│  • 3 journal entries per week           │
│  • Basic meditation library             │
│                                         │
│  Changed your mind?                     │
│  [Reactivate with 20% Off]              │
│                                         │
│  We'd love your feedback: [Survey]      │
└─────────────────────────────────────────┘
```

---

## Pricing Page Copy

### Main Pricing Page

#### Header Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         Invest in Your Mental Wellbeing                     │
│                                                             │
│    Start free, upgrade when you're ready.                   │
│    Cancel anytime—no questions asked.                       │
│                                                             │
│         [Monthly] [Annual - Save 17%]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Pricing Cards

**Free Tier Card**
```
┌─────────────────────────────┐
│  Free                       │
│  $0/month                   │
│                             │
│  Perfect for exploring      │
│                             │
│  ✓ 20 AI messages/day       │
│  ✓ Basic therapy modes      │
│  ✓ 10 meditation sessions   │
│  ✓ 7-day mood history       │
│  ✓ Community access         │
│  ✓ Crisis support           │
│                             │
│  [Get Started Free]         │
│                             │
│  No credit card required    │
└─────────────────────────────┘
```

**Core Tier Card (Highlighted)**
```
┌─────────────────────────────┐
│  ★ MOST POPULAR             │
│                             │
│  Core                       │
│  $19/month                  │
│  or $190/year (save $38)    │
│                             │
│  For your personal journey  │
│                             │
│  ✓ Unlimited AI messages    │
│  ✓ Voice conversations      │
│  ✓ Unlimited journaling     │
│  ✓ Full CBT library         │
│  ✓ 100+ meditations         │
│  ✓ Unlimited mood tracking  │
│  ✓ Advanced insights        │
│  ✓ Email support            │
│                             │
│  [Start 7-Day Free Trial]   │
│                             │
│  Cancel anytime             │
└─────────────────────────────┘
```

**Premium Tier Card**
```
┌─────────────────────────────┐
│  Premium                    │
│  $49/month                  │
│  or $490/year (save $98)    │
│                             │
│  Maximum support & growth   │
│                             │
│  Everything in Core, plus:  │
│                             │
│  ✓ 4 therapist sessions/mo  │
│  ✓ 200+ meditations         │
│  ✓ Custom exercises         │
│  ✓ Detailed progress reports│
│  ✓ Priority support         │
│  ✓ Full data export         │
│  ✓ API access               │
│                             │
│  [Start 7-Day Free Trial]   │
│                             │
│  Cancel anytime             │
└─────────────────────────────┘
```

**Family Tier Card**
```
┌─────────────────────────────┐
│  Family                     │
│  $79/month                  │
│  or $790/year (save $158)   │
│                             │
│  Wellness for your whole    │
│  household                  │
│                             │
│  Everything in Premium,     │
│  plus:                      │
│                             │
│  ✓ Up to 6 family members   │
│  ✓ 8 shared therapist       │
│    sessions/month           │
│  ✓ Family dashboard         │
│  ✓ Parental controls        │
│  ✓ Shared insights          │
│  ✓ Individual privacy       │
│                             │
│  [Start 7-Day Free Trial]   │
│                             │
│  Cancel anytime             │
└─────────────────────────────┘
```

#### Pricing Page FAQ

```
Frequently Asked Questions

Q: Can I switch plans later?
A: Yes! You can upgrade, downgrade, or cancel anytime. 
   Changes take effect at your next billing cycle.

Q: What happens after my free trial?
A: You'll be automatically charged for your chosen plan 
   unless you cancel before the trial ends. We'll remind 
   you 2 days before.

Q: Is my data private and secure?
A: Absolutely. All conversations are encrypted end-to-end. 
   We never sell your data. See our Privacy Policy.

Q: Can I get a refund?
A: We offer refunds within 14 days if you're not satisfied. 
   Contact support@mindmate.ai.

Q: What's included in therapist sessions?
A: Live chat sessions with licensed therapists. Sessions 
   are 30 minutes each. Schedule anytime through the app.

Q: How do family accounts work?
A: Each family member gets their own private account. 
   Parents can view aggregated insights and set controls 
   for minors. Individual conversations remain private.
```

#### Pricing Page Trust Signals

```
Trusted by 500,000+ users worldwide

[HIPAA Compliant] [SOC 2 Certified] [End-to-End Encrypted]

"MindMate has transformed my mental health routine."
— Sarah M., Premium member

"Worth every penny for the peace of mind."
— James T., Family plan
```

---

## Subscription Management Screens

### Access Path

**Settings → Subscription → Manage Subscription**

### Current Subscription View

```
┌─────────────────────────────────────────┐
│  ← Settings              Subscription   │
│                                         │
│  Current Plan                           │
│  ┌─────────────────────────────────┐   │
│  │  ★ Premium                      │   │
│  │                                 │   │
│  │  $49/month                      │   │
│  │  Billed monthly                 │   │
│  │                                 │   │
│  │  Next billing: Feb 16, 2025    │   │
│  │  Payment method: •••• 4242      │   │
│  │                                 │   │
│  │  [Change Plan]  [Cancel]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Your Features                          │
│  ✓ Unlimited AI conversations          │
│  ✓ 4 therapist sessions/month          │
│  ✓ Full meditation library             │
│  ✓ Advanced insights                   │
│  ✓ Priority support                    │
│                                         │
│  Usage This Month                       │
│  AI Messages: 1,247 / Unlimited        │
│  Therapist Sessions: 2 / 4 used        │
│  Journal Entries: 18 / Unlimited       │
│                                         │
│  [View Billing History]                 │
└─────────────────────────────────────────┘
```

### Change Plan Screen

```
┌─────────────────────────────────────────┐
│  ← Subscription          Change Plan    │
│                                         │
│  Current: Premium ($49/mo)             │
│                                         │
│  Choose your new plan:                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ○ Core - $19/month            │   │
│  │    Save $30/month               │   │
│  │    • Unlimited conversations    │   │
│  │    • No therapist sessions      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ● Premium - $49/month         │   │
│  │    (Current plan)               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ○ Family - $79/month          │   │
│  │    Add $30/month                │   │
│  │    • Up to 6 family members     │   │
│  │    • 8 therapist sessions       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Continue with Selected Plan]          │
│                                         │
│  Changes take effect on Feb 16, 2025   │
└─────────────────────────────────────────┘
```

### Downgrade Confirmation

```
┌─────────────────────────────────────────┐
│  ⚠️ Confirm Plan Change                │
│                                         │
│  You're switching from:                 │
│  Premium ($49/mo) → Core ($19/mo)      │
│                                         │
│  You'll lose access to:                 │
│  ✗ Therapist sessions (4/mo)           │
│  ✗ Advanced progress reports           │
│  ✗ Custom exercise creation            │
│  ✗ Priority support                    │
│  ✗ API access                          │
│                                         │
│  You'll keep:                           │
│  ✓ Unlimited AI conversations          │
│  ✓ Voice sessions                      │
│  ✓ Full meditation library             │
│  ✓ Unlimited journaling                │
│                                         │
│  Change effective: Feb 16, 2025        │
│  New monthly charge: $19.00            │
│                                         │
│  [Confirm Downgrade]  [Keep Premium]    │
└─────────────────────────────────────────┘
```

### Cancel Subscription Flow

#### Step 1: Cancellation Reason

```
┌─────────────────────────────────────────┐
│  ← Subscription          Cancel Plan    │
│                                         │
│  We're sorry to see you go              │
│                                         │
│  Help us improve: Why are you leaving?  │
│                                         │
│  ○ Too expensive                        │
│  ○ Not using it enough                  │
│  ◓ Found a better alternative           │
│  ○ Missing features I need              │
│  ○ Technical issues                     │
│  ○ Privacy concerns                     │
│  ○ Other                                │
│                                         │
│  Tell us more (optional):               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Continue]                             │
└─────────────────────────────────────────┘
```

#### Step 2: Retention Offer (if "Too expensive")

```
┌─────────────────────────────────────────┐
│  💰 Special Offer for You              │
│                                         │
│  We understand budget matters.          │
│                                         │
│  Stay with 50% off for 3 months:        │
│                                         │
│  Premium for just $24.50/month         │
│  (Normally $49/month)                   │
│                                         │
│  [Claim 50% Off]                        │
│                                         │
│  Or switch to Core for $19/month:       │
│  [Switch to Core Instead]               │
│                                         │
│  [No thanks, continue cancelling]       │
└─────────────────────────────────────────┘
```

#### Step 3: Final Confirmation

```
┌─────────────────────────────────────────┐
│  ⚠️ Final Confirmation                 │
│                                         │
│  Your Premium subscription will end:    │
│  February 16, 2025                     │
│                                         │
│  After this date:                       │
│  • You'll be switched to Free           │
│  • Limited to 20 messages/day           │
│  • Journal entries: 3/week              │
│  • Meditation library: 10 sessions      │
│  • Your data is preserved               │
│                                         │
│  You can resubscribe anytime.           │
│                                         │
│  [Confirm Cancellation]                 │
│                                         │
│  [I've Changed My Mind]                 │
└─────────────────────────────────────────┘
```

#### Step 4: Cancellation Confirmation

```
┌─────────────────────────────────────────┐
│  ✓ Cancellation Confirmed              │
│                                         │
│  Your Premium subscription ends:        │
│  February 16, 2025                     │
│                                         │
│  You'll receive a confirmation email.   │
│                                         │
│  Changed your mind?                     │
│  [Reactivate Subscription]              │
│                                         │
│  Your feedback helps us improve.        │
│  [Take 30-Second Survey]                │
└─────────────────────────────────────────┘
```

### Pause Subscription

```
┌─────────────────────────────────────────┐
│  ← Subscription          Pause Plan     │
│                                         │
│  Need a break? Pause your subscription  │
│                                         │
│  How long would you like to pause?      │
│                                         │
│  ○ 1 month                              │
│  ○ 2 months                             │
│  ◓ 3 months                             │
│  ○ Custom date                          │
│                                         │
│  During pause:                          │
│  • No charges                           │
│  • Your data is saved                   │
│  • Access switches to Free tier         │
│  • Auto-resumes on [date]               │
│                                         │
│  [Confirm Pause]                        │
│                                         │
│  You can unpause anytime in Settings.   │
└─────────────────────────────────────────┘
```

### Billing History

```
┌─────────────────────────────────────────┐
│  ← Subscription          Billing History│
│                                         │
│  Payment Method                         │
│  Visa ending in 4242                    │
│  Expires 12/26                          │
│  [Update]                               │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Invoice History                        │
│                                         │
│  Jan 16, 2025    Premium    $49.00     │
│  [Download PDF]                         │
│                                         │
│  Dec 16, 2024    Premium    $49.00     │
│  [Download PDF]                         │
│                                         │
│  Nov 16, 2024    Premium    $49.00     │
│  [Download PDF]                         │
│                                         │
│  [Load More]                            │
└─────────────────────────────────────────┘
```

---

## Upgrade Prompt Copy Library

### Message Limit Reached

**Modal Title**: You've reached your daily limit

**Body**:
```
You've used all 20 messages for today.

Upgrade to Core for unlimited conversations
and continue your session without interruption.

✓ Unlimited AI messages
✓ Voice conversations  
✓ Full meditation library
```

**CTA**: Start Free Trial
**Secondary**: I'll wait until tomorrow

---

### Journal Entry Limit

**Modal Title**: Unlock unlimited journaling

**Body**:
```
You've used 3 of 3 weekly journal entries.

Journaling is one of the most effective 
therapeutic tools. Don't let limits hold 
back your growth.

Core members journal unlimited times and
get advanced insights from their entries.
```

**CTA**: Get Unlimited Journaling
**Secondary**: Maybe later

---

### Voice Feature Tease

**Modal Title**: Try voice conversations

**Body**:
```
Sometimes it's easier to talk than type.

Voice sessions feel more natural and can
help you express yourself more freely.

Upgrade to try your first voice session.
```

**CTA**: Enable Voice
**Secondary**: Continue with text

---

### Therapist Session Prompt

**Modal Title**: Talk to a licensed therapist

**Body**:
```
Sometimes you need human connection.

Premium includes 4 live therapist sessions
every month—right in the app.

All therapists are licensed, vetted, and
here to support your journey.
```

**CTA**: Start Premium Trial
**Secondary**: Learn more

---

### Progress Insights Tease

**Modal Title**: See your complete journey

**Body**:
```
You've been tracking your mood for 7 days!

Premium members get detailed insights that
reveal patterns, triggers, and progress
you might be missing.

✓ Mood pattern analysis
✓ Trigger identification  
✓ Progress reports
✓ Personalized recommendations
```

**CTA**: View Advanced Insights
**Secondary**: Maybe later

---

### Streak Milestone (7 days)

**Modal Title**: 🔥 7-day streak!

**Body**:
```
You're building a powerful habit.

7 days of consistent self-care is worth
celebrating—and you're just getting started.

Premium members who maintain streaks see
3x better outcomes. Ready to commit?
```

**CTA**: Commit with Premium
**Secondary**: Keep my streak

---

### Streak Milestone (30 days)

**Modal Title**: 🎉 30-day milestone!

**Body**:
```
A full month of prioritizing your mental health.
That's incredible.

You've proven this matters to you. Premium
members at 30 days report:
• 67% reduction in anxiety
• 54% improvement in sleep
• 78% feel more in control

Join them.
```

**CTA**: Unlock Premium Features
**Secondary**: I'm good for now

---

### Goal Completion

**Modal Title**: Goal achieved! 🎯

**Body**:
```
You did it! "[Goal Name]" is complete.

Setting and achieving goals is a cornerstone
of mental wellness. What's next?

Premium members can set unlimited goals and
get AI-powered guidance for each one.
```

**CTA**: Set More Goals
**Secondary**: Celebrate this win

---

### Meditation Library Expansion

**Modal Title**: Explore 200+ meditations

**Body**:
```
You've tried all the free meditations.

There's so much more to discover:
• Sleep stories
• Anxiety relief
• Focus sessions
• Body scans
• Walking meditations
• And 150+ more
```

**CTA**: Unlock Full Library
**Secondary**: Replay favorites

---

### Crisis Support Follow-up

**Modal Title**: We're here for you

**Body**:
```
Reaching out during difficult moments takes
courage. We're glad you did.

Premium members have access to 24/7 therapist
support for moments like these.

You're not alone in this.
```

**CTA**: Get Premium Support
**Secondary**: I'm okay now

---

### Contextual Upgrade (Evening User)

**Modal Title**: Your evening ritual

**Body**:
```
We noticed you use MindMate in the evenings.

Many members find our sleep meditations and
wind-down sessions help them rest better.

Upgrade to access our complete sleep library.
```

**CTA**: Improve My Sleep
**Secondary**: Not interested

---

## Email Communications

### Welcome to Free

**Subject**: Welcome to MindMate AI 🌱

```
Hi [Name],

Welcome to MindMate! We're excited to be part
of your mental wellness journey.

Here's what you can do right now:

1. Complete your first check-in
   [Start Check-in]

2. Try a guided meditation
   [Browse Meditations]

3. Set your first wellness goal
   [Set a Goal]

You're on the Free plan with:
• 20 AI messages per day
• 3 journal entries per week
• 10 meditation sessions
• Community support

Ready for more? Start a 7-day free trial:
[Explore Premium]

Need help? Reply to this email anytime.

Take care,
The MindMate Team
```

### Trial Started

**Subject**: Your Premium trial is active 🎉

```
Hi [Name],

Your 7-day Premium trial has begun!

You now have access to:
✓ Unlimited AI conversations
✓ Voice therapy sessions
✓ 200+ meditations
✓ 4 therapist sessions this month
✓ Advanced progress insights

Make the most of your trial:
[Explore Premium Features]

Your trial ends: [Date]
You'll be charged: $49 on [Date + 1]

Cancel anytime in Settings → Subscription.

Questions? We're here: support@mindmate.ai

Cheers,
The MindMate Team
```

### Trial Ending (2 days)

**Subject**: Your trial ends in 2 days

```
Hi [Name],

Your Premium trial ends in 2 days.

Here's what you've accomplished:
• [X] AI conversations
• [X] Journal entries
• [X] Meditation minutes
• [X] Mood improvements

Stay on your journey for $49/month:
[Continue with Premium]

Or explore other plans:
[View All Plans]

Not ready? Cancel anytime:
[Manage Subscription]

Best,
The MindMate Team
```

### Payment Failed

**Subject**: Payment issue - please update

```
Hi [Name],

We couldn't process your payment for MindMate
Premium ($49.00).

Please update your payment method to avoid
interruption:
[Update Payment Method]

Your subscription will remain active for 3 more
days. After that, you'll be switched to Free.

Need help? Contact us: support@mindmate.ai

Thanks,
The MindMate Team
```

### Subscription Cancelled

**Subject**: Your subscription has been cancelled

```
Hi [Name],

Your Premium subscription has been cancelled.

Your Premium access will continue until:
[End Date]

After that, you'll be on the Free plan with:
• 20 messages per day
• 3 journal entries per week
• Basic meditation library

Changed your mind?
[Reactivate Subscription]

We'd love your feedback:
[2-Minute Survey]

Thank you for being part of MindMate.

Take care,
The MindMate Team
```

### Win-back (30 days after cancel)

**Subject**: We miss you - 50% off your first month

```
Hi [Name],

It's been a month since you left MindMate.

We hope you're doing well. If you're ready to
come back, we'd love to have you.

Here's 50% off your first month:
[Claim 50% Off]

Premium for just $24.50 (normally $49)

This offer expires in 7 days.

Miss you,
The MindMate Team

P.S. If MindMate wasn't right for you, we'd love
to know why. Reply and tell us.
```

---

## Analytics & Tracking

### Key Metrics to Track

| Metric | Definition | Target |
|--------|------------|--------|
| Free-to-Trial Rate | % of free users starting trial | >15% |
| Trial Conversion Rate | % of trials converting to paid | >25% |
| Day 7 Retention | % of new users active at day 7 | >40% |
| Feature Adoption | % using premium features in trial | >60% |
| Time to Upgrade | Days from signup to first payment | <14 days |
| Churn Rate | % cancelling per month | <8% |
| LTV | Lifetime value per customer | >$200 |

### Paywall Performance Tracking

| Event | Properties |
|-------|------------|
| paywall_viewed | trigger_type, feature_name, user_tier |
| paywall_cta_clicked | cta_type, plan_selected |
| paywall_dismissed | dismiss_method, time_on_paywall |
| trial_started | source, plan, trial_length |
| trial_converted | days_to_convert, plan |
| trial_cancelled | days_used, cancellation_reason |

### A/B Test Opportunities

| Test | Hypothesis |
|------|------------|
| Paywall timing | Earlier vs. later paywall appearance |
| Trial length | 7 vs. 14 days |
| Pricing display | Monthly first vs. annual first |
| CTA copy | "Start Trial" vs. "Get Premium" |
| Retention offers | 50% off vs. extra month free |
| Social proof | With vs. without testimonials |

---

## Implementation Notes

### Technical Requirements

1. **Paywall System**
   - Feature flag system for gating
   - Usage tracking and limits
   - Modal component library
   - A/B testing framework

2. **Subscription Management**
   - Stripe/Paddle integration
   - Webhook handling for events
   - Graceful degradation on failure
   - Receipt and invoice generation

3. **Trial System**
   - Trial state tracking
   - Reminder email scheduling
   - Conversion tracking
   - Cancellation flow

### Accessibility Requirements

- All paywalls readable by screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Reduced motion support

### Localization

- All copy externalized for translation
- Currency formatting per locale
- Date formatting per locale
- RTL language support

---

## Appendix: Copy Style Guide

### Tone

- **Empathetic**: Understand mental health sensitivity
- **Encouraging**: Focus on growth, not deficiency
- **Clear**: No jargon or confusing terms
- **Respectful**: Never pressure or shame

### Language Principles

| Do | Don't |
|----|-------|
| "Unlock your potential" | "You're limited" |
| "Continue your journey" | "You can't do that" |
| "Get more support" | "Upgrade required" |
| "Explore Premium" | "Pay to continue" |
| "We're here for you" | "Access denied" |

### CTA Guidelines

- Action-oriented verbs
- Benefit-focused
- Specific when possible
- Avoid generic "Submit" or "Click here"

---

*Document Version: 1.0*  
*For questions or updates, contact: product@mindmate.ai*
