# Push Notifications - Configuration Keys

## Generated VAPID Keys

These keys have been generated for your ScalpelDiary application. Keep them secure!

---

## Step 1: Add to Railway (Backend)

Go to Railway → Your Project → Backend Service → Variables

Add these 3 environment variables:

```
VAPID_PUBLIC_KEY=BC2vMPdgE4fBxuk35hWLXlLN7BgTZA4g3bgW0RqdD584fJyfX0zjLFypS-mGQwKVlJwxdRM3a6beEVMlKxSeNdM

VAPID_PRIVATE_KEY=KqDe_-QjwI28FKxZWKzAyJpR8vz_mAKzLk_tHeTXwcw

VAPID_EMAIL=mailto:admin@scalpeldiary.com
```

After adding, Railway will automatically redeploy.

---

## Step 2: Add to Cloudflare Pages (Frontend)

Go to Cloudflare → Workers & Pages → scalpeldiary → Settings → Environment variables

Add this 1 environment variable for Production:

```
VITE_VAPID_PUBLIC_KEY=BC2vMPdgE4fBxuk35hWLXlLN7BgTZA4g3bgW0RqdD584fJyfX0zjLFypS-mGQwKVlJwxdRM3a6beEVMlKxSeNdM
```

After adding, trigger a new deployment (or push to GitHub).

---

## Step 3: Run Database Migration

You need to add the push_subscriptions table to your database.

### Option A: Via Railway Shell
1. Go to Railway → Backend Service → Settings
2. Click "Open Shell" or "Connect"
3. Run: `npm run db:add-push-subscriptions`

### Option B: Via PostgreSQL Query
1. Go to Railway → PostgreSQL Database
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

## Verification Checklist

After completing the steps above:

- [ ] Added VAPID_PUBLIC_KEY to Railway
- [ ] Added VAPID_PRIVATE_KEY to Railway  
- [ ] Added VAPID_EMAIL to Railway
- [ ] Railway backend redeployed (check logs for "✅ Push notifications enabled")
- [ ] Added VITE_VAPID_PUBLIC_KEY to Cloudflare Pages
- [ ] Cloudflare frontend redeployed
- [ ] Ran database migration (push_subscriptions table created)
- [ ] Tested: Visit scalpeldiary.com and see notification prompt after 5 seconds
- [ ] Tested: Click "Enable Notifications" and grant permission
- [ ] Tested: Receive a push notification (have supervisor rate a log)

---

## Quick Test

1. Visit https://scalpeldiary.com
2. Log in
3. Wait 5 seconds - you should see a green notification prompt at the top
4. Click "Enable Notifications"
5. Browser will ask for permission - click "Allow"
6. Have someone rate one of your logs
7. You should receive a push notification!

---

## Important Notes

- **Keep VAPID_PRIVATE_KEY secret** - never commit to Git or share publicly
- **Public key is safe to share** - it's used in the frontend
- **Keys are unique to your app** - don't use example keys from documentation
- **Works on all platforms**: Android, iOS 16.4+, Desktop (Chrome, Edge, Firefox, Safari)

---

## Troubleshooting

### Backend not starting?
- Check Railway logs for errors
- Verify all 3 variables are added correctly
- Make sure there are no extra spaces in the keys

### Notification prompt not appearing?
- Clear browser cache and cookies
- Try incognito/private mode
- Check browser console for errors
- Verify frontend redeployed with VITE_VAPID_PUBLIC_KEY

### Can't enable notifications?
- Check if browser blocked notifications
- Go to browser settings → Site settings → Notifications
- Allow notifications for scalpeldiary.com

### Not receiving notifications?
- Check if push_subscriptions table exists in database
- Verify backend logs show "Successfully subscribed"
- Test with a fresh browser/device

---

## Support

If you need help, check:
1. Railway backend logs
2. Cloudflare deployment logs  
3. Browser console (F12 → Console)
4. Database for push_subscriptions table

The detailed guide is in `ENABLE_PUSH_NOTIFICATIONS_GUIDE.md`
