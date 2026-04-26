import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: pageId, subId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: page } = await supabase
    .from('status_pages')
    .select('id')
    .eq('id', pageId)
    .eq('user_id', user.id)
    .single();

  if (!page) {
    logger.warn('SUBSCRIBER_DELETE_NOT_OWNED', {
      context: 'DELETE subscribers',
      userId: user.id,
      pageId,
    });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('status_page_subscribers')
    .delete()
    .eq('id', subId)
    .eq('status_page_id', pageId);

  if (error) {
    logger.error('SUBSCRIBER_DELETE_FAILED', {
      context: 'DELETE subscribers',
      pageId,
      subId,
      reason: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info('SUBSCRIBER_DELETED', {
    context: 'DELETE subscribers',
    userId: user.id,
    pageId,
    subId,
  });

  return NextResponse.json({ ok: true });
}
