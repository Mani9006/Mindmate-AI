-- Migration 010: Create Therapist Notes Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum type for note types
CREATE TYPE note_type AS ENUM ('PROGRESS', 'SESSION', 'ASSESSMENT', 'TREATMENT_PLAN', 'CRISIS', 'COLLABORATIVE');

-- Create therapist_notes table
CREATE TABLE IF NOT EXISTS therapist_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    therapist_id UUID,
    session_date DATE NOT NULL,
    note_type note_type DEFAULT 'PROGRESS',
    content TEXT NOT NULL,
    summary TEXT,
    mood_observation TEXT,
    goals_discussed TEXT[],
    action_items TEXT[],
    is_shared_with_user BOOLEAN DEFAULT FALSE,
    user_acknowledged_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_therapist_notes_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes for therapist_notes table
CREATE INDEX idx_therapist_notes_user_id ON therapist_notes(user_id);
CREATE INDEX idx_therapist_notes_session_date ON therapist_notes(session_date);
CREATE INDEX idx_therapist_notes_note_type ON therapist_notes(note_type);
CREATE INDEX idx_therapist_notes_user_date ON therapist_notes(user_id, session_date);
CREATE INDEX idx_therapist_notes_shared ON therapist_notes(is_shared_with_user) WHERE is_shared_with_user = TRUE;
CREATE INDEX idx_therapist_notes_tags ON therapist_notes USING GIN(tags);

-- Create trigger for updated_at on therapist_notes
CREATE TRIGGER update_therapist_notes_updated_at
    BEFORE UPDATE ON therapist_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
