"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TrendingUp, Clock, Activity, AlertTriangle } from "lucide-react";
import type { MonitorStats } from "@/types";
import { getUptimeColor, formatUptime, formatResponseTime } from "@/lib/utils/uptime";

interface MonitorStatsDisplayProps {
    monitorId: string;
}

export function MonitorStatsDisplay({ monitorId }: MonitorStatsDisplayProps) {
    const [stats, setStats] = useState<MonitorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/monitors/${monitorId}/stats`);

                if (!response.ok) {
                    throw new Error("Failed to fetch statistics");
                }

                const result = await response.json();
                setStats(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [monitorId]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LoadingSpinner />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !stats) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Loading Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error || "Failed to load statistics"}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 24h Uptime */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getUptimeColor(stats.uptime_24h)}`}>
                        {formatUptime(stats.uptime_24h)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.total_checks_24h} checks
                    </p>
                </CardContent>
            </Card>

            {/* 7d Uptime */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime (7d)</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getUptimeColor(stats.uptime_7d)}`}>
                        {formatUptime(stats.uptime_7d)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Last 7 days
                    </p>
                </CardContent>
            </Card>

            {/* 30d Uptime */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${getUptimeColor(stats.uptime_30d)}`}>
                        {formatUptime(stats.uptime_30d)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.total_incidents_30d} incidents
                    </p>
                </CardContent>
            </Card>

            {/* Avg Response Time */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response (24h)</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.avg_response_time_24h > 0
                            ? formatResponseTime(stats.avg_response_time_24h)
                            : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Average response time
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
