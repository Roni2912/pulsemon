import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonitorList } from "@/components/dashboard/monitor-list";
import { getUser, createServerSupabaseClient } from "@/lib/supabase/server";
import type { Monitor } from "@/types";

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

async function getMonitors(userId: string): Promise<Monitor[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbToMonitor);
}

export default async function MonitorsPage() {
  const user = await getUser();
  const monitors = await getMonitors(user!.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button asChild>
          <Link href="/monitors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </Link>
        </Button>
      </div>

      <MonitorList monitors={monitors} />
    </div>
  );
}
