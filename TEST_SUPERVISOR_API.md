# Test Supervisor API

## Steps to Debug:

1. **Open the app in browser**
2. **Login as Master** (master@scalpeldiary.com / password123)
3. **Open Browser Console** (F12 → Console tab)
4. **Click "Total Supervisors"** on the dashboard
5. **Check console logs** for:
   - "Response status: XXX"
   - "Response ok: true/false"
   - "Supervisors data: [...]"
   - Any error messages

## Expected Output:
```
Response status: 200
Response ok: true
Supervisors data: [{id: 1, name: "Dr. John Smith", ...}, {id: 2, name: "Dr. Sarah Johnson", ...}]
Number of supervisors: 2
```

## If you see errors:

### Error 401 (Unauthorized):
- Token might be expired
- Try logging out and logging back in

### Error 403 (Forbidden):
- User might not have MASTER role
- Check if logged in as master

### Error 500 (Server Error):
- Check server console for database errors
- Restart the backend server

### Empty array [] but status 200:
- Database query returned no results
- Run: `npx ts-node src/database/add-supervisors.ts` from server folder

## Manual API Test:

You can also test the API directly using curl:

```bash
# First, login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@scalpeldiary.com","password":"password123"}'

# Copy the token from response, then:
curl http://localhost:5000/api/users/supervisors/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

This should return the supervisors data.
