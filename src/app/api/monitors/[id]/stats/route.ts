import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import { calculateUptimeForPeriod, calculateAverageResponseTime } from "@/lib/utils/uptime";
import type { Check, MonitorStats } from "@/types";

function mapDbToCheck(row: any): Check {
    return {
        id: row.id,
        monitor_id: row.monitor_id,
        status: row.status === "success" ? "up" : "down",
        response_time: row.response_time_ms ?? undefined,
        status_code: row.status_code ?? undefined,
        error_message: row.error_message ?? undefined,
        checked_at: row.checked_at,
    };
}

// GET /api/monitors/[id]/stats - Get monitor statistics for multiple time periods
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Verify monitor ownership
    const { data: monitor, error: monitorError } = await supabase
        .from("monitors")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (monitorError || !monitor) {
        return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    // Fetch checks for the past 30 days (covers all time periods we need)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dbChecks, error: checksError } = await supabase
        .from("checks")
        .select("*")
        .eq("monitor_id", id)
        .gte("checked_at", thirtyDaysAgo.toISOString())
        .order("checked_at", { ascending: false });

    if (checksError) {
        return NextResponse.json({ error: checksError.message }, { status: 500 });
    }

    const checks = (dbChecks || []).map(mapDbToCheck);

    // Calculate uptime for different time periods
    const MS_PER_HOUR = 60 * 60 * 1000;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    const uptime_24h = calculateUptimeForPeriod(checks, MS_PER_DAY);
    const uptime_7d = calculateUptimeForPeriod(checks, 7 * MS_PER_DAY);
    const uptime_30d = calculateUptimeForPeriod(checks, 30 * MS_PER_DAY);

    // Calculate average response time for the last 24 hours
    const now = Date.now();
    const checks24h = checks.filter(
        (check) => new Date(check.checked_at).getTime() >= now - MS_PER_DAY
    );
    const avg_response_time_24h = calculateAverageResponseTime(checks24h);

    // Count total checks in the last 24 hours
    const total_checks_24h = checks24h.length;

    // Fetch incident count for the last 30 days
    const { data: incidents, error: incidentsError } = await supabase
        .from("incidents")
        .select("id")
        .eq("monitor_id", id)
        .gte("started_at", thirtyDaysAgo.toISOString());

    const total_incidents_30d = incidentsError ? 0 : (incidents?.length ?? 0);

    const stats: MonitorStats = {
        uptime_24h,
        uptime_7d,
        uptime_30d,
        avg_response_time_24h,
        total_checks_24h,
        total_incidents_30d,
    };

    return NextResponse.json({ data: stats });
}
