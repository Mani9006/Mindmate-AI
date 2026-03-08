-- Migration 012: Create Progress Reports Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum type for report types
CREATE TYPE report_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'SESSION');

-- Create progress_reports table
CREATE TABLE IF NOT EXISTS progress_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_type report_type DEFAULT 'WEEKLY',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    mood_summary JSONB, -- Aggregated mood data
    task_summary JSONB, -- Task completion stats
    emotion_summary JSONB, -- Emotion tracking summary
    insights TEXT[],
    recommendations TEXT[],
    achievements TEXT[],
    goals_progress JSONB, -- Progress on goals
    ai_generated_content TEXT,
    is_generated BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    shared_with TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_progress_reports_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_period_dates 
        CHECK (period_end >= period_start)
);

-- Create indexes for progress_reports table
CREATE INDEX idx_progress_reports_user_id ON progress_reports(user_id);
CREATE INDEX idx_progress_reports_report_type ON progress_reports(report_type);
CREATE INDEX idx_progress_reports_period_start ON progress_reports(period_start);
CREATE INDEX idx_progress_reports_is_generated ON progress_reports(is_generated);
CREATE INDEX idx_progress_reports_user_type_period ON progress_reports(user_id, report_type, period_start);
CREATE INDEX idx_progress_reports_generated_at ON progress_reports(generated_at) WHERE is_generated = TRUE;

-- Create trigger for updated_at on progress_reports
CREATE TRIGGER update_progress_reports_updated_at
    BEFORE UPDATE ON progress_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
