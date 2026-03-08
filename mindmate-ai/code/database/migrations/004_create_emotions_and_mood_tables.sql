-- Migration 004: Create Emotions Log and Mood Entries Tables
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create emotions_log table
CREATE TABLE IF NOT EXISTS emotions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    intensity SMALLINT NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
    trigger_event TEXT,
    context TEXT,
    location VARCHAR(255),
    activity VARCHAR(255),
    notes TEXT,
    ai_analysis JSONB,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_emotions_log_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes for emotions_log table
CREATE INDEX idx_emotions_log_user_id ON emotions_log(user_id);
CREATE INDEX idx_emotions_log_emotion ON emotions_log(emotion);
CREATE INDEX idx_emotions_log_logged_at ON emotions_log(logged_at);
CREATE INDEX idx_emotions_log_user_logged_at ON emotions_log(user_id, logged_at);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mood_score SMALLINT NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    mood_label VARCHAR(50) NOT NULL,
    energy_level SMALLINT CHECK (energy_level >= 1 AND energy_level <= 10),
    sleep_quality SMALLINT CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    stress_level SMALLINT CHECK (stress_level >= 1 AND stress_level <= 10),
    journal_entry TEXT,
    factors TEXT[],
    tags TEXT[],
    ai_insights JSONB,
    is_shared BOOLEAN DEFAULT FALSE,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mood_entries_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_entry_date 
        UNIQUE (user_id, entry_date)
);

-- Create indexes for mood_entries table
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_entry_date ON mood_entries(entry_date);
CREATE INDEX idx_mood_entries_mood_score ON mood_entries(mood_score);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date);

-- Create trigger for updated_at on mood_entries
CREATE TRIGGER update_mood_entries_updated_at
    BEFORE UPDATE ON mood_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
