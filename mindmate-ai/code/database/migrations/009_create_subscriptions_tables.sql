-- Migration 009: Create Subscriptions and Subscription Tiers Tables
-- MindMate AI Database Migration
-- Created by Agent 67

BEGIN;

-- Create enum type for subscription status
CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');

-- Create subscription_tiers table (must be created before subscriptions)
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    features JSONB NOT NULL DEFAULT '[]', -- Array of feature objects
    limits JSONB NOT NULL DEFAULT '{}', -- Usage limits object
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    trial_days INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for subscription_tiers table
CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subscription_tiers_sort ON subscription_tiers(sort_order);

-- Create trigger for updated_at on subscription_tiers
CREATE TRIGGER update_subscription_tiers_updated_at
    BEFORE UPDATE ON subscription_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tier_id UUID NOT NULL,
    status subscription_status DEFAULT 'TRIAL',
    payment_provider VARCHAR(50), -- stripe, paypal, etc.
    payment_provider_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    amount_paid DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    invoice_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_tier
        FOREIGN KEY (tier_id) 
        REFERENCES subscription_tiers(id) 
        ON DELETE RESTRICT
);

-- Create indexes for subscriptions table
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_payment_provider ON subscriptions(payment_provider, payment_provider_subscription_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Create trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
