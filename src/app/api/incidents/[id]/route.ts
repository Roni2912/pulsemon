import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const VALID_STATUSES = ['open', 'investigating', 'identified', 'monitoring', 'resolved'] as const;
const VALID_SEVERITIES = ['minor', 'major', 'critical'] as const;

type IncidentStatus = (typeof VALID_STATUSES)[number];

async function ownsIncident(supabase: any, incidentId: string, userId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, status, monitor_id, monitors!inner(user_id)')
    .eq('id', incidentId)
    .eq('monitors.user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

// GET /api/incidents/[id] - single incident (with monitor info)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('incidents')
    .select('*, monitors!inner(user_id, name, url)')
    .eq('id', id)
    .eq('monitors.user_id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }
  return NextResponse.json({ data });
}

// PATCH /api/incidents/[id] - update status, acknowledge, public_message, severity, resolution_summary
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

  const owned = await ownsIncident(supabase, id, user.id);
  if (!owned) {
    logger.warn('INCIDENT_PATCH_NOT_OWNED', {
      context: 'PATCH /api/incidents/[id]',
      userId: user.id,
      incidentId: id,
    });
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  const updates: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    updates.status = body.status as IncidentStatus;
    if (body.status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
  }

  if (body.acknowledged === true) {
    updates.acknowledged_at = new Date().toISOString();
  }

  if (body.severity !== undefined) {
    if (!VALID_SEVERITIES.includes(body.severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 }
      );
    }
    updates.severity = body.severity;
  }

  if (typeof body.public_message === 'string') {
    updates.public_message = body.public_message.trim() || null;
  }

  if (typeof body.public_visible === 'boolean') {
    updates.public_visible = body.public_visible;
  }

  if (typeof body.resolution_summary === 'string') {
    updates.resolution_summary = body.resolution_summary.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    logger.error('INCIDENT_PATCH_FAILED', {
      context: 'PATCH /api/incidents/[id]',
      incidentId: id,
      reason: error?.message,
    });
    return NextResponse.json({ error: error?.message || 'Failed to update' }, { status: 500 });
  }

  logger.info('INCIDENT_UPDATED', {
    context: 'PATCH /api/incidents/[id]',
    incidentId: id,
    userId: user.id,
    fromStatus: owned.status,
    toStatus: updated.status,
    fields: Object.keys(updates).join(','),
  });

  // If the user supplied a custom message, append it to the timeline alongside
  // the auto-entry the DB trigger writes on status change.
  if (typeof body.message === 'string' && body.message.trim() && updates.status) {
    const { error: updErr } = await supabase.from('incident_updates').insert({
      incident_id: id,
      status: updates.status,
      message: body.message.trim(),
      author_id: user.id,
      public_visible: updates.public_visible ?? true,
    });
    if (updErr) {
      logger.error('INCIDENT_UPDATE_INSERT_FAILED', {
        context: 'PATCH /api/incidents/[id]',
        incidentId: id,
        reason: updErr.message,
      });
    }
  }

  return NextResponse.json({ data: updated });
}
