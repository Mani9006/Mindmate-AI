-- Migration 005: Create Tasks and Task Completions Tables
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum types for tasks
CREATE TYPE task_type AS ENUM ('PERSONAL', 'THERAPY', 'WELLNESS', 'MEDICATION', 'EXERCISE', 'SOCIAL', 'WORK', 'AI_SUGGESTED');
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED');
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type task_type DEFAULT 'PERSONAL',
    priority priority_level DEFAULT 'MEDIUM',
    status task_status DEFAULT 'PENDING',
    due_date TIMESTAMP WITH TIME ZONE,
    reminder_at TIMESTAMP WITH TIME ZONE,
    recurrence_rule TEXT, -- iCal RRULE format
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    category VARCHAR(100),
    tags TEXT[],
    ai_suggested BOOLEAN DEFAULT FALSE,
    ai_reasoning TEXT,
    parent_task_id UUID,
    metadata JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_tasks_parent
        FOREIGN KEY (parent_task_id) 
        REFERENCES tasks(id) 
        ON DELETE SET NULL
);

-- Create indexes for tasks table
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_ai_suggested ON tasks(ai_suggested) WHERE ai_suggested = TRUE;

-- Create trigger for updated_at on tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completion_notes TEXT,
    mood_at_completion SMALLINT CHECK (mood_at_completion >= 1 AND mood_at_completion <= 10),
    difficulty_rating SMALLINT CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    feedback TEXT,
    xp_earned INTEGER DEFAULT 0,
    
    CONSTRAINT fk_task_completions_task
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_task_completions_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes for task_completions table
CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX idx_task_completions_user_completed ON task_completions(user_id, completed_at);

COMMIT;
