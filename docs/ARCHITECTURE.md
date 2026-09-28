# Architecture

Browser → Next.js App Router (Vercel) → Supabase Auth + PostgreSQL.

- Anonymous users can submit project proposals through a validated server route.
- Authenticated users can read only projects they submitted or are members of, plus public inventory item details.
- Staff actions are checked server-side against `profiles.role` and `profiles.is_active`.
- Privileged server routes use the service role only after authorization; service role bypasses RLS.
- Stock issue/return runs in PostgreSQL functions with row locks and immutable movement/audit rows.
- The in-memory rate limiter is not suitable for multi-instance production. Configure a shared rate limiter before launch.

## Important remaining work
This starter does not yet include complete staff-facing pages, resource request creation/approval UI, email notifications, secure guest status lookup, machine booking, CSV exports, comprehensive tests, or shared rate limiting. These are required before calling the system production-ready.


## Added in this revision
- Staff workspace page at `/staff` with pending project review actions and inventory/low-stock overview.
- Staff-only resource request creation endpoint at `POST /api/staff/resource-requests` accepting a project and line items.
- Resource request review/approval UI and audited stock adjustment remain incomplete and must be finished before public launch.
