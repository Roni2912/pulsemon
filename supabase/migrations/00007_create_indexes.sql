-- Migration: Create performance indexes and optimizations
-- Purpose: Adds comprehensive indexing strategy for optimal query performance
-- This migration creates specialized indexes for common query patterns and reporting needs
-- Includes partial indexes, composite indexes, and database optimizations

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Index for subscription management queries
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx 
    ON profiles(subscription_status) 
    WHERE subscription_status IS NOT NULL;

-- Index for Stripe integration queries
CREATE INDEX IF NOT EXISTS profiles_stripe_subscription_idx 
    ON profiles(stripe_subscription_id) 
    WHERE stripe_subscription_id IS NOT NULL;

-- Composite index for plan-based queries
CREATE INDEX IF NOT EXISTS profiles_plan_status_idx 
    ON profiles(plan, subscription_status);

-- ============================================================================
-- MONITORS TABLE INDEXES
-- ============================================================================

-- Index for monitoring cron job (active monitors that need checking)
CREATE INDEX IF NOT EXISTS monitors_cron_check_idx 
    ON monitors(last_checked_at, interval_seconds) 
    WHERE status = 'active';

-- Index for uptime calculations
CREATE INDEX IF NOT EXISTS monitors_uptime_stats_idx 
    ON monitors(user_id, total_checks, successful_checks) 
    WHERE total_checks > 0;

-- Index for SSL expiry monitoring
CREATE INDEX IF NOT EXISTS monitors_ssl_expiry_idx 
    ON monitors(user_id, ssl_expiry_days_warning) 
    WHERE check_ssl = true AND status = 'active';

-- Index for incident correlation
CREATE INDEX IF NOT EXISTS monitors_incident_idx 
    ON monitors(current_incident_id, downtime_started_at) 
    WHERE current_incident_id IS NOT NULL;

-- Index for response time analysis
CREATE INDEX IF NOT EXISTS monitors_response_time_idx 
    ON monitors(user_id, avg_response_time_ms, last_checked_at) 
    WHERE avg_response_time_ms IS NOT NULL;

-- ============================================================================
-- CHECKS TABLE INDEXES
-- ============================================================================

-- Index for uptime calculations (removed time-based predicate)
CREATE INDEX IF NOT EXISTS checks_uptime_30d_idx 
    ON checks(monitor_id, checked_at DESC, status);

-- Index for response time trends
CREATE INDEX IF NOT EXISTS checks_response_trends_idx 
    ON checks(monitor_id, checked_at DESC, response_time_ms) 
    WHERE response_time_ms IS NOT NULL;

-- Index for error analysis
CREATE INDEX IF NOT EXISTS checks_errors_idx 
    ON checks(monitor_id, error_type, checked_at DESC) 
    WHERE status != 'success';

-- Index for SSL certificate monitoring
CREATE INDEX IF NOT EXISTS checks_ssl_monitoring_idx 
    ON checks(monitor_id, ssl_expires_at, checked_at DESC) 
    WHERE ssl_expires_at IS NOT NULL;

-- Index for performance analysis by status code
CREATE INDEX IF NOT EXISTS checks_status_code_performance_idx 
    ON checks(monitor_id, status_code, response_time_ms, checked_at DESC) 
    WHERE status_code IS NOT NULL;

-- Partial index for recent successful checks (removed time-based predicate)
CREATE INDEX IF NOT EXISTS checks_recent_success_idx 
    ON checks(monitor_id, response_time_ms, checked_at DESC) 
    WHERE status = 'success';

-- ============================================================================
-- INCIDENTS TABLE INDEXES
-- ============================================================================

-- Index for incident dashboard queries
CREATE INDEX IF NOT EXISTS incidents_dashboard_idx 
    ON incidents(monitor_id, status, started_at DESC);

-- Index for incident duration analysis
CREATE INDEX IF NOT EXISTS incidents_duration_idx 
    ON incidents(monitor_id, duration_seconds, resolved_at) 
    WHERE resolved_at IS NOT NULL;

-- Index for public status page incidents
CREATE INDEX IF NOT EXISTS incidents_public_idx 
    ON incidents(monitor_id, public_visible, started_at DESC) 
    WHERE public_visible = true;

-- Index for incident severity reporting
CREATE INDEX IF NOT EXISTS incidents_severity_reporting_idx 
    ON incidents(severity, started_at DESC, duration_seconds) 
    WHERE resolved_at IS NOT NULL;

-- ============================================================================
-- ALERT SETTINGS TABLE INDEXES
-- ============================================================================

-- Index for alert processing (active alerts by channel)
CREATE INDEX IF NOT EXISTS alert_settings_processing_idx 
    ON alert_settings(channel, is_enabled, user_id) 
    WHERE is_enabled = true;

-- Index for rate limiting checks
CREATE INDEX IF NOT EXISTS alert_settings_rate_limit_idx 
    ON alert_settings(user_id, alerts_sent_count, alerts_sent_hour) 
    WHERE is_enabled = true;

-- Index for monitor-specific alerts
CREATE INDEX IF NOT EXISTS alert_settings_monitor_specific_idx 
    ON alert_settings(monitor_id, is_enabled) 
    WHERE monitor_id IS NOT NULL AND is_enabled = true;

-- ============================================================================
-- ALERT LOGS TABLE INDEXES
-- ============================================================================

-- Index for alert delivery tracking
CREATE INDEX IF NOT EXISTS alert_logs_delivery_idx 
    ON alert_logs(alert_setting_id, status, created_at DESC);

-- Index for alert analytics
CREATE INDEX IF NOT EXISTS alert_logs_analytics_idx 
    ON alert_logs(channel, status, created_at DESC);

-- Index for failed alert investigation
CREATE INDEX IF NOT EXISTS alert_logs_failures_idx 
    ON alert_logs(status, failed_at DESC, error_message) 
    WHERE status = 'failed';

-- ============================================================================
-- STATUS PAGES TABLE INDEXES
-- ============================================================================

-- Index for public status page lookup
CREATE INDEX IF NOT EXISTS status_pages_public_lookup_idx 
    ON status_pages(slug, is_public, maintenance_mode) 
    WHERE is_public = true;

-- Index for custom domain lookup
CREATE INDEX IF NOT EXISTS status_pages_domain_lookup_idx 
    ON status_pages(custom_domain, custom_domain_verified) 
    WHERE custom_domain IS NOT NULL;

-- ============================================================================
-- STATUS PAGE MONITORS TABLE INDEXES
-- ============================================================================

-- Index for status page rendering
CREATE INDEX IF NOT EXISTS status_page_monitors_render_idx 
    ON status_page_monitors(status_page_id, group_name, group_order, display_order);

-- ============================================================================
-- STATUS PAGE SUBSCRIBERS TABLE INDEXES
-- ============================================================================

-- Index for subscriber notifications
CREATE INDEX IF NOT EXISTS status_page_subscribers_notify_idx 
    ON status_page_subscribers(status_page_id, confirmed, unsubscribed) 
    WHERE confirmed = true AND unsubscribed = false;

-- Index for confirmation processing
CREATE INDEX IF NOT EXISTS status_page_subscribers_confirmation_idx 
    ON status_page_subscribers(confirmation_token) 
    WHERE confirmed = false AND confirmation_token IS NOT NULL;

-- ============================================================================
-- INCIDENT UPDATES TABLE INDEXES
-- ============================================================================

-- Index for incident timeline
CREATE INDEX IF NOT EXISTS incident_updates_timeline_idx 
    ON incident_updates(incident_id, created_at DESC);

-- Index for public incident updates
CREATE INDEX IF NOT EXISTS incident_updates_public_idx 
    ON incident_updates(incident_id, public_visible, created_at DESC) 
    WHERE public_visible = true;

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Materialized view for monitor statistics (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS monitor_stats_hourly AS
SELECT 
    m.id as monitor_id,
    m.user_id,
    m.name,
    m.url,
    DATE_TRUNC('hour', NOW()) as stats_hour,
    
    -- Current status
    m.is_up,
    m.last_checked_at,
    m.last_response_time_ms,
    
    -- 24 hour statistics
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '24 hours') as checks_24h,
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '24 hours' AND c.status = 'success') as successful_checks_24h,
    AVG(c.response_time_ms) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '24 hours' AND c.response_time_ms IS NOT NULL) as avg_response_time_24h,
    
    -- 7 day statistics  
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '7 days') as checks_7d,
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '7 days' AND c.status = 'success') as successful_checks_7d,
    AVG(c.response_time_ms) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '7 days' AND c.response_time_ms IS NOT NULL) as avg_response_time_7d,
    
    -- 30 day statistics
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '30 days') as checks_30d,
    COUNT(c.id) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '30 days' AND c.status = 'success') as successful_checks_30d,
    AVG(c.response_time_ms) FILTER (WHERE c.checked_at >= NOW() - INTERVAL '30 days' AND c.response_time_ms IS NOT NULL) as avg_response_time_30d,
    
    -- Incident information
    COUNT(i.id) FILTER (WHERE i.started_at >= NOW() - INTERVAL '30 days') as incidents_30d,
    SUM(i.duration_seconds) FILTER (WHERE i.started_at >= NOW() - INTERVAL '30 days' AND i.resolved_at IS NOT NULL) as total_downtime_30d
    
FROM monitors m
LEFT JOIN checks c ON m.id = c.monitor_id
LEFT JOIN incidents i ON m.id = i.monitor_id
WHERE m.status = 'active'
GROUP BY m.id, m.user_id, m.name, m.url, m.is_up, m.last_checked_at, m.last_response_time_ms;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS monitor_stats_hourly_user_idx ON monitor_stats_hourly(user_id);
CREATE INDEX IF NOT EXISTS monitor_stats_hourly_monitor_idx ON monitor_stats_hourly(monitor_id);

-- ============================================================================
-- DATABASE OPTIMIZATIONS
-- ============================================================================

-- Enable auto-vacuum for high-traffic tables
ALTER TABLE checks SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE alert_logs SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

-- Set statistics targets for better query planning
ALTER TABLE monitors ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE checks ALTER COLUMN monitor_id SET STATISTICS 1000;
ALTER TABLE checks ALTER COLUMN checked_at SET STATISTICS 1000;
ALTER TABLE incidents ALTER COLUMN monitor_id SET STATISTICS 1000;

-- ============================================================================
-- FUNCTIONS FOR MAINTENANCE
-- ============================================================================

-- Function to refresh materialized view (called by cron)
CREATE OR REPLACE FUNCTION public.refresh_monitor_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitor_stats_hourly;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION public.analyze_tables()
RETURNS VOID AS $$
BEGIN
    ANALYZE profiles;
    ANALYZE monitors;
    ANALYZE checks;
    ANALYZE incidents;
    ANALYZE alert_settings;
    ANALYZE alert_logs;
    ANALYZE status_pages;
    ANALYZE status_page_monitors;
    ANALYZE status_page_subscribers;
    ANALYZE incident_updates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION public.get_performance_metrics()
RETURNS TABLE (
    table_name TEXT,
    total_size TEXT,
    index_size TEXT,
    row_count BIGINT,
    seq_scans BIGINT,
    index_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        seq_scan as seq_scans,
        COALESCE(idx_scan, 0) as index_scans
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW monitor_stats_hourly IS 'Hourly aggregated statistics for monitors, refreshed by cron job';
COMMENT ON FUNCTION public.refresh_monitor_stats() IS 'Refreshes the monitor statistics materialized view';
COMMENT ON FUNCTION public.analyze_tables() IS 'Updates table statistics for query optimization';
COMMENT ON FUNCTION public.get_performance_metrics() IS 'Returns database performance metrics for monitoring';