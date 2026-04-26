/**
 * Multi-channel alert dispatcher.
 *
 * For one monitor event (down/up), fan out across every active alert_settings
 * row that matches the user, the monitor (or global), and the event_type.
 * Each delivery attempt is gated by `should_send_alert` (rate limit + quiet
 * hours) and logged via `record_alert_sent` so alert_logs is the source of
 * truth for what actually went out.
 *
 * Why this lives here instead of in performMonitorCheck:
 *   - Keeps the cron path small and readable.
 *   - Lets manual incident transitions reuse the same fan-out later.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/lib/resend/client'
import { sendEmailAlert } from './email'
import { sendSlackAlert } from './slack'
import { sendWebhookAlert } from './webhook'
import type {
  AlertChannelResult,
  AlertContent,
  AlertContext,
  AlertEventType,
  AlertIncident,
  AlertMonitor,
} from './types'

interface DispatchInput {
  monitor: AlertMonitor
  incident: AlertIncident
  eventType: AlertEventType
  /** Pre-formatted human-readable downtime, only meaningful for monitor_up. */
  downtimeDuration?: string
}

export async function dispatchAlert(input: DispatchInput) {
  const { monitor, incident, eventType, downtimeDuration } = input

  const ctx: AlertContext = {
    monitor,
    incident,
    eventType,
    downtimeDuration,
    dashboardUrl: `${APP_URL}/monitors/${monitor.id}`,
  }

  const content: AlertContent = buildContent(ctx)

  const { data: settings, error } = await supabaseAdmin
    .from('alert_settings')
    .select('id, channel, channel_config, monitor_id, events')
    .eq('user_id', monitor.user_id)
    .eq('is_enabled', true)
    .or(`monitor_id.is.null,monitor_id.eq.${monitor.id}`)

  if (error) {
    logger.error('DISPATCH_SETTINGS_QUERY_FAILED', {
      context: 'dispatchAlert',
      monitorId: monitor.id,
      eventType,
      reason: error.message,
    })
    return { dispatched: 0, results: [] as AlertChannelResult[] }
  }

  const matching = (settings ?? []).filter((s) => Array.isArray(s.events) && s.events.includes(eventType))

  if (matching.length === 0) {
    logger.info('DISPATCH_NO_MATCHING_SETTINGS', {
      context: 'dispatchAlert',
      monitorId: monitor.id,
      userId: monitor.user_id,
      eventType,
    })
    return { dispatched: 0, results: [] as AlertChannelResult[] }
  }

  const results: AlertChannelResult[] = []
  let dispatched = 0

  for (const setting of matching) {
    // Per-setting gate: rate limit, frequency, quiet hours, hourly cap.
    const { data: shouldSend, error: gateError } = await supabaseAdmin.rpc('should_send_alert', {
      p_alert_setting_id: setting.id,
      p_event_type: eventType,
    })

    if (gateError) {
      logger.error('DISPATCH_GATE_FAILED', {
        context: 'dispatchAlert',
        monitorId: monitor.id,
        alertSettingId: setting.id,
        reason: gateError.message,
      })
      continue
    }

    if (!shouldSend) {
      logger.info('DISPATCH_GATED', {
        context: 'dispatchAlert',
        monitorId: monitor.id,
        alertSettingId: setting.id,
        channel: setting.channel,
        eventType,
      })
      await recordAlertLog(setting.id, monitor.id, eventType, setting.channel, content, {
        status: 'rate_limited',
      })
      results.push({ status: 'rate_limited' })
      continue
    }

    const channelResult = await deliver(setting.channel, ctx, content, setting.channel_config)
    results.push(channelResult)
    if (channelResult.status === 'sent') dispatched++

    await recordAlertLog(
      setting.id,
      monitor.id,
      eventType,
      setting.channel,
      content,
      channelResult
    )
  }

  logger.info('DISPATCH_COMPLETE', {
    context: 'dispatchAlert',
    monitorId: monitor.id,
    eventType,
    matched: matching.length,
    dispatched,
  })

  return { dispatched, results }
}

function buildContent(ctx: AlertContext): AlertContent {
  if (ctx.eventType === 'monitor_down') {
    return {
      subject: `🔴 ${ctx.monitor.name} is down`,
      message: ctx.incident.description || 'Monitor check failed',
    }
  }
  return {
    subject: `✅ ${ctx.monitor.name} has recovered`,
    message: ctx.downtimeDuration
      ? `Monitor recovered after ${ctx.downtimeDuration}`
      : 'Monitor recovered',
  }
}

async function deliver(
  channel: string,
  ctx: AlertContext,
  content: AlertContent,
  channelConfig: any
): Promise<AlertChannelResult> {
  switch (channel) {
    case 'email':
      return sendEmailAlert(ctx, content, channelConfig)
    case 'slack':
      return sendSlackAlert(ctx, content, channelConfig)
    case 'webhook':
      return sendWebhookAlert(ctx, content, channelConfig)
    default:
      logger.warn('DISPATCH_UNKNOWN_CHANNEL', {
        context: 'dispatchAlert',
        monitorId: ctx.monitor.id,
        channel,
      })
      return { status: 'failed', error: `unsupported channel: ${channel}` }
  }
}

async function recordAlertLog(
  alertSettingId: string,
  monitorId: string,
  eventType: AlertEventType,
  channel: string,
  content: AlertContent,
  result: AlertChannelResult
) {
  const { error } = await supabaseAdmin.rpc('record_alert_sent', {
    p_alert_setting_id: alertSettingId,
    p_monitor_id: monitorId,
    p_event_type: eventType,
    p_channel: channel,
    p_subject: content.subject,
    p_message: content.message,
    p_status: result.status,
    p_external_id: result.externalId ?? null,
  })

  if (error) {
    logger.error('ALERT_LOG_INSERT_FAILED', {
      context: 'recordAlertLog',
      alertSettingId,
      monitorId,
      channel,
      reason: error.message,
    })
  }
}
