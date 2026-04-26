import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/?subscribe=missing-token`);
  }

  const { data: sub, error } = await supabaseAdmin
    .from('status_page_subscribers')
    .select('id, status_page_id, email, confirmed')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (error || !sub) {
    logger.warn('SUBSCRIBE_CONFIRM_INVALID', {
      context: 'GET /api/status/subscribe/confirm',
      reason: error?.message ?? 'token not found',
    });
    return NextResponse.redirect(`${origin}/?subscribe=invalid`);
  }

  const { data: page } = await supabaseAdmin
    .from('status_pages')
    .select('slug')
    .eq('id', sub.status_page_id)
    .single();

  if (sub.confirmed) {
    return NextResponse.redirect(
      `${origin}/status/${page?.slug ?? ''}?subscribed=already`
    );
  }

  const { error: updErr } = await supabaseAdmin
    .from('status_page_subscribers')
    .update({
      confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirmation_token: null,
    })
    .eq('id', sub.id);

  if (updErr) {
    logger.error('SUBSCRIBE_CONFIRM_FAILED', {
      context: 'GET /api/status/subscribe/confirm',
      subscriberId: sub.id,
      reason: updErr.message,
    });
    return NextResponse.redirect(`${origin}/?subscribe=error`);
  }

  logger.info('SUBSCRIBE_CONFIRMED', {
    context: 'GET /api/status/subscribe/confirm',
    subscriberId: sub.id,
    email: sub.email,
  });

  return NextResponse.redirect(
    `${origin}/status/${page?.slug ?? ''}?subscribed=ok`
  );
}
