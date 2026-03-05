# Migration Button Troubleshooting

## Issue: "Migration failed" error when clicking button

### Step 1: Check if Server Has New Routes

The most common issue is that the server needs to be restarted to load the new migration routes.

**Solution:**
1. Stop the backend server (Ctrl+C in the terminal running the server)
2. Rebuild the server:
   ```bash
   cd server
   npm run build
   ```
3. Restart the server:
   ```bash
   npm start
   ```

### Step 2: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Click the "Run Migration" button again
4. Look for error messages

**Common errors:**

#### Error: "404 Not Found"
- **Cause**: Server doesn't have the migration routes
- **Solution**: Restart server (see Step 1)

#### Error: "403 Forbidden"
- **Cause**: Not logged in as Master account
- **Solution**: Login with `master@scalpeldiary.com` / `password123`

#### Error: "500 Internal Server Error"
- **Cause**: Database connection issue or SQL error
- **Solution**: Check server terminal logs for details

### Step 3: Check Server Terminal Logs

Look at the terminal where the server is running. You should see:
- `Server running on port 3000`
- Any error messages when you click the button

**Common server errors:**

#### "Cannot find module './routes/migrations'"
- **Cause**: TypeScript not compiled
- **Solution**: Run `npm run build` in server directory

#### "relation already exists"
- **Cause**: Tables already created
- **Solution**: This is actually OK! The migration uses `IF NOT EXISTS` so it should handle this

#### Database connection errors
- **Cause**: PostgreSQL not running or wrong credentials
- **Solution**: Check `.env` file and ensure PostgreSQL is running

### Step 4: Manual Migration (If Button Doesn't Work)

If the button still doesn't work, you can run the migration manually:

```bash
cd server
npm run build
node dist/database/add-chief-resident-tables.js
```

This will run the same migration script directly.

### Step 5: Verify Migration Worked

After migration, check if tables were created:

```sql
-- Connect to your database and run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'rotation_categories',
  'academic_years',
  'yearly_rotations',
  'duty_categories',
  'monthly_duties',
  'activity_categories',
  'daily_activities',
  'presentation_assignments'
);
```

You should see all 8 tables listed.

### Step 6: Check Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Click "Run Migration" button
4. Look for the POST request to `/api/migrations/run-chief-resident-migration`
5. Click on it to see the response

**What to look for:**
- Status code (should be 200 for success, 500 for error)
- Response body (will show error details)
- Request headers (verify Authorization token is present)

## Quick Checklist

- [ ] Server is running
- [ ] Server was restarted after adding new files
- [ ] Logged in as Master account
- [ ] Browser console shows no 404 errors
- [ ] Database is running and accessible
- [ ] `.env` file has correct database credentials

## Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Check the exact error message** in browser console
2. **Check server terminal** for detailed error logs
3. **Try manual migration** using the command line script
4. **Verify database permissions** - user needs CREATE TABLE rights
5. **Check if tables already exist** - migration might have partially succeeded

## Success Indicators

When migration works, you should see:
- ✅ Alert: "Migration completed successfully!"
- ✅ Green banner in dashboard: "Chief Resident System Active"
- ✅ Console log: "Migration response: { success: true, ... }"
- ✅ Server log: "✓ Created [table name]" for each table

## Common Solutions Summary

1. **Restart server** - Fixes 90% of issues
2. **Rebuild TypeScript** - `npm run build` in server directory
3. **Check login** - Must be Master account
4. **Manual migration** - Use command line if button fails
5. **Check database** - Ensure PostgreSQL is running
