/**
 * Supabase Admin Client
 * Purpose: Service role client for administrative operations and cron jobs
 * This client bypasses RLS and has full database access
 * Used for: Cron jobs, system operations, data migrations, monitoring checks
 * 
 * SECURITY WARNING: This client has full database access - use carefully!
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Number of consecutive failures/successes required to flip incident state.
// Matches the DB trigger `handle_incident_detection` in 00003_create_checks.sql,
// and the default `failure_threshold` / `recovery_threshold` in alert_settings.
// Keep these in sync — drift caused incidents to fire on the very first failure.
const DEFAULT_FAILURE_THRESHOLD = 3
const DEFAULT_RECOVERY_THRESHOLD = 3

/**
 * Count consecutive matching statuses from the most recent check downward.
 * Returns how many of the last N checks share the same `success/!success` outcome.
 */
async function countConsecutiveStatus(
  monitorId: string,
  wantSuccess: boolean,
  limit: number
): Promise<number> {
  const { data: rows, error } = await supabaseAdmin
    .from('checks')
    .select('status')
    .eq('monitor_id', monitorId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('CONSECUTIVE_STATUS_QUERY_FAILED', {
      context: 'countConsecutiveStatus',
      monitorId,
      reason: error.message,
    })
    return 0
  }

  let count = 0
  for (const row of rows || []) {
    const isSuccess = row.status === 'success'
    if (isSuccess === wantSuccess) count++
    else break
  }
  return count
}

/**
 * Resolve thresholds from alert_settings if the user has overrides; otherwise defaults.
 * Returns the most-specific setting first (per-monitor before global).
 */
async function getThresholds(userId: string, monitorId: string) {
  const { data: settings, error } = await supabaseAdmin
    .from('alert_settings')
    .select('failure_threshold,recovery_threshold,monitor_id')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .or(`monitor_id.is.null,monitor_id.eq.${monitorId}`)
    .order('monitor_id', { ascending: false, nullsFirst: false })
    .limit(1)

  if (error) {
    logger.warn('THRESHOLDS_QUERY_FAILED', {
      context: 'getThresholds',
      monitorId,
      reason: error.message,
    })
  }

  const setting = settings?.[0]
  return {
    failureThreshold: setting?.failure_threshold ?? DEFAULT_FAILURE_THRESHOLD,
    recoveryThreshold: setting?.recovery_threshold ?? DEFAULT_RECOVERY_THRESHOLD,
  }
}

/**
 * Perform a website check and record the result
 * This function is called by the cron job to check monitor status
 */
export async function performMonitorCheck(monitorId: string) {
  try {
    // Get monitor configuration
    const { data: monitor, error: monitorError } = await supabaseAdmin
      .from('monitors')
      .select('*')
      .eq('id', monitorId)
      .eq('status', 'active')
      .single()

    if (monitorError || !monitor) {
      logger.warn('MONITOR_NOT_FOUND', { context: 'performMonitorCheck', monitorId, reason: monitorError?.message })
      return { success: false, error: 'Monitor not found or inactive' }
    }

    // Perform the actual HTTP check
    const checkResult = await performHttpCheck(monitor)
    logger.info('CHECK_PERFORMED', {
      context: 'performMonitorCheck',
      monitorId,
      success: checkResult.success,
      statusCode: checkResult.statusCode ?? undefined,
      responseTimeMs: checkResult.responseTime ?? undefined,
      errorType: checkResult.errorType ?? undefined,
    })

    // Record the check result
    const { error: insertError } = await supabaseAdmin
      .from('checks')
      .insert({
        monitor_id: monitorId,
        status: checkResult.success ? 'success' : 'failure',
        response_time_ms: checkResult.responseTime,
        status_code: checkResult.statusCode,
        error_message: checkResult.error,
        error_type: checkResult.errorType,
        ssl_valid: checkResult.sslValid,
        ssl_expires_at: checkResult.sslExpiresAt,
        content_matched: checkResult.contentMatched,
        ip_address: checkResult.ipAddress,
        dns_time_ms: checkResult.dnsTime,
        connect_time_ms: checkResult.connectTime,
        tls_time_ms: checkResult.tlsTime
      })

    if (insertError) {
      logger.error('CHECK_INSERT_FAILED', { context: 'performMonitorCheck', monitorId, reason: insertError.message })
      return { success: false, error: 'Failed to record check result' }
    }

    // Monitor stats (is_up, last_checked_at, total_checks, etc.) are updated
    // automatically by the DB trigger `checks_update_monitor_stats` on check insert.

    // Re-read monitor to see post-trigger state (current_incident_id may have changed).
    const { data: freshMonitor } = await supabaseAdmin
      .from('monitors')
      .select('id, name, url, user_id, current_incident_id, downtime_started_at, is_up')
      .eq('id', monitorId)
      .single()

    const monitorState = freshMonitor ?? monitor
    const isNowUp = checkResult.success
    const { failureThreshold, recoveryThreshold } = await getThresholds(monitor.user_id, monitorId)

    if (!isNowUp) {
      // Failure path — only create an incident if we've crossed the failure threshold
      // and there is no open incident already.
      if (monitorState.current_incident_id) {
        logger.info('INCIDENT_ALREADY_OPEN', {
          context: 'performMonitorCheck',
          monitorId,
          incidentId: monitorState.current_incident_id,
        })
      } else {
        const consecutiveFailures = await countConsecutiveStatus(monitorId, false, failureThreshold)

        if (consecutiveFailures < failureThreshold) {
          logger.info('FAILURE_BELOW_THRESHOLD', {
            context: 'performMonitorCheck',
            monitorId,
            consecutiveFailures,
            failureThreshold,
          })
        } else {
          const { data: newIncident, error: incidentError } = await supabaseAdmin
            .from('incidents')
            .insert({
              monitor_id: monitorId,
              title: `${monitor.name} is down`,
              description: checkResult.error || 'Monitor check failed',
              status: 'open',
              severity: 'major',
              started_at: monitorState.downtime_started_at ?? new Date().toISOString(),
              detected_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (incidentError || !newIncident) {
            logger.error('INCIDENT_CREATE_FAILED', {
              context: 'performMonitorCheck',
              monitorId,
              reason: incidentError?.message,
            })
          } else {
            logger.info('INCIDENT_OPENED', {
              context: 'performMonitorCheck',
              monitorId,
              incidentId: newIncident.id,
              consecutiveFailures,
            })

            try {
              const { dispatchAlert } = await import('@/lib/notifications/dispatch')
              await dispatchAlert({
                monitor: { id: monitor.id, name: monitor.name, url: monitor.url, user_id: monitor.user_id },
                incident: {
                  id: newIncident.id,
                  title: newIncident.title,
                  description: newIncident.description ?? '',
                  started_at: newIncident.started_at,
                },
                eventType: 'monitor_down',
              })
            } catch (error: any) {
              logger.error('DOWN_ALERT_DISPATCH_FAILED', {
                context: 'performMonitorCheck',
                monitorId,
                incidentId: newIncident.id,
                reason: error?.message,
              })
            }
          }
        }
      }
    } else {
      // Success path — only resolve open incidents after the recovery threshold is met.
      if (!monitorState.current_incident_id) {
        // Nothing to resolve.
      } else {
        const consecutiveSuccesses = await countConsecutiveStatus(monitorId, true, recoveryThreshold)

        if (consecutiveSuccesses < recoveryThreshold) {
          logger.info('RECOVERY_BELOW_THRESHOLD', {
            context: 'performMonitorCheck',
            monitorId,
            incidentId: monitorState.current_incident_id,
            consecutiveSuccesses,
            recoveryThreshold,
          })
        } else {
          const { data: openIncidents, error: openError } = await supabaseAdmin
            .from('incidents')
            .select('id, started_at')
            .eq('monitor_id', monitorId)
            .in('status', ['open', 'investigating', 'identified', 'monitoring'])

          if (openError) {
            logger.error('OPEN_INCIDENTS_QUERY_FAILED', {
              context: 'performMonitorCheck',
              monitorId,
              reason: openError.message,
            })
          }

          for (const incident of openIncidents ?? []) {
            const now = new Date()
            const startedAt = new Date(incident.started_at)
            const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)

            const { error: resolveError } = await supabaseAdmin
              .from('incidents')
              .update({
                status: 'resolved',
                resolved_at: now.toISOString(),
                duration_seconds: durationSeconds,
                resolution_summary: 'Monitor recovered automatically',
              })
              .eq('id', incident.id)

            if (resolveError) {
              logger.error('INCIDENT_RESOLVE_FAILED', {
                context: 'performMonitorCheck',
                monitorId,
                incidentId: incident.id,
                reason: resolveError.message,
              })
              continue
            }

            logger.info('INCIDENT_RESOLVED', {
              context: 'performMonitorCheck',
              monitorId,
              incidentId: incident.id,
              durationSeconds,
              consecutiveSuccesses,
            })

            try {
              const { dispatchAlert } = await import('@/lib/notifications/dispatch')
              const { formatDuration } = await import('@/lib/notifications/format')
              await dispatchAlert({
                monitor: { id: monitor.id, name: monitor.name, url: monitor.url, user_id: monitor.user_id },
                incident: {
                  id: incident.id,
                  title: `${monitor.name} recovered`,
                  description: 'Monitor recovered automatically',
                  started_at: incident.started_at,
                  duration_seconds: durationSeconds,
                },
                eventType: 'monitor_up',
                downtimeDuration: formatDuration(durationSeconds),
              })
            } catch (error: any) {
              logger.error('RECOVERY_ALERT_DISPATCH_FAILED', {
                context: 'performMonitorCheck',
                monitorId,
                incidentId: incident.id,
                reason: error?.message,
              })
            }
          }
        }
      }
    }

    return { success: true, result: checkResult }

  } catch (error: any) {
    logger.error('MONITOR_CHECK_FAILED', { context: 'performMonitorCheck', monitorId, reason: error?.message })
    return { success: false, error: 'Unexpected error during check' }
  }
}

/**
 * Perform HTTP check on a monitor
 * Returns detailed check results including timing and SSL information
 */
async function performHttpCheck(monitor: any) {
  const startTime = Date.now()
  let dnsTime = 0
  let connectTime = 0
  let tlsTime = 0

  try {
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), monitor.timeout_seconds * 1000)

    // Perform the HTTP request
    const response = await fetch(monitor.url, {
      method: monitor.method || 'GET',
      headers: {
        'User-Agent': 'UptimeMonitor/1.0',
        ...monitor.headers
      },
      body: monitor.method !== 'GET' ? monitor.body : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Check if status code is expected
    const expectedCodes = monitor.expected_status_codes || [200]
    const statusCodeValid = expectedCodes.includes(response.status)

    // Check response content if specified
    let contentMatched = null
    if (monitor.expected_content) {
      const responseText = await response.text()
      contentMatched = responseText.includes(monitor.expected_content)
    }

    // Check SSL certificate (for HTTPS)
    let sslValid = null
    let sslExpiresAt = null
    if (monitor.url.startsWith('https://') && monitor.check_ssl) {
      // Note: In a real implementation, you'd need to use a library like 'tls' 
      // to get SSL certificate information. For now, we'll assume SSL is valid
      // if the HTTPS request succeeded.
      sslValid = response.ok
    }

    return {
      success: statusCodeValid && (contentMatched === null || contentMatched),
      responseTime,
      statusCode: response.status,
      error: statusCodeValid ? null : `Unexpected status code: ${response.status}`,
      errorType: statusCodeValid ? null : 'http',
      sslValid,
      sslExpiresAt,
      contentMatched,
      ipAddress: null, // Would need additional DNS lookup
      dnsTime,
      connectTime,
      tlsTime
    }

  } catch (error: any) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    let errorType = 'unknown'
    let errorMessage = error.message

    if (error.name === 'AbortError') {
      errorType = 'timeout'
      errorMessage = `Request timed out after ${monitor.timeout_seconds} seconds`
    } else if (error.code === 'ENOTFOUND') {
      errorType = 'dns_error'
      errorMessage = 'DNS resolution failed'
    } else if (error.code === 'ECONNREFUSED') {
      errorType = 'connection_error'
      errorMessage = 'Connection refused'
    }

    return {
      success: false,
      responseTime,
      statusCode: null,
      error: errorMessage,
      errorType,
      sslValid: null,
      sslExpiresAt: null,
      contentMatched: null,
      ipAddress: null,
      dnsTime,
      connectTime,
      tlsTime
    }
  }
}

/**
 * Get monitors that need to be checked
 * Returns monitors where last_checked_at + interval_seconds <= now
 */
export async function getMonitorsToCheck() {
  const { data: monitors, error } = await supabaseAdmin
    .from('monitors')
    .select('id, name, url, interval_seconds, last_checked_at')
    .eq('status', 'active')
    .or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 60000).toISOString()}`)

  if (error) {
    logger.error('GET_MONITORS_FAILED', { context: 'getMonitorsToCheck', reason: error.message })
    return []
  }

  // Filter monitors that are due for checking
  const now = Date.now()
  return monitors.filter((monitor: any) => {
    if (!monitor.last_checked_at) return true
    
    const lastCheck = new Date(monitor.last_checked_at).getTime()
    const intervalMs = monitor.interval_seconds * 1000
    
    return (now - lastCheck) >= intervalMs
  })
}

/**
 * Clean up old check records based on user plan
 * Called periodically to maintain database size
 */
export async function cleanupOldChecks() {
  try {
    const deletedCount = await supabaseAdmin.rpc('cleanup_old_checks')
    logger.info('CLEANUP_COMPLETE', { context: 'cleanupOldChecks', reason: `${deletedCount} records removed` })
    return { success: true, deletedCount }
  } catch (error: any) {
    logger.error('CLEANUP_FAILED', { context: 'cleanupOldChecks', reason: error?.message })
    return { success: false, error }
  }
}

/**
 * Refresh materialized views for performance
 * Called hourly to update statistics
 */
export async function refreshMaterializedViews() {
  try {
    await supabaseAdmin.rpc('refresh_monitor_stats')
    logger.info('VIEWS_REFRESHED', { context: 'refreshMaterializedViews' })
    return { success: true }
  } catch (error: any) {
    logger.error('VIEWS_REFRESH_FAILED', { context: 'refreshMaterializedViews', reason: error?.message })
    return { success: false, error }
  }
}

/**
 * Get system health metrics
 * Used for monitoring the monitoring system itself
 */
export async function getSystemHealth() {
  try {
    // Get basic metrics
    const { data: metrics, error } = await supabaseAdmin.rpc('get_performance_metrics')
    
    if (error) {
      throw error
    }

    // Get recent check statistics
    const { data: recentChecks, error: checksError } = await supabaseAdmin
      .from('checks')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    
    if (checksError) {
      throw checksError
    }

    const totalChecks = recentChecks.length
    const successfulChecks = recentChecks.filter(c => c.status === 'success').length
    const systemUptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100

    return {
      success: true,
      metrics: {
        systemUptime: Math.round(systemUptime * 100) / 100,
        checksLastHour: totalChecks,
        successfulChecksLastHour: successfulChecks,
        databaseMetrics: metrics
      }
    }
  } catch (error: any) {
    logger.error('SYSTEM_HEALTH_FAILED', { context: 'getSystemHealth', reason: error?.message })
    return { success: false, error }
  }
}

// Type exports
export type AdminSupabaseClient = typeof supabaseAdmin