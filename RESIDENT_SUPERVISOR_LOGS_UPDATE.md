# Resident Supervisor Logs Update

## Summary
For Year 2+ residents who can act as supervisors, update the "Rated Logs" and "Logs to Rate" pages to show logs where they are the supervisor (not logs they created as residents).

## Changes Required

### 1. Rated Logs Page (`client/src/pages/resident/RatedLogs.tsx`)
**Current behavior:** Shows logs created by the resident that have been rated
**New behavior:** Should show logs where the resident is the SUPERVISOR and has provided a rating

**Changes:**
- Update API call from `/logs/my-logs` to `/logs/rated` (supervisor's rated logs)
- Filter to show only logs where `supervisor_id = current_user_id` AND `rating IS NOT NULL`

### 2. Logs to Rate Page (`client/src/pages/resident/LogsToRate.tsx`)
**Current behavior:** Shows logs assigned to the resident as supervisor (already correct)
**New behavior:** Keep current behavior but ensure it only shows for Year 2+ residents

**Changes:**
- Already uses `/logs/to-rate` endpoint which is correct
- Ensure this page is only accessible for Year 2+ residents
- The endpoint already returns logs where `supervisor_id = current_user_id` AND `status = PENDING`

### 3. Dashboard/Layout Badge Count
**New feature:** Add badge count showing number of unrated logs

**Changes:**
- Add API endpoint to get count of unrated logs: `/logs/to-rate/count`
- Display badge on "Logs to Rate" navigation item for Year 2+ residents
- Update count when logs are rated

### 4. Backend Changes

#### New endpoint needed:
```typescript
// Get count of logs to rate (for badge)
router.get('/logs/to-rate/count', authenticate, async (req: AuthRequest, res) => {
  const result = await query(
    'SELECT COUNT(*) as count FROM surgical_logs WHERE supervisor_id = $1 AND status = $2',
    [req.user!.id, 'PENDING']
  );
  res.json({ count: parseInt(result.rows[0].count) });
});
```

#### Update existing endpoint:
The `/logs/to-rate` endpoint already exists and works correctly - it returns logs where the user is the supervisor and status is PENDING.

### 5. Navigation Updates
- Show "Logs to Rate" link only for Year 2+ residents
- Add badge count next to "Logs to Rate" link
- Show "Rated Logs" link for Year 2+ residents (showing logs they rated as supervisor)

## Implementation Priority
1. Backend: Add `/logs/to-rate/count` endpoint
2. Frontend: Update RatedLogs page to show supervisor's rated logs
3. Frontend: Add badge count to navigation
4. Frontend: Ensure LogsToRate is only shown for Year 2+ residents

## Notes
- Year 2 residents can only rate MINOR_SURGERY procedures
- Year 3+ residents can rate all procedure categories
- Residents cannot rate their own procedures
