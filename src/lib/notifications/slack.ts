/**
 * Slack incoming-webhook alert channel.
 * `channelConfig.webhook_url` is required. Optional `channelConfig.channel`
 * (e.g. "#alerts") overrides the workspace default.
 */

import { logger } from '@/lib/logger'
import type { AlertChannelResult, AlertContent, AlertContext } from './types'

interface SlackConfig {
  webhook_url?: string
  channel?: string
  username?: string
}

export async function sendSlackAlert(
  ctx: AlertContext,
  content: AlertContent,
  channelConfig: SlackConfig | null | undefined
): Promise<AlertChannelResult> {
  const webhookUrl = channelConfig?.webhook_url
  if (!webhookUrl) {
    logger.warn('SLACK_WEBHOOK_MISSING', {
      context: 'sendSlackAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
    })
    return { status: 'failed', error: 'Slack webhook_url missing in channel_config' }
  }

  const isDown = ctx.eventType === 'monitor_down'
  const color = isDown ? '#dc2626' : '#16a34a'
  const headline = isDown
    ? `🔴 ${ctx.monitor.name} is down`
    : `✅ ${ctx.monitor.name} has recovered`

  const fields: { title: string; value: string; short: boolean }[] = [
    { title: 'URL', value: ctx.monitor.url, short: false },
  ]
  if (isDown) {
    fields.push({ title: 'Error', value: ctx.incident.description || 'Check failed', short: false })
    fields.push({ title: 'Started', value: new Date(ctx.incident.started_at).toUTCString(), short: true })
  } else if (ctx.downtimeDuration) {
    fields.push({ title: 'Downtime', value: ctx.downtimeDuration, short: true })
  }

  const payload = {
    channel: channelConfig?.channel,
    username: channelConfig?.username ?? 'PulseMon',
    text: headline,
    attachments: [
      {
        color,
        fallback: content.message,
        title: headline,
        title_link: ctx.dashboardUrl,
        fields,
        footer: 'PulseMon',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      logger.error('SLACK_ALERT_FAILED', {
        context: 'sendSlackAlert',
        monitorId: ctx.monitor.id,
        eventType: ctx.eventType,
        statusCode: response.status,
        reason: body.slice(0, 200),
      })
      return { status: 'failed', error: `Slack ${response.status}: ${body.slice(0, 100)}` }
    }

    logger.info('SLACK_ALERT_SENT', {
      context: 'sendSlackAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
    })
    return { status: 'sent' }
  } catch (error: any) {
    logger.error('SLACK_ALERT_EXCEPTION', {
      context: 'sendSlackAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
      reason: error?.message,
    })
    return { status: 'failed', error: error?.message ?? 'Slack send threw' }
  }
}
