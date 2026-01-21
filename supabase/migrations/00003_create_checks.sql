-- Migration: Create checks table
-- Purpose: Stores historical monitoring check results
-- This table records every check performed on monitors, creating a timeline of uptime/downtime
-- Used for generating statistics, charts, and incident detection

-- Create custom types for check results
CREATE TYPE check_status AS ENUM ('success', 'failure', 'timeout', 'ssl_error', 'dns_error', 'connection_error');

-- Create checks table
CREATE TABLE IF NOT EXISTS checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    
    -- Check execution details
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status check_status NOT NULL,
    
    -- Response details
    response_time_ms INTEGER CHECK (response_time_ms >= 0),
    status_code INTEGER CHECK (status_code >= 100 AND status_code <= 599),
    
    -- Error information
    error_message TEXT,
    error_type TEXT, -- 'timeout', 'dns', 'connection', 'ssl', 'http', 'content'
    
    -- Response metadata
    response_headers JSONB DEFAULT '{}',
    response_size_bytes INTEGER CHECK (response_size_bytes >= 0),
    
    -- SSL certificate information
    ssl_valid BOOLEAN,
    ssl_expires_at TIMESTAMPTZ,
    ssl_issuer TEXT,
    
    -- Content validation
    content_matched BOOLEAN, -- If expected_content was checked
    
    -- Network details
    ip_address INET,
    location TEXT, -- Check origin location (for future multi-region support)
    
    -- Performance metrics
    dns_time_ms INTEGER CHECK (dns_time_ms >= 0),
    connect_time_ms INTEGER CHECK (connect_time_ms >= 0),
    tls_time_ms INTEGER CHECK (tls_time_ms >= 0),
    
    -- Metadata
    user_agent TEXT DEFAULT 'UptimeMonitor/1.0',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view checks for their own monitors
CREATE POLICY "Users can view own monitor checks" 
    ON checks FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM monitors m 
            WHERE m.id = checks.monitor_id 
            AND m.user_id = auth.uid()
        )
    );

-- Service role can insert checks (for cron jobs)
CREATE POLICY "Service role can insert checks" 
    ON checks FOR INSERT 
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS checks_monitor_id_idx ON checks(monitor_id);
CREATE INDEX IF NOT EXISTS checks_checked_at_idx ON checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS checks_status_idx ON checks(status);
CREATE INDEX IF NOT EXISTS checks_monitor_checked_at_idx ON checks(monitor_id, checked_at DESC);

-- Composite index for recent checks by monitor
CREATE INDEX IF NOT EXISTS checks_monitor_recent_idx 
    ON checks(monitor_id, checked_at DESC, status);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS checks_response_time_idx ON checks(response_time_ms) 
    WHERE response_time_ms IS NOT NULL;

-- Partial index for failed checks
CREATE INDEX IF NOT EXISTS checks_failures_idx ON checks(monitor_id, checked_at DESC) 
    WHERE status != 'success';

-- Function to update monitor statistics after check insert
CREATE OR REPLACE FUNCTION public.update_monitor_after_check()
RETURNS TRIGGER AS $$
DECLARE
    is_success BOOLEAN;
    avg_response_time INTEGER;
BEGIN
    -- Determine if this check was successful
    is_success := NEW.status = 'success';
    
    -- Update monitor with latest check information
    UPDATE monitors SET
        last_checked_at = NEW.checked_at,
        last_response_time_ms = NEW.response_time_ms,
        last_status_code = NEW.status_code,
        last_error = CASE WHEN is_success THEN NULL ELSE NEW.error_message END,
        is_up = is_success,
        total_checks = total_checks + 1,
        successful_checks = successful_checks + CASE WHEN is_success THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = NEW.monitor_id;
    
    -- Calculate and update average response time (last 100 checks)
    SELECT AVG(response_time_ms)::INTEGER
    INTO avg_response_time
    FROM (
        SELECT response_time_ms 
        FROM checks 
        WHERE monitor_id = NEW.monitor_id 
        AND response_time_ms IS NOT NULL 
        ORDER BY checked_at DESC 
        LIMIT 100
    ) recent_checks;
    
    UPDATE monitors 
    SET avg_response_time_ms = avg_response_time
    WHERE id = NEW.monitor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update monitor stats after each check
CREATE TRIGGER checks_update_monitor_stats
    AFTER INSERT ON checks
    FOR EACH ROW EXECUTE FUNCTION public.update_monitor_after_check();

-- Function to detect incident start/end
CREATE OR REPLACE FUNCTION public.handle_incident_detection()
RETURNS TRIGGER AS $$
DECLARE
    monitor_record monitors%ROWTYPE;
    consecutive_failures INTEGER;
    consecutive_successes INTEGER;
BEGIN
    -- Get current monitor state
    SELECT * INTO monitor_record FROM monitors WHERE id = NEW.monitor_id;
    
    IF NEW.status = 'success' THEN
        -- Check if this ends an ongoing incident (3 consecutive successes)
        SELECT COUNT(*)
        INTO consecutive_successes
        FROM (
            SELECT status 
            FROM checks 
            WHERE monitor_id = NEW.monitor_id 
            ORDER BY checked_at DESC 
            LIMIT 3
        ) recent_checks
        WHERE status = 'success';
        
        -- End incident if we have 3 consecutive successes and monitor was down
        IF consecutive_successes = 3 AND monitor_record.is_up = false THEN
            UPDATE monitors SET
                current_incident_id = NULL,
                downtime_started_at = NULL
            WHERE id = NEW.monitor_id;
        END IF;
        
    ELSE
        -- Check if this starts a new incident (3 consecutive failures)
        SELECT COUNT(*)
        INTO consecutive_failures
        FROM (
            SELECT status 
            FROM checks 
            WHERE monitor_id = NEW.monitor_id 
            ORDER BY checked_at DESC 
            LIMIT 3
        ) recent_checks
        WHERE status != 'success';
        
        -- Start incident if we have 3 consecutive failures and no current incident
        IF consecutive_failures = 3 AND monitor_record.current_incident_id IS NULL THEN
            UPDATE monitors SET
                downtime_started_at = NEW.checked_at
            WHERE id = NEW.monitor_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for incident detection
CREATE TRIGGER checks_incident_detection
    AFTER INSERT ON checks
    FOR EACH ROW EXECUTE FUNCTION public.handle_incident_detection();

-- Function to clean up old checks (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_checks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete checks older than 90 days for free users, 1 year for paid users
    DELETE FROM checks 
    WHERE id IN (
        SELECT c.id 
        FROM checks c
        JOIN monitors m ON c.monitor_id = m.id
        JOIN profiles p ON m.user_id = p.id
        WHERE (
            (p.plan = 'free' AND c.checked_at < NOW() - INTERVAL '90 days') OR
            (p.plan != 'free' AND c.checked_at < NOW() - INTERVAL '1 year')
        )
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for recent check statistics
CREATE OR REPLACE VIEW monitor_check_stats AS
SELECT 
    m.id as monitor_id,
    m.name as monitor_name,
    COUNT(c.id) as total_checks_24h,
    COUNT(CASE WHEN c.status = 'success' THEN 1 END) as successful_checks_24h,
    ROUND(
        (COUNT(CASE WHEN c.status = 'success' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(c.id), 0)) * 100, 2
    ) as uptime_24h,
    AVG(c.response_time_ms)::INTEGER as avg_response_time_24h,
    MAX(c.checked_at) as last_check_at
FROM monitors m
LEFT JOIN checks c ON m.id = c.monitor_id 
    AND c.checked_at >= NOW() - INTERVAL '24 hours'
GROUP BY m.id, m.name;