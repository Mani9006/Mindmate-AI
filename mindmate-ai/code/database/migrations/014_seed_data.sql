-- Migration 014: Seed Data
-- MindMate AI Database Migration
-- Default data for challenges, notification templates, avatar options, subscription tiers
-- Created by Agent 67

BEGIN;

-- ============================================
-- SEED SUBSCRIPTION TIERS
-- ============================================

INSERT INTO subscription_tiers (
    id, name, display_name, description, price_monthly, price_yearly, 
    currency, features, limits, is_active, is_popular, trial_days, sort_order
) VALUES 
(
    gen_random_uuid(),
    'free',
    'Free',
    'Get started with basic mental wellness support',
    0.00,
    0.00,
    'USD',
    '[
        {"name": "AI Chat", "description": "Limited daily messages", "included": true},
        {"name": "Mood Tracking", "description": "Basic mood logging", "included": true},
        {"name": "Daily Challenges", "description": "Access to daily wellness challenges", "included": true},
        {"name": "Progress Reports", "description": "Weekly summary reports", "included": true},
        {"name": "Crisis Support", "description": "24/7 crisis resources", "included": true}
    ]'::jsonb,
    '{"daily_messages": 20, "mood_entries_per_day": 3, "tasks": 5, "storage_mb": 50}'::jsonb,
    true,
    false,
    0,
    1
),
(
    gen_random_uuid(),
    'premium',
    'Premium',
    'Enhanced support for your mental wellness journey',
    9.99,
    95.88,
    'USD',
    '[
        {"name": "Unlimited AI Chat", "description": "Unlimited messages with AI companion", "included": true},
        {"name": "Advanced Mood Tracking", "description": "Detailed mood analytics and insights", "included": true},
        {"name": "All Challenges", "description": "Access to all challenge types", "included": true},
        {"name": "Therapy Notes", "description": "Share notes with your therapist", "included": true},
        {"name": "Priority Support", "description": "Faster response times", "included": true},
        {"name": "Custom Avatars", "description": "Premium avatar options", "included": true},
        {"name": "Memory Features", "description": "Advanced AI memory and context", "included": true}
    ]'::jsonb,
    '{"daily_messages": -1, "mood_entries_per_day": -1, "tasks": -1, "storage_mb": 500}'::jsonb,
    true,
    true,
    7,
    2
),
(
    gen_random_uuid(),
    'pro',
    'Pro',
    'Complete mental wellness solution with professional integration',
    19.99,
    191.88,
    'USD',
    '[
        {"name": "Everything in Premium", "description": "All Premium features included", "included": true},
        {"name": "Therapist Integration", "description": "Direct connection with licensed therapists", "included": true},
        {"name": "Family Sharing", "description": "Share with up to 3 family members", "included": true},
        {"name": "Advanced Reports", "description": "Monthly and quarterly insights", "included": true},
        {"name": "API Access", "description": "Integrate with other wellness apps", "included": true},
        {"name": "Custom Workflows", "description": "Personalized AI workflows", "included": true},
        {"name": "White-label Options", "description": "For organizations", "included": true}
    ]'::jsonb,
    '{"daily_messages": -1, "mood_entries_per_day": -1, "tasks": -1, "storage_mb": 2000, "family_members": 3}'::jsonb,
    true,
    false,
    14,
    3
);

-- ============================================
-- SEED NOTIFICATION TEMPLATES
-- ============================================

INSERT INTO notification_templates (
    id, name, description, title_template, body_template, 
    notification_type, default_channel, default_priority, variables, is_active, category
) VALUES 
-- System Notifications
(
    gen_random_uuid(),
    'welcome_new_user',
    'Welcome message for new users',
    'Welcome to MindMate AI! 🌟',
    'Hi {{firstName}}, welcome to your personal mental wellness companion. We''re here to support you on your journey to better mental health.',
    'SYSTEM',
    'IN_APP',
    'MEDIUM',
    '{"firstName": "string"}'::jsonb,
    true,
    'onboarding'
),
(
    gen_random_uuid(),
    'onboarding_reminder',
    'Reminder to complete onboarding',
    'Complete Your Profile',
    'Hi {{firstName}}, take a few minutes to complete your profile so we can personalize your experience better.',
    'SYSTEM',
    'PUSH',
    'LOW',
    '{"firstName": "string"}'::jsonb,
    true,
    'onboarding'
),

-- Mood Check Notifications
(
    gen_random_uuid(),
    'daily_mood_check',
    'Daily mood check-in reminder',
    'How are you feeling today? 🌈',
    'Take a moment to check in with yourself. Logging your mood helps us understand your patterns and provide better support.',
    'MOOD_CHECK',
    'PUSH',
    'LOW',
    '{}'::jsonb,
    true,
    'wellness'
),
(
    gen_random_uuid(),
    'weekly_mood_summary',
    'Weekly mood summary',
    'Your Weekly Mood Summary 📊',
    'Hi {{firstName}}, your mood summary for this week is ready. You logged {{entryCount}} mood entries with an average score of {{averageScore}}.',
    'MOOD_CHECK',
    'IN_APP',
    'LOW',
    '{"firstName": "string", "entryCount": "number", "averageScore": "number"}'::jsonb,
    true,
    'wellness'
),

-- Task Reminders
(
    gen_random_uuid(),
    'task_due_soon',
    'Task due reminder',
    'Task Due Soon ⏰',
    'Your task "{{taskTitle}}" is due {{dueTime}}. Take a moment to complete it when you can.',
    'TASK_DUE',
    'PUSH',
    'MEDIUM',
    '{"taskTitle": "string", "dueTime": "string"}'::jsonb,
    true,
    'tasks'
),
(
    gen_random_uuid(),
    'task_overdue',
    'Overdue task notification',
    'Overdue Task 📋',
    'Your task "{{taskTitle}}" is now overdue. Would you like to reschedule or mark it as complete?',
    'TASK_DUE',
    'IN_APP',
    'MEDIUM',
    '{"taskTitle": "string"}'::jsonb,
    true,
    'tasks'
),

-- Achievement Notifications
(
    gen_random_uuid(),
    'achievement_unlocked',
    'Achievement unlocked notification',
    'Achievement Unlocked! 🏆',
    'Congratulations {{firstName}}! You''ve earned the "{{achievementTitle}}" achievement and received {{xpEarned}} XP!',
    'ACHIEVEMENT',
    'IN_APP',
    'MEDIUM',
    '{"firstName": "string", "achievementTitle": "string", "xpEarned": "number"}'::jsonb,
    true,
    'gamification'
),
(
    gen_random_uuid(),
    'challenge_completed',
    'Challenge completed notification',
    'Challenge Completed! 🎯',
    'Amazing work! You''ve completed the "{{challengeTitle}}" challenge. You earned {{xpEarned}} XP!',
    'ACHIEVEMENT',
    'IN_APP',
    'MEDIUM',
    '{"challengeTitle": "string", "xpEarned": "number"}'::jsonb,
    true,
    'gamification'
),

-- Progress Updates
(
    gen_random_uuid(),
    'weekly_progress_report',
    'Weekly progress report ready',
    'Your Weekly Progress Report 📈',
    'Hi {{firstName}}, your weekly progress report is ready! You''ve made great strides this week. Check it out to see your insights.',
    'PROGRESS_UPDATE',
    'IN_APP',
    'LOW',
    '{"firstName": "string"}'::jsonb,
    true,
    'progress'
),
(
    gen_random_uuid(),
    'streak_milestone',
    'Streak milestone achieved',
    '{{streakCount}} Day Streak! 🔥',
    'Incredible! You''ve maintained a {{streakCount}}-day streak. Keep up the amazing work on your wellness journey!',
    'PROGRESS_UPDATE',
    'IN_APP',
    'MEDIUM',
    '{"streakCount": "number"}'::jsonb,
    true,
    'progress'
),

-- Check-in Notifications
(
    gen_random_uuid(),
    'daily_check_in',
    'Daily wellness check-in',
    'Daily Check-in 💙',
    'Hi {{firstName}}, it''s time for your daily wellness check-in. Taking just a few minutes for yourself can make a big difference.',
    'CHECK_IN',
    'PUSH',
    'LOW',
    '{"firstName": "string"}'::jsonb,
    true,
    'wellness'
),
(
    gen_random_uuid(),
    'missed_check_in',
    'Missed check-in reminder',
    'We Missed You 💭',
    'Hi {{firstName}}, we noticed you missed your check-in yesterday. No pressure - you can start fresh today whenever you''re ready.',
    'CHECK_IN',
    'PUSH',
    'LOW',
    '{"firstName": "string"}'::jsonb,
    true,
    'wellness'
),

-- Wellness Tips
(
    gen_random_uuid(),
    'daily_wellness_tip',
    'Daily wellness tip',
    'Wellness Tip of the Day ✨',
    '{{tipContent}}',
    'WELLNESS_TIP',
    'PUSH',
    'LOW',
    '{"tipContent": "string"}'::jsonb,
    true,
    'wellness'
),

-- Subscription Notifications
(
    gen_random_uuid(),
    'trial_ending',
    'Trial ending reminder',
    'Your Trial Ends Soon 🔔',
    'Hi {{firstName}}, your Premium trial ends in {{daysLeft}} days. Continue your journey by upgrading your subscription.',
    'SUBSCRIPTION',
    'EMAIL',
    'MEDIUM',
    '{"firstName": "string", "daysLeft": "number"}'::jsonb,
    true,
    'billing'
),
(
    gen_random_uuid(),
    'subscription_renewed',
    'Subscription renewed confirmation',
    'Subscription Renewed ✅',
    'Your MindMate AI subscription has been successfully renewed. Thank you for continuing your wellness journey with us!',
    'SUBSCRIPTION',
    'EMAIL',
    'LOW',
    '{}'::jsonb,
    true,
    'billing'
),

-- Crisis Alerts
(
    gen_random_uuid(),
    'crisis_resources',
    'Crisis resources notification',
    'We''re Here to Help 💙',
    'We noticed you might be going through a difficult time. Remember, you''re not alone. Crisis support resources are available 24/7.',
    'CRISIS_ALERT',
    'IN_APP',
    'HIGH',
    '{}'::jsonb,
    true,
    'safety'
);

-- ============================================
-- SEED DEFAULT CHALLENGES
-- ============================================

INSERT INTO challenges (
    id, name, title, description, challenge_type, category, difficulty,
    requirements, rewards, duration_days, is_active, is_default, sort_order
) VALUES 
-- Daily Challenges
(
    gen_random_uuid(),
    'daily_mood_log',
    'Daily Mood Check',
    'Log your mood at least once today to build awareness of your emotional patterns.',
    'DAILY',
    'wellness',
    'EASY',
    '{"minMoodEntries": 1}'::jsonb,
    '{"xp": 10, "badge": null}'::jsonb,
    1,
    true,
    true,
    1
),
(
    gen_random_uuid(),
    'daily_gratitude',
    'Gratitude Moment',
    'Write down three things you''re grateful for today.',
    'DAILY',
    'wellness',
    'EASY',
    '{"journalEntry": true, "minWords": 20}'::jsonb,
    '{"xp": 15, "badge": null}'::jsonb,
    1,
    true,
    true,
    2
),
(
    gen_random_uuid(),
    'daily_breathing',
    'Mindful Breathing',
    'Complete a 5-minute breathing exercise to center yourself.',
    'DAILY',
    'mindfulness',
    'EASY',
    '{"activityType": "breathing", "durationMinutes": 5}'::jsonb,
    '{"xp": 10, "badge": null}'::jsonb,
    1,
    true,
    true,
    3
),

-- Streak Challenges
(
    gen_random_uuid(),
    'streak_7_day_mood',
    'Week of Awareness',
    'Log your mood for 7 consecutive days.',
    'STREAK',
    'wellness',
    'MEDIUM',
    '{"consecutiveDays": 7, "activity": "mood_log"}'::jsonb,
    '{"xp": 100, "badge": "mood_master"}'::jsonb,
    7,
    true,
    true,
    10
),
(
    gen_random_uuid(),
    'streak_30_day_journal',
    'Month of Reflection',
    'Write in your journal for 30 consecutive days.',
    'STREAK',
    'wellness',
    'HARD',
    '{"consecutiveDays": 30, "activity": "journal_entry"}'::jsonb,
    '{"xp": 500, "badge": "reflection_pro"}'::jsonb,
    30,
    true,
    true,
    11
),

-- Milestone Challenges
(
    gen_random_uuid(),
    'milestone_50_messages',
    'Conversationalist',
    'Send 50 messages to your AI companion.',
    'MILESTONE',
    'engagement',
    'EASY',
    '{"totalCount": 50, "activity": "message_sent"}'::jsonb,
    '{"xp": 50, "badge": "chatty"}'::jsonb,
    NULL,
    true,
    true,
    20
),
(
    gen_random_uuid(),
    'milestone_100_tasks',
    'Task Master',
    'Complete 100 tasks to build positive habits.',
    'MILESTONE',
    'productivity',
    'MEDIUM',
    '{"totalCount": 100, "activity": "task_completed"}'::jsonb,
    '{"xp": 200, "badge": "task_master"}'::jsonb,
    NULL,
    true,
    true,
    21
),
(
    gen_random_uuid(),
    'milestone_30_moods',
    'Emotion Explorer',
    'Log 30 mood entries to understand your emotional landscape.',
    'MILESTONE',
    'wellness',
    'MEDIUM',
    '{"totalCount": 30, "activity": "mood_logged"}'::jsonb,
    '{"xp": 150, "badge": "emotion_explorer"}'::jsonb,
    NULL,
    true,
    true,
    22
),

-- Therapeutic Challenges
(
    gen_random_uuid(),
    'therapeutic_cbt_thought',
    'Thought Reframe',
    'Practice cognitive reframing by identifying and challenging one negative thought.',
    'THERAPEUTIC',
    'cbt',
    'MEDIUM',
    '{"activityType": "thought_reframe", "minCount": 1}'::jsonb,
    '{"xp": 25, "badge": null}'::jsonb,
    1,
    true,
    true,
    30
),
(
    gen_random_uuid(),
    'therapeutic_self_care',
    'Self-Care Day',
    'Dedicate time to one meaningful self-care activity today.',
    'THERAPEUTIC',
    'self_care',
    'EASY',
    '{"activityType": "self_care", "durationMinutes": 30}'::jsonb,
    '{"xp": 20, "badge": null}'::jsonb,
    1,
    true,
    true,
    31
),
(
    gen_random_uuid(),
    'therapeutic_sleep_hygiene',
    'Better Sleep Week',
    'Follow a consistent sleep schedule for 7 days.',
    'THERAPEUTIC',
    'sleep',
    'MEDIUM',
    '{"consecutiveDays": 7, "activity": "sleep_log"}'::jsonb,
    '{"xp": 150, "badge": "sleep_champion"}'::jsonb,
    7,
    true,
    true,
    32
),

-- Educational Challenges
(
    gen_random_uuid(),
    'educational_anxiety_article',
    'Learn About Anxiety',
    'Read an educational article about understanding and managing anxiety.',
    'EDUCATIONAL',
    'learning',
    'EASY',
    '{"contentType": "article", "topic": "anxiety"}'::jsonb,
    '{"xp": 15, "badge": null}'::jsonb,
    1,
    true,
    true,
    40
),
(
    gen_random_uuid(),
    'educational_mindfulness_basics',
    'Mindfulness Foundations',
    'Complete the mindfulness basics educational module.',
    'EDUCATIONAL',
    'learning',
    'EASY',
    '{"contentType": "module", "moduleId": "mindfulness_basics"}'::jsonb,
    '{"xp": 50, "badge": "mindfulness_student"}'::jsonb,
    NULL,
    true,
    true,
    41
);

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (
    id, name, title, description, category, 
    requirement_type, requirement_value, xp_reward, is_hidden, is_active, sort_order
) VALUES 
(
    gen_random_uuid(),
    'first_steps',
    'First Steps',
    'Complete your first mood entry',
    'wellness',
    'mood_entries',
    1,
    10,
    false,
    true,
    1
),
(
    gen_random_uuid(),
    'mood_tracker',
    'Mood Tracker',
    'Log your mood 10 times',
    'wellness',
    'mood_entries',
    10,
    25,
    false,
    true,
    2
),
(
    gen_random_uuid(),
    'emotion_master',
    'Emotion Master',
    'Log your mood 100 times',
    'wellness',
    'mood_entries',
    100,
    100,
    false,
    true,
    3
),
(
    gen_random_uuid(),
    'task_starter',
    'Task Starter',
    'Complete your first task',
    'productivity',
    'tasks_completed',
    1,
    10,
    false,
    true,
    10
),
(
    gen_random_uuid(),
    'task_warrior',
    'Task Warrior',
    'Complete 50 tasks',
    'productivity',
    'tasks_completed',
    50,
    100,
    false,
    true,
    11
),
(
    gen_random_uuid(),
    'chat_initiate',
    'Chat Initiate',
    'Send your first message',
    'engagement',
    'messages_sent',
    1,
    5,
    false,
    true,
    20
),
(
    gen_random_uuid(),
    'conversationalist',
    'Conversationalist',
    'Send 500 messages',
    'engagement',
    'messages_sent',
    500,
    150,
    false,
    true,
    21
),
(
    gen_random_uuid(),
    'streak_3_days',
    '3-Day Streak',
    'Log in for 3 consecutive days',
    'consistency',
    'login_streak',
    3,
    25,
    false,
    true,
    30
),
(
    gen_random_uuid(),
    'streak_7_days',
    'Week Warrior',
    'Log in for 7 consecutive days',
    'consistency',
    'login_streak',
    7,
    75,
    false,
    true,
    31
),
(
    gen_random_uuid(),
    'streak_30_days',
    'Monthly Master',
    'Log in for 30 consecutive days',
    'consistency',
    'login_streak',
    30,
    300,
    false,
    true,
    32
),
(
    gen_random_uuid(),
    'challenge_champion',
    'Challenge Champion',
    'Complete 10 challenges',
    'gamification',
    'challenges_completed',
    10,
    100,
    false,
    true,
    40
),
(
    gen_random_uuid(),
    'first_challenge',
    'Challenge Accepted',
    'Complete your first challenge',
    'gamification',
    'challenges_completed',
    1,
    25,
    false,
    true,
    41
),
(
    gen_random_uuid(),
    'night_owl',
    'Night Owl',
    'Log a mood entry after 10 PM',
    'special',
    'late_night_entry',
    1,
    10,
    true,
    true,
    50
),
(
    gen_random_uuid(),
    'early_bird',
    'Early Bird',
    'Log a mood entry before 7 AM',
    'special',
    'early_morning_entry',
    1,
    10,
    true,
    true,
    51
);

-- ============================================
-- SEED AVATAR OPTIONS
-- ============================================

INSERT INTO avatar_options (
    id, name, display_name, description, avatar_type, category,
    asset_url, thumbnail_url, is_premium, required_tier, is_active, metadata, sort_order
) VALUES 
-- Free Character Avatars
(
    gen_random_uuid(),
    'char_zen_circle',
    'Zen Circle',
    'A calming circle representing mindfulness and balance',
    'CHARACTER',
    'minimalist',
    '/avatars/characters/zen-circle.svg',
    '/avatars/characters/zen-circle-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#6366F1", "style": "minimalist"}'::jsonb,
    1
),
(
    gen_random_uuid(),
    'char_sunshine',
    'Sunshine',
    'Bright and cheerful sun character',
    'CHARACTER',
    'cheerful',
    '/avatars/characters/sunshine.svg',
    '/avatars/characters/sunshine-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#F59E0B", "style": "friendly"}'::jsonb,
    2
),
(
    gen_random_uuid(),
    'char_ocean_wave',
    'Ocean Wave',
    'Flowing wave representing calm and tranquility',
    'CHARACTER',
    'nature',
    '/avatars/characters/ocean-wave.svg',
    '/avatars/characters/ocean-wave-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#0EA5E9", "style": "flowing"}'::jsonb,
    3
),
(
    gen_random_uuid(),
    'char_mountain',
    'Mountain',
    'Steady mountain representing strength and stability',
    'CHARACTER',
    'nature',
    '/avatars/characters/mountain.svg',
    '/avatars/characters/mountain-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#64748B", "style": "solid"}'::jsonb,
    4
),
(
    gen_random_uuid(),
    'char_tree_of_life',
    'Tree of Life',
    'Growing tree representing personal growth',
    'CHARACTER',
    'nature',
    '/avatars/characters/tree-of-life.svg',
    '/avatars/characters/tree-of-life-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#10B981", "style": "organic"}'::jsonb,
    5
),

-- Free Animal Avatars
(
    gen_random_uuid(),
    'animal_wise_owl',
    'Wise Owl',
    'A thoughtful owl companion',
    'ANIMAL',
    'birds',
    '/avatars/animals/wise-owl.svg',
    '/avatars/animals/wise-owl-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#8B5CF6", "style": "wise"}'::jsonb,
    10
),
(
    gen_random_uuid(),
    'animal_friendly_dog',
    'Friendly Dog',
    'A loyal and friendly companion',
    'ANIMAL',
    'pets',
    '/avatars/animals/friendly-dog.svg',
    '/avatars/animals/friendly-dog-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#D97706", "style": "friendly"}'::jsonb,
    11
),
(
    gen_random_uuid(),
    'animal_calm_cat',
    'Calm Cat',
    'A serene and peaceful companion',
    'ANIMAL',
    'pets',
    '/avatars/animals/calm-cat.svg',
    '/avatars/animals/calm-cat-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#EC4899", "style": "calm"}'::jsonb,
    12
),
(
    gen_random_uuid(),
    'animal_gentle_bear',
    'Gentle Bear',
    'A comforting and protective companion',
    'ANIMAL',
    'wildlife',
    '/avatars/animals/gentle-bear.svg',
    '/avatars/animals/gentle-bear-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#92400E", "style": "gentle"}'::jsonb,
    13
),
(
    gen_random_uuid(),
    'animal_playful_dolphin',
    'Playful Dolphin',
    'A joyful and playful companion',
    'ANIMAL',
    'ocean',
    '/avatars/animals/playful-dolphin.svg',
    '/avatars/animals/playful-dolphin-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#06B6D4", "style": "playful"}'::jsonb,
    14
),

-- Free Abstract Avatars
(
    gen_random_uuid(),
    'abstract_flow',
    'Flow',
    'Abstract flowing shapes',
    'ABSTRACT',
    'geometric',
    '/avatars/abstract/flow.svg',
    '/avatars/abstract/flow-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#6366F1", "style": "fluid"}'::jsonb,
    20
),
(
    gen_random_uuid(),
    'abstract_balance',
    'Balance',
    'Balanced geometric shapes',
    'ABSTRACT',
    'geometric',
    '/avatars/abstract/balance.svg',
    '/avatars/abstract/balance-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#14B8A6", "style": "balanced"}'::jsonb,
    21
),
(
    gen_random_uuid(),
    'abstract_energy',
    'Energy',
    'Dynamic energy pattern',
    'ABSTRACT',
    'dynamic',
    '/avatars/abstract/energy.svg',
    '/avatars/abstract/energy-thumb.svg',
    false,
    NULL,
    true,
    '{"primaryColor": "#F97316", "style": "energetic"}'::jsonb,
    22
),

-- Premium Character Avatars
(
    gen_random_uuid(),
    'char_phoenix',
    'Phoenix',
    'Rising phoenix representing resilience and rebirth',
    'PREMIUM',
    'mythical',
    '/avatars/premium/phoenix.svg',
    '/avatars/premium/phoenix-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#EF4444", "style": "majestic", "animation": "flame"}'::jsonb,
    100
),
(
    gen_random_uuid(),
    'char_northern_lights',
    'Northern Lights',
    'Beautiful aurora representing wonder and hope',
    'PREMIUM',
    'nature',
    '/avatars/premium/northern-lights.svg',
    '/avatars/premium/northern-lights-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#A855F7", "style": "ethereal", "animation": "shimmer"}'::jsonb,
    101
),
(
    gen_random_uuid(),
    'char_crystal',
    'Crystal',
    'Prismatic crystal representing clarity and focus',
    'PREMIUM',
    'elements',
    '/avatars/premium/crystal.svg',
    '/avatars/premium/crystal-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#3B82F6", "style": "crystalline", "animation": "refract"}'::jsonb,
    102
),

-- Premium Animal Avatars
(
    gen_random_uuid(),
    'animal_majestic_eagle',
    'Majestic Eagle',
    'A powerful eagle representing vision and freedom',
    'PREMIUM',
    'birds',
    '/avatars/premium/majestic-eagle.svg',
    '/avatars/premium/majestic-eagle-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#B45309", "style": "majestic", "animation": "soar"}'::jsonb,
    110
),
(
    gen_random_uuid(),
    'animal_mystic_wolf',
    'Mystic Wolf',
    'A mysterious wolf representing intuition and loyalty',
    'PREMIUM',
    'wildlife',
    '/avatars/premium/mystic-wolf.svg',
    '/avatars/premium/mystic-wolf-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#6366F1", "style": "mystical", "animation": "glow"}'::jsonb,
    111
),
(
    gen_random_uuid(),
    'animal_golden_koi',
    'Golden Koi',
    'A graceful koi representing perseverance and good fortune',
    'PREMIUM',
    'ocean',
    '/avatars/premium/golden-koi.svg',
    '/avatars/premium/golden-koi-thumb.svg',
    true,
    'premium',
    true,
    '{"primaryColor": "#F59E0B", "style": "elegant", "animation": "swim"}'::jsonb,
    112
),

-- Pro-Only Avatars
(
    gen_random_uuid(),
    'custom_therapist_companion',
    'Therapist Companion',
    'Professional companion avatar for therapy integration',
    'CUSTOM',
    'professional',
    '/avatars/pro/therapist-companion.svg',
    '/avatars/pro/therapist-companion-thumb.svg',
    true,
    'pro',
    true,
    '{"primaryColor": "#059669", "style": "professional", "features": ["therapist_mode"]}'::jsonb,
    200
),
(
    gen_random_uuid(),
    'custom_family_guardian',
    'Family Guardian',
    'Protective avatar for family sharing plans',
    'CUSTOM',
    'family',
    '/avatars/pro/family-guardian.svg',
    '/avatars/pro/family-guardian-thumb.svg',
    true,
    'pro',
    true,
    '{"primaryColor": "#7C3AED", "style": "nurturing", "features": ["family_mode"]}'::jsonb,
    201
);

COMMIT;
