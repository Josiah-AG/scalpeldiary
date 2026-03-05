# Quick Fix for Login Issue

## Problem
The backend server was started before the database was set up, so it's using an incorrect database connection.

## Solution

### Step 1: Stop the Backend Server
In the terminal where you ran `npm run dev:server`, press:
```
Ctrl + C
```

### Step 2: Restart the Backend Server
In the same terminal, run:
```bash
cd server
DATABASE_URL="postgresql://josiah-ag@localhost:5432/scalpeldiary" npm run dev
```

Or alternatively, update your `.env` file to ensure it has:
```env
DATABASE_URL=postgresql://josiah-ag@localhost:5432/scalpeldiary
```

Then restart with:
```bash
npm run dev:server
```

### Step 3: Test Login
Go to http://localhost:5173 and login with:
- **Email**: master@scalpeldiary.com
- **Password**: password123

## What Happened?

1. ✅ Database was created successfully
2. ✅ Tables were migrated successfully  
3. ✅ Demo accounts were seeded successfully
4. ❌ Backend server needs restart to use correct database connection

## Verify Database

You can verify the database has users by running:
```bash
psql -d scalpeldiary -c "SELECT email, role FROM users;"
```

You should see:
```
            email             |    role    
------------------------------+------------
 master@scalpeldiary.com      | MASTER
 supervisor1@scalpeldiary.com | SUPERVISOR
 supervisor2@scalpeldiary.com | SUPERVISOR
 resident@scalpeldiary.com    | RESIDENT
```

## All Demo Accounts

After restarting the backend, you can login with any of these:

**Master Account:**
- Email: master@scalpeldiary.com
- Password: password123

**Supervisor Account:**
- Email: supervisor1@scalpeldiary.com
- Password: password123

**Resident Account:**
- Email: resident@scalpeldiary.com
- Password: password123
