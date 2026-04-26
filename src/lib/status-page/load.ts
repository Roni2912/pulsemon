import { supabaseAdmin } from '@/lib/supabase/admin'
import type { MonitorWithUptime, StatusPageRow } from '@/components/status/status-page-view'

interface LoadResult {
  page: StatusPageRow
  monitors: MonitorWithUptime[]
}

export async function loadStatusPageBySlug(slug: string): Promise<LoadResult | null> {
  const { data: page } = await supabaseAdmin
    .from('status_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()
  if (!page) return null
  return loadMonitorsForPage(page as StatusPageRow)
}

export async function loadStatusPageByDomain(host: string): Promise<LoadResult | null> {
  const { data: page } = await supabaseAdmin
    .from('status_pages')
    .select('*')
    .eq('custom_domain', host.toLowerCase())
    .eq('custom_domain_verified', true)
    .eq('is_public', true)
    .single()
  if (!page) return null
  return loadMonitorsForPage(page as StatusPageRow)
}

async function loadMonitorsForPage(page: StatusPageRow): Promise<LoadResult> {
  const { data: junctionRows } = await supabaseAdmin
    .from('status_page_monitors')
    .select('monitor_id')
    .eq('status_page_id', page.id)

  const monitorIds = (junctionRows || []).map((r: any) => r.monitor_id)
  if (monitorIds.length === 0) return { page, monitors: [] }

  const { data: monitors } = await supabaseAdmin
    .from('monitors')
    .select('id, name, is_up, status, last_checked_at')
    .in('id', monitorIds)

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const monitorsWithUptime = await Promise.all(
    (monitors || []).map(async (monitor: any) => {
      const { data: checks } = await supabaseAdmin
        .from('checks')
        .select('status')
        .eq('monitor_id', monitor.id)
        .gte('created_at', cutoff)

      const totalChecks = checks?.length || 0
      const successChecks = checks?.filter((c: any) => c.status === 'success').length || 0
      const uptime = totalChecks > 0 ? Number(((successChecks / totalChecks) * 100).toFixed(2)) : 100

      return {
        id: monitor.id,
        name: monitor.name,
        isUp: monitor.status === 'active' ? monitor.is_up : null,
        status: monitor.status,
        lastCheckedAt: monitor.last_checked_at,
        uptime,
      }
    })
  )

  return { page, monitors: monitorsWithUptime }
}
