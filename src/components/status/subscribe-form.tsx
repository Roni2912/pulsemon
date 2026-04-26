'use client';

import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  slug: string;
}

export function SubscribeForm({ slug }: Props) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/status/${encodeURIComponent(slug)}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Could not subscribe.' });
      } else {
        setMessage({
          type: 'ok',
          text: json.message || 'Check your inbox to confirm.',
        });
        setEmail('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Mail className="h-4 w-4" />
        Get notified about incidents
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !email.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </Button>
      </div>
      {message && (
        <p
          className={
            message.type === 'ok'
              ? 'text-sm text-green-600'
              : 'text-sm text-red-600'
          }
        >
          {message.text}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        We'll email you when monitors go down or recover. Unsubscribe anytime.
      </p>
    </form>
  );
}
