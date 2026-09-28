# Tinkerers' Lab Project Portal — Production-Oriented Starter

A full-stack Next.js + Supabase implementation scaffold for project registration, staff approvals, resource requests, inventory, issue/return records, and audit events.

> **Important:** This is a deployable starter, not a verified production deployment. It has not been connected to your Supabase/Vercel accounts, load-tested, penetration-tested, or approved by Ahmedabad University/Tinkerers' Lab. Do not open it to all students until the checklist below is completed.

## Included
- Next.js App Router + TypeScript + Tailwind
- Supabase Auth (email/password) and server-side session handling
- Open project submission endpoint with basic validation and rate limiting
- Authenticated project dashboard
- Staff-only review and inventory endpoints
- PostgreSQL schema, constraints, indexes, RLS policies, and audit trail
- Separate project approval and resource request approval
- Transactional stock issue/return RPCs
- Deployment and 1,000-user readiness checklist

## Quick start
1. Install Node.js 20+ and create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the Supabase project URL, anon key, and service role key.
3. In Supabase SQL Editor, run the migrations in `supabase/migrations` in order.
4. Run `npm install`.
5. Run `npm run dev`.
6. Create the first staff user in Supabase Auth, then promote that user's profile to `staff` using the SQL in `docs/ADMIN_SETUP.md`.
7. Deploy to Vercel only after reviewing `docs/PRODUCTION_CHECKLIST.md`.

## Security notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or a `NEXT_PUBLIC_` variable.
- Public submission intentionally allows a visitor to submit a project without an account. The public endpoint does not reveal project records.
- Project status viewing requires sign-in. Before public rollout, add email ownership verification/magic-link access if guest submissions need to track status without accounts.
- The in-memory rate limiter is only a local-development fallback and does **not** work reliably across serverless instances. Replace it with Upstash Redis or another shared rate-limit service before launch.
- RLS is defense in depth. The service-role key bypasses RLS, so every privileged route must verify staff role before querying or mutating data.
- Configure Supabase Auth email confirmation, SMTP, redirect URLs, MFA for staff, backups, monitoring, and retention policy.
- Have TL staff and the university's IT/security owner review the schema and workflows.

## Scale target
The schema and architecture are designed to be a reasonable starting point for 1,000 registered users, but user count alone does not establish capacity. Actual readiness depends on traffic shape, database plan, indexes, query patterns, rate limits, storage, and load testing.

## Scripts
- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — lint
