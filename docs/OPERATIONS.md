# ScalpelDiary operations

This is the current runbook. Older setup and migration notes are historical; do not run their seed, cleanup or HTTP migration commands against production.

## Runtime and release

- Backend: Railway project/service `scalpeldiary`, production environment, source root `/server`; Node 22 (minimum 22.12).
- Frontend: Cloudflare Pages `scalpeldiary`, production branch `main`, output `client/dist`; Node 24. Production API is `https://scalpeldiary-production.up.railway.app/api`.
- Install with `npm ci` in each package; build with the root `build:server` and `build:client` scripts. Both lockfiles are authoritative.
- Backend `npm start` runs reviewed, checksum-protected SQL migrations before listening. New migrations go in `server/src/database/migrations/`; never change a migration already applied.
- Take a restricted backup outside the repository before migrations and rehearse restoration in an isolated database. Never seed production or restore over the live database as a routine rollback.
- Deploy the repository root with `railway up --service scalpeldiary`; the service selects `/server`. Verify `/health` and `/ready` on the Railway domain.
- Build the frontend with its production API URL, then run local `wrangler pages deploy dist --project-name scalpeldiary --branch main` from `client/`. The Git integration remains connected. Check the custom domain, asset fingerprint and headers after release.
- Roll back code using the provider's previous deployment only after checking compatibility with the current schema. These migrations preserve old rows and add constraints; a code rollback does not reverse data changes or key rotation.

## Checks

CI builds both packages, runs frontend unit tests and real PostgreSQL integration tests, audits dependencies and compares the duplicated shared runtime definitions. Local integration tests require `TEST_DATABASE_URL` pointing to a loopback-only `scalpeldiary_test` or `scalpeldiary_restore` database. Initialize a new test database using `server/tests/fixtures/baseline-schema.sql`, then run `db:upgrade` from `server/` before tests. Fixtures are synthetic. Never point tests at production.

`/health` is process liveness; `/ready` checks database/schema access. A successful HTTP check does not prove real-device push delivery. Notification intent is queued transactionally, with bounded retries. Inspect unsent outbox rows and scheduler claims when investigating delivery; avoid printing notification bodies or patient data. Failed login attempts are rate limited per IP.

## Credentials and data

Keep JWT, database, mail and VAPID private values in Railway variables. Never copy them into files, reports, shell arguments or logs. The browser obtains the public push key from the authenticated API. Key rotation requires existing clients to reopen/reload the app so subscriptions can be recreated. Account deactivation preserves records; password changes/resets revoke old tokens. Historical Git revisions contain the former push key; replacement of the live key makes it obsolete, while history rewriting requires a separate coordinated operation.

Four legacy completed assignments have no matching presentation record in the available database. Display their completed history with an unavailable-link notice. Do not fabricate presentations or silently mark them incomplete. Recovery would require additional historical evidence/backups.

## Remaining improvement opportunities

The correctness/security fixes do not constitute a full accessibility certification, load test or real-device push-delivery test. Larger-history pagination, centralized resident-view state, replacing every legacy alert/modal, consolidated shared-source generation and external alerting remain future improvements. The UI has route splitting, sanitized keyboard-accessible detail dialogs, an error boundary and an offline warning; offline writes are not queued.
