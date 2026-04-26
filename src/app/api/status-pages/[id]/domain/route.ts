import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const DOMAIN_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

// PATCH /api/status-pages/[id]/domain — set or clear the custom domain.
// Setting a new domain resets custom_domain_verified to false.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const raw = body?.custom_domain;
  let custom_domain: string | null = null;
  if (typeof raw === 'string' && raw.trim()) {
    custom_domain = raw.trim().toLowerCase();
    if (!DOMAIN_RE.test(custom_domain)) {
      return NextResponse.json(
        { error: 'Enter a valid domain (e.g. status.example.com)' },
        { status: 400 }
      );
    }
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('status_pages')
    .update({ custom_domain, custom_domain_verified: false })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, custom_domain, custom_domain_verified')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'That domain is already attached to another status page' },
        { status: 409 }
      );
    }
    logger.error('CUSTOM_DOMAIN_UPDATE_FAILED', {
      context: 'PATCH domain',
      userId: user.id,
      pageId: id,
      reason: error?.message,
    });
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }

  logger.info('CUSTOM_DOMAIN_UPDATED', {
    context: 'PATCH domain',
    userId: user.id,
    pageId: id,
    customDomain: custom_domain ?? '(cleared)',
  });

  return NextResponse.json({ data });
}
