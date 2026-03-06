# Presentation Notification Debug & Fix

## Problem
Presentations appear in "Unresponded Logs" but NO notification appears in the notification bell for supervisors.

## Root Cause Analysis

### What We Know:
1. ✅ Presentation is created successfully and appears in `/presentations/to-rate` endpoint
2. ✅ Code in `server/src/routes/presentations.ts` DOES call `sendNotification()` with type 'presentation'
3. ✅ NotificationBell component DOES handle 'presentation' type notifications
4. ❌ Notification does NOT appear in the notification bell

### Most Likely Issue:
The `notification_type` column may not exist in the production database on Railway. This would cause the INSERT query to fail silently.

## The Fix

### Step 1: Enhanced Logging (COMPLETED)
Added comprehensive logging to track notification creation:
- `server/src/routes/presentations.ts` - Enhanced logging with try-catch for notification sending
- `server/src/utils/notifications.ts` - Enhanced logging with database insert confirmation

### Step 2: Run Migration on Railway
The migration endpoint already exists: `POST /migrations/add-notification-type`

**To run the migration:**
1. Login as MASTER account on Railway production
2. Open browser console
3. Run this command:
```javascript
fetch('/api/migrations/add-notification-type', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log)
```

### Step 3: Test with New Presentation
After running the migration:
1. Create a BRAND NEW presentation (not edit existing)
2. Assign it to a supervisor
3. Check Railway logs for the enhanced logging output
4. Check if notification appears in supervisor's notification bell

## What to Look For in Railway Logs

When a presentation is created, you should see:
```
=== CREATING PRESENTATION ===
supervisorId: [uuid]
User creating: [name] [id]
Presentation created with ID: [uuid]
Attempting to send notification to supervisor: [uuid]
=== SENDING NOTIFICATION ===
userId: [uuid]
message: New presentation "[title]" assigned to you by [name]
logId: [uuid]
notificationType: presentation
✅ Notification saved to database with ID: [uuid]
✅ Push notification sent
✅ Notification sent successfully
```

If you see an error instead, that will tell us exactly what's wrong.

## Alternative: Check Database Directly

If you have access to Railway database console:
```sql
-- Check if notification_type column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'notification_type';

-- Check recent notifications
SELECT * FROM notifications 
WHERE notification_type = 'presentation' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check all notifications for a specific supervisor
SELECT * FROM notifications 
WHERE user_id = '[supervisor-uuid]' 
ORDER BY created_at DESC;
```

## Files Modified
1. `server/src/routes/presentations.ts` - Enhanced logging and error handling
2. `server/src/utils/notifications.ts` - Enhanced logging and error handling

## Next Steps
1. Deploy to Railway (push will trigger deployment)
2. Run the migration endpoint as MASTER
3. Create a test presentation
4. Check Railway logs for detailed output
5. Verify notification appears in bell

## Rating Color Fix (BONUS)
Also need to fix: Ratings ≤50 should show RED, >50 should show GREEN.
Currently all ratings show green.

Files to check:
- `client/src/pages/supervisor/RatingsDone.tsx`
- `client/src/pages/supervisor/AllRatedPresentations.tsx`
- `client/src/pages/supervisor/Dashboard.tsx` (Recent Presentations)
- `client/src/pages/resident/Dashboard.tsx` (Recent Presentations)
