# Fix Production Database - Missing Columns

## Problem
The production database is missing several columns that were added during development:
- `institution`
- `specialty`
- `profile_picture`
- `is_suspended`
- `has_management_access`
- `is_chief_resident`
- `is_senior`

This causes 500 errors when trying to create users or fetch user data.

## Solution

### Option 1: Run Migration via Railway CLI (Recommended)

1. Install Railway CLI if you haven't:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
railway link
```

4. Run the migration script:
```bash
railway run npx ts-node server/src/database/add-missing-columns.ts
```

5. Restart your Railway service after migration completes

### Option 2: Run Migration Locally with Production Database URL

1. Get your production DATABASE_URL from Railway dashboard

2. Create a temporary `.env.production` file:
```
DATABASE_URL=your_production_database_url_here
```

3. Run the migration:
```bash
DATABASE_URL=your_production_url npx ts-node server/src/database/add-missing-columns.ts
```

### Option 3: Add to Package.json and Run on Railway

1. The migration script is already created at `server/src/database/add-missing-columns.ts`

2. In Railway dashboard, go to your service settings

3. Add a one-time command or run via the Railway CLI:
```bash
railway run npm run build && node dist/database/add-missing-columns.js
```

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

You should see all these columns:
- id
- email
- password
- name
- role
- created_at
- updated_at
- institution
- specialty
- profile_picture
- is_suspended
- has_management_access
- is_chief_resident
- is_senior

## After Migration

1. Restart your Railway service
2. Try creating a user again
3. The error should be resolved

## Prevention

To prevent this in the future, always run migrations on production after deploying code that requires new database columns.
