import { Activity, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MonitorList } from "@/components/dashboard/monitor-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getUser, createServerSupabaseClient } from "@/lib/supabase/server";
import type { Monitor, DashboardStats } from "@/types";

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();

  // Fetch all monitors for the user
  const { data: monitors, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", userId);

  if (error || !monitors) {
    return {
      total_monitors: 0,
      monitors_up: 0,
      monitors_down: 0,
      monitors_paused: 0,
      overall_uptime_24h: 100,
      active_incidents: 0,
    };
  }

  // Calculate stats
  const total_monitors = monitors.length;
  const monitors_up = monitors.filter((m: any) => m.is_up === true).length;
  const monitors_down = monitors.filter((m: any) => m.is_up === false).length;
  const monitors_paused = monitors.filter((m: any) => m.status === 'paused').length;

  // Calculate overall uptime (simple average for now)
  let overall_uptime_24h = 100;
  if (total_monitors > 0) {
    overall_uptime_24h = (monitors_up / (monitors_up + monitors_down)) * 100 || 100;
  }

  // Count active incidents
  const { count: active_incidents } = await supabase
    .from("incidents")
    .select("*", { count: "exact", head: true })
    .eq("status", "ongoing")
    .in(
      "monitor_id",
      monitors.map((m: Monitor) => m.id)
    );

  return {
    total_monitors,
    monitors_up,
    monitors_down,
    monitors_paused,
    overall_uptime_24h: Math.round(overall_uptime_24h * 10) / 10,
    active_incidents: active_incidents || 0,
  };
}

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

async function getRecentMonitors(userId: string): Promise<Monitor[]> {
  const supabase = await createServerSupabaseClient();

  const { data: monitors, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !monitors) {
    return [];
  }

  return monitors.map(mapDbToMonitor);
}

export default async function DashboardPage() {
  const user = await getUser();
  const userId = user!.id;

  const stats = await getDashboardStats(userId);
  const recentMonitors = await getRecentMonitors(userId);

  // Show empty state if no monitors
  if (stats.total_monitors === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <EmptyState
            title="No monitors yet"
            description="Get started by creating your first monitor to track website uptime."
          />
          <Button asChild>
            <Link href="/monitors/new">Create Monitor</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Monitors"
          value={stats.total_monitors}
          icon={Activity}
          variant="default"
        />
        <StatsCard
          label="Up"
          value={stats.monitors_up}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          label="Down"
          value={stats.monitors_down}
          icon={XCircle}
          variant="danger"
        />
        <StatsCard
          label="Uptime (24h)"
          value={`${stats.overall_uptime_24h}%`}
          icon={TrendingUp}
          variant={stats.overall_uptime_24h >= 99 ? "success" : "warning"}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Monitors</h3>
          <Button asChild variant="outline" size="sm">
            <Link href="/monitors">View All</Link>
          </Button>
        </div>
        <MonitorList monitors={recentMonitors} showEmpty={false} />
      </div>
    </div>
  );
}
