import { MonitorCard } from "./monitor-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Monitor } from "@/types";

interface MonitorListProps {
  monitors: Monitor[];
  showEmpty?: boolean;
}

export function MonitorList({ monitors, showEmpty = true }: MonitorListProps) {
  if (monitors.length === 0 && showEmpty) {
    return (
      <EmptyState
        title="No monitors found"
        description="Create your first monitor to start tracking website uptime."
        actionLabel="Create Monitor"
        actionHref="/monitors/new"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {monitors.map((monitor) => (
        <MonitorCard key={monitor.id} monitor={monitor} />
      ))}
    </div>
  );
}
