# ScalpelDiary application map

Baseline: 2026-10-07, Git `d77c460`. This describes inspected local source, not a certification of deployed behavior. See `FILE_INVENTORY.md` for individual files and `../SESSION_LOG.md` for work history.

## Architecture and execution

ScalpelDiary manages surgical resident training: procedures, presentations, supervisory feedback, required procedure counts, schedules, and administrative oversight.

- `client/src/main.tsx` mounts `App.tsx`. React 18, TypeScript, Vite, Tailwind, React Router, Zustand, Axios, Recharts, date-fns, and jsPDF supply the frontend.
- `App.tsx` registers the service worker, refreshes the logged-in user, and selects routes by account role. `Layout.tsx` supplies role-specific navigation, profile details, badges, notifications, and activity heartbeats.
- `authStore.ts` persists user/token in local storage. `api/axios.ts` attaches the bearer token and clears authentication on HTTP 401. Resident browsing primarily uses session-storage flags, with a separate view-mode Zustand store in wrappers.
- `server/src/index.ts` sets CORS and JSON parsing, mounts 14 API routers, exposes `/health`, and starts the in-process notification scheduler.
- Backend routes perform PostgreSQL queries directly through `database/db.ts`; there is no ORM or separate business-service layer for most features. JWT authentication and role checks are split between middleware and individual route bodies.
- `shared/` supplies frontend requirements/types/utilities through the `@shared` alias. The backend imports its own copies under `server/src/shared/`. All three runtime file pairs matched at review time.

Development commands from the project root: `npm run dev:client` and `npm run dev:server`. Vite listens on 5173 and proxies `/api` to port 3000; `VITE_API_URL` can override the API base. Build commands are `npm run build:client` and `npm run build:server`. Backend production start is defined in `server/package.json`.

Documentation describes Cloudflare Pages for the frontend and Railway/PostgreSQL for the backend. The root `railway.json` uses `npm run build` and `npm run start`, which are backend-package commands; deployment depends on the configured working/root directory. During the subsequent 2026-10-07 assessment, Railway metadata confirmed the backend deployment uses `/server` and matches Git `d77c460`; the root-directory concern is resolved.

## Roles and workflows

| Role | Main behavior and source ownership |
| --- | --- |
| Resident | Dashboard/calendar/progress; create multiple procedure entries for one patient encounter; review procedures; presentations and assignments; analytics/comments; profile/password/PDF export. `client/src/pages/resident/`. |
| Senior resident | Can supervise junior residents' procedures. Backend compares maximum resident year; the resident rating screen also has older category/year restrictions. |
| Chief resident | An `is_chief_resident` flag on a resident, not a separate role string. Adds rotation, duty, activity, category, and presentation-assignment screens under `pages/chief-resident/`. |
| Supervisor | Rate procedures/presentations, browse resident profiles, assign presentations, add general and post-op comments, inspect submitted ratings. `pages/supervisor/`. |
| Management | Browse residents/supervisors and verify detachment batches. `pages/management/`. Supervisors can receive `has_management_access`. |
| Master | Account creation/editing, passwords, resident years, access flags, browsing, activity monitoring, detachment verification, and privileged deletion. `pages/master/`. Migration endpoints remain in the backend despite removal of dashboard migration buttons. |

### Procedures and ratings

`resident/AddLog.tsx` loads the requirements catalogue, resident years, diagnosis suggestions, and eligible supervisors. It creates one `/api/logs` request per procedure, concurrently. Procedure and patient information, category, role, remarks, and supervisor are saved in `surgical_logs`.

Assigned supervisors see `/logs/to-rate`; ratings update the log and notify the resident. A missing rating means `NOT_WITNESSED`. Resident and supervisor displays use four rating bands: 90+ Excellent, 71–89 Good, 50–70 Satisfactory, below 50 Poor. Numeric scores are normally shown to supervisors/management/master; resident displays generally use labels. Multiple screens implement their own display details.

The normal procedure edit/delete endpoints check ownership and `PENDING`; master deletion can remove rated records. `RatingsDone.tsx` adds post-op follow-up comments through `/logs/:logId/postop-followup`.

### Presentations

Direct entries live in `presentations`. Assignments are separate records in `presentation_assignments`, created by chief residents or supervisors. Residents mark an assignment presented; the backend inserts a pending presentation, links it to the assignment, and notifies the moderator. Supervisors submit the rating through `/presentations/:presentationId/rate`.

The live route code uses assignment statuses `assigned` and `presented`; some types and migration defaults still use older uppercase statuses. Historical schemas use both UUID and integer presentation IDs. Notification detail views currently infer the item type from whether its ID contains a hyphen.

### Detachments

Procedure venue and certain categories trigger detachment handling. ALERT can offer eligible senior residents on the matching active rotation; other contexts accept an external supervisor name. Presentation detachment venues also include ER, ICU, and anesthesiology.

`management/DetachmentLogs.tsx` groups procedures and presentations by resident, detachment type, and month. `/logs/detachment-verify` stores separate detachment verification/rating fields across a batch; these fields are distinct from the ordinary supervisor rating.

### Progress and analytics

`procedureRequirements.json` defines grouped assisted/performed minima for four years: 29/48/57/51 groups respectively. The current totals of assisted plus performed requirements are 615/406/386/328; these are configuration values, not independently validated curriculum requirements.

`calculateYearProgress` matches trimmed, case-insensitive exact procedure names; primary roles count as performed, assistants and observers as assisted, and unknown roles also fall back to assisted. Achievements are capped per requirement before calculating overall percentage. The API includes every non-pending log, including `NOT_WITNESSED`.

Analytics aggregates logs/presentations by year, role, category, institution, supervisor, and rating. The dashboard also fetches calendar data and scheduling cards. Read-only wrappers reuse resident screens. Some metrics count entries while supervisor statistics also count distinct `(mrn, date)` encounters; these are different measures.

### Scheduling

Rotations use `academic_years`, `rotation_categories`, and `yearly_rotations`, with month numbers relative to the academic year. Duties use `duty_categories`/`monthly_duties`, unique per resident/date. Activities use `activity_categories`/`daily_activities` and permit multiple entries. Chief screens offer calendar/table or category views and client-side PDF export. Several display paths assume a July academic-year start even though the API allows other start months.

### Notifications and PWA

Event notifications are stored in PostgreSQL, optionally sent via Web Push, and shown by `NotificationBell`/`NotificationPopup`. Read notifications are scoped to the authenticated user; fetching notifications marks unread items older than 48 hours read and returns up to 50 from the last 30 days. Popup IDs are remembered in session storage.

`dailyNotifications.ts` checks hourly for activities at 04:00 UTC and next-day duties/month-end rotations at 17:00 UTC (07:00 and 20:00 EAT). These scheduled messages are push-only. Execution is tied to server uptime and the interval's startup offset, with no durable job queue or delivery ledger.

`client/public/sw.js` uses network-first caching, skips API requests, and handles push clicks. `manifest.json` and the install prompt enable PWA installation.

### Accounts, reports, and monitoring

Master account management calls `users.ts`; passwords are bcrypt hashes and login issues a seven-day JWT. Profile pictures in the current resident flow are base64 strings stored in the database. No implemented S3 upload route or AWS SDK dependency was found, despite older deployment documentation.

Resident settings generate report PDFs with optional date/category/institution filters and an analytics appendix. Chief screens render schedule PDFs, using shared header/footer helpers in `client/src/utils/pdfExport.ts`.

Login records user-agent/screen-derived device fingerprints; layout sends last-seen heartbeats. Master activity monitoring reads login sessions, cross-role device alerts, resident activity, and supervisor response backlogs. Logging failures are intentionally swallowed, so missing monitoring schema can produce empty/zero results.

## Database and setup caveats

The base migration creates UUID `users`, `resident_years`, `surgical_logs`, and `notifications`. Later standalone scripts and API migrations add presentations, scheduling, comments, detachments, push subscriptions, and monitoring. There is no single versioned migration ledger. The comprehensive migration is not equivalent to all newer API migrations.

Historical scripts disagree about user foreign-key types, presentation IDs, assignment column names/statuses, and push-subscription constraints. Some standalone scripts target a hardcoded local PostgreSQL connection, while others use `DATABASE_URL`. Presentation assignment routes also attempt schema alteration/backfill when imported. Establish actual schema before migration or runtime investigation.

The README's `npm run migrate` / `npm run seed` examples do not match the package scripts (`db:migrate` / `db:seed`). The README roadmap also lists PDF export as future work although it exists. Historical completion notes and the original specification are context, not proof of current behavior.

## Existing observations to revisit when relevant

Follow-up: `APP_ASSESSMENT_2026-10-07.md` contains the later production schema checks, local reproductions, prioritized findings and improvement plan. The observations below preserve the initial source-review baseline.

These were found in local source; none was fixed or tested against deployed data in this session.

1. **Resident-year replacement can delete history:** `users.ts` deletes all existing `resident_years` when changing a resident's year. Base schema cascades year deletion into surgical logs, and presentation schemas also declare cascading year references.
2. **Presentation guards are shadowed:** earlier PUT/DELETE `/:id` handlers in `presentations.ts` respond before later `/:presId` handlers, bypassing the later pending-only checks and differing update fields.
3. **Authorization/privacy needs review:** several resident-specific data endpoints and general-comment endpoints require authentication without enforcing the intended viewer role/ownership. Raw responses include scores and anonymous-comment fields even when the UI hides them. Login/middleware do not check `is_suspended`.
4. **Detachment SQL interpolation:** the batch-verification route interpolates the request's month directly into SQL; most other routes parameterize values.
5. **HTML injection risk:** dashboard/presentation detail popups interpolate record values into `innerHTML` instead of using React text rendering.
6. **ID inconsistencies:** wrappers and several year selectors parse UUID strings as integers; presentation notification logic assumes integer IDs. Current backend database schema was not inspected.
7. **Profile-upload mismatch:** supervisor settings posts multipart FormData, but the backend accepts JSON and stores a `profilePicture` value. The resident screen permits images up to 2 MB while Express uses its default JSON-body limit.
8. **Category colors are ignored by mutation routes:** scheduling screens submit `color`, but category POST/PUT handlers do not persist it.
9. **Non-atomic workflows:** multi-procedure creation, assignment completion, detachment verification, and delete/recreate scheduling span separate writes. Partial failure can leave incomplete state or duplicate retries. Some successful writes can be followed by notification failures that turn the response into an error.
10. **Calendar and rotation assumptions:** academic-month versus calendar-month handling differs between views and scheduled rotation reminders. Read-only dashboard year changes do not refresh all metrics through the same path as initial loading.
11. **Resident rating rules differ:** `LogsToRate.tsx` checks `MINOR_SURGERY` for year two, while catalogue category values are human-readable names, and the backend applies seniority rather than that same category restriction.
12. **Report filtering differs:** report rows can be filtered by month/range/category/institution, but the analytics appendix requests the full selected year. It also includes numeric aggregate ratings.

## Validation baseline

Frontend and backend TypeScript checks with `--noEmit` both passed on 2026-10-07. No test script is declared in the package manifests. No migration, seed, live database probe, server startup, browser workflow, production deployment, or notification delivery was performed. Source-level review does not establish runtime correctness or current production schema.
