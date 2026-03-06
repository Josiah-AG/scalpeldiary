# Notification Type Migration Button - Complete ✅

## Summary
Added a temporary migration button to the Master Dashboard to add the `notification_type` column to the notifications table in production.

## What Was Added

### Backend - Migration Endpoint
**File**: `server/src/routes/migrations.ts`

Added new endpoint: `POST /migrations/add-notification-type`

**Features**:
- Checks if `notification_type` column already exists
- Adds column if missing: `ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(20)`
- Returns success message with status
- Only accessible to Master accounts
- Safe to run multiple times (checks before adding)

### Frontend - Migration Button
**File**: `client/src/pages/master/Dashboard.tsx`

Added temporary migration button at the top of the dashboard.

**Features**:
- Purple/pink gradient design to stand out
- Shows warning that it should be run once
- Confirmation dialog before running
- Loading state with spinner
- Success/error alerts
- Disabled state during migration
- Clear instructions

## How to Use

### For Production Deployment:

1. **Deploy the code** to production (Railway/Cloudflare)

2. **Login as Master** account

3. **Click "Run Migration"** button on the dashboard

4. **Confirm** the migration when prompted

5. **Wait** for success message

6. **Done!** The notification_type column is now added

### After Migration is Complete:

Once you've run the migration successfully in production, you can remove the button by:

1. Delete the migration button section from `client/src/pages/master/Dashboard.tsx`
2. Remove the `runningNotificationMigration` state
3. Remove the `runNotificationTypeMigration` function
4. Commit and deploy

Or just leave it - it's harmless and will show "already exists" if run again.

## Migration Details

### What It Does:
```sql
ALTER TABLE notifications 
ADD COLUMN notification_type VARCHAR(20);
```

### Column Purpose:
Stores the type of notification for color coding:
- `'procedure'` - Blue notifications (procedures to rate)
- `'presentation'` - Green notifications (presentations to rate/assigned)
- `'rated'` - Purple notifications (items that have been rated)
- `'duty'` - Orange notifications (duty reminders) - Future
- `'activity'` - Yellow notifications (activity reminders) - Future
- `NULL` - Legacy notifications or general messages

### Safety:
- ✅ Safe to run multiple times
- ✅ Checks if column exists before adding
- ✅ Non-destructive operation
- ✅ No data loss
- ✅ No downtime required

## Testing

### To Test in Development:
```bash
cd server
npx ts-node src/database/add-notification-type.ts
```

### To Test via API:
1. Login as Master
2. Click the migration button
3. Check the alert message
4. Verify in database:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'notification_type';
```

## Visual Design

The button appears at the top of the Master Dashboard with:
- Purple-to-pink gradient background
- Purple border
- Activity icon
- Clear title: "Notification System Migration"
- Description: "Add notification_type column for color-coded notifications"
- Warning: "⚠️ Run this once, then this button can be removed"
- Prominent "Run Migration" button

## Files Modified
1. `server/src/routes/migrations.ts` - Added migration endpoint
2. `client/src/pages/master/Dashboard.tsx` - Added migration button

## Status: ✅ READY FOR PRODUCTION

The migration button is ready to use in production. Just deploy and click!
