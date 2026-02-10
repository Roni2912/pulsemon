'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Mail, Trash2, Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AlertSetting {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  events: string[];
  channel: string;
  frequency: string;
  max_alerts_per_hour: number;
  monitor_id: string | null;
  created_at: string;
}

export function AlertSettingsForm() {
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error('Error fetching alert settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alert settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function createDefaultSetting() {
    setCreating(true);
    try {
      const response = await fetch('/api/settings/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Email Alerts',
          description: 'Receive email notifications for monitor events',
          events: ['monitor_down', 'monitor_up'],
          channel: 'email',
          frequency: 'immediate',
          max_alerts_per_hour: 10,
          is_enabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create alert setting');
      }

      toast({
        title: 'Success',
        description: 'Alert setting created successfully',
      });

      await fetchSettings();
    } catch (error: any) {
      console.error('Error creating alert setting:', error);
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
        body: JSON.stringify({
          id,
          is_enabled: !currentState,
        }),
      });

      if (!response.ok) throw new Error('Failed to update setting');

      toast({
        title: 'Success',
        description: `Alerts ${!currentState ? 'enabled' : 'disabled'}`,
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error toggling alert setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert setting',
        variant: 'destructive',
      });
    }
  }

  async function deleteSetting(id: string) {
    if (!confirm('Are you sure you want to delete this alert setting?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete setting');

      toast({
        title: 'Success',
        description: 'Alert setting deleted',
      });

      await fetchSettings();
    } catch (error) {
      console.error('Error deleting alert setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert setting',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
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
        <Button onClick={createDefaultSetting} disabled={creating}>
          <Plus className="h-4 w-4 mr-2" />
          {creating ? 'Creating...' : 'Add Alert'}
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
              <Button onClick={createDefaultSetting} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? 'Creating...' : 'Create Alert Setting'}
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
                      {setting.channel === 'email' && <Mail className="h-5 w-5 text-muted-foreground" />}
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
                      onClick={() => deleteSetting(setting.id)}
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

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Alerts will be sent to the email address associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Alert Types</Label>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Monitor Down:</strong> Sent when a monitor fails a check</li>
                <li>• <strong>Monitor Up:</strong> Sent when a monitor recovers</li>
              </ul>
            </div>
            <div>
              <Label>Rate Limiting</Label>
              <p className="mt-2 text-sm text-muted-foreground">
                To prevent alert fatigue, you can set a maximum number of alerts per hour.
                Additional alerts will be queued until the next hour.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
