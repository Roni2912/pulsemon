import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, MinusCircle, Activity } from 'lucide-react';
import { SubscribeForm } from '@/components/status/subscribe-form';

export interface StatusPageRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  show_values: boolean;
  allow_subscriptions: boolean;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_scheduled_start: string | null;
  maintenance_scheduled_end: string | null;
}

export interface MonitorWithUptime {
  id: string;
  name: string;
  isUp: boolean | null;
  status: string;
  lastCheckedAt: string | null;
  uptime: number;
}

function getUptimeColor(uptime: number): string {
  if (uptime >= 99.9) return 'text-green-500';
  if (uptime >= 99) return 'text-green-400';
  if (uptime >= 95) return 'text-yellow-500';
  if (uptime >= 90) return 'text-orange-500';
  return 'text-red-500';
}

interface Props {
  page: StatusPageRow;
  monitors: MonitorWithUptime[];
  banners: {
    subscribed?: string;
    unsubscribed?: string;
  };
}

export function StatusPageView({ page, monitors, banners }: Props) {
  const allUp = monitors.length > 0 && monitors.every((m) => m.isUp === true);
  const someDown = monitors.some((m) => m.isUp === false);

  const now = Date.now();
  const scheduledStart = page.maintenance_scheduled_start
    ? new Date(page.maintenance_scheduled_start).getTime()
    : null;
  const scheduledEnd = page.maintenance_scheduled_end
    ? new Date(page.maintenance_scheduled_end).getTime()
    : null;
  const inScheduledWindow =
    scheduledStart !== null && scheduledEnd !== null && now >= scheduledStart && now <= scheduledEnd;
  const inMaintenance = page.maintenance_mode || inScheduledWindow;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        {inMaintenance && (
          <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950 p-4 text-amber-900 dark:text-amber-100">
            <div className="font-semibold">Scheduled maintenance</div>
            {page.maintenance_message && (
              <p className="mt-1 text-sm">{page.maintenance_message}</p>
            )}
            {page.maintenance_scheduled_start && page.maintenance_scheduled_end && (
              <p className="mt-2 text-xs opacity-80">
                {new Date(page.maintenance_scheduled_start).toLocaleString()} —{' '}
                {new Date(page.maintenance_scheduled_end).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{page.name}</h1>
          {page.description && (
            <p className="text-muted-foreground">{page.description}</p>
          )}

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

        <div className="space-y-3">
          {monitors.map((monitor) => (
            <Card key={monitor.id}>
              <CardContent className="flex items-center justify-between py-4 px-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      monitor.isUp === true
                        ? 'bg-green-500'
                        : monitor.isUp === false
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium">{monitor.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  {page.show_values && (
                    <span
                      className={`text-sm font-medium ${getUptimeColor(monitor.uptime)}`}
                    >
                      {monitor.uptime.toFixed(2)}%
                    </span>
                  )}
                  <Badge
                    variant={
                      monitor.isUp === true
                        ? 'default'
                        : monitor.isUp === false
                          ? 'destructive'
                          : 'secondary'
                    }
                    className={
                      monitor.isUp === true
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : monitor.isUp === false
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : ''
                    }
                  >
                    {monitor.isUp === true
                      ? 'Operational'
                      : monitor.isUp === false
                        ? 'Down'
                        : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(banners.subscribed === 'ok' ||
          banners.subscribed === 'already' ||
          banners.unsubscribed === 'ok' ||
          banners.unsubscribed === 'already') && (
          <div className="mt-8 rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-4 text-sm text-green-800 dark:text-green-200">
            {banners.subscribed === 'ok' &&
              'Subscription confirmed. You will be notified about incidents.'}
            {banners.subscribed === 'already' && 'You are already subscribed.'}
            {banners.unsubscribed === 'ok' && 'You have been unsubscribed.'}
            {banners.unsubscribed === 'already' && 'You were already unsubscribed.'}
          </div>
        )}

        {page.allow_subscriptions && (
          <div className="mt-10 rounded-lg border bg-card p-6">
            <SubscribeForm slug={page.slug} />
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          Powered by{' '}
          <Link href="/" className="font-medium hover:underline">
            PulseMon
          </Link>
        </div>
      </div>
    </div>
  );
}
