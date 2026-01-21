-- Migration: Create alert settings table
-- Purpose: Manages user notification preferences and alert configurations
-- This table defines when and how users want to be notified about incidents
-- Supports multiple notification channels and customizable alert rules

-- Create custom types for alert configuration
CREATE TYPE alert_channel AS ENUM ('email', 'sms', 'webhook', 'slack', 'discord', 'teams');
CREATE TYPE alert_event AS ENUM ('monitor_down', 'monitor_up', 'ssl_expiry', 'response_time', 'status_change');
CREATE TYPE alert_frequency AS ENUM ('immediate', 'every_5min', 'every_15min', 'every_hour', 'daily');

-- Create alert settings table
CREATE TABLE IF NOT EXISTS alert_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE, -- NULL = global setting
    
    -- Alert configuration
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- Event triggers
    events alert_event[] NOT NULL DEFAULT '{monitor_down,monitor_up}',
    
    -- Channel configuration
    channel alert_channel NOT NULL,
    channel_config JSONB NOT NULL DEFAULT '{}', -- Channel-specific settings
    
    -- Alert conditions
    failure_threshold INTEGER NOT NULL DEFAULT 3, -- Consecutive failures before alert
    recovery_threshold INTEGER NOT NULL DEFAULT 3, -- Consecutive successes before recovery alert
    response_time_threshold_ms INTEGER, -- Alert if response time exceeds this
    
    -- Frequency and timing
    frequency alert_frequency NOT NULL DEFAULT 'immediate',
    quiet_hours_start TIME, -- No alerts during these hours (user timezone)
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    
    -- Rate limiting
    max_alerts_per_hour INTEGER NOT NULL DEFAULT 10,
    last_alert_sent_at TIMESTAMPTZ,
    alerts_sent_count INTEGER NOT NULL DEFAULT 0,
    alerts_sent_hour TIMESTAMPTZ, -- Track hourly reset
    
    -- SSL monitoring
    ssl_expiry_days_warning INTEGER DEFAULT 30,
    
    -- Escalation (for future use)
    escalation_delay_minutes INTEGER DEFAULT 60,
    escalation_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own alert settings
CREATE POLICY "Users can view own alert settings" 
    ON alert_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert settings" 
    ON alert_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings" 
    ON alert_settings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert settings" 
    ON alert_settings FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS alert_settings_user_id_idx ON alert_settings(user_id);
CREATE INDEX IF NOT EXISTS alert_settings_monitor_id_idx ON alert_settings(monitor_id);
CREATE INDEX IF NOT EXISTS alert_settings_enabled_idx ON alert_settings(is_enabled);
CREATE INDEX IF NOT EXISTS alert_settings_channel_idx ON alert_settings(channel);

-- Composite index for active alerts
CREATE INDEX IF NOT EXISTS alert_settings_active_idx 
    ON alert_settings(user_id, is_enabled) 
    WHERE is_enabled = true;

-- GIN indexes for arrays
CREATE INDEX IF NOT EXISTS alert_settings_events_gin_idx ON alert_settings USING GIN(events);
CREATE INDEX IF NOT EXISTS alert_settings_tags_gin_idx ON alert_settings USING GIN(tags);

-- Trigger to auto-update updated_at
CREATE TRIGGER alert_settings_updated_at
    BEFORE UPDATE ON alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate alert settings limits based on user plan
CREATE OR REPLACE FUNCTION public.validate_alert_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_plan plan_type;
    current_alert_count INTEGER;
    max_alerts INTEGER;
BEGIN
    -- Get user's plan
    SELECT plan INTO user_plan FROM profiles WHERE id = NEW.user_id;
    
    -- Set limits based on plan
    max_alerts := CASE user_plan
        WHEN 'free' THEN 5
        WHEN 'pro' THEN 50
        WHEN 'enterprise' THEN 500
    END;
    
    -- Count current alert settings for this user
    SELECT COUNT(*) INTO current_alert_count
    FROM alert_settings 
    WHERE user_id = NEW.user_id;
    
    -- Check if adding this alert would exceed the limit
    IF TG_OP = 'INSERT' AND current_alert_count >= max_alerts THEN
        RAISE EXCEPTION 'Alert settings limit exceeded. Your % plan allows % alert configurations, you currently have %', 
            user_plan, max_alerts, current_alert_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce alert limits
CREATE TRIGGER alert_settings_validate_limits
    BEFORE INSERT ON alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.validate_alert_limits();

-- Function to reset hourly alert counters
CREATE OR REPLACE FUNCTION public.reset_alert_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset counter if we're in a new hour
    IF NEW.alerts_sent_hour IS NULL OR 
       DATE_TRUNC('hour', NOW()) > DATE_TRUNC('hour', NEW.alerts_sent_hour) THEN
        NEW.alerts_sent_count := 0;
        NEW.alerts_sent_hour := DATE_TRUNC('hour', NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset counters
CREATE TRIGGER alert_settings_reset_counters
    BEFORE UPDATE ON alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.reset_alert_counters();

-- Create alert logs table to track sent notifications
CREATE TABLE IF NOT EXISTS alert_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_setting_id UUID NOT NULL REFERENCES alert_settings(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    
    -- Alert details
    event_type alert_event NOT NULL,
    channel alert_channel NOT NULL,
    
    -- Message content
    subject TEXT,
    message TEXT NOT NULL,
    
    -- Delivery status
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, rate_limited
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Channel-specific data
    channel_response JSONB DEFAULT '{}',
    external_id TEXT, -- ID from external service (email ID, webhook response, etc.)
    
    -- Metadata
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for alert logs
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for alert logs
CREATE POLICY "Users can view own alert logs" 
    ON alert_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM alert_settings a
            WHERE a.id = alert_logs.alert_setting_id 
            AND a.user_id = auth.uid()
        )
    );

-- Service role can insert alert logs
CREATE POLICY "Service role can insert alert logs" 
    ON alert_logs FOR INSERT 
    WITH CHECK (true);

-- Indexes for alert logs
CREATE INDEX IF NOT EXISTS alert_logs_alert_setting_id_idx ON alert_logs(alert_setting_id);
CREATE INDEX IF NOT EXISTS alert_logs_monitor_id_idx ON alert_logs(monitor_id);
CREATE INDEX IF NOT EXISTS alert_logs_status_idx ON alert_logs(status);
CREATE INDEX IF NOT EXISTS alert_logs_created_at_idx ON alert_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS alert_logs_event_type_idx ON alert_logs(event_type);

-- Function to check if alert should be sent (rate limiting, quiet hours)
CREATE OR REPLACE FUNCTION public.should_send_alert(
    p_alert_setting_id UUID,
    p_event_type alert_event,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    setting_record alert_settings%ROWTYPE;
    current_hour INTEGER;
    quiet_start_hour INTEGER;
    quiet_end_hour INTEGER;
    last_alert_interval INTERVAL;
BEGIN
    -- Get alert setting
    SELECT * INTO setting_record FROM alert_settings WHERE id = p_alert_setting_id;
    
    -- Check if alert is enabled
    IF NOT setting_record.is_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- Check if event type is enabled
    IF NOT (p_event_type = ANY(setting_record.events)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check rate limiting
    IF setting_record.alerts_sent_count >= setting_record.max_alerts_per_hour THEN
        RETURN FALSE;
    END IF;
    
    -- Check quiet hours
    IF setting_record.quiet_hours_start IS NOT NULL AND setting_record.quiet_hours_end IS NOT NULL THEN
        current_hour := EXTRACT(HOUR FROM (p_check_time AT TIME ZONE setting_record.timezone));
        quiet_start_hour := EXTRACT(HOUR FROM setting_record.quiet_hours_start);
        quiet_end_hour := EXTRACT(HOUR FROM setting_record.quiet_hours_end);
        
        -- Handle quiet hours that span midnight
        IF quiet_start_hour <= quiet_end_hour THEN
            IF current_hour >= quiet_start_hour AND current_hour < quiet_end_hour THEN
                RETURN FALSE;
            END IF;
        ELSE
            IF current_hour >= quiet_start_hour OR current_hour < quiet_end_hour THEN
                RETURN FALSE;
            END IF;
        END IF;
    END IF;
    
    -- Check frequency limits
    IF setting_record.last_alert_sent_at IS NOT NULL THEN
        last_alert_interval := p_check_time - setting_record.last_alert_sent_at;
        
        CASE setting_record.frequency
            WHEN 'immediate' THEN
                -- No additional delay
            WHEN 'every_5min' THEN
                IF last_alert_interval < INTERVAL '5 minutes' THEN
                    RETURN FALSE;
                END IF;
            WHEN 'every_15min' THEN
                IF last_alert_interval < INTERVAL '15 minutes' THEN
                    RETURN FALSE;
                END IF;
            WHEN 'every_hour' THEN
                IF last_alert_interval < INTERVAL '1 hour' THEN
                    RETURN FALSE;
                END IF;
            WHEN 'daily' THEN
                IF last_alert_interval < INTERVAL '1 day' THEN
                    RETURN FALSE;
                END IF;
        END CASE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record alert sent
CREATE OR REPLACE FUNCTION public.record_alert_sent(
    p_alert_setting_id UUID,
    p_monitor_id UUID,
    p_event_type alert_event,
    p_channel alert_channel,
    p_subject TEXT,
    p_message TEXT,
    p_status TEXT DEFAULT 'sent',
    p_external_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Insert alert log
    INSERT INTO alert_logs (
        alert_setting_id,
        monitor_id,
        event_type,
        channel,
        subject,
        message,
        status,
        external_id,
        sent_at
    ) VALUES (
        p_alert_setting_id,
        p_monitor_id,
        p_event_type,
        p_channel,
        p_subject,
        p_message,
        p_status,
        p_external_id,
        CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END
    ) RETURNING id INTO log_id;
    
    -- Update alert setting counters
    UPDATE alert_settings SET
        last_alert_sent_at = NOW(),
        alerts_sent_count = alerts_sent_count + 1,
        updated_at = NOW()
    WHERE id = p_alert_setting_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for alert statistics
CREATE OR REPLACE VIEW alert_stats AS
SELECT 
    a.user_id,
    a.channel,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN l.status = 'sent' THEN 1 END) as successful_alerts,
    COUNT(CASE WHEN l.status = 'failed' THEN 1 END) as failed_alerts,
    MAX(l.created_at) as last_alert_at,
    AVG(EXTRACT(EPOCH FROM (l.sent_at - l.created_at))) as avg_delivery_time_seconds
FROM alert_settings a
LEFT JOIN alert_logs l ON a.id = l.alert_setting_id
WHERE a.is_enabled = true
GROUP BY a.user_id, a.channel;