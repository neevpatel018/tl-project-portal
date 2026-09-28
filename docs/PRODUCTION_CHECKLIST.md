# Go-live checklist — do not skip

## Account and policy
- [ ] TL/lab leadership approves workflow, data fields, retention, and responsible owner.
- [ ] University IT/security reviews access, hosting, privacy, and incident response.
- [ ] Decide whether guests can track status via secure email magic link or must create an account.
- [ ] Define inventory rules for consumables, reusable equipment, machines, damaged/lost items, and write-offs.
- [ ] Define safety training and machine-booking prerequisites.

## Supabase
- [ ] Run migration in a staging project first.
- [ ] Run Supabase Security Advisor and resolve all findings.
- [ ] Confirm RLS enabled on every exposed table and test policies with student, staff, admin, and anonymous roles.
- [ ] Configure email confirmation, SMTP, allowed redirect URLs, and staff MFA.
- [ ] Keep service-role key server-only; rotate any key accidentally exposed.
- [ ] Configure backups/PITR appropriate to the chosen plan and test a restore.
- [ ] Review database region, plan, connection pooling, query/index performance, and quotas.
- [ ] Configure log retention and alerting.

## Application
- [ ] Replace in-memory rate limiting with shared atomic Redis rate limiting.
- [ ] Add CAPTCHA/bot protection to public submission if abuse risk warrants it.
- [ ] Add email notification for submission, decisions, issues, and due/overdue returns.
- [ ] Add secure guest status lookup or account-claim workflow.
- [ ] Implement and test resource-request line submission and staff approval UI.
- [ ] Implement audited stock adjustment/write-off workflow with supervisor policy.
- [ ] Add CSV export with authorization and audit log.
- [ ] Add pagination to all staff tables; never load unbounded records.
- [ ] Add structured logging, error monitoring, and alerting without logging secrets or unnecessary personal data.
- [ ] Add privacy notice, terms, accessible labels, keyboard checks, and mobile testing.
- [ ] Add unit/integration tests for auth, RLS, approval transitions, and inventory concurrency.
- [ ] Add dependency scanning, secret scanning, and CI build checks.

## Load and operational validation
- [ ] Use a staging environment with production-like schema and realistic synthetic data.
- [ ] Define expected concurrent submissions and staff usage with TL.
- [ ] Load test browse, submit, sign-in, dashboard, and staff workflows; monitor p95 latency, errors, DB CPU/connections, and rate limits.
- [ ] Test concurrent attempts to issue the last available unit; stock must never go negative.
- [ ] Test backup restoration and incident response.
- [ ] Pilot with a small group and TL staff, then expand in stages.
- [ ] Have a rollback plan and named on-call owner before opening to all students.

## Vercel
- [ ] Configure environment variables separately for Preview and Production.
- [ ] Deploy staging first; test auth redirect URLs and email links.
- [ ] Configure custom domain, HTTPS, analytics/privacy settings, and deployment protection for previews.
- [ ] Run a production build and smoke tests against the production deployment.
