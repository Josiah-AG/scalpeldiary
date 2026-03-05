# Complete Guide: Enable Push Notifications for ScalpelDiary

This guide will walk you through enabling push notifications so users receive real-time alerts on their phones and desktops.

---

## Prerequisites

- Railway backend deployed and running
- Cloudflare Pages frontend deployed
- Access to Railway dashboard
- Access to Cloudflare Pages dashboard
- Terminal/command line access to your local project

---

## Step 1: Generate VAPID Keys

VAPID keys are required for secure push notifications. You need to generate a unique pair for your application.

### 1.1 Open Terminal
Open your terminal and navigate to your project directory:
```bash
cd /path/to/ScalpelDiary
```

### 1.2 Navigate to Server Directory
```bash
cd server
```

### 1.3 Install Dependencies (if not already done)
```bash
npm install
```

### 1.4 Generate VAPID Keys
Run the key generation script:
```bash
npm run generate-vapid-keys
```

### 1.5 Copy the Output
You'll see output like this:
```
VAPID Keys Generated:
====================
Public Key: BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrpcPBblQjBITjdmeaWdndBAGqhXWM6EmgBkXnOmHGhGlXe-QZs
Private Key: UUxE4puxxJykA5Lh6-Qg-Yz-Iq-Iq-Iq-Iq-Iq-Iq-Iq

Add these to your .env file:
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrpcPBblQjBITjdmeaWdndBAGqhXWM6EmgBkXnOmHGhGlXe-QZs
VAPID_PRIVATE_KEY=UUxE4puxxJykA5Lh6-Qg-Yz-Iq-Iq-Iq-Iq-Iq-Iq-Iq
```

**IMPORTANT:** Copy both keys somewhere safe. You'll need them in the next steps.

---

## Step 2: Add VAPID Keys to Railway (Backend)

### 2.1 Open Railway Dashboard
1. Go to https://railway.app
2. Log in to your account
3. Click on your ScalpelDiary project

### 2.2 Select Backend Service
1. Click on the backend service (the one running Node.js)
2. Click on the "Variables" tab

### 2.3 Add Environment Variables
Click "+ New Variable" and add these three variables:

**Variable 1:**
- Name: `VAPID_PUBLIC_KEY`
- Value: [Paste your public key from Step 1.5]

**Variable 2:**
- Name: `VAPID_PRIVATE_KEY`
- Value: [Paste your private key from Step 1.5]

**Variable 3:**
- Name: `VAPID_EMAIL`
- Value: `mailto:admin@scalpeldiary.com` (or your contact email)

### 2.4 Save and Deploy
1. Click "Add" or "Save" for each variable
2. Railway will automatically redeploy your backend
3. Wait for the deployment to complete (usually 1-2 minutes)

### 2.5 Verify Backend Logs
1. Click on the "Deployments" tab
2. Click on the latest deployment
3. Check the logs for: `✅ Push notifications enabled`
4. If you see this message, the backend is configured correctly!

---

## Step 3: Add Database Table for Push Subscriptions

### 3.1 Open Railway Shell
1. In Railway dashboard, go to your backend service
2. Click on the "Settings" tab
3. Scroll down and click "Open Shell" or "Connect"

### 3.2 Run Migration Command
In the shell, run:
```bash
npm run db:add-push-subscriptions
```

### 3.3 Verify Success
You should see:
```
Push subscriptions table created successfully
```

**Alternative Method (Manual SQL):**
If the command doesn't work, you can run the SQL directly:

1. Go to your PostgreSQL database in Railway
2. Click "Connect" or "Query"
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
```

---

## Step 4: Add VAPID Public Key to Cloudflare Pages (Frontend)

### 4.1 Open Cloudflare Dashboard
1. Go to https://dash.cloudflare.com
2. Log in to your account
3. Click on "Workers & Pages" in the left sidebar
4. Find and click on your "scalpeldiary" project

### 4.2 Go to Settings
1. Click on the "Settings" tab
2. Scroll down to "Environment variables"

### 4.3 Add Environment Variable
1. Click "Add variable"
2. Select "Production" environment
3. Add the variable:
   - Variable name: `VITE_VAPID_PUBLIC_KEY`
   - Value: [Paste your PUBLIC key from Step 1.5]
4. Click "Save"

### 4.4 Redeploy Frontend
1. Go to the "Deployments" tab
2. Click "Retry deployment" on the latest deployment
   OR
3. Make a small change to your code and push to GitHub (Cloudflare auto-deploys)

### 4.5 Wait for Deployment
Wait for Cloudflare to finish deploying (usually 1-2 minutes)

---

## Step 5: Test Push Notifications

### 5.1 Clear Browser Cache
1. Open your browser
2. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
3. Clear cache and cookies for scalpeldiary.com
4. Close and reopen your browser

### 5.2 Visit ScalpelDiary
1. Go to https://scalpeldiary.com
2. Log in with your account

### 5.3 Enable Notifications
1. After 5 seconds, you should see a green notification prompt at the top
2. Click "Enable Notifications"
3. Your browser will ask for permission - click "Allow"
4. You should see a success message

### 5.4 Test Notification
To test if notifications work:

**Option A: Have someone rate your log**
1. Log in as a resident
2. Add a surgical log
3. Have a supervisor rate it
4. You should receive a push notification!

**Option B: Test with two accounts**
1. Open two browser windows (or use incognito mode)
2. Log in as resident in one, supervisor in another
3. Resident adds a log
4. Supervisor rates it
5. Resident should receive notification

---

## Step 6: Verify Everything Works

### 6.1 Check Backend Logs
In Railway:
1. Go to backend service
2. Check logs for:
   - `✅ Push notifications enabled`
   - `Successfully subscribed to push notifications` (when user enables)

### 6.2 Check Frontend Console
In your browser:
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for:
   - `Service Worker registered`
   - `Successfully subscribed to push notifications`

### 6.3 Check Database
In Railway PostgreSQL:
1. Connect to database
2. Run: `SELECT * FROM push_subscriptions;`
3. You should see entries for users who enabled notifications

---

## Troubleshooting

### Issue: "Push notifications are not configured on the server"
**Solution:** 
- Check that VAPID keys are added to Railway
- Verify backend redeployed after adding keys
- Check backend logs for errors

### Issue: No notification prompt appears
**Solution:**
- Clear browser cache and cookies
- Check if notifications were previously denied in browser settings
- Try a different browser or incognito mode

### Issue: Prompt appears but "Enable" doesn't work
**Solution:**
- Check browser console for errors
- Verify VITE_VAPID_PUBLIC_KEY is set in Cloudflare
- Make sure frontend redeployed after adding the variable

### Issue: Notifications enabled but not receiving them
**Solution:**
- Check if push_subscriptions table exists in database
- Verify backend logs show subscription was saved
- Test with a fresh browser/device

### Issue: "Service Worker registration failed"
**Solution:**
- Make sure you're accessing via HTTPS (not HTTP)
- Clear service worker cache in browser DevTools
- Check if service worker file (sw.js) is accessible

---

## Platform-Specific Notes

### Android (Chrome, Edge, Samsung Internet)
- ✅ Full support
- Notifications appear in notification tray
- Works even when browser is closed

### iOS/iPadOS (Safari 16.4+)
- ✅ Supported on iOS 16.4 and later
- Must add to home screen first (PWA)
- Notifications appear in notification center

### Desktop (Chrome, Edge, Firefox, Safari 16+)
- ✅ Full support
- Notifications appear in system notification area
- Works even when browser is minimized

---

## Security Best Practices

1. **Keep Private Key Secret**
   - Never commit VAPID_PRIVATE_KEY to Git
   - Only store in Railway environment variables
   - Don't share with anyone

2. **Use Unique Keys**
   - Generate new keys for your production app
   - Don't use the example keys from documentation

3. **Monitor Usage**
   - Check Railway logs regularly
   - Monitor push_subscriptions table size
   - Remove old/invalid subscriptions periodically

---

## Summary Checklist

- [ ] Generated VAPID keys locally
- [ ] Added VAPID_PUBLIC_KEY to Railway
- [ ] Added VAPID_PRIVATE_KEY to Railway
- [ ] Added VAPID_EMAIL to Railway
- [ ] Backend redeployed successfully
- [ ] Ran database migration for push_subscriptions table
- [ ] Added VITE_VAPID_PUBLIC_KEY to Cloudflare Pages
- [ ] Frontend redeployed successfully
- [ ] Tested notification prompt appears
- [ ] Tested enabling notifications
- [ ] Tested receiving actual notifications
- [ ] Verified in backend logs
- [ ] Verified in database

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway and Cloudflare logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
5. Make sure both services redeployed after adding variables

---

## What Happens Next?

Once enabled, users will:
1. See the notification prompt 5 seconds after logging in
2. Click "Enable Notifications" to opt-in
3. Receive push notifications for:
   - New surgical log ratings
   - Presentation assignments
   - Any other in-app notifications

Notifications work across all their devices where they've enabled them!
