import { NextResponse } from "next/server";
import { getMonitorsToCheck, performMonitorCheck } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

// /api/cron/check-monitors — Run monitor checks.
// Authorization is handled by middleware (CRON_SECRET).
// Vercel cron sends GET; POST is kept so curl -X POST still works for manual tests.
async function run() {
  const startTime = Date.now();

  try {
    const monitors = await getMonitorsToCheck();

    if (monitors.length === 0) {
      return NextResponse.json({
        message: "No monitors due for checking",
        checked: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    const results = await Promise.allSettled(
      monitors.map((monitor: any) => performMonitorCheck(monitor.id))
    );

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - succeeded;

    return NextResponse.json({
      message: `Checked ${results.length} monitors`,
      checked: results.length,
      succeeded,
      failed,
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    logger.error("CRON_CHECK_MONITORS_FAILED", { context: "cron/check-monitors", reason: error?.message });
    return NextResponse.json({ error: "Failed to run monitor checks" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
