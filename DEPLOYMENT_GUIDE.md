# ScalpelDiary Deployment Guide

## Architecture Overview
- **Frontend**: Cloudflare Pages (scalpeldiary.com)
- **Backend**: Railway (API server)
- **Database**: PostgreSQL on Railway
- **File Storage**: AWS S3 (profile pictures)

---

## Prerequisites

1. **Accounts Needed**:
   - Cloudflare account (with scalpeldiary.com domain)
   - Railway account
   - AWS account (for S3)
   - GitHub account (for code repository)

2. **Tools Required**:
   - Git
   - Node.js 18+ and npm

---

## Part 1: AWS S3 Setup (Profile Pictures)

### Step 1: Create S3 Bucket

1. Log into AWS Console → S3
2. Click "Create bucket"
3. Bucket name: `scalpeldiary-uploads` (or your preferred name)
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. **Block Public Access**: UNCHECK "Block all public access"
   - Check the acknowledgment box
6. Click "Create bucket"

### Step 2: Configure Bucket CORS

1. Go to your bucket → Permissions tab
2. Scroll to "Cross-origin resource sharing (CORS)"
3. Click "Edit" and paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://scalpeldiary.com", "http://localhost:5173"],
        "ExposeHeaders": ["ETag"]
    }
]
```

4. Save changes

### Step 3: Create IAM User for S3 Access

1. Go to IAM → Users → "Create user"
2. Username: `scalpeldiary-s3-user`
3. Click "Next"
4. Select "Attach policies directly"
5. Search and select: `AmazonS3FullAccess`
6. Click "Create user"

### Step 4: Generate Access Keys

1. Click on the created user
2. Go to "Security credentials" tab
3. Scroll to "Access keys" → "Create access key"
4. Select "Application running outside AWS"
5. Click "Next" → "Create access key"
6. **IMPORTANT**: Copy and save:
   - Access key ID
   - Secret access key
   (You won't see the secret again!)

### Step 5: Make Bucket Public for Read

1. Go to bucket → Permissions → Bucket Policy
2. Click "Edit" and paste (replace `scalpeldiary-uploads` with your bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::scalpeldiary-uploads/*"
        }
    ]
}
```

3. Save changes

---

## Part 2: Railway Backend Deployment

### Step 1: Push Code to GitHub

1. Create a new GitHub repository: `scalpeldiary`
2. In your project folder:

```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scalpeldiary.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your `scalpeldiary` repository

### Step 3: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Wait for it to provision

### Step 4: Configure Backend Service

1. Click on your GitHub service (the one that was created)
2. Go to "Settings" tab
3. **Root Directory**: Set to `server`
4. **Start Command**: `npm run start`
5. **Build Command**: `npm install && npm run build`

### Step 5: Set Environment Variables

1. In your backend service, go to "Variables" tab
2. Click "New Variable" and add each of these:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
DATABASE_URL=${{Postgres.DATABASE_URL}}
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-from-step-4
AWS_SECRET_ACCESS_KEY=your-aws-secret-key-from-step-4
AWS_S3_BUCKET=scalpeldiary-uploads
FRONTEND_URL=https://scalpeldiary.com
```

**Important Notes**:
- `DATABASE_URL` will auto-populate from your PostgreSQL service
- Replace AWS credentials with your actual values from Part 1, Step 4
- Change `JWT_SECRET` to a random 32+ character string
- Update `AWS_S3_BUCKET` if you used a different name

### Step 6: Deploy Backend

1. Railway will automatically deploy
2. Wait for deployment to complete (check "Deployments" tab)
3. Once deployed, go to "Settings" → "Networking"
4. Click "Generate Domain"
5. Copy your Railway URL (e.g., `scalpeldiary-production.up.railway.app`)

### Step 7: Run Database Migrations

1. In Railway, go to your backend service
2. Click on "Settings" → scroll to "Service"
3. You'll need to run migrations manually first time:

**Option A: Using Railway CLI** (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate
```

**Option B: Using Railway Shell**
1. In Railway dashboard, click your service
2. Go to "Settings" → scroll down
3. Look for "Service" section
4. You can't run commands directly, so you'll need to:
   - Add a migration endpoint to your API (see below)
   - Or use Railway CLI

---

## Part 3: Cloudflare Pages Frontend Deployment

### Step 1: Update Frontend API URL

1. Create production environment file:

```bash
# In your project root
cat > client/.env.production << EOF
VITE_API_URL=https://your-railway-url.up.railway.app/api
EOF
```

Replace `your-railway-url.up.railway.app` with your actual Railway domain from Part 2, Step 6.

### Step 2: Commit Changes

```bash
git add client/.env.production
git commit -m "Add production environment config"
git push origin main
```

### Step 3: Create Cloudflare Pages Project

1. Log into Cloudflare Dashboard
2. Go to "Workers & Pages" → "Create application"
3. Select "Pages" tab → "Connect to Git"
4. Authorize Cloudflare to access your GitHub
5. Select your `scalpeldiary` repository
6. Configure build settings:
   - **Project name**: `scalpeldiary`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `cd client && npm install && npm run build`
   - **Build output directory**: `client/dist`

7. Click "Save and Deploy"

### Step 4: Configure Custom Domain

1. After deployment, go to your Pages project
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter: `scalpeldiary.com`
5. Cloudflare will automatically configure DNS (since domain is already on Cloudflare)
6. Also add `www.scalpeldiary.com` and set it to redirect to main domain

### Step 5: Configure Environment Variables (if needed)

1. In your Pages project, go to "Settings" → "Environment variables"
2. Add any additional variables if needed (usually not required for Vite)

---

## Part 4: Database Setup & Initial Data

### Step 1: Access Railway Database

1. In Railway, click on your PostgreSQL service
2. Go to "Connect" tab
3. Copy the connection string

### Step 2: Run Migrations

Use Railway CLI:
```bash
railway link
railway run npm run migrate
```

Or create a temporary migration endpoint in your backend (remove after use):

```typescript
// Add to server/src/index.ts temporarily
app.post('/api/admin/run-migrations', async (req, res) => {
  const { secret } = req.body;
  if (secret !== 'your-temp-secret-123') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    const { migrate } = await import('./database/migrate');
    await migrate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then call it once:
```bash
curl -X POST https://your-railway-url.up.railway.app/api/admin/run-migrations \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-temp-secret-123"}'
```

### Step 3: Create Master Account

1. Go to https://scalpeldiary.com
2. The app will be empty - you need to create the master account manually
3. Use Railway CLI to run seed:

```bash
railway run npm run seed
```

Or use the database client to insert directly:

```sql
INSERT INTO users (email, password, name, role) 
VALUES (
  'master@scalpeldiary.com',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt to hash 'password123'
  'Master Admin',
  'MASTER'
);
```

---

## Part 5: Post-Deployment Configuration

### Step 1: Update CORS in Backend

Ensure your backend allows requests from your Cloudflare domain. Check `server/src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'https://scalpeldiary.com',
    'https://www.scalpeldiary.com',
    'http://localhost:5173'  // Remove in production
  ],
  credentials: true
}));
```

### Step 2: Test the Application

1. Visit https://scalpeldiary.com
2. Login with master account
3. Test key features:
   - Create accounts
   - Upload profile picture (tests S3)
   - Add procedures
   - Assign rotations

### Step 3: Monitor & Debug

**Railway Logs**:
- Go to your service → "Deployments" → Click latest deployment
- View logs in real-time

**Cloudflare Pages Logs**:
- Go to your Pages project → "Deployments"
- Click on a deployment to see build logs

**Common Issues**:
- **CORS errors**: Check backend CORS configuration
- **API not connecting**: Verify `VITE_API_URL` in frontend
- **Database errors**: Check Railway PostgreSQL is running
- **S3 upload fails**: Verify AWS credentials and bucket policy

---

## Part 6: Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Remove development URLs from CORS
- [ ] Enable HTTPS only (Cloudflare does this automatically)
- [ ] Set up Cloudflare WAF rules
- [ ] Enable Railway's built-in DDoS protection
- [ ] Regularly backup PostgreSQL database
- [ ] Set up S3 bucket versioning
- [ ] Review and limit IAM user permissions
- [ ] Set up monitoring and alerts
- [ ] Change default master password after first login

---

## Part 7: Maintenance

### Update Application

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Railway and Cloudflare will auto-deploy
```

### Database Backups

Railway provides automatic backups. To manually backup:
1. Railway dashboard → PostgreSQL service
2. "Backups" tab → "Create backup"

### Monitor Costs

- **Railway**: ~$5-20/month (depending on usage)
- **Cloudflare Pages**: Free tier (100,000 requests/month)
- **AWS S3**: ~$0.023/GB/month + transfer costs

---

## Troubleshooting

### Frontend not loading
- Check Cloudflare Pages deployment logs
- Verify build completed successfully
- Check browser console for errors

### API errors
- Check Railway logs
- Verify environment variables are set
- Test API endpoint directly: `https://your-railway-url.up.railway.app/api/health`

### Database connection issues
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running in Railway
- Review connection limits

### S3 upload failures
- Verify AWS credentials
- Check bucket CORS configuration
- Ensure bucket policy allows public read

---

## Support

For issues:
1. Check Railway logs
2. Check Cloudflare Pages deployment logs
3. Check browser console
4. Review this guide's troubleshooting section

---

## Summary of URLs

After deployment, you'll have:
- **Frontend**: https://scalpeldiary.com
- **Backend API**: https://your-app.up.railway.app/api
- **Database**: Managed by Railway (internal)
- **S3 Bucket**: https://scalpeldiary-uploads.s3.amazonaws.com

---

**Deployment Complete! 🎉**

Your ScalpelDiary application is now live and ready for use.
