import { AlertCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { IncidentTimeline } from "@/components/dashboard/incident-timeline";
import { EmptyState } from "@/components/ui/empty-state";

async function getIncidents(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get user's monitor IDs
  const { data: monitors } = await supabase
    .from("monitors")
    .select("id, name")
    .eq("user_id", userId);

  if (!monitors || monitors.length === 0) return [];

  const monitorMap = new Map(monitors.map((m: any) => [m.id, m.name]));
  const monitorIds = monitors.map((m: any) => m.id);

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("*")
    .in("monitor_id", monitorIds)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error || !incidents) return [];

  return incidents.map((inc: any) => ({
    ...inc,
    monitor_name: monitorMap.get(inc.monitor_id) || "Unknown",
  }));
}

export default async function IncidentsPage() {
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const incidents = await getIncidents(mockUserId);

  const ongoing = incidents.filter(
    (i: any) => i.status !== "resolved"
  );
  const resolved = incidents.filter(
    (i: any) => i.status === "resolved"
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-sm text-muted-foreground">
          View and manage incidents across your monitors
        </p>
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No incidents"
          description="No incidents have been recorded yet. Incidents are created automatically when a monitor goes down."
        />
      ) : (
        <div className="space-y-8">
          {ongoing.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Ongoing ({ongoing.length})
              </h3>
              <IncidentTimeline incidents={ongoing} />
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Resolved ({resolved.length})
              </h3>
              <IncidentTimeline incidents={resolved} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
