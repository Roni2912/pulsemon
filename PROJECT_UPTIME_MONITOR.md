# Project: Uptime Monitor SaaS

> Ship in 3-4 weeks. Get 10 paying customers. Grow from there.

---

## Project Overview

**Name Ideas:** PingRadar, UptimeBeacon, StatusPulse, WatchTower

**One-liner:** Simple, affordable website monitoring that alerts you when your site goes down.

**Target Users:**
- Indie hackers with side projects
- Small business owners
- Freelance developers managing client sites
- Startups (early stage)

**Why they'll pay you instead of UptimeRobot:**
- Cleaner UI (modern design)
- Simpler pricing (no confusing tiers)
- Better status pages (shareable)
- Faster setup (< 2 minutes)

---

## Tech Stack

```
Frontend:       Next.js 14 (App Router) + TypeScript
Styling:        Tailwind CSS + shadcn/ui
Database:       PostgreSQL via Supabase
Auth:           Supabase Auth (or NextAuth)
Scheduling:     Vercel Cron (free) + Supabase Edge Functions
Email:          Resend
Payments:       Stripe
Hosting:        Vercel
Analytics:      Plausible (or PostHog)
```

### Why This Stack?
- **Supabase**: Free tier is generous, handles DB + Auth + Edge Functions
- **Vercel Cron**: Free, runs every minute
- **Resend**: Free 100 emails/day, great DX
- **Total cost**: $0/month until you scale

---

## Database Schema

```sql
-- Users table (handled by Supabase Auth, but extended)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free', 'basic', 'pro'
  stripe_customer_id TEXT,
  monitors_limit INT DEFAULT 3,
  check_interval INT DEFAULT 5, -- minutes
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monitors (websites to check)
CREATE TABLE monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET', -- GET, POST, HEAD
  expected_status INT DEFAULT 200,
  timeout INT DEFAULT 10, -- seconds
  interval INT DEFAULT 5, -- minutes (1, 5, 15)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Check results (history)
CREATE TABLE checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'up', 'down'
  response_time INT, -- milliseconds
  status_code INT,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT NOW()
);

-- Incidents (when site goes down)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP, -- NULL if ongoing
  cause TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alert settings
CREATE TABLE alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  slack_webhook TEXT,
  alert_after_failures INT DEFAULT 2, -- alert after X consecutive failures
  created_at TIMESTAMP DEFAULT NOW()
);

-- Status pages (public)
CREATE TABLE status_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL, -- yourcompany.statuspage.com/slug
  title TEXT NOT NULL,
  description TEXT,
  monitors UUID[], -- array of monitor IDs to show
  is_public BOOLEAN DEFAULT true,
  custom_domain TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_checks_monitor_id ON checks(monitor_id);
CREATE INDEX idx_checks_checked_at ON checks(checked_at DESC);
CREATE INDEX idx_monitors_user_id ON monitors(user_id);
CREATE INDEX idx_monitors_is_active ON monitors(is_active);
```

---

## API Endpoints

### Auth (Supabase handles this)
```
POST   /auth/signup          - Register
POST   /auth/login           - Login
POST   /auth/logout          - Logout
POST   /auth/forgot-password - Reset password
```

### Monitors
```
GET    /api/monitors              - List user's monitors
POST   /api/monitors              - Create monitor
GET    /api/monitors/:id          - Get monitor details
PUT    /api/monitors/:id          - Update monitor
DELETE /api/monitors/:id          - Delete monitor
POST   /api/monitors/:id/pause    - Pause monitoring
POST   /api/monitors/:id/resume   - Resume monitoring
```

### Checks & Stats
```
GET    /api/monitors/:id/checks   - Get check history (paginated)
GET    /api/monitors/:id/stats    - Get uptime stats (24h, 7d, 30d)
```

### Incidents
```
GET    /api/incidents             - List all incidents
GET    /api/monitors/:id/incidents - Get monitor's incidents
```

### Status Pages
```
GET    /api/status-pages          - List user's status pages
POST   /api/status-pages          - Create status page
GET    /api/status-pages/:slug    - Get public status page
PUT    /api/status-pages/:id      - Update status page
DELETE /api/status-pages/:id      - Delete status page
```

### Settings
```
GET    /api/settings/alerts       - Get alert settings
PUT    /api/settings/alerts       - Update alert settings
GET    /api/settings/billing      - Get billing info
POST   /api/settings/billing/portal - Get Stripe portal URL
```

### Webhooks
```
POST   /api/webhooks/stripe       - Handle Stripe events
```

### Internal (Cron)
```
POST   /api/cron/check            - Run checks (called by Vercel Cron)
```

---

## Project Structure

```
uptime-monitor/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── page.tsx             # Dashboard home (overview)
│   │   │   ├── monitors/
│   │   │   │   ├── page.tsx         # List monitors
│   │   │   │   ├── new/page.tsx     # Create monitor
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # Monitor details
│   │   │   │       └── settings/page.tsx
│   │   │   ├── incidents/page.tsx   # Incidents list
│   │   │   ├── status-pages/
│   │   │   │   ├── page.tsx         # List status pages
│   │   │   │   └── new/page.tsx     # Create status page
│   │   │   └── settings/
│   │   │       ├── page.tsx         # General settings
│   │   │       ├── alerts/page.tsx  # Alert configuration
│   │   │       └── billing/page.tsx # Subscription management
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx           # Marketing layout
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── pricing/page.tsx     # Pricing page
│   │   │   └── features/page.tsx    # Features page
│   │   ├── status/
│   │   │   └── [slug]/page.tsx      # Public status page
│   │   ├── api/
│   │   │   ├── monitors/route.ts
│   │   │   ├── cron/check/route.ts
│   │   │   └── webhooks/stripe/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MonitorCard.tsx
│   │   │   ├── UptimeChart.tsx
│   │   │   ├── IncidentTimeline.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── marketing/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── PricingCard.tsx
│   │   │   └── FeatureSection.tsx
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser client
│   │   │   ├── server.ts            # Server client
│   │   │   └── middleware.ts        # Auth middleware
│   │   ├── stripe.ts                # Stripe helpers
│   │   ├── resend.ts                # Email helpers
│   │   ├── monitor.ts               # Monitoring logic
│   │   └── utils.ts                 # General utilities
│   ├── hooks/
│   │   ├── useMonitors.ts
│   │   ├── useStats.ts
│   │   └── useUser.ts
│   └── types/
│       └── index.ts                 # TypeScript types
├── supabase/
│   ├── migrations/                  # Database migrations
│   └── functions/                   # Edge functions (optional)
├── public/
├── .env.local
├── package.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## Features by Phase

### Phase 1: MVP (Week 1-2)
Core monitoring that works.

- [ ] Landing page (simple, explains value)
- [ ] User signup/login (Supabase Auth)
- [ ] Dashboard layout with sidebar
- [ ] Add monitor (URL, name)
- [ ] List monitors with status (up/down)
- [ ] Basic check logic (fetch URL, record result)
- [ ] Cron job running every 5 minutes
- [ ] Email alert when site goes down
- [ ] Monitor detail page with last 24h history

### Phase 2: Polish (Week 3)
Make it usable and sellable.

- [ ] Uptime percentage calculation (24h, 7d, 30d)
- [ ] Response time chart
- [ ] Incident tracking (auto-create when down)
- [ ] Public status page
- [ ] Stripe integration (subscriptions)
- [ ] Pricing page
- [ ] Plan limits enforcement
- [ ] Settings page

### Phase 3: Growth (Week 4+)
Features that differentiate.

- [ ] Slack notifications
- [ ] Multiple alert recipients
- [ ] Custom check intervals (1min for pro)
- [ ] Pause/resume monitors
- [ ] Bulk actions
- [ ] Export data (CSV)
- [ ] API access for pro users
- [ ] Custom domains for status pages

---

## Core Monitoring Logic

```typescript
// lib/monitor.ts

interface CheckResult {
  status: 'up' | 'down';
  responseTime: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function checkWebsite(url: string, timeout = 10000): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'HEAD', // Faster than GET
      signal: controller.signal,
      headers: {
        'User-Agent': 'UptimeMonitor/1.0'
      }
    });

    clearTimeout(timeoutId);

    return {
      status: response.ok ? 'up' : 'down',
      responseTime: Date.now() - start,
      statusCode: response.status,
      errorMessage: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    clearTimeout(timeoutId);

    return {
      status: 'down',
      responseTime: null,
      statusCode: null,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

```typescript
// app/api/cron/check/route.ts

import { createClient } from '@/lib/supabase/server';
import { checkWebsite } from '@/lib/monitor';
import { sendDownAlert } from '@/lib/resend';

export async function POST(request: Request) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // Get all active monitors
  const { data: monitors } = await supabase
    .from('monitors')
    .select('*, profiles(email, plan)')
    .eq('is_active', true);

  if (!monitors) return Response.json({ checked: 0 });

  // Check each monitor
  const results = await Promise.all(
    monitors.map(async (monitor) => {
      const result = await checkWebsite(monitor.url);

      // Save check result
      await supabase.from('checks').insert({
        monitor_id: monitor.id,
        status: result.status,
        response_time: result.responseTime,
        status_code: result.statusCode,
        error_message: result.errorMessage
      });

      // Handle down status
      if (result.status === 'down') {
        // Check if already in incident
        const { data: activeIncident } = await supabase
          .from('incidents')
          .select()
          .eq('monitor_id', monitor.id)
          .is('ended_at', null)
          .single();

        if (!activeIncident) {
          // Create new incident
          await supabase.from('incidents').insert({
            monitor_id: monitor.id,
            started_at: new Date().toISOString(),
            cause: result.errorMessage
          });

          // Send alert email
          await sendDownAlert(monitor.profiles.email, monitor);
        }
      } else {
        // Close any open incident
        await supabase
          .from('incidents')
          .update({ ended_at: new Date().toISOString() })
          .eq('monitor_id', monitor.id)
          .is('ended_at', null);
      }

      return { monitor: monitor.id, result };
    })
  );

  return Response.json({ checked: results.length });
}
```

---

## Pricing Structure

| Plan | Price | Monitors | Check Interval | Features |
|------|-------|----------|----------------|----------|
| Free | $0 | 3 | 5 min | Email alerts |
| Basic | $5/mo | 20 | 3 min | + Status page |
| Pro | $15/mo | 100 | 1 min | + Slack, API, Custom domain |
| Team | $39/mo | Unlimited | 30 sec | + Multiple users, Priority |

---

## Day-by-Day Build Plan

### Week 1: Foundation

**Day 1: Setup**
- [ ] Create Next.js project with TypeScript
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Setup Supabase project
- [ ] Configure environment variables
- [ ] Create database tables (run migrations)

**Day 2: Auth**
- [ ] Implement signup page
- [ ] Implement login page
- [ ] Setup Supabase auth middleware
- [ ] Create user profile on signup
- [ ] Protected route wrapper

**Day 3: Dashboard Layout**
- [ ] Dashboard layout with sidebar
- [ ] Navigation component
- [ ] User menu (profile, logout)
- [ ] Empty state for no monitors

**Day 4: Monitor CRUD**
- [ ] Create monitor form
- [ ] List monitors page
- [ ] Monitor card component
- [ ] Delete monitor functionality
- [ ] Edit monitor page

**Day 5: Monitoring Logic**
- [ ] checkWebsite function
- [ ] Cron API endpoint
- [ ] Setup Vercel Cron (vercel.json)
- [ ] Save check results to database
- [ ] Test with real URLs

**Day 6-7: Monitor Details**
- [ ] Monitor detail page
- [ ] Last 24h checks display
- [ ] Simple uptime percentage
- [ ] Current status indicator
- [ ] Recent checks list

### Week 2: Core Features

**Day 8: Alerts**
- [ ] Setup Resend account
- [ ] Create email templates
- [ ] Send alert on site down
- [ ] Send recovery alert
- [ ] Alert settings page

**Day 9: Incidents**
- [ ] Auto-create incident on failure
- [ ] Auto-close on recovery
- [ ] Incidents list page
- [ ] Incident duration calculation
- [ ] Incident in monitor detail

**Day 10: Statistics**
- [ ] Uptime calculation (24h, 7d, 30d)
- [ ] Average response time
- [ ] Stats cards on dashboard
- [ ] Simple response time chart

**Day 11: Status Page**
- [ ] Create status page form
- [ ] Public status page route
- [ ] Display selected monitors
- [ ] Current status + uptime
- [ ] Shareable link

**Day 12: Landing Page**
- [ ] Hero section
- [ ] Features section
- [ ] How it works
- [ ] Pricing section
- [ ] Footer

**Day 13-14: Polish**
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation
- [ ] Mobile responsive
- [ ] Test all flows

### Week 3: Monetization

**Day 15: Stripe Setup**
- [ ] Create Stripe account
- [ ] Setup products/prices
- [ ] Install Stripe SDK
- [ ] Checkout session creation

**Day 16: Billing**
- [ ] Upgrade button flow
- [ ] Webhook handler
- [ ] Update user plan on payment
- [ ] Customer portal link

**Day 17: Plan Limits**
- [ ] Enforce monitor limits
- [ ] Check interval by plan
- [ ] Show upgrade prompts
- [ ] Usage display

**Day 18-19: Testing & Fixes**
- [ ] Test all payment flows
- [ ] Test monitoring accuracy
- [ ] Fix bugs
- [ ] Performance optimization

**Day 20-21: Launch Prep**
- [ ] Final testing
- [ ] Write documentation
- [ ] Prepare Product Hunt
- [ ] Social media assets

---

## UI Design Guidance

### Color Palette (Modern SaaS)
```css
:root {
  /* Primary - For CTAs, links */
  --primary: #6366f1;        /* Indigo */
  --primary-hover: #4f46e5;

  /* Status colors */
  --success: #22c55e;        /* Green - Up */
  --danger: #ef4444;         /* Red - Down */
  --warning: #f59e0b;        /* Amber - Degraded */

  /* Neutrals */
  --background: #ffffff;
  --surface: #f8fafc;
  --border: #e2e8f0;
  --text: #0f172a;
  --text-muted: #64748b;

  /* Dark mode */
  --dark-background: #0f172a;
  --dark-surface: #1e293b;
  --dark-border: #334155;
}
```

### Key UI Components

**Monitor Card:**
```
┌─────────────────────────────────────────┐
│ ● Up    mywebsite.com                   │
│         https://mywebsite.com           │
│                                         │
│ Uptime: 99.9%    Response: 245ms       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (chart) │
│                                         │
│ Last checked: 2 minutes ago             │
└─────────────────────────────────────────┘
```

**Dashboard Overview:**
```
┌─────────────────────────────────────────────────────┐
│  Sidebar    │  Dashboard                            │
│             │                                       │
│  Overview   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  Monitors   │  │ 12  │ │ 11  │ │  1  │ │99.8%│    │
│  Incidents  │  │Total│ │ Up  │ │Down │ │Uptime    │
│  Status     │  └─────┘ └─────┘ └─────┘ └─────┘    │
│  Settings   │                                       │
│             │  Your Monitors                        │
│  ─────────  │  ┌──────────┐ ┌──────────┐          │
│  Upgrade    │  │ Card 1   │ │ Card 2   │          │
│             │  └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## Launch Checklist

### Before Launch
- [ ] Test signup → monitor → alert flow completely
- [ ] Test payment flow (use Stripe test mode)
- [ ] Mobile responsive check
- [ ] Meta tags and OG images
- [ ] Error tracking setup (Sentry)
- [ ] Terms of service & privacy policy pages

### Launch Day
- [ ] Switch Stripe to live mode
- [ ] Submit to Product Hunt
- [ ] Post on Twitter/X
- [ ] Post on r/SideProject, r/webdev
- [ ] Share on Indie Hackers
- [ ] Tell friends to upvote/share

### After Launch
- [ ] Respond to all comments
- [ ] Fix bugs immediately
- [ ] Note feature requests
- [ ] Email early users for feedback
- [ ] Write "Show HN" post

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Resend Docs](https://resend.com/docs)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)

---

*Build fast. Ship faster. Iterate based on real feedback.*
