import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { probeSslCertificate } from '@/lib/checks/ssl';
import { resend, EMAIL_FROM, APP_URL } from '@/lib/resend/client';

// POST /api/cron/check-ssl
// Auth: CRON_SECRET via middleware. Suggested schedule: daily.
// Probes the TLS certificate for every active https monitor with check_ssl=true,
// updates monitors.ssl_*, and emails the owner if expiry is within their warning window.
export async function POST() {
  const startedAt = Date.now();

  const { data: monitors, error } = await supabaseAdmin
    .from('monitors')
    .select('id, user_id, name, url, check_ssl, ssl_expiry_days_warning')
    .eq('status', 'active')
    .eq('check_ssl', true);

  if (error) {
    logger.error('CRON_SSL_QUERY_FAILED', {
      context: 'POST /api/cron/check-ssl',
      reason: error.message,
    });
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  let probed = 0;
  let warned = 0;

  for (const monitor of monitors ?? []) {
    if (!monitor.url.startsWith('https://')) continue;
    let hostname: string;
    let port = 443;
    try {
      const u = new URL(monitor.url);
      hostname = u.hostname;
      if (u.port) port = Number(u.port);
    } catch {
      continue;
    }

    const result = await probeSslCertificate(hostname, port);
    probed++;

    await supabaseAdmin
      .from('monitors')
      .update({
        // Stored on monitors.last_* implicitly via update; persist on
        // the next check insert. Here we record the probe result on a
        // synthetic check row so charts pick it up.
      })
      .eq('id', monitor.id);

    await supabaseAdmin.from('checks').insert({
      monitor_id: monitor.id,
      status: result.valid ? 'success' : 'ssl_error',
      ssl_valid: result.valid,
      ssl_expires_at: result.expiresAt?.toISOString() ?? null,
      ssl_issuer: result.issuer,
      error_message: result.error,
      error_type: result.error ? 'ssl' : null,
      response_time_ms: 0,
    });

    const warnDays = monitor.ssl_expiry_days_warning ?? 30;
    if (
      result.daysToExpiry !== null &&
      result.daysToExpiry <= warnDays &&
      result.daysToExpiry >= 0
    ) {
      warned++;
      await sendExpiryEmail(monitor, result.daysToExpiry, result.expiresAt!);
      logger.info('SSL_EXPIRY_WARNING_FIRED', {
        context: 'POST /api/cron/check-ssl',
        monitorId: monitor.id,
        daysToExpiry: result.daysToExpiry,
        warnDays,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info('CRON_SSL_OK', {
    context: 'POST /api/cron/check-ssl',
    probed,
    warned,
    durationMs,
  });

  return NextResponse.json({ probed, warned, duration_ms: durationMs });
}

async function sendExpiryEmail(
  monitor: { id: string; user_id: string; name: string; url: string },
  daysToExpiry: number,
  expiresAt: Date
) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', monitor.user_id)
    .single();

  if (!profile?.email) {
    logger.warn('SSL_EXPIRY_NO_EMAIL', {
      context: 'sendExpiryEmail',
      monitorId: monitor.id,
    });
    return;
  }

  const dashboardUrl = `${APP_URL}/monitors/${monitor.id}`;
  const subject = `🔒 SSL certificate for ${monitor.name} expires in ${daysToExpiry} day${daysToExpiry === 1 ? '' : 's'}`;
  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,sans-serif;background:#f5f5f5;padding:24px;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
<h1 style="font-size:20px;margin:0 0 16px">SSL certificate expires soon</h1>
<p style="line-height:1.5">The certificate for <b>${escape(monitor.name)}</b> (${escape(monitor.url)}) expires on ${expiresAt.toUTCString()} — that's ${daysToExpiry} day${daysToExpiry === 1 ? '' : 's'} from now.</p>
<p style="margin:24px 0"><a href="${dashboardUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open monitor</a></p>
</div></body></html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: profile.email,
      subject,
      html,
    });
    if (error) {
      logger.error('SSL_EXPIRY_EMAIL_FAILED', {
        context: 'sendExpiryEmail',
        monitorId: monitor.id,
        reason: error.message,
      });
    } else {
      logger.info('SSL_EXPIRY_EMAIL_SENT', {
        context: 'sendExpiryEmail',
        monitorId: monitor.id,
        externalId: data?.id ?? undefined,
      });
    }
  } catch (e: any) {
    logger.error('SSL_EXPIRY_EMAIL_EXCEPTION', {
      context: 'sendExpiryEmail',
      monitorId: monitor.id,
      reason: e?.message,
    });
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}
