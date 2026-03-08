-- Migration 003: Create Messages Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum types for messages
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE message_type AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'FILE', 'CRISIS_ALERT');

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conversation_id UUID,
    content TEXT NOT NULL,
    role message_role NOT NULL,
    message_type message_type DEFAULT 'TEXT',
    sentiment_score DECIMAL(4, 3),
    emotion_detected VARCHAR(50),
    intent_detected VARCHAR(100),
    ai_model_version VARCHAR(50),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    parent_message_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_messages_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_messages_parent
        FOREIGN KEY (parent_message_id) 
        REFERENCES messages(id) 
        ON DELETE SET NULL
);

-- Create indexes for messages table
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_is_flagged ON messages(is_flagged) WHERE is_flagged = TRUE;

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
