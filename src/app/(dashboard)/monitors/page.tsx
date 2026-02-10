import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonitorList } from "@/components/dashboard/monitor-list";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  // Temporarily use mock user for preview (matching dashboard/page.tsx pattern)
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const monitors = await getMonitors(mockUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitors</h2>
          <p className="text-sm text-muted-foreground">
            Manage your website monitors
          </p>
        </div>
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
