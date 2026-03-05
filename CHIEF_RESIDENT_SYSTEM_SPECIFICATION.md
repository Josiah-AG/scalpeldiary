# Scalpel Diary - Chief Resident & Scheduling System Specification

## Overview
This document outlines the implementation plan for the Chief Resident role, rotation scheduling, duty assignments, activity tracking, and enhanced presentation management system.

---

## 1. Chief Resident Role

### 1.1 Database Schema Changes

**Add to `users` table:**
```sql
ALTER TABLE users ADD COLUMN is_chief_resident BOOLEAN DEFAULT FALSE;
```

### 1.2 Master Account Features
- Toggle any resident as Chief Resident in Account Management
- Chief Resident flag visible in resident list
- Can assign/revoke Chief Resident status

### 1.3 Chief Resident Permissions
- Retains all resident functionality
- Additional access to:
  - Yearly Rotation Scheduling
  - Monthly Duty Scheduling
  - Monthly Activity Assignment
  - Presentation Assignment System
- New navigation section: "Chief Resident Management"

---

## 2. Yearly Rotation Scheduling System

### 2.1 Database Schema

**New table: `rotation_categories`**
```sql
CREATE TABLE rotation_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**New table: `academic_years`**
```sql
CREATE TABLE academic_years (
  id SERIAL PRIMARY KEY,
  year_name VARCHAR(100) NOT NULL, -- e.g., "2024-2025"
  start_month INTEGER NOT NULL, -- 1-12
  start_year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**New table: `yearly_rotations`**
```sql
CREATE TABLE yearly_rotations (
  id SERIAL PRIMARY KEY,
  academic_year_id INTEGER REFERENCES academic_years(id),
  resident_id INTEGER REFERENCES users(id),
  month_number INTEGER NOT NULL, -- 1-12 (relative to academic year start)
  rotation_category_id INTEGER REFERENCES rotation_categories(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(academic_year_id, resident_id, month_number)
);
```

### 2.2 Default Rotation Categories
- GS @ Y12HMC
- GS @ ALERT
- OPD
- Anesthesia
- Plastic Surgery
- ICU
- Orthopedics
- Cardiothoracic
- Neurosurgery
- Oncology
- OBGYN
- Radiology
- Urology
- Pediatric Surgery
- Month Off

### 2.3 Features
- **Academic Year Setup**: Define start month (e.g., July, September)
- **12-Month Grid View**: Visual calendar showing all residents and their monthly rotations
- **Drag-and-Drop Assignment**: Assign residents to categories per month
- **Category Management**: Add/edit/delete/reorder rotation categories
- **Conflict Detection**: Prevent double-booking (one category per resident per month)
- **Bulk Operations**: Copy previous year's schedule, bulk assign rotations

### 2.4 UI Components
- **Page**: `/chief/yearly-rotations`
- **Grid Layout**: Rows = Residents, Columns = Months (1-12)
- **Dropdown per cell**: Select rotation category
- **Category Manager**: Modal to manage rotation categories
- **Academic Year Selector**: Switch between years

---

## 3. Monthly Duty Scheduling System

### 3.1 Database Schema

**New table: `duty_categories`**
```sql
CREATE TABLE duty_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**New table: `monthly_duties`**
```sql
CREATE TABLE monthly_duties (
  id SERIAL PRIMARY KEY,
  resident_id INTEGER REFERENCES users(id),
  duty_date DATE NOT NULL,
  duty_category_id INTEGER REFERENCES duty_categories(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resident_id, duty_date)
);
```

### 3.2 Default Duty Categories
- EOPD
- ICU
- Ward
- Senior Resident
- Consultation

### 3.3 Features
- **Monthly Calendar View**: Full month calendar with day cells
- **Daily Assignment**: Click day to assign resident + duty category
- **One Duty Per Day**: Each resident can only have one duty per day
- **Category Management**: Add/edit/delete duty categories
- **Color Coding**: Different colors for different duty types
- **Quick Filters**: Filter by resident, duty type
- **Copy Previous Month**: Template from last month

### 3.4 UI Components
- **Page**: `/chief/monthly-duties`
- **Calendar View**: Month selector + calendar grid
- **Assignment Modal**: Select resident + duty category for specific date
- **Duty Manager**: Manage duty categories

---

## 4. Monthly Activity Assignment System

### 4.1 Database Schema

**New table: `activity_categories`**
```sql
CREATE TABLE activity_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**New table: `daily_activities`**
```sql
CREATE TABLE daily_activities (
  id SERIAL PRIMARY KEY,
  resident_id INTEGER REFERENCES users(id),
  activity_date DATE NOT NULL,
  activity_category_id INTEGER REFERENCES activity_categories(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resident_id, activity_date, activity_category_id)
);
```

### 4.2 Default Activity Categories
- OPD
- OR
- Round
- Minor OR

### 4.3 Features
- **Monthly Calendar View**: Similar to duty scheduling
- **Multiple Activities Per Day**: Residents can have multiple activities per day
- **Activity Management**: Add/edit/delete activity categories
- **Quick Assignment**: Bulk assign activities to multiple residents
- **Activity Templates**: Save common activity patterns

### 4.4 UI Components
- **Page**: `/chief/monthly-activities`
- **Calendar View**: Month selector + calendar grid
- **Multi-select**: Assign multiple activities per resident per day
- **Activity Manager**: Manage activity categories

---

## 5. Enhanced Resident Dashboard

### 5.1 New "Today's Overview" Section
Display at top of resident dashboard:

```
┌─────────────────────────────────────────────────────────┐
│ TODAY'S OVERVIEW - [Date]                               │
├─────────────────────────────────────────────────────────┤
│ Current Rotation: GS @ Y12HMC                           │
│ Today's Duty: EOPD                                      │
│ Today's Activities: OPD, Round                          │
│ Pending Presentations: 2                                │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Features
- **Current Month Rotation**: From yearly rotation schedule
- **Today's Duty Status**: On duty or off, with duty category
- **Today's Activities**: List of assigned activities
- **Pending Presentations**: Count with link to presentation assignments
- **Quick Actions**: Links to relevant pages

### 5.3 API Endpoints Needed
- `GET /residents/today-overview` - Get all today's info for current resident
- `GET /rotations/current` - Get current month's rotation
- `GET /duties/today` - Get today's duty assignment
- `GET /activities/today` - Get today's activities

---

## 6. Presentation Assignment System

### 6.1 Database Schema Changes

**Update `presentations` table:**
```sql
ALTER TABLE presentations ADD COLUMN assigned_by INTEGER REFERENCES users(id);
ALTER TABLE presentations ADD COLUMN is_assigned BOOLEAN DEFAULT FALSE;
ALTER TABLE presentations ADD COLUMN assignment_date TIMESTAMP;
ALTER TABLE presentations ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE presentations ADD COLUMN completed_date TIMESTAMP;
```

**New table: `presentation_assignments`**
```sql
CREATE TABLE presentation_assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  presentation_type VARCHAR(100) NOT NULL, -- Short, Seminar, Morning, Other
  presenter_id INTEGER REFERENCES users(id) NOT NULL,
  moderator_id INTEGER REFERENCES users(id) NOT NULL,
  assigned_by INTEGER REFERENCES users(id) NOT NULL,
  scheduled_date DATE,
  venue VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, RATED
  presentation_id INTEGER REFERENCES presentations(id), -- Links to actual presentation after completion
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Presentation Types
- Short Presentation
- Seminar
- Morning Presentation
- Other

### 6.3 Assignment Flow

**Chief Resident:**
1. Navigate to "Assign Presentation"
2. Fill form:
   - Title
   - Type (dropdown)
   - Presenter (resident dropdown)
   - Moderator (supervisor dropdown)
   - Scheduled Date (optional)
   - Venue (optional)
   - Description
3. Submit → Creates assignment

**Resident (Presenter):**
1. Receives notification: "You have a new presentation assignment"
2. Views in "Presentation Assignments" tab
3. Prepares presentation
4. After presenting, marks as "Completed"
5. Fills in actual presentation details (date, venue if different)
6. Submits for rating

**Supervisor (Moderator):**
1. Receives notification: "Presentation ready for rating"
2. Views in "Presentations to Rate"
3. Rates presentation (0-100 + comment)
4. Submits rating

### 6.4 UI Components

**Chief Resident:**
- **Page**: `/chief/assign-presentation`
- **Form**: Assignment form with all fields
- **List**: View all assigned presentations

**Resident:**
- **Page**: `/presentations/assignments`
- **List**: Pending and completed assignments
- **Modal**: Mark as completed + fill details

**Supervisor:**
- **Page**: `/supervisor/presentation-assignments`
- **List**: Presentations to rate
- **Modal**: Rate presentation

### 6.5 Notifications
- **On Assignment**: Notify presenter and moderator
- **On Completion**: Notify moderator
- **On Rating**: Notify presenter

---

## 7. Supervisor & Master Enhancements

### 7.1 Supervisor Presentation Features
- **Self-Assignment**: Supervisors can assign presentations to themselves
- **Moderation**: Rate resident presentations
- **Create Own**: Add presentations they've given

### 7.2 Filtering by Rotation Category
- **Resident List**: Filter by current rotation
- **Dropdown**: Show all rotation categories
- **Quick View**: See all residents in ICU, OPD, etc.

### 7.3 Daily Overview Dashboard

**New page**: `/supervisor/daily-overview` and `/master/daily-overview`

**Table showing:**
- Resident Name
- Current Rotation
- Today's Duty
- Today's Activities
- Status (On Duty / Off)

**Features:**
- Filter by rotation category
- Filter by duty type
- Export to PDF/Excel
- Print view

---

## 8. Configuration Management

### 8.1 Master Account Settings Page

**New page**: `/master/system-configuration`

**Sections:**
1. **Rotation Categories**
   - Add/Edit/Delete/Reorder
   - Set active/inactive

2. **Duty Categories**
   - Add/Edit/Delete/Reorder
   - Set active/inactive

3. **Activity Categories**
   - Add/Edit/Delete/Reorder
   - Set active/inactive

4. **Academic Year Settings**
   - Set start month
   - Create new academic year
   - Set active year

### 8.2 API Endpoints
- `GET/POST/PUT/DELETE /config/rotation-categories`
- `GET/POST/PUT/DELETE /config/duty-categories`
- `GET/POST/PUT/DELETE /config/activity-categories`
- `GET/POST/PUT /config/academic-years`

---

## 9. Implementation Phases

### Phase 1: Database & Backend (Week 1-2)
- Create all new tables
- Add migration scripts
- Create API endpoints for categories
- Create API endpoints for rotations, duties, activities
- Create API endpoints for presentation assignments

### Phase 2: Chief Resident Role (Week 2-3)
- Add is_chief_resident flag
- Update Master account management UI
- Create Chief Resident navigation
- Implement role-based access control

### Phase 3: Rotation Scheduling (Week 3-4)
- Build yearly rotation UI
- Implement grid view
- Add category management
- Add assignment logic

### Phase 4: Duty & Activity Scheduling (Week 4-5)
- Build monthly duty calendar
- Build monthly activity calendar
- Implement assignment modals
- Add category management

### Phase 5: Resident Dashboard Enhancement (Week 5-6)
- Add "Today's Overview" section
- Fetch and display current rotation
- Fetch and display today's duty
- Fetch and display today's activities
- Add pending presentations count

### Phase 6: Presentation Assignment System (Week 6-7)
- Build assignment form for Chief Resident
- Build assignment list for residents
- Build completion flow
- Build rating flow for supervisors
- Implement notifications

### Phase 7: Supervisor/Master Enhancements (Week 7-8)
- Add rotation filtering
- Build daily overview dashboard
- Add supervisor presentation features
- Implement export functionality

### Phase 8: Configuration Management (Week 8-9)
- Build system configuration page
- Implement category CRUD operations
- Add academic year management
- Add validation and error handling

### Phase 9: Testing & Refinement (Week 9-10)
- End-to-end testing
- Bug fixes
- Performance optimization
- Documentation

---

## 10. Technical Considerations

### 10.1 Data Validation
- Prevent double-booking (one rotation/duty per resident per day)
- Validate date ranges
- Ensure academic year consistency
- Validate category references

### 10.2 Performance
- Index on date fields
- Cache current rotation/duty/activity queries
- Optimize calendar queries
- Lazy load historical data

### 10.3 Security
- Role-based access control for Chief Resident features
- Validate user permissions on all endpoints
- Audit log for schedule changes
- Prevent unauthorized modifications

### 10.4 Mobile Responsiveness
- Responsive calendar views
- Touch-friendly assignment interfaces
- Mobile-optimized dashboard
- Swipe gestures for navigation

---

## 11. API Endpoints Summary

### Rotation Management
- `GET /rotations/categories` - List all rotation categories
- `POST /rotations/categories` - Create rotation category
- `PUT /rotations/categories/:id` - Update rotation category
- `DELETE /rotations/categories/:id` - Delete rotation category
- `GET /rotations/yearly/:yearId` - Get yearly rotation schedule
- `POST /rotations/assign` - Assign resident to rotation
- `PUT /rotations/:id` - Update rotation assignment
- `DELETE /rotations/:id` - Remove rotation assignment

### Duty Management
- `GET /duties/categories` - List all duty categories
- `POST /duties/categories` - Create duty category
- `PUT /duties/categories/:id` - Update duty category
- `DELETE /duties/categories/:id` - Delete duty category
- `GET /duties/monthly/:year/:month` - Get monthly duty schedule
- `POST /duties/assign` - Assign duty
- `PUT /duties/:id` - Update duty assignment
- `DELETE /duties/:id` - Remove duty assignment
- `GET /duties/today` - Get today's duty for current user

### Activity Management
- `GET /activities/categories` - List all activity categories
- `POST /activities/categories` - Create activity category
- `PUT /activities/categories/:id` - Update activity category
- `DELETE /activities/categories/:id` - Delete activity category
- `GET /activities/monthly/:year/:month` - Get monthly activity schedule
- `POST /activities/assign` - Assign activity
- `PUT /activities/:id` - Update activity assignment
- `DELETE /activities/:id` - Remove activity assignment
- `GET /activities/today` - Get today's activities for current user

### Presentation Assignments
- `GET /presentation-assignments` - List assignments (filtered by role)
- `POST /presentation-assignments` - Create assignment (Chief Resident)
- `PUT /presentation-assignments/:id/complete` - Mark as completed (Resident)
- `PUT /presentation-assignments/:id/rate` - Rate presentation (Supervisor)
- `GET /presentation-assignments/pending` - Get pending assignments

### Dashboard
- `GET /residents/today-overview` - Get today's overview for resident
- `GET /supervisor/daily-overview` - Get daily overview for all residents

### Configuration
- `GET /config/academic-years` - List academic years
- `POST /config/academic-years` - Create academic year
- `PUT /config/academic-years/:id` - Update academic year

---

## 12. UI/UX Mockups Needed

1. Yearly Rotation Grid View
2. Monthly Duty Calendar
3. Monthly Activity Calendar
4. Chief Resident Navigation Menu
5. Presentation Assignment Form
6. Resident Today's Overview Section
7. Daily Overview Dashboard (Supervisor/Master)
8. System Configuration Page
9. Category Management Modals

---

## 13. Success Metrics

- Chief Resident can assign rotations in < 5 minutes per month
- Residents see today's schedule immediately on login
- Presentation assignment workflow reduces admin time by 50%
- Zero double-booking conflicts
- 100% mobile responsive
- < 2 second load time for all calendar views

---

## 14. Future Enhancements (Post-Launch)

- Automated rotation templates
- Conflict resolution suggestions
- Integration with hospital scheduling systems
- Mobile app for quick schedule checks
- SMS/Email notifications for duty changes
- Analytics on rotation distribution
- Workload balancing algorithms
- Vacation/leave request system

---

## Notes

- All categories must be stored in database, not hardcoded
- System must support multiple academic years simultaneously
- Chief Resident role is additive to resident role, not replacement
- All scheduling features require Chief Resident or Master access
- Notifications should be real-time where possible
- Export functionality should support PDF and Excel formats
