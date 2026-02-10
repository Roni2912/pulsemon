"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { monitorSchema, type MonitorFormData } from "@/lib/utils/validation";
import { MONITOR_TYPES, HTTP_METHODS, CHECK_INTERVALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MonitorFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<MonitorFormData>;
  monitorId?: string;
}

export function MonitorForm({ mode, defaultValues, monitorId }: MonitorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MonitorFormData>({
    resolver: zodResolver(monitorSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      url: defaultValues?.url ?? "",
      type: defaultValues?.type ?? "https",
      method: defaultValues?.method ?? "GET",
      interval: defaultValues?.interval ?? 5,
      timeout: defaultValues?.timeout ?? 30000,
      expected_status_code: defaultValues?.expected_status_code ?? undefined,
      headers: defaultValues?.headers ?? undefined,
      body: defaultValues?.body ?? undefined,
    },
  });

  async function onSubmit(values: MonitorFormData) {
    setIsLoading(true);

    try {
      const url = mode === "create" ? "/api/monitors" : `/api/monitors/${monitorId}`;
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
          title: mode === "create" ? "Failed to create monitor" : "Failed to update monitor",
          description: result.error || "An unexpected error occurred.",
        });
        return;
      }

      toast({
        title: mode === "create" ? "Monitor created!" : "Monitor updated!",
        description: mode === "create"
          ? "Your monitor has been created and will start checking shortly."
          : "Your monitor has been updated.",
      });

      if (mode === "create") {
        router.push("/dashboard/monitors");
      } else {
        router.push(`/dashboard/monitors/${monitorId}`);
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
                <Input placeholder="My Website" disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monitor Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONITOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HTTP Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HTTP_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Interval</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  defaultValue={String(field.value)}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHECK_INTERVALS.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeout (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    disabled={isLoading}
                    value={field.value / 1000}
                    onChange={(e) => field.onChange(Number(e.target.value) * 1000)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expected_status_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Status Code (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={100}
                  max={599}
                  placeholder="200"
                  disabled={isLoading}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : mode === "create" ? (
              "Create Monitor"
            ) : (
              "Update Monitor"
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
