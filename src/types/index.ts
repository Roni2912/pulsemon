import type { MonitorStatus, MonitorType, HttpMethod, PlanType } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan: PlanType;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: MonitorType;
  method: HttpMethod;
  interval: number; // in minutes
  timeout: number; // in milliseconds
  status: MonitorStatus;
  expected_status_code?: number;
  headers?: Record<string, string>;
  body?: string;
  last_checked_at?: string;
  last_status_change_at?: string;
  consecutive_failures: number;
  created_at: string;
  updated_at: string;
}

export interface Check {
  id: string;
  monitor_id: string;
  status: "up" | "down";
  response_time?: number; // in milliseconds
  status_code?: number;
  error_message?: string;
  checked_at: string;
}

export interface Incident {
  id: string;
  monitor_id: string;
  status: "ongoing" | "resolved";
  started_at: string;
  resolved_at?: string;
  cause?: string;
  duration?: number; // in milliseconds
}

export interface AlertSetting {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_address?: string;
  webhook_enabled: boolean;
  webhook_url?: string;
  slack_enabled: boolean;
  slack_webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StatusPage {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  custom_domain?: string;
  logo_url?: string;
  monitors: string[]; // Array of monitor IDs
  is_public: boolean;
  show_values: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitorWithChecks extends Monitor {
  checks: Check[];
  incidents: Incident[];
}

export interface MonitorStats {
  uptime_24h: number;
  uptime_7d: number;
  uptime_30d: number;
  avg_response_time_24h: number;
  total_checks_24h: number;
  total_incidents_30d: number;
}

export interface DashboardStats {
  total_monitors: number;
  monitors_up: number;
  monitors_down: number;
  monitors_paused: number;
  overall_uptime_24h: number;
  active_incidents: number;
}
