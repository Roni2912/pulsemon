import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import type { Check } from "@/types";

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

// GET /api/monitors/[id]/checks - Get check history for a monitor
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500); // Max 500
    const hours = parseInt(searchParams.get("hours") || "24"); // Default 24 hours

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

    // Calculate time cutoff
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    // Fetch checks
    const { data: dbChecks, error: checksError } = await supabase
        .from("checks")
        .select("*")
        .eq("monitor_id", id)
        .gte("checked_at", cutoffTime.toISOString())
        .order("checked_at", { ascending: true }) // Ascending for chart display
        .limit(limit);

    if (checksError) {
        return NextResponse.json({ error: checksError.message }, { status: 500 });
    }

    const checks = (dbChecks || []).map(mapDbToCheck);

    return NextResponse.json({
        data: checks,
        meta: {
            total: checks.length,
            hours,
            limit,
        }
    });
}
