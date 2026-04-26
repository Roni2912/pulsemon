import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${origin}/?unsubscribe=missing-token`);
  }

  const { data: sub, error } = await supabaseAdmin
    .from('status_page_subscribers')
    .select('id, status_page_id, email, unsubscribed')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error || !sub) {
    logger.warn('UNSUBSCRIBE_INVALID', {
      context: 'GET /api/status/subscribe/unsubscribe',
      reason: error?.message ?? 'token not found',
    });
    return NextResponse.redirect(`${origin}/?unsubscribe=invalid`);
  }

  const { data: page } = await supabaseAdmin
    .from('status_pages')
    .select('slug')
    .eq('id', sub.status_page_id)
    .single();

  if (sub.unsubscribed) {
    return NextResponse.redirect(
      `${origin}/status/${page?.slug ?? ''}?unsubscribed=already`
    );
  }

  const { error: updErr } = await supabaseAdmin
    .from('status_page_subscribers')
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  if (updErr) {
    logger.error('UNSUBSCRIBE_FAILED', {
      context: 'GET /api/status/subscribe/unsubscribe',
      subscriberId: sub.id,
      reason: updErr.message,
    });
    return NextResponse.redirect(`${origin}/?unsubscribe=error`);
  }

  logger.info('UNSUBSCRIBE_OK', {
    context: 'GET /api/status/subscribe/unsubscribe',
    subscriberId: sub.id,
    email: sub.email,
  });

  return NextResponse.redirect(
    `${origin}/status/${page?.slug ?? ''}?unsubscribed=ok`
  );
}
