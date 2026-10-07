# ScalpelDiary application assessment

Assessment date: 7 October 2026. Source baseline: `d77c4600e29282e15a454b03c150dd1e45b3586e`.

ScalpelDiary has substantial working functionality and a usable interface, but several backend guarantees do not match what its screens promise. Data preservation, access control, presentation completion, and reporting consistency should take priority over adding features. Successful builds do not resolve these issues.

## Scope and evidence

This assessment builds on the file-by-file source inventory in `FILE_INVENTORY.md` and architecture map in `APP_MAP.md`. It covers resident, supervisor, chief-resident, management and master flows; authentication; procedures; presentations; comments; analytics/progress; schedules; notifications/PWA; exports; database constraints; dependencies; deployment and maintenance.

Evidence classifications used below:

- **Production confirmed:** read-only PostgreSQL schema/aggregate queries, Railway metadata, or public-site access. Database connections forced read-only transactions. No patient records were exported.
- **Locally reproduced:** actual compiled Express handlers with a synthetic database adapter and synthetic JWTs, or the built frontend with intercepted synthetic API responses. These tests establish handler/UI behavior, not a production exploit.
- **Source confirmed:** direct control-flow, SQL or UI inspection. Consequences that depend on user actions are described as risks, not incidents already observed.
- **Not verified:** complete browser testing of every role/device, concurrent load, real push delivery, backup restoration, Cloudflare configuration, and every historical migration.

No production writes, resets, permission changes, migrations, key rotations or deployments were performed for this assessment. Authenticated production mutation endpoints were not tested. The local API harness never connected to PostgreSQL or notification services.

### What passed

- Frontend Vite/TypeScript build and backend TypeScript build passed.
- Production API health returned HTTP 200. The public site loaded in Chrome with HTTP 200. An earlier automated HTTP client received 403; that was not evidence of a site outage.
- Railway's successful backend deployment matches the reviewed Git commit and uses `/server` as its root. The root-directory uncertainty in the earlier architecture map is resolved.
- The sample procedures screen rendered without JavaScript page errors at 1440px and 390px. The mobile document did not overflow horizontally; its wide table scrolls within its container.
- Shared runtime definitions match their backend copies at this baseline.
- Production aggregate checks found no procedure/presentation year-owner mismatches, self-supervision, or out-of-range stored ratings. No duplicate case-insensitive emails or push endpoints shared between multiple users were found.

### Production snapshot

| Item | Observed state |
| --- | --- |
| Accounts | 41 residents, 28 supervisors, 1 master; 2 supervisors have management access; no suspended accounts |
| Procedures | 1,569: 1,287 pending, 243 rated, 39 not witnessed |
| Presentations | 11: 9 pending, 2 rated |
| Assignments | 9 assigned; 5 presented, all 5 without a linked presentation |
| Academic years | Three active records for 2026–2027, all starting July 2026 |
| Rotations | 114, all attached to academic-year ID 1 |
| Other scheduling | 54 duty entries, 43 activity entries |
| Push subscriptions | 22 |

The roughly 82% pending-procedure share is a workflow signal, not proof of a software defect or supervisor inactivity. A useful next analysis would separate backlog by age, supervisor and detachment status.

## Findings and improvements

Priorities: **P0** = prevent potential irreversible loss promptly; **P1** = security or major functional correctness; **P2** = reliability, consistency and usability; **P3** = maintenance and polish. Priority is an engineering recommendation, not a formal security score.

### 1. P0 — Changing a resident's year can delete their training history

**Evidence:** `server/src/routes/users.ts:460–482` deletes every resident-year row and inserts one replacement. The production foreign keys from both `surgical_logs.year_id` and `presentations.year_id` use `ON DELETE CASCADE`. The local route test confirmed the DELETE/INSERT sequence with no transaction.

**Impact:** A master changing a resident's year can erase that resident's procedures and presentations across existing years. Failure between the two statements also leaves no year record. The current database has one year per resident, but that does not establish that deletion has already occurred.

**Improvement:** Preserve historical years and append/select the new current year. Distinguish promotion from correcting an erroneous year. Use a transaction, validate allowed transitions, and test record preservation. Verify a restorable backup before any data repair. Avoid using the current year-change action until corrected.

### 2. P1 — Resident data and private feedback are insufficiently protected by the API

**Evidence:** `server/src/routes/general-comments.ts:9,27`, `logs.ts` resident lookup, `analytics.ts:100,408`, `progress.ts:9`, and resident-year lookups do not consistently enforce viewer role, ownership or approved resident scope. General-comments returns `gc.*` plus supervisor identity. Analytics returns anonymous feedback and exact scores even when the resident UI hides them. Local tests: a resident could read another resident's comments (200) and insert a general supervisory comment (201).

**Impact:** UI restrictions can be bypassed using authenticated API requests. Feedback confidentiality and supervisory attribution are not dependable. One anonymous general comment exists in production; its text was not retrieved for this assessment.

**Improvement:** Define a role/relationship permission matrix and enforce it centrally on every route. Return audience-specific response fields; omit confidential fields on the server. Prevent residents from authoring supervisor-only feedback. Add cross-role and cross-resident denial tests.

### 3. P1 — Suspension does not stop login; existing tokens are not revoked

**Evidence:** `server/src/routes/auth.ts:11` checks the password but not suspension. `middleware/auth.ts:14` validates only the JWT; tokens last seven days. A synthetic suspended user received a successful login and token in the local handler test.

**Impact:** The administrative suspension action does not provide the promised access restriction. Password changes and role changes do not automatically invalidate existing token claims; deleted-account tokens can still pass the authentication middleware until expiry, although individual database operations may subsequently fail.

**Improvement:** Check current account status at login and authorization time. Add session/token-version invalidation for suspension, password resets and role changes. Protect the last master account from deletion or suspension server-side. Add login throttling; no application-level limiter was found. Edge-level rate limiting was not inspected.

### 4. P1 — A committed private push key matches production

**Evidence:** Tracked `PUSH_NOTIFICATIONS_KEYS.md` contains a private VAPID key. An in-memory comparison confirmed that it matches the backend production variable. The value is intentionally omitted from this report and evidence files.

**Impact:** The private key is available to anyone with access to the repository/history. This is a push-signing secret; it does not by itself reveal account passwords or database credentials. No misuse was investigated or established.

**Improvement:** Rotate the VAPID key pair, update backend/frontend configuration, plan browser re-subscription, remove the secret from current files and repository history, and enable secret scanning. Rotation should be coordinated because subscriptions are associated with the application-server key.

### 5. P1 — Detachment verification contains unsafe SQL construction

**Evidence:** `server/src/routes/logs.ts:673–674` directly interpolates the request's month into UPDATE SQL. This endpoint is restricted to master/management or management-enabled supervisors; that restriction narrows exposure but does not make the query safe.

**Impact:** A malformed or malicious month can alter SQL behavior or fail the verification operation. No injection was attempted against production.

**Improvement:** Parameterize every value, validate the month as YYYY-MM, validate ratings, and execute the procedure/presentation batch in one transaction. Remove string-built rating/comment fragments too.

### 6. P1 — Record values are inserted into raw HTML

**Evidence:** `client/src/pages/resident/Dashboard.tsx:423,888,1015` and `Presentations.tsx:571` construct popup content with `innerHTML`, including stored values such as diagnosis or presentation title. The authentication token is in local storage.

**Impact:** Stored HTML/script injection is possible where user-controlled values reach those templates without escaping. Token storage increases the consequence of an XSS defect. This is a source-confirmed injection sink; no production payload was submitted.

**Improvement:** Replace imperative HTML strings with React modal components and text rendering. If formatted HTML is genuinely required, sanitize it with a tightly restricted policy. Add malicious-text rendering tests and assess an appropriate Content Security Policy.

### 7. P1 — Rated presentations can be edited or deleted through earlier routes

**Evidence:** `server/src/routes/presentations.ts:124,149` register PUT/DELETE handlers before stricter duplicates at `396,432`. Express handles the earlier matching route, bypassing the later pending-only guard. Synthetic rated-record tests returned 200 for both operations; the executed SQL checked ownership but not status.

**Impact:** The backend permits changes the UI intends to forbid. The earlier update also ignores supervisor/detachment fields that later code handles, creating apparent saves that do not persist all requested changes.

**Improvement:** Keep one update and one delete implementation, enforce the agreed status/current-year rules server-side, and explicitly validate editable fields. Test pending, rated, wrong-owner and previous-year cases.

### 8. P1 — Assignment completion disagrees with the production schema

**Evidence:** `server/src/routes/presentation-assignments.ts:243–296` inserts a presentation, then updates `presented_date` and `presentation_id`. Production has no `presented_date` column. The catch block falls back to updating only status. All five presented assignments currently have null links. Listing queries include presented assignments only when a linked presentation exists.

**Impact:** Completed assignments disappear from those listings and lose their relationship to the generated presentation. Repeating completion can create another presentation because there is no status precondition/idempotency protection. Missing-column failure explains the current code path; the history of each existing null link was not reconstructed.

**Improvement:** Apply a reviewed versioned schema migration, make completion transactional and idempotent, remove the silent fallback, and reconcile existing links using corroborating evidence. Do not guess links from title alone.

### 9. P1 — Multiple academic years are active simultaneously

**Evidence:** Production has three active 2026–2027 records. All 114 rotations belong to ID 1. `server/src/routes/rotations.ts:170` selects the active year with unordered `LIMIT 1`. Activation writes are separate statements; no uniqueness constraint enforces one active year.

**Impact:** Different code paths can choose different IDs and show missing or inconsistent rotations. Selecting the populated record today does not guarantee future consistency.

**Improvement:** Reconcile duplicate records without losing referenced rotations, enforce at most one active year with a database constraint, and activate years transactionally. Show a useful state when none is active.

### 10. P1 — Supervisor resident-view year filters do not handle UUIDs

**Evidence:** `AllProcedures.tsx:91`, `RatedLogs.tsx:66`, `Presentations.tsx:181` and `Dashboard.tsx:296` use `parseInt(selectedYear)`, although production `resident_years.id` is UUID. Wrappers also parse resident UUIDs into integers. A browser test selected Year 1 in the read-only procedures view; the selector changed but no year-specific request was sent.

**Impact:** Supervisors/management can see stale or unfiltered records under a selected-year label. Not every wrapper use was proven broken: some screens rely on session storage instead of the parsed store value.

**Improvement:** Treat IDs as strings throughout shared types, stores and API contracts. Use one resident-view context and refetch all dependent data on year changes. Test two historical years with deliberately different records.

### 11. P1 — Account deletion can erase other residents' supervised records

**Evidence:** `server/src/routes/users.ts:493` explicitly deletes procedures and presentations where the deleted user is either resident or supervisor. The multi-step deletion has no encompassing transaction.

**Impact:** Deleting a departing supervisor can erase residents' training evidence, not just that supervisor's account. A mid-operation failure can leave partial deletion.

**Improvement:** Prefer account deactivation/archival. Preserve authorship and supervisory history with a retained or anonymized reference. Define deliberate retention/deletion rules and restrict irreversible operations server-side.

### 12. P2 — Profile-photo contracts conflict

**Evidence:** Supervisor settings sends multipart FormData (`client/src/pages/supervisor/Settings.tsx:36`), whereas `server/src/routes/users.ts:374` expects JSON `profilePicture`. Resident settings allows up to 2 MB, while `server/src/index.ts:50` uses Express's default JSON limit. A synthetic 150 KB JSON image request returned 413 before reaching the route.

**Improvement:** Standardize the upload API for every role. Validate content and size server-side; compress images and preferably store file objects with URLs. Align displayed limits with transport/base64 overhead and show actionable upload errors.

### 13. P2 — Rating, progress and category rules disagree

**Evidence:** Procedures use truthiness of rating to choose RATED versus NOT_WITNESSED (`logs.ts:199`); presentation rating rejects zero; range validation is incomplete. `progress.ts:36` includes every non-pending procedure, including NOT_WITNESSED. There are 39 such records. Resident rating UI checks `MINOR_SURGERY`, while production stores `Minor Surgery`; backend seniority rules are not identical to the UI restrictions. Presentation types include both `MORNING_PRESENTATION` and `Morning Presentation`.

**Impact:** Zero has different meanings, eligibility can be wrong, verified/progress totals can include unwitnessed work, and equivalent categories can split analytics. Not every unwitnessed record necessarily contributes to progress: requirement matching and caps also apply. No out-of-range stored rating was found.

**Improvement:** Agree on valid rating range, explicit not-witnessed status, eligible raters, detachment treatment and what counts toward competence. Implement one shared rule set plus API/database validation. Normalize stored identifiers with display labels kept separately.

### 14. P2 — Filtered PDF reports can contain unfiltered analytics

**Evidence:** `client/src/pages/resident/Settings.tsx:149–164` filters rows by date/category/institution but fetches analytics for the whole year. Raw comparisons against a YYYY-MM-DD end date can exclude that date when the API serializes a timestamp. The same comparison pattern appears in procedures filtering.

**Impact:** Report detail rows and summary totals can disagree, and end-date records can be omitted. Numeric rating visibility in exports should follow the same audience policy as the screens.

**Improvement:** Build report rows and summaries from one filter contract, normalize date-only values, make end dates inclusive, and print the applied scope in the report. Test an end-date case and reconcile every total with its included rows.

### 15. P2 — Multi-step changes are not atomic

**Evidence:** AddLog creates multiple procedure entries with separate concurrent requests. Assignment completion, detachment verification, account/year changes and schedule replacement use multiple independent writes. Some notification failures occur after a successful write but still cause an error response.

**Impact:** Partial completion and duplicate retries are possible. A user may reasonably resubmit after an error even though a record was already saved.

**Improvement:** Use batch API endpoints with transactions, request idempotency where retries are likely, and an outbox for notifications. Return clearly whether the primary operation committed.

### 16. P2 — Scheduling display and reminder rules differ

**Evidence:** Academic years accept a configurable start month, while several rotation displays assume July. `server/src/services/dailyNotifications.ts:107–123` compares the next calendar month directly with academic `month_number`. With a July start, those indices differ. The hourly interval runs relative to process startup, not exactly at the advertised minute, with no durable delivery ledger.

**Impact:** Monthly reminders can select the wrong rotation. Restarts/outages can skip delivery; multiple instances can duplicate it.

**Improvement:** Centralize academic-month conversion and Addis Ababa calendar handling. Use a durable schedule with unique event keys, retries and delivery status. Test June/July, December/January and an alternative start month.

### 17. P2 — Category color changes are not persisted

**Evidence:** Scheduling screens submit category colors, but POST/PUT category handlers in `server/src/routes/rotations.ts`, `duties.ts` and `activities.ts` omit color from their persisted fields while reads return color.

**Improvement:** Include validated colors in the contract and database writes, or remove the unsupported control. Verify the color remains correct after reload across calendar, table and PDF views.

### 18. P2 — Push subscription and PWA lifecycle need repair

**Evidence:** `NotificationPermission.tsx` subscribes during the permission-request flow but does not reconcile the subscription on every authenticated session when permission is already granted. Logout does not unsubscribe. `client/public/sw.js` compares absolute client URLs with relative notification URLs, uses a static cache name, and caches non-API GET responses without bounds/status checks.

**Impact:** Shared-device account changes can leave subscriptions associated with an old user; notification clicks may open extra windows. Offline/update behavior is limited. No endpoint was currently shared by two users in production, and cross-account notification delivery was not reproduced.

**Improvement:** Reconcile subscription ownership on login/logout, normalize click URLs, version/bound caches, and show clear offline states. Do not imply offline submission support without a queue and conflict policy. Use explicit notification entity type/ID rather than message matching or ID-shape inference; current integer presentation IDs make the existing heuristic work today but leave it fragile.

### 19. P2 — Dependency audit reports unresolved advisories

Live npm audit results at assessment time:

| Lockfile | Critical | High | Moderate | Low | Total affected package nodes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Client | 1 | 19 | 6 | 1 | 27 |
| Server | 2 | 4 | 18 | 0 | 24 |

Direct packages flagged include frontend Axios, jsPDF/AutoTable, React Router and build tooling; backend Express and Nodemailer. Transitive findings include XML parsing and authentication-related packages.

These counts include development/transitive dependencies and overlapping advisory chains; they are not counts of proven exploitable application vulnerabilities. Browser-only use, unused transports and platform-specific tooling matter. The deployed dependency installation was not independently fingerprinted against every local resolved package.

**Improvement:** Triage runtime reachability, update maintained dependencies in controlled groups, and verify authentication, routing, image/PDF export and mail behavior. Some suggested fixes cross major versions; do not run a blind force-upgrade. Add dependency scanning to CI and document accepted/non-applicable findings.

### 20. P2 — Error handling and accessibility need consistent components

**Evidence:** The inspected screens use a mixture of alerts, direct DOM modals, silent catches and loading states; some empty-year/error paths do not complete normal loading. Modal implementations are duplicated rather than using one focus/keyboard contract. The mobile procedures table keeps important rating/actions offscreen until horizontal scrolling.

**Improvement:** Use accessible shared dialogs, focus return, Escape dismissal, labelled icon buttons, consistent toasts and retry states. Provide deliberate empty/loading/error/offline states. Consider mobile procedure cards or sticky identifying columns and an obvious scroll affordance. The sampled screen was visually usable; this was not a comprehensive accessibility audit.

### 21. P2 — Performance will degrade with larger histories

**Evidence:** The frontend main bundle is approximately 1,531 KB / 399 KB gzip and triggered Vite's chunk warning. Record lists commonly fetch full histories and filter client-side; resident browsing and reminders use repeated per-resident queries. Badges and screens repeat related requests.

**Improvement:** Split by role/route, lazy-load PDF/chart code, paginate searchable history, cache shared data and batch analytics/reminder queries. Check query plans and index needs before adding indexes indiscriminately. Establish load-time and query-latency baselines on a realistic phone/network. No production load test was performed.

### 22. P2 — Schema management and automated checks are not dependable enough

**Evidence:** Historical migration variants disagree, there is no unified version ledger, and assignment routes execute schema alteration/backfill at import. The missing production column is an actual consequence of code/schema drift. No maintained automated test suite or CI quality gate was found in the reviewed project. Database validation lacks several status/rating/active-year invariants.

**Improvement:** Consolidate reviewed migrations with a version ledger, remove startup schema writes and routine migration HTTP endpoints, validate upgrades in staging, and add a compact regression suite around the critical findings. Add foreign-key ownership/uniqueness/check constraints where the domain permits them. Verify backups by restoring to an isolated database; backup recoverability was not tested.

### 23. P3 — Monitoring, sensitive logging and documentation need cleanup

**Evidence:** Login handlers log identity and password-validity results; other handlers log procedure names, assignments and detailed errors. Activity tracking can fail silently. Source stores general update timestamps but no dedicated password-change event. Old deployment/setup notes and README scripts conflict with the current app. Shared definitions are duplicated, although they currently match.

**Improvement:** Use structured, redacted logs with request IDs; record security/admin changes without secrets or patient details; alert on swallowed tracking failures. Separate liveness from database readiness checks. Publish one current setup/runbook and deprecate historical instructions. Generate or import shared contracts from one source.

## Recommended delivery order

1. **Protect records and access:** stop destructive year replacement/account deletion behavior; implement authorization and feedback filtering; enforce suspension/revocation; remove unsafe SQL/HTML; rotate the committed key. Add targeted regression tests before release.
2. **Repair current inconsistencies:** migrate assignment schema and reconcile five links; resolve three active academic-year rows while preserving rotations; fix UUID filters and presentation guards. Take and verify a backup before reconciliation.
3. **Unify business rules:** rating/verification policy, category identifiers, seniority, year ownership, detachment and date/report semantics. Test identical results across resident, supervisor, management and PDF views.
4. **Improve reliability and usability:** transaction/idempotency boundaries, uploads, scheduler/subscriptions, error states, accessible modals, responsive record views and performance.
5. **Make releases repeatable:** dependency updates, versioned migrations, CI, permission tests, staging smoke tests, restore exercises, monitoring and a current runbook.

## Minimum acceptance checks for the fixes

- Promoting a resident preserves every historical procedure/presentation and rolls back cleanly on failure.
- Every role is tested against own/other resident data; confidential fields are absent from unauthorized JSON responses.
- Suspended users cannot obtain or reuse sessions; reset/revocation semantics work with an already-issued token.
- Rated presentation edits/deletes are rejected through direct API calls as well as the UI.
- Completing an assignment twice creates one linked presentation; injected failure leaves neither a half-link nor a falsely completed assignment.
- Exactly one academic year is active, and rotations remain associated correctly after reconciliation.
- UUID year filters change data and metrics correctly with multiple years.
- Zero/min/max ratings, unwitnessed work and detachments follow the agreed policy everywhere.
- PDF totals reconcile with filtered rows, including the final date.
- Upload limits, mobile dialogs, push account switching, offline errors and scheduler retries behave predictably.

## Saved evidence

`assessment-2026-10-07/backend-checks.json` records seven synthetic route/parser probes. `browser-checks.json` records the UUID selector reproduction, mobile width and public website check. `desktop.png` and `mobile.png` contain only synthetic records. Raw credentials, keys, tokens and patient data are excluded. Temporary local scripts used only synthetic state; no application fix was included in this assessment.
