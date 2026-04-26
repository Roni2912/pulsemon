/**
 * Email channel adapter. Looks up the user's email on profiles, renders the
 * appropriate React Email template, and sends through Resend.
 */

import { render } from '@react-email/components'
import { resend, EMAIL_FROM } from '@/lib/resend/client'
import { MonitorDownEmail, MonitorRecoveryEmail } from '@/lib/resend/templates'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import type { AlertChannelResult, AlertContent, AlertContext } from './types'

interface EmailConfig {
  /** Optional override email address. Falls back to the profile email. */
  to?: string
}

export async function sendEmailAlert(
  ctx: AlertContext,
  content: AlertContent,
  channelConfig: EmailConfig | null | undefined
): Promise<AlertChannelResult> {
  let recipient: string | undefined = channelConfig?.to

  if (!recipient) {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', ctx.monitor.user_id)
      .single()

    if (error || !profile?.email) {
      logger.warn('EMAIL_NO_RECIPIENT', {
        context: 'sendEmailAlert',
        monitorId: ctx.monitor.id,
        userId: ctx.monitor.user_id,
        reason: error?.message,
      })
      return { status: 'failed', error: 'no recipient email' }
    }
    recipient = profile.email
  }

  const isDown = ctx.eventType === 'monitor_down'

  const html = isDown
    ? render(
        MonitorDownEmail({
          monitorName: ctx.monitor.name,
          monitorUrl: ctx.monitor.url,
          errorMessage: ctx.incident.description,
          incidentTime: new Date(ctx.incident.started_at).toLocaleString(),
          dashboardUrl: ctx.dashboardUrl,
        })
      )
    : render(
        MonitorRecoveryEmail({
          monitorName: ctx.monitor.name,
          monitorUrl: ctx.monitor.url,
          downtimeDuration: ctx.downtimeDuration ?? 'unknown',
          recoveryTime: new Date().toLocaleString(),
          dashboardUrl: ctx.dashboardUrl,
        })
      )

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipient!,
      subject: content.subject,
      html,
    })

    if (error) {
      logger.error('EMAIL_ALERT_FAILED', {
        context: 'sendEmailAlert',
        monitorId: ctx.monitor.id,
        eventType: ctx.eventType,
        email: recipient,
        reason: error.message,
      })
      return { status: 'failed', error: error.message }
    }

    logger.info('EMAIL_ALERT_SENT', {
      context: 'sendEmailAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
      email: recipient,
      externalId: data?.id ?? undefined,
    })
    return { status: 'sent', externalId: data?.id ?? undefined }
  } catch (error: any) {
    logger.error('EMAIL_ALERT_EXCEPTION', {
      context: 'sendEmailAlert',
      monitorId: ctx.monitor.id,
      eventType: ctx.eventType,
      reason: error?.message,
    })
    return { status: 'failed', error: error?.message ?? 'email send threw' }
  }
}
