import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import { monitorSchema } from "@/lib/utils/validation";
import type { Monitor } from "@/types";

// DB row → Frontend Monitor
function mapDbToMonitor(row: any): Monitor {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    url: row.url,
    type: row.type,
    method: row.method,
    interval: Math.round(row.interval_seconds / 60),
    timeout: row.timeout_seconds * 1000,
    status: row.status === "active"
      ? row.is_up === false
        ? "down"
        : row.is_up === true
          ? "up"
          : "pending"
      : "paused",
    expected_status_code: row.expected_status_codes?.[0],
    headers: row.headers as Record<string, string> | undefined,
    body: row.body,
    last_checked_at: row.last_checked_at,
    consecutive_failures: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/monitors - List all monitors for authenticated user
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: monitors, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (monitors || []).map(mapDbToMonitor) });
}

// POST /api/monitors - Create a new monitor
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = monitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: monitor, error } = await supabase
    .from("monitors")
    .insert({
      user_id: user.id,
      name: data.name,
      url: data.url,
      type: data.type,
      method: data.method,
      interval_seconds: data.interval * 60,
      timeout_seconds: Math.round(data.timeout / 1000),
      expected_status_codes: data.expected_status_code
        ? [data.expected_status_code]
        : [200],
      headers: data.headers ?? {},
      body: data.body ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("monitor limit")) {
      return NextResponse.json(
        { error: "You have reached your monitor limit. Please upgrade your plan." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: mapDbToMonitor(monitor) }, { status: 201 });
}
