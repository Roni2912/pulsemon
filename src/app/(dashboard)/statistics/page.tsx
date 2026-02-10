import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function StatisticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={BarChart3}
        title="Statistics coming soon"
        description="Uptime and performance analytics will be available here."
      />
    </div>
  );
}
