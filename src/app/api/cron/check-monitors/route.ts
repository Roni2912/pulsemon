import { NextResponse } from "next/server";
import { getMonitorsToCheck, performMonitorCheck } from "@/lib/supabase/admin";

// POST /api/cron/check-monitors - Run monitor checks (called by cron)
// Authorization is handled by middleware (validates CRON_SECRET)
export async function POST() {
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

    // Check all monitors concurrently
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
  } catch (error) {
    console.error("Cron check-monitors error:", error);
    return NextResponse.json(
      { error: "Failed to run monitor checks" },
      { status: 500 }
    );
  }
}
