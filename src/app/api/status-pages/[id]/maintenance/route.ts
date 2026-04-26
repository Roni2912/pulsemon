import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// PATCH /api/status-pages/[id]/maintenance
// Body: { maintenance_mode, maintenance_message?, maintenance_scheduled_start?, maintenance_scheduled_end? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (typeof body.maintenance_mode === 'boolean') {
    updates.maintenance_mode = body.maintenance_mode;
  }
  if (typeof body.maintenance_message === 'string') {
    updates.maintenance_message = body.maintenance_message.trim() || null;
  }
  if (body.maintenance_scheduled_start === null) {
    updates.maintenance_scheduled_start = null;
  } else if (typeof body.maintenance_scheduled_start === 'string' && body.maintenance_scheduled_start) {
    const parsed = new Date(body.maintenance_scheduled_start);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled_start' }, { status: 400 });
    }
    updates.maintenance_scheduled_start = parsed.toISOString();
  }
  if (body.maintenance_scheduled_end === null) {
    updates.maintenance_scheduled_end = null;
  } else if (typeof body.maintenance_scheduled_end === 'string' && body.maintenance_scheduled_end) {
    const parsed = new Date(body.maintenance_scheduled_end);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled_end' }, { status: 400 });
    }
    updates.maintenance_scheduled_end = parsed.toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('status_pages')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, maintenance_mode, maintenance_message, maintenance_scheduled_start, maintenance_scheduled_end')
    .single();

  if (error || !data) {
    logger.error('MAINTENANCE_UPDATE_FAILED', {
      context: 'PATCH maintenance',
      userId: user.id,
      pageId: id,
      reason: error?.message,
    });
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }

  logger.info('MAINTENANCE_UPDATED', {
    context: 'PATCH maintenance',
    userId: user.id,
    pageId: id,
    maintenanceMode: data.maintenance_mode,
  });

  return NextResponse.json({ data });
}
