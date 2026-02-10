import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPageForm } from "@/components/dashboard/status-page-form";

export default function NewStatusPagePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/status-pages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Status Page</h2>
          <p className="text-sm text-muted-foreground">
            Create a new public status page for your monitors
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Page Details</CardTitle>
          <CardDescription>
            Configure the name, slug, and monitors for your new status page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPageForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
