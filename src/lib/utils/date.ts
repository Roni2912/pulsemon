import {
  format,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
  differenceInMilliseconds,
  parseISO,
} from "date-fns";

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatIncidentDuration(startedAt: string, resolvedAt?: string): string {
  const start = parseISO(startedAt);
  const end = resolvedAt ? parseISO(resolvedAt) : new Date();

  const duration = intervalToDuration({ start, end });

  const parts: string[] = [];

  if (duration.days && duration.days > 0) {
    parts.push(`${duration.days}d`);
  }
  if (duration.hours && duration.hours > 0) {
    parts.push(`${duration.hours}h`);
  }
  if (duration.minutes && duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
  }
  if (parts.length === 0 && duration.seconds !== undefined) {
    parts.push(`${duration.seconds}s`);
  }

  return parts.join(" ");
}

export function getIncidentDurationMs(startedAt: string, resolvedAt?: string): number {
  const start = parseISO(startedAt);
  const end = resolvedAt ? parseISO(resolvedAt) : new Date();
  return differenceInMilliseconds(end, start);
}

export function formatChartDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
}

export function formatChartDateFull(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, HH:mm");
}
