import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// POST /api/cron/refresh-stats
// Auth: CRON_SECRET via middleware. Suggested schedule: hourly.
// Refreshes monitor_stats_hourly materialized view (24h/7d/30d aggregates).
export async function POST() {
  const startedAt = Date.now();

  const { error } = await supabaseAdmin.rpc('refresh_monitor_stats');

  if (error) {
    logger.error('CRON_REFRESH_STATS_FAILED', {
      context: 'POST /api/cron/refresh-stats',
      reason: error.message,
    });
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }

  const durationMs = Date.now() - startedAt;
  logger.info('CRON_REFRESH_STATS_OK', {
    context: 'POST /api/cron/refresh-stats',
    durationMs,
  });

  return NextResponse.json({ ok: true, duration_ms: durationMs });
}
