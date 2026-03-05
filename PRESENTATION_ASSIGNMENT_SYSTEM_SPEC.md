# Presentation Assignment System - Complete Specification

## Overview
Redesign the presentation assignment system to support a workflow where chief residents and supervisors can assign presentations to residents, who then mark them as presented, after which supervisors rate them.

## Requirements

### 1. Assignment Features
- ✅ Remove "venue" field from assignment form
- ✅ Chief residents can assign presentations
- ✅ Supervisors can assign presentations
- ✅ Assignment includes: title, type, presenter, moderator, date, description

### 2. Resident Experience
- ✅ "Assigned Presentations" tab on Presentations page
- ✅ Badge count showing number of pending assigned presentations
- ✅ View assigned presentation details
- ✅ Mark presentation as "Presented" with date
- ✅ When marked, it moves to regular presentations list
- ✅ Supervisor receives notification to rate it

### 3. Supervisor Experience
- ✅ Can assign presentations to residents
- ✅ Receives assigned presentations for rating
- ✅ Rates presentations as normal

### 4. Workflow
```
1. Chief/Supervisor assigns presentation to Resident
   ↓
2. Resident sees it in "Assigned Presentations" tab (badge count)
   ↓
3. Resident marks it as "Presented" (enters date)
   ↓
4. Presentation moves to resident's regular presentations list
   ↓
5. Supervisor sees it in "Unresponded Logs" for rating
   ↓
6. Supervisor rates the presentation
   ↓
7. Presentation appears in resident's rated presentations
```

## Database Schema

### presentation_assignments table (already exists)
```sql
CREATE TABLE presentation_assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  presenter_id UUID REFERENCES users(id),
  moderator_id UUID REFERENCES users(id),
  scheduled_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'presented', 'rated'
  presented_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### When marked as presented, create entry in presentations table
```sql
-- Existing presentations table will be used
-- Just insert a new row when resident marks as presented
```

## API Endpoints

### For Chief Residents & Supervisors
- `POST /presentation-assignments` - Assign presentation
- `GET /presentation-assignments` - List all assignments
- `GET /presentation-assignments/:id` - Get assignment details
- `PUT /presentation-assignments/:id` - Update assignment
- `DELETE /presentation-assignments/:id` - Delete assignment

### For Residents
- `GET /presentation-assignments/my-assignments` - Get my assigned presentations
- `GET /presentation-assignments/my-assignments/count` - Get count of pending assignments
- `POST /presentation-assignments/:id/mark-presented` - Mark as presented

## Frontend Components

### 1. Update AssignPresentation.tsx (Chief Resident)
- Remove venue field
- Implement actual API calls
- Show list of assigned presentations
- Allow editing/deleting assignments

### 2. Create AssignPresentation.tsx (Supervisor)
- Same as chief resident version
- Place in supervisor folder

### 3. Update Presentations.tsx (Resident)
- Add tabs: "My Presentations" | "Assigned Presentations"
- Show badge count on "Assigned Presentations" tab
- List assigned presentations with "Mark as Presented" button
- Modal to mark as presented (select date)

### 4. Update Layout.tsx
- Add badge count to Presentations menu item for residents

## Implementation Steps

### Phase 1: Backend Setup
1. Verify presentation_assignments table exists
2. Create API endpoints for assignments
3. Create endpoint to mark as presented
4. Update presentations endpoint to handle assigned presentations

### Phase 2: Chief Resident Assignment
1. Update AssignPresentation.tsx to remove venue
2. Implement API integration
3. Show list of assignments
4. Add edit/delete functionality

### Phase 3: Resident View
1. Update Presentations.tsx with tabs
2. Fetch assigned presentations
3. Show badge count
4. Implement "Mark as Presented" functionality

### Phase 4: Supervisor Assignment
1. Create supervisor AssignPresentation page
2. Add route in App.tsx
3. Add menu item in Layout.tsx

### Phase 5: Integration
1. Test full workflow
2. Ensure notifications work
3. Verify badge counts update
4. Test supervisor rating flow

## Status Workflow

```
assigned → presented → rated
```

- **assigned**: Initial state when chief/supervisor assigns
- **presented**: When resident marks as presented (creates presentation entry)
- **rated**: When supervisor rates the presentation

## UI/UX Notes

- Use amber/orange theme for assignment features (matches chief resident theme)
- Badge should be prominent and update in real-time
- "Mark as Presented" should require confirmation
- Show clear status indicators (Pending, Presented, Rated)
- Allow filtering by status

## Next Steps

Due to the complexity and size of this feature, we should implement it in phases. Would you like me to:
1. Start with Phase 1 (Backend Setup)?
2. Or would you prefer a different approach?

This is approximately 2000-3000 lines of code across multiple files.
