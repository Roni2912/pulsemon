import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// POST /api/cron/cleanup
// Auth: CRON_SECRET via middleware. Suggested schedule: daily.
// Calls the cleanup_old_checks() SQL function which deletes old `checks` rows
// based on plan retention (90 days free, 1 year paid).
export async function POST() {
  const startedAt = Date.now();

  const { data, error } = await supabaseAdmin.rpc('cleanup_old_checks');

  if (error) {
    logger.error('CRON_CLEANUP_FAILED', {
      context: 'POST /api/cron/cleanup',
      reason: error.message,
    });
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }

  const deleted = typeof data === 'number' ? data : 0;
  const durationMs = Date.now() - startedAt;

  logger.info('CRON_CLEANUP_OK', {
    context: 'POST /api/cron/cleanup',
    deleted,
    durationMs,
  });

  return NextResponse.json({ deleted, duration_ms: durationMs });
}
