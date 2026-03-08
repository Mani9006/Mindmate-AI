# MindMate AI - Transactional Email & SMS Templates

> **Production-Ready Communication Templates**
> 
> Last Updated: 2024 | For: Claude Code Integration

---

## Table of Contents

1. [Email Templates](#email-templates)
   - [Welcome Email](#1-welcome-email)
   - [First Session Reminder](#2-first-session-reminder)
   - [Weekly Progress Email](#3-weekly-progress-email)
   - [Subscription Confirmation](#4-subscription-confirmation)
   - [Password Reset](#5-password-reset)
   - [Crisis Follow-Up Email](#6-crisis-follow-up-email)
   - [Re-engagement Emails](#7-re-engagement-emails)
   - [Subscription Cancellation](#8-subscription-cancellation)
2. [SMS Templates](#sms-templates)

---

## Email Templates

### 1. Welcome Email

**Subject:** Welcome to MindMate AI - Your Mental Wellness Journey Starts Now

**Preview Text:** We're here to support you every step of the way.

**Send Trigger:** User completes registration

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MindMate AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to MindMate AI</h1>
                            <p style="color: #e8eaff; margin: 10px 0 0; font-size: 16px;">Your Personal Mental Wellness Companion</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Welcome to the MindMate AI community! We're so glad you've taken this important step toward prioritizing your mental wellness.
                            </p>
                            
                            <div style="background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <h3 style="color: #667eea; margin: 0 0 10px; font-size: 18px;">What You Can Expect</h3>
                                <ul style="color: #555555; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>24/7 AI-powered emotional support</li>
                                    <li>Personalized wellness insights</li>
                                    <li>Guided meditation and breathing exercises</li>
                                    <li>Mood tracking and progress reports</li>
                                    <li>Evidence-based coping strategies</li>
                                </ul>
                            </div>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Your first session is designed to help us understand your unique needs and goals. It only takes 10 minutes, and it's completely confidential.
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}/first-session" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Your First Session</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                Need help getting started? Reply to this email or visit our <a href="{{help_center_url}}" style="color: #667eea;">Help Center</a>.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
                                You're receiving this email because you created an account on MindMate AI.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{privacy_url}}" style="color: #667eea;">Privacy Policy</a> | 
                                <a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Welcome to MindMate AI!

Hi {{first_name}},

Welcome to the MindMate AI community! We're so glad you've taken this important step toward prioritizing your mental wellness.

What You Can Expect:
- 24/7 AI-powered emotional support
- Personalized wellness insights
- Guided meditation and breathing exercises
- Mood tracking and progress reports
- Evidence-based coping strategies

Your first session is designed to help us understand your unique needs and goals. It only takes 10 minutes, and it's completely confidential.

Start Your First Session: {{app_url}}/first-session

Need help getting started? Reply to this email or visit our Help Center: {{help_center_url}}

---
MindMate AI
{{company_address}}
Privacy Policy: {{privacy_url}}
Unsubscribe: {{unsubscribe_url}}
```

---

### 2. First Session Reminder

**Subject:** Your First MindMate Session Awaits - 5 Minutes to Get Started

**Preview Text:** Take the first step toward better mental wellness today.

**Send Trigger:** 24 hours after registration if first session not completed

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your First Session Awaits</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Your First Session Awaits</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                We noticed you haven't completed your first session yet. No pressure - we know life gets busy! But we wanted to remind you that your personalized wellness journey is just one click away.
                            </p>
                            
                            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                                <p style="color: #2e7d32; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Quick & Easy</p>
                                <p style="color: #555555; font-size: 14px; margin: 0;">Your first session takes just <strong>5-10 minutes</strong></p>
                            </div>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                During this session, we'll:
                            </p>
                            
                            <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 25px;">
                                <li>Learn about your wellness goals</li>
                                <li>Understand your current challenges</li>
                                <li>Create a personalized support plan</li>
                                <li>Introduce you to our key features</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}/first-session" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Complete Your First Session</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                Not ready yet? That's okay! You can start whenever you're comfortable.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{privacy_url}}" style="color: #11998e;">Privacy Policy</a> | 
                                <a href="{{unsubscribe_url}}" style="color: #11998e;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Your First Session Awaits

Hi {{first_name}},

We noticed you haven't completed your first session yet. No pressure - we know life gets busy! But we wanted to remind you that your personalized wellness journey is just one click away.

Quick & Easy: Your first session takes just 5-10 minutes

During this session, we'll:
- Learn about your wellness goals
- Understand your current challenges
- Create a personalized support plan
- Introduce you to our key features

Complete Your First Session: {{app_url}}/first-session

Not ready yet? That's okay! You can start whenever you're comfortable.

---
MindMate AI
{{company_address}}
```

---

### 3. Weekly Progress Email

**Subject:** Your Weekly Wellness Report - {{week_date_range}}

**Preview Text:** See how far you've come this week!

**Send Trigger:** Every Monday at 9:00 AM user's local time

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly Wellness Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Your Weekly Wellness Report</h1>
                            <p style="color: #ffe4e9; margin: 10px 0 0; font-size: 14px;">{{week_date_range}}</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Here's a look at your wellness journey this past week. Remember, every small step counts!
                            </p>
                            
                            <!-- Stats Grid -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
                                <tr>
                                    <td width="48%" style="background-color: #fff3e0; border-radius: 8px; padding: 20px; text-align: center;">
                                        <p style="color: #e65100; font-size: 32px; font-weight: 700; margin: 0;">{{sessions_count}}</p>
                                        <p style="color: #777777; font-size: 14px; margin: 5px 0 0;">Sessions Completed</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background-color: #e3f2fd; border-radius: 8px; padding: 20px; text-align: center;">
                                        <p style="color: #1565c0; font-size: 32px; font-weight: 700; margin: 0;">{{mood_entries}}</p>
                                        <p style="color: #777777; font-size: 14px; margin: 5px 0 0;">Mood Check-ins</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 15px 0 25px;">
                                <tr>
                                    <td width="48%" style="background-color: #f3e5f5; border-radius: 8px; padding: 20px; text-align: center;">
                                        <p style="color: #7b1fa2; font-size: 32px; font-weight: 700; margin: 0;">{{meditation_minutes}}m</p>
                                        <p style="color: #777777; font-size: 14px; margin: 5px 0 0;">Meditation Time</p>
                                    </td>
                                    <td width="4%"></td>
                                    <td width="48%" style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; text-align: center;">
                                        <p style="color: #2e7d32; font-size: 32px; font-weight: 700; margin: 0;">{{streak_days}}</p>
                                        <p style="color: #777777; font-size: 14px; margin: 5px 0 0;">Day Streak</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Mood Trend -->
                            <div style="background-color: #fafafa; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px; font-size: 18px;">Your Mood This Week</h3>
                                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
                                    {{mood_summary_text}}
                                </p>
                                <p style="color: #777777; font-size: 14px; margin: 0;">
                                    Average mood: <strong style="color: #f5576c;">{{average_mood}}/10</strong>
                                </p>
                            </div>
                            
                            <!-- Insights -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #ffffff; margin: 0 0 15px; font-size: 18px;">Weekly Insight</h3>
                                <p style="color: #e8eaff; font-size: 16px; line-height: 1.6; margin: 0;">
                                    {{weekly_insight}}
                                </p>
                            </div>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Full Report</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{privacy_url}}" style="color: #f5576c;">Privacy Policy</a> | 
                                <a href="{{unsubscribe_url}}" style="color: #f5576c;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Your Weekly Wellness Report - {{week_date_range}}

Hi {{first_name}},

Here's a look at your wellness journey this past week. Remember, every small step counts!

This Week's Stats:
- Sessions Completed: {{sessions_count}}
- Mood Check-ins: {{mood_entries}}
- Meditation Time: {{meditation_minutes}}m
- Day Streak: {{streak_days}}

Your Mood This Week:
{{mood_summary_text}}
Average mood: {{average_mood}}/10

Weekly Insight:
{{weekly_insight}}

View Full Report: {{app_url}}/dashboard

---
MindMate AI
{{company_address}}
```

---

### 4. Subscription Confirmation

**Subject:** Subscription Confirmed - Welcome to MindMate AI Premium

**Preview Text:** Your premium wellness journey begins now.

**Send Trigger:** Immediately after successful payment

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#127942;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Welcome to Premium!</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Thank you for subscribing to MindMate AI Premium! Your payment has been confirmed and your premium features are now active.
                            </p>
                            
                            <!-- Order Summary -->
                            <div style="background-color: #fafafa; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 20px; font-size: 18px;">Subscription Details</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Plan</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{plan_name}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Billing Cycle</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{billing_cycle}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Amount</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{amount}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Next Billing Date</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{next_billing_date}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Transaction ID</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{transaction_id}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Premium Features -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #ffffff; margin: 0 0 15px; font-size: 18px;">Your Premium Benefits</h3>
                                <ul style="color: #e8eaff; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Unlimited AI therapy sessions</li>
                                    <li>Advanced mood analytics & insights</li>
                                    <li>Priority crisis support</li>
                                    <li>Exclusive guided meditation library</li>
                                    <li>Personalized wellness programs</li>
                                    <li>Export & share progress reports</li>
                                </ul>
                            </div>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}/premium-dashboard" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); color: #333333; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Explore Premium Features</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                Questions? Contact us at <a href="mailto:support@mindmate.ai" style="color: #ffaa00;">support@mindmate.ai</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{privacy_url}}" style="color: #ffaa00;">Privacy Policy</a> | 
                                <a href="{{billing_url}}" style="color: #ffaa00;">Manage Subscription</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Welcome to MindMate AI Premium!

Hi {{first_name}},

Thank you for subscribing to MindMate AI Premium! Your payment has been confirmed and your premium features are now active.

Subscription Details:
- Plan: {{plan_name}}
- Billing Cycle: {{billing_cycle}}
- Amount: {{amount}}
- Next Billing Date: {{next_billing_date}}
- Transaction ID: {{transaction_id}}

Your Premium Benefits:
- Unlimited AI therapy sessions
- Advanced mood analytics & insights
- Priority crisis support
- Exclusive guided meditation library
- Personalized wellness programs
- Export & share progress reports

Explore Premium Features: {{app_url}}/premium-dashboard

Questions? Contact us at support@mindmate.ai

---
MindMate AI
{{company_address}}
```

---

### 5. Password Reset

**Subject:** Reset Your MindMate AI Password

**Preview Text:** Secure link to reset your password (expires in 1 hour)

**Send Trigger:** User requests password reset

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#128274;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Reset Your Password</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                We received a request to reset your MindMate AI password. Click the button below to create a new password.
                            </p>
                            
                            <!-- Security Notice -->
                            <div style="background-color: #fff8e1; border-left: 4px solid #ffa000; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                                <p style="color: #f57c00; font-size: 14px; margin: 0;">
                                    <strong>Security Notice:</strong> This link expires in 1 hour and can only be used once.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; word-break: break-all; font-size: 13px; color: #555555; margin: 0 0 25px;">
                                {{reset_url}}
                            </p>
                            
                            <div style="border-top: 1px solid #e0e0e0; padding-top: 25px; margin-top: 25px;">
                                <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">
                                    <strong>Didn't request this?</strong>
                                </p>
                                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                                    If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{privacy_url}}" style="color: #4a5568;">Privacy Policy</a> | 
                                <a href="{{support_url}}" style="color: #4a5568;">Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Reset Your MindMate AI Password

Hi {{first_name}},

We received a request to reset your MindMate AI password. Click the link below to create a new password.

SECURITY NOTICE: This link expires in 1 hour and can only be used once.

Reset Password: {{reset_url}}

---

Didn't request this?
If you didn't request a password reset, you can safely ignore this email. Your account remains secure.

---
MindMate AI
{{company_address}}
```

---

### 6. Crisis Follow-Up Email

**Subject:** Following Up - We're Here For You

**Preview Text:** Your wellbeing matters to us. Here's how we can help.

**Send Trigger:** 24 hours after crisis event detection

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We're Here For You</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#129309;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">We're Here For You</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                We noticed you may have been going through a difficult time yesterday. We wanted to check in and remind you that support is always available.
                            </p>
                            
                            <!-- Crisis Resources -->
                            <div style="background-color: #ffebee; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #c62828; margin: 0 0 15px; font-size: 18px;">Immediate Support Resources</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ffcdd2;">
                                            <p style="color: #333333; font-size: 14px; margin: 0; font-weight: 600;">988 Suicide & Crisis Lifeline</p>
                                            <p style="color: #c62828; font-size: 18px; margin: 5px 0 0; font-weight: 700;">Call or Text 988</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #ffcdd2;">
                                            <p style="color: #333333; font-size: 14px; margin: 0; font-weight: 600;">Crisis Text Line</p>
                                            <p style="color: #c62828; font-size: 18px; margin: 5px 0 0; font-weight: 700;">Text HOME to 741741</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0;">
                                            <p style="color: #333333; font-size: 14px; margin: 0; font-weight: 600;">Emergency Services</p>
                                            <p style="color: #c62828; font-size: 18px; margin: 5px 0 0; font-weight: 700;">Call 911</p>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Support Options -->
                            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #2e7d32; margin: 0 0 15px; font-size: 18px;">MindMate AI Support</h3>
                                <ul style="color: #555555; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Access guided breathing exercises in the app</li>
                                    <li>Try our grounding techniques toolkit</li>
                                    <li>Connect with AI support anytime, 24/7</li>
                                    <li>Schedule a session with a wellness coach (Premium)</li>
                                </ul>
                            </div>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}/crisis-support" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Access Support Tools</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 25px 0 0;">
                                Remember, reaching out for help is a sign of strength. You don't have to face difficult moments alone.
                            </p>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                                With care,<br>
                                The MindMate AI Team
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                If you're in immediate danger, please call 911 or go to your nearest emergency room.<br>
                                {{company_address}}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
We're Here For You

Hi {{first_name}},

We noticed you may have been going through a difficult time yesterday. We wanted to check in and remind you that support is always available.

IMMEDIATE SUPPORT RESOURCES:
- 988 Suicide & Crisis Lifeline: Call or Text 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: Call 911

MINDMATE AI SUPPORT:
- Access guided breathing exercises in the app
- Try our grounding techniques toolkit
- Connect with AI support anytime, 24/7
- Schedule a session with a wellness coach (Premium)

Access Support Tools: {{app_url}}/crisis-support

Remember, reaching out for help is a sign of strength. You don't have to face difficult moments alone.

With care,
The MindMate AI Team

---
If you're in immediate danger, please call 911 or go to your nearest emergency room.
{{company_address}}
```

---

### 7. Re-engagement Emails

#### 7A. 7 Days Inactive

**Subject:** We Miss You - Your Wellness Journey is Waiting

**Preview Text:** Come back and continue your progress.

**Send Trigger:** 7 days since last app activity

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We Miss You</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#128075;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">We Miss You, {{first_name}}!</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                It's been a week since your last visit to MindMate AI. We hope everything is going well with you!
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Your wellness journey is important to us, and we're here whenever you're ready to continue.
                            </p>
                            
                            <!-- Progress Reminder -->
                            <div style="background-color: #f0f4ff; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                                <p style="color: #667eea; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Your Progress So Far</p>
                                <p style="color: #555555; font-size: 16px; margin: 0;">
                                    {{sessions_completed}} sessions completed<br>
                                    {{streak_days}} day streak (paused)
                                </p>
                            </div>
                            
                            <!-- Quick Actions -->
                            <h3 style="color: #333333; margin: 25px 0 15px; font-size: 18px;">Quick Ways to Reconnect</h3>
                            <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 25px;">
                                <li>Check in with your mood tracker</li>
                                <li>Try a 5-minute guided breathing exercise</li>
                                <li>Review your wellness insights</li>
                                <li>Continue where you left off</li>
                            </ul>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Return to MindMate AI</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                No pressure - we're here whenever you need us.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{preferences_url}}" style="color: #667eea;">Email Preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

#### 7B. 14 Days Inactive

**Subject:** Your Wellness Goals Are Still Within Reach

**Preview Text:** Let's get back on track together.

**Send Trigger:** 14 days since last app activity

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Goals Are Within Reach</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#127942;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Your Goals Are Within Reach</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                It's been two weeks since we last connected. We understand that life gets busy, but we wanted to remind you that your mental wellness goals are still important - and achievable.
                            </p>
                            
                            <!-- Motivation Quote -->
                            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                                <p style="color: #ffffff; font-size: 18px; font-style: italic; margin: 0; line-height: 1.6;">
                                    "Progress, not perfection. Every step forward counts."
                                </p>
                            </div>
                            
                            <!-- What's New -->
                            <h3 style="color: #333333; margin: 25px 0 15px; font-size: 18px;">What's New Since You've Been Away</h3>
                            <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 25px;">
                                <li>New guided meditation series added</li>
                                <li>Enhanced mood tracking features</li>
                                <li>Personalized wellness tips based on your profile</li>
                                <li>Community challenges to stay motivated</li>
                            </ul>
                            
                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Get Back on Track</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                Need help? Reply to this email - we're here to support you.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{preferences_url}}" style="color: #11998e;">Email Preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

#### 7C. 30 Days Inactive

**Subject:** We Haven't Given Up On You (And Neither Should You)

**Preview Text:** A special offer to welcome you back.

**Send Trigger:** 30 days since last app activity

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We Haven't Given Up On You</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 10px;">&#10084;&#65039;</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">We Haven't Given Up On You</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                It's been a month since your last visit to MindMate AI. We wanted to reach out one more time because we believe in your wellness journey - even if you've hit a pause.
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Sometimes the hardest part is getting started again. But remember why you joined us in the first place. Your mental wellness matters, and it's never too late to prioritize it.
                            </p>
                            
                            <!-- Special Offer -->
                            <div style="background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%); border-radius: 8px; padding: 30px; margin: 25px 0; text-align: center;">
                                <p style="color: #333333; font-size: 14px; margin: 0 0 10px; font-weight: 600;">SPECIAL WELCOME BACK OFFER</p>
                                <p style="color: #333333; font-size: 32px; margin: 0 0 10px; font-weight: 700;">50% OFF</p>
                                <p style="color: #555555; font-size: 16px; margin: 0 0 15px;">Your first month of Premium</p>
                                <p style="color: #777777; font-size: 12px; margin: 0;">Use code: WELCOMEBACK50</p>
                            </div>
                            
                            <!-- Benefits Reminder -->
                            <h3 style="color: #333333; margin: 25px 0 15px; font-size: 18px;">What You're Missing</h3>
                            <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 25px;">
                                <li>24/7 AI emotional support</li>
                                <li>Personalized wellness insights</li>
                                <li>Guided meditation library</li>
                                <li>Mood tracking and progress reports</li>
                                <li>Evidence-based coping strategies</li>
                            </ul>
                            
                            <!-- CTA Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}?coupon=WELCOMEBACK50" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin-bottom: 15px;">Claim Your 50% Off</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <a href="{{app_url}}" style="display: inline-block; background-color: transparent; color: #f5576c; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; border: 2px solid #f5576c;">Continue with Free Plan</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                                This is our final re-engagement email. If you'd prefer not to receive these, you can <a href="{{preferences_url}}" style="color: #f5576c;">update your preferences</a>.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                {{company_address}}<br>
                                <a href="{{preferences_url}}" style="color: #f5576c;">Email Preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Versions:**

```
=== 7 Days Inactive ===
We Miss You, {{first_name}}!

It's been a week since your last visit to MindMate AI. We hope everything is going well with you!

Your wellness journey is important to us, and we're here whenever you're ready to continue.

Your Progress So Far:
- {{sessions_completed}} sessions completed
- {{streak_days}} day streak (paused)

Quick Ways to Reconnect:
- Check in with your mood tracker
- Try a 5-minute guided breathing exercise
- Review your wellness insights
- Continue where you left off

Return to MindMate AI: {{app_url}}

No pressure - we're here whenever you need us.

---

=== 14 Days Inactive ===
Your Goals Are Within Reach

Hi {{first_name}},

It's been two weeks since we last connected. We understand that life gets busy, but we wanted to remind you that your mental wellness goals are still important - and achievable.

"Progress, not perfection. Every step forward counts."

What's New Since You've Been Away:
- New guided meditation series added
- Enhanced mood tracking features
- Personalized wellness tips based on your profile
- Community challenges to stay motivated

Get Back on Track: {{app_url}}

Need help? Reply to this email - we're here to support you.

---

=== 30 Days Inactive ===
We Haven't Given Up On You (And Neither Should You)

Hi {{first_name}},

It's been a month since your last visit to MindMate AI. We wanted to reach out one more time because we believe in your wellness journey - even if you've hit a pause.

SPECIAL WELCOME BACK OFFER: 50% OFF your first month of Premium
Use code: WELCOMEBACK50

What You're Missing:
- 24/7 AI emotional support
- Personalized wellness insights
- Guided meditation library
- Mood tracking and progress reports
- Evidence-based coping strategies

Claim Your Offer: {{app_url}}?coupon=WELCOMEBACK50

This is our final re-engagement email. Update preferences: {{preferences_url}}
```

---

### 8. Subscription Cancellation

**Subject:** Your Subscription Has Been Cancelled - We're Here If You Need Us

**Preview Text:** A special offer if you decide to return.

**Send Trigger:** Immediately after subscription cancellation

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">Subscription Cancelled</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Hi {{first_name}},
                            </p>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                We're sorry to see you go. Your MindMate AI Premium subscription has been successfully cancelled as requested.
                            </p>
                            
                            <!-- Cancellation Details -->
                            <div style="background-color: #fafafa; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 20px; font-size: 18px;">Cancellation Details</h3>
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Plan</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{plan_name}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Access Until</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{access_end_date}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #777777; font-size: 14px;">Cancellation Date</td>
                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">{{cancellation_date}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                You'll continue to have access to your Premium features until {{access_end_date}}. After that, your account will revert to our free plan.
                            </p>
                            
                            <!-- Win-Back Offer -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 30px; margin: 25px 0; text-align: center;">
                                <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px; font-weight: 600;">CHANGED YOUR MIND?</p>
                                <p style="color: #ffffff; font-size: 22px; margin: 0 0 15px; font-weight: 700;">60% Off Your Next 3 Months</p>
                                <p style="color: #e8eaff; font-size: 14px; margin: 0 0 20px;">If you resubscribe within the next 7 days</p>
                                <a href="{{resubscribe_url}}?winback=60OFF" style="display: inline-block; background-color: #ffffff; color: #667eea; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 16px; font-weight: 600;">Resubscribe Now</a>
                            </div>
                            
                            <!-- Feedback Request -->
                            <div style="background-color: #fff8e1; border-radius: 8px; padding: 25px; margin: 25px 0;">
                                <h3 style="color: #f57c00; margin: 0 0 15px; font-size: 18px;">Help Us Improve</h3>
                                <p style="color: #555555; font-size: 14px; line-height: 1.6; margin: 0 0 15px;">
                                    We'd love to know why you're leaving. Your feedback helps us improve MindMate AI for everyone.
                                </p>
                                <a href="{{feedback_url}}" style="color: #f57c00; font-size: 14px; font-weight: 600; text-decoration: underline;">Share Your Feedback (2 minutes)</a>
                            </div>
                            
                            <!-- Free Plan Benefits -->
                            <h3 style="color: #333333; margin: 25px 0 15px; font-size: 18px;">Your Free Plan Includes</h3>
                            <ul style="color: #555555; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 25px;">
                                <li>3 AI therapy sessions per month</li>
                                <li>Basic mood tracking</li>
                                <li>Limited meditation library access</li>
                                <li>Community forum access</li>
                            </ul>
                            
                            <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 25px 0 0;">
                                Thank you for being part of the MindMate AI community. Your mental wellness journey is important to us, and we hope to support you again in the future.
                            </p>
                            
                            <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                                With gratitude,<br>
                                The MindMate AI Team
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                Questions? Contact us at <a href="mailto:support@mindmate.ai" style="color: #667eea;">support@mindmate.ai</a><br>
                                {{company_address}}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Plain Text Version:**

```
Your Subscription Has Been Cancelled

Hi {{first_name}},

We're sorry to see you go. Your MindMate AI Premium subscription has been successfully cancelled as requested.

Cancellation Details:
- Plan: {{plan_name}}
- Access Until: {{access_end_date}}
- Cancellation Date: {{cancellation_date}}

You'll continue to have access to your Premium features until {{access_end_date}}. After that, your account will revert to our free plan.

---

CHANGED YOUR MIND?
60% Off Your Next 3 Months
If you resubscribe within the next 7 days

Resubscribe: {{resubscribe_url}}?winback=60OFF

---

Help Us Improve:
We'd love to know why you're leaving. Your feedback helps us improve MindMate AI for everyone.

Share Your Feedback: {{feedback_url}}

---

Your Free Plan Includes:
- 3 AI therapy sessions per month
- Basic mood tracking
- Limited meditation library access
- Community forum access

Thank you for being part of the MindMate AI community.

With gratitude,
The MindMate AI Team

---
Questions? Contact us at support@mindmate.ai
{{company_address}}
```

---

## SMS Templates

> For Twilio integration. Keep messages under 160 characters when possible.

---

### Welcome SMS

```
Welcome to MindMate AI, {{first_name}}! Your mental wellness journey starts now. Download the app: {{app_url}} - MindMate AI Team
```

**Character Count:** ~140

---

### First Session Reminder SMS

```
Hi {{first_name}}! Don't forget to complete your first MindMate session. It only takes 5 mins: {{session_url}} - MindMate AI
```

**Character Count:** ~130

---

### Weekly Progress SMS

```
Your weekly wellness report is ready, {{first_name}}! {{sessions}} sessions, {{streak}}-day streak. View details: {{report_url}} - MindMate AI
```

**Character Count:** ~135

---

### Subscription Confirmation SMS

```
Thank you, {{first_name}}! Your MindMate AI Premium subscription is confirmed. Amount: {{amount}}. Next billing: {{next_date}} - MindMate AI
```

**Character Count:** ~145

---

### Password Reset SMS

```
MindMate AI: Your password reset code is {{code}}. Valid for 1 hour. If you didn't request this, ignore this message.
```

**Character Count:** ~125

**Alternative (with link):**

```
MindMate AI: Reset your password here: {{reset_url}}. Link expires in 1 hour. If you didn't request this, ignore this message.
```

**Character Count:** ~135

---

### Crisis Follow-Up SMS (24h)

```
Hi {{first_name}}, MindMate AI here. We noticed you had a difficult time yesterday. Support is available: 988 or {{support_url}} - We're here for you.
```

**Character Count:** ~160

---

### Re-engagement SMS - 7 Days

```
We miss you, {{first_name}}! Your MindMate AI wellness journey is waiting. Check in today: {{app_url}} - MindMate AI
```

**Character Count:** ~115

---

### Re-engagement SMS - 14 Days

```
Hi {{first_name}}! Your wellness goals are still within reach. Come back to MindMate AI: {{app_url}} - We're here for you.
```

**Character Count:** ~125

---

### Re-engagement SMS - 30 Days

```
{{first_name}}, we haven't given up on you! Get 50% off Premium with code BACK50. Claim: {{offer_url}} - MindMate AI
```

**Character Count:** ~115

---

### Subscription Cancellation SMS

```
Your MindMate AI Premium subscription is cancelled. Access until {{date}}. Changed your mind? 60% off if you return within 7 days: {{url}}
```

**Character Count:** ~155

---

### Appointment/Session Reminder SMS

```
Reminder: Your MindMate AI session is in 30 mins. Join here: {{session_url}} - MindMate AI
```

**Character Count:** ~95

---

### Daily Mood Check-in SMS

```
Hi {{first_name}}! How are you feeling today? Take 30 seconds to check in: {{checkin_url}} - MindMate AI
```

**Character Count:** ~105

---

### Streak Achievement SMS

```
Amazing, {{first_name}}! You've hit a {{streak}}-day wellness streak! Keep it going: {{app_url}} - MindMate AI
```

**Character Count:** ~105

---

### Payment Failed SMS

```
MindMate AI: Your payment failed. Please update your payment method to keep your Premium access: {{billing_url}} - Support: support@mindmate.ai
```

**Character Count:** ~145

---

### Trial Ending Soon SMS

```
Hi {{first_name}}! Your MindMate AI Premium trial ends in 3 days. Keep your benefits: {{subscribe_url}} - MindMate AI
```

**Character Count:** ~120

---

## Twilio Integration Notes

### Message Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{first_name}}` | User's first name | "Sarah" |
| `{{app_url}}` | Link to app/website | "https://app.mindmate.ai" |
| `{{session_url}}` | Direct session link | "https://app.mindmate.ai/session" |
| `{{code}}` | Verification code | "123456" |
| `{{amount}}` | Payment amount | "$9.99" |
| `{{date}}` | Formatted date | "Dec 31, 2024" |
| `{{streak}}` | Number of days | "7" |
| `{{sessions}}` | Session count | "5" |

### Best Practices

1. **Keep it short**: Aim for under 160 characters to avoid splitting
2. **Include opt-out**: Add "Reply STOP to unsubscribe" for marketing messages
3. **Use short URLs**: Implement URL shortening for links
4. **Personalize**: Use first name when possible
5. **Timing**: Respect quiet hours (8 AM - 9 PM local time)
6. **Frequency**: Limit to 1-2 SMS per week maximum

### Compliance Requirements

- Include company name in message
- Honor STOP requests immediately
- Maintain opt-in records
- Provide help/support contact
- Follow TCPA guidelines (US) or local regulations

---

## Email Template Variables Reference

### Universal Variables (All Emails)

| Variable | Description | Required |
|----------|-------------|----------|
| `{{first_name}}` | User's first name | Yes |
| `{{app_url}}` | Application URL | Yes |
| `{{company_address}}` | Company physical address | Yes |
| `{{privacy_url}}` | Privacy policy URL | Yes |
| `{{unsubscribe_url}}` | Unsubscribe link | Yes |

### Template-Specific Variables

| Template | Variable | Description |
|----------|----------|-------------|
| Welcome | `{{help_center_url}}` | Help center link |
| Weekly Progress | `{{week_date_range}}` | Date range string |
| Weekly Progress | `{{sessions_count}}` | Number of sessions |
| Weekly Progress | `{{mood_entries}}` | Mood check-in count |
| Weekly Progress | `{{meditation_minutes}}` | Minutes meditated |
| Weekly Progress | `{{streak_days}}` | Current streak |
| Weekly Progress | `{{average_mood}}` | Average mood score |
| Weekly Progress | `{{weekly_insight}}` | AI-generated insight |
| Subscription | `{{plan_name}}` | Plan name |
| Subscription | `{{billing_cycle}}` | Monthly/Annual |
| Subscription | `{{amount}}` | Payment amount |
| Subscription | `{{next_billing_date}}` | Next charge date |
| Subscription | `{{transaction_id}}` | Payment reference |
| Password Reset | `{{reset_url}}` | Reset link |
| Password Reset | `{{support_url}}` | Support page |
| Cancellation | `{{access_end_date}}` | Premium access end |
| Cancellation | `{{cancellation_date}}` | Cancellation date |
| Cancellation | `{{resubscribe_url}}` | Resubscribe link |
| Cancellation | `{{feedback_url}}` | Feedback form |

---

*Document Version: 1.0*
*For: MindMate AI Production*
*Integration: Claude Code / Twilio*
