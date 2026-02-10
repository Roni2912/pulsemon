import Link from "next/link";
import { Plus, Globe, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StatusPage } from "@/types";

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

async function getStatusPages(userId: string): Promise<StatusPage[]> {
  const supabase = await createServerSupabaseClient();

  const { data: pages, error } = await supabase
    .from("status_pages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !pages) return [];

  const result: StatusPage[] = [];
  for (const page of pages) {
    const { data: junctionRows } = await supabase
      .from("status_page_monitors")
      .select("monitor_id")
      .eq("status_page_id", page.id);

    const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id);
    result.push(mapDbToStatusPage(page, monitorIds));
  }

  return result;
}

export default async function StatusPagesPage() {
  const mockUserId = "00000000-0000-0000-0000-000000000000";
  const statusPages = await getStatusPages(mockUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Status Pages</h2>
          <p className="text-sm text-muted-foreground">
            Manage your public status pages
          </p>
        </div>
        <Button asChild>
          <Link href="/status-pages/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Status Page
          </Link>
        </Button>
      </div>

      {statusPages.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No status pages yet"
          description="Create a status page to share uptime information with your customers."
          actionLabel="Create Status Page"
          actionHref="/status-pages/new"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statusPages.map((page) => (
            <Link key={page.id} href={`/status-pages/${page.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {page.name}
                  </CardTitle>
                  <Badge
                    variant={page.is_public ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {page.is_public ? (
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
                </CardHeader>
                <CardContent>
                  {page.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {page.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{page.monitors.length} monitor{page.monitors.length !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1">
                      /status/{page.slug}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
