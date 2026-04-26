/**
 * Status-page subscriber notifications: confirmation emails on signup,
 * incident broadcasts on monitor down/recovery.
 */

import crypto from 'node:crypto'
import { resend, EMAIL_FROM, APP_URL } from '@/lib/resend/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { AlertEventType } from './types'

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

interface ConfirmationPayload {
  email: string
  pageName: string
  pageSlug: string
  confirmationToken: string
}

export async function sendConfirmationEmail(payload: ConfirmationPayload) {
  const confirmUrl = `${APP_URL}/api/status/subscribe/confirm?token=${payload.confirmationToken}`
  const html = renderSimpleEmail({
    heading: `Confirm your subscription to ${payload.pageName}`,
    body: `Click the button below to start receiving status updates for ${payload.pageName}. If this wasn't you, ignore this email.`,
    cta: { label: 'Confirm subscription', href: confirmUrl },
    footer: `If the button doesn't work, copy this link: ${confirmUrl}`,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: payload.email,
      subject: `Confirm your subscription to ${payload.pageName}`,
      html,
    })
    if (error) {
      logger.error('SUBSCRIBER_CONFIRM_EMAIL_FAILED', {
        context: 'sendConfirmationEmail',
        pageSlug: payload.pageSlug,
        email: payload.email,
        reason: error.message,
      })
      return { ok: false, error: error.message }
    }
    logger.info('SUBSCRIBER_CONFIRM_EMAIL_SENT', {
      context: 'sendConfirmationEmail',
      pageSlug: payload.pageSlug,
      email: payload.email,
      externalId: data?.id ?? undefined,
    })
    return { ok: true }
  } catch (e: any) {
    logger.error('SUBSCRIBER_CONFIRM_EMAIL_EXCEPTION', {
      context: 'sendConfirmationEmail',
      pageSlug: payload.pageSlug,
      email: payload.email,
      reason: e?.message,
    })
    return { ok: false, error: e?.message ?? 'send threw' }
  }
}

interface IncidentNotifyInput {
  monitorId: string
  monitorName: string
  incidentId: string
  incidentTitle: string
  publicMessage?: string | null
  eventType: AlertEventType
  durationDescription?: string
}

/**
 * Fan out an incident open/resolve to confirmed subscribers of every status
 * page that includes this monitor and has notify_incidents=true.
 */
export async function notifySubscribers(input: IncidentNotifyInput) {
  const { data: links, error: linkErr } = await supabaseAdmin
    .from('status_page_monitors')
    .select('status_page_id, status_pages!inner(id, slug, name, allow_subscriptions, is_public)')
    .eq('monitor_id', input.monitorId)

  if (linkErr) {
    logger.error('SUBSCRIBER_PAGE_LOOKUP_FAILED', {
      context: 'notifySubscribers',
      monitorId: input.monitorId,
      reason: linkErr.message,
    })
    return { delivered: 0 }
  }

  let delivered = 0

  for (const link of links ?? []) {
    const page: any = (link as any).status_pages
    if (!page?.is_public || !page?.allow_subscriptions) continue

    const { data: subs, error: subErr } = await supabaseAdmin
      .from('status_page_subscribers')
      .select('id, email, unsubscribe_token')
      .eq('status_page_id', page.id)
      .eq('confirmed', true)
      .eq('unsubscribed', false)
      .eq('notify_incidents', true)

    if (subErr) {
      logger.error('SUBSCRIBER_LOOKUP_FAILED', {
        context: 'notifySubscribers',
        statusPageId: page.id,
        reason: subErr.message,
      })
      continue
    }

    for (const sub of subs ?? []) {
      const sent = await sendIncidentEmail(sub.email, sub.unsubscribe_token, page, input)
      if (sent) delivered++
    }
  }

  logger.info('SUBSCRIBER_NOTIFY_COMPLETE', {
    context: 'notifySubscribers',
    monitorId: input.monitorId,
    incidentId: input.incidentId,
    eventType: input.eventType,
    delivered,
  })

  return { delivered }
}

async function sendIncidentEmail(
  email: string,
  unsubToken: string | null,
  page: { name: string; slug: string },
  input: IncidentNotifyInput
): Promise<boolean> {
  const isDown = input.eventType === 'monitor_down'
  const subject = isDown
    ? `[${page.name}] Incident: ${input.monitorName}`
    : `[${page.name}] Resolved: ${input.monitorName}`

  const statusLine = isDown
    ? `${input.monitorName} is currently experiencing issues.`
    : input.durationDescription
      ? `${input.monitorName} has recovered after ${input.durationDescription}.`
      : `${input.monitorName} has recovered.`

  const html = renderSimpleEmail({
    heading: subject,
    body: [
      statusLine,
      input.publicMessage ? `\n\nUpdate: ${input.publicMessage}` : '',
    ].join(''),
    cta: { label: 'View status page', href: `${APP_URL}/status/${page.slug}` },
    footer: unsubToken
      ? `Unsubscribe: ${APP_URL}/api/status/subscribe/unsubscribe?token=${unsubToken}`
      : '',
  })

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    })
    if (error) {
      logger.error('SUBSCRIBER_INCIDENT_EMAIL_FAILED', {
        context: 'sendIncidentEmail',
        pageSlug: page.slug,
        incidentId: input.incidentId,
        email,
        reason: error.message,
      })
      return false
    }
    logger.info('SUBSCRIBER_INCIDENT_EMAIL_SENT', {
      context: 'sendIncidentEmail',
      pageSlug: page.slug,
      incidentId: input.incidentId,
      email,
      externalId: data?.id ?? undefined,
    })
    return true
  } catch (e: any) {
    logger.error('SUBSCRIBER_INCIDENT_EMAIL_EXCEPTION', {
      context: 'sendIncidentEmail',
      pageSlug: page.slug,
      incidentId: input.incidentId,
      email,
      reason: e?.message,
    })
    return false
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  )
}

function renderSimpleEmail(args: {
  heading: string
  body: string
  cta: { label: string; href: string }
  footer: string
}): string {
  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,sans-serif;background:#f5f5f5;padding:24px;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
    <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(args.heading)}</h1>
    <p style="line-height:1.5;white-space:pre-wrap">${escapeHtml(args.body)}</p>
    <p style="margin:24px 0">
      <a href="${args.cta.href}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${escapeHtml(args.cta.label)}</a>
    </p>
    ${args.footer ? `<p style="font-size:12px;color:#666;border-top:1px solid #eee;padding-top:16px">${escapeHtml(args.footer)}</p>` : ''}
  </div>
</body></html>`
}
