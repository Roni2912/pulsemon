import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || '';

// POST /api/status-pages/[id]/domain/verify
// Resolves CNAME for custom_domain. If it points at our app host, mark verified.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: page, error } = await supabase
    .from('status_pages')
    .select('id, custom_domain, custom_domain_verified')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!page.custom_domain) {
    return NextResponse.json({ error: 'No custom domain set' }, { status: 400 });
  }

  if (!APP_HOST) {
    logger.error('CUSTOM_DOMAIN_VERIFY_NO_APP_HOST', {
      context: 'POST domain/verify',
      pageId: id,
    });
    return NextResponse.json(
      { error: 'Server is missing NEXT_PUBLIC_APP_HOST env var' },
      { status: 500 }
    );
  }

  let cnames: string[] = [];
  try {
    cnames = await dns.resolveCname(page.custom_domain);
  } catch (e: any) {
    logger.warn('CUSTOM_DOMAIN_DNS_FAILED', {
      context: 'POST domain/verify',
      pageId: id,
      customDomain: page.custom_domain,
      reason: e?.code || e?.message,
    });
    return NextResponse.json(
      {
        verified: false,
        error: `Could not resolve ${page.custom_domain}. Add a CNAME record pointing to ${APP_HOST} and try again.`,
      },
      { status: 200 }
    );
  }

  const target = APP_HOST.toLowerCase();
  const matched = cnames.some((c) => c.toLowerCase().replace(/\.$/, '') === target);

  if (!matched) {
    logger.info('CUSTOM_DOMAIN_VERIFY_MISMATCH', {
      context: 'POST domain/verify',
      pageId: id,
      customDomain: page.custom_domain,
      found: cnames.join(','),
      expected: target,
    });
    return NextResponse.json({
      verified: false,
      cnames,
      expected: APP_HOST,
      error: `CNAME points to ${cnames.join(', ')} but should point to ${APP_HOST}.`,
    });
  }

  const { error: updErr } = await supabase
    .from('status_pages')
    .update({ custom_domain_verified: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (updErr) {
    logger.error('CUSTOM_DOMAIN_VERIFY_UPDATE_FAILED', {
      context: 'POST domain/verify',
      pageId: id,
      reason: updErr.message,
    });
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  logger.info('CUSTOM_DOMAIN_VERIFIED', {
    context: 'POST domain/verify',
    userId: user.id,
    pageId: id,
    customDomain: page.custom_domain,
  });

  return NextResponse.json({ verified: true });
}
