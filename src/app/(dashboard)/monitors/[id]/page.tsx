import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Globe,
  Clock,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Monitor, Check } from "@/types";
import { DeleteMonitorButton } from "./delete-button";
import { MonitorStatsDisplay } from "@/components/dashboard/monitor-stats-display";
import { UptimeChart } from "@/components/dashboard/uptime-chart";

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

const statusConfig = {
  up: {
    label: "Up",
    className: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
  },
  down: {
    label: "Down",
    className: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
  },
  paused: {
    label: "Paused",
    className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  },
  pending: {
    label: "Pending",
    className: "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400",
  },
};

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use mock user matching existing pattern
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const supabase = await createServerSupabaseClient();

  const { data: dbMonitor, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", id)
    .eq("user_id", mockUserId)
    .single();

  if (error || !dbMonitor) {
    notFound();
  }

  const monitor = mapDbToMonitor(dbMonitor);

  const { data: dbChecks } = await supabase
    .from("checks")
    .select("*")
    .eq("monitor_id", id)
    .order("checked_at", { ascending: false })
    .limit(20);

  const checks = (dbChecks || []).map(mapDbToCheck);
  const config = statusConfig[monitor.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/monitors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {monitor.name}
              </h2>
              <Badge className={config.className}>{config.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{monitor.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/monitors/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteMonitorButton monitorId={id} />
        </div>
      </div>

      {/* Basic info cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config.label}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor.interval}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold uppercase">{monitor.type}</div>
            <p className="text-xs text-muted-foreground">{monitor.method}</p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics cards - using new component */}
      <MonitorStatsDisplay monitorId={id} />

      {/* Response time chart */}
      <UptimeChart monitorId={id} hours={24} />

      {/* Monitor details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Timeout</dt>
              <dd className="font-medium">{monitor.timeout / 1000}s</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Expected Status</dt>
              <dd className="font-medium">
                {monitor.expected_status_code ?? "200"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Checked</dt>
              <dd className="font-medium">
                {monitor.last_checked_at
                  ? new Date(monitor.last_checked_at).toLocaleString()
                  : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {new Date(monitor.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Recent checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {checks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No checks recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <span>Status</span>
                <span>Response Time</span>
                <span>Status Code</span>
                <span>Checked At</span>
              </div>
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="grid grid-cols-4 gap-4 text-sm py-2 border-b last:border-0"
                >
                  <span>
                    <Badge
                      className={
                        check.status === "up"
                          ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                          : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
                      }
                    >
                      {check.status === "up" ? "Success" : "Failed"}
                    </Badge>
                  </span>
                  <span>{check.response_time ? `${check.response_time}ms` : "-"}</span>
                  <span>{check.status_code ?? "-"}</span>
                  <span>{new Date(check.checked_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
