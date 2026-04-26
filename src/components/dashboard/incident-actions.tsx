'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
] as const;

type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';

interface Props {
  incident: {
    id: string;
    status: IncidentStatus;
    acknowledged_at: string | null;
    public_message: string | null;
    public_visible: boolean;
  };
}

export function IncidentActions({ incident }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [newStatus, setNewStatus] = useState<IncidentStatus>(
    incident.status === 'resolved' ? 'monitoring' : 'investigating'
  );
  const [updateMessage, setUpdateMessage] = useState('');
  const [publicMessage, setPublicMessage] = useState(incident.public_message ?? '');
  const [publicVisible, setPublicVisible] = useState(incident.public_visible);

  const isResolved = incident.status === 'resolved';
  const acknowledged = incident.acknowledged_at !== null;

  async function patchIncident(payload: Record<string, any>, successMsg: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }
      toast({ title: successMsg });
      router.refresh();
      return true;
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleAcknowledge() {
    await patchIncident({ acknowledged: true }, 'Incident acknowledged');
  }

  async function submitStatus() {
    if (!updateMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Add a brief note about this status change.',
        variant: 'destructive',
      });
      return;
    }
    const ok = await patchIncident(
      { status: newStatus, message: updateMessage.trim() },
      'Status updated'
    );
    if (ok) {
      setStatusOpen(false);
      setUpdateMessage('');
    }
  }

  async function submitMessage() {
    const ok = await patchIncident(
      { public_message: publicMessage, public_visible: publicVisible },
      'Public message saved'
    );
    if (ok) setMessageOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Actions
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Incident</DropdownMenuLabel>
          {!isResolved && !acknowledged && (
            <DropdownMenuItem onClick={handleAcknowledge} disabled={busy}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Acknowledge
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setStatusOpen(true)} disabled={busy}>
            Update status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMessageOpen(true)} disabled={busy}>
            Edit public message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={statusOpen}
        onOpenChange={(next) => {
          if (busy) return;
          setStatusOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update incident status</DialogTitle>
            <DialogDescription>
              Posts a timeline entry visible to your team. If you mark public, it
              also appears on the status page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New status</Label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as IncidentStatus)}
                disabled={busy}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident-update-message">Message</Label>
              <Textarea
                id="incident-update-message"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="What's the latest? e.g. 'Database failover in progress.'"
                rows={4}
                disabled={busy}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={submitStatus} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Post update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={messageOpen}
        onOpenChange={(next) => {
          if (busy) return;
          setMessageOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Public message</DialogTitle>
            <DialogDescription>
              Shown on your public status page for this incident.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incident-public-message">Message</Label>
              <Textarea
                id="incident-public-message"
                value={publicMessage}
                onChange={(e) => setPublicMessage(e.target.value)}
                placeholder="We're aware of an issue affecting login and are working on a fix."
                rows={4}
                disabled={busy}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={publicVisible}
                onChange={(e) => setPublicVisible(e.target.checked)}
                disabled={busy}
                className="h-4 w-4"
              />
              Visible on public status page
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={submitMessage} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
