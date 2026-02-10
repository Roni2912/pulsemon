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

// GET /api/status-pages/[id] - Get single status page
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

  const { data: page, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !page) {
    return NextResponse.json({ error: "Status page not found" }, { status: 404 });
  }

  const { data: junctionRows } = await supabase
    .from("status_page_monitors")
    .select("monitor_id")
    .eq("status_page_id", id);

  const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);

  return NextResponse.json({ data: mapDbToStatusPage(page, monitorIds) });
}

// PATCH /api/status-pages/[id] - Update status page
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

  const parsed = statusPageSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Build update object
  const updateFields: Record<string, unknown> = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.slug !== undefined) updateFields.slug = data.slug;
  if (data.description !== undefined) updateFields.description = data.description ?? null;
  if (data.is_public !== undefined) updateFields.is_public = data.is_public;
  if (data.show_values !== undefined) updateFields.show_values = data.show_values;

  if (Object.keys(updateFields).length > 0) {
    const { error } = await supabase
      .from("status_pages")
      .update(updateFields)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        return NextResponse.json(
          { error: "A status page with this slug already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update monitors junction table if provided
  if (data.monitors !== undefined) {
    // Delete existing junction rows
    await supabase
      .from("status_page_monitors")
      .delete()
      .eq("status_page_id", id);

    // Insert new junction rows
    if (data.monitors.length > 0) {
      const junctionRows = data.monitors.map((monitorId) => ({
        status_page_id: id,
        monitor_id: monitorId,
      }));

      const { error: junctionError } = await supabase
        .from("status_page_monitors")
        .insert(junctionRows);

      if (junctionError) {
        return NextResponse.json({ error: junctionError.message }, { status: 500 });
      }
    }
  }

  // Fetch updated page
  const { data: updatedPage, error: fetchError } = await supabase
    .from("status_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !updatedPage) {
    return NextResponse.json({ error: "Status page not found" }, { status: 404 });
  }

  const { data: junctionRows } = await supabase
    .from("status_page_monitors")
    .select("monitor_id")
    .eq("status_page_id", id);

  const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);

  return NextResponse.json({ data: mapDbToStatusPage(updatedPage, monitorIds) });
}

// DELETE /api/status-pages/[id] - Delete status page
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
    .from("status_pages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Status page deleted" });
}
