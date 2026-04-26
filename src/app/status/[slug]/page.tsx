import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";
import { SubscribeForm } from "@/components/status/subscribe-form";

async function getStatusPage(slug: string) {
  // Use admin client to bypass RLS for public access
  const { data: page, error } = await supabaseAdmin
    .from("status_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !page) return null;

  // Get linked monitor IDs
  const { data: junctionRows } = await supabaseAdmin
    .from("status_page_monitors")
    .select("monitor_id")
    .eq("status_page_id", page.id);

  const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);
  if (monitorIds.length === 0) return { page, monitors: [] };

  // Fetch monitors
  const { data: monitors } = await supabaseAdmin
    .from("monitors")
    .select("id, name, is_up, status, last_checked_at")
    .in("id", monitorIds);

  // For each monitor, calculate uptime from recent checks (last 90 days)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const monitorsWithUptime = await Promise.all(
    (monitors || []).map(async (monitor: any) => {
      const { data: checks } = await supabaseAdmin
        .from("checks")
        .select("status")
        .eq("monitor_id", monitor.id)
        .gte("created_at", cutoff);

      const totalChecks = checks?.length || 0;
      const successChecks = checks?.filter((c: any) => c.status === "success").length || 0;
      const uptime = totalChecks > 0
        ? Number(((successChecks / totalChecks) * 100).toFixed(2))
        : 100;

      return {
        id: monitor.id,
        name: monitor.name,
        isUp: monitor.status === "active" ? monitor.is_up : null,
        status: monitor.status,
        lastCheckedAt: monitor.last_checked_at,
        uptime,
      };
    })
  );

  return { page, monitors: monitorsWithUptime };
}

function getUptimeColor(uptime: number): string {
  if (uptime >= 99.9) return "text-green-500";
  if (uptime >= 99) return "text-green-400";
  if (uptime >= 95) return "text-yellow-500";
  if (uptime >= 90) return "text-orange-500";
  return "text-red-500";
}

export default async function PublicStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subscribed?: string; unsubscribed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const result = await getStatusPage(slug);

  if (!result) {
    notFound();
  }

  const { page, monitors } = result;

  const allUp = monitors.length > 0 && monitors.every((m) => m.isUp === true);
  const someDown = monitors.some((m) => m.isUp === false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{page.name}</h1>
          {page.description && (
            <p className="text-muted-foreground">{page.description}</p>
          )}

          {/* Overall status indicator */}
          <div className="mt-6">
            {monitors.length === 0 ? (
              <Badge variant="secondary" className="text-base px-4 py-2">
                <MinusCircle className="mr-2 h-4 w-4" />
                No monitors configured
              </Badge>
            ) : allUp ? (
              <Badge className="text-base px-4 py-2 bg-green-500 hover:bg-green-600 text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                All Systems Operational
              </Badge>
            ) : someDown ? (
              <Badge className="text-base px-4 py-2 bg-red-500 hover:bg-red-600 text-white">
                <XCircle className="mr-2 h-4 w-4" />
                Some Systems Down
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Activity className="mr-2 h-4 w-4" />
                Checking Systems...
              </Badge>
            )}
          </div>
        </div>

        {/* Monitor list */}
        <div className="space-y-3">
          {monitors.map((monitor) => (
            <Card key={monitor.id}>
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      monitor.isUp === true
                        ? "bg-green-500"
                        : monitor.isUp === false
                          ? "bg-red-500"
                          : "bg-gray-400"
                    }`}
                  />
                  <span className="font-medium">{monitor.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {page.show_values && (
                    <span className={`text-sm font-medium ${getUptimeColor(monitor.uptime)}`}>
                      {monitor.uptime.toFixed(2)}%
                    </span>
                  )}
                  <Badge
                    variant={monitor.isUp === true ? "default" : monitor.isUp === false ? "destructive" : "secondary"}
                    className={
                      monitor.isUp === true
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : monitor.isUp === false
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : ""
                    }
                  >
                    {monitor.isUp === true ? "Operational" : monitor.isUp === false ? "Down" : "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(sp.subscribed === 'ok' || sp.subscribed === 'already' ||
          sp.unsubscribed === 'ok' || sp.unsubscribed === 'already') && (
          <div className="mt-8 rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200">
            {sp.subscribed === 'ok' && 'Subscription confirmed. You will be notified about incidents.'}
            {sp.subscribed === 'already' && 'You are already subscribed.'}
            {sp.unsubscribed === 'ok' && 'You have been unsubscribed.'}
            {sp.unsubscribed === 'already' && 'You were already unsubscribed.'}
          </div>
        )}

        {page.allow_subscriptions && (
          <div className="mt-10 rounded-lg border bg-card p-6">
            <SubscribeForm slug={slug} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="font-medium hover:underline">
            PulseMon
          </Link>
        </div>
      </div>
    </div>
  );
}
