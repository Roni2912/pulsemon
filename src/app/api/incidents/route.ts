import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const VALID_STATUSES = ["open", "investigating", "identified", "monitoring", "resolved"] as const;
const VALID_SEVERITIES = ["minor", "major", "critical"] as const;

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

// POST /api/incidents - manually create an incident on a monitor the user owns.
// Auto-detected incidents come from performMonitorCheck; this is for planned
// issues, manual escalations, or incidents the cron path missed.
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    monitor_id,
    title,
    description,
    severity = "major",
    status = "investigating",
    public_message,
    public_visible = true,
  } = body ?? {};

  if (!monitor_id || typeof monitor_id !== "string") {
    return NextResponse.json({ error: "monitor_id is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    return NextResponse.json(
      { error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_STATUSES.includes(status) || status === "resolved") {
    return NextResponse.json(
      {
        error: `status must be one of: ${VALID_STATUSES.filter((s) => s !== "resolved").join(", ")}`,
      },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify the monitor belongs to this user
  const { data: monitor, error: monErr } = await supabase
    .from("monitors")
    .select("id, name, url, user_id")
    .eq("id", monitor_id)
    .eq("user_id", user.id)
    .single();

  if (monErr || !monitor) {
    logger.warn("INCIDENT_CREATE_MONITOR_NOT_FOUND", {
      context: "POST /api/incidents",
      userId: user.id,
      monitorId: monitor_id,
    });
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const insertPayload: Record<string, any> = {
    monitor_id,
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : null,
    status,
    severity,
    started_at: new Date().toISOString(),
    detected_at: new Date().toISOString(),
    public_visible: public_visible !== false,
  };
  if (typeof public_message === "string" && public_message.trim()) {
    insertPayload.public_message = public_message.trim();
  }

  const { data: incident, error: insErr } = await supabase
    .from("incidents")
    .insert(insertPayload)
    .select()
    .single();

  if (insErr || !incident) {
    logger.error("INCIDENT_CREATE_FAILED", {
      context: "POST /api/incidents",
      userId: user.id,
      monitorId: monitor_id,
      reason: insErr?.message,
    });
    return NextResponse.json({ error: insErr?.message || "Insert failed" }, { status: 500 });
  }

  logger.info("INCIDENT_CREATED_MANUAL", {
    context: "POST /api/incidents",
    userId: user.id,
    incidentId: incident.id,
    monitorId: monitor_id,
    status,
    severity,
    publicVisible: insertPayload.public_visible,
  });

  // Fan out to status page subscribers (only when manually marked public).
  if (insertPayload.public_visible) {
    try {
      const { notifySubscribers } = await import("@/lib/notifications/subscribers");
      await notifySubscribers({
        monitorId: monitor.id,
        monitorName: monitor.name,
        incidentId: incident.id,
        incidentTitle: incident.title,
        publicMessage: insertPayload.public_message,
        eventType: "monitor_down",
      });
    } catch (e: any) {
      logger.error("INCIDENT_CREATE_NOTIFY_FAILED", {
        context: "POST /api/incidents",
        incidentId: incident.id,
        reason: e?.message,
      });
    }
  }

  return NextResponse.json({ data: incident }, { status: 201 });
}
