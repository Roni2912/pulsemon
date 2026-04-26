import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { generateToken, sendConfirmationEmail } from '@/lib/notifications/subscribers';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body?.email ?? '').toString().trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const { data: page, error: pageErr } = await supabaseAdmin
    .from('status_pages')
    .select('id, name, slug, is_public, allow_subscriptions')
    .eq('slug', slug)
    .single();

  if (pageErr || !page || !page.is_public || !page.allow_subscriptions) {
    logger.warn('SUBSCRIBE_PAGE_NOT_AVAILABLE', {
      context: 'POST /api/status/[slug]/subscribe',
      slug,
      reason: pageErr?.message,
    });
    return NextResponse.json({ error: 'Status page not found' }, { status: 404 });
  }

  // Re-subscribe path: if email already exists, regenerate the token,
  // reset confirmation/unsubscribe state, and resend the email.
  const { data: existing } = await supabaseAdmin
    .from('status_page_subscribers')
    .select('id, confirmed, unsubscribed')
    .eq('status_page_id', page.id)
    .eq('email', email)
    .maybeSingle();

  const confirmationToken = generateToken();
  const unsubscribeToken = generateToken();

  if (existing) {
    if (existing.confirmed && !existing.unsubscribed) {
      logger.info('SUBSCRIBE_ALREADY_CONFIRMED', {
        context: 'POST /api/status/[slug]/subscribe',
        slug,
        email,
        subscriberId: existing.id,
      });
      return NextResponse.json({
        ok: true,
        message: 'You are already subscribed.',
      });
    }

    const { error: updErr } = await supabaseAdmin
      .from('status_page_subscribers')
      .update({
        confirmed: false,
        confirmation_token: confirmationToken,
        confirmation_sent_at: new Date().toISOString(),
        unsubscribed: false,
        unsubscribed_at: null,
        unsubscribe_token: unsubscribeToken,
      })
      .eq('id', existing.id);

    if (updErr) {
      logger.error('SUBSCRIBE_UPDATE_FAILED', {
        context: 'POST /api/status/[slug]/subscribe',
        slug,
        email,
        reason: updErr.message,
      });
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
  } else {
    const { error: insErr } = await supabaseAdmin
      .from('status_page_subscribers')
      .insert({
        status_page_id: page.id,
        email,
        confirmed: false,
        confirmation_token: confirmationToken,
        confirmation_sent_at: new Date().toISOString(),
        unsubscribe_token: unsubscribeToken,
      });

    if (insErr) {
      logger.error('SUBSCRIBE_INSERT_FAILED', {
        context: 'POST /api/status/[slug]/subscribe',
        slug,
        email,
        reason: insErr.message,
      });
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
  }

  await sendConfirmationEmail({
    email,
    pageName: page.name,
    pageSlug: page.slug,
    confirmationToken,
  });

  logger.info('SUBSCRIBE_REQUESTED', {
    context: 'POST /api/status/[slug]/subscribe',
    slug,
    email,
  });

  return NextResponse.json({
    ok: true,
    message: 'Check your inbox to confirm.',
  });
}
