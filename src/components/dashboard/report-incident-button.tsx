'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Severity = 'minor' | 'major' | 'critical';
type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring';

interface MonitorOption {
  id: string;
  name: string;
}

const EMPTY = {
  monitor_id: '',
  title: '',
  description: '',
  severity: 'major' as Severity,
  status: 'investigating' as IncidentStatus,
  public_message: '',
  public_visible: true,
};

export function ReportIncidentButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [monitors, setMonitors] = useState<MonitorOption[]>([]);
  const [draft, setDraft] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/monitors')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json.data ?? []).map((m: any) => ({ id: m.id, name: m.name }));
        setMonitors(list);
        if (list.length > 0 && !draft.monitor_id) {
          setDraft((d) => ({ ...d, monitor_id: list[0].id }));
        }
      })
      .catch(() => {
        toast({ title: 'Could not load monitors', variant: 'destructive' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit() {
    if (!draft.monitor_id) {
      toast({ title: 'Pick a monitor', variant: 'destructive' });
      return;
    }
    if (!draft.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitor_id: draft.monitor_id,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          severity: draft.severity,
          status: draft.status,
          public_message: draft.public_message.trim() || null,
          public_visible: draft.public_visible,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Could not create incident');
      }
      toast({ title: 'Incident reported' });
      setOpen(false);
      setDraft(EMPTY);
      router.refresh();
    } catch (e: any) {
      toast({
        title: 'Failed to create incident',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Report incident
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (busy) return;
          setOpen(next);
          if (!next) setDraft(EMPTY);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report incident</DialogTitle>
            <DialogDescription>
              Manually create an incident — useful for planned outages or issues
              the auto-detector hasn&apos;t seen yet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monitor</Label>
              {monitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading monitors...</p>
              ) : (
                <Select
                  value={draft.monitor_id}
                  onValueChange={(v) => setDraft((d) => ({ ...d, monitor_id: v }))}
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a monitor" />
                  </SelectTrigger>
                  <SelectContent>
                    {monitors.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident-title">Title</Label>
              <Input
                id="incident-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="API returning 500s"
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident-description">Description</Label>
              <Textarea
                id="incident-description"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What's happening, how it surfaced, current scope..."
                rows={3}
                disabled={busy}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={draft.severity}
                  onValueChange={(v) => setDraft((d) => ({ ...d, severity: v as Severity }))}
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Initial status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft((d) => ({ ...d, status: v as IncidentStatus }))}
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident-public-message">Public message (optional)</Label>
              <Textarea
                id="incident-public-message"
                value={draft.public_message}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, public_message: e.target.value }))
                }
                placeholder="What should the public status page say?"
                rows={2}
                disabled={busy}
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.public_visible}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, public_visible: e.target.checked }))
                }
                disabled={busy}
                className="h-4 w-4"
              />
              Show on public status page (also notifies subscribers)
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                'Report incident'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
