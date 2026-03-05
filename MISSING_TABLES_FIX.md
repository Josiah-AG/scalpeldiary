# Missing Tables - Need to Run Migration

## Problem
Server error: `relation "monthly_duties" does not exist`

## Root Cause
The Chief Resident migration was never run, so the database tables don't exist:
- ❌ `monthly_duties` table
- ❌ `daily_activities` table
- ❌ `yearly_rotations` table
- ❌ `rotation_categories` table
- ❌ `duty_categories` table
- ❌ `activity_categories` table
- ❌ `academic_years` table

## Solution
Run the Chief Resident migration from Master Dashboard

## Steps to Fix

### 1. Login as Master
- Email: `master@example.com`
- Password: `password123`

### 2. Run Chief Resident Migration
You should see an **orange panel** that says:
```
Chief Resident System Migration Available

New features are ready to be installed. This will add:
• Chief Resident role and management features
• Yearly rotation scheduling system
• Monthly duty and activity scheduling
• Enhanced presentation assignment workflow
• Daily overview dashboards

[Run Migration] ← Click this button
```

### 3. Wait for Success
You'll see a success message:
```
✅ Migration completed successfully!

New features are now available.
```

### 4. Run Setup (Blue Panel)
After migration completes, you'll see a **blue panel**:
```
Chief Resident Setup

Run this setup to enable color coding for categories
and ensure the system is ready.

[Run Setup] ← Click this button
```

### 5. Test Assignments
- Logout from Master
- Login as Chief Resident
- Go to Monthly Duties or Activities
- Try assigning - should work now!

## What the Migration Does

Creates these tables:
1. `rotation_categories` - Categories for yearly rotations
2. `academic_years` - Academic year tracking
3. `yearly_rotations` - Monthly rotation assignments
4. `duty_categories` - Categories for daily duties
5. `monthly_duties` - Daily duty assignments
6. `activity_categories` - Categories for activities
7. `daily_activities` - Daily activity assignments
8. `presentation_assignments` - Presentation scheduling

## What the Setup Does

After migration:
1. Adds `color` columns to all category tables
2. Assigns distinct colors to all categories
3. Ensures academic year exists

## Current Status

✅ Database connection working
✅ Server running
✅ Authentication working
✅ User is Chief Resident
❌ Tables don't exist - **NEED TO RUN MIGRATION**

## Quick Check

To verify tables exist:
```bash
psql -d scalpeldiary -c "\dt" | grep -E "(monthly_duties|daily_activities)"
```

If no output, tables don't exist - run migration!

## After Migration

Once migration and setup are complete:
- ✅ All tables will exist
- ✅ All categories will have colors
- ✅ Assignments will work
- ✅ No more 500 errors

## Important Notes

1. **Migration must be run BEFORE setup**
2. **Only Master can run migration**
3. **Migration is safe to run** (uses IF NOT EXISTS)
4. **Setup is safe to run multiple times**

Run the migration now to fix the issue!
