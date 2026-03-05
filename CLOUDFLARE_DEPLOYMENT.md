# Cloudflare Pages Deployment Guide

## Prerequisites
- Railway backend deployed and running
- Railway backend URL (e.g., `https://scalpeldiary-production.up.railway.app`)
- Cloudflare account with domain `scalpeldiary.com`

## Step 1: Update Frontend Configuration

The frontend environment file needs to be updated with your Railway backend URL:

```bash
# File: client/.env.production
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
```

## Step 2: Build Frontend Locally (Optional Test)

```bash
cd client
npm install
npm run build
```

This creates a `dist` folder with the production build.

## Step 3: Deploy to Cloudflare Pages

### Option A: Using Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Choose **Connect to Git**
5. Select your GitHub repository: `Josiah-AG/scalpeldiary`
6. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `cd client && npm install && npm run build`
   - **Build output directory**: `client/dist`
   - **Root directory**: `/` (leave empty or set to root)
7. Add environment variable:
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://YOUR-RAILWAY-URL.up.railway.app/api`
8. Click **Save and Deploy**

### Option B: Using Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from client directory
cd client
npm run build
wrangler pages deploy dist --project-name=scalpeldiary
```

## Step 4: Configure Custom Domain

1. In Cloudflare Pages project settings
2. Go to **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `scalpeldiary.com`
5. Cloudflare will automatically configure DNS records
6. Optionally add `www.scalpeldiary.com` as well

## Step 5: Verify Deployment

1. Visit `https://scalpeldiary.com`
2. Try logging in with master account:
   - Email: `master@scalpeldiary.com`
   - Password: `password123`
3. Check browser console for any API connection errors

## Step 6: Run Database Migrations

After frontend is deployed, run migrations on Railway:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:migrate

# Optionally seed the database
railway run npm run db:seed
```

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure Railway backend has correct CORS configuration in `server/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://scalpeldiary.com', 'https://www.scalpeldiary.com'],
  credentials: true
}));
```

### API Connection Failed
- Verify `VITE_API_URL` in Cloudflare Pages environment variables
- Check Railway backend is running and accessible
- Verify Railway URL is correct (with `/api` suffix)

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review build logs in Cloudflare Pages dashboard

## Post-Deployment Checklist

- [ ] Backend deployed on Railway
- [ ] Database migrations completed
- [ ] Frontend deployed on Cloudflare Pages
- [ ] Custom domain configured
- [ ] SSL certificate active (automatic with Cloudflare)
- [ ] Master account login works
- [ ] Test creating a resident account
- [ ] Test adding a surgical log
- [ ] Verify AWS S3 profile picture uploads work

## Next Steps

1. Change default passwords for all accounts
2. Set up monitoring and alerts
3. Configure backup strategy for PostgreSQL database
4. Review and update environment variables for production
5. Set up CI/CD for automatic deployments
