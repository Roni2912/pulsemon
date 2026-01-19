# Uptime Monitor - Implementation Roadmap

## Completed

### Step 1: Project Initialization
- [x] `package.json` - Dependencies configured
- [x] `tsconfig.json` - TypeScript configuration
- [x] `tailwind.config.ts` - Tailwind with shadcn/ui theme
- [x] `next.config.js` - Next.js configuration
- [x] `postcss.config.js` - PostCSS configuration
- [x] `components.json` - shadcn/ui configuration
- [x] `vercel.json` - Cron job configuration
- [x] `.env.local.example` - Environment variables template
- [x] `.gitignore` - Git ignore rules
- [x] `src/app/globals.css` - Global styles with CSS variables
- [x] `src/lib/utils.ts` - Utility functions (cn)
- [x] `src/lib/constants.ts` - App constants and plan limits
- [x] `src/types/index.ts` - Core TypeScript types
- [x] `src/types/api.ts` - API request/response types
- [x] `src/lib/utils/uptime.ts` - Uptime calculation helpers
- [x] `src/lib/utils/date.ts` - Date formatting helpers
- [x] `src/lib/utils/validation.ts` - Zod validation schemas
- [x] Directory structure created

---

## Remaining Steps

### Step 2: Database Schema & Migrations
Create Supabase migrations in `supabase/migrations/`:

```
00001_create_profiles.sql      - User profiles with plan info
00002_create_monitors.sql      - Monitor configurations
00003_create_checks.sql        - Check history
00004_create_incidents.sql     - Incident tracking
00005_create_alert_settings.sql - Notification preferences
00006_create_status_pages.sql  - Public status pages
00007_create_indexes.sql       - Performance indexes
```

**Key requirements:**
- Row Level Security (RLS) policies on all tables
- Trigger for auto-creating profile on signup
- `updated_at` timestamp triggers
- Foreign key relationships

---

### Step 3: Supabase Client Setup
Create client files in `src/lib/supabase/`:

```
client.ts     - Browser client (for client components)
server.ts     - Server client (for server components/actions)
admin.ts      - Service role client (for cron jobs)
middleware.ts - Auth middleware helpers
```

---

### Step 4: Authentication
Files to create:

```
src/middleware.ts                    - Next.js middleware for route protection
src/app/(auth)/layout.tsx            - Auth pages layout
src/app/(auth)/login/page.tsx        - Login page
src/app/(auth)/signup/page.tsx       - Signup page
src/app/(auth)/forgot-password/page.tsx - Password reset
```

---

### Step 5: UI Components (shadcn/ui)
Create base components in `src/components/ui/`:

```
button.tsx, input.tsx, label.tsx, card.tsx,
dialog.tsx, dropdown-menu.tsx, select.tsx,
toast.tsx, toaster.tsx, avatar.tsx, badge.tsx,
separator.tsx, skeleton.tsx, switch.tsx, tabs.tsx
```

---

### Step 6: Dashboard Layout
Files to create:

```
src/app/(dashboard)/layout.tsx
src/components/dashboard/sidebar.tsx
src/components/dashboard/header.tsx
src/components/shared/loading-spinner.tsx
src/components/shared/empty-state.tsx
```

---

### Step 7: Monitor Management
Files to create:

```
src/app/(dashboard)/page.tsx                    - Dashboard overview
src/app/(dashboard)/monitors/page.tsx           - Monitor list
src/app/(dashboard)/monitors/new/page.tsx       - Create monitor
src/app/(dashboard)/monitors/[id]/page.tsx      - Monitor details
src/app/(dashboard)/monitors/[id]/settings/page.tsx

src/components/dashboard/monitor-card.tsx
src/components/dashboard/monitor-form.tsx
src/components/dashboard/stats-card.tsx

src/app/api/monitors/route.ts                   - GET list, POST create
src/app/api/monitors/[id]/route.ts              - GET, PUT, DELETE
src/app/api/monitors/[id]/pause/route.ts
src/app/api/monitors/[id]/resume/route.ts

src/hooks/use-monitors.ts
```

---

### Step 8: Core Monitoring Logic
Files to create:

```
src/lib/monitoring/checker.ts    - Website check logic
src/lib/monitoring/scheduler.ts  - Check scheduling
src/lib/monitoring/alerts.ts     - Alert dispatching

src/app/api/cron/check/route.ts  - Cron endpoint
src/app/api/monitors/[id]/checks/route.ts
src/app/api/monitors/[id]/stats/route.ts
```

---

### Step 9: Email Alerts (Resend)
Files to create:

```
src/lib/resend/client.ts
src/lib/resend/templates/down-alert.tsx
src/lib/resend/templates/recovery-alert.tsx
```

---

### Step 10: Statistics & Charts
Files to create:

```
src/components/dashboard/uptime-chart.tsx
src/components/dashboard/response-time-chart.tsx
src/hooks/use-stats.ts
```

---

### Step 11: Incidents
Files to create:

```
src/app/(dashboard)/incidents/page.tsx
src/components/dashboard/incident-timeline.tsx
src/app/api/incidents/route.ts
```

---

### Step 12: Status Pages
Files to create:

```
src/app/(dashboard)/status-pages/page.tsx
src/app/(dashboard)/status-pages/new/page.tsx
src/app/status/[slug]/page.tsx                  - Public status page

src/components/status-page/status-header.tsx
src/components/status-page/status-monitor-row.tsx

src/app/api/status-pages/route.ts
src/app/api/status-pages/[slug]/route.ts
```

---

### Step 13: Stripe Integration
Files to create:

```
src/lib/stripe/client.ts
src/lib/stripe/checkout.ts
src/lib/stripe/webhooks.ts

src/app/(dashboard)/settings/billing/page.tsx
src/app/api/settings/billing/route.ts
src/app/api/settings/billing/portal/route.ts
src/app/api/webhooks/stripe/route.ts

src/hooks/use-subscription.ts
```

---

### Step 14: Settings & Alerts
Files to create:

```
src/app/(dashboard)/settings/page.tsx
src/app/(dashboard)/settings/alerts/page.tsx
src/app/api/settings/alerts/route.ts
```

---

### Step 15: Marketing Pages
Files to create:

```
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx          - Landing page
src/app/(marketing)/pricing/page.tsx
src/app/(marketing)/features/page.tsx

src/components/marketing/navbar.tsx
src/components/marketing/footer.tsx
src/components/marketing/hero.tsx
src/components/marketing/features.tsx
src/components/marketing/pricing-card.tsx
```

---

## Recommended Order

1. **Database** - Migrations first (foundation)
2. **Supabase clients** - Needed for all data operations
3. **Auth** - Needed before dashboard
4. **UI components** - Needed for all pages
5. **Dashboard layout** - Shell for all dashboard pages
6. **Monitors CRUD** - Core feature
7. **Monitoring logic + Cron** - Makes monitors functional
8. **Charts & Stats** - Visualize data
9. **Incidents** - Track downtime
10. **Alerts** - Notifications
11. **Status pages** - Public facing
12. **Billing** - Monetization
13. **Marketing** - Landing pages

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Generate Supabase types (after migrations)
npm run db:generate
```

---

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
1. Supabase credentials (from Supabase dashboard)
2. Stripe keys (from Stripe dashboard)
3. Resend API key (from Resend dashboard)
4. Generate a random CRON_SECRET
