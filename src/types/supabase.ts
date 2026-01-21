/**
 * Supabase Database Types
 * Purpose: TypeScript definitions for database schema
 * This file provides type safety for all database operations
 * Generated from: Supabase CLI or manually maintained
 * 
 * To regenerate: npm run db:generate (after setting up Supabase CLI)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          max_monitors: number
          max_checks_per_minute: number
          max_status_pages: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_monitors?: number
          max_checks_per_minute?: number
          max_status_pages?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_monitors?: number
          max_checks_per_minute?: number
          max_status_pages?: number
          created_at?: string
          updated_at?: string
        }
      }
      monitors: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          type: 'http' | 'https' | 'tcp' | 'ping'
          method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
          headers: Json
          body: string | null
          interval_seconds: number
          timeout_seconds: number
          expected_status_codes: number[]
          expected_response_time_ms: number | null
          expected_content: string | null
          check_ssl: boolean
          ssl_expiry_days_warning: number | null
          status: 'active' | 'paused' | 'error'
          is_up: boolean | null
          last_checked_at: string | null
          last_response_time_ms: number | null
          last_status_code: number | null
          last_error: string | null
          current_incident_id: string | null
          downtime_started_at: string | null
          total_checks: number
          successful_checks: number
          uptime_percentage: number | null
          avg_response_time_ms: number | null
          description: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          type?: 'http' | 'https' | 'tcp' | 'ping'
          method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
          headers?: Json
          body?: string | null
          interval_seconds?: number
          timeout_seconds?: number
          expected_status_codes?: number[]
          expected_response_time_ms?: number | null
          expected_content?: string | null
          check_ssl?: boolean
          ssl_expiry_days_warning?: number | null
          status?: 'active' | 'paused' | 'error'
          is_up?: boolean | null
          last_checked_at?: string | null
          last_response_time_ms?: number | null
          last_status_code?: number | null
          last_error?: string | null
          current_incident_id?: string | null
          downtime_started_at?: string | null
          total_checks?: number
          successful_checks?: number
          uptime_percentage?: number | null
          avg_response_time_ms?: number | null
          description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          type?: 'http' | 'https' | 'tcp' | 'ping'
          method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
          headers?: Json
          body?: string | null
          interval_seconds?: number
          timeout_seconds?: number
          expected_status_codes?: number[]
          expected_response_time_ms?: number | null
          expected_content?: string | null
          check_ssl?: boolean
          ssl_expiry_days_warning?: number | null
          status?: 'active' | 'paused' | 'error'
          is_up?: boolean | null
          last_checked_at?: string | null
          last_response_time_ms?: number | null
          last_status_code?: number | null
          last_error?: string | null
          current_incident_id?: string | null
          downtime_started_at?: string | null
          total_checks?: number
          successful_checks?: number
          uptime_percentage?: number | null
          avg_response_time_ms?: number | null
          description?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      checks: {
        Row: {
          id: string
          monitor_id: string
          checked_at: string
          status: 'success' | 'failure' | 'timeout' | 'ssl_error' | 'dns_error' | 'connection_error'
          response_time_ms: number | null
          status_code: number | null
          error_message: string | null
          error_type: string | null
          response_headers: Json
          response_size_bytes: number | null
          ssl_valid: boolean | null
          ssl_expires_at: string | null
          ssl_issuer: string | null
          content_matched: boolean | null
          ip_address: string | null
          location: string | null
          dns_time_ms: number | null
          connect_time_ms: number | null
          tls_time_ms: number | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          checked_at?: string
          status: 'success' | 'failure' | 'timeout' | 'ssl_error' | 'dns_error' | 'connection_error'
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          error_type?: string | null
          response_headers?: Json
          response_size_bytes?: number | null
          ssl_valid?: boolean | null
          ssl_expires_at?: string | null
          ssl_issuer?: string | null
          content_matched?: boolean | null
          ip_address?: string | null
          location?: string | null
          dns_time_ms?: number | null
          connect_time_ms?: number | null
          tls_time_ms?: number | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          checked_at?: string
          status?: 'success' | 'failure' | 'timeout' | 'ssl_error' | 'dns_error' | 'connection_error'
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          error_type?: string | null
          response_headers?: Json
          response_size_bytes?: number | null
          ssl_valid?: boolean | null
          ssl_expires_at?: string | null
          ssl_issuer?: string | null
          content_matched?: boolean | null
          ip_address?: string | null
          location?: string | null
          dns_time_ms?: number | null
          connect_time_ms?: number | null
          tls_time_ms?: number | null
          user_agent?: string | null
          created_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          monitor_id: string
          title: string
          description: string | null
          status: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved'
          severity: 'minor' | 'major' | 'critical'
          started_at: string
          detected_at: string
          acknowledged_at: string | null
          resolved_at: string | null
          duration_seconds: number | null
          detection_delay_seconds: number | null
          root_cause: string | null
          resolution_summary: string | null
          affected_services: string[]
          notifications_sent: number
          last_notification_at: string | null
          public_visible: boolean
          public_message: string | null
          tags: string[]
          external_incident_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          monitor_id: string
          title: string
          description?: string | null
          status?: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved'
          severity?: 'minor' | 'major' | 'critical'
          started_at?: string
          detected_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          duration_seconds?: number | null
          detection_delay_seconds?: number | null
          root_cause?: string | null
          resolution_summary?: string | null
          affected_services?: string[]
          notifications_sent?: number
          last_notification_at?: string | null
          public_visible?: boolean
          public_message?: string | null
          tags?: string[]
          external_incident_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          monitor_id?: string
          title?: string
          description?: string | null
          status?: 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved'
          severity?: 'minor' | 'major' | 'critical'
          started_at?: string
          detected_at?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          duration_seconds?: number | null
          detection_delay_seconds?: number | null
          root_cause?: string | null
          resolution_summary?: string | null
          affected_services?: string[]
          notifications_sent?: number
          last_notification_at?: string | null
          public_visible?: boolean
          public_message?: string | null
          tags?: string[]
          external_incident_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      alert_settings: {
        Row: {
          id: string
          user_id: string
          monitor_id: string | null
          name: string
          description: string | null
          is_enabled: boolean
          events: ('monitor_down' | 'monitor_up' | 'ssl_expiry' | 'response_time' | 'status_change')[]
          channel: 'email' | 'sms' | 'webhook' | 'slack' | 'discord' | 'teams'
          channel_config: Json
          failure_threshold: number
          recovery_threshold: number
          response_time_threshold_ms: number | null
          frequency: 'immediate' | 'every_5min' | 'every_15min' | 'every_hour' | 'daily'
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          timezone: string
          max_alerts_per_hour: number
          last_alert_sent_at: string | null
          alerts_sent_count: number
          alerts_sent_hour: string | null
          ssl_expiry_days_warning: number | null
          escalation_delay_minutes: number | null
          escalation_enabled: boolean
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          monitor_id?: string | null
          name: string
          description?: string | null
          is_enabled?: boolean
          events?: ('monitor_down' | 'monitor_up' | 'ssl_expiry' | 'response_time' | 'status_change')[]
          channel: 'email' | 'sms' | 'webhook' | 'slack' | 'discord' | 'teams'
          channel_config?: Json
          failure_threshold?: number
          recovery_threshold?: number
          response_time_threshold_ms?: number | null
          frequency?: 'immediate' | 'every_5min' | 'every_15min' | 'every_hour' | 'daily'
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          max_alerts_per_hour?: number
          last_alert_sent_at?: string | null
          alerts_sent_count?: number
          alerts_sent_hour?: string | null
          ssl_expiry_days_warning?: number | null
          escalation_delay_minutes?: number | null
          escalation_enabled?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          monitor_id?: string | null
          name?: string
          description?: string | null
          is_enabled?: boolean
          events?: ('monitor_down' | 'monitor_up' | 'ssl_expiry' | 'response_time' | 'status_change')[]
          channel?: 'email' | 'sms' | 'webhook' | 'slack' | 'discord' | 'teams'
          channel_config?: Json
          failure_threshold?: number
          recovery_threshold?: number
          response_time_threshold_ms?: number | null
          frequency?: 'immediate' | 'every_5min' | 'every_15min' | 'every_hour' | 'daily'
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          timezone?: string
          max_alerts_per_hour?: number
          last_alert_sent_at?: string | null
          alerts_sent_count?: number
          alerts_sent_hour?: string | null
          ssl_expiry_days_warning?: number | null
          escalation_delay_minutes?: number | null
          escalation_enabled?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      status_pages: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          favicon_url: string | null
          theme: 'light' | 'dark' | 'auto'
          layout: 'minimal' | 'detailed' | 'compact'
          custom_css: string | null
          primary_color: string
          background_color: string
          text_color: string
          show_uptime_percentage: boolean
          show_response_times: boolean
          show_incident_history: boolean
          show_maintenance_banner: boolean
          uptime_days_to_show: number
          incident_days_to_show: number
          custom_domain: string | null
          custom_domain_verified: boolean
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          is_public: boolean
          password_protected: boolean
          password_hash: string | null
          maintenance_mode: boolean
          maintenance_message: string | null
          maintenance_scheduled_start: string | null
          maintenance_scheduled_end: string | null
          google_analytics_id: string | null
          enable_analytics: boolean
          allow_subscriptions: boolean
          webhook_url: string | null
          webhook_secret: string | null
          twitter_handle: string | null
          support_url: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          theme?: 'light' | 'dark' | 'auto'
          layout?: 'minimal' | 'detailed' | 'compact'
          custom_css?: string | null
          primary_color?: string
          background_color?: string
          text_color?: string
          show_uptime_percentage?: boolean
          show_response_times?: boolean
          show_incident_history?: boolean
          show_maintenance_banner?: boolean
          uptime_days_to_show?: number
          incident_days_to_show?: number
          custom_domain?: string | null
          custom_domain_verified?: boolean
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          is_public?: boolean
          password_protected?: boolean
          password_hash?: string | null
          maintenance_mode?: boolean
          maintenance_message?: string | null
          maintenance_scheduled_start?: string | null
          maintenance_scheduled_end?: string | null
          google_analytics_id?: string | null
          enable_analytics?: boolean
          allow_subscriptions?: boolean
          webhook_url?: string | null
          webhook_secret?: string | null
          twitter_handle?: string | null
          support_url?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          theme?: 'light' | 'dark' | 'auto'
          layout?: 'minimal' | 'detailed' | 'compact'
          custom_css?: string | null
          primary_color?: string
          background_color?: string
          text_color?: string
          show_uptime_percentage?: boolean
          show_response_times?: boolean
          show_incident_history?: boolean
          show_maintenance_banner?: boolean
          uptime_days_to_show?: number
          incident_days_to_show?: number
          custom_domain?: string | null
          custom_domain_verified?: boolean
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          is_public?: boolean
          password_protected?: boolean
          password_hash?: string | null
          maintenance_mode?: boolean
          maintenance_message?: string | null
          maintenance_scheduled_start?: string | null
          maintenance_scheduled_end?: string | null
          google_analytics_id?: string | null
          enable_analytics?: boolean
          allow_subscriptions?: boolean
          webhook_url?: string | null
          webhook_secret?: string | null
          twitter_handle?: string | null
          support_url?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      monitor_check_stats: {
        Row: {
          monitor_id: string | null
          monitor_name: string | null
          total_checks_24h: number | null
          successful_checks_24h: number | null
          uptime_24h: number | null
          avg_response_time_24h: number | null
          last_check_at: string | null
        }
      }
    }
    Functions: {
      cleanup_old_checks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      refresh_monitor_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          total_size: string
          index_size: string
          row_count: number
          seq_scans: number
          index_scans: number
        }[]
      }
    }
  }
}