# Quick Deployment Guide

**Time Required**: ~30-45 minutes

## Step-by-Step Deployment

### 1. Prepare Your Code (5 minutes)

```bash
# Run preparation script
bash scripts/prepare-deployment.sh

# Or on Windows
scripts\prepare-deployment.bat

# Commit everything
git add .
git commit -m "Ready for deployment"
```

### 2. AWS S3 Setup (10 minutes)

1. Create bucket: `scalpeldiary-uploads`
2. Uncheck "Block all public access"
3. Add CORS policy (see DEPLOYMENT_GUIDE.md)
4. Create IAM user with S3 access
5. Generate and save access keys
6. Add bucket policy for public read

**Save these for later**:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET name

### 3. Deploy Backend to Railway (10 minutes)

1. Push code to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Configure service:
   - Root directory: `server`
   - Build: `npm install && npm run build`
   - Start: `npm run start`
5. Add environment variables (see list below)
6. Generate domain
7. **Copy Railway URL** (e.g., `your-app.up.railway.app`)

**Environment Variables for Railway**:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=[generate 32+ random characters]
DATABASE_URL=${{Postgres.DATABASE_URL}}
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[from AWS]
AWS_SECRET_ACCESS_KEY=[from AWS]
AWS_S3_BUCKET=scalpeldiary-uploads
FRONTEND_URL=https://scalpeldiary.com
```

### 4. Update Frontend Config (2 minutes)

```bash
# Edit client/.env.production
VITE_API_URL=https://your-railway-url.up.railway.app/api

# Commit
git add client/.env.production
git commit -m "Update production API URL"
git push
```

### 5. Deploy Frontend to Cloudflare (10 minutes)

1. Go to Cloudflare → Workers & Pages → Create
2. Connect to GitHub repository
3. Configure:
   - Framework: Vite
   - Build command: `cd client && npm install && npm run build`
   - Build output: `client/dist`
4. Deploy
5. Add custom domain: `scalpeldiary.com`
6. Add `www.scalpeldiary.com` (redirect to main)

### 6. Initialize Database (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# Run migrations
railway run npm run migrate

# Create master account
railway run npm run seed
```

### 7. Test Everything (5 minutes)

1. Visit https://scalpeldiary.com
2. Login: `master@scalpeldiary.com` / `password123`
3. Create a test account
4. Upload profile picture
5. Add a procedure
6. Check all pages load

---

## Troubleshooting

### Frontend won't load
- Check Cloudflare Pages deployment logs
- Verify build completed
- Check `client/.env.production` has correct API URL

### API errors
- Check Railway logs
- Verify all environment variables are set
- Test health endpoint: `https://your-railway-url.up.railway.app/health`

### Database errors
- Ensure migrations ran successfully
- Check PostgreSQL is running in Railway
- Verify DATABASE_URL is set

### S3 upload fails
- Check AWS credentials in Railway
- Verify bucket CORS configuration
- Ensure bucket policy allows public read

---

## Post-Deployment

1. **Change master password** immediately
2. **Remove test accounts** if any
3. **Set up monitoring** in Railway
4. **Enable Cloudflare WAF** for security
5. **Configure database backups** in Railway

---

## Cost Estimate

- **Railway**: $5-20/month (backend + database)
- **Cloudflare Pages**: Free (up to 100k requests/month)
- **AWS S3**: ~$1-5/month (depending on usage)

**Total**: ~$6-25/month

---

## Need Help?

1. Check DEPLOYMENT_GUIDE.md for detailed instructions
2. Review DEPLOYMENT_CHECKLIST.md
3. Check Railway logs for backend issues
4. Check Cloudflare Pages logs for frontend issues
5. Check browser console for client-side errors

---

## Success Checklist

- [ ] Frontend loads at https://scalpeldiary.com
- [ ] Can login with master account
- [ ] Can create new accounts
- [ ] Profile pictures upload successfully
- [ ] Can add procedures
- [ ] Can create presentations
- [ ] All dashboards work
- [ ] Mobile view works

**Congratulations! Your app is live! 🎉**
