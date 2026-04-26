/**
 * Generic outgoing-webhook channel. Posts a stable JSON envelope to a URL the
 * user controls. Optional HMAC-SHA256 signature when channel_config.secret is set.
 */

import crypto from 'node:crypto'
import { logger } from '@/lib/logger'
import type { AlertChannelResult, AlertContent, AlertContext } from './types'

interface WebhookConfig {
  url?: string
  secret?: string
  /** Optional extra headers (e.g. for an Authorization token). */
  headers?: Record<string, string>
}

const DEFAULT_TIMEOUT_MS = 10_000

export async function sendWebhookAlert(
  ctx: AlertContext,
  content: AlertContent,
  channelConfig: WebhookConfig | null | undefined
): Promise<AlertChannelResult> {
  const url = channelConfig?.url
  if (!url) {
    logger.warn('WEBHOOK_URL_MISSING', {
      context: 'sendWebhookAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
    })
    return { status: 'failed', error: 'webhook url missing in channel_config' }
  }

  const body = JSON.stringify({
    event: ctx.eventType,
    delivered_at: new Date().toISOString(),
    monitor: {
      id: ctx.monitor.id,
      name: ctx.monitor.name,
      url: ctx.monitor.url,
    },
    incident: {
      id: ctx.incident.id,
      title: ctx.incident.title,
      description: ctx.incident.description,
      started_at: ctx.incident.started_at,
      duration_seconds: ctx.incident.duration_seconds ?? null,
    },
    subject: content.subject,
    message: content.message,
    dashboard_url: ctx.dashboardUrl,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'PulseMon-Webhook/1.0',
    ...(channelConfig?.headers ?? {}),
  }

  if (channelConfig?.secret) {
    const signature = crypto
      .createHmac('sha256', channelConfig.secret)
      .update(body)
      .digest('hex')
    headers['X-PulseMon-Signature'] = `sha256=${signature}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      logger.error('WEBHOOK_ALERT_FAILED', {
        context: 'sendWebhookAlert',
        monitorId: ctx.monitor.id,
        eventType: ctx.eventType,
        statusCode: response.status,
        reason: responseBody.slice(0, 200),
      })
      return { status: 'failed', error: `Webhook ${response.status}` }
    }

    logger.info('WEBHOOK_ALERT_SENT', {
      context: 'sendWebhookAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
      statusCode: response.status,
    })
    return { status: 'sent' }
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError'
    logger.error(isAbort ? 'WEBHOOK_ALERT_TIMEOUT' : 'WEBHOOK_ALERT_EXCEPTION', {
      context: 'sendWebhookAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
      reason: error?.message,
    })
    return { status: 'failed', error: isAbort ? 'webhook timeout' : error?.message ?? 'webhook send threw' }
  } finally {
    clearTimeout(timeout)
  }
}
