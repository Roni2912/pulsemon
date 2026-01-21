-- Migration: Create monitors table
-- Purpose: Stores website/service monitoring configurations
-- This table defines what URLs to monitor, how often, and what constitutes success/failure
-- Each monitor belongs to a user and tracks a specific endpoint

-- Create custom types for monitor configuration
CREATE TYPE monitor_type AS ENUM ('http', 'https', 'tcp', 'ping');
CREATE TYPE monitor_status AS ENUM ('active', 'paused', 'error');
CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS');

-- Create monitors table
CREATE TABLE IF NOT EXISTS monitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Basic monitor configuration
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    url TEXT NOT NULL CHECK (length(url) >= 1 AND length(url) <= 2048),
    type monitor_type NOT NULL DEFAULT 'https',
    
    -- HTTP specific settings
    method http_method NOT NULL DEFAULT 'GET',
    headers JSONB DEFAULT '{}',
    body TEXT,
    
    -- Check configuration
    interval_seconds INTEGER NOT NULL DEFAULT 300 CHECK (interval_seconds >= 60), -- Minimum 1 minute
    timeout_seconds INTEGER NOT NULL DEFAULT 30 CHECK (timeout_seconds >= 5 AND timeout_seconds <= 120),
    
    -- Success criteria
    expected_status_codes INTEGER[] NOT NULL DEFAULT '{200}',
    expected_response_time_ms INTEGER CHECK (expected_response_time_ms > 0),
    expected_content TEXT, -- Optional content to check for
    
    -- SSL/TLS monitoring
    check_ssl BOOLEAN NOT NULL DEFAULT true,
    ssl_expiry_days_warning INTEGER DEFAULT 30,
    
    -- Current status
    status monitor_status NOT NULL DEFAULT 'active',
    is_up BOOLEAN DEFAULT NULL, -- NULL = never checked, true/false = last check result
    last_checked_at TIMESTAMPTZ,
    last_response_time_ms INTEGER,
    last_status_code INTEGER,
    last_error TEXT,
    
    -- Incident tracking
    current_incident_id UUID, -- Will reference incidents table
    downtime_started_at TIMESTAMPTZ,
    
    -- Statistics (denormalized for performance)
    total_checks INTEGER NOT NULL DEFAULT 0,
    successful_checks INTEGER NOT NULL DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT NULL,
    avg_response_time_ms INTEGER DEFAULT NULL,
    
    -- Metadata
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own monitors
CREATE POLICY "Users can view own monitors" 
    ON monitors FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitors" 
    ON monitors FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitors" 
    ON monitors FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitors" 
    ON monitors FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS monitors_user_id_idx ON monitors(user_id);
CREATE INDEX IF NOT EXISTS monitors_status_idx ON monitors(status);
CREATE INDEX IF NOT EXISTS monitors_is_up_idx ON monitors(is_up);
CREATE INDEX IF NOT EXISTS monitors_last_checked_at_idx ON monitors(last_checked_at);
CREATE INDEX IF NOT EXISTS monitors_created_at_idx ON monitors(created_at);
CREATE INDEX IF NOT EXISTS monitors_user_id_status_idx ON monitors(user_id, status);

-- Composite index for active monitors that need checking
CREATE INDEX IF NOT EXISTS monitors_active_check_idx 
    ON monitors(status, last_checked_at) 
    WHERE status = 'active';

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS monitors_tags_gin_idx ON monitors USING GIN(tags);

-- Trigger to auto-update updated_at
CREATE TRIGGER monitors_updated_at
    BEFORE UPDATE ON monitors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate monitor limits based on user plan
CREATE OR REPLACE FUNCTION public.validate_monitor_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_plan plan_type;
    user_max_monitors INTEGER;
    current_monitor_count INTEGER;
BEGIN
    -- Get user's plan and limits
    SELECT plan, max_monitors 
    INTO user_plan, user_max_monitors
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Count current monitors for this user
    SELECT COUNT(*) 
    INTO current_monitor_count
    FROM monitors 
    WHERE user_id = NEW.user_id;
    
    -- Check if adding this monitor would exceed the limit
    IF TG_OP = 'INSERT' AND current_monitor_count >= user_max_monitors THEN
        RAISE EXCEPTION 'Monitor limit exceeded. Your % plan allows % monitors, you currently have %', 
            user_plan, user_max_monitors, current_monitor_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce monitor limits
CREATE TRIGGER monitors_validate_limits
    BEFORE INSERT ON monitors
    FOR EACH ROW EXECUTE FUNCTION public.validate_monitor_limits();

-- Function to calculate uptime percentage
CREATE OR REPLACE FUNCTION public.calculate_uptime_percentage(monitor_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_checks INTEGER;
    successful_checks INTEGER;
    uptime_pct DECIMAL(5,2);
BEGIN
    SELECT m.total_checks, m.successful_checks
    INTO total_checks, successful_checks
    FROM monitors m
    WHERE m.id = monitor_uuid;
    
    IF total_checks = 0 THEN
        RETURN NULL;
    END IF;
    
    uptime_pct := (successful_checks::DECIMAL / total_checks::DECIMAL) * 100;
    RETURN ROUND(uptime_pct, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update monitor statistics
CREATE OR REPLACE FUNCTION public.update_monitor_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update uptime percentage when check counts change
    IF TG_OP = 'UPDATE' AND (OLD.total_checks != NEW.total_checks OR OLD.successful_checks != NEW.successful_checks) THEN
        NEW.uptime_percentage := public.calculate_uptime_percentage(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update statistics
CREATE TRIGGER monitors_update_stats
    BEFORE UPDATE ON monitors
    FOR EACH ROW EXECUTE FUNCTION public.update_monitor_stats();