# Master Account Setup Guide

## Overview
The master account credentials are now configurable via environment variables for better security and flexibility.

## Environment Variables

### Required Variables (Railway)
Set these in your Railway project's environment variables:

```
MASTER_EMAIL=your-email@example.com
MASTER_PASSWORD=your-secure-password
MASTER_NAME=Your Name
```

### Optional Variables
```
CREATE_TEST_ACCOUNTS=false
```
Set to `true` only in development to create test supervisor and resident accounts.

## Setup Steps on Railway

### 1. Set Environment Variables

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add the following variables:

```
MASTER_EMAIL = your-email@example.com
MASTER_PASSWORD = YourSecurePassword123!
MASTER_NAME = Master Admin
```

### 2. Run the Seed Script

After setting the environment variables, you need to create the master account:

**Option A: Via Railway CLI**
```bash
railway run npm run seed
```

**Option B: Via Railway Dashboard**
1. Go to Settings → Deploy
2. Add a one-time command:
```bash
npm run build && node dist/database/seed.js
```

**Option C: Via SSH**
```bash
railway ssh
npm run build && node dist/database/seed.js
```

### 3. Verify Master Account

1. Go to your app URL
2. Try logging in with your configured email and password
3. You should see the Master Dashboard

## Updating Master Credentials

If you need to change the master account email or password:

1. Update the environment variables in Railway
2. Run the seed script again (it will update the existing master account)
3. The seed script uses `ON CONFLICT DO UPDATE`, so it's safe to run multiple times

## Security Best Practices

1. **Use a strong password**: At least 12 characters with uppercase, lowercase, numbers, and symbols
2. **Don't commit credentials**: Never commit the actual `.env` file to git
3. **Rotate passwords regularly**: Change the master password periodically
4. **Limit access**: Only share master credentials with trusted administrators

## Default Behavior

If environment variables are not set:
- Email: `master@scalpeldiary.com`
- Password: `password123`
- Name: `Master Admin`

**⚠️ WARNING**: Always set custom credentials in production!

## Troubleshooting

### Master account not created
- Check that environment variables are set correctly in Railway
- Verify the seed script ran successfully in the deployment logs
- Try running the seed script manually via Railway CLI

### Can't log in with new credentials
- Ensure the seed script ran after setting the environment variables
- Check for typos in the email/password
- Try resetting the password using the seed script again

### Multiple master accounts
- The seed script uses the email as the unique identifier
- If you change the email, a new master account will be created
- You can delete old master accounts via the Account Management page
