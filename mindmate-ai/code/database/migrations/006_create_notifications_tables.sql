-- Migration 006: Create Notifications and Notification Templates Tables
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum types for notifications
CREATE TYPE notification_type AS ENUM (
    'SYSTEM', 'REMINDER', 'ACHIEVEMENT', 'MOOD_CHECK', 
    'TASK_DUE', 'MESSAGE', 'CRISIS_ALERT', 'SUBSCRIPTION', 
    'PROGRESS_UPDATE', 'CHECK_IN', 'WELLNESS_TIP'
);
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'EMAIL', 'PUSH', 'SMS', 'WEBHOOK');

-- Create notification_templates table (must be created before notifications)
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    default_channel notification_channel DEFAULT 'IN_APP',
    default_priority priority_level DEFAULT 'MEDIUM',
    variables JSONB, -- Expected variable schema
    is_active BOOLEAN DEFAULT TRUE,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_templates table
CREATE INDEX idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = TRUE;

-- Create trigger for updated_at on notification_templates
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    template_id UUID,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type notification_type NOT NULL,
    priority priority_level DEFAULT 'MEDIUM',
    channel notification_channel DEFAULT 'IN_APP',
    action_url TEXT,
    action_label VARCHAR(100),
    image_url TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_notifications_template
        FOREIGN KEY (template_id) 
        REFERENCES notification_templates(id) 
        ON DELETE SET NULL
);

-- Create indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;

COMMIT;
