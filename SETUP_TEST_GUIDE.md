# Chief Resident Setup - Testing Guide

## Quick Test Steps

### 1. Start the Application
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend  
cd client
npm run dev
```

### 2. Login as Master
- Email: `master@example.com`
- Password: `password123`

### 3. Run the Setup
1. You should see a blue panel titled "Chief Resident Setup"
2. Click the "Run Setup" button
3. Confirm the action in the dialog
4. Wait for success message: "Setup completed successfully!"

### 4. Test Yearly Rotations
1. Create a Chief Resident account (or make an existing resident a chief)
2. Login as Chief Resident
3. Go to "Yearly Rotations"
4. Click "Manage Categories"
5. **Verify:** Each category should have a distinct color in the color picker
6. Try assigning a rotation to a resident
7. **Verify:** Assignment succeeds without errors
8. **Verify:** Card shows with colored left border

### 5. Test Monthly Duties
1. Still logged in as Chief Resident
2. Go to "Monthly Duties"
3. Click "Manage Categories"
4. **Verify:** Each duty category has a distinct color
5. Try assigning a duty to a resident
6. **Verify:** Assignment succeeds without errors

### 6. Test Monthly Activities
1. Still logged in as Chief Resident
2. Go to "Monthly Activities"
3. Click "Manage Categories"
4. **Verify:** Each activity category has a distinct color
5. Try assigning an activity to a resident
6. **Verify:** Assignment succeeds without errors

## Expected Results

### After Setup:
- ✅ All rotation categories have colors
- ✅ All duty categories have colors
- ✅ All activity categories have colors
- ✅ Academic year 2026-2027 exists
- ✅ No database errors

### Visual Appearance:
- ✅ Rotation cards: White with colored left border (4px)
- ✅ Category names visible in light gradient header
- ✅ Modern, professional look (not "kindergarten vibe")
- ✅ Each category has unique, distinct color

### Functionality:
- ✅ Can assign rotations without errors
- ✅ Can assign duties without errors
- ✅ Can assign activities without errors
- ✅ Can edit category colors in management modal
- ✅ Colors persist after page refresh

## Troubleshooting

### If Setup Button Doesn't Appear:
- Check that Chief Resident migration was run first
- Check browser console for errors
- Verify you're logged in as Master

### If Setup Fails:
- Check server console for error details
- Verify database connection is working
- Check that tables exist (rotation_categories, duty_categories, activity_categories)

### If Assignments Still Fail:
- Run setup again (it's safe to run multiple times)
- Check browser console for specific error
- Verify color columns exist in database:
  ```sql
  \d rotation_categories
  \d duty_categories
  \d activity_categories
  ```

### If Colors Don't Show:
- Hard refresh browser (Cmd+Shift+R on Mac)
- Check that setup completed successfully
- Verify color values in database are valid hex codes

## Database Verification

If you want to verify the setup worked, connect to PostgreSQL:

```bash
psql -d scalpeldiary
```

Then run:

```sql
-- Check rotation categories
SELECT id, name, color FROM rotation_categories ORDER BY id;

-- Check duty categories
SELECT id, name, color FROM duty_categories ORDER BY id;

-- Check activity categories
SELECT id, name, color FROM activity_categories ORDER BY id;

-- Check academic year
SELECT * FROM academic_years WHERE is_active = true;
```

You should see:
- 15 rotation categories with distinct colors
- 5 duty categories with distinct colors
- 4 activity categories with distinct colors
- 1 active academic year (2026-2027)

## Success Indicators

✅ **Setup Completed:** Green success alert appears
✅ **Colors Assigned:** Each category has a hex color value
✅ **Assignments Work:** No "failed to assign" errors
✅ **Visual Design:** Modern cards with subtle color accents
✅ **User Experience:** Smooth, professional interface

## Next Actions After Testing

If everything works:
1. ✅ Mark setup as complete
2. ✅ Document any issues found
3. ✅ Test with real resident data
4. ✅ Train users on new color system

If issues found:
1. Note specific error messages
2. Check server logs
3. Verify database state
4. Report issues for fixing
