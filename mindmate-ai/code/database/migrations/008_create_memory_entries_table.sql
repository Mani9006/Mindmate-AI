-- Migration 008: Create Memory Entries Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum type for memory types
CREATE TYPE memory_type AS ENUM (
    'PREFERENCE', 'FACT', 'EVENT', 'GOAL', 
    'EMOTION', 'RELATIONSHIP', 'THERAPY_INSIGHT', 'ROUTINE'
);

-- Create memory_entries table
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    memory_type memory_type NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    importance_score DECIMAL(3, 2) DEFAULT 0.50 CHECK (importance_score >= 0 AND importance_score <= 1),
    emotional_valence DECIMAL(3, 2) CHECK (emotional_valence >= -1 AND emotional_valence <= 1),
    source_message_id UUID,
    related_topics TEXT[],
    metadata JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_memory_entries_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_memory_entries_message
        FOREIGN KEY (source_message_id) 
        REFERENCES messages(id) 
        ON DELETE SET NULL
);

-- Create indexes for memory_entries table
CREATE INDEX idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX idx_memory_entries_memory_type ON memory_entries(memory_type);
CREATE INDEX idx_memory_entries_importance ON memory_entries(importance_score);
CREATE INDEX idx_memory_entries_active ON memory_entries(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_memory_entries_user_type ON memory_entries(user_id, memory_type);
CREATE INDEX idx_memory_entries_expires ON memory_entries(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_memory_entries_related_topics ON memory_entries USING GIN(related_topics);

-- Create trigger for updated_at on memory_entries
CREATE TRIGGER update_memory_entries_updated_at
    BEFORE UPDATE ON memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
