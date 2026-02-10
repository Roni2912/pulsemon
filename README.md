# PulseMon

Website monitoring platform that tracks uptime, response times, and incidents with instant alerts and public status pages.

## Features

- **Real-time Monitoring** - Check websites and APIs every 1-5 minutes with configurable intervals
- **Instant Email Alerts** - Get notified immediately when services go down or recover, powered by Resend
- **Public Status Pages** - Branded, shareable status pages showing real-time uptime for your customers
- **Incident Tracking** - Automatic incident detection, duration tracking, and resolution logging
- **Response Time Charts** - Interactive visualizations of response time trends and downtime periods
- **Uptime Statistics** - Track uptime across 24h, 7d, and 30d windows with detailed analytics
- **SSL Monitoring** - Monitor SSL certificate validity and get warned before expiry
- **Multi-plan Billing** - Free tier with 5 monitors, paid plans via Stripe (Starter, Pro, Business)
- **Team Collaboration** - Invite team members and share monitors across your organization
- **Webhook Integrations** - Send alerts to Slack, PagerDuty, Discord, or any custom webhook endpoint

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Authentication | Supabase Auth (cookie-based sessions) |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| Email | Resend (SMTP for auth emails + API for alerts) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project
- Stripe account (for billing)
- Resend account (for email alerts)

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment variables**

```bash
cp .env.local.example .env.local
```

Fill in the required values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_BUSINESS=

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

3. **Configure Supabase**

- Set up the database schema (tables, RLS policies, triggers)
- Configure authentication email templates to redirect to `/auth/callback`
- Set Site URL to your app URL under Authentication > URL Configuration
- (Optional) Configure Resend SMTP under Authentication > SMTP Settings for branded auth emails

4. **Start development server**

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Plans

| Feature | Free | Starter ($9/mo) | Pro ($29/mo) | Business ($99/mo) |
|---------|------|-----------------|-------------|-------------------|
| Monitors | 5 | 10 | 50 | 200 |
| Check Interval | 5 min | 3 min | 1 min | 1 min |
| Data History | 7 days | 30 days | 90 days | 365 days |
| Status Pages | 1 | 3 | 10 | 50 |
| Team Members | 1 | 3 | 10 | 50 |
| Alert Channels | Email | Email, Webhook | Email, Webhook, Slack | All + SMS |

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add all environment variables from `.env.local`
3. Deploy

### Cron Job

Set up a cron job to hit `POST /api/cron/check-monitors` at your desired frequency (e.g., every minute). Include the `Authorization: Bearer <CRON_SECRET>` header.

On Vercel, configure this in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-monitors",
      "schedule": "* * * * *"
    }
  ]
}
```

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
