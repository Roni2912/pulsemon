import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import { monitorPartialSchema } from "@/lib/utils/validation";
import type { Monitor, Check } from "@/types";

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

// GET /api/monitors/[id] - Get single monitor with recent checks
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

  const { data: monitor, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const { data: checks } = await supabase
    .from("checks")
    .select("*")
    .eq("monitor_id", id)
    .order("checked_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    data: {
      ...mapDbToMonitor(monitor),
      checks: (checks || []).map(mapDbToCheck),
    },
  });
}

// PATCH /api/monitors/[id] - Update monitor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = monitorPartialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Build update object, only including fields that were provided
  const updateFields: Record<string, unknown> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.url !== undefined) updateFields.url = data.url;
  if (data.type !== undefined) updateFields.type = data.type;
  if (data.method !== undefined) updateFields.method = data.method;
  if (data.interval !== undefined) updateFields.interval_seconds = data.interval * 60;
  if (data.timeout !== undefined) updateFields.timeout_seconds = Math.round(data.timeout / 1000);
  if (data.expected_status_code !== undefined) {
    updateFields.expected_status_codes = data.expected_status_code
      ? [data.expected_status_code]
      : [200];
  }
  if (data.headers !== undefined) updateFields.headers = data.headers ?? {};
  if (data.body !== undefined) updateFields.body = data.body ?? null;

  const { data: monitor, error } = await supabase
    .from("monitors")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !monitor) {
    return NextResponse.json({ error: error?.message || "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ data: mapDbToMonitor(monitor) });
}

// DELETE /api/monitors/[id] - Delete monitor
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("monitors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Monitor deleted" });
}
