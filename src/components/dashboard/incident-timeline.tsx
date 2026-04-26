import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IncidentActions } from "./incident-actions";

interface Incident {
  id: string;
  monitor_id: string;
  monitor_name?: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  acknowledged_at?: string | null;
  public_message?: string | null;
  public_visible?: boolean;
}

interface IncidentTimelineProps {
  incidents: Incident[];
}

const severityConfig = {
  minor: {
    label: "Minor",
    className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  },
  major: {
    label: "Major",
    className: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
  },
  critical: {
    label: "Critical",
    className: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
  },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => {
        const isResolved = incident.status === "resolved";
        const severity =
          severityConfig[incident.severity as keyof typeof severityConfig] ||
          severityConfig.minor;

        return (
          <Card key={incident.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isResolved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold text-sm truncate">
                        {incident.title}
                      </span>
                      <Badge className={severity.className}>
                        {severity.label}
                      </Badge>
                      <Badge
                        className={cn(
                          isResolved
                            ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                            : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
                        )}
                      >
                        {isResolved ? "Resolved" : capitalize(incident.status)}
                      </Badge>
                      {incident.acknowledged_at && !isResolved && (
                        <Badge variant="outline" className="text-xs">
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                    <IncidentActions
                      incident={{
                        id: incident.id,
                        status: incident.status as any,
                        acknowledged_at: incident.acknowledged_at ?? null,
                        public_message: incident.public_message ?? null,
                        public_visible: incident.public_visible ?? true,
                      }}
                    />
                  </div>
                  {incident.monitor_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {incident.monitor_name}
                    </p>
                  )}
                  {incident.public_message && (
                    <p className="text-xs mt-2 p-2 rounded bg-muted text-foreground/80 italic">
                      {incident.public_message}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(incident.started_at)}
                    </span>
                    {incident.duration_seconds !== null && (
                      <span>
                        Duration: {formatDuration(incident.duration_seconds)}
                      </span>
                    )}
                    {!isResolved && (
                      <span>
                        Ongoing for{" "}
                        {formatDuration(
                          Math.round(
                            (Date.now() -
                              new Date(incident.started_at).getTime()) /
                              1000
                          )
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
