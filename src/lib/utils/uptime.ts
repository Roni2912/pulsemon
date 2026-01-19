import type { Check } from "@/types";

export function calculateUptime(checks: Check[]): number {
  if (checks.length === 0) return 100;

  const upChecks = checks.filter((check) => check.status === "up").length;
  return Number(((upChecks / checks.length) * 100).toFixed(2));
}

export function calculateUptimeForPeriod(
  checks: Check[],
  periodMs: number
): number {
  const now = Date.now();
  const cutoff = now - periodMs;

  const recentChecks = checks.filter(
    (check) => new Date(check.checked_at).getTime() >= cutoff
  );

  return calculateUptime(recentChecks);
}

export function calculateAverageResponseTime(checks: Check[]): number {
  const validChecks = checks.filter(
    (check) => check.response_time !== null && check.response_time !== undefined
  );

  if (validChecks.length === 0) return 0;

  const sum = validChecks.reduce((acc, check) => acc + (check.response_time || 0), 0);
  return Math.round(sum / validChecks.length);
}

export function getUptimeColor(uptime: number): string {
  if (uptime >= 99.9) return "text-green-500";
  if (uptime >= 99) return "text-green-400";
  if (uptime >= 95) return "text-yellow-500";
  if (uptime >= 90) return "text-orange-500";
  return "text-red-500";
}

export function getUptimeBgColor(uptime: number): string {
  if (uptime >= 99.9) return "bg-green-500";
  if (uptime >= 99) return "bg-green-400";
  if (uptime >= 95) return "bg-yellow-500";
  if (uptime >= 90) return "bg-orange-500";
  return "bg-red-500";
}

export function getStatusColor(status: "up" | "down" | "paused" | "pending"): string {
  switch (status) {
    case "up":
      return "bg-green-500";
    case "down":
      return "bg-red-500";
    case "paused":
      return "bg-yellow-500";
    case "pending":
      return "bg-gray-400";
    default:
      return "bg-gray-400";
  }
}

export function getStatusText(status: "up" | "down" | "paused" | "pending"): string {
  switch (status) {
    case "up":
      return "Operational";
    case "down":
      return "Down";
    case "paused":
      return "Paused";
    case "pending":
      return "Pending";
    default:
      return "Unknown";
  }
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatUptime(uptime: number): string {
  return `${uptime.toFixed(2)}%`;
}
