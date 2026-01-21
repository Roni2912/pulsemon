-- Migration: Create status pages table
-- Purpose: Manages public-facing status pages for sharing uptime information
-- This table stores configuration for branded status pages that customers can share publicly
-- Supports custom domains, branding, and selective monitor visibility

-- Create custom types for status page configuration
CREATE TYPE status_page_theme AS ENUM ('light', 'dark', 'auto');
CREATE TYPE status_page_layout AS ENUM ('minimal', 'detailed', 'compact');

-- Create status pages table
CREATE TABLE IF NOT EXISTS status_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Basic configuration
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 50),
    description TEXT,
    
    -- Branding and appearance
    logo_url TEXT,
    favicon_url TEXT,
    theme status_page_theme NOT NULL DEFAULT 'light',
    layout status_page_layout NOT NULL DEFAULT 'detailed',
    custom_css TEXT,
    
    -- Colors and styling
    primary_color TEXT DEFAULT '#3b82f6' CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
    background_color TEXT DEFAULT '#ffffff' CHECK (background_color ~ '^#[0-9a-fA-F]{6}$'),
    text_color TEXT DEFAULT '#1f2937' CHECK (text_color ~ '^#[0-9a-fA-F]{6}$'),
    
    -- Content configuration
    show_uptime_percentage BOOLEAN NOT NULL DEFAULT true,
    show_response_times BOOLEAN NOT NULL DEFAULT true,
    show_incident_history BOOLEAN NOT NULL DEFAULT true,
    show_maintenance_banner BOOLEAN NOT NULL DEFAULT false,
    
    -- Time range settings
    uptime_days_to_show INTEGER NOT NULL DEFAULT 90 CHECK (uptime_days_to_show > 0 AND uptime_days_to_show <= 365),
    incident_days_to_show INTEGER NOT NULL DEFAULT 30 CHECK (incident_days_to_show > 0 AND incident_days_to_show <= 365),
    
    -- Custom domain and SEO
    custom_domain TEXT CHECK (custom_domain ~ '^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- SEO metadata
    meta_title TEXT,
    meta_description TEXT CHECK (length(meta_description) <= 160),
    meta_keywords TEXT,
    
    -- Access control
    is_public BOOLEAN NOT NULL DEFAULT true,
    password_protected BOOLEAN NOT NULL DEFAULT false,
    password_hash TEXT, -- bcrypt hash if password protected
    
    -- Maintenance mode
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    maintenance_message TEXT,
    maintenance_scheduled_start TIMESTAMPTZ,
    maintenance_scheduled_end TIMESTAMPTZ,
    
    -- Analytics and tracking
    google_analytics_id TEXT,
    enable_analytics BOOLEAN NOT NULL DEFAULT false,
    
    -- Subscription and notifications
    allow_subscriptions BOOLEAN NOT NULL DEFAULT true,
    webhook_url TEXT, -- For status change notifications
    webhook_secret TEXT,
    
    -- Social links
    twitter_handle TEXT CHECK (twitter_handle ~ '^[a-zA-Z0-9_]+$'),
    support_url TEXT,
    website_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE status_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own status pages
CREATE POLICY "Users can view own status pages" 
    ON status_pages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own status pages" 
    ON status_pages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own status pages" 
    ON status_pages FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own status pages" 
    ON status_pages FOR DELETE 
    USING (auth.uid() = user_id);

-- Public access policy for status page viewing
CREATE POLICY "Public can view public status pages" 
    ON status_pages FOR SELECT 
    USING (is_public = true AND maintenance_mode = false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS status_pages_user_id_idx ON status_pages(user_id);
CREATE INDEX IF NOT EXISTS status_pages_slug_idx ON status_pages(slug);
CREATE INDEX IF NOT EXISTS status_pages_custom_domain_idx ON status_pages(custom_domain);
CREATE INDEX IF NOT EXISTS status_pages_public_idx ON status_pages(is_public);
CREATE INDEX IF NOT EXISTS status_pages_created_at_idx ON status_pages(created_at);

-- Trigger to auto-update updated_at
CREATE TRIGGER status_pages_updated_at
    BEFORE UPDATE ON status_pages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to validate status page limits based on user plan
CREATE OR REPLACE FUNCTION public.validate_status_page_limits()
RETURNS TRIGGER AS $$
DECLARE
    user_plan plan_type;
    user_max_status_pages INTEGER;
    current_status_page_count INTEGER;
BEGIN
    -- Get user's plan and limits
    SELECT plan, max_status_pages 
    INTO user_plan, user_max_status_pages
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Count current status pages for this user
    SELECT COUNT(*) 
    INTO current_status_page_count
    FROM status_pages 
    WHERE user_id = NEW.user_id;
    
    -- Check if adding this status page would exceed the limit
    IF TG_OP = 'INSERT' AND current_status_page_count >= user_max_status_pages THEN
        RAISE EXCEPTION 'Status page limit exceeded. Your % plan allows % status pages, you currently have %', 
            user_plan, user_max_status_pages, current_status_page_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce status page limits
CREATE TRIGGER status_pages_validate_limits
    BEFORE INSERT ON status_pages
    FOR EACH ROW EXECUTE FUNCTION public.validate_status_page_limits();

-- Create status page monitors junction table
CREATE TABLE IF NOT EXISTS status_page_monitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    
    -- Display configuration
    display_name TEXT, -- Override monitor name for public display
    display_order INTEGER NOT NULL DEFAULT 0,
    show_uptime BOOLEAN NOT NULL DEFAULT true,
    show_response_time BOOLEAN NOT NULL DEFAULT true,
    
    -- Grouping (for organizing monitors on status page)
    group_name TEXT,
    group_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique monitor per status page
    UNIQUE(status_page_id, monitor_id)
);

-- Enable RLS for status page monitors
ALTER TABLE status_page_monitors ENABLE ROW LEVEL SECURITY;

-- RLS Policy for status page monitors
CREATE POLICY "Users can manage own status page monitors" 
    ON status_page_monitors FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM status_pages sp
            WHERE sp.id = status_page_monitors.status_page_id 
            AND sp.user_id = auth.uid()
        )
    );

-- Public can view monitors for public status pages
CREATE POLICY "Public can view public status page monitors" 
    ON status_page_monitors FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM status_pages sp
            WHERE sp.id = status_page_monitors.status_page_id 
            AND sp.is_public = true 
            AND sp.maintenance_mode = false
        )
    );

-- Indexes for status page monitors
CREATE INDEX IF NOT EXISTS status_page_monitors_status_page_id_idx ON status_page_monitors(status_page_id);
CREATE INDEX IF NOT EXISTS status_page_monitors_monitor_id_idx ON status_page_monitors(monitor_id);
CREATE INDEX IF NOT EXISTS status_page_monitors_display_order_idx ON status_page_monitors(status_page_id, display_order);
CREATE INDEX IF NOT EXISTS status_page_monitors_group_idx ON status_page_monitors(status_page_id, group_name, group_order);

-- Create status page subscribers table
CREATE TABLE IF NOT EXISTS status_page_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
    
    -- Subscriber information
    email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
    confirmed BOOLEAN NOT NULL DEFAULT false,
    confirmation_token TEXT,
    confirmation_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    
    -- Subscription preferences
    notify_incidents BOOLEAN NOT NULL DEFAULT true,
    notify_maintenance BOOLEAN NOT NULL DEFAULT true,
    notify_updates BOOLEAN NOT NULL DEFAULT false,
    
    -- Unsubscribe
    unsubscribed BOOLEAN NOT NULL DEFAULT false,
    unsubscribed_at TIMESTAMPTZ,
    unsubscribe_token TEXT UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique email per status page
    UNIQUE(status_page_id, email)
);

-- Enable RLS for subscribers
ALTER TABLE status_page_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policy for subscribers (users can manage subscribers for their status pages)
CREATE POLICY "Users can manage own status page subscribers" 
    ON status_page_subscribers FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM status_pages sp
            WHERE sp.id = status_page_subscribers.status_page_id 
            AND sp.user_id = auth.uid()
        )
    );

-- Public can subscribe to public status pages
CREATE POLICY "Public can subscribe to public status pages" 
    ON status_page_subscribers FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM status_pages sp
            WHERE sp.id = status_page_subscribers.status_page_id 
            AND sp.is_public = true 
            AND sp.allow_subscriptions = true
        )
    );

-- Indexes for subscribers
CREATE INDEX IF NOT EXISTS status_page_subscribers_status_page_id_idx ON status_page_subscribers(status_page_id);
CREATE INDEX IF NOT EXISTS status_page_subscribers_email_idx ON status_page_subscribers(email);
CREATE INDEX IF NOT EXISTS status_page_subscribers_confirmed_idx ON status_page_subscribers(confirmed);
CREATE INDEX IF NOT EXISTS status_page_subscribers_unsubscribed_idx ON status_page_subscribers(unsubscribed);

-- Trigger to auto-update updated_at for subscribers
CREATE TRIGGER status_page_subscribers_updated_at
    BEFORE UPDATE ON status_page_subscribers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_status_page_slug(page_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from name
    base_slug := lower(regexp_replace(page_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure minimum length
    IF length(base_slug) < 3 THEN
        base_slug := 'status-page';
    END IF;
    
    -- Ensure maximum length
    IF length(base_slug) > 50 THEN
        base_slug := left(base_slug, 50);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM status_pages WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to get status page overall status
CREATE OR REPLACE FUNCTION public.get_status_page_overall_status(page_id UUID)
RETURNS TEXT AS $$
DECLARE
    total_monitors INTEGER;
    down_monitors INTEGER;
    degraded_monitors INTEGER;
BEGIN
    -- Count monitors and their status
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN m.is_up = false THEN 1 END),
        COUNT(CASE WHEN m.is_up = true AND m.avg_response_time_ms > (m.expected_response_time_ms * 1.5) THEN 1 END)
    INTO total_monitors, down_monitors, degraded_monitors
    FROM status_page_monitors spm
    JOIN monitors m ON spm.monitor_id = m.id
    WHERE spm.status_page_id = page_id
    AND m.status = 'active';
    
    -- Determine overall status
    IF total_monitors = 0 THEN
        RETURN 'no_data';
    ELSIF down_monitors > 0 THEN
        RETURN 'major_outage';
    ELSIF degraded_monitors > 0 THEN
        RETURN 'degraded_performance';
    ELSE
        RETURN 'operational';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for status page summary
CREATE OR REPLACE VIEW status_page_summary AS
SELECT 
    sp.id,
    sp.name,
    sp.slug,
    sp.is_public,
    sp.maintenance_mode,
    COUNT(spm.monitor_id) as total_monitors,
    COUNT(CASE WHEN m.is_up = true THEN 1 END) as up_monitors,
    COUNT(CASE WHEN m.is_up = false THEN 1 END) as down_monitors,
    public.get_status_page_overall_status(sp.id) as overall_status,
    sp.created_at,
    sp.updated_at
FROM status_pages sp
LEFT JOIN status_page_monitors spm ON sp.id = spm.status_page_id
LEFT JOIN monitors m ON spm.monitor_id = m.id AND m.status = 'active'
GROUP BY sp.id, sp.name, sp.slug, sp.is_public, sp.maintenance_mode, sp.created_at, sp.updated_at;