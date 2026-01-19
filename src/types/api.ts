import type { Monitor, Check, Incident, StatusPage, AlertSetting, MonitorStats, DashboardStats } from "./index";

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Monitor API Types
export interface CreateMonitorRequest {
  name: string;
  url: string;
  type?: "http" | "https" | "tcp" | "ping";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  interval?: number;
  timeout?: number;
  expected_status_code?: number;
  headers?: Record<string, string>;
  body?: string;
}

export interface UpdateMonitorRequest extends Partial<CreateMonitorRequest> {
  status?: "up" | "down" | "paused" | "pending";
}

export interface MonitorResponse extends ApiResponse<Monitor> {}
export interface MonitorsResponse extends ApiResponse<Monitor[]> {}
export interface MonitorStatsResponse extends ApiResponse<MonitorStats> {}

// Check API Types
export interface ChecksResponse extends PaginatedResponse<Check> {}

// Incident API Types
export interface IncidentsResponse extends PaginatedResponse<Incident> {}

// Status Page API Types
export interface CreateStatusPageRequest {
  name: string;
  slug: string;
  description?: string;
  monitors: string[];
  is_public?: boolean;
  show_values?: boolean;
}

export interface UpdateStatusPageRequest extends Partial<CreateStatusPageRequest> {}

export interface StatusPageResponse extends ApiResponse<StatusPage> {}
export interface StatusPagesResponse extends ApiResponse<StatusPage[]> {}

// Alert Settings API Types
export interface UpdateAlertSettingsRequest {
  email_enabled?: boolean;
  email_address?: string;
  webhook_enabled?: boolean;
  webhook_url?: string;
  slack_enabled?: boolean;
  slack_webhook_url?: string;
}

export interface AlertSettingsResponse extends ApiResponse<AlertSetting> {}

// Dashboard API Types
export interface DashboardStatsResponse extends ApiResponse<DashboardStats> {}

// Billing API Types
export interface CheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse extends ApiResponse<{ url: string }> {}

export interface PortalSessionResponse extends ApiResponse<{ url: string }> {}

// Public Status Page Types
export interface PublicStatusPageData {
  statusPage: StatusPage;
  monitors: Array<{
    id: string;
    name: string;
    status: "up" | "down" | "paused";
    uptime_24h: number;
    uptime_7d: number;
    last_checked_at?: string;
    checks: Array<{
      status: "up" | "down";
      checked_at: string;
    }>;
  }>;
  overall_status: "operational" | "degraded" | "down";
}

export interface PublicStatusPageResponse extends ApiResponse<PublicStatusPageData> {}
