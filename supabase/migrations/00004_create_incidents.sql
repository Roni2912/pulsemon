-- Migration: Create incidents table
-- Purpose: Tracks downtime incidents and their resolution
-- This table records when monitors go down, how long they stay down, and incident details
-- Used for incident history, notifications, and status page updates

-- Create custom types for incident management
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'identified', 'monitoring', 'resolved');
CREATE TYPE incident_severity AS ENUM ('minor', 'major', 'critical');

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    
    -- Incident details
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT,
    status incident_status NOT NULL DEFAULT 'open',
    severity incident_severity NOT NULL DEFAULT 'major',
    
    -- Timing information
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When our system detected it
    acknowledged_at TIMESTAMPTZ, -- When user acknowledged it
    resolved_at TIMESTAMPTZ,
    
    -- Duration calculations (denormalized for performance)
    duration_seconds INTEGER, -- Total incident duration
    detection_delay_seconds INTEGER, -- Time between start and detection
    
    -- Root cause and resolution
    root_cause TEXT,
    resolution_summary TEXT,
    
    -- Affected services (for future multi-service incidents)
    affected_services TEXT[] DEFAULT '{}',
    
    -- Notification tracking
    notifications_sent INTEGER NOT NULL DEFAULT 0,
    last_notification_at TIMESTAMPTZ,
    
    -- Status page visibility
    public_visible BOOLEAN NOT NULL DEFAULT true,
    public_message TEXT, -- Custom message for status page
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    external_incident_id TEXT, -- For integration with external tools
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view incidents for their own monitors
CREATE POLICY "Users can view own monitor incidents" 
    ON incidents FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM monitors m 
            WHERE m.id = incidents.monitor_id 
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own monitor incidents" 
    ON incidents FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM monitors m 
            WHERE m.id = incidents.monitor_id 
            AND m.user_id = auth.uid()
        )
    );

-- Service role can insert incidents (for automated detection)
CREATE POLICY "Service role can insert incidents" 
    ON incidents FOR INSERT 
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS incidents_monitor_id_idx ON incidents(monitor_id);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents(status);
CREATE INDEX IF NOT EXISTS incidents_started_at_idx ON incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS incidents_severity_idx ON incidents(severity);
CREATE INDEX IF NOT EXISTS incidents_public_visible_idx ON incidents(public_visible);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS incidents_monitor_status_idx ON incidents(monitor_id, status);
CREATE INDEX IF NOT EXISTS incidents_open_idx ON incidents(started_at DESC) 
    WHERE status IN ('open', 'investigating', 'identified', 'monitoring');

-- GIN index for tags
CREATE INDEX IF NOT EXISTS incidents_tags_gin_idx ON incidents USING GIN(tags);

-- Trigger to auto-update updated_at
CREATE TRIGGER incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate incident duration when resolved
CREATE OR REPLACE FUNCTION public.calculate_incident_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when incident is resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.resolved_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at))::INTEGER;
        NEW.detection_delay_seconds := EXTRACT(EPOCH FROM (NEW.detected_at - NEW.started_at))::INTEGER;
    END IF;
    
    -- Auto-set resolved_at when status changes to resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' AND NEW.resolved_at IS NULL THEN
        NEW.resolved_at := NOW();
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at))::INTEGER;
        NEW.detection_delay_seconds := EXTRACT(EPOCH FROM (NEW.detected_at - NEW.started_at))::INTEGER;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate duration
CREATE TRIGGER incidents_calculate_duration
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION public.calculate_incident_duration();

-- Function to update monitor's current incident reference
CREATE OR REPLACE FUNCTION public.sync_monitor_incident()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Link new incident to monitor
        UPDATE monitors 
        SET current_incident_id = NEW.id
        WHERE id = NEW.monitor_id;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Clear monitor's incident reference when resolved
        IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
            UPDATE monitors 
            SET current_incident_id = NULL,
                downtime_started_at = NULL
            WHERE id = NEW.monitor_id AND current_incident_id = NEW.id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Clear monitor's incident reference when incident deleted
        UPDATE monitors 
        SET current_incident_id = NULL,
            downtime_started_at = NULL
        WHERE id = OLD.monitor_id AND current_incident_id = OLD.id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync monitor incident reference
CREATE TRIGGER incidents_sync_monitor
    AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION public.sync_monitor_incident();

-- Function to auto-generate incident title
CREATE OR REPLACE FUNCTION public.generate_incident_title(monitor_name TEXT, error_type TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
    IF error_type IS NOT NULL THEN
        RETURN format('%s is experiencing %s issues', monitor_name, error_type);
    ELSE
        RETURN format('%s is down', monitor_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create incident from monitor failure
CREATE OR REPLACE FUNCTION public.create_incident_for_monitor(
    p_monitor_id UUID,
    p_started_at TIMESTAMPTZ DEFAULT NOW(),
    p_error_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    monitor_name TEXT;
    incident_id UUID;
    incident_title TEXT;
BEGIN
    -- Get monitor name
    SELECT name INTO monitor_name FROM monitors WHERE id = p_monitor_id;
    
    -- Generate incident title
    incident_title := public.generate_incident_title(monitor_name, p_error_type);
    
    -- Create incident
    INSERT INTO incidents (
        monitor_id,
        title,
        started_at,
        detected_at,
        description
    ) VALUES (
        p_monitor_id,
        incident_title,
        p_started_at,
        NOW(),
        CASE 
            WHEN p_error_type IS NOT NULL THEN 
                format('Automated incident created due to %s errors detected on %s', p_error_type, monitor_name)
            ELSE 
                format('Automated incident created due to downtime detected on %s', monitor_name)
        END
    ) RETURNING id INTO incident_id;
    
    RETURN incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create incident updates table for timeline
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    -- Update details
    status incident_status NOT NULL,
    message TEXT NOT NULL CHECK (length(message) >= 1),
    
    -- Author information
    author_id UUID REFERENCES profiles(id),
    author_name TEXT, -- For system-generated updates
    
    -- Visibility
    public_visible BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for incident updates
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy for incident updates
CREATE POLICY "Users can view own incident updates" 
    ON incident_updates FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM incidents i
            JOIN monitors m ON i.monitor_id = m.id
            WHERE i.id = incident_updates.incident_id 
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own incident updates" 
    ON incident_updates FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM incidents i
            JOIN monitors m ON i.monitor_id = m.id
            WHERE i.id = incident_updates.incident_id 
            AND m.user_id = auth.uid()
        )
    );

-- Index for incident updates
CREATE INDEX IF NOT EXISTS incident_updates_incident_id_idx ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS incident_updates_created_at_idx ON incident_updates(created_at DESC);

-- Function to auto-create incident update when incident status changes
CREATE OR REPLACE FUNCTION public.create_incident_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create update if status actually changed
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO incident_updates (
            incident_id,
            status,
            message,
            author_name,
            public_visible
        ) VALUES (
            NEW.id,
            NEW.status,
            CASE NEW.status
                WHEN 'investigating' THEN 'We are investigating this issue.'
                WHEN 'identified' THEN 'We have identified the issue and are working on a fix.'
                WHEN 'monitoring' THEN 'A fix has been implemented and we are monitoring the results.'
                WHEN 'resolved' THEN 'This incident has been resolved.'
                ELSE 'Incident status updated.'
            END,
            'System',
            NEW.public_visible
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-creating status updates
CREATE TRIGGER incidents_auto_status_update
    AFTER UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION public.create_incident_status_update();

-- View for incident statistics
CREATE OR REPLACE VIEW incident_stats AS
SELECT 
    DATE_TRUNC('day', started_at) as incident_date,
    COUNT(*) as total_incidents,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_incidents,
    COUNT(CASE WHEN severity = 'major' THEN 1 END) as major_incidents,
    COUNT(CASE WHEN severity = 'minor' THEN 1 END) as minor_incidents,
    AVG(duration_seconds) as avg_duration_seconds,
    SUM(duration_seconds) as total_downtime_seconds
FROM incidents
WHERE resolved_at IS NOT NULL
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY incident_date DESC;