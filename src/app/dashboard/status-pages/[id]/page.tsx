import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Globe,
  Lock,
  ExternalLink,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StatusPage } from "@/types";
import { DeleteStatusPageButton } from "./delete-button";
import { StatusPageForm } from "@/components/dashboard/status-page-form";

function mapDbToStatusPage(row: any, monitorIds: string[]): StatusPage {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    custom_domain: row.custom_domain ?? undefined,
    logo_url: row.logo_url ?? undefined,
    monitors: monitorIds,
    is_public: row.is_public,
    show_values: row.show_values ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export default async function StatusPageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const supabase = await createServerSupabaseClient();

  const { data: dbPage, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", mockUserId)
    .single();

  if (error || !dbPage) {
    notFound();
  }

  const { data: junctionRows } = await supabase
    .from("status_page_monitors")
    .select("monitor_id")
    .eq("status_page_id", id);

  const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);
  const statusPage = mapDbToStatusPage(dbPage, monitorIds);

  // Fetch monitor names for display
  const { data: monitors } = await supabase
    .from("monitors")
    .select("id, name, is_up, status")
    .in("id", monitorIds.length > 0 ? monitorIds : ["none"]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/status-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {statusPage.name}
              </h2>
              <Badge
                variant={statusPage.is_public ? "default" : "secondary"}
              >
                {statusPage.is_public ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">/status/{statusPage.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusPage.is_public && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/status/${statusPage.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
          )}
          <DeleteStatusPageButton statusPageId={id} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusPage.monitors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visibility</CardTitle>
            {statusPage.is_public ? (
              <Globe className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusPage.is_public ? "Public" : "Private"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(statusPage.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitor list */}
      {monitors && monitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Monitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monitors.map((monitor: any) => {
                const isUp = monitor.status === "active" && monitor.is_up === true;
                const isDown = monitor.status === "active" && monitor.is_up === false;
                return (
                  <div
                    key={monitor.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <Link
                      href={`/dashboard/monitors/${monitor.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {monitor.name}
                    </Link>
                    <Badge
                      className={
                        isUp
                          ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                          : isDown
                            ? "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
                            : "text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400"
                      }
                    >
                      {isUp ? "Up" : isDown ? "Down" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Status Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusPageForm
            mode="edit"
            statusPageId={id}
            defaultValues={{
              name: statusPage.name,
              slug: statusPage.slug,
              description: statusPage.description ?? "",
              monitors: statusPage.monitors,
              is_public: statusPage.is_public,
              show_values: statusPage.show_values,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
