-- Migration 013: Create Gamification Tables (Challenges, Achievements, Avatars)
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum types for gamification
CREATE TYPE challenge_type AS ENUM ('DAILY', 'WEEKLY', 'STREAK', 'MILESTONE', 'SOCIAL', 'THERAPEUTIC', 'EDUCATIONAL');
CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE challenge_status AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'ABANDONED');
CREATE TYPE avatar_type AS ENUM ('CHARACTER', 'ANIMAL', 'ABSTRACT', 'CUSTOM', 'PREMIUM');

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    challenge_type challenge_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty difficulty_level DEFAULT 'MEDIUM',
    requirements JSONB NOT NULL DEFAULT '{}', -- Requirements to complete
    rewards JSONB NOT NULL DEFAULT '{}', -- XP, badges, etc.
    duration_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    icon_url TEXT,
    banner_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for challenges table
CREATE INDEX idx_challenges_type ON challenges(challenge_type);
CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_challenges_default ON challenges(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_sort ON challenges(sort_order);

-- Create trigger for updated_at on challenges
CREATE TRIGGER update_challenges_updated_at
    BEFORE UPDATE ON challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL,
    status challenge_status DEFAULT 'IN_PROGRESS',
    progress JSONB NOT NULL DEFAULT '{}', -- Current progress data
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    xp_earned INTEGER DEFAULT 0,
    rewards_claimed BOOLEAN DEFAULT FALSE,
    rewards_claimed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_user_challenges_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_challenges_challenge
        FOREIGN KEY (challenge_id) 
        REFERENCES challenges(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_challenge 
        UNIQUE (user_id, challenge_id)
);

-- Create indexes for user_challenges table
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, status);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    icon_url TEXT,
    requirement_type VARCHAR(100) NOT NULL,
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for achievements table
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_active ON achievements(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_achievements_hidden ON achievements(is_hidden) WHERE is_hidden = TRUE;

-- Create trigger for updated_at on achievements
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    xp_claimed BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_user_achievements_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement
        FOREIGN KEY (achievement_id) 
        REFERENCES achievements(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_achievement 
        UNIQUE (user_id, achievement_id)
);

-- Create indexes for user_achievements table
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);

-- Create avatar_options table
CREATE TABLE IF NOT EXISTS avatar_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_type avatar_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    asset_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    required_tier VARCHAR(100), -- Subscription tier required
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- Colors, styles, etc.
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for avatar_options table
CREATE INDEX idx_avatar_options_type ON avatar_options(avatar_type);
CREATE INDEX idx_avatar_options_active ON avatar_options(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_avatar_options_category ON avatar_options(category);
CREATE INDEX idx_avatar_options_premium ON avatar_options(is_premium) WHERE is_premium = TRUE;
CREATE INDEX idx_avatar_options_sort ON avatar_options(sort_order);

-- Create trigger for updated_at on avatar_options
CREATE TRIGGER update_avatar_options_updated_at
    BEFORE UPDATE ON avatar_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
