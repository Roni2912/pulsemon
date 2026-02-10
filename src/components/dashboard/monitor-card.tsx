import Link from "next/link";
import { MoreVertical, Activity, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Monitor } from "@/types";
import { cn } from "@/lib/utils";

interface MonitorCardProps {
  monitor: Monitor;
  uptime?: number;
  avgResponseTime?: number;
}

const statusConfig = {
  up: {
    label: "Up",
    color: "bg-green-500",
    badgeVariant: "default" as const,
    className: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
  },
  down: {
    label: "Down",
    color: "bg-red-500",
    badgeVariant: "destructive" as const,
    className: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-500",
    badgeVariant: "secondary" as const,
    className: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  },
  pending: {
    label: "Pending",
    color: "bg-gray-400",
    badgeVariant: "secondary" as const,
    className: "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400",
  },
};

export function MonitorCard({ monitor, uptime, avgResponseTime }: MonitorCardProps) {
  const config = statusConfig[monitor.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("h-3 w-3 rounded-full flex-shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="font-semibold hover:underline truncate block"
              >
                {monitor.name}
              </Link>
              <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/monitors/${monitor.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/monitors/${monitor.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm">
          <Badge className={config.className}>{config.label}</Badge>
          {uptime !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{uptime.toFixed(1)}%</span>
            </div>
          )}
          {avgResponseTime !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{avgResponseTime}ms</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Activity className="h-4 w-4" />
            <span>Every {monitor.interval}m</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
