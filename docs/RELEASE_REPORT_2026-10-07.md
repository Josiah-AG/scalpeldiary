# ScalpelDiary release report — 7 October 2026

Application source revision: `71219d2`. The backend and frontend are deployed successfully; GitHub Actions run `37603690416` passed. This report follows the baseline assessment in `APP_ASSESSMENT_2026-10-07.md` and distinguishes completed fixes from improvement opportunities.

## Completed

- Preserve resident history when advancing a year or deactivating an account. Add atomic mutations, idempotent procedure batches/assignment completion and database ownership/uniqueness/rating constraints.
- Enforce current account status and role on every authenticated request; revoke sessions after password changes/resets; deny cross-resident access; omit confidential feedback and exact scores from resident responses. Parameterize detachment queries, sanitize legacy detail dialogs and rate-limit failed logins.
- Consolidate presentation edit/delete protections; fix assignment completion and UUID year filters; align zero ratings, verified progress, seniority and Year 2 Minor Surgery rules. Correct profile image transport/limits and filtered PDF summaries.
- Persist scheduling colors, respect configurable academic start months, add durable scheduler claims and transactional notification outbox with retries. Reconcile push ownership/key changes and bound service-worker caches.
- Remove runtime HTTP migration access, add versioned/checksummed migrations, CI and regression tests. Upgrade dependencies to clean audits, split frontend routes, add error/offline states and redact sensitive runtime logging. Add security audit events and database readiness checks.
- Replace the previously committed live VAPID private key. The old key remains in Git history but is no longer the configured production key. Existing devices must reopen/reload the app to reconcile their push subscription.
- Set up Cloudflare skills, authenticated MCP registration and authenticated local Wrangler. Existing Pages Git integration remains connected. Build configuration now uses lockfile installs and supported Node versions.

## Production evidence

Railway deployment `044ae36c-3ebc-4bca-a948-089dee99a05f` and Cloudflare deployment `2e020538-f075-46a8-871a-88ff609dabe3` succeeded for revision `71219d2`. The Railway health endpoint returns release `2026-10-07-consistency`; `/ready` returns HTTP 200. The custom frontend domain serves the new assets and security headers. An owner-authorized supervisor login loaded its live dashboard successfully; the test session was signed out. No clinical record was edited by the smoke test.

The migration retained **1,569 procedures, 11 presentations and 70 accounts**. It reduced three active academic-year records to one while preserving rotations and repaired one unambiguous completed-assignment link. Restricted backups exist outside the repository; a full backup was restored and migrations rehearsed in an isolated database before production changes.

## Validation

- 19 backend integration tests passed against actual isolated PostgreSQL, including both restored production schema and an empty baseline initialized like CI. Coverage includes privacy/permissions, preservation, token revocation, concurrent login, idempotency/rollback, uploads, colors, role dashboards and notification retries.
- Four frontend unit tests passed; both production builds passed; both npm audits reported zero findings.
- Browser checks verified synthetic resident/supervisor workflows, UUID filtering, read-only controls, sanitized detail dialogs, zero-score display, and a 390px screen without document overflow. PDF export produced three pages whose detail records and summary totals agree; rendered procedure and summary pages were inspected.
- Hosted CI passed after fixing the fresh-database fixture. Railway's initial upload failed to create a snapshot; the Git integration succeeded after removing a redundant install command that conflicted with a Nixpacks cache mount.

## Limits and next improvements

Four older completed assignments have no matching presentation record in the available data. They remain visible with an unavailable-link notice. Recovery requires other historical evidence; no replacement records were fabricated.

Real-device push delivery, full accessibility certification, exhaustive testing of every screen/device and sustained load testing were not performed. Pagination for large histories, replacing every legacy alert/modal, centralizing resident-view state/shared-source generation and external alerting remain future improvements. Offline writes are explicitly unsupported. See `OPERATIONS.md` for current maintenance and release instructions.
