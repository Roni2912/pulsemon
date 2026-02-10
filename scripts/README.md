# Database Seed Script

This script creates test data for development.

## What it creates:

- **Test User**
  - Email: `test@pulsemon.com`
  - Password: `test123456`
  - Plan: Free

- **4 Sample Monitors**
  - Google (Up)
  - GitHub (Up)
  - Example API (Down)
  - Test Website (Paused)

- **Sample Checks** (50 per monitor)
  - Response times
  - Status codes
  - Error messages

- **Sample Incidents**
  - 1 ongoing incident
  - 1 resolved incident

- **Alert Settings**
  - Email alerts enabled

## Usage:

1. Install dependencies:
```bash
npm install
```

2. Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

3. Run the seed script:
```bash
npm run db:seed
```

4. Login with:
   - Email: `test@pulsemon.com`
   - Password: `test123456`

## Re-seeding:

To reset and re-seed:
```bash
npm run db:reset  # Reset database
npm run db:push   # Apply migrations
npm run db:seed   # Seed data
```
