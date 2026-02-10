import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MonitorForm } from "@/components/dashboard/monitor-form";

export default async function EditMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  // Map DB fields to form values
  const defaultValues = {
    name: dbMonitor.name,
    url: dbMonitor.url,
    type: dbMonitor.type as "http" | "https" | "tcp" | "ping",
    method: dbMonitor.method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD",
    interval: Math.round(dbMonitor.interval_seconds / 60),
    timeout: dbMonitor.timeout_seconds * 1000,
    expected_status_code: dbMonitor.expected_status_codes?.[0] ?? undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/monitors/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Update settings for {dbMonitor.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Details</CardTitle>
          <CardDescription>
            Update the configuration for this monitor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonitorForm mode="edit" defaultValues={defaultValues} monitorId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
