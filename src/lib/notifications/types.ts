/**
 * Shared types for the multi-channel alert dispatcher.
 * One AlertContext is built per monitor event (down or recovery) and fanned
 * out to each channel handler.
 */

export interface AlertMonitor {
  id: string
  name: string
  url: string
  user_id: string
}

export interface AlertIncident {
  id: string
  title: string
  description: string
  started_at: string
  duration_seconds?: number
}

export type AlertEventType = 'monitor_down' | 'monitor_up'

export interface AlertContext {
  monitor: AlertMonitor
  incident: AlertIncident
  eventType: AlertEventType
  /** Pre-formatted human-readable downtime, only populated for monitor_up. */
  downtimeDuration?: string
  /** Pre-built dashboard URL for the monitor. */
  dashboardUrl: string
}

/** Subject + plain message used for alert_logs and as fallback for channels. */
export interface AlertContent {
  subject: string
  message: string
}

/** Result returned by every channel handler. */
export interface AlertChannelResult {
  /** sent | failed | rate_limited — written verbatim to alert_logs.status */
  status: 'sent' | 'failed' | 'rate_limited'
  externalId?: string | null
  error?: string
}
