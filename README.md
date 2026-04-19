# SpendLens

Minimal personal finance dashboard built with Next.js, Plaid, and Supabase.

## Stack
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS (mobile-first, dark mode support)
- Supabase (database)
- Plaid API (`transactions/sync` incremental sync)
- Vercel-ready (includes daily cron)

## MVP features
- Connect bank + credit card accounts with Plaid Link
- Secure server-side storage of Plaid `access_token` in Supabase (`plaid_items`)
- Daily transaction sync via Plaid `transactions/sync` (Vercel cron at 09:00 UTC)
- Dashboard: week / month view, total spent, accounts + balances, spend by Plaid category, transaction list

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
2. Run [supabase/schema.sql](supabase/schema.sql). Safe to re-run — it drops legacy tables/columns from prior versions.

## 3) Plaid sandbox test flow
- Click **Sandbox** in the UI (works when `PLAID_ENV=sandbox`).
- Or use Plaid Link with institution `ins_109508` (First Platypus Bank).
- Manually trigger sync:
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
- `POST /api/plaid/sandbox-connect`
- `POST|GET /api/plaid/sync-transactions`
- `GET /api/accounts`
- `GET /api/transactions`

## Vercel deploy
- Import repo in Vercel.
- Add the same environment variables in Vercel project settings.
- `vercel.json` schedules daily sync at `09:00 UTC`.
