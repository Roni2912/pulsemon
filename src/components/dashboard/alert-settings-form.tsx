'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellOff,
  Mail,
  Trash2,
  Plus,
  Slack,
  Webhook,
  Loader2,
} from 'lucide-react';

type Channel = 'email' | 'slack' | 'webhook';

interface AlertSetting {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  events: string[];
  channel: Channel;
  channel_config: Record<string, any> | null;
  frequency: string;
  max_alerts_per_hour: number;
  monitor_id: string | null;
  created_at: string;
}

const ALL_EVENTS = [
  { value: 'monitor_down', label: 'Monitor goes down' },
  { value: 'monitor_up', label: 'Monitor recovers' },
] as const;

interface NewAlertDraft {
  name: string;
  channel: Channel;
  events: string[];
  max_alerts_per_hour: number;
  // email
  email_to: string;
  // slack
  slack_webhook_url: string;
  slack_channel: string;
  // webhook
  webhook_url: string;
  webhook_secret: string;
}

const EMPTY_DRAFT: NewAlertDraft = {
  name: '',
  channel: 'email',
  events: ['monitor_down', 'monitor_up'],
  max_alerts_per_hour: 10,
  email_to: '',
  slack_webhook_url: '',
  slack_channel: '',
  webhook_url: '',
  webhook_secret: '',
};

export function AlertSettingsForm() {
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [pendingDelete, setPendingDelete] = useState<AlertSetting | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<NewAlertDraft>(EMPTY_DRAFT);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings/alerts');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data.settings || []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load alert settings',
        variant: 'destructive',
      });
    }
  }

  function openCreateDialog() {
    setDraft(EMPTY_DRAFT);
    setCreateOpen(true);
  }

  function buildChannelConfig(d: NewAlertDraft) {
    if (d.channel === 'email') {
      return d.email_to.trim() ? { to: d.email_to.trim() } : {};
    }
    if (d.channel === 'slack') {
      const cfg: Record<string, string> = { webhook_url: d.slack_webhook_url.trim() };
      if (d.slack_channel.trim()) cfg.channel = d.slack_channel.trim();
      return cfg;
    }
    if (d.channel === 'webhook') {
      const cfg: Record<string, string> = { url: d.webhook_url.trim() };
      if (d.webhook_secret.trim()) cfg.secret = d.webhook_secret.trim();
      return cfg;
    }
    return {};
  }

  function validateDraft(d: NewAlertDraft): string | null {
    if (!d.name.trim()) return 'Name is required';
    if (d.events.length === 0) return 'Select at least one event';
    if (d.channel === 'slack') {
      if (!d.slack_webhook_url.trim()) return 'Slack webhook URL is required';
      if (!d.slack_webhook_url.startsWith('https://hooks.slack.com/')) {
        return 'Slack webhook must be a hooks.slack.com URL';
      }
    }
    if (d.channel === 'webhook') {
      if (!d.webhook_url.trim()) return 'Webhook URL is required';
      try {
        new URL(d.webhook_url);
      } catch {
        return 'Webhook URL is not valid';
      }
    }
    return null;
  }

  async function submitCreate() {
    const validationError = validateDraft(draft);
    if (validationError) {
      toast({ title: 'Invalid input', description: validationError, variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          events: draft.events,
          channel: draft.channel,
          channel_config: buildChannelConfig(draft),
          frequency: 'immediate',
          max_alerts_per_hour: draft.max_alerts_per_hour,
          is_enabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create alert setting');
      }

      toast({
        title: 'Alert created',
        description: `"${draft.name.trim()}" is now active.`,
      });

      setCreateOpen(false);
      setDraft(EMPTY_DRAFT);
      await fetchSettings();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create alert setting',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  async function toggleSetting(id: string, currentState: boolean) {
    try {
      const response = await fetch('/api/settings/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_enabled: !currentState }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      toast({
        title: 'Updated',
        description: `Alerts ${!currentState ? 'enabled' : 'disabled'}`,
      });

      await fetchSettings();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update alert setting',
        variant: 'destructive',
      });
    }
  }

  async function performDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;

    const response = await fetch(`/api/settings/alerts?id=${target.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert setting',
        variant: 'destructive',
      });
      throw new Error('Failed'); // keep modal open
    }

    toast({
      title: 'Alert deleted',
      description: `"${target.name}" has been removed.`,
    });

    setPendingDelete(null);
    await fetchSettings();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Settings</h2>
          <p className="text-muted-foreground mt-1">
            Configure how you want to be notified about monitor events
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Alert
        </Button>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No alert settings configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alert setting to receive notifications
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert Setting
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <ChannelIcon channel={setting.channel} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {setting.name}
                        {setting.is_enabled ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </CardTitle>
                      {setting.description && (
                        <CardDescription className="mt-1">{setting.description}</CardDescription>
                      )}
                      <ChannelTarget channel={setting.channel} config={setting.channel_config} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSetting(setting.id, setting.is_enabled)}
                    >
                      {setting.is_enabled ? (
                        <>
                          <BellOff className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDelete(setting)}
                      aria-label={`Delete alert "${setting.name}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Channel</Label>
                    <p className="font-medium capitalize">{setting.channel}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Frequency</Label>
                    <p className="font-medium capitalize">{setting.frequency.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Alerts/Hour</Label>
                    <p className="font-medium">{setting.max_alerts_per_hour}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Events</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {setting.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          if (creating) return;
          setCreateOpen(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New alert setting</DialogTitle>
            <DialogDescription>
              Choose a channel and the events you want to be notified about.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-name">Name</Label>
              <Input
                id="alert-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="On-call email"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={draft.channel}
                onValueChange={(value) => setDraft((d) => ({ ...d, channel: value as Channel }))}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {draft.channel === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="alert-email-to">Send to (optional)</Label>
                <Input
                  id="alert-email-to"
                  type="email"
                  value={draft.email_to}
                  onChange={(e) => setDraft((d) => ({ ...d, email_to: e.target.value }))}
                  placeholder="Defaults to your account email"
                  disabled={creating}
                />
              </div>
            )}

            {draft.channel === 'slack' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alert-slack-url">Slack webhook URL</Label>
                  <Input
                    id="alert-slack-url"
                    value={draft.slack_webhook_url}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, slack_webhook_url: e.target.value }))
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create one at{' '}
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      api.slack.com/apps
                    </a>{' '}
                    → Incoming Webhooks.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-slack-channel">Override channel (optional)</Label>
                  <Input
                    id="alert-slack-channel"
                    value={draft.slack_channel}
                    onChange={(e) => setDraft((d) => ({ ...d, slack_channel: e.target.value }))}
                    placeholder="#alerts"
                    disabled={creating}
                  />
                </div>
              </>
            )}

            {draft.channel === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alert-webhook-url">Webhook URL</Label>
                  <Input
                    id="alert-webhook-url"
                    value={draft.webhook_url}
                    onChange={(e) => setDraft((d) => ({ ...d, webhook_url: e.target.value }))}
                    placeholder="https://your-service.example.com/hooks/pulsemon"
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-webhook-secret">Signing secret (optional)</Label>
                  <Input
                    id="alert-webhook-secret"
                    type="password"
                    value={draft.webhook_secret}
                    onChange={(e) => setDraft((d) => ({ ...d, webhook_secret: e.target.value }))}
                    placeholder="Used to compute X-PulseMon-Signature"
                    disabled={creating}
                  />
                  <p className="text-xs text-muted-foreground">
                    When set, requests are signed with HMAC-SHA256 of the body in
                    the <code>X-PulseMon-Signature</code> header.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="flex flex-col gap-2">
                {ALL_EVENTS.map((evt) => {
                  const checked = draft.events.includes(evt.value);
                  return (
                    <label
                      key={evt.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={creating}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            events: e.target.checked
                              ? [...d.events, evt.value]
                              : d.events.filter((v) => v !== evt.value),
                          }))
                        }
                      />
                      {evt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-rate">Max alerts per hour</Label>
              <Input
                id="alert-rate"
                type="number"
                min={1}
                max={100}
                value={draft.max_alerts_per_hour}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    max_alerts_per_hour: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                disabled={creating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create alert'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete alert setting?"
        description={
          pendingDelete ? (
            <>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                &ldquo;{pendingDelete.name}&rdquo;
              </span>
              . You will stop receiving notifications via this channel until you create a new one.
            </>
          ) : null
        }
        confirmText="Delete"
        variant="destructive"
        onConfirm={performDelete}
      />
    </div>
  );
}

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === 'email') return <Mail className="h-5 w-5 text-muted-foreground" />;
  if (channel === 'slack') return <Slack className="h-5 w-5 text-muted-foreground" />;
  if (channel === 'webhook') return <Webhook className="h-5 w-5 text-muted-foreground" />;
  return null;
}

function ChannelTarget({
  channel,
  config,
}: {
  channel: Channel;
  config: Record<string, any> | null;
}) {
  if (!config) return null;
  let target = '';
  if (channel === 'email') target = config.to || '(account email)';
  else if (channel === 'slack') target = maskUrl(config.webhook_url);
  else if (channel === 'webhook') target = maskUrl(config.url);
  if (!target) return null;
  return (
    <p className="mt-1 text-xs text-muted-foreground font-mono">{target}</p>
  );
}

function maskUrl(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.split('/').slice(0, 3).join('/')}/…`;
  } catch {
    return url.slice(0, 32) + '…';
  }
}
