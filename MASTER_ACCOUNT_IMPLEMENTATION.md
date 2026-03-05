# Master Account - Complete Implementation Plan

## Overview
Master account will have full system oversight with read-only access to all accounts and full account management capabilities.

## Features to Implement

### 1. Master Dashboard Enhancements

#### Clickable Metrics:
- **Total Residents** → Browse by Year (1-4) → View individual residents (read-only)
- **Total Supervisors** → List with statistics → View rated procedures/presentations

#### Dashboard Layout:
```
┌─────────────────────────────────────────────────┐
│  Total Residents (150) [Clickable]             │
│  Total Supervisors (25) [Clickable]            │
│  Total Masters (3)                              │
└─────────────────────────────────────────────────┘
```

### 2. Resident Browsing (Same as Supervisor)

**Flow:**
1. Click "Total Residents"
2. Show Year 1-4 cards
3. Click year → Show residents list
4. Click resident → Open read-only resident view
5. Can navigate all resident pages (Dashboard, Procedures, Presentations, Analytics, Rated Logs)

**Reuse:** Supervisor's year-based browsing and read-only mode

### 3. Supervisor Browsing (New Feature)

**Flow:**
1. Click "Total Supervisors"
2. Show list of supervisors with:
   - Name
   - Profile picture
   - Total procedures rated
   - Total presentations rated
3. Click supervisor → View their rated items
4. Show two tabs:
   - Rated Procedures (with details modal)
   - Rated Presentations (with details modal)

### 4. Account Management Enhancements

**Current Features:**
- Create accounts
- Reset passwords

**New Features:**
- ✅ Update resident year
- ✅ Delete accounts
- ✅ Suspend/activate accounts
- ✅ Edit account details
- ✅ Create master accounts
- ✅ Bulk operations

#### Account Management UI:
```
┌─────────────────────────────────────────────────┐
│  [Create Account] [Filter: All ▼]              │
├─────────────────────────────────────────────────┤
│  Name    Email    Role    Year    Status  Actions│
│  John    john@    RES     2       Active  [Edit][Delete][Suspend]│
│  Jane    jane@    SUP     -       Active  [Edit][Delete][Suspend]│
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Dashboard Updates
- [ ] Make metrics clickable
- [ ] Add navigation to resident/supervisor views
- [ ] Update styling for clickable cards

### Phase 2: Resident View (Reuse Supervisor Code)
- [ ] Create master resident browsing page
- [ ] Reuse supervisor's year-based UI
- [ ] Reuse read-only mode system
- [ ] Add routes for master to view residents

### Phase 3: Supervisor View (New)
- [ ] Create supervisor list page
- [ ] Fetch supervisor statistics
- [ ] Create rated items view
- [ ] Add detail modals

### Phase 4: Account Management
- [ ] Add edit functionality
- [ ] Add delete functionality
- [ ] Add suspend/activate functionality
- [ ] Add year update for residents
- [ ] Add status indicators
- [ ] Add confirmation dialogs

### Phase 5: Backend APIs
- [ ] GET /users/supervisors/stats - Get supervisor statistics
- [ ] GET /logs/supervisor/:id/rated - Get supervisor's rated procedures
- [ ] GET /presentations/supervisor/:id/rated - Get supervisor's rated presentations
- [ ] PUT /users/:id - Update user
- [ ] DELETE /users/:id - Delete user
- [ ] PUT /users/:id/suspend - Suspend user
- [ ] PUT /users/:id/activate - Activate user
- [ ] PUT /users/:id/year - Update resident year

## File Structure

### New Files:
```
client/src/pages/master/
  ├── ResidentBrowsing.tsx (reuse supervisor logic)
  ├── SupervisorList.tsx
  ├── SupervisorView.tsx
  └── AccountManagement.tsx (enhanced)

server/src/routes/
  └── users.ts (add new endpoints)
```

### Modified Files:
```
client/src/pages/master/Dashboard.tsx
client/src/App.tsx (add routes)
server/src/routes/users.ts
```

## Reusable Components

From Supervisor Implementation:
- Year browsing cards
- Resident list with ratings
- Read-only mode system
- Navigation wrapper components

## Security Considerations

- Master can view all data (read-only for resident/supervisor views)
- Master can modify all accounts
- Confirmation required for destructive actions (delete, suspend)
- Audit log for account changes (future enhancement)

## Status: READY TO IMPLEMENT

This is a large feature set. Should we:
1. Implement everything at once?
2. Start with Dashboard + Resident browsing (reuse supervisor code)?
3. Start with Account Management enhancements?

Please let me know your preference!
