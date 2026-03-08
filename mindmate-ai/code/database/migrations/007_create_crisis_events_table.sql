-- Migration 007: Create Crisis Events Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum types for crisis events
CREATE TYPE crisis_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE crisis_status AS ENUM ('DETECTED', 'RESPONDING', 'RESOLVED', 'ESCALATED', 'FALSE_POSITIVE');

-- Create crisis_events table
CREATE TABLE IF NOT EXISTS crisis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    severity crisis_severity NOT NULL,
    trigger_message_id UUID,
    detected_keywords TEXT[],
    ai_confidence DECIMAL(4, 3) NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    user_reported BOOLEAN DEFAULT FALSE,
    status crisis_status DEFAULT 'DETECTED',
    initial_response TEXT,
    resolution_notes TEXT,
    escalated_to VARCHAR(255),
    resources_provided TEXT[],
    user_location VARCHAR(255),
    emergency_contact_notified BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_crisis_events_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_crisis_events_message
        FOREIGN KEY (trigger_message_id) 
        REFERENCES messages(id) 
        ON DELETE SET NULL
);

-- Create indexes for crisis_events table
CREATE INDEX idx_crisis_events_user_id ON crisis_events(user_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX idx_crisis_events_status ON crisis_events(status);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at);
CREATE INDEX idx_crisis_events_user_created ON crisis_events(user_id, created_at);
CREATE INDEX idx_crisis_events_severity_status ON crisis_events(severity, status) WHERE status IN ('DETECTED', 'RESPONDING');

-- Create trigger for updated_at on crisis_events
CREATE TRIGGER update_crisis_events_updated_at
    BEFORE UPDATE ON crisis_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
