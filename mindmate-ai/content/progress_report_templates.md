# MindMate AI - Progress Report Templates

> **Production-Ready Templates for AI-Generated User Reports**
> Last Updated: 2024

---

## Table of Contents

1. [Weekly Progress Report](#1-weekly-progress-report)
2. [Monthly Deep-Dive Report](#2-monthly-deep-dive-report)
3. [Milestone Celebration Messages](#3-milestone-celebration-messages)
4. [30-Day Reflection Report](#4-30-day-reflection-report)
5. [Annual Review Template](#5-annual-review-template)
6. [Gentle Re-engagement Report](#6-gentle-re-engagement-report)

---

## 1. Weekly Progress Report

### Template Structure

```markdown
# Your Weekly Journey with MindMate 🌱

**Week of:** {{WEEK_START_DATE}} - {{WEEK_END_DATE}}  
**Report Generated:** {{GENERATION_DATE}}  
**For:** {{USER_DISPLAY_NAME}}

---

## 📊 This Week at a Glance

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Check-ins Completed | {{CHECKIN_COUNT}} | {{PREV_CHECKIN_COUNT}} | {{CHECKIN_CHANGE}} |
| Mood Entries | {{MOOD_ENTRY_COUNT}} | {{PREV_MOOD_COUNT}} | {{MOOD_CHANGE}} |
| Journal Entries | {{JOURNAL_COUNT}} | {{PREV_JOURNAL_COUNT}} | {{JOURNAL_CHANGE}} |
| Minutes in App | {{APP_MINUTES}} | {{PREV_APP_MINUTES}} | {{MINUTES_CHANGE}} |
| Streak Days | {{CURRENT_STREAK}} | {{PREV_STREAK}} | {{STREAK_CHANGE}} |

---

## 🎯 Your Weekly Highlights

### Mood Patterns
{{#IF_MOOD_DATA}}
- **Most Common Mood:** {{TOP_MOOD}} ({{TOP_MOOD_PERCENTAGE}}% of entries)
- **Mood Trend:** {{MOOD_TREND_DIRECTION}} ({{MOOD_TREND_PERCENTAGE}}% {{MOOD_TREND_DESCRIPTION}})
- **Best Day:** {{BEST_MOOD_DAY}} ({{BEST_MOOD_RATING}}/10)
- **Most Challenging Day:** {{CHALLENGING_MOOD_DAY}} ({{CHALLENGING_MOOD_RATING}}/10)
{{/IF_MOOD_DATA}}

{{#NO_MOOD_DATA}}
> 💡 *You haven't logged any moods this week. Try checking in daily to discover patterns in your emotional wellbeing.*
{{/NO_MOOD_DATA}}

### Journal Insights
{{#IF_JOURNAL_DATA}}
- **Entries This Week:** {{JOURNAL_COUNT}}
- **Total Words Written:** {{TOTAL_WORDS}}
- **Average Entry Length:** {{AVG_WORDS}} words
- **Most Discussed Topics:** {{TOP_TOPICS}}
- **Writing Streak:** {{WRITING_STREAK}} days
{{/IF_JOURNAL_DATA}}

{{#NO_JOURNAL_DATA}}
> 📝 *No journal entries this week. Even a few sentences can help process your thoughts and feelings.*
{{/NO_JOURNAL_DATA}}

### Goal Progress
{{#IF_GOALS}}
| Goal | Progress This Week | Overall | Status |
|------|-------------------|---------|--------|
{{#EACH_GOAL}}
| {{GOAL_NAME}} | {{WEEKLY_PROGRESS}}% | {{OVERALL_PROGRESS}}% | {{STATUS_ICON}} |
{{/EACH_GOAL}}
{{/IF_GOALS}}

{{#NO_GOALS}}
> 🎯 *You haven't set any goals yet. Setting small, achievable goals can help you track your growth.*
{{/NO_GOALS}}

---

## 💡 Personalized Insights

### Your Strengths This Week
{{STRENGTH_1}}  
{{STRENGTH_2}}  
{{STRENGTH_3}}

### Patterns We've Noticed
{{PATTERN_INSIGHT_1}}  
{{PATTERN_INSIGHT_2}}

### Suggestions for Next Week
{{SUGGESTION_1}}  
{{SUGGESTION_2}}  
{{SUGGESTION_3}}

---

## 🏆 Achievements Unlocked

{{#IF_ACHIEVEMENTS}}
{{#EACH_ACHIEVEMENT}}
- {{ACHIEVEMENT_ICON}} **{{ACHIEVEMENT_NAME}}** — {{ACHIEVEMENT_DESCRIPTION}}
{{/EACH_ACHIEVEMENT}}
{{/IF_ACHIEVEMENTS}}

{{#NO_ACHIEVEMENTS}}
> 🌟 *Keep engaging with MindMate to unlock achievements and celebrate your progress!*
{{/NO_ACHIEVEMENTS}}

---

## 📅 Looking Ahead

### Upcoming Reminders
{{REMINDER_1}}  
{{REMINDER_2}}  
{{REMINDER_3}}

### Recommended Activities for Next Week
{{RECOMMENDED_ACTIVITY_1}}  
{{RECOMMENDED_ACTIVITY_2}}  
{{RECOMMENDED_ACTIVITY_3}}

---

## 🎨 Your Weekly Snapshot

{{WEEKLY_VISUALIZATION}}

---

*Remember: Progress isn't always linear. Every step you take with MindMate is a step toward better understanding yourself.* 🌿

**Questions or feedback?** Reply to this report or contact us at {{SUPPORT_EMAIL}}
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{WEEK_START_DATE}}` | First day of the week | "January 1, 2024" |
| `{{WEEK_END_DATE}}` | Last day of the week | "January 7, 2024" |
| `{{GENERATION_DATE}}` | When report was created | "January 8, 2024" |
| `{{USER_DISPLAY_NAME}}` | User's preferred name | "Alex" |
| `{{CHECKIN_COUNT}}` | Number of check-ins | "5" |
| `{{MOOD_ENTRY_COUNT}}` | Mood logs this week | "7" |
| `{{JOURNAL_COUNT}}` | Journal entries this week | "3" |
| `{{APP_MINUTES}}` | Time spent in app | "45" |
| `{{CURRENT_STREAK}}` | Current daily streak | "12" |
| `{{TOP_MOOD}}` | Most frequent mood | "Calm" |
| `{{MOOD_TREND_DIRECTION}}` | Improving/declining/stable | "Improving" |
| `{{TOTAL_WORDS}}` | Words written in journals | "1,247" |
| `{{TOP_TOPICS}}` | Common journal themes | "Work, Relationships" |
| `{{STRENGTH_1-3}}` | Personalized strengths | "Consistency in check-ins" |
| `{{SUGGESTION_1-3}}` | AI-generated suggestions | "Try morning journaling" |
| `{{ACHIEVEMENT_ICON}}` | Emoji for achievement | "🔥" |
| `{{ACHIEVEMENT_NAME}}` | Achievement title | "Week Warrior" |

---

## 2. Monthly Deep-Dive Report

### Template Structure

```markdown
# Your Monthly MindMate Journey 🌙

**Month:** {{MONTH_NAME}} {{YEAR}}  
**Report Generated:** {{GENERATION_DATE}}  
**For:** {{USER_DISPLAY_NAME}}

---

## 📈 Monthly Overview

### Your Engagement This Month

| Activity | This Month | Last Month | All-Time Total |
|----------|------------|------------|----------------|
| Total Check-ins | {{MONTHLY_CHECKINS}} | {{PREV_MONTH_CHECKINS}} | {{TOTAL_CHECKINS}} |
| Mood Entries | {{MONTHLY_MOODS}} | {{PREV_MONTH_MOODS}} | {{TOTAL_MOODS}} |
| Journal Entries | {{MONTHLY_JOURNALS}} | {{PREV_MONTH_JOURNALS}} | {{TOTAL_JOURNALS}} |
| Goals Set | {{MONTHLY_GOALS}} | {{PREV_MONTH_GOALS}} | {{TOTAL_GOALS}} |
| Goals Completed | {{COMPLETED_GOALS}} | {{PREV_COMPLETED_GOALS}} | {{TOTAL_COMPLETED_GOALS}} |
| Meditation Minutes | {{MEDITATION_MINUTES}} | {{PREV_MEDITATION_MINUTES}} | {{TOTAL_MEDITATION_MINUTES}} |
| Active Days | {{ACTIVE_DAYS}} | {{PREV_ACTIVE_DAYS}} | {{TOTAL_ACTIVE_DAYS}} |

---

## 🎭 Emotional Landscape

### Mood Distribution

{{MOOD_DISTRIBUTION_CHART}}

**Your Emotional Journey:**

| Week | Dominant Mood | Average Rating | Notable Events |
|------|---------------|----------------|----------------|
| Week 1 | {{W1_DOMINANT_MOOD}} | {{W1_AVG_RATING}}/10 | {{W1_NOTES}} |
| Week 2 | {{W2_DOMINANT_MOOD}} | {{W2_AVG_RATING}}/10 | {{W2_NOTES}} |
| Week 3 | {{W3_DOMINANT_MOOD}} | {{W3_AVG_RATING}}/10 | {{W3_NOTES}} |
| Week 4 | {{W4_DOMINANT_MOOD}} | {{W4_AVG_RATING}}/10 | {{W4_NOTES}} |

### Key Emotional Insights

{{EMOTIONAL_INSIGHT_1}}

{{EMOTIONAL_INSIGHT_2}}

{{EMOTIONAL_INSIGHT_3}}

---

## 📝 Reflections & Growth

### Journal Analysis

**Writing Patterns:**
- Total entries: {{MONTHLY_JOURNALS}}
- Total words written: {{MONTHLY_WORDS}}
- Average entry length: {{AVG_ENTRY_LENGTH}} words
- Longest entry: {{LONGEST_ENTRY_WORDS}} words ({{LONGEST_ENTRY_DATE}})
- Most active writing day: {{MOST_ACTIVE_DAY}}
- Preferred writing time: {{PREFERRED_TIME}}

**Recurring Themes:**
{{#EACH_THEME}}
- **{{THEME_NAME}}** (mentioned {{THEME_COUNT}} times)
  - Related emotions: {{THEME_EMOTIONS}}
  - Trend: {{THEME_TREND}}
{{/EACH_THEME}}

**Notable Entries:**
{{#EACH_NOTABLE_ENTRY}}
- *"{{ENTRY_EXCERPT}}"* — {{ENTRY_DATE}}
{{/EACH_NOTABLE_ENTRY}}

---

## 🎯 Goal Progress Review

### Goals Set This Month

{{#EACH_GOAL}}
#### {{GOAL_NAME}}
- **Description:** {{GOAL_DESCRIPTION}}
- **Category:** {{GOAL_CATEGORY}}
- **Target Date:** {{TARGET_DATE}}
- **Progress:** {{PROGRESS_PERCENTAGE}}%
- **Status:** {{GOAL_STATUS}}
- **Milestones Reached:** {{MILESTONES_COUNT}}/{{TOTAL_MILESTONES}}
{{/EACH_GOAL}}

### Completed Goals 🎉

{{#EACH_COMPLETED_GOAL}}
- ✅ **{{COMPLETED_GOAL_NAME}}** — Completed on {{COMPLETION_DATE}}
  - Time to complete: {{DAYS_TO_COMPLETE}} days
  - Impact on wellbeing: {{IMPACT_RATING}}/10
{{/EACH_COMPLETED_GOAL}}

---

## 🔍 Deep Insights

### Correlation Analysis

{{CORRELATION_INSIGHT_1}}

{{CORRELATION_INSIGHT_2}}

{{CORRELATION_INSIGHT_3}}

### Personalized Recommendations

Based on your patterns this month, here are tailored suggestions:

{{RECOMMENDATION_1}}

{{RECOMMENDATION_2}}

{{RECOMMENDATION_3}}

{{RECOMMENDATION_4}}

{{RECOMMENDATION_5}}

---

## 🌟 Monthly Highlights

### Your Wins This Month
{{#EACH_WIN}}
- 🏆 {{WIN_DESCRIPTION}}
{{/EACH_WIN}}

### Challenges You Overcame
{{#EACH_CHALLENGE}}
- 💪 {{CHALLENGE_DESCRIPTION}}
{{/EACH_CHALLENGE}}

### Growth Moments
{{#EACH_GROWTH}}
- 🌱 {{GROWTH_DESCRIPTION}}
{{/EACH_GROWTH}}

---

## 📊 Comparative Analysis

### Month-over-Month Changes

| Metric | Change | Interpretation |
|--------|--------|----------------|
| Overall Mood | {{MOOD_CHANGE}} | {{MOOD_INTERPRETATION}} |
| Engagement | {{ENGAGEMENT_CHANGE}} | {{ENGAGEMENT_INTERPRETATION}} |
| Journaling | {{JOURNALING_CHANGE}} | {{JOURNALING_INTERPRETATION}} |
| Goal Progress | {{GOAL_CHANGE}} | {{GOAL_INTERPRETATION}} |

### How You Compare

{{PEER_COMPARISON_INSIGHT}}

---

## 🗓️ Looking Forward to {{NEXT_MONTH}}

### Suggested Focus Areas
{{FOCUS_AREA_1}}  
{{FOCUS_AREA_2}}  
{{FOCUS_AREA_3}}

### Recommended Goals
{{RECOMMENDED_GOAL_1}}  
{{RECOMMENDED_GOAL_2}}

### Upcoming Features to Try
{{FEATURE_SUGGESTION_1}}  
{{FEATURE_SUGGESTION_2}}

---

## 📥 Export Your Data

Want to dive deeper? You can export your full month's data:

[📊 Download Monthly Report (PDF)]({{PDF_DOWNLOAD_LINK}})  
[📁 Export Raw Data (CSV)]({{CSV_DOWNLOAD_LINK}})  
[🖼️ Save Mood Chart]({{CHART_DOWNLOAD_LINK}})

---

*Thank you for trusting MindMate with your mental health journey. Every month of reflection brings you closer to the best version of yourself.* 💚

---

**Questions about your report?** Contact us at {{SUPPORT_EMAIL}}
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{MONTH_NAME}}` | Full month name | "January" |
| `{{YEAR}}` | Four-digit year | "2024" |
| `{{MONTHLY_CHECKINS}}` | Check-ins this month | "28" |
| `{{ACTIVE_DAYS}}` | Days with activity | "25" |
| `{{MOOD_DISTRIBUTION_CHART}}` | Visual mood chart | [Embedded chart] |
| `{{W1_DOMINANT_MOOD}}` | Week 1 primary mood | "Happy" |
| `{{THEME_NAME}}` | Journal theme | "Career Growth" |
| `{{THEME_COUNT}}` | Times theme appeared | "12" |
| `{{ENTRY_EXCERPT}}` | Journal quote snippet | "Today I realized..." |
| `{{GOAL_STATUS}}` | Goal completion status | "In Progress" |
| `{{CORRELATION_INSIGHT}}` | Data correlation finding | "You tend to journal more on high-stress days" |
| `{{PEER_COMPARISON_INSIGHT}}` | Anonymous comparison | "You're in the top 20% for consistency" |
| `{{FOCUS_AREA}}` | Suggested focus topic | "Sleep hygiene" |

---

## 3. Milestone Celebration Messages

### Variation 1: The Encourager

```markdown
# 🎉 Congratulations, {{USER_NAME}}!

## You've reached a milestone: {{MILESTONE_NAME}}

{{MILESTONE_ICON}} **{{MILESTONE_DESCRIPTION}}**

---

This is no small feat. Every day you've shown up for yourself, you've made an investment in your wellbeing that compounds over time.

**What you've accomplished:**
- {{ACHIEVEMENT_DETAIL_1}}
- {{ACHIEVEMENT_DETAIL_2}}
- {{ACHIEVEMENT_DETAIL_3}}

Remember: Progress isn't about perfection—it's about persistence. And you've proven you have plenty of that.

**What's next?** {{NEXT_MILESTONE_PREVIEW}}

Keep going. We're cheering you on! 🌟

— The MindMate Team
```

---

### Variation 2: The Data Celebrator

```markdown
# 📊 Milestone Unlocked: {{MILESTONE_NAME}}

**Hey {{USER_NAME}},**

The numbers don't lie—you've just hit {{MILESTONE_NUMBER}} {{MILESTONE_UNIT}}!

| Your Stats | Value |
|------------|-------|
| Time to reach this milestone | {{DAYS_TO_MILESTONE}} days |
| Consistency rate | {{CONSISTENCY_RATE}}% |
| Impact on your wellbeing | {{WELLBEING_CHANGE}} |

That's {{COMPARISON_STAT}} more than the average user!

**Your journey so far:**
{{JOURNEY_VISUALIZATION}}

Ready for the next milestone? Only {{NEXT_MILESTONE_DISTANCE}} to go!

🎯 **Next up:** {{NEXT_MILESTONE_NAME}}
```

---

### Variation 3: The Warm & Personal

```markdown
# 💚 {{USER_NAME}}, Look How Far You've Come!

We noticed something wonderful today—you've {{MILESTONE_ACTION}}!

{{MILESTONE_ICON}}

It's moments like these that remind us why we built MindMate. Seeing you commit to your mental health journey, day after day, fills us with genuine joy.

**A few things that made us smile about your progress:**

{{PERSONALIZED_HIGHLIGHT_1}}

{{PERSONALIZED_HIGHLIGHT_2}}

{{PERSONALIZED_HIGHLIGHT_3}}

Take a moment to celebrate this win. You deserve it. 🌸

With appreciation,  
The MindMate Team

P.S. {{PERSONALIZED_PS}}
```

---

### Variation 4: The Growth-Focused

```markdown
# 🌱 Growth Milestone Achieved!

## {{MILESTONE_NAME}}

**Congratulations, {{USER_NAME}}!**

You've reached a significant milestone in your personal growth journey. Here's what this achievement represents:

### 🧠 What This Milestone Means

{{MILESTONE_MEANING}}

### 📈 Your Growth Trajectory

| Period | Progress | Growth Rate |
|--------|----------|-------------|
| First {{TIME_PERIOD}} | {{INITIAL_METRIC}} | — |
| Last {{TIME_PERIOD}} | {{CURRENT_METRIC}} | {{GROWTH_RATE}}% |

### 🔮 What This Sets You Up For

Reaching this milestone positions you to:
- {{FUTURE_BENEFIT_1}}
- {{FUTURE_BENEFIT_2}}
- {{FUTURE_BENEFIT_3}}

**Remember:** Growth is a journey, not a destination. This milestone is proof that you're on the right path.

{{GROWTH_QUOTE}}
```

---

### Variation 5: The Achievement Hunter

```markdown
# 🏆 Achievement Unlocked!

## {{BADGE_NAME}}

{{BADGE_ICON}} **{{BADGE_RARITY}} Badge**

---

**Congratulations, {{USER_NAME}}!**

You've earned the **{{BADGE_NAME}}** badge by {{BADGE_CRITERIA}}.

**Badge Details:**
- **Earned:** {{EARN_DATE}}
- **Difficulty:** {{BADGE_DIFFICULTY}}
- **Rarity:** Only {{RARITY_PERCENTAGE}}% of users have earned this badge

**Your Badge Collection:**
{{BADGE_COLLECTION_DISPLAY}}

**Next Badge to Unlock:**
{{NEXT_BADGE_PREVIEW}}

Progress: {{NEXT_BADGE_PROGRESS}}%

[View All Badges]({{BADGES_PAGE_LINK}})

Keep collecting those achievements! 🎮
```

---

### Variation 6: The Community Connector

```markdown
# 🎊 You're Part of an Exclusive Club!

## {{MILESTONE_NAME}}

**Hey {{USER_NAME}},**

You've just joined an incredible group of MindMate users who have {{MILESTONE_ACTION}}!

**Welcome to the {{MILESTONE_CLUB_NAME}}!** {{CLUB_ICON}}

### 👥 Your Fellow Milestone Achievers

You're now among {{CLUB_MEMBER_COUNT}} users who have reached this milestone.

Here's what some of them had to say about their journey:

> *"{{TESTIMONIAL_1}}"* — {{TESTIMONIAL_AUTHOR_1}}

> *"{{TESTIMONIAL_2}}"* — {{TESTIMONIAL_AUTHOR_2}}

### 🌟 Club Benefits

As a member of the {{MILESTONE_CLUB_NAME}}, you now have access to:
- {{CLUB_BENEFIT_1}}
- {{CLUB_BENEFIT_2}}
- {{CLUB_BENEFIT_3}}

**Share your achievement!** [Share on Twitter]({{SHARE_LINK_TWITTER}}) | [Share on Facebook]({{SHARE_LINK_FACEBOOK}})

Welcome to the club! 🎉
```

---

### Variation 7: The Reflective

```markdown
# 🪞 A Moment of Reflection

## {{MILESTONE_NAME}}

**Dear {{USER_NAME}},**

Pause for a moment. Breathe. 

You've just reached {{MILESTONE_NUMBER}} {{MILESTONE_UNIT}}.

Think back to when you started. {{REFLECTION_PROMPT}}

### 🕰️ Then vs. Now

| Aspect | When You Started | Today |
|--------|------------------|-------|
| {{ASPECT_1}} | {{THEN_1}} | {{NOW_1}} |
| {{ASPECT_2}} | {{THEN_2}} | {{NOW_2}} |
| {{ASPECT_3}} | {{THEN_3}} | {{NOW_3}} |

### 💭 A Note from Your Past Self

{{#IF_PAST_ENTRY}}
> *"{{PAST_ENTRY_QUOTE}}"*
> 
> — You, {{PAST_ENTRY_DATE}}
{{/IF_PAST_ENTRY}}

{{#NO_PAST_ENTRY}}
> *Imagine what you might write to your future self today...*
{{/NO_PAST_ENTRY}}

### 🌅 Looking Forward

{{FUTURE_REFLECTION}}

Be proud of how far you've come. 🌿
```

---

### Variation 8: The Playful

```markdown
# 🎮 LEVEL UP! 🎮

## {{USER_NAME}} has reached Level {{LEVEL_NUMBER}}!

{{LEVEL_UP_ANIMATION}}

### 🎊 New Unlocks:

{{#EACH_UNLOCK}}
- ✅ {{UNLOCK_ITEM}}
{{/EACH_UNLOCK}}

### 📊 Your Stats:

| Stat | Value | Change |
|------|-------|--------|
| XP | {{CURRENT_XP}} | +{{XP_GAINED}} |
| Streak | {{CURRENT_STREAK}} | {{STREAK_CHANGE}} |
| Consistency | {{CONSISTENCY_SCORE}}% | {{CONSISTENCY_CHANGE}} |

### 🎯 Next Level: {{NEXT_LEVEL_NUMBER}}

**XP Needed:** {{XP_TO_NEXT_LEVEL}}

**Fastest way to level up:**
{{LEVEL_UP_TIP_1}}  
{{LEVEL_UP_TIP_2}}

Keep grinding! 💪

*Game on,*  
The MindMate Team
```

---

### Variation 9: The Scientific

```markdownn# 🔬 Research-Backed Milestone Achieved

## {{MILESTONE_NAME}}

**Congratulations, {{USER_NAME}}!**

You've reached a milestone that research shows has significant benefits for mental health.

### 📚 The Science Behind Your Achievement

{{MILESTONE_RESEARCH_SUMMARY}}

**Key Findings:**
- {{RESEARCH_FINDING_1}}
- {{RESEARCH_FINDING_2}}
- {{RESEARCH_FINDING_3}}

### 📊 Your Data

| Metric | Your Value | Research Benchmark | Comparison |
|--------|------------|-------------------|------------|
| {{METRIC_1}} | {{VALUE_1}} | {{BENCHMARK_1}} | {{COMPARISON_1}} |
| {{METRIC_2}} | {{VALUE_2}} | {{BENCHMARK_2}} | {{COMPARISON_2}} |

### 🔬 What Happens Next

Based on research, users who reach this milestone typically experience:
- {{EXPECTED_OUTCOME_1}}
- {{EXPECTED_OUTCOME_2}}
- {{EXPECTED_OUTCOME_3}}

**Continue your evidence-based journey!** 📖

---

*Sources: {{RESEARCH_CITATIONS}}*
```

---

### Variation 10: The Minimalist

```markdown
# {{MILESTONE_ICON}}

## {{MILESTONE_NAME}}

**{{USER_NAME}}**

{{MILESTONE_NUMBER}} {{MILESTONE_UNIT}}

{{MILESTONE_DATE}}

---

{{SIMPLE_MESSAGE}}

{{NEXT_MILESTONE_PREVIEW}}

— MindMate
```

---

## 4. 30-Day Reflection Report

### Template Structure

```markdown
# 🌅 Your First 30 Days with MindMate

**Reflection Period:** {{START_DATE}} - {{END_DATE}}  
**Report Generated:** {{GENERATION_DATE}}  
**For:** {{USER_DISPLAY_NAME}}

---

## 💌 A Letter from MindMate

Dear {{USER_NAME}},

Thirty days ago, you took a meaningful step—you decided to prioritize your mental wellbeing with MindMate. Today, we want to celebrate that decision and reflect on the journey you've begun.

---

## 📊 Your 30-Day Snapshot

### Engagement Summary

| Activity | Your Count | Daily Average |
|----------|------------|---------------|
| Days Active | {{ACTIVE_DAYS}}/30 | {{ACTIVE_PERCENTAGE}}% |
| Check-ins Completed | {{TOTAL_CHECKINS}} | {{AVG_CHECKINS_PER_DAY}} |
| Mood Entries | {{TOTAL_MOOD_ENTRIES}} | {{AVG_MOOD_PER_DAY}} |
| Journal Entries | {{TOTAL_JOURNAL_ENTRIES}} | {{AVG_JOURNALS_PER_DAY}} |
| Total Words Written | {{TOTAL_WORDS}} | {{AVG_WORDS_PER_ENTRY}} per entry |
| Meditation Minutes | {{MEDITATION_MINUTES}} | {{AVG_MEDITATION_PER_DAY}} min/day |
| Goals Set | {{GOALS_SET}} | — |
| Goals Completed | {{GOALS_COMPLETED}} | — |

### Your Consistency Pattern

{{CONSISTENCY_HEATMAP}}

**Most Active Days:** {{MOST_ACTIVE_DAYS}}  
**Preferred Time:** {{PREFERRED_USAGE_TIME}}

---

## 🎭 Understanding Your Emotional Patterns

### Mood Journey

{{MOOD_TIMELINE_VISUALIZATION}}

### Key Emotional Insights

{{#IF_MOOD_DATA}}
**Your emotional landscape over 30 days:**

- **Most Frequent Mood:** {{TOP_MOOD}} ({{TOP_MOOD_PERCENTAGE}}% of entries)
- **Mood Range:** {{LOWEST_MOOD_RATING}} - {{HIGHEST_MOOD_RATING}} (out of 10)
- **Average Mood:** {{AVERAGE_MOOD_RATING}}/10
- **Most Improved Area:** {{IMPROVED_AREA}}
- **Most Challenging Area:** {{CHALLENGING_AREA}}

**Mood Patterns We Noticed:**
{{PATTERN_INSIGHT_1}}

{{PATTERN_INSIGHT_2}}
{{/IF_MOOD_DATA}}

{{#NO_MOOD_DATA}}
> 💡 *We noticed you haven't logged many moods yet. Daily mood tracking can reveal powerful insights about your emotional patterns. Try setting a daily reminder!*
{{/NO_MOOD_DATA}}

---

## 📝 Your Reflections in Words

### Journal Highlights

{{#IF_JOURNAL_DATA}}
**Your Writing Journey:**

You've written {{TOTAL_WORDS}} words across {{TOTAL_JOURNAL_ENTRIES}} entries. That's like writing {{BOOK_COMPARISON}}!

**Recurring Themes in Your Writing:**
{{#EACH_THEME}}
- **{{THEME_NAME}}** ({{THEME_COUNT}} mentions)
{{/EACH_THEME}}

**Your Words, Your Voice:**

{{#EACH_HIGHLIGHT_ENTRY}}
> *"{{ENTRY_EXCERPT}}"*
> 
> — {{ENTRY_DATE}}
{{/EACH_HIGHLIGHT_ENTRY}}

**Emotional Tone Analysis:**
- Positive sentiment: {{POSITIVE_SENTIMENT}}%
- Neutral sentiment: {{NEUTRAL_SENTIMENT}}%
- Reflective/Processing: {{REFLECTIVE_SENTIMENT}}%
{{/IF_JOURNAL_DATA}}

{{#NO_JOURNAL_DATA}}
> 📝 *Journaling is a powerful tool for self-discovery. Even a few sentences each day can help you process emotions and track your growth. Consider starting with our guided prompts!*
{{/NO_JOURNAL_DATA}}

---

## 🎯 Goals & Progress

### What You Set Out to Achieve

{{#IF_GOALS}}
| Goal | Category | Progress | Status |
|------|----------|----------|--------|
{{#EACH_GOAL}}
| {{GOAL_NAME}} | {{GOAL_CATEGORY}} | {{GOAL_PROGRESS}}% | {{GOAL_STATUS}} |
{{/EACH_GOAL}}

**Completed Goals:** {{COMPLETED_GOALS_COUNT}}  
**In Progress:** {{IN_PROGRESS_GOALS_COUNT}}  
**Not Started:** {{NOT_STARTED_GOALS_COUNT}}
{{/IF_GOALS}}

{{#NO_GOALS}}
> 🎯 *Setting goals gives your mental health journey direction. Our goal-setting feature can help you break down big aspirations into achievable steps.*
{{/NO_GOALS}}

---

## 🌟 Discoveries About Yourself

### Insights from Your First Month

Based on your activity and entries, here are some observations:

{{INSIGHT_1}}

{{INSIGHT_2}}

{{INSIGHT_3}}

{{INSIGHT_4}}

{{INSIGHT_5}}

---

## 💪 Your Strengths (Yes, You Have Many!)

In just 30 days, you've demonstrated:

{{STRENGTH_1}}

{{STRENGTH_2}}

{{STRENGTH_3}}

{{STRENGTH_4}}

---

## 🎁 Gifts from Your First Month

### Skills You've Developed
{{#EACH_SKILL}}
- ✨ {{SKILL_NAME}}
{{/EACH_SKILL}}

### Habits You've Started
{{#EACH_HABIT}}
- 🌱 {{HABIT_NAME}}
{{/EACH_HABIT}}

### Self-Knowledge You've Gained
{{#EACH_INSIGHT}}
- 💡 {{INSIGHT_DESCRIPTION}}
{{/EACH_INSIGHT}}

---

## 🚀 What's Next?

### Recommended for Your Second Month

Based on your first 30 days, here are personalized recommendations:

{{RECOMMENDATION_1}}

{{RECOMMENDATION_2}}

{{RECOMMENDATION_3}}

{{RECOMMENDATION_4}}

### Features to Explore

{{FEATURE_SUGGESTION_1}}  
{{FEATURE_SUGGESTION_2}}  
{{FEATURE_SUGGESTION_3}}

---

## 🏆 Milestones Reached

{{#EACH_MILESTONE}}
- {{MILESTONE_ICON}} **{{MILESTONE_NAME}}** — {{MILESTONE_DATE}}
{{/EACH_MILESTONE}}

---

## 💚 A Note of Appreciation

{{USER_NAME}},

Thirty days of showing up for yourself is something to be proud of. Mental health isn't a destination—it's a practice. And you've proven you can practice consistently.

Some days were probably easier than others. That's normal. What matters is that you kept going.

We're honored to be part of your journey.

Here's to the next 30 days and beyond.

With gratitude,  
The MindMate Team

---

## 📥 Save Your Reflection

[Download Your 30-Day Report (PDF)]({{PDF_DOWNLOAD_LINK}})  
[Export Your Data]({{DATA_EXPORT_LINK}})  
[Share Your Journey]({{SHARE_LINK}})

---

*"The journey of a thousand miles begins with a single step."* — Lao Tzu  
*You've taken 30 steps. Keep walking.* 🌿
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{START_DATE}}` | First day using app | "January 1, 2024" |
| `{{END_DATE}}` | 30th day | "January 30, 2024" |
| `{{ACTIVE_DAYS}}` | Days with any activity | "24" |
| `{{ACTIVE_PERCENTAGE}}` | Activity rate | "80%" |
| `{{BOOK_COMPARISON}}` | Word count comparison | "3 short stories" |
| `{{POSITIVE_SENTIMENT}}` | Positive emotion % | "65%" |
| `{{IMPROVED_AREA}}` | Area of improvement | "Sleep quality" |
| `{{INSIGHT_1-5}}` | Personalized insights | "You tend to feel more positive on weekends" |
| `{{STRENGTH_1-4}}` | Identified strengths | "Consistency in daily check-ins" |
| `{{SKILL_NAME}}` | Developed skill | "Emotional awareness" |
| `{{HABIT_NAME}}` | Formed habit | "Morning mood logging" |

---

## 5. Annual Review Template

### Template Structure

```markdown
# 🎆 Your Year with MindMate: {{YEAR}} in Review

**Annual Report for:** {{USER_DISPLAY_NAME}}  
**Year:** {{YEAR}}  
**Report Generated:** {{GENERATION_DATE}}  
**Days with MindMate:** {{TOTAL_DAYS_WITH_APP}}

---

## 🌟 Executive Summary

### Your Year at a Glance

| Metric | Total | Daily Average |
|--------|-------|---------------|
| Days Active | {{ACTIVE_DAYS}}/365 | {{ACTIVE_PERCENTAGE}}% |
| Total Check-ins | {{TOTAL_CHECKINS}} | {{AVG_CHECKINS_PER_DAY}} |
| Mood Entries | {{TOTAL_MOOD_ENTRIES}} | {{AVG_MOOD_PER_DAY}} |
| Journal Entries | {{TOTAL_JOURNAL_ENTRIES}} | {{AVG_JOURNALS_PER_DAY}} |
| Total Words Written | {{TOTAL_WORDS}} | {{AVG_WORDS_PER_DAY}} |
| Meditation Minutes | {{TOTAL_MEDITATION_MINUTES}} | {{AVG_MEDITATION_PER_DAY}} |
| Goals Set | {{TOTAL_GOALS_SET}} | {{AVG_GOALS_PER_MONTH}}/month |
| Goals Achieved | {{TOTAL_GOALS_ACHIEVED}} | {{GOAL_SUCCESS_RATE}}% success rate |
| Streak Record | {{LONGEST_STREAK}} days | — |
| Current Streak | {{CURRENT_STREAK}} days | — |

---

## 📅 Month-by-Month Journey

### Your Year in Months

{{ANNUAL_HEATMAP}}

| Month | Mood Avg | Entries | Key Theme |
|-------|----------|---------|-----------|
| January | {{JAN_MOOD}}/10 | {{JAN_ENTRIES}} | {{JAN_THEME}} |
| February | {{FEB_MOOD}}/10 | {{FEB_ENTRIES}} | {{FEB_THEME}} |
| March | {{MAR_MOOD}}/10 | {{MAR_ENTRIES}} | {{MAR_THEME}} |
| April | {{APR_MOOD}}/10 | {{APR_ENTRIES}} | {{APR_THEME}} |
| May | {{MAY_MOOD}}/10 | {{MAY_ENTRIES}} | {{MAY_THEME}} |
| June | {{JUN_MOOD}}/10 | {{JUN_ENTRIES}} | {{JUN_THEME}} |
| July | {{JUL_MOOD}}/10 | {{JUL_ENTRIES}} | {{JUL_THEME}} |
| August | {{AUG_MOOD}}/10 | {{AUG_ENTRIES}} | {{AUG_THEME}} |
| September | {{SEP_MOOD}}/10 | {{SEP_ENTRIES}} | {{SEP_THEME}} |
| October | {{OCT_MOOD}}/10 | {{OCT_ENTRIES}} | {{OCT_THEME}} |
| November | {{NOV_MOOD}}/10 | {{NOV_ENTRIES}} | {{NOV_THEME}} |
| December | {{DEC_MOOD}}/10 | {{DEC_ENTRIES}} | {{DEC_THEME}} |

---

## 🎭 Your Emotional Year

### Mood Distribution

{{ANNUAL_MOOD_DISTRIBUTION_CHART}}

### Emotional Highlights

**Your Emotional Journey:**

{{EMOTIONAL_JOURNEY_NARRATIVE}}

### Seasonal Patterns

{{SEASONAL_PATTERN_1}}

{{SEASONAL_PATTERN_2}}

{{SEASONAL_PATTERN_3}}

### Significant Emotional Events

{{#EACH_SIGNIFICANT_EVENT}}
#### {{EVENT_DATE}} — {{EVENT_TITLE}}
{{EVENT_DESCRIPTION}}

Mood impact: {{EVENT_MOOD_IMPACT}}
{{/EACH_SIGNIFICANT_EVENT}}

---

## 📝 A Year of Words

### Your Writing Journey

**The Numbers:**
- Total journal entries: {{TOTAL_JOURNAL_ENTRIES}}
- Total words written: {{TOTAL_WORDS}}
- That's approximately {{WORD_COMPARISON}}
- Longest entry: {{LONGEST_ENTRY_WORDS}} words ({{LONGEST_ENTRY_DATE}})
- Most active writing month: {{MOST_ACTIVE_MONTH}}

### Themes That Shaped Your Year

{{#EACH_ANNUAL_THEME}}
#### {{THEME_NAME}} ({{THEME_COUNT}} mentions)
{{THEME_DESCRIPTION}}

Peak months: {{THEME_PEAK_MONTHS}}
Related emotions: {{THEME_EMOTIONS}}
{{/EACH_ANNUAL_THEME}}

### Your Words Through the Year

{{#EACH_QUARTERLY_QUOTE}}
> *"{{QUOTE_TEXT}}"*
> 
> — {{QUOTE_DATE}}
{{/EACH_QUARTERLY_QUOTE}}

---

## 🎯 Goals & Achievements

### Goals Set This Year

| Quarter | Goals Set | Completed | Success Rate |
|---------|-----------|-----------|--------------|
| Q1 | {{Q1_GOALS_SET}} | {{Q1_GOALS_COMPLETED}} | {{Q1_SUCCESS_RATE}}% |
| Q2 | {{Q2_GOALS_SET}} | {{Q2_GOALS_COMPLETED}} | {{Q2_SUCCESS_RATE}}% |
| Q3 | {{Q3_GOALS_SET}} | {{Q3_GOALS_COMPLETED}} | {{Q3_SUCCESS_RATE}}% |
| Q4 | {{Q4_GOALS_SET}} | {{Q4_GOALS_COMPLETED}} | {{Q4_SUCCESS_RATE}}% |
| **Total** | **{{TOTAL_GOALS_SET}}** | **{{TOTAL_GOALS_COMPLETED}}** | **{{ANNUAL_SUCCESS_RATE}}%** |

### Major Achievements

{{#EACH_MAJOR_ACHIEVEMENT}}
#### 🏆 {{ACHIEVEMENT_NAME}}
**Date:** {{ACHIEVEMENT_DATE}}  
**Description:** {{ACHIEVEMENT_DESCRIPTION}}  
**Impact:** {{ACHIEVEMENT_IMPACT}}
{{/EACH_MAJOR_ACHIEVEMENT}}

### Completed Goals Spotlight

{{#EACH_COMPLETED_GOAL}}
- ✅ **{{GOAL_NAME}}** ({{GOAL_CATEGORY}}) — Completed {{COMPLETION_DATE}}
{{/EACH_COMPLETED_GOAL}}

---

## 🏅 Milestones & Badges

### Milestones Reached This Year

{{#EACH_MILESTONE}}
- {{MILESTONE_ICON}} **{{MILESTONE_NAME}}** — {{MILESTONE_DATE}}
{{/EACH_MILESTONE}}

### Badges Earned

{{BADGE_COLLECTION_DISPLAY}}

**Total Badges:** {{TOTAL_BADGES_EARNED}}/{{TOTAL_BADGES_AVAILABLE}}  
**Rarity Score:** {{BADGE_RARITY_SCORE}}/100

---

## 📊 Year-Over-Year Comparison

{{#IF_PREVIOUS_YEAR}}
### How {{YEAR}} Compares to {{PREVIOUS_YEAR}}

| Metric | {{PREVIOUS_YEAR}} | {{YEAR}} | Change |
|--------|-------------------|----------|--------|
| Active Days | {{PREV_ACTIVE_DAYS}} | {{ACTIVE_DAYS}} | {{ACTIVE_CHANGE}} |
| Mood Entries | {{PREV_MOOD_ENTRIES}} | {{TOTAL_MOOD_ENTRIES}} | {{MOOD_CHANGE}} |
| Journal Entries | {{PREV_JOURNAL_ENTRIES}} | {{TOTAL_JOURNAL_ENTRIES}} | {{JOURNAL_CHANGE}} |
| Words Written | {{PREV_TOTAL_WORDS}} | {{TOTAL_WORDS}} | {{WORDS_CHANGE}} |
| Goals Completed | {{PREV_GOALS_COMPLETED}} | {{TOTAL_GOALS_COMPLETED}} | {{GOALS_CHANGE}} |
| Average Mood | {{PREV_AVG_MOOD}}/10 | {{ANNUAL_AVG_MOOD}}/10 | {{MOOD_TREND}} |

**Your Growth:** {{GROWTH_SUMMARY}}
{{/IF_PREVIOUS_YEAR}}

{{#NO_PREVIOUS_YEAR}}
> 🌱 *This was your first full year with MindMate! We're excited to see how your journey evolves in the years to come.*
{{/NO_PREVIOUS_YEAR}}

---

## 🔍 Deep Insights

### Patterns Discovered

{{ANNUAL_PATTERN_1}}

{{ANNUAL_PATTERN_2}}

{{ANNUAL_PATTERN_3}}

{{ANNUAL_PATTERN_4}}

{{ANNUAL_PATTERN_5}}

### Correlations Found

{{CORRELATION_INSIGHT_1}}

{{CORRELATION_INSIGHT_2}}

{{CORRELATION_INSIGHT_3}}

---

## 💪 Your Strengths This Year

### What You Excelled At

{{STRENGTH_1}}

{{STRENGTH_2}}

{{STRENGTH_3}}

{{STRENGTH_4}}

{{STRENGTH_5}}

### Areas of Growth

{{GROWTH_AREA_1}}

{{GROWTH_AREA_2}}

{{GROWTH_AREA_3}}

---

## 🎬 Year in Review: Key Moments

### Your Highest Highs

{{#EACH_HIGH_MOMENT}}
#### {{HIGH_DATE}} — {{HIGH_TITLE}}
{{HIGH_DESCRIPTION}}
Mood: {{HIGH_MOOD}}/10
{{/EACH_HIGH_MOMENT}}

### Challenges You Overcame

{{#EACH_CHALLENGE}}
#### {{CHALLENGE_PERIOD}} — {{CHALLENGE_TITLE}}
{{CHALLENGE_DESCRIPTION}}

How you coped: {{COPING_STRATEGIES}}
What you learned: {{LESSON_LEARNED}}
{{/EACH_CHALLENGE}}

### Turning Points

{{#EACH_TURNING_POINT}}
#### {{TURNING_DATE}} — {{TURNING_TITLE}}
{{TURNING_DESCRIPTION}}
{{/EACH_TURNING_POINT}}

---

## 🎁 Gifts from {{YEAR}}

### Skills Developed

{{#EACH_SKILL}}
- ✨ {{SKILL_NAME}}: {{SKILL_DESCRIPTION}}
{{/EACH_SKILL}}

### Habits Formed

{{#EACH_HABIT}}
- 🌱 {{HABIT_NAME}}: Practiced {{HABIT_FREQUENCY}} over {{HABIT_DURATION}}
{{/EACH_HABIT}}

### Self-Discoveries

{{#EACH_DISCOVERY}}
- 💡 {{DISCOVERY_DESCRIPTION}}
{{/EACH_DISCOVERY}}

---

## 🌅 Looking Ahead to {{NEXT_YEAR}}

### Suggested Focus Areas

Based on your {{YEAR}} patterns, consider focusing on:

{{FOCUS_AREA_1}}

{{FOCUS_AREA_2}}

{{FOCUS_AREA_3}}

### Recommended Goals for {{NEXT_YEAR}}

{{RECOMMENDED_GOAL_1}}

{{RECOMMENDED_GOAL_2}}

{{RECOMMENDED_GOAL_3}}

### Features to Explore

{{FEATURE_RECOMMENDATION_1}}

{{FEATURE_RECOMMENDATION_2}}

{{FEATURE_RECOMMENDATION_3}}

---

## 💌 A Letter to You

Dear {{USER_NAME}},

{{YEAR}} is now part of your story. Through MindMate, you've captured {{TOTAL_ENTRIES}} moments of your life—moments of joy, challenge, growth, and reflection.

You've shown up for yourself {{ACTIVE_DAYS}} times this year. That's {{ACTIVE_DAYS}} times you chose to prioritize your mental health. {{ACTIVE_DAYS}} times you chose self-awareness. {{ACTIVE_DAYS}} times you chose growth.

It hasn't always been easy. There were days when logging a mood felt like too much. Days when journaling seemed impossible. And that's okay. Progress isn't linear, and healing isn't a straight line.

What matters is that you kept coming back. You kept trying. You kept growing.

We're proud of you. You should be proud of you too.

Here's to {{NEXT_YEAR}}—may it bring you continued growth, deeper self-understanding, and moments of genuine joy.

With gratitude and admiration,  
The MindMate Team

---

## 📥 Your Annual Report Package

[📄 Download Full Report (PDF)]({{PDF_DOWNLOAD_LINK}})  
[📊 Download Data Summary (CSV)]({{CSV_DOWNLOAD_LINK}})  
[🖼️ Download Mood Charts]({{CHARTS_DOWNLOAD_LINK}})  
[📓 Export All Journal Entries]({{JOURNAL_EXPORT_LINK}})

---

## 🎊 Share Your Journey

Your story might inspire others. Consider sharing:

[Share on Twitter]({{SHARE_TWITTER}})  
[Share on Facebook]({{SHARE_FACEBOOK}})  
[Share on Instagram]({{SHARE_INSTAGRAM}})

---

*"The unexamined life is not worth living."* — Socrates  
*Thank you for examining, reflecting, and growing with us.* 🌿

---

**Questions about your annual review?** Contact us at {{SUPPORT_EMAIL}}
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{YEAR}}` | Report year | "2024" |
| `{{TOTAL_DAYS_WITH_APP}}` | Days since signup | "365" |
| `{{ACTIVE_DAYS}}` | Days with any activity | "280" |
| `{{ACTIVE_PERCENTAGE}}` | Activity percentage | "77%" |
| `{{LONGEST_STREAK}}` | Best streak ever | "45" |
| `{{ANNUAL_HEATMAP}}` | Visual activity heatmap | [Heatmap image] |
| `{{JAN_MOOD}}` | January avg mood | "7.2" |
| `{{JAN_THEME}}` | January main theme | "New Beginnings" |
| `{{EMOTIONAL_JOURNEY_NARRATIVE}}` | Year emotional story | "Your year started strong..." |
| `{{WORD_COMPARISON}}` | Word count metaphor | "a 200-page novel" |
| `{{ANNUAL_PATTERN_1-5}}` | Discovered patterns | "You tend to feel lower on Mondays" |
| `{{STRENGTH_1-5}}` | Yearly strengths | "Resilience during Q3 challenges" |
| `{{FOCUS_AREA_1-3}}` | Next year suggestions | "Building stronger morning routines" |

---

## 6. Gentle Re-engagement Report

### Template Structure

```markdown
# 🌿 We Miss You, {{USER_NAME}}

**Last Activity:** {{LAST_ACTIVITY_DATE}} ({{DAYS_INACTIVE}} days ago)  
**Report Generated:** {{GENERATION_DATE}}

---

## 💚 A Gentle Check-In

Hi {{USER_NAME}},

We noticed you haven't been around MindMate lately. We wanted to reach out—not to pressure you, but to let you know we're here whenever you're ready.

---

## 📊 Your Journey So Far

### Before Your Break

| Metric | Your Best | When |
|--------|-----------|------|
| Longest Streak | {{BEST_STREAK}} days | {{BEST_STREAK_PERIOD}} |
| Most Active Week | {{MOST_ACTIVE_WEEK_ENTRIES}} entries | {{MOST_ACTIVE_WEEK}} |
| Best Mood Day | {{BEST_MOOD}}/10 | {{BEST_MOOD_DATE}} |
| Total Words Written | {{TOTAL_WORDS}} | All time |
| Goals Completed | {{GOALS_COMPLETED}} | All time |

### Your Progress Highlights

{{#EACH_HIGHLIGHT}}
- 🌟 {{HIGHLIGHT_DESCRIPTION}}
{{/EACH_HIGHLIGHT}}

---

## 🤔 No Pressure, Just Possibilities

We know life gets busy. Priorities shift. Routines change. Sometimes taking a break is exactly what you need.

**There's no judgment here.**

But if you've been thinking about coming back, we wanted to remind you of what's waiting:

### What's New Since You've Been Away

{{#EACH_NEW_FEATURE}}
- ✨ **{{FEATURE_NAME}}**: {{FEATURE_DESCRIPTION}}
{{/EACH_NEW_FEATURE}}

### Your Data Is Safe

Everything you logged is still here:
- {{PRESERVED_ENTRY_COUNT}} journal entries
- {{PRESERVED_MOOD_COUNT}} mood records
- {{PRESERVED_GOAL_COUNT}} goals
- Your entire history

---

## 🌱 If You're Ready to Return

### Gentle Re-entry Options

**Option 1: The Soft Start**  
Just check in once. Log one mood. Write one sentence. That's it. No pressure to continue—just one moment of connection.

**Option 2: The Fresh Start**  
Clear the slate and start anew. Your history stays, but we can reset your streaks and goals if that feels better.

**Option 3: The Guided Return**  
Let us create a personalized re-engagement plan based on what worked for you before.

[Choose Your Path]({{RE_ENGAGEMENT_LINK}})

---

## 💭 Reflection Prompts

If you're not sure whether to return, consider:

{{REFLECTION_PROMPT_1}}

{{REFLECTION_PROMPT_2}}

{{REFLECTION_PROMPT_3}}

---

## 🎯 What Users Say After Returning

> *"{{TESTIMONIAL_1}}"*  
> — {{TESTIMONIAL_AUTHOR_1}}

> *"{{TESTIMONIAL_2}}"*  
> — {{TESTIMONIAL_AUTHOR_2}}

---

## 🔧 If MindMate Wasn't Working For You

We'd love to understand why. Your feedback helps us improve:

[Quick Feedback Survey]({{FEEDBACK_LINK}}) (takes 2 minutes)

Common reasons people step away:
- {{COMMON_REASON_1}}
- {{COMMON_REASON_2}}
- {{COMMON_REASON_3}}

If any of these resonate, we've made changes that might help.

---

## 📅 A Different Approach

Maybe daily engagement felt like too much. Here are alternatives:

### Weekly Check-In Mode
- One mood log per week
- One journal prompt per week
- Weekly progress summary

[Switch to Weekly Mode]({{WEEKLY_MODE_LINK}})

### On-Demand Mode
- No notifications
- No streaks
- Use only when you want to

[Switch to On-Demand]({{ON_DEMAND_LINK}})

### Reminder Adjustment
- Change notification frequency
- Adjust timing
- Choose what you want to be reminded about

[Adjust Reminders]({{REMINDER_SETTINGS_LINK}})

---

## 💚 Whatever You Choose

Whether you return to MindMate or not, we hope you're taking care of yourself. Mental health matters, however you choose to support it.

If MindMate was helpful before, we're here. If you need something different, we understand.

**No pressure. No guilt. Just care.**

---

## 🌸 Ready When You Are

[Open MindMate]({{APP_OPEN_LINK}})  
[Schedule a Gentle Reminder]({{REMINDER_LINK}})  
[Talk to Support]({{SUPPORT_LINK}})

---

With care,  
The MindMate Team

P.S. {{PERSONALIZED_PS}}
```

### Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `{{LAST_ACTIVITY_DATE}}` | Last app usage | "December 1, 2024" |
| `{{DAYS_INACTIVE}}` | Days since last use | "14" |
| `{{BEST_STREAK}}` | Personal best streak | "21" |
| `{{BEST_STREAK_PERIOD}}` | When streak occurred | "October 2024" |
| `{{MOST_ACTIVE_WEEK_ENTRIES}}` | Peak week activity | "15" |
| `{{PRESERVED_ENTRY_COUNT}}` | Saved journal entries | "47" |
| `{{NEW_FEATURE_1}}` | Recently added feature | "Guided meditations" |
| `{{REFLECTION_PROMPT_1}}` | Self-reflection question | "What would make checking in feel manageable?" |
| `{{TESTIMONIAL_1}}` | User return quote | "Coming back felt like reconnecting with an old friend" |
| `{{COMMON_REASON_1}}` | Why users leave | "Felt overwhelmed by daily notifications" |
| `{{PERSONALIZED_PS}}` | Custom closing note | "We remember how consistent you were in September" |

---

## Appendix: Common Variable Definitions

### User Variables
| Variable | Description |
|----------|-------------|
| `{{USER_DISPLAY_NAME}}` | User's preferred display name |
| `{{USER_NAME}}` | Short form of user's name |
| `{{USER_ID}}` | Internal user identifier |
| `{{USER_SIGNUP_DATE}}` | Account creation date |

### Date Variables
| Variable | Description | Format |
|----------|-------------|--------|
| `{{GENERATION_DATE}}` | When report was created | "January 15, 2024" |
| `{{TODAY}}` | Current date | "January 15, 2024" |
| `{{CURRENT_MONTH}}` | Full month name | "January" |
| `{{CURRENT_YEAR}}` | Four-digit year | "2024" |

### Activity Variables
| Variable | Description |
|----------|-------------|
| `{{CHECKIN_COUNT}}` | Number of check-ins |
| `{{MOOD_ENTRY_COUNT}}` | Number of mood entries |
| `{{JOURNAL_COUNT}}` | Number of journal entries |
| `{{APP_MINUTES}}` | Time spent in app |
| `{{CURRENT_STREAK}}` | Current daily streak |
| `{{ACTIVE_DAYS}}` | Days with any activity |

### Mood Variables
| Variable | Description |
|----------|-------------|
| `{{TOP_MOOD}}` | Most frequent mood |
| `{{AVERAGE_MOOD_RATING}}` | Mean mood score |
| `{{MOOD_TREND_DIRECTION}}` | Improving/declining/stable |
| `{{HIGHEST_MOOD_RATING}}` | Best mood score |
| `{{LOWEST_MOOD_RATING}}` | Worst mood score |

### Goal Variables
| Variable | Description |
|----------|-------------|
| `{{GOALS_SET}}` | Total goals created |
| `{{GOALS_COMPLETED}}` | Goals achieved |
| `{{GOAL_PROGRESS}}` | Percentage complete |
| `{{GOAL_STATUS}}` | Current status |

### System Variables
| Variable | Description |
|----------|-------------|
| `{{SUPPORT_EMAIL}}` | Support contact email |
| `{{APP_OPEN_LINK}}` | Deep link to app |
| `{{PDF_DOWNLOAD_LINK}}` | Report download URL |

---

## Usage Notes

### Conditional Blocks

Templates use conditional syntax for optional content:

```
{{#IF_CONDITION}}
Content shown when condition is true
{{/IF_CONDITION}}

{{#NO_CONDITION}}
Content shown when condition is false
{{/NO_CONDITION}}

{{#EACH_ITEM}}
Repeated content for each item
{{/EACH_ITEM}}
```

### Personalization Guidelines

1. **Always use the user's preferred name** when available
2. **Reference specific user data** to make reports feel personal
3. **Adjust tone based on user activity level** (more encouraging for low activity)
4. **Include both quantitative and qualitative insights**
5. **Provide actionable recommendations** based on patterns

### Tone Adjustments

| User Segment | Tone |
|--------------|------|
| High engagement | Celebratory, challenging |
| Moderate engagement | Encouraging, supportive |
| Low engagement | Gentle, non-judgmental |
| Returning after break | Welcoming, understanding |
| New user (30-day) | Educational, guiding |

---

*End of Progress Report Templates*

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained by:** MindMate AI Content Team
