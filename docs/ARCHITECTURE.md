# Pulsemon Architecture Guide

This document provides an in-depth overview of the Pulsemon project architecture, technology stack, and how different components interact with each other.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Directory Structure](#directory-structure)
5. [Core Components](#core-components)
6. [API Architecture](#api-architecture)
7. [Database Schema](#database-schema)
8. [Authentication & Authorization](#authentication--authorization)
9. [Data Flow](#data-flow)
10. [Deployment](#deployment)
11. [Development Workflow](#development-workflow)

---

## Project Overview

**Pulsemon** is an open-source uptime monitoring SaaS platform that helps users monitor website and API availability, track incidents, and communicate status to their users through public status pages.

### Key Features
- Real-time uptime monitoring with customizable check intervals
- Instant email alerts when services go down
- Beautiful, customizable public status pages
- Automatic incident detection and tracking
- Response time analytics and uptime statistics
- Multi-tier subscription support (Free & Paid) with Stripe integration
- User authentication and multi-user support

---

## Technology Stack

### Frontend & Framework
- **Next.js 14** - React framework with App Router for SSR/SSG and API routes
- **React 18** - JavaScript library for building user interfaces
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Tailwind CSS** - Utility-first CSS framework for styling
- **shadcn/ui** - High-quality, accessible UI components built on Radix UI
- **Recharts** - Composable charting library for data visualization
- **React Hook Form** - Performant, flexible form handling
- **Zod** - TypeScript-first schema validation library

### Backend & APIs
- **Next.js API Routes** - Serverless backend functions for RESTful APIs
- **Stripe** - Payment processing and subscription management
- **Resend** - Email delivery service for alerts and notifications

### Database & Authentication
- **Supabase** - Open-source Firebase alternative providing:
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication & authorization (Auth)
  - Row-level security (RLS)
  - Storage capabilities
- **Supabase Auth** - OAuth and credentials-based authentication

### UI & Component Libraries
- **Radix UI** - Unstyled, accessible component primitives
- **class-variance-authority** - Type-safe component variants
- **Lucide React** - Beautiful, customizable icon library
- **clsx/tailwind-merge** - Utility for conditional CSS class merging

### Utilities & Tools
- **date-fns** - Modern date utility library
- **React Email** - React components for emails
- **@supabase/ssr** - SSR utilities for Supabase
- **@supabase/supabase-js** - JavaScript client for Supabase

### Deployment
- **Vercel** - Hosting platform optimized for Next.js with automatic deployments
- **PostgreSQL** (via Supabase) - Managed relational database

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS / CLIENTS                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼────────────────┐
         │               │                │
    ┌────▼────┐      ┌───▼───┐      ┌───▼──────┐
    │ Dashboard│      │Status │      │Public API│
    │ (Auth)   │      │Pages  │      │(Webhooks)│
    └────┬────┘      └───┬───┘      └───┬──────┘
         │               │                │
         │   ┌───────────┴────────────┐   │
         │   │                        │   │
    ┌────▼───▼────────────────────────▼──▼─┐
    │      Next.js App Router + API        │
    │  - Page Routes (SSR/SSG)             │
    │  - API Routes (serverless functions) │
    │  - Middleware (auth guards)          │
    └────────────┬────────────────────────┘
                 │
    ┌────────────┼─────────────────────┐
    │            │                      │
┌───▼──┐    ┌───▼────────┐    ┌────────▼──┐
│Auth  │    │Monitoring  │    │Webhooks & │
│      │    │Services    │    │Cron Jobs  │
│      │    │            │    │           │
└───┬──┘    └───┬────────┘    └────────┬──┘
    │           │                      │
    └───────────┼──────┬───────────────┘
                │      │
    ┌───────────▼──────▼──────┐
    │   Supabase (PostgreSQL) │
    │   - Profiles            │
    │   - Monitors            │
    │   - Checks (results)    │
    │   - Incidents           │
    │   - Alert Settings      │
    │   - Status Pages        │
    └────────────────────────┘
    
    ┌─────────────┐  ┌──────────┐  ┌────────┐
    │   Stripe    │  │  Resend  │  │ Vercel │
    │  (Payments) │  │ (Email)  │  │(Deploy)│
    └─────────────┘  └──────────┘  └────────┘
```

---

## Directory Structure

```
pulsemon/
├── src/
│   ├── app/                          # Next.js App Router (pages & API)
│   │   ├── (auth)/                   # Auth group routes (login, signup, reset)
│   │   │   ├── layout.tsx            # Auth layout with redirect guards
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (marketing)/              # Public marketing group routes
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # Landing page
│   │   │
│   │   ├── dashboard/                # Protected routes (requires auth)
│   │   │   ├── layout.tsx            # Dashboard layout + sidebar
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   ├── monitors/
│   │   │   │   ├── page.tsx          # Monitor list
│   │   │   │   ├── new/page.tsx      # Create new monitor
│   │   │   │   └── [id]/page.tsx     # Monitor details & edit
│   │   │   ├── incidents/page.tsx    # Incident tracking
│   │   │   ├── statistics/page.tsx   # Analytics & uptime stats
│   │   │   ├── status-pages/
│   │   │   │   ├── page.tsx          # Status page list
│   │   │   │   └── [id]/page.tsx     # Status page editor
│   │   │   └── settings/page.tsx     # User settings & alerts
│   │   │
│   │   ├── status/[slug]/page.tsx    # Public status pages (public access)
│   │   │
│   │   ├── api/                      # Backend API routes (serverless)
│   │   │   ├── monitors/
│   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   └── [id]/route.ts     # GET, PATCH (update), DELETE
│   │   │   ├── checks/route.ts       # GET (monitoring checks/results)
│   │   │   ├── incidents/route.ts    # GET (incident history)
│   │   │   ├── status-pages/
│   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   └── [id]/route.ts     # GET, PATCH, DELETE
│   │   │   ├── settings/
│   │   │   │   └── alerts/route.ts   # GET, PATCH (alert settings)
│   │   │   ├── billing/
│   │   │   │   ├── checkout/route.ts # POST (Stripe checkout session)
│   │   │   │   └── portal/route.ts   # POST (Stripe billing portal)
│   │   │   ├── cron/
│   │   │   │   └── check-monitors/route.ts  # POST (uptime checks)
│   │   │   └── webhooks/
│   │   │       └── stripe/route.ts   # POST (Stripe webhook events)
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   └── middleware.ts             # Auth guards & redirects
│   │
│   ├── components/                   # Reusable React components
│   │   ├── auth/                     # Authentication components
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── password-reset-form.tsx
│   │   ├── dashboard/                # Dashboard-specific components
│   │   │   ├── dashboard-layout.tsx  # Layout wrapper
│   │   │   ├── sidebar.tsx           # Navigation sidebar
│   │   │   └── user-menu.tsx         # User profile dropdown
│   │   └── ui/                       # Shadcn/UI components
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── empty-state.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       └── toaster.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── use-toast.ts              # Toast notifications hook
│   │
│   ├── lib/                          # Utility functions & libraries
│   │   ├── supabase/                 # Supabase client configurations
│   │   │   ├── client.ts             # Browser client (useEffect, events)
│   │   │   ├── server.ts             # Server client (API routes)
│   │   │   ├── admin.ts              # Admin client (service role)
│   │   │   └── middleware.ts         # Middleware for auth
│   │   ├── utils/                    # Utility functions
│   │   │   ├── date.ts               # Date formatting utilities
│   │   │   ├── uptime.ts             # Uptime calculation logic
│   │   │   └── validation.ts         # Input validation helpers
│   │   ├── constants.ts              # App-wide constants & config
│   │   └── utils.ts                  # Helper functions (cn, etc.)
│   │
│   └── types/                        # TypeScript type definitions
│       ├── index.ts                  # Main types
│       ├── api.ts                    # API request/response types
│       └── supabase.ts               # Database schema types
│
├── supabase/                         # Supabase configuration
│   ├── config.toml                   # Local Supabase setup
│   └── migrations/                   # Database migrations
│       ├── 00001_create_profiles.sql
│       ├── 00002_create_monitors.sql
│       ├── 00003_create_checks.sql
│       ├── 00004_create_incidents.sql
│       ├── 00005_create_alert_settings.sql
│       ├── 00006_create_status_pages.sql
│       └── 00007_create_indexes.sql
│
├── public/                           # Static assets
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # This file
│   └── IMPLEMENTATION_ROADMAP.md     # Development roadmap
│
├── Configuration Files
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── next.config.js                # Next.js configuration
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   ├── components.json               # Shadcn/ui configuration
│   └── vercel.json                   # Vercel deployment config
```

---

## Core Components

### 1. **Authentication System**
- **Location**: `src/app/(auth)`, `src/lib/supabase/`
- **Features**: User signup, login, password reset
- **Provider**: Supabase Auth (email/password)
- **Protection**: Middleware redirects unauthenticated users from protected routes

### 2. **Dashboard**
- **Location**: `src/app/dashboard/`
- **Features**: 
  - Monitor management (CRUD operations)
  - Incident tracking and history
  - Statistics and analytics
  - Status page management
  - Alert settings
- **Protection**: Requires authentication via middleware

### 3. **Monitoring Engine**
- **Core Logic**: Uptime checks via cron jobs
- **Route**: `src/app/api/cron/check-monitors/`
- **Process**:
  1. Triggered by external cron service (Vercel Cron, etc.)
  2. Fetches all active monitors
  3. Makes HTTP/HTTPS requests to monitor URLs
  4. Records response time and status
  5. Creates incidents if service is down
  6. Triggers email alerts if configured

### 4. **Public Status Pages**
- **Route**: `src/app/status/[slug]/`
- **Access**: Public (no authentication required)
- **Features**:
  - Display uptime status for selected monitors
  - Historical incident information
  - Service component grouping

### 5. **Billing & Payments**
- **Provider**: Stripe
- **Routes**:
  - Checkout: `src/app/api/billing/checkout/`
  - Portal: `src/app/api/billing/portal/`
  - Webhooks: `src/app/api/webhooks/stripe/`
- **Features**: Subscription management, plan upgrades/downgrades

---

## API Architecture

### API Routes Overview

All API endpoints follow RESTful conventions:

#### **Monitors API**
```
GET    /api/monitors              # List all monitors
POST   /api/monitors              # Create new monitor
GET    /api/monitors/[id]         # Get monitor details
PATCH  /api/monitors/[id]         # Update monitor
DELETE /api/monitors/[id]         # Delete monitor
```

#### **Checks API** (Monitoring Results)
```
GET    /api/checks                # Get paginated check results
```

#### **Incidents API**
```
GET    /api/incidents             # Get paginated incidents
```

#### **Status Pages API**
```
GET    /api/status-pages          # List status pages
POST   /api/status-pages          # Create status page
GET    /api/status-pages/[id]     # Get status page
PATCH  /api/status-pages/[id]     # Update status page
DELETE /api/status-pages/[id]     # Delete status page
```

#### **Settings API**
```
GET    /api/settings/alerts       # Get alert settings
PATCH  /api/settings/alerts       # Update alert settings
```

#### **Billing API**
```
POST   /api/billing/checkout      # Create Stripe checkout session
POST   /api/billing/portal        # Get Stripe billing portal URL
```

#### **Cron & Webhooks**
```
POST   /api/cron/check-monitors   # Trigger uptime checks (internal)
POST   /api/webhooks/stripe       # Stripe webhook events
```

### API Response Pattern
```typescript
// Success Response
{
  success: true,
  data: { /* resource data */ }
}

// Error Response
{
  success: false,
  error: "Error message"
}
```

---

## Database Schema

### Core Tables

#### **profiles** (User Profiles)
```sql
- id (UUID) - Primary key
- email (string) - User email
- name (string) - User full name
- plan (enum) - Subscription plan (free, pro, enterprise)
- billing_cycle (enum) - Monthly or annual
- stripe_customer_id (string) - Stripe customer reference
- created_at (timestamp)
- updated_at (timestamp)
```

#### **monitors** (Monitoring Targets)
```sql
- id (UUID) - Primary key
- user_id (UUID) - FK to profiles
- name (string) - Monitor name
- url (string) - Target URL to monitor
- status (enum) - current status (up, down, degraded)
- check_interval (integer) - Check frequency in minutes
- timeout (integer) - HTTP timeout in seconds
- is_active (boolean) - Enable/disable monitoring
- created_at (timestamp)
- updated_at (timestamp)
```

#### **checks** (Monitoring Results)
```sql
- id (UUID) - Primary key
- monitor_id (UUID) - FK to monitors
- status_code (integer) - HTTP status code
- response_time (integer) - Response time in ms
- is_success (boolean) - Success/failure
- error_message (string) - Error details if failed
- checked_at (timestamp) - When check was performed
```

#### **incidents** (Downtime Events)
```sql
- id (UUID) - Primary key
- monitor_id (UUID) - FK to monitors
- started_at (timestamp) - When downtime began
- resolved_at (timestamp) - When service recovered
- status (enum) - investigating, identified, monitoring, resolved
- description (string) - Incident details
- created_at (timestamp)
```

#### **alert_settings** (Notification Settings)
```sql
- id (UUID) - Primary key
- user_id (UUID) - FK to profiles
- monitor_id (UUID) - FK to monitors
- alert_type (enum) - email, webhook, etc.
- notification_email (string) - Email to receive alerts
- send_alerts (boolean) - Enable/disable alerts
- created_at (timestamp)
```

#### **status_pages** (Public Status Pages)
```sql
- id (UUID) - Primary key
- user_id (UUID) - FK to profiles
- slug (string) - URL slug (unique)
- title (string) - Page title
- description (string) - Page description
- monitors (UUID[]) - Array of monitor IDs to display
- is_published (boolean) - Public visibility
- custom_domain (string) - Custom domain (optional)
- created_at (timestamp)
- updated_at (timestamp)
```

All tables include Row-Level Security (RLS) policies to ensure users can only access their own data.

---

## Authentication & Authorization

### Authentication Flow

1. **Signup/Login**
   - User provides email and password
   - Supabase Auth handles credential verification
   - JWT token issued and stored in secure cookie
   - User redirected to dashboard

2. **Protected Routes**
   - Middleware checks for valid JWT token
   - Unauthenticated users redirected to login
   - Route: `src/middleware.ts`

3. **API Authentication**
   - API routes use `createServerClient()` to get authenticated user
   - Service role key used for admin operations (webhooks, cron jobs)

### Authorization
- Row-Level Security (RLS) enforced at database level
- Users can only access their own monitors, incidents, status pages
- Public status pages marked with `is_published = true`

---

## Data Flow

### Uptime Monitoring Flow

```
1. External Cron Service (e.g., Vercel Cron / EasyCron)
         ↓
2. POST /api/cron/check-monitors (with CRON_SECRET auth)
         ↓
3. Fetch all active monitors from database
         ↓
4. For each monitor:
   a. Make HTTP request to monitor URL
   b. Measure response time
   c. Check status code
         ↓
5. Store check result in 'checks' table
         ↓
6. If status changed:
   a. Create/resolve incident
   b. Query alert settings
         ↓
7. Send email alerts (Resend) if configured
         ↓
8. Return summary response
```

### User Action Flow (Create Monitor)

```
1. User fills form → /dashboard/monitors/new
         ↓
2. Form submitted to POST /api/monitors
         ↓
3. API validates input (Zod schema)
         ↓
4. Insert monitor into database (RLS ensures user ownership)
         ↓
5. Return created monitor
         ↓
6. Frontend redirects to monitor detail page
```

### Stripe Payment Flow

```
1. User clicks "Upgrade Plan"
         ↓
2. POST /api/billing/checkout
         ↓
3. Create Stripe checkout session
         ↓
4. Redirect to Stripe checkout page
         ↓
5. User completes payment
         ↓
6. Stripe webhook → POST /api/webhooks/stripe
         ↓
7. Update user's plan and stripe_customer_id in database
         ↓
8. Redirect to success page
```

---

## Deployment

### Hosting Platform
- **Vercel** - Optimal for Next.js applications
- Auto-deploys on pushes to `main` branch
- Serverless functions for API routes
- Built-in CI/CD with GitHub integration

### Environment Variables (Production)
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public auth key
SUPABASE_SERVICE_ROLE_KEY         # Admin/service role key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe public key
STRIPE_SECRET_KEY                 # Stripe secret key
STRIPE_WEBHOOK_SECRET             # Stripe webhook signing secret
RESEND_API_KEY                    # Email service API key
CRON_SECRET                       # Cron job authorization secret
NEXT_PUBLIC_APP_URL               # Application base URL
```

### Database (Supabase)
- Hosted PostgreSQL
- Automatic backups
- Row-Level Security enabled
- Real-time subscriptions for live updates

### Monitoring Cron Job
- Can use:
  - Vercel Cron (if on Pro plan)
  - EasyCron (external cron service)
  - AWS EventBridge
  - GitHub Actions scheduled workflow
  - Any external HTTP-based cron service

---

## Development Workflow

### Local Development Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Roni2912/pulsemon.git
   cd pulsemon
   npm install
   ```

2. **Database Setup**
   ```bash
   # Start local Supabase
   supabase start
   
   # Run migrations
   supabase db reset
   
   # Generate types
   npm run db:generate
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Fill in credentials
   ```

4. **Start Dev Server**
   ```bash
   npm run dev
   # Accessible at http://localhost:3000
   ```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate TypeScript types from database schema
npm run db:push      # Push local migrations to Supabase
npm run db:reset     # Reset local database to initial state
```

### Database Development
- Migrations stored in `supabase/migrations/`
- Use `supabase migration new` to create new migrations
- Always test migrations locally before deploying
- Supabase automatically generates TypeScript types

### Code Style & Conventions
- **TypeScript**: Strict mode enabled, all code should be typed
- **Components**: Functional components with React hooks
- **Forms**: Use React Hook Form + Zod validation
- **UI**: Leverage shadcn/ui components for consistency
- **Styling**: Tailwind CSS utility classes
- **Naming**: camelCase for functions/variables, PascalCase for components/types

---

## Summary

Pulsemon is a modern, full-stack Next.js application with:
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes with Supabase integration
- **Database**: PostgreSQL via Supabase with RLS
- **Real-time**: Supabase subscriptions for live updates
- **Payments**: Stripe integration for SaaS model
- **Email**: Resend for transactional emails
- **Hosting**: Vercel for serverless deployment

The architecture emphasizes security, scalability, and user privacy through proper authentication, row-level security, and clear separation of concerns between frontend and backend logic.
