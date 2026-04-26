'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Globe, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Props {
  pageId: string;
  initial: {
    custom_domain: string | null;
    custom_domain_verified: boolean;
  };
  /** Cname target the user must point their domain at, e.g. "app.pulsemon.com" */
  appHost: string;
}

export function CustomDomainCard({ pageId, initial, appHost }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [domain, setDomain] = useState(initial.custom_domain ?? '');
  const [savedDomain, setSavedDomain] = useState(initial.custom_domain ?? '');
  const [verified, setVerified] = useState(initial.custom_domain_verified);
  const [busy, setBusy] = useState<'save' | 'verify' | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const dirty = domain.trim() !== (savedDomain ?? '');

  async function save() {
    setBusy('save');
    setVerifyError(null);
    try {
      const res = await fetch(`/api/status-pages/${pageId}/domain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_domain: domain.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const json = await res.json();
      setSavedDomain(json.data.custom_domain ?? '');
      setVerified(json.data.custom_domain_verified);
      toast({
        title: 'Custom domain saved',
        description: json.data.custom_domain
          ? 'Set up DNS, then click Verify.'
          : 'Custom domain removed.',
      });
      router.refresh();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setBusy('verify');
    setVerifyError(null);
    try {
      const res = await fetch(`/api/status-pages/${pageId}/domain/verify`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.verified) {
        setVerified(true);
        toast({ title: 'Domain verified', description: 'Custom domain is now active.' });
        router.refresh();
      } else {
        setVerifyError(json.error || 'DNS check did not match.');
      }
    } catch (e: any) {
      setVerifyError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Custom domain
        </CardTitle>
        <CardDescription>
          Serve this status page on your own domain — e.g.{' '}
          <code className="rounded bg-muted px-1">status.acme.com</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-domain-input">Domain</Label>
          <div className="flex gap-2">
            <Input
              id="custom-domain-input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="status.acme.com"
              disabled={busy !== null}
            />
            <Button onClick={save} disabled={busy !== null || !dirty}>
              {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>

        {savedDomain && (
          <div className="rounded-md border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {verified ? (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Pending DNS
                  </Badge>
                )}
                <span className="font-mono text-xs">{savedDomain}</span>
              </div>
              {!verified && (
                <Button size="sm" onClick={verify} disabled={busy !== null}>
                  {busy === 'verify' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
              )}
            </div>
            {!verified && (
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Add this DNS record at your registrar:</p>
                <pre className="rounded bg-background border p-2 text-foreground overflow-x-auto">
                  {`Type:   CNAME\nName:   ${savedDomain}\nValue:  ${appHost || '(set NEXT_PUBLIC_APP_HOST in env)'}`}
                </pre>
                {verifyError && (
                  <p className="text-red-600 dark:text-red-400">{verifyError}</p>
                )}
              </div>
            )}
            {verified && (
              <p className="text-xs text-muted-foreground">
                Visit{' '}
                <a
                  href={`https://${savedDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  https://{savedDomain}
                </a>{' '}
                to see your status page.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
