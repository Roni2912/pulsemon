'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Props {
  pageId: string;
  initial: {
    maintenance_mode: boolean;
    maintenance_message: string | null;
    maintenance_scheduled_start: string | null;
    maintenance_scheduled_end: string | null;
  };
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MaintenanceCard({ pageId, initial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState(initial.maintenance_mode);
  const [message, setMessage] = useState(initial.maintenance_message ?? '');
  const [start, setStart] = useState(toLocalInput(initial.maintenance_scheduled_start));
  const [end, setEnd] = useState(toLocalInput(initial.maintenance_scheduled_end));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const payload: Record<string, any> = {
        maintenance_mode: mode,
        maintenance_message: message,
      };
      payload.maintenance_scheduled_start = start ? new Date(start).toISOString() : null;
      payload.maintenance_scheduled_end = end ? new Date(end).toISOString() : null;

      const res = await fetch(`/api/status-pages/${pageId}/maintenance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      toast({ title: 'Maintenance settings saved' });
      router.refresh();
    } catch (e: any) {
      toast({
        title: 'Failed to save maintenance',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Maintenance
        </CardTitle>
        <CardDescription>
          Show a maintenance banner on the public status page. Optional schedule
          activates the banner automatically inside the window.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={mode}
            onChange={(e) => setMode(e.target.checked)}
            disabled={busy}
            className="h-4 w-4"
          />
          Maintenance banner is active now
        </label>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Message</Label>
          <Textarea
            id="maintenance-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We'll be performing scheduled maintenance from 02:00–03:00 UTC."
            rows={3}
            disabled={busy}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="maintenance-start">Scheduled start (optional)</Label>
            <Input
              id="maintenance-start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-end">Scheduled end (optional)</Label>
            <Input
              id="maintenance-end"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <Button onClick={save} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save maintenance settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
