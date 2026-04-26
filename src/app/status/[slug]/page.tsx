import { notFound } from 'next/navigation';
import { loadStatusPageBySlug } from '@/lib/status-page/load';
import { StatusPageView } from '@/components/status/status-page-view';

export default async function PublicStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subscribed?: string; unsubscribed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const result = await loadStatusPageBySlug(slug);

  if (!result) {
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
