# Login Issue Fix

## Problem
Login is failing after implementing the JSON procedure tracking system.

## Root Cause
The server may not be starting properly due to import issues with the new progress route.

## Solution

### Option 1: Start Server with tsx (Recommended)
The server uses `tsx` which handles TypeScript and JSON imports at runtime:

```bash
cd server
npm run dev
```

This should work because:
- `tsx` handles TypeScript compilation on the fly
- `tsx` supports JSON imports
- The shared folder is accessible at runtime

### Option 2: Check Server Logs
If the server is running but login still fails, check the terminal where the server is running for errors.

Common errors to look for:
- Database connection errors
- Import/module errors
- JWT secret missing

### Option 3: Verify Database Connection
Make sure PostgreSQL is running and the `.env` file has correct credentials:

```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Or on macOS with Homebrew:
brew services list | grep postgresql
```

### Option 4: Test Login Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Files Changed That Could Affect Login

### server/src/routes/progress.ts
- New route added
- Imports from shared folder
- Should not affect login directly

### server/src/index.ts
- Added progress route registration
- Should not break existing routes

### shared/procedureUtils.ts
- New utility file
- Only used by progress route
- Should not affect auth

## Quick Test

1. **Stop the server** (Ctrl+C in the terminal running it)

2. **Start the server again**:
```bash
cd server
npm run dev
```

3. **Watch for errors** in the terminal output

4. **Try logging in** once you see "Server running on port 3000"

## If Login Still Fails

### Check these:

1. **Is the server actually running?**
   - Look for "Server running on port 3000" message
   - Check http://localhost:3000 in browser (should show "Cannot GET /")

2. **Are there any error messages?**
   - Red text in server terminal
   - Module not found errors
   - Database connection errors

3. **Is the database accessible?**
   ```bash
   psql -U your_username -d your_database_name -c "SELECT 1;"
   ```

4. **Are the credentials correct?**
   - Check `.env` file
   - Verify user exists in database
   - Try with a known working account

## Rollback Option

If nothing works, you can temporarily comment out the progress route:

In `server/src/index.ts`:
```typescript
// import progressRoutes from './routes/progress';
// ...
// app.use('/api/progress', progressRoutes);
```

This will disable the progress feature but allow login to work.

## Most Likely Solution

The issue is probably just that the server needs to be restarted. Run:

```bash
cd server
npm run dev
```

And wait for "Server running on port 3000" before trying to login.
