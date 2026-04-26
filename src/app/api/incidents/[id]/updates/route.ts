import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const VALID_STATUSES = ['open', 'investigating', 'identified', 'monitoring', 'resolved'] as const;

async function ownsIncident(supabase: any, incidentId: string, userId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, monitors!inner(user_id)')
    .eq('id', incidentId)
    .eq('monitors.user_id', userId)
    .single();
  return !error && !!data;
}

// GET /api/incidents/[id]/updates - list timeline entries
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  if (!(await ownsIncident(supabase, id, user.id))) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('incident_updates')
    .select('*')
    .eq('incident_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('INCIDENT_UPDATES_FETCH_FAILED', {
      context: 'GET /api/incidents/[id]/updates',
      incidentId: id,
      reason: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

// POST /api/incidents/[id]/updates - manual timeline entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  if (!(await ownsIncident(supabase, id, user.id))) {
    logger.warn('INCIDENT_UPDATE_NOT_OWNED', {
      context: 'POST /api/incidents/[id]/updates',
      userId: user.id,
      incidentId: id,
    });
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, message, public_visible } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status required, one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('incident_updates')
    .insert({
      incident_id: id,
      status,
      message: message.trim(),
      author_id: user.id,
      public_visible: public_visible !== false,
    })
    .select()
    .single();

  if (error) {
    logger.error('INCIDENT_UPDATE_INSERT_FAILED', {
      context: 'POST /api/incidents/[id]/updates',
      incidentId: id,
      reason: error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info('INCIDENT_UPDATE_POSTED', {
    context: 'POST /api/incidents/[id]/updates',
    incidentId: id,
    userId: user.id,
    status,
  });

  return NextResponse.json({ data }, { status: 201 });
}
