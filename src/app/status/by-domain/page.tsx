import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadStatusPageByDomain } from '@/lib/status-page/load';
import { StatusPageView } from '@/components/status/status-page-view';
import { logger } from '@/lib/logger';

export default async function PublicStatusByDomain({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; unsubscribed?: string }>;
}) {
  const sp = await searchParams;
  const h = await headers();
  const host = h.get('host')?.split(':')[0]?.toLowerCase() ?? '';

  if (!host) {
    notFound();
  }

  const result = await loadStatusPageByDomain(host);

  if (!result) {
    logger.info('CUSTOM_DOMAIN_LOOKUP_MISS', {
      context: 'status/by-domain',
      host,
    });
    notFound();
  }

  return (
    <StatusPageView
      page={result.page}
      monitors={result.monitors}
      banners={{ subscribed: sp.subscribed, unsubscribed: sp.unsubscribed }}
    />
  );
}
