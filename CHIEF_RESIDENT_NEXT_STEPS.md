# Chief Resident System - Next Steps

## ✅ Completed (Phase 1 - 70%)

### Database
- [x] All 8 tables created
- [x] All indexes created
- [x] Default data seeded
- [x] Migration button working

### Backend API
- [x] Migration routes (`/api/migrations`)
- [x] Rotation routes (`/api/rotations`)
- [x] Duty routes (`/api/duties`)
- [x] TypeScript types updated

## 📋 Remaining Work

### Phase 1 - Backend (30% remaining)

#### 1. Activities Routes
**File**: `server/src/routes/activities.ts`
- GET /activities/categories
- POST /activities/categories
- PUT /activities/categories/:id
- DELETE /activities/categories/:id
- GET /activities/monthly/:year/:month
- GET /activities/today
- POST /activities/assign
- PUT /activities/:id
- DELETE /activities/:id

#### 2. Presentation Assignments Routes
**File**: `server/src/routes/presentation-assignments.ts`
- GET /presentation-assignments (list for current user)
- POST /presentation-assignments (create - Chief/Master)
- PUT /presentation-assignments/:id/complete (mark complete - Resident)
- PUT /presentation-assignments/:id/rate (rate - Supervisor)
- GET /presentation-assignments/pending

#### 3. Dashboard/Overview Routes
**File**: Update existing routes or create new
- GET /residents/today-overview (today's info for resident)
- GET /supervisor/daily-overview (all residents today)
- GET /master/daily-overview (all residents today)

#### 4. Users Route Updates
**File**: `server/src/routes/users.ts`
- Add endpoint to toggle is_chief_resident flag
- Include is_chief_resident in user responses
- Filter residents by current rotation

### Phase 2 - Frontend UI

#### 1. Master Account Management
- Add "Chief Resident" toggle in Account Management
- Show chief resident badge in resident list

#### 2. Chief Resident Navigation
- Add "Chief Resident" section to resident navigation (Year 2+)
- Show only if is_chief_resident = true

#### 3. Rotation Scheduling UI
**Page**: `/chief/yearly-rotations`
- Academic year selector
- 12-month grid view (rows = residents, columns = months)
- Dropdown to assign rotation category per cell
- Category management modal
- Bulk operations

#### 4. Duty Scheduling UI
**Page**: `/chief/monthly-duties`
- Month selector
- Calendar view
- Click day to assign resident + duty
- Duty category management
- Color coding by duty type

#### 5. Activity Scheduling UI
**Page**: `/chief/monthly-activities`
- Month selector
- Calendar view
- Multi-select activities per resident per day
- Activity category management

#### 6. Presentation Assignment UI
**Page**: `/chief/assign-presentation`
- Assignment form (title, type, presenter, moderator, date, venue)
- List of assigned presentations
- Status tracking

#### 7. Resident Dashboard Enhancement
- Add "Today's Overview" section at top
- Show current rotation
- Show today's duty
- Show today's activities
- Show pending presentations count

#### 8. Resident Presentation Assignments
**Page**: `/presentations/assignments`
- List pending assignments
- Mark as completed modal
- Fill actual presentation details

#### 9. Supervisor Presentation Rating
**Page**: `/supervisor/presentation-assignments`
- List presentations to rate
- Rate presentation modal

#### 10. Daily Overview Dashboard
**Page**: `/supervisor/daily-overview` and `/master/daily-overview`
- Table showing all residents
- Current rotation, duty, activities
- Filter by rotation/duty
- Export functionality

## Priority Order

### Immediate (This Session)
1. ✅ Complete Activities routes
2. ✅ Complete Presentation Assignments routes
3. ✅ Update Users route for Chief Resident toggle
4. ✅ Add Chief Resident toggle to Account Management UI

### Next Session
5. Build Rotation Scheduling UI
6. Build Duty Scheduling UI
7. Build Activity Scheduling UI
8. Enhance Resident Dashboard

### Future Sessions
9. Presentation Assignment workflow
10. Daily Overview dashboards
11. Testing and refinement

## Estimated Time

- Activities routes: 30 min
- Presentation assignments routes: 1 hour
- Users route updates: 15 min
- Account Management UI: 30 min
- **Total for immediate work**: ~2.5 hours

## Notes

- All backend routes follow same pattern as rotations/duties
- Frontend will use similar components (calendars, modals, forms)
- Mobile responsiveness required for all new pages
- Authorization checks: Chief Resident or Master for management features
