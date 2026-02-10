import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitorForm } from "@/components/dashboard/monitor-form";

export default function NewMonitorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/monitors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Create a new website monitor
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Details</CardTitle>
          <CardDescription>
            Configure the URL and check settings for your new monitor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonitorForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
