# ScalpelDiary Deployment Checklist

Use this checklist to ensure smooth deployment.

## Pre-Deployment

- [ ] All code committed to GitHub
- [ ] `.env` files are in `.gitignore`
- [ ] Production environment variables prepared
- [ ] AWS account created
- [ ] Railway account created
- [ ] Cloudflare account with domain ready

## AWS S3 Setup

- [ ] S3 bucket created (`scalpeldiary-uploads`)
- [ ] Bucket CORS configured
- [ ] Bucket policy set for public read
- [ ] IAM user created
- [ ] Access keys generated and saved securely
- [ ] Test upload works

## Railway Backend

- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `JWT_SECRET` (32+ chars)
  - [ ] `DATABASE_URL` (auto-populated)
  - [ ] `AWS_REGION`
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `FRONTEND_URL=https://scalpeldiary.com`
- [ ] Root directory set to `server`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Domain generated
- [ ] Backend URL copied for frontend

## Database Setup

- [ ] Migrations run successfully
- [ ] Seed data created (master account)
- [ ] Database connection tested
- [ ] Backup configured

## Cloudflare Pages Frontend

- [ ] `client/.env.production` updated with Railway URL
- [ ] Changes committed and pushed
- [ ] Pages project created
- [ ] GitHub repository connected
- [ ] Build settings configured:
  - [ ] Build command: `cd client && npm install && npm run build`
  - [ ] Build output: `client/dist`
  - [ ] Framework: Vite
- [ ] Custom domain `scalpeldiary.com` added
- [ ] DNS configured (automatic with Cloudflare)
- [ ] `www.scalpeldiary.com` redirect set up
- [ ] SSL certificate active (automatic)

## Post-Deployment Testing

- [ ] Frontend loads at https://scalpeldiary.com
- [ ] Health check works: `https://your-railway-url.up.railway.app/health`
- [ ] Login with master account works
- [ ] Create test resident account
- [ ] Create test supervisor account
- [ ] Upload profile picture (tests S3)
- [ ] Add a procedure log
- [ ] Create a presentation
- [ ] Assign a rotation
- [ ] Check all dashboards load
- [ ] Test mobile responsiveness

## Security Verification

- [ ] JWT_SECRET is strong and unique
- [ ] Default passwords changed
- [ ] CORS only allows production domain
- [ ] HTTPS enforced (Cloudflare automatic)
- [ ] Database credentials secure
- [ ] AWS keys have minimal permissions
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internals

## Monitoring Setup

- [ ] Railway deployment logs reviewed
- [ ] Cloudflare Pages deployment successful
- [ ] Error tracking configured
- [ ] Database backup schedule confirmed
- [ ] Cost monitoring enabled

## Documentation

- [ ] README.md updated
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] Team members have access
- [ ] Credentials stored securely (password manager)
- [ ] Emergency contacts documented

## Final Steps

- [ ] Announce to team
- [ ] Train users on new system
- [ ] Monitor for first 24 hours
- [ ] Collect initial feedback
- [ ] Plan first maintenance window

---

## Emergency Rollback Plan

If something goes wrong:

1. **Frontend Issue**: 
   - Cloudflare Pages → Deployments → Rollback to previous
   
2. **Backend Issue**:
   - Railway → Deployments → Redeploy previous version
   
3. **Database Issue**:
   - Railway → PostgreSQL → Restore from backup
   
4. **Complete Failure**:
   - Revert GitHub to last working commit
   - Redeploy both frontend and backend

---

## Support Contacts

- **Railway Support**: https://railway.app/help
- **Cloudflare Support**: https://dash.cloudflare.com/support
- **AWS Support**: https://console.aws.amazon.com/support

---

**Last Updated**: [Date]
**Deployed By**: [Your Name]
**Deployment Date**: [Date]
