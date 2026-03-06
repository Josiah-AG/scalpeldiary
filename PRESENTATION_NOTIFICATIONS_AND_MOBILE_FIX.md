# Presentation Notifications and Mobile Responsive Fixes

## Issues Fixed

### 1. Rated Presentations Not Showing
**Problem**: Presentations marked as NOT_WITNESSED were not appearing in the supervisor's "Ratings Done" page.

**Solution**: Updated the `/presentations/rated` endpoint to include both RATED and NOT_WITNESSED statuses:
```sql
WHERE p.supervisor_id = $1 AND (p.status = 'RATED' OR p.status = 'NOT_WITNESSED')
```

### 2. NOT_WITNESSED Display
**Problem**: Presentations without ratings (NOT_WITNESSED) were showing blank or confusing values.

**Solution**: 
- Display "N/A" badge for NOT_WITNESSED presentations
- Show "N/A (Not Witnessed)" in detail modals
- Gray badge styling to differentiate from rated items

### 3. Average Rating Calculations
**Problem**: NOT_WITNESSED presentations were being included in average rating calculations.

**Solution**: Updated presentation stats query to exclude NOT_WITNESSED:
```sql
WHERE resident_id = $1 AND year_id = $2 AND rating IS NOT NULL AND status != 'NOT_WITNESSED'
```

### 4. Mobile Responsiveness
**Problem**: "Ratings Done" pages for both procedures and presentations were not mobile-friendly.

**Solution**: 
- Added responsive design with `hidden md:block` for desktop table view
- Created mobile card layout with `md:hidden` for mobile devices
- Cards show key information and are clickable to view details
- Consistent styling with other mobile-responsive pages

## Files Modified

### Backend
- `server/src/routes/presentations.ts`
  - Updated `/rated` endpoint to include NOT_WITNESSED status
  - Updated stats query to exclude NOT_WITNESSED from averages

### Frontend
- `client/src/pages/supervisor/AllRatedProcedures.tsx`
  - Added mobile responsive card layout
  - Added status field to interface
  - Display N/A for NOT_WITNESSED ratings
  
- `client/src/pages/supervisor/AllRatedPresentations.tsx`
  - Added mobile responsive card layout
  - Added status field to interface
  - Display N/A for NOT_WITNESSED ratings

## Testing Checklist

- [x] Rated presentations with scores show in "Ratings Done"
- [x] NOT_WITNESSED presentations show in "Ratings Done" with N/A badge
- [x] Mobile view shows card layout on small screens
- [x] Desktop view shows table layout on large screens
- [x] Cards are clickable and open detail modals
- [x] Average ratings exclude NOT_WITNESSED presentations
- [x] Detail modals show "N/A (Not Witnessed)" for unrated items

## Deployment Status

Changes pushed to GitHub and will auto-deploy to:
- Railway (backend)
- Cloudflare Pages (frontend)

## Next Steps

If presentation notifications still aren't appearing:
1. Check database to verify notification records are being created
2. Verify push notification service is working
3. Check browser console for any errors
4. Test with a fresh presentation creation
