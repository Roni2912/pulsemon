import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";

// GET /api/incidents - List incidents for authenticated user's monitors
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  // Get user's monitor IDs first
  const { data: monitors, error: monitorsError } = await supabase
    .from("monitors")
    .select("id")
    .eq("user_id", user.id);

  if (monitorsError) {
    return NextResponse.json({ error: monitorsError.message }, { status: 500 });
  }

  const monitorIds = (monitors || []).map((m: any) => m.id);

  if (monitorIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "open" | "resolved" | null (all)
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  let query = supabase
    .from("incidents")
    .select("*")
    .in("monitor_id", monitorIds)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (status === "open") {
    query = query.in("status", ["open", "investigating", "identified", "monitoring"]);
  } else if (status === "resolved") {
    query = query.eq("status", "resolved");
  }

  const { data: incidents, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: incidents || [] });
}
