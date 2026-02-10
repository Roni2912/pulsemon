# PulseMon - API Routes & Page Structure

Quick reference for all API endpoints and page files to avoid re-exploring the codebase.

## API Routes

### Monitors

| Method | Endpoint | File | Description |
|--------|----------|------|-------------|
| GET | `/api/monitors` | `src/app/api/monitors/route.ts` | List all monitors for authenticated user |
| POST | `/api/monitors` | `src/app/api/monitors/route.ts` | Create a new monitor |
| GET | `/api/monitors/[id]` | `src/app/api/monitors/[id]/route.ts` | Get single monitor with recent checks (last 20) |
| PATCH | `/api/monitors/[id]` | `src/app/api/monitors/[id]/route.ts` | Update monitor fields |
| DELETE | `/api/monitors/[id]` | `src/app/api/monitors/[id]/route.ts` | Delete monitor (cascade) |

### Other API Routes (scaffolded, not yet implemented)

| Endpoint | File | Status |
|----------|------|--------|
| `/api/checks` | `src/app/api/checks/route.ts` | Stub (501) |
| `/api/incidents` | `src/app/api/incidents/route.ts` | Stub (501) |
| `/api/status-pages` | `src/app/api/status-pages/route.ts` | Stub (501) |
| `/api/settings` | `src/app/api/settings/route.ts` | Stub (501) |
| `/api/billing` | `src/app/api/billing/route.ts` | Stub (501) |
| POST `/api/cron/check-monitors` | `src/app/api/cron/check-monitors/route.ts` | Run monitor checks (auth via CRON_SECRET header) |
| `/api/webhooks` | `src/app/api/webhooks/route.ts` | Stub (501) |

## Dashboard Pages

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `src/app/dashboard/page.tsx` | Overview with stats cards + recent monitors |
| `/dashboard/monitors` | `src/app/dashboard/monitors/page.tsx` | Monitor list with "Add Monitor" button |
| `/dashboard/monitors/new` | `src/app/dashboard/monitors/new/page.tsx` | Create monitor form |
| `/dashboard/monitors/[id]` | `src/app/dashboard/monitors/[id]/page.tsx` | Monitor detail (stats, info, recent checks) |
| `/dashboard/monitors/[id]/edit` | `src/app/dashboard/monitors/[id]/edit/page.tsx` | Edit monitor form (pre-filled) |

## Key Components

| Component | File | Used By |
|-----------|------|---------|
| `MonitorForm` | `src/components/dashboard/monitor-form.tsx` | New + Edit pages |
| `MonitorCard` | `src/components/dashboard/monitor-card.tsx` | MonitorList |
| `MonitorList` | `src/components/dashboard/monitor-list.tsx` | Dashboard + Monitors page |
| `StatsCard` | `src/components/dashboard/stats-card.tsx` | Dashboard + Monitor detail |
| `DeleteMonitorButton` | `src/app/dashboard/monitors/[id]/delete-button.tsx` | Monitor detail page |
| `EmptyState` | `src/components/ui/empty-state.tsx` | Multiple pages |

## Type Mapping (Frontend vs Database)

The frontend types (`src/types/index.ts`) differ from the Supabase DB schema (`src/types/supabase.ts`). API routes handle the conversion:

| Frontend Field | DB Field | Conversion |
|----------------|----------|------------|
| `interval` (minutes) | `interval_seconds` | `interval * 60` |
| `timeout` (ms) | `timeout_seconds` | `timeout / 1000` |
| `status` (up/down/paused/pending) | `status` (active/paused/error) + `is_up` (bool) | See `mapDbToMonitor()` |
| `expected_status_code` (number) | `expected_status_codes` (array) | `[code]` |

## Supabase Clients

| Client | File | Usage |
|--------|------|-------|
| Server | `src/lib/supabase/server.ts` | Server components, API routes |
| Browser | `src/lib/supabase/client.ts` | Client components |
| Admin | `src/lib/supabase/admin.ts` | Service role (bypasses RLS), cron jobs |

> Note: `<Database>` generic was removed from all clients due to type version mismatch. Operations are untyped at the Supabase level but validated via Zod schemas and manual mapping.

## Validation

| Schema | File | Used For |
|--------|------|----------|
| `monitorSchema` | `src/lib/utils/validation.ts` | Create/edit monitor forms + API validation |
| `statusPageSchema` | `src/lib/utils/validation.ts` | Status page forms (future) |
| `alertSettingsSchema` | `src/lib/utils/validation.ts` | Alert settings (future) |

## Auth Pattern

Currently using mock user ID `00000000-0000-0000-0000-000000000000` in server components (dashboard pages). API routes use `getUser()` from `src/lib/supabase/server.ts` for real auth.
