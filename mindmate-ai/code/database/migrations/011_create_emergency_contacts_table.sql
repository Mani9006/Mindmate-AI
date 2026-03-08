-- Migration 011: Create Emergency Contacts Table
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    can_be_notified BOOLEAN DEFAULT TRUE,
    notification_methods TEXT[] DEFAULT ARRAY['SMS', 'CALL'],
    address TEXT,
    notes TEXT,
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_emergency_contacts_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_contact_info 
        CHECK (phone_number IS NOT NULL OR email IS NOT NULL)
);

-- Create indexes for emergency_contacts table
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_contacts_is_primary ON emergency_contacts(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_emergency_contacts_is_active ON emergency_contacts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_emergency_contacts_user_priority ON emergency_contacts(user_id, priority_order);

-- Create trigger for updated_at on emergency_contacts
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
