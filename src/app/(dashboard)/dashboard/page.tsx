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

  return monitors as Monitor[];
}

export default async function DashboardPage() {
  // Temporarily use mock user for preview (no auth)
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  
  const stats = await getDashboardStats(mockUserId);
  const recentMonitors = await getRecentMonitors(mockUserId);

  // Show empty state if no monitors
  if (stats.total_monitors === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your monitors
          </p>
        </div>

        <EmptyState
          title="No monitors yet"
          description="Get started by creating your first monitor to track website uptime."
        />
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/monitors/new">Create Monitor</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your monitors
        </p>
      </div>

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
