import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getUser } from "@/lib/supabase/server";
import { statusPageSchema } from "@/lib/utils/validation";
import type { StatusPage } from "@/types";

function mapDbToStatusPage(row: any, monitorIds: string[]): StatusPage {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    custom_domain: row.custom_domain ?? undefined,
    logo_url: row.logo_url ?? undefined,
    monitors: monitorIds,
    is_public: row.is_public,
    show_values: row.show_values ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/status-pages - List status pages for authenticated user
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: pages, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch monitor IDs for each status page
  const result: StatusPage[] = [];
  for (const page of pages || []) {
    const { data: junctionRows } = await supabase
      .from("status_page_monitors")
      .select("monitor_id")
      .eq("status_page_id", page.id);

    const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);
    result.push(mapDbToStatusPage(page, monitorIds));
  }

  return NextResponse.json({ data: result });
}

// POST /api/status-pages - Create a status page
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

  const parsed = statusPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Insert the status page
  const { data: page, error } = await supabase
    .from("status_pages")
    .insert({
      user_id: user.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      is_public: data.is_public,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return NextResponse.json(
        { error: "A status page with this slug already exists." },
        { status: 409 }
      );
    }
    if (error.message.toLowerCase().includes("limit")) {
      return NextResponse.json(
        { error: "You have reached your status page limit. Please upgrade your plan." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert junction table rows for monitors
  if (data.monitors.length > 0) {
    const junctionRows = data.monitors.map((monitorId) => ({
      status_page_id: page.id,
      monitor_id: monitorId,
    }));

    const { error: junctionError } = await supabase
      .from("status_page_monitors")
      .insert(junctionRows);

    if (junctionError) {
      // Clean up the status page if junction insert fails
      await supabase.from("status_pages").delete().eq("id", page.id);
      return NextResponse.json({ error: junctionError.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { data: mapDbToStatusPage(page, data.monitors) },
    { status: 201 }
  );
}
