-- ============================================================================
-- MindMate AI - PostgreSQL Database Schema
-- Complete Production-Ready Schema
-- Version: 1.0.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE
-- Core user accounts with authentication and profile information
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated', 'deleted')),
    
    -- Subscription & Plan
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    
    -- Security
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Referral tracking
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    referral_code VARCHAR(20) UNIQUE
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(account_status) WHERE account_status = 'active';
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- Comments
COMMENT ON TABLE users IS 'Core user accounts with authentication and profile data';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: free, basic, premium, enterprise';

-- ============================================================================
-- 2. SESSIONS TABLE
-- Chat sessions between users and the AI
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session Details
    title VARCHAR(255),
    session_type VARCHAR(50) DEFAULT 'general' CHECK (session_type IN ('general', 'crisis', 'therapy', 'check_in', 'guided_exercise', 'mood_tracking')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'archived')),
    
    -- AI Configuration
    ai_model VARCHAR(50) DEFAULT 'claude-3-sonnet',
    ai_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (ai_temperature >= 0 AND ai_temperature <= 1),
    system_prompt TEXT,
    
    -- Session Metrics
    message_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    
    -- Emotional Context
    detected_mood VARCHAR(50),
    session_sentiment DECIMAL(4,3),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for sessions table
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_user_status ON sessions(user_id, status);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_type ON sessions(session_type);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Comments
COMMENT ON TABLE sessions IS 'Chat sessions between users and AI therapist';
COMMENT ON COLUMN sessions.session_sentiment IS 'Overall sentiment score from -1.0 to 1.0';

-- ============================================================================
-- 3. MESSAGES TABLE
-- Individual messages within sessions
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Message Content
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'audio', 'file', 'structured')),
    
    -- For structured content
    structured_content JSONB,
    
    -- AI Metadata
    model VARCHAR(50),
    tokens_used INTEGER,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Emotional Analysis
    emotion_detected VARCHAR(50),
    emotion_confidence DECIMAL(4,3),
    sentiment_score DECIMAL(4,3),
    
    -- Crisis Detection
    crisis_flag BOOLEAN DEFAULT FALSE,
    crisis_score DECIMAL(4,3),
    crisis_keywords TEXT[],
    
    -- Message Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for messages table
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_session_sent ON messages(session_id, sent_at);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_crisis ON messages(crisis_flag) WHERE crisis_flag = TRUE;
CREATE INDEX idx_messages_emotion ON messages(emotion_detected);
CREATE INDEX idx_messages_sentiment ON messages(sentiment_score);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Full-text search index
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));

-- Comments
COMMENT ON TABLE messages IS 'Individual chat messages within sessions';
COMMENT ON COLUMN messages.crisis_flag IS 'Flagged if message contains crisis indicators';

-- ============================================================================
-- 4. EMOTIONS_LOG TABLE
-- Detailed emotion tracking over time
-- ============================================================================

CREATE TABLE emotions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Emotion Data
    primary_emotion VARCHAR(50) NOT NULL,
    secondary_emotion VARCHAR(50),
    emotion_intensity INTEGER NOT NULL CHECK (emotion_intensity >= 1 AND emotion_intensity <= 10),
    
    -- Detailed Breakdown
    emotion_breakdown JSONB,
    -- Example: {"joy": 0.3, "sadness": 0.5, "anger": 0.1, "fear": 0.05, "surprise": 0.05}
    
    -- Context
    trigger_event TEXT,
    context_description TEXT,
    location VARCHAR(100),
    activity VARCHAR(100),
    
    -- Source
    source VARCHAR(20) DEFAULT 'user_reported' CHECK (source IN ('user_reported', 'ai_detected', 'assessment', 'journal')),
    confidence_score DECIMAL(4,3),
    
    -- Timestamps
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for emotions_log table
CREATE INDEX idx_emotions_user_id ON emotions_log(user_id);
CREATE INDEX idx_emotions_user_recorded ON emotions_log(user_id, recorded_at);
CREATE INDEX idx_emotions_session ON emotions_log(session_id);
CREATE INDEX idx_emotions_primary ON emotions_log(primary_emotion);
CREATE INDEX idx_emotions_intensity ON emotions_log(emotion_intensity);
CREATE INDEX idx_emotions_recorded_at ON emotions_log(recorded_at);
CREATE INDEX idx_emotions_source ON emotions_log(source);

-- Comments
COMMENT ON TABLE emotions_log IS 'Detailed emotion tracking for users over time';

-- ============================================================================
-- 5. TASKS TABLE
-- Therapeutic tasks and exercises assigned to users
-- ============================================================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Task Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
        'breathing_exercise', 'meditation', 'journaling', 'gratitude_practice',
        'cognitive_restructuring', 'exposure_therapy', 'behavioral_activation',
        'sleep_hygiene', 'mindfulness', 'grounding_technique', 'custom'
    )),
    
    -- Instructions
    instructions TEXT,
    instructions_media JSONB, -- URLs to videos, audio, images
    
    -- Task Configuration
    estimated_duration INTEGER, -- in minutes
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    category VARCHAR(50),
    tags TEXT[],
    
    -- Scheduling
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- daily, weekly, monthly
    recurrence_days INTEGER[], -- [1,3,5] for Mon, Wed, Fri
    
    -- Targeting
    target_emotions TEXT[],
    target_symptoms TEXT[],
    contraindications TEXT[],
    
    -- System Task vs Custom
    is_system_task BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tasks table
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_tags ON tasks USING gin(tags);
CREATE INDEX idx_tasks_target_emotions ON tasks USING gin(target_emotions);
CREATE INDEX idx_tasks_system ON tasks(is_system_task) WHERE is_system_task = TRUE;
CREATE INDEX idx_tasks_active ON tasks(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE tasks IS 'Therapeutic tasks and exercises for users';

-- ============================================================================
-- 6. TASK_COMPLETIONS TABLE
-- Records of users completing tasks
-- ============================================================================

CREATE TABLE task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Completion Details
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped', 'abandoned')),
    
    -- User Response
    notes TEXT,
    reflection TEXT,
    mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 10),
    mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 10),
    
    -- Response Data (for structured tasks)
    response_data JSONB,
    
    -- Metrics
    duration_minutes INTEGER,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    
    -- Feedback
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    would_recommend BOOLEAN,
    
    -- Scheduling
    scheduled_for DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for task_completions table
CREATE INDEX idx_task_completions_user ON task_completions(user_id);
CREATE INDEX idx_task_completions_task ON task_completions(task_id);
CREATE INDEX idx_task_completions_user_task ON task_completions(user_id, task_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_task_completions_scheduled ON task_completions(scheduled_for);
CREATE INDEX idx_task_completions_completed ON task_completions(completed_at);
CREATE INDEX idx_task_completions_session ON task_completions(session_id);

-- Comments
COMMENT ON TABLE task_completions IS 'Records of users completing therapeutic tasks';

-- ============================================================================
-- 7. MOOD_ENTRIES TABLE
-- Daily mood tracking entries
-- ============================================================================

CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Mood Data
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    mood_label VARCHAR(50),
    
    -- Detailed Assessment
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    anxiety_level INTEGER CHECK (anxiety_level >= 0 AND anxiety_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    
    -- Context
    notes TEXT,
    factors TEXT[], -- What influenced mood: work, family, health, etc.
    activities TEXT[], -- Activities done today
    
    -- Physical Symptoms
    physical_symptoms JSONB,
    -- Example: {"headache": true, "fatigue": 7, "appetite": "normal"}
    
    -- Medication Tracking
    medications_taken JSONB,
    -- Example: [{"name": "Sertraline", "dose": "50mg", "taken": true}]
    
    -- Source
    entry_source VARCHAR(20) DEFAULT 'manual' CHECK (entry_source IN ('manual', 'voice', 'ai_prompted', 'scheduled')),
    
    -- Timestamps
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIME WITH TIME ZONE DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mood_entries table
CREATE INDEX idx_mood_entries_user ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);
CREATE INDEX idx_mood_entries_score ON mood_entries(mood_score);
CREATE INDEX idx_mood_entries_created ON mood_entries(created_at);

-- Unique constraint - one entry per user per day
CREATE UNIQUE INDEX idx_mood_entries_user_daily ON mood_entries(user_id, entry_date) WHERE entry_source = 'manual';

-- Comments
COMMENT ON TABLE mood_entries IS 'Daily mood tracking entries from users';

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- User notifications and alerts
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'session_reminder', 'task_reminder', 'mood_check_in', 'crisis_alert',
        'achievement', 'subscription', 'system', 'therapist_message', 'emergency'
    )),
    
    -- Priority & Urgency
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Action/Deep Link
    action_url TEXT,
    action_type VARCHAR(50),
    action_data JSONB,
    
    -- Delivery Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'dismissed')),
    
    -- Channel Tracking
    channels TEXT[] DEFAULT ARRAY['push'], -- push, email, sms, in_app
    sent_via_channels TEXT[],
    
    -- Timestamps
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Comments
COMMENT ON TABLE notifications IS 'User notifications and alerts';

-- ============================================================================
-- 9. CRISIS_EVENTS TABLE
-- Crisis intervention events and responses
-- ============================================================================

CREATE TABLE crisis_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Crisis Details
    crisis_type VARCHAR(50) NOT NULL CHECK (crisis_type IN (
        'suicidal_ideation', 'self_harm', 'homicidal_ideation', 
        'substance_abuse', 'psychosis', 'severe_anxiety', 'panic_attack',
        'domestic_violence', 'abuse', 'other'
    )),
    severity_level INTEGER NOT NULL CHECK (severity_level >= 1 AND severity_level <= 5),
    
    -- Detection
    detection_method VARCHAR(50) DEFAULT 'ai_analysis' CHECK (detection_method IN ('ai_analysis', 'user_reported', 'keyword_match', 'manual_flag')),
    trigger_content TEXT,
    keywords_detected TEXT[],
    ai_confidence_score DECIMAL(4,3),
    
    -- Response Actions
    response_actions JSONB DEFAULT '[]',
    -- Example: [{"action": "safety_resources_shown", "timestamp": "..."}, {"action": "crisis_line_provided", "timestamp": "..."}]
    
    -- Safety Resources Provided
    resources_provided JSONB,
    crisis_lines_contacted BOOLEAN DEFAULT FALSE,
    
    -- Human Review
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'under_review', 'resolved', 'escalated', 'false_positive')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT TRUE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Outcome
    resolution_status VARCHAR(50),
    resolution_notes TEXT,
    
    -- Emergency Contact
    emergency_contact_notified BOOLEAN DEFAULT FALSE,
    emergency_contact_notified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for crisis_events table
CREATE INDEX idx_crisis_user ON crisis_events(user_id);
CREATE INDEX idx_crisis_session ON crisis_events(session_id);
CREATE INDEX idx_crisis_type ON crisis_events(crisis_type);
CREATE INDEX idx_crisis_severity ON crisis_events(severity_level);
CREATE INDEX idx_crisis_review_status ON crisis_events(review_status);
CREATE INDEX idx_crisis_detected ON crisis_events(detected_at);
CREATE INDEX idx_crisis_followup ON crisis_events(follow_up_required) WHERE follow_up_required = TRUE AND follow_up_completed = FALSE;

-- Comments
COMMENT ON TABLE crisis_events IS 'Crisis intervention events and responses';
COMMENT ON COLUMN crisis_events.severity_level IS '1=low concern, 5=immediate danger';

-- ============================================================================
-- 10. MEMORY_ENTRIES TABLE
-- AI memory/context for personalized conversations
-- ============================================================================

CREATE TABLE memory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Memory Content
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
        'fact', 'preference', 'goal', 'trigger', 'coping_strategy',
        'relationship', 'medical', 'trauma', 'achievement', 'routine',
        'insight', 'milestone'
    )),
    content TEXT NOT NULL,
    
    -- Context
    context_tags TEXT[],
    related_topics TEXT[],
    
    -- Importance & Recency
    importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
    confidence_score DECIMAL(3,2) DEFAULT 0.8 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Access Tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT FALSE,
    
    -- Verification
    verified_by_user BOOLEAN,
    user_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Source
    source VARCHAR(50) DEFAULT 'ai_extracted' CHECK (source IN ('ai_extracted', 'user_stated', 'therapist_note', 'inferred')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for memory_entries table
CREATE INDEX idx_memory_user ON memory_entries(user_id);
CREATE INDEX idx_memory_user_type ON memory_entries(user_id, memory_type);
CREATE INDEX idx_memory_type ON memory_entries(memory_type);
CREATE INDEX idx_memory_importance ON memory_entries(importance_score);
CREATE INDEX idx_memory_tags ON memory_entries USING gin(context_tags);
CREATE INDEX idx_memory_active ON memory_entries(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_memory_accessed ON memory_entries(last_accessed_at);
CREATE INDEX idx_memory_created ON memory_entries(created_at);

-- Full-text search
CREATE INDEX idx_memory_content_search ON memory_entries USING gin(to_tsvector('english', content));

-- Comments
COMMENT ON TABLE memory_entries IS 'AI memory/context for personalized conversations';

-- ============================================================================
-- 11. SUBSCRIPTIONS TABLE
-- Subscription and billing records
-- ============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Plan Details
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise', 'trial')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Payment Provider
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal', 'apple', 'google', 'manual')),
    provider_subscription_id VARCHAR(255),
    provider_customer_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused', 'trialing')),
    
    -- Dates
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Trial
    is_trial BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Features
    features_included JSONB,
    usage_limits JSONB,
    
    -- Auto-renew
    auto_renew BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscriptions table
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_provider ON subscriptions(provider);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription and billing records';

-- ============================================================================
-- 12. THERAPIST_NOTES TABLE
-- Notes from human therapists (if applicable)
-- ============================================================================

CREATE TABLE therapist_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Note Content
    note_type VARCHAR(50) DEFAULT 'progress' CHECK (note_type IN ('intake', 'progress', 'session', 'treatment_plan', 'crisis', 'collateral', 'discharge')),
    content TEXT NOT NULL,
    
    -- Clinical Information
    presenting_issues TEXT[],
    interventions_used TEXT[],
    treatment_goals TEXT[],
    
    -- Assessment
    risk_assessment JSONB,
    -- Example: {"suicide_risk": "low", "self_harm_risk": "none", "homicide_risk": "none"}
    
    diagnosis_codes TEXT[], -- ICD-10 codes
    
    -- Plan
    treatment_plan TEXT,
    homework_assigned TEXT,
    next_session_focus TEXT,
    
    -- Visibility
    is_shared_with_user BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_draft BOOLEAN DEFAULT TRUE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for therapist_notes table
CREATE INDEX idx_therapist_notes_user ON therapist_notes(user_id);
CREATE INDEX idx_therapist_notes_therapist ON therapist_notes(therapist_id);
CREATE INDEX idx_therapist_notes_type ON therapist_notes(note_type);
CREATE INDEX idx_therapist_notes_session ON therapist_notes(session_id);
CREATE INDEX idx_therapist_notes_date ON therapist_notes(session_date);
CREATE INDEX idx_therapist_notes_draft ON therapist_notes(is_draft) WHERE is_draft = TRUE;

-- Comments
COMMENT ON TABLE therapist_notes IS 'Clinical notes from human therapists';

-- ============================================================================
-- 13. EMERGENCY_CONTACTS TABLE
-- User emergency contacts
-- ============================================================================

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact Information
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Priority
    priority_order INTEGER DEFAULT 1 CHECK (priority_order >= 1),
    
    -- Notification Settings
    can_be_notified BOOLEAN DEFAULT TRUE,
    notification_methods TEXT[] DEFAULT ARRAY['phone', 'email'],
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for emergency_contacts table
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_contacts_user_priority ON emergency_contacts(user_id, priority_order);
CREATE INDEX idx_emergency_contacts_active ON emergency_contacts(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_emergency_contacts_verified ON emergency_contacts(is_verified);

-- Comments
COMMENT ON TABLE emergency_contacts IS 'User emergency contacts for crisis situations';

-- ============================================================================
-- 14. PROGRESS_REPORTS TABLE
-- Generated progress reports for users
-- ============================================================================

CREATE TABLE progress_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_by_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Report Period
    report_type VARCHAR(50) DEFAULT 'weekly' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'on_demand')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Summary Data
    summary_text TEXT,
    key_insights TEXT[],
    
    -- Metrics Summary
    mood_trend JSONB,
    -- Example: {"average": 6.5, "trend": "improving", "volatility": 1.2}
    
    emotion_breakdown JSONB,
    -- Example: {"joy": 15, "sadness": 8, "anxiety": 12}
    
    session_metrics JSONB,
    -- Example: {"total_sessions": 5, "total_messages": 127, "avg_session_length": 23}
    
    task_metrics JSONB,
    -- Example: {"assigned": 10, "completed": 7, "completion_rate": 0.7}
    
    -- Goals & Achievements
    goals_progress JSONB,
    achievements_unlocked TEXT[],
    milestones_reached TEXT[],
    
    -- Recommendations
    recommendations TEXT[],
    suggested_tasks UUID[], -- References tasks
    
    -- Clinical Indicators
    risk_assessment JSONB,
    warning_signs TEXT[],
    positive_indicators TEXT[],
    
    -- Report Status
    status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error', 'archived')),
    
    -- Delivery
    shared_with_user BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,
    viewed_by_user_at TIMESTAMP WITH TIME ZONE,
    
    -- Content
    report_content JSONB, -- Full structured report
    pdf_url TEXT,
    
    -- AI Generation
    ai_model_used VARCHAR(50),
    generation_metadata JSONB,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for progress_reports table
CREATE INDEX idx_progress_reports_user ON progress_reports(user_id);
CREATE INDEX idx_progress_reports_user_type ON progress_reports(user_id, report_type);
CREATE INDEX idx_progress_reports_period ON progress_reports(user_id, period_start, period_end);
CREATE INDEX idx_progress_reports_status ON progress_reports(status);
CREATE INDEX idx_progress_reports_generated ON progress_reports(generated_at);
CREATE INDEX idx_progress_reports_shared ON progress_reports(shared_with_user) WHERE shared_with_user = TRUE;

-- Comments
COMMENT ON TABLE progress_reports IS 'Generated progress reports for users';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update the updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_completions_updated_at BEFORE UPDATE ON task_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_therapist_notes_updated_at BEFORE UPDATE ON therapist_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_reports_updated_at BEFORE UPDATE ON progress_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crisis_events_updated_at BEFORE UPDATE ON crisis_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_entries_updated_at BEFORE UPDATE ON memory_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (basic policies)
CREATE POLICY user_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::UUID);
CREATE POLICY session_own_data ON sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY message_own_data ON messages FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY emotions_own_data ON emotions_log FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY task_completion_own_data ON task_completions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY mood_entry_own_data ON mood_entries FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY notification_own_data ON notifications FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY crisis_own_data ON crisis_events FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY memory_own_data ON memory_entries FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY subscription_own_data ON subscriptions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY emergency_contact_own_data ON emergency_contacts FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY progress_report_own_data ON progress_reports FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Tasks are readable by all (system tasks) or owned users
CREATE POLICY task_read_all ON tasks FOR SELECT USING (is_system_task = TRUE OR created_by = current_setting('app.current_user_id')::UUID);
CREATE POLICY task_write_own ON tasks FOR ALL USING (created_by = current_setting('app.current_user_id')::UUID);

-- Therapist notes - users can only see shared notes
CREATE POLICY therapist_note_user_view ON therapist_notes FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID AND is_shared_with_user = TRUE);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- User dashboard summary
CREATE VIEW user_dashboard_summary AS
SELECT 
    u.id AS user_id,
    u.email,
    u.subscription_tier,
    COUNT(DISTINCT s.id) AS total_sessions,
    COUNT(DISTINCT m.id) AS total_messages,
    COUNT(DISTINCT me.id) AS mood_entries_count,
    COUNT(DISTINCT tc.id) FILTER (WHERE tc.status = 'completed') AS completed_tasks,
    MAX(s.last_activity_at) AS last_session_at,
    MAX(me.entry_date) AS last_mood_entry
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id AND s.status != 'archived'
LEFT JOIN messages m ON m.session_id = s.id
LEFT JOIN mood_entries me ON me.user_id = u.id
LEFT JOIN task_completions tc ON tc.user_id = u.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.subscription_tier;

-- Active crisis events view
CREATE VIEW active_crisis_events AS
SELECT 
    ce.*,
    u.email AS user_email,
    u.first_name || ' ' || u.last_name AS user_full_name
FROM crisis_events ce
JOIN users u ON u.id = ce.user_id
WHERE ce.resolved_at IS NULL
ORDER BY ce.severity_level DESC, ce.detected_at DESC;

-- User mood trends
CREATE VIEW user_mood_trends AS
SELECT 
    user_id,
    DATE_TRUNC('week', entry_date) AS week,
    AVG(mood_score) AS avg_mood,
    MIN(mood_score) AS min_mood,
    MAX(mood_score) AS max_mood,
    COUNT(*) AS entry_count
FROM mood_entries
GROUP BY user_id, DATE_TRUNC('week', entry_date)
ORDER BY user_id, week;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
