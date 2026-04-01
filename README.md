# SpendLens

Minimal personal finance dashboard built with Next.js, Plaid, and Supabase.

## Stack
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS (mobile-first, dark mode support)
- Supabase (database)
- Plaid API (`transactions/sync` incremental sync)
- Vercel-ready (includes daily cron)

## Features (Spreadsheet-style v1)
- Connect bank + credit card accounts with Plaid Link
- Secure server-side storage of Plaid `access_token` in Supabase (`plaid_items`)
- Daily transaction sync endpoint using Plaid `transactions/sync`
- Zero manual entry for expenses (all transactions come from Plaid sync)
- Automatic transaction classification:
   - Plaid category + merchant matching → simplified buckets
   - Auto-detect fixed expenses and investment transfers
   - Lifestyle spend excludes fixed + investments + savings transfers
- Dashboard views: `This Week`, `This Month`, `This Pay Period`, `All Time`
- Monthly hero: `Lifestyle spent this month: $X / $650` with green/yellow/red budget bar
- Daily spending log grouped by week and day (Mon-Sun week boundaries)
- Simplified category breakdown with `% of lifestyle budget`
- Credit card breakdown with per-card spend + current balances
- Trip/Event tracking:
   - Create trip/event
   - Tag transactions to a trip/event
   - Track yearly trip spend vs yearly event budget (default `$2,500`)
- Weekly and monthly summaries with monthly trend chart
- Savings/investment tracker (Roth IRA, brokerage, savings transfers)
- Manual actions limited to:
   - Re-categorize a transaction
   - Tag transaction to a trip/event

## 1) Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `.env.local`:
   ```env
   PLAID_CLIENT_ID=
   PLAID_SECRET=
   PLAID_ENV=sandbox
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

## 2) Supabase schema
1. Open Supabase SQL Editor.
2. Run [supabase/schema.sql](supabase/schema.sql).
3. (Optional) Run [supabase/seed_sandbox.sql](supabase/seed_sandbox.sql).

This schema includes:
- `user_settings` (income, warning %, savings %, yearly event budget)
- `trips`
- transaction classification fields (`simplified_category`, `allocation_bucket`, flags)

## 3) Plaid sandbox test flow
- Use Plaid Link in UI and pick institution `ins_109508` (First Platypus Bank).
- Complete sandbox login in Link.
- On success, app exchanges token and triggers sync automatically.
- You can manually trigger sync:
  ```bash
  curl -X POST http://localhost:3000/api/plaid/sync-transactions
  ```

## 4) Run locally
```bash
npm run dev
```
Visit `http://localhost:3000`.

## API routes
- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-token`
- `POST|GET /api/plaid/sync-transactions`
- `GET /api/accounts`
- `POST /api/accounts/rename`
- `GET /api/transactions`
- `POST /api/transactions/update` (re-category + trip tag)
- `GET|POST /api/settings`
- `GET|POST /api/trips`

## Vercel deploy
- Import repo in Vercel.
- Add the same environment variables in Vercel project settings.
- `vercel.json` schedules daily sync at `09:00 UTC`.
