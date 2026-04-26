'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';

export interface SubscriberRow {
  id: string;
  email: string;
  confirmed: boolean;
  unsubscribed: boolean;
  created_at: string;
  confirmed_at: string | null;
}

interface Props {
  pageId: string;
  subscribers: SubscriberRow[];
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}

export function SubscribersList({ pageId, subscribers }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<SubscriberRow | null>(null);

  const confirmedCount = subscribers.filter((s) => s.confirmed && !s.unsubscribed).length;
  const pendingCount = subscribers.filter((s) => !s.confirmed && !s.unsubscribed).length;
  const unsubscribedCount = subscribers.filter((s) => s.unsubscribed).length;

  async function performRemove() {
    if (!pendingDelete) return;
    const target = pendingDelete;

    const res = await fetch(
      `/api/status-pages/${pageId}/subscribers/${target.id}`,
      { method: 'DELETE' }
    );

    if (!res.ok) {
      toast({
        title: 'Failed to remove subscriber',
        variant: 'destructive',
      });
      throw new Error('failed');
    }

    toast({ title: 'Subscriber removed' });
    setPendingDelete(null);
    router.refresh();
  }

  if (subscribers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one has subscribed yet. Share your public status page to invite signups.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {confirmedCount} confirmed
        </Badge>
        {pendingCount > 0 && (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            {pendingCount} pending
          </Badge>
        )}
        {unsubscribedCount > 0 && (
          <Badge variant="outline">
            <XCircle className="mr-1 h-3 w-3" />
            {unsubscribedCount} unsubscribed
          </Badge>
        )}
      </div>

      <div className="border rounded-md divide-y">
        {subscribers.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <div className="font-mono truncate">{maskEmail(sub.email)}</div>
              <div className="text-xs text-muted-foreground">
                {sub.unsubscribed
                  ? 'Unsubscribed'
                  : sub.confirmed
                    ? `Confirmed ${sub.confirmed_at ? new Date(sub.confirmed_at).toLocaleDateString() : ''}`
                    : `Pending since ${new Date(sub.created_at).toLocaleDateString()}`}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingDelete(sub)}
              aria-label={`Remove ${sub.email}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Remove subscriber?"
        description={
          pendingDelete ? (
            <>
              Remove <span className="font-mono">{maskEmail(pendingDelete.email)}</span>{' '}
              from this status page. They will not receive future incident
              notifications.
            </>
          ) : null
        }
        confirmText="Remove"
        variant="destructive"
        onConfirm={performRemove}
      />
    </div>
  );
}
