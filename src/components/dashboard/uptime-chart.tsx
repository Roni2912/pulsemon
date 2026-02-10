"use client";

import { useEffect, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Check } from "@/types";

interface UptimeChartProps {
    monitorId: string;
    hours?: number; // Time range in hours (default 24)
}

interface ChartDataPoint {
    timestamp: string;
    time: string; // Formatted for display
    responseTime: number | null;
    isDown: boolean;
}

export function UptimeChart({ monitorId, hours = 24 }: UptimeChartProps) {
    const [checks, setChecks] = useState<Check[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchChecks() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/monitors/${monitorId}/checks?hours=${hours}&limit=200`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch check history");
                }

                const result = await response.json();
                setChecks(result.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchChecks();
    }, [monitorId, hours]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Response Time Chart</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <LoadingSpinner />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Chart</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (checks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Response Time Chart</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        No check data available for the selected time range
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Transform checks into chart data
    const chartData: ChartDataPoint[] = checks.map((check) => {
        const date = new Date(check.checked_at);
        return {
            timestamp: check.checked_at,
            time: date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
            responseTime: check.status === "up" ? (check.response_time || 0) : null,
            isDown: check.status === "down",
        };
    });

    // Calculate average and max for reference
    const validResponseTimes = chartData
        .filter((d) => d.responseTime !== null)
        .map((d) => d.responseTime as number);

    const avgResponseTime = validResponseTimes.length > 0
        ? Math.round(validResponseTimes.reduce((a, b) => a + b, 0) / validResponseTimes.length)
        : 0;

    const maxResponseTime = validResponseTimes.length > 0
        ? Math.max(...validResponseTimes)
        : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Response Time Chart</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Last {hours}h • Avg: {avgResponseTime}ms • Max: {maxResponseTime}ms
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="time"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            tickMargin={10}
                            minTickGap={50}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            tickMargin={10}
                            label={{
                                value: "Response Time (ms)",
                                angle: -90,
                                position: "insideLeft",
                                style: { fill: "hsl(var(--muted-foreground))" },
                            }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload || payload.length === 0) return null;

                                const data = payload[0].payload as ChartDataPoint;

                                return (
                                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {data.time}
                                        </p>
                                        {data.isDown ? (
                                            <p className="text-sm font-medium text-destructive">
                                                Service Down
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium">
                                                {data.responseTime}ms
                                            </p>
                                        )}
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="responseTime"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorResponseTime)"
                            connectNulls={false} // Show gaps for downtime
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-muted-foreground">Up (Response Time)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-transparent border-2 border-dashed border-muted rounded-full" />
                        <span className="text-muted-foreground">Down (Gap in chart)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
