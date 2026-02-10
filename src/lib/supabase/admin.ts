/**
 * Supabase Admin Client
 * Purpose: Service role client for administrative operations and cron jobs
 * This client bypasses RLS and has full database access
 * Used for: Cron jobs, system operations, data migrations, monitoring checks
 * 
 * SECURITY WARNING: This client has full database access - use carefully!
 */

import { createClient } from '@supabase/supabase-js'

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
      console.error('Monitor not found or inactive:', monitorId)
      return { success: false, error: 'Monitor not found or inactive' }
    }

    // Perform the actual HTTP check
    const checkResult = await performHttpCheck(monitor)

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
      console.error('Error inserting check result:', insertError)
      return { success: false, error: 'Failed to record check result' }
    }

    // Update monitor status
    const wasUp = monitor.is_up
    const isNowUp = checkResult.success

    await supabaseAdmin
      .from('monitors')
      .update({
        is_up: isNowUp,
        last_checked_at: new Date().toISOString(),
        last_response_time_ms: checkResult.responseTime,
        last_status_code: checkResult.statusCode,
        last_error: checkResult.error,
        total_checks: (monitor.total_checks || 0) + 1,
        successful_checks: (monitor.successful_checks || 0) + (isNowUp ? 1 : 0),
      })
      .eq('id', monitorId)

    // Handle incident creation/resolution
    if (!isNowUp && wasUp !== false) {
      // Monitor just went down — create incident
      await supabaseAdmin
        .from('incidents')
        .insert({
          monitor_id: monitorId,
          title: `${monitor.name} is down`,
          description: checkResult.error || 'Monitor check failed',
          status: 'open',
          severity: 'major',
          started_at: new Date().toISOString(),
          detected_at: new Date().toISOString(),
        })
    } else if (isNowUp && wasUp === false) {
      // Monitor recovered — resolve open incidents
      const { data: openIncidents } = await supabaseAdmin
        .from('incidents')
        .select('id, started_at')
        .eq('monitor_id', monitorId)
        .in('status', ['open', 'investigating', 'identified', 'monitoring'])

      if (openIncidents && openIncidents.length > 0) {
        const now = new Date()
        for (const incident of openIncidents) {
          const startedAt = new Date(incident.started_at)
          const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)

          await supabaseAdmin
            .from('incidents')
            .update({
              status: 'resolved',
              resolved_at: now.toISOString(),
              duration_seconds: durationSeconds,
              resolution_summary: 'Monitor recovered automatically',
            })
            .eq('id', incident.id)
        }
      }
    }

    return { success: true, result: checkResult }

  } catch (error) {
    console.error('Error in performMonitorCheck:', error)
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
    console.error('Error getting monitors to check:', error)
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
    console.log(`Cleaned up ${deletedCount} old check records`)
    return { success: true, deletedCount }
  } catch (error) {
    console.error('Error cleaning up old checks:', error)
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
    console.log('Refreshed materialized views')
    return { success: true }
  } catch (error) {
    console.error('Error refreshing materialized views:', error)
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
  } catch (error) {
    console.error('Error getting system health:', error)
    return { success: false, error }
  }
}

// Type exports
export type AdminSupabaseClient = typeof supabaseAdmin