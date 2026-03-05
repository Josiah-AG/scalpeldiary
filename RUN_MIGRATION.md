# Run Database Migration for Procedure Category

## Step 1: Run the Migration

From the root directory, run:

```bash
cd server
npm run db:add-procedure-category
```

Or from the root:

```bash
npm run db:migrate
```

## Step 2: Verify Migration

The script will output:
- ✅ Successfully added procedure_category column

If you see this, the migration was successful!

## Step 3: Start the Server

After the migration completes, start your backend server:

```bash
cd server
npm run dev
```

Or from root:

```bash
npm run dev:server
```

## Step 4: Start the Client

In a separate terminal:

```bash
cd client
npm run dev
```

Or from root:

```bash
npm run dev:client
```

## What This Migration Does

Adds a new column `procedure_category` to the `surgical_logs` table:
- Column type: VARCHAR(100)
- Nullable: Yes (for backward compatibility with existing records)
- Used to store the category of each procedure (e.g., "GI Surgery", "Hepatobiliary Surgery", etc.)

## Testing After Migration

1. **Test AddLog Page**:
   - Go to Add Surgical Log
   - Select a category from the dropdown
   - Verify procedures appear for that category
   - Verify "Other [Category] Procedure" appears at the end
   - Verify new role options (Primary Surgeon, Primary Surgeon (Assisted), etc.)

2. **Test Dashboard**:
   - Check if Year Progress Bar appears
   - Click on the progress bar
   - Verify the detailed modal opens
   - Check category expansion works

3. **Test Analytics**:
   - Verify progress bar appears at top
   - Click to open modal
   - Verify data is correct

4. **Test Supervisor View**:
   - As a supervisor, view a resident
   - Verify progress bar appears
   - Click to see details

## Troubleshooting

### If migration fails:
1. Check database connection in `.env` file
2. Ensure PostgreSQL is running
3. Check if column already exists: `\d surgical_logs` in psql

### If "column already exists" error:
The migration uses `IF NOT EXISTS` so it should be safe to run multiple times.

### If server won't start:
1. Check for TypeScript errors: `cd server && npm run build`
2. Check imports in progress.ts
3. Verify all files are saved

## Next Steps After Migration

Once everything is running:
1. Create a test procedure with a category
2. Verify it appears in the progress calculation
3. Test the progress modal
4. Check all three integration points (Dashboard, Analytics, Supervisor View)
