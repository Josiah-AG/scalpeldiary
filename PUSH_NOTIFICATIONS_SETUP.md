# Push Notifications Setup Guide

## Overview
ScalpelDiary now supports native push notifications! Users will receive real-time alerts on their phones and desktops when:
- A supervisor rates their surgical log
- A new presentation is assigned
- Any other in-app notification occurs

## Backend Setup (Railway)

### 1. Install Dependencies
The backend needs the `web-push` package. Railway will automatically install it from package.json on next deployment.

### 2. Run Database Migration
Add the push_subscriptions table by running:
```bash
npm run db:add-push-subscriptions
```

Or manually execute the SQL:
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

### 3. Generate VAPID Keys (Optional - for production)
For better security, generate new VAPID keys:
```bash
npm run generate-vapid-keys
```

Then add these environment variables to Railway:
- `VAPID_PUBLIC_KEY` - The public key
- `VAPID_PRIVATE_KEY` - The private key
- `VAPID_EMAIL` - Your contact email (e.g., mailto:admin@scalpeldiary.com)

**Note:** The app includes default VAPID keys that work, but generating new ones is recommended for production.

## Frontend Setup (Cloudflare Pages)

### 1. Add Environment Variable
In Cloudflare Pages settings, add:
- `VITE_VAPID_PUBLIC_KEY` - Same as the backend public key

**Note:** This is already set in `.env.production` with the default key.

## How It Works

### User Experience
1. User visits the app
2. After 5 seconds, a notification permission prompt appears at the top
3. User clicks "Enable Notifications"
4. Browser asks for permission
5. Once granted, user receives push notifications for all in-app events

### Technical Flow
1. Service worker registers push subscription with browser
2. Subscription details sent to backend `/notifications/subscribe`
3. Backend stores subscription in `push_subscriptions` table
4. When notification is created, backend:
   - Saves to `notifications` table (in-app)
   - Sends push notification to all user's devices via web-push

### Supported Platforms
- ✅ Android (Chrome, Edge, Samsung Internet)
- ✅ Desktop (Chrome, Edge, Firefox, Safari 16+)
- ✅ iOS/iPadOS 16.4+ (Safari)

## Testing

### Test Push Notifications
1. Log in as a resident
2. Enable notifications when prompted
3. Have a supervisor rate one of your logs
4. You should receive a push notification!

### Troubleshooting
- **No prompt appears:** Check if already granted/denied in browser settings
- **Permission denied:** User must manually enable in browser settings
- **No notifications received:** Check browser console for errors
- **Railway deployment:** Ensure web-push package is installed

## Files Modified
- `client/public/sw.js` - Service worker with push handlers
- `client/src/components/NotificationPermission.tsx` - Permission prompt UI
- `server/src/routes/notifications.ts` - Push subscription endpoints
- `server/src/utils/notifications.ts` - Integrated push sending
- `server/src/database/add-push-subscriptions.ts` - Database migration

## Environment Variables Summary

### Backend (Railway)
```env
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:admin@scalpeldiary.com
```

### Frontend (Cloudflare Pages)
```env
VITE_VAPID_PUBLIC_KEY=your-public-key
```

## Next Steps
1. Deploy to Railway (automatic from GitHub push)
2. Run database migration on Railway
3. Test notifications with real users
4. (Optional) Generate and update VAPID keys for production
