# ScalpelDiary file inventory

Baseline: 2026-10-07, Git `d77c460`. File paths are relative to the project root.

## Review scope

Application modules were reviewed for logic, data flow, API calls, and JSX behavior; repetitive markup was inspected through extracted structure rather than a visual browser audit. Database files were reviewed for schema, mutations, invocation, and historical differences. Reference Markdown/HTML was indexed by topic/structure, with selected documents read in detail. The original PDF specification was text-extracted and read. Images/SVGs were catalogued as assets, not individually visually reviewed. Environment files were inspected by variable names only. Package lockfiles were inspected structurally, not dependency-by-dependency. Third-party dependencies, generated build output, `.git`, and OS metadata are excluded.

New review/logging documents: `../AGENTS.md`, `../SESSION_LOG.md`, `APP_MAP.md`, and this file.

## Application, configuration, and support files

| File | Review / responsibility |
| --- | --- |
| `.env.example` | Variable names inspected; values omitted: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CLIENT_URL. |
| `.env.template` | Variable names inspected; values omitted: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, FRONTEND_URL. |
| `.gitignore` | Build/configuration/support source inspected. |
| `ScalpelDiary_Project_Specification.pdf` | Read extracted text of all 3 pages; original three-role product specification, predating later features. |
| `client/.env.example` | Variable names inspected; values omitted: VITE_API_URL. |
| `client/.env.production` | Variable names inspected; values omitted: VITE_API_URL, VITE_VAPID_PUBLIC_KEY. |
| `client/index.html` | Build/configuration/support source inspected. |
| `client/package-lock.json` | Lockfile v3; 265 package records; structural inventory. |
| `client/package.json` | Package manifest reviewed. Scripts: dev, build, preview. |
| `client/postcss.config.js` | Build/configuration/support source inspected. |
| `client/public/manifest.json` | PWA name, standalone launch, theme, and icon references. |
| `client/public/sw.js` | Service-worker network-first cache, API exclusions, push events and click handling. |
| `client/src/App-simple.tsx` | Minimal React diagnostic page; not the mounted application. |
| `client/src/App.tsx` | Role-based route tree, authentication refresh, and service-worker registration. |
| `client/src/api/axios.ts` | API base URL, bearer authentication, and 401 handling. |
| `client/src/components/InstallPrompt.tsx` | Browser PWA install prompt. |
| `client/src/components/Layout.tsx` | Role navigation, mobile layout, profile, badges, notification UI, and heartbeat. |
| `client/src/components/Logo.tsx` | Reusable branding. |
| `client/src/components/NotificationBell.tsx` | Unread notification list, actions, routing, and rated-item details. |
| `client/src/components/NotificationPermission.tsx` | Notification permission and push-subscription registration. |
| `client/src/components/NotificationPopup.tsx` | Session-deduplicated notification popup and detail navigation. |
| `client/src/components/ProgressDetailModal.tsx` | Expandable requirement groups and assisted/performed progress. |
| `client/src/components/RatedItemModal.tsx` | Procedure/presentation rating detail modal. |
| `client/src/components/RoleSwitcher.tsx` | Supervisor/management view navigation. |
| `client/src/components/TodayOverviewModals.tsx` | Rotation, duty, activity, and calendar detail views. |
| `client/src/components/YearProgressBar.tsx` | Clickable annual progress summary. |
| `client/src/index.css` | Tailwind layers, typography, and popup/transition animations. |
| `client/src/main.tsx` | React application entry point. |
| `client/src/pages/LandingPage.tsx` | Public product landing screen. |
| `client/src/pages/Login.tsx` | Login form and device metadata submission. |
| `client/src/pages/chief-resident/AssignPresentation.tsx` | Presentation-assignment creation, editing, and cancellation. |
| `client/src/pages/chief-resident/MonthlyActivities.tsx` | Activity calendar/table, multiple residents per category, and PDF export. |
| `client/src/pages/chief-resident/MonthlyDuties.tsx` | Duty calendar/table, category management, replace-day assignment, and PDF export. |
| `client/src/pages/chief-resident/YearlyRotations.tsx` | Academic-month assignment, categories, overview, and PDF export. |
| `client/src/pages/management/Dashboard.tsx` | management dashboard: metrics, role navigation, and applicable scheduling/browsing panels. |
| `client/src/pages/management/DetachmentLogs.tsx` | Monthly detachment batches and verification/rating workflow. |
| `client/src/pages/management/ResidentBrowsing.tsx` | Residents grouped by year with progress and profile navigation. |
| `client/src/pages/management/SupervisorBrowsing.tsx` | Supervisor statistics and detail navigation. |
| `client/src/pages/management/SupervisorView.tsx` | Supervisor procedure/presentation records in administrative view. |
| `client/src/pages/master/AccountManagement.tsx` | User CRUD, access flags, year changes, suspension, and password reset. |
| `client/src/pages/master/ActivityMonitor.tsx` | Master monitoring tabs, sorting, device alerts, and pending-rating detail. |
| `client/src/pages/master/Dashboard.tsx` | master dashboard: metrics, role navigation, and applicable scheduling/browsing panels. |
| `client/src/pages/master/ResidentBrowsing.tsx` | Residents grouped by year with progress and profile navigation. |
| `client/src/pages/master/SupervisorBrowsing.tsx` | Supervisor statistics and detail navigation. |
| `client/src/pages/master/SupervisorView.tsx` | Supervisor procedure/presentation records in administrative view. |
| `client/src/pages/resident/AddLog.tsx` | Multi-procedure entry, catalogue selections, senior supervisors, and detachment context. |
| `client/src/pages/resident/AllComments.tsx` | Combined procedure/presentation/post-op comments with rating filters. |
| `client/src/pages/resident/AllProcedures.tsx` | Year/filter-based procedure browsing, detail display, edits, and deletions. |
| `client/src/pages/resident/Analytics.tsx` | Resident aggregate charts, progress, and comments. |
| `client/src/pages/resident/Dashboard.tsx` | resident dashboard: metrics, role navigation, and applicable scheduling/browsing panels. |
| `client/src/pages/resident/LogsToRate.tsx` | Resident-as-supervisor pending procedure ratings and year/category restrictions. |
| `client/src/pages/resident/Presentations.tsx` | Presentation CRUD, assignment completion, filters, and ratings. |
| `client/src/pages/resident/RatedLogs.tsx` | Procedures rated as resident supervisor; alternate resident browsing behavior. |
| `client/src/pages/resident/Settings.tsx` | Resident password/base64 profile/PDF reports. |
| `client/src/pages/supervisor/AllRatedPresentations.tsx` | Presentation-only submitted ratings and detail view. |
| `client/src/pages/supervisor/AllRatedProcedures.tsx` | Procedure-only submitted ratings and detail view. |
| `client/src/pages/supervisor/AssignPresentation.tsx` | Presentation-assignment creation, editing, and cancellation. |
| `client/src/pages/supervisor/Dashboard.tsx` | supervisor dashboard: metrics, role navigation, and applicable scheduling/browsing panels. |
| `client/src/pages/supervisor/GeneralComments.tsx` | Resident selection and general/anonymous comment submission. |
| `client/src/pages/supervisor/RatingsDone.tsx` | Submitted ratings with post-op follow-up editing. |
| `client/src/pages/supervisor/ResidentView.tsx` | Standalone legacy resident-detail implementation; not routed by App.tsx. |
| `client/src/pages/supervisor/Settings.tsx` | Supervisor password and multipart profile-upload forms. |
| `client/src/pages/supervisor/UnrespondedLogs.tsx` | Supervisor procedure/presentation rating tabs and anonymous comments. |
| `client/src/pages/supervisor/wrappers/AllProceduresWrapper.tsx` | Resident page reuse, session-storage guard, and view-mode store initialization. |
| `client/src/pages/supervisor/wrappers/AnalyticsWrapper.tsx` | Resident page reuse, session-storage guard, and view-mode store initialization. |
| `client/src/pages/supervisor/wrappers/PresentationsWrapper.tsx` | Resident page reuse, session-storage guard, and view-mode store initialization. |
| `client/src/pages/supervisor/wrappers/RatedLogsWrapper.tsx` | Resident page reuse, session-storage guard, and view-mode store initialization. |
| `client/src/pages/supervisor/wrappers/ResidentDashboardWrapper.tsx` | Resident page reuse, session-storage guard, and view-mode store initialization. |
| `client/src/store/authStore.ts` | Persistent authentication state. |
| `client/src/store/viewModeStore.ts` | Resident browsing/read-only state. |
| `client/src/utils/pdfExport.ts` | Shared jsPDF report header/footer helpers. |
| `client/src/utils/ratingUtils.ts` | Rating bands, badge colors, and numeric-score visibility. |
| `client/src/vite-env.d.ts` | Build/configuration/support source inspected. |
| `client/tailwind.config.js` | Build/configuration/support source inspected. |
| `client/tsconfig.json` | Build/configuration/support source inspected. |
| `client/tsconfig.node.json` | Build/configuration/support source inspected. |
| `client/vite.config.ts` | Build/configuration/support source inspected. |
| `docs/tutorial-chief-resident.html` | Tutorial structure/content indexed: Accessing Chief Resident Features; Yearly Rotation Scheduling; Monthly Duty Scheduling; Monthly Activity Scheduling; Assign Presentations; Exporting Schedules as PDF. |
| `docs/tutorial-management.html` | Tutorial structure/content indexed: Accessing Management Features; Browsing Residents; Viewing a Resident's Full Profile; Browsing Supervisors; Detachment Logs — Verifying External Rotations. |
| `docs/tutorial-resident.html` | Tutorial structure/content indexed: Install the App & Sign In; Set Up Your Profile; Dashboard Overview; 📅 Today's Overview; 📊 Stats & Progress; 📋 Recent Procedures & Presentations; 📆 Calendar View; Adding a Surgical Procedure; Adding a Presentation; Rating Other Residents (Year 2+); Understanding Your Ratings; Logging Detachment Procedures & Presentations; 🏥 General Surgery at ALERT; 📋 After the Detachment Month; 🔄 This applies to all detachments:; Analytics & Supervisor Comments; Exporting Your Data as PDF; Notifications. |
| `docs/tutorial-supervisor.html` | Tutorial structure/content indexed: Install the App & Sign In; Set Up Your Profile; Dashboard Overview; Browse Residents by Year; Rating Procedures (Unresponded Logs); Rating Presentations; Ratings Done & Post-Op Follow-Up; Assign Presentations; General Comments; Notifications. |
| `package-lock.json` | Lockfile v3; 1 package records; structural inventory. |
| `package.json` | Package manifest reviewed. Scripts: dev:client, dev:server, build:client, build:server, install:all, db:migrate, db:seed. |
| `railway.json` | Build/configuration/support source inspected. |
| `scripts/fix-production-db.sh` | Setup/deployment/diagnostic script inspected; not executed. |
| `scripts/prepare-deployment.bat` | Setup/deployment/diagnostic script inspected; not executed. |
| `scripts/prepare-deployment.sh` | Setup/deployment/diagnostic script inspected; not executed. |
| `server/.env.example` | Variable names inspected; values omitted: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, FRONTEND_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, MASTER_EMAIL, MASTER_PASSWORD, MASTER_NAME, CREATE_TEST_ACCOUNTS. |
| `server/package-lock.json` | Lockfile v3; 248 package records; structural inventory. |
| `server/package.json` | Package manifest reviewed. Scripts: dev, build, start, db:migrate, db:seed, db:delete-old-master, db:add-procedure-category, db:add-push-subscriptions, generate-vapid-keys. |
| `server/src/database/add-chief-resident-tables.ts` | Schema/operation and invocation review. add chief resident tables. Tables: academic_years, activity_categories, daily_activities, duty_categories, monthly_duties, presentation_assignments, rotation_categories, users, yearly_rotations. |
| `server/src/database/add-color-columns.ts` | Schema/operation and invocation review. add color columns. Tables: activity_categories, duty_categories, rotation_categories. |
| `server/src/database/add-management-role.ts` | Schema/operation and invocation review. add management role. Tables: users. |
| `server/src/database/add-missing-columns.ts` | Schema/operation and invocation review. add missing columns. Tables: users. |
| `server/src/database/add-notification-type.ts` | Schema/operation and invocation review. add notification type. Tables: notifications. |
| `server/src/database/add-presentations.ts` | Schema/operation and invocation review. add presentations. Tables: presentations. |
| `server/src/database/add-procedure-category.ts` | Schema/operation and invocation review. add procedure category. Tables: surgical_logs. |
| `server/src/database/add-profile-picture.ts` | Schema/operation and invocation review. add profile picture. Tables: users. |
| `server/src/database/add-push-subscriptions.ts` | Schema/operation and invocation review. add push subscriptions. Tables: push_subscriptions. |
| `server/src/database/add-remark-field.ts` | Schema/operation and invocation review. add remark field. Tables: surgical_logs. |
| `server/src/database/add-rotation-color-column.ts` | Schema/operation and invocation review. add rotation color column. Tables: rotation_categories. |
| `server/src/database/add-supervisor-fields.ts` | Schema/operation and invocation review. add supervisor fields. Tables: users. |
| `server/src/database/add-supervisors.ts` | Schema/operation and invocation review. add supervisors. Tables: users. |
| `server/src/database/add-suspended-column.ts` | Schema/operation and invocation review. add suspended column. Tables: users. |
| `server/src/database/check-color-columns.ts` | Schema/operation and invocation review. check color columns. |
| `server/src/database/clear-old-notifications.ts` | Schema/operation and invocation review. clear old notifications. Tables: notifications. |
| `server/src/database/comprehensive-migration.ts` | Schema/operation and invocation review. comprehensive migration. Tables: academic_years, activity_categories, daily_activities, duty_categories, monthly_duties, presentation_assignments, presentations, push_subscriptions, rotation_categories, surgical_logs, users, yearly_rotations. |
| `server/src/database/create-missing-tables.ts` | Schema/operation and invocation review. create missing tables. Tables: daily_activities, monthly_duties, presentation_assignments, yearly_rotations. |
| `server/src/database/db.ts` | Schema/operation and invocation review. db. |
| `server/src/database/delete-old-master.ts` | Schema/operation and invocation review. delete old master. Tables: users. |
| `server/src/database/ensure-active-academic-year.ts` | Schema/operation and invocation review. ensure active academic year. Tables: academic_years. |
| `server/src/database/fix-notification-log-id.ts` | Schema/operation and invocation review. fix notification log id. Tables: notifications. |
| `server/src/database/fix-scheduled-date-nullable.ts` | Schema/operation and invocation review. fix scheduled date nullable. Tables: presentation_assignments. |
| `server/src/database/migrate.ts` | Schema/operation and invocation review. migrate. Tables: notifications, resident_years, surgical_logs, users. |
| `server/src/database/run-setup-manually.ts` | Schema/operation and invocation review. run setup manually. Tables: academic_years, activity_categories, duty_categories. |
| `server/src/database/seed.ts` | Schema/operation and invocation review. seed. Tables: resident_years, users. |
| `server/src/database/update-presentation-assignments.ts` | Schema/operation and invocation review. update presentation assignments. Tables: presentation_assignments. |
| `server/src/database/update-presentations.ts` | Schema/operation and invocation review. update presentations. Tables: presentations. |
| `server/src/database/update-rotation-colors.ts` | Schema/operation and invocation review. update rotation colors. Tables: rotation_categories. |
| `server/src/database/update-schema.ts` | Schema/operation and invocation review. update schema. Tables: presentations, surgical_logs, users. |
| `server/src/database/update-surgical-logs.ts` | Schema/operation and invocation review. update surgical logs. Tables: surgical_logs, users. |
| `server/src/index.ts` | Express entry, CORS/JSON parsing, 14 API mounts, health check, scheduler startup. |
| `server/src/middleware/auth.ts` | JWT authentication/role guard. |
| `server/src/middleware/errorHandler.ts` | Final Express error response middleware. |
| `server/src/routes/activities.ts` | Category CRUD, monthly/today activity reads and assignment mutations. Endpoints: GET /categories; POST /categories; PUT /categories/:id; DELETE /categories/:id; GET /monthly/:year/:month; GET /; GET /today; POST /assign; PUT /:id; DELETE /:id. |
| `server/src/routes/activity-monitor.ts` | Login/activity logging, heartbeat, master reports, and device alerts. Endpoints: POST /heartbeat; GET /summary; GET /device-sessions; GET /suspicious; POST /dismiss-alert; GET /resident-activity; GET /supervisor-responsiveness; GET /supervisor-pending-details/:supervisorId. |
| `server/src/routes/analytics.ts` | Resident dashboard/analytics, supervisor metrics, and resident browsing. Endpoints: GET /dashboard; GET /resident; GET /supervisor; GET /supervisor/residents; GET /supervisor/resident/:residentId. |
| `server/src/routes/auth.ts` | Case-insensitive login, JWT issuing, and password change. Endpoints: POST /login; POST /change-password. |
| `server/src/routes/duties.ts` | Category CRUD, monthly/today duties, assignment upsert, and deletion. Endpoints: GET /categories; POST /categories; PUT /categories/:id; DELETE /categories/:id; GET /monthly/:year/:month; GET /today; POST /assign; PUT /:id; DELETE /:id. |
| `server/src/routes/general-comments.ts` | Resident comments, comment creation, and residents grouped by year. Endpoints: GET /resident/:residentId; POST /; GET /residents-by-year. |
| `server/src/routes/logs.ts` | Procedures, ratings, post-op follow-up, deletion, and detachment batches. Endpoints: GET /my-logs; POST /; GET /to-rate; GET /to-rate/count; POST /:logId/rate; GET /rated; GET /suggestions; GET /resident/:residentId; GET /supervisor/:supervisorId/rated; POST /:logId/postop-followup; PUT /:logId; DELETE /:logId; DELETE /master/:logId; GET /detachment-summary; GET /detachment/:residentId/:detachmentType; POST /detachment-verify. |
| `server/src/routes/migrations.ts` | Privileged schema inspection/repair, data normalization, and maintenance endpoints. Endpoints: POST /run-comprehensive; GET /status; POST /run-chief-resident-migration; GET /check-chief-resident-migration; POST /run-presentation-assignments-migration; POST /fix-scheduled-date-nullable; POST /add-notification-type; POST /clear-old-notifications; GET /debug/recent; POST /fix-notification-log-id; POST /normalize-data; POST /add-postop-followup; POST /setup-chief-resident; POST /add-detachment-columns; POST /add-residency-start-month; POST /add-comments-system; POST /add-activity-monitoring. |
| `server/src/routes/notifications.ts` | Notification retrieval/read state, subscriptions, and Web Push delivery. Endpoints: GET /; POST /subscribe; PUT /:notificationId/read; PUT /read-all. |
| `server/src/routes/presentation-assignments.ts` | Assignments, counts, completion into presentation records, edit/delete. Endpoints: POST /; GET /; GET /my-assignments; GET /my-assignments/count; GET /moderator-assignments/count; POST /:id/mark-presented; PUT /:id; DELETE /:id. |
| `server/src/routes/presentations.ts` | Presentation CRUD, ratings/statistics, browsing, and master deletion. Endpoints: GET /my-presentations; POST /; PUT /:id; DELETE /:id; GET /stats; GET /resident/:residentId; GET /rated; GET /to-rate; POST /:presentationId/rate; GET /supervisor/:supervisorId/rated; PUT /:presId; DELETE /:presId; DELETE /master/:presId. |
| `server/src/routes/progress.ts` | Year requirement progress from non-pending procedure logs. Endpoints: GET /year/:yearId. |
| `server/src/routes/rotations.ts` | Category/academic-year management and rotation assignments/reads. Endpoints: GET /categories; POST /categories; PUT /categories/:id; DELETE /categories/:id; GET /academic-years; GET /academic-years/active; POST /academic-years; PUT /academic-years/:id; GET /yearly/:yearId; GET /current/:residentId; GET /my-rotations; GET /; POST /assign; PUT /:id; DELETE /:id. |
| `server/src/routes/users.ts` | Accounts, resident years, profiles, eligible supervisors, access flags, batch dates. Endpoints: GET /resident-years/me; GET /resident-years/:residentId; GET /management/stats; GET /; POST /; POST /resident-years; POST /reset-password/:userId; GET /supervisors/stats; GET /supervisors/only; GET /supervisors; GET /detachment-supervisors; POST /toggle-senior/:userId; POST /profile-picture; GET /me; PUT /specialty; POST /change-password; PUT /:userId; PUT /:userId/year; DELETE /:userId; PUT /:userId/suspend; PUT /:userId/management-access; PUT /:userId/supervisor-access; PUT /:userId/activate; GET /batch-start-months; POST /batch-start-month; GET /:userId; PUT /:userId/toggle-chief-resident. |
| `server/src/services/dailyNotifications.ts` | Hourly in-process activity/duty/month-end rotation push scheduler. |
| `server/src/shared/procedureRequirements.json` | Current grouped requirements for years 1–4. |
| `server/src/shared/procedureUtils.ts` | Requirement catalogue lookup and annual assisted/performed progress calculations. |
| `server/src/shared/types.ts` | Shared enums/interfaces; some values reflect older contracts. Runtime copies match. |
| `server/src/test-db.ts` | Manual database/API diagnostic; inspected, not executed. |
| `server/src/test-duty-api.ts` | Manual database/API diagnostic; inspected, not executed. |
| `server/src/utils/generate-vapid-keys.ts` | Manual VAPID key generator; inspected, not executed. |
| `server/src/utils/notifications.ts` | Database notification creation followed by optional push delivery. |
| `server/tsconfig.json` | Build/configuration/support source inspected. |
| `setup.sh` | Setup/deployment/diagnostic script inspected; not executed. |
| `shared/procedureRequirements.backup.json` | Historical requirements backup; differs from current runtime requirements. |
| `shared/procedureRequirements.json` | Current grouped requirements for years 1–4. |
| `shared/procedureUtils.ts` | Requirement catalogue lookup and annual assisted/performed progress calculations. |
| `shared/types.ts` | Shared enums/interfaces; some values reflect older contracts. Runtime copies match. |
| `test-duty-assignment.sh` | Setup/deployment/diagnostic script inspected; not executed. |

## Historical documentation

These documents were catalogued individually; their completion claims were not treated as runtime verification.

| File | Recorded topic |
| --- | --- |
| `ACCOUNT_MANAGEMENT_FIXES.md` | Account Management Fixes - Complete ✅ |
| `ACTIONABLE_NOTIFICATIONS_COMPLETE.md` | Actionable Notifications System - Complete ✅ |
| `ACTIVITY_ASSIGNMENT_FIXED.md` | Activity Assignment Fixed |
| `ADD_LOG_FIXES_COMPLETE.md` | Add Log Form Fixes - Complete ✅ |
| `ALL_PROCEDURES_DEFAULT_FILTER.md` | All Procedures - Default Filter Update |
| `ASSIGNMENT_FIX_COMPLETE.md` | Assignment Failure Fix - Complete |
| `AUTO_REFRESH_USER_DATA.md` | Auto-Refresh User Data on Page Reload ✅ |
| `CHIEF_RESIDENT_COLOR_SYSTEM_COMPLETE.md` | Chief Resident Color System - Complete Implementation |
| `CHIEF_RESIDENT_FINAL_ADJUSTMENTS.md` | Chief Resident Final Adjustments - Complete |
| `CHIEF_RESIDENT_NEXT_STEPS.md` | Chief Resident System - Next Steps |
| `CHIEF_RESIDENT_PHASE1_COMPLETE.md` | Chief Resident System - Phase 1 Complete ✅ |
| `CHIEF_RESIDENT_PHASE1_PROGRESS.md` | Chief Resident System - Phase 1 Progress |
| `CHIEF_RESIDENT_PHASE2_COMPLETE.md` | Chief Resident System - Phase 2 Complete ✅ |
| `CHIEF_RESIDENT_PHASE3_CATEGORY_MANAGEMENT.md` | Chief Resident System - Phase 3: Category Management Complete ✅ |
| `CHIEF_RESIDENT_PHASE4_TODAY_OVERVIEW.md` | Chief Resident System - Phase 4: Today's Overview Complete ✅ |
| `CHIEF_RESIDENT_SYSTEM_COMPLETE.md` | Chief Resident System - Complete Implementation Summary 🎉 |
| `CHIEF_RESIDENT_SYSTEM_SPECIFICATION.md` | Scalpel Diary - Chief Resident & Scheduling System Specification |
| `CHIEF_RESIDENT_TABLE_VIEW_ASSIGNMENT.md` | Chief Resident - Table View Assignment Complete ✅ |
| `CHIEF_RESIDENT_TOGGLE_FIX.md` | Chief Resident Toggle Fix |
| `CLOUDFLARE_DEPLOYMENT.md` | Cloudflare Pages Deployment Guide |
| `COMPLETED_FEATURES.md` | ✅ Completed Features - ScalpelDiary Modern UI |
| `COMPLETE_IMPLEMENTATION.md` | ScalpelDiary - Complete Implementation Summary |
| `COMPLETE_NOTIFICATION_GUIDE.md` | Complete Notification Guide - ScalpelDiary |
| `DAILY_NOTIFICATIONS_COMPLETE.md` | Daily Notifications System - Complete ✅ |
| `DASHBOARD_CLICKABLE_CARDS_COMPLETE.md` | Dashboard Clickable Cards - Complete ✅ |
| `DEPLOYMENT_CHECKLIST.md` | ScalpelDiary Deployment Checklist |
| `DEPLOYMENT_GUIDE.md` | ScalpelDiary Deployment Guide |
| `DEPLOYMENT_STATUS.md` | Deployment Status |
| `DEPLOYMENT_SUMMARY.md` | ScalpelDiary - Deployment Summary |
| `DUTY_MODAL_ENHANCEMENT_COMPLETE.md` | Duty Modal Enhancement - Complete ✅ |
| `EDIT_DELETE_PROCEDURES.md` | Edit & Delete Procedures Complete ✅ |
| `EMERGENCY_MODAL_FIX.md` | Emergency Modal Fix - CRITICAL |
| `ENABLE_PUSH_NOTIFICATIONS_GUIDE.md` | Complete Guide: Enable Push Notifications for ScalpelDiary |
| `FEATURES.md` | ScalpelDiary Features |
| `FINAL_ADD_LOG_COMPLETE.md` | Final Add Log Form - Complete ✅ |
| `FINAL_DASHBOARD_UPDATES.md` | Final Dashboard Updates - Complete |
| `FINAL_FIXES.md` | Final Fixes Complete ✅ |
| `FINAL_MOBILE_IMPROVEMENTS.md` | Final Mobile Improvements |
| `FINAL_NOTIFICATION_IMPROVEMENTS.md` | Final Notification System Improvements |
| `FINAL_READ_ONLY_FIX.md` | Final Read-Only Mode Fixes - Complete |
| `FINAL_SUPERVISOR_UPDATES.md` | Final Supervisor Updates Complete ✅ |
| `FINAL_UI_ENHANCEMENTS.md` | Final UI Enhancements Complete ✅ |
| `FINAL_UPDATES.md` | Final Updates - ScalpelDiary |
| `FIX_PRODUCTION_DATABASE.md` | Fix Production Database - Missing Columns |
| `FIX_WHITE_SCREEN.md` | Fix White Screen Issue |
| `FORM_VALIDATION_UPDATES.md` | Form Validation Updates Complete ✅ |
| `IMPLEMENTATION_STATUS.md` | ScalpelDiary Modern UI Implementation Status |
| `INSTALLATION.md` | ScalpelDiary Installation Guide |
| `IN_APP_NOTIFICATION_POPUP_COMPLETE.md` | In-App Notification Popup Complete |
| `JSON_PROCEDURE_TRACKING_COMPLETE.md` | JSON-Based Procedure Tracking System - Implementation Complete |
| `LANDING_PAGE_AND_BRANDING.md` | Landing Page and Branding Update - Complete |
| `LOGIN_FIX.md` | Login Issue Fix |
| `LOGO_UPDATE_COMPLETE.md` | Logo Update - Complete ✅ |
| `MANAGEMENT_ACCESS_IMPROVEMENTS.md` | Management Access Improvements - Complete ✅ |
| `MANAGEMENT_COMPLETE.md` | Management Role Implementation - COMPLETE ✅ |
| `MANAGEMENT_PHASE1_COMPLETE.md` | Management Role - Phase 1 Complete ✅ |
| `MANAGEMENT_ROLE_IMPLEMENTATION.md` | Management Role Implementation |
| `MANAGEMENT_UI_IMPROVEMENTS.md` | Management UI Improvements - Complete ✅ |
| `MASTER_ACCOUNT_IMPLEMENTATION.md` | Master Account - Complete Implementation Plan |
| `MASTER_ACCOUNT_SETUP.md` | Master Account Setup Guide |
| `MASTER_PHASE1_COMPLETE.md` | Master Account - Phase 1 Complete ✅ |
| `MASTER_PHASE2_COMPLETE.md` | Master Account - Phase 2 Complete ✅ |
| `MASTER_PHASE3_COMPLETE.md` | Master Account - Phase 3 Complete ✅ |
| `MASTER_SUPERVISOR_FIXES_COMPLETE.md` | Master & Supervisor Account Fixes - Complete ✅ |
| `MIGRATION_BUTTON_COMPLETE.md` | Migration Button Implementation - Complete |
| `MIGRATION_TROUBLESHOOTING.md` | Migration Button Troubleshooting |
| `MISSING_TABLES_FIX.md` | Missing Tables - Need to Run Migration |
| `MOBILE_HAMBURGER_MENU_COMPLETE.md` | Mobile Hamburger Menu Implementation - Complete ✅ |
| `MOBILE_OPTIMIZATION_COMPLETE.md` | Mobile Optimization Complete |
| `MOBILE_RESPONSIVE_UPDATE.md` | Mobile Responsive & Final Updates |
| `MOBILE_VIEW_FIXES_COMPLETE.md` | Mobile View Fixes Complete |
| `MODAL_AUTO_CLOSE_AND_RATED_NOTIFICATIONS.md` | Modal Auto-Close and Rated Notifications - Complete |
| `MODAL_IMPROVEMENTS_COMPLETE.md` | Modal Improvements - Complete ✅ |
| `MULTIPLE_PROCEDURES_AND_FOOTNOTES_COMPLETE.md` | Multiple Procedures and Form Enhancements - Complete ✅ |
| `NEW_SCD_LOGO_COMPLETE.md` | New SCD Logo Design - Complete ✅ |
| `NOTIFICATION_MIGRATION_COMPLETE.md` | Notification Migration Button - Complete ✅ |
| `NOTIFICATION_MODAL_AND_AUTO_DISMISS_FIX.md` | Notification Modal and Auto-Dismiss Fix - Complete |
| `NOTIFICATION_POPUP_AND_VIEW_DETAILS_FIX.md` | Notification Popup and View Details Button Fix |
| `NOTIFICATION_POPUP_FINAL_FIX.md` | Notification Popup Final Fix |
| `NOTIFICATION_PROPER_FIX_COMPLETE.md` | Notification System - Proper Fix Complete |
| `NOTIFICATION_SCHEDULE_FIX_COMPLETE.md` | Notification Schedule Fix - Complete ✅ |
| `NOTIFICATION_SCHEDULE_GUIDE.md` | Resident Notification Schedule Guide |
| `NOTIFICATION_SYSTEM_COMPLETE.md` | Notification System Implementation Complete |
| `NOTIFICATION_TYPE_MIGRATION_BUTTON.md` | Notification Type Migration Button - Complete ✅ |
| `PASSWORD_AND_SPECIALTY_UPDATES.md` | Password and Specialty Updates - Complete |
| `PHASE1_BACKEND_COMPLETE.md` | Phase 1: Backend Complete ✅ |
| `PHASE3_SUMMARY.md` | Phase 3 Implementation Summary |
| `PRESENTATION_ASSIGNMENT_FIXES.md` | Presentation Assignment System - Fixes Applied |
| `PRESENTATION_ASSIGNMENT_PHASE1_COMPLETE.md` | Presentation Assignment System - Phase 1 Complete |
| `PRESENTATION_ASSIGNMENT_PHASE2_COMPLETE.md` | Presentation Assignment System - Phase 2 Complete |
| `PRESENTATION_ASSIGNMENT_SYSTEM_SPEC.md` | Presentation Assignment System - Complete Specification |
| `PRESENTATION_NOTIFICATIONS_AND_MOBILE_FIX.md` | Presentation Notifications and Mobile Responsive Fixes |
| `PRESENTATION_NOTIFICATIONS_COMPLETE.md` | Presentation Notifications - Complete Fix ✅ |
| `PRESENTATION_NOTIFICATION_DEBUG.md` | Presentation Notification Debug & Fix |
| `PRESENTATION_NOTIFICATION_DEBUG_GUIDE.md` | Empty historical note |
| `PRESENTATION_NOTIFICATION_FINAL_FIX.md` | Presentation Notification Fix - Complete Guide |
| `PRESENTATION_NOTIFICATION_FIXED.md` | Presentation Notification Issue - FIXED ✅ |
| `PRESENTATION_RATING_FIX.md` | Presentation Rating Fix - Implementation Summary |
| `PROCEDURE_TRACKING_IMPLEMENTATION.md` | JSON-Based Procedure Tracking System Implementation |
| `PROFILE_AND_ANALYTICS_UPDATE.md` | Profile Picture & Enhanced Analytics Update |
| `PROGRESS_MODAL_ENHANCEMENTS_COMPLETE.md` | Progress Modal Enhancements - Complete ✅ |
| `PROJECT_STRUCTURE.md` | ScalpelDiary Project Structure |
| `PUSH_NOTIFICATIONS_KEYS.md` | Push Notifications - Configuration Keys |
| `PUSH_NOTIFICATIONS_SETUP.md` | Push Notifications Setup Guide |
| `QUICK_DEPLOYMENT.md` | Quick Deployment Guide |
| `QUICK_FIX.md` | Quick Fix for Login Issue |
| `QUICK_FIX_SUMMARY.md` | Quick Fix Summary - Assignment Failures |
| `RATINGS_DONE_UNIFIED_PAGE_COMPLETE.md` | Ratings Done Unified Page - Complete |
| `README.md` | ScalpelDiary |
| `READONLY_TODAY_OVERVIEW_COMPLETE.md` | Read-Only Today's Overview - Complete ✅ |
| `READY_TO_TEST_CHECKLIST.md` | Ready to Test - Final Checklist |
| `READ_ONLY_COMPLETE_FIX.md` | Read-Only Mode - Complete Fix |
| `READ_ONLY_DATA_FIX.md` | Read-Only Mode Data Display Fix |
| `READ_ONLY_MODE_FIX.md` | Read-Only Mode Fix - Dashboard & Analytics Loading Issue |
| `RESIDENT_SPECIALTY_COMPLETE.md` | Resident Specialty Feature - Complete Implementation |
| `RESIDENT_SUPERVISOR_LOGS_COMPLETE.md` | Resident Supervisor Logs Update - Complete |
| `RESIDENT_SUPERVISOR_LOGS_UPDATE.md` | Resident Supervisor Logs Update |
| `RESTART_BACKEND.md` | ✅ Database Connection Fixed! |
| `RESTART_SERVER_INSTRUCTIONS.md` | Restart Server to Fix Assignment Issues |
| `ROTATION_MODAL_READONLY_FIX.md` | Rotation Modal Read-Only Fix - Complete ✅ |
| `RUN_MIGRATION.md` | Run Database Migration for Procedure Category |
| `SETUP_TEST_GUIDE.md` | Chief Resident Setup - Testing Guide |
| `SPECIALTY_FEATURE_COMPLETE.md` | Specialty Feature Implementation - Complete |
| `START_HERE.md` | 🚀 START HERE - ScalpelDiary Deployment |
| `SUPERVISOR_AND_CATEGORY_FIX.md` | Supervisor and Category Fixes - Complete ✅ |
| `SUPERVISOR_BROWSING_FIX.md` | Supervisor Browsing Fix ✅ |
| `SUPERVISOR_ENHANCEMENTS.md` | Supervisor Enhancements - Complete |
| `SUPERVISOR_ENHANCEMENTS_COMPLETE.md` | Supervisor Enhancements Complete ✅ |
| `SUPERVISOR_READ_ONLY_MODE.md` | Supervisor Read-Only Mode - Complete Implementation |
| `TEST_ASSIGNMENTS_COMPLETE.md` | Assignment System - Final Status |
| `TEST_SUPERVISOR_API.md` | Test Supervisor API |
| `TIMEZONE_FIX_COMPLETE.md` | Timezone Date Mismatch Fix - COMPLETE ✅ |
| `UI_ENHANCEMENTS_COMPLETE.md` | UI Enhancements - Complete Implementation |
| `UI_IMPROVEMENTS_COMPLETE.md` | UI Improvements Complete ✅ |
| `VISUAL_GUIDE.md` | Visual Guide - What You Should See |
| `WEEKEND_HIGHLIGHT_AND_ROTATION_FIX.md` | Weekend Highlighting & Yearly Rotation Fix - Complete |
| `YEARLY_ROTATION_AND_WEEKEND_FIX.md` | Yearly Rotation Display & Weekend Highlighting Fix - Complete |
| `YEARLY_ROTATION_ORGANIZED_VIEW.md` | Yearly Rotation Organized View - Complete |
| `YEARLY_ROTATION_VISUAL_ENHANCEMENT.md` | Yearly Rotation Visual Enhancement - Complete |
| `YEAR_RESTRICTION_UPDATE.md` | Year Restriction Implementation |

## Visual assets

Inventoried only; no screenshot-by-screenshot or logo rendering review.

- `client/public/favicon.svg`
- `client/public/favicon2.svg`
- `client/public/logo-scd.svg`
- `client/public/logo-sd.svg`
- `client/public/logo.svg`
- `docs/screenshots/Chief Resident/Assign Presentations.jpg`
- `docs/screenshots/Chief Resident/Assign Yearly schedule.jpg`
- `docs/screenshots/Chief Resident/Cheif Resident Menue.jpg`
- `docs/screenshots/Chief Resident/Monthly Activity Scheduling.jpg`
- `docs/screenshots/Chief Resident/Monthly Duty Scheduling.jpg`
- `docs/screenshots/Residents/Dashbord with todays overview cards.jpg`
- `docs/screenshots/Residents/Settings Export popup.jpg`
- `docs/screenshots/Residents/bell notification showing.jpg`
- `docs/screenshots/Residents/dash bord recent procedures and presentations.jpg`
- `docs/screenshots/Residents/dash bord with enable notification promt.jpg`
- `docs/screenshots/Residents/dashbord calander view.jpg`
- `docs/screenshots/Residents/dashbord with number metrics.jpg`
- `docs/screenshots/Residents/initial landing page with Instal app promt.jpg`
- `docs/screenshots/Residents/menue add procedures.jpg`
- `docs/screenshots/Residents/menue analytics.jpg`
- `docs/screenshots/Residents/menue logs to rate.jpg`
- `docs/screenshots/Residents/menue settings.jpg`
- `docs/screenshots/Residents/presentations page.jpg`
- `docs/screenshots/Supervisors/Post Op follow up.jpg`
- `docs/screenshots/Supervisors/Rate Presentations.jpg`
- `docs/screenshots/Supervisors/Rate Procedure.jpg`
- `docs/screenshots/Supervisors/Supervisor Assign presentation.jpg`
- `docs/screenshots/Supervisors/Supervisor Bellnotification.jpg`
- `docs/screenshots/Supervisors/Supervisor General comment.jpg`
- `docs/screenshots/Supervisors/Supervisor dashbord Metrics and schedules.jpg`
- `docs/screenshots/Supervisors/Supervisor setting.jpg`
- `docs/screenshots/Supervisors/Supervisors dashbord browes residents by year.jpg`
- `docs/screenshots/Supervisors/Unresponded Logs.jpg`
- `docs/screenshots/Supervisors/ratings done .jpg`
