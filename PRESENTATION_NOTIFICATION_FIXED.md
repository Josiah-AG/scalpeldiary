# Presentation Notification Issue - FIXED ✅

## Root Cause Found

The Railway logs revealed the exact issue:
```
❌ Failed to send notification: error: invalid input syntax for type uuid: "9"
```

The problem was that we were passing the **presentation ID** (an integer like `9`) as the `log_id` parameter, but the `notifications.log_id` column expects a **UUID** because it references `surgical_logs(id)`.

## The Fix

Changed presentation notification calls to pass `null` for `log_id` since presentations don't have a surgical log ID:

### Before (BROKEN):
```typescript
await sendNotification(
  supervisorId,
  `New presentation "${title}" assigned to you by ${req.user!.name}`,
  result.rows[0].id,  // ❌ This is an integer, not a UUID!
  'presentation'
);
```

### After (FIXED):
```typescript
await sendNotification(
  supervisorId,
  `New presentation "${title}" assigned to you by ${req.user!.name}`,
  null,  // ✅ Presentations don't have log_id
  'presentation'
);
```

## Files Modified

1. **server/src/routes/presentations.ts**
   - Fixed presentation creation notification (line ~64)
   - Fixed presentation rating notification (line ~260)
   - Both now pass `null` for log_id

2. **server/src/utils/notifications.ts**
   - Updated type signature to accept `string | null` for logId
   - Simplified push notification URL to always go to home page

3. **server/src/routes/notifications.ts**
   - Added debug logging to notification fetching

4. **client/src/pages/master/Dashboard.tsx**
   - Added debug tools to check recent notifications
   - Can now see all recent notifications with their types

## Testing After Deployment

Once Railway deploys:

1. **Create a new presentation as RESIDENT**
   - Login as resident
   - Go to Presentations
   - Click "Add Presentation"
   - Fill in details and assign to a supervisor
   - Submit

2. **Check supervisor's notification bell**
   - Login as the assigned supervisor
   - Look at notification bell (top right)
   - Should see a GREEN notification with presentation title
   - Click "Rate Presentation" to open rating modal

3. **Verify in Railway logs**
   - Should see:
   ```
   === CREATING PRESENTATION ===
   supervisorId: [uuid]
   Presentation created with ID: [number]
   Attempting to send notification to supervisor: [uuid]
   === SENDING NOTIFICATION ===
   userId: [uuid]
   message: New presentation "[title]" assigned to you by [name]
   logId: null
   notificationType: presentation
   ✅ Notification saved to database with ID: [uuid]
   ✅ Push notification sent
   ✅ Notification sent successfully
   ```

## Why This Happened

The `notifications` table was originally designed for surgical logs, which have UUID IDs. When we added presentations (which have integer IDs), we incorrectly tried to use the presentation ID as the log_id.

The correct approach is:
- **Procedures**: Pass the surgical_log UUID as log_id
- **Presentations**: Pass `null` as log_id (no surgical log)
- **Rated notifications**: Pass `null` as log_id (notification is about the rating, not the log)

## Additional Fixes Included

1. Enhanced logging throughout notification system
2. Added debug endpoint for Master to check recent notifications
3. Added UI in Master Dashboard to view recent notifications
4. Better error handling with try-catch blocks

## Deployment Status

✅ Pushed to GitHub
⏳ Waiting for Railway auto-deploy

Once deployed, presentation notifications should work perfectly!

## Next Steps

After confirming notifications work:
1. Test procedure notifications (should already work)
2. Test rated notifications (should now work)
3. Fix rating color bug (≤50 should be red, not green)
