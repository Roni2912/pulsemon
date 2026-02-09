# Pulsemon

Open-source uptime monitoring SaaS with status pages, alerts, and analytics.

## Features

- **Uptime Monitoring** - Monitor websites and APIs with customizable intervals
- **Instant Alerts** - Get notified via email when services go down
- **Status Pages** - Beautiful public status pages for your users
- **Incident Tracking** - Automatic incident detection and resolution tracking
- **Analytics** - Response time charts and uptime statistics
- **Multi-plan Support** - Free and paid tiers with Stripe integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/Roni2912/pulsemon.git
cd pulsemon

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
```

## Project Structure

```
src/
├── app/
│   ├── (marketing)/              # Public pages (landing, pricing, features)
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing page
│   ├── (auth)/                   # Auth pages (redirect if logged in)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── dashboard/                # Protected - requires authentication
│   │   ├── layout.tsx            # Sidebar + auth guard
│   │   ├── page.tsx              # Dashboard overview
│   │   ├── monitors/
│   │   │   ├── page.tsx          # Monitor list
│   │   │   ├── new/page.tsx      # Create monitor
│   │   │   └── [id]/page.tsx     # Monitor detail
│   │   ├── incidents/page.tsx
│   │   ├── statistics/page.tsx
│   │   ├── status-pages/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── settings/page.tsx
│   ├── status/[slug]/page.tsx    # Public status pages
│   ├── api/
│   │   ├── monitors/
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │   ├── checks/route.ts       # GET (paginated)
│   │   ├── incidents/route.ts    # GET (paginated)
│   │   ├── status-pages/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │   ├── settings/
│   │   │   └── alerts/route.ts   # GET, PATCH
│   │   ├── billing/
│   │   │   ├── checkout/route.ts # POST (Stripe checkout)
│   │   │   └── portal/route.ts   # POST (Stripe portal)
│   │   ├── cron/
│   │   │   └── check-monitors/route.ts  # POST (cron job)
│   │   └── webhooks/
│   │       └── stripe/route.ts   # POST (Stripe webhooks)
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── auth/                     # Login, signup, password reset forms
│   ├── dashboard/                # Sidebar, header, user menu
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── supabase/                 # Supabase clients (browser, server, admin, middleware)
│   ├── utils/                    # Date, uptime, validation helpers
│   ├── constants.ts              # App constants, plans, config
│   └── utils.ts                  # cn() utility
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript definitions
└── middleware.ts                  # Route protection & auth
```

## License

MIT
