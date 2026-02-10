"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { statusPageSchema, type StatusPageFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Monitor } from "@/types";

interface StatusPageFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<StatusPageFormData>;
  statusPageId?: string;
}

export function StatusPageForm({ mode, defaultValues, statusPageId }: StatusPageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [monitorsLoading, setMonitorsLoading] = useState(true);

  const form = useForm<StatusPageFormData>({
    resolver: zodResolver(statusPageSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      monitors: defaultValues?.monitors ?? [],
      is_public: defaultValues?.is_public ?? true,
      show_values: defaultValues?.show_values ?? true,
    },
  });

  // Fetch available monitors
  useEffect(() => {
    async function fetchMonitors() {
      try {
        const res = await fetch("/api/monitors");
        const result = await res.json();
        if (res.ok && result.data) {
          setMonitors(result.data);
        }
      } catch {
        // Silently fail - monitors list will just be empty
      } finally {
        setMonitorsLoading(false);
      }
    }
    fetchMonitors();
  }, []);

  // Auto-generate slug from name (only in create mode and if slug hasn't been manually edited)
  const watchName = form.watch("name");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "create" && !slugManuallyEdited && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      form.setValue("slug", slug);
    }
  }, [watchName, mode, slugManuallyEdited, form]);

  function handleMonitorToggle(monitorId: string) {
    const current = form.getValues("monitors");
    if (current.includes(monitorId)) {
      form.setValue(
        "monitors",
        current.filter((id) => id !== monitorId),
        { shouldValidate: true }
      );
    } else {
      form.setValue("monitors", [...current, monitorId], { shouldValidate: true });
    }
  }

  async function onSubmit(values: StatusPageFormData) {
    setIsLoading(true);

    try {
      const url = mode === "create" ? "/api/status-pages" : `/api/status-pages/${statusPageId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: mode === "create" ? "Failed to create status page" : "Failed to update status page",
          description: result.error || "An unexpected error occurred.",
        });
        return;
      }

      toast({
        title: mode === "create" ? "Status page created!" : "Status page updated!",
        description: mode === "create"
          ? "Your status page has been created."
          : "Your status page has been updated.",
      });

      if (mode === "create") {
        router.push("/dashboard/status-pages");
      } else {
        router.push(`/dashboard/status-pages/${statusPageId}`);
      }
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedMonitors = form.watch("monitors");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Status Page" disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-status-page"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                Your status page will be available at /status/{form.watch("slug") || "your-slug"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of what this status page monitors"
                  disabled={isLoading}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monitors"
          render={() => (
            <FormItem>
              <FormLabel>Monitors</FormLabel>
              <FormDescription>
                Select the monitors to display on this status page.
              </FormDescription>
              {monitorsLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-muted-foreground">Loading monitors...</span>
                </div>
              ) : monitors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No monitors found. Create a monitor first.
                </p>
              ) : (
                <div className="space-y-2 rounded-md border p-4">
                  {monitors.map((monitor) => (
                    <label
                      key={monitor.id}
                      className="flex items-center gap-3 cursor-pointer py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMonitors.includes(monitor.id)}
                        onChange={() => handleMonitorToggle(monitor.id)}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{monitor.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 truncate">
                          {monitor.url}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">Public</FormLabel>
                    <FormDescription>
                      Allow anyone to view this status page
                    </FormDescription>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="show_values"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">Show uptime values</FormLabel>
                    <FormDescription>
                      Display uptime percentages and response times
                    </FormDescription>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : mode === "create" ? (
              "Create Status Page"
            ) : (
              "Update Status Page"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
