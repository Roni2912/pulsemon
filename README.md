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
├── app/           # Next.js App Router pages
├── components/    # React components
├── lib/           # Utilities and configurations
├── hooks/         # Custom React hooks
└── types/         # TypeScript definitions
```

## License

MIT
