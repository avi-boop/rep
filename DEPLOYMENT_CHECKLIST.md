# 🚀 Coolify Deployment Checklist

## 🔒 SECURITY FIRST - READ BEFORE DEPLOYING

**⚠️ CRITICAL**: Before proceeding, ensure you've secured all credentials:

1. **Read Security Documentation**: `/docs/SECURITY_CREDENTIALS.md`
2. **Rotate All API Keys**: Gemini, Lightspeed, Supabase passwords
3. **Never Commit Secrets**: Verify `.env` files are in `.gitignore`
4. **Create Secure Admin**: Use `scripts/create-secure-admin.js`

---

## Quick Deployment Steps

### 1. Generate Secrets First
```bash
# Generate JWT_SECRET
openssl rand -hex 64

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 64

# Generate NEXTAUTH_SECRET
openssl rand -hex 64

# Save these securely - you'll need them in step 7
```

---

### 2. Create Application in Coolify

1. Open Coolify dashboard
2. Click **"New Resource"** → **"Application"**
3. Select **"Public Repository"**
4. Enter repository: `https://github.com/avi-boop/rep`
5. Branch: `main`
6. Base Directory: `/dashboard`
7. Build Pack: **Dockerfile**
8. Application Name: `mobile-repair-dashboard`

---

### 3. Add PostgreSQL Database

1. In Coolify, go to **"Databases"**
2. Click **"Add Database"**
3. Select **"PostgreSQL 15"**
4. Configuration:
   - Name: `mobile-repair-db`
   - Database: `mobile_repair_db`
   - Username: `repair_admin`
   - Password: *Let Coolify generate or set custom*
5. Click **"Create"**
6. **Save the connection string** shown

---

### 4. Add Redis Service

1. In Coolify, go to **"Services"**
2. Click **"Add Service"**
3. Select **"Redis 7"**
4. Configuration:
   - Name: `repair-redis`
   - Persistence: **Enable** (appendonly)
5. Click **"Create"**
6. **Save the connection string** shown

---

### 5. Link Services to Application

1. Go to your application → **"Services"**
2. Click **"Link Service"**
3. Select `mobile-repair-db` (PostgreSQL)
4. Click **"Link Service"** again
5. Select `repair-redis`

---

### 6. Configure Environment Variables

Go to Application → **"Environment Variables"** and add:

#### Required Variables
```bash
# Database (from step 3)
DATABASE_URL=postgresql://repair_admin:[PASSWORD]@mobile-repair-db:5432/mobile_repair_db

# Redis (from step 4)
REDIS_URL=redis://repair-redis:6379

# Authentication (from step 1 - the secrets you generated)
JWT_SECRET=[YOUR_64_CHAR_HEX_FROM_STEP_1]
REFRESH_TOKEN_SECRET=[YOUR_64_CHAR_HEX_FROM_STEP_1]
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

#### Optional Integration Variables
```bash
# Only add if you have these services
LIGHTSPEED_API_KEY=
LIGHTSPEED_ACCOUNT_ID=
GEMINI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
SENDGRID_API_KEY=
```

---

### 7. Deploy Application

1. Click **"Deploy"** button
2. Wait for build to complete (5-10 minutes)
3. Monitor build logs for errors
4. Wait for health check to pass ✅

---

### 8. Run Database Migrations

After deployment succeeds:

1. Go to Application → **"Console"** or **"Terminal"**
2. Run:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with initial data
npx prisma db seed
```

---

### 9. Verify Deployment

#### Test Health Check
```bash
curl https://[your-app-url]/api/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T...",
  "services": {
    "database": "connected",
    "api": "healthy"
  }
}
```

#### Test Pricing API
```bash
curl https://[your-app-url]/api/pricing?page=1&pageSize=10
```

Should return paginated pricing data with validation.

#### Test Authentication
```bash
# Try to login (will fail without user, but should return proper error)
curl -X POST https://[your-app-url]/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

Expected: `401` with proper error message (not crash).

#### Test Rate Limiting
```bash
# Try 6 failed logins rapidly
for i in {1..6}; do
  curl -X POST https://[your-app-url]/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\nAttempt $i"
  sleep 1
done
```

6th attempt should return: `429 Too Many Requests`

---

### 10. Access Dashboard

Open browser and go to:
```
https://[your-app-url]/dashboard
```

You should see the secured dashboard interface.

---

## Troubleshooting

### Build Fails

**Check**: Build logs in Coolify
**Common issues**:
- Missing `package-lock.json` - Run `npm install` locally and commit
- Prisma generate fails - Ensure DATABASE_URL is set during build
- Node version mismatch - Dockerfile uses Node 18

### Health Check Fails

**Check**: Runtime logs in Coolify
**Common issues**:
- Database connection - Verify DATABASE_URL
- Port mismatch - Should be 3000
- Prisma client not generated - Run `npx prisma generate`

### Can't Login

**Check**: 
1. Do you have users in the database?
2. Is JWT_SECRET set correctly?
3. Check browser cookies - should see `accessToken` and `refreshToken`

**Create first user**:
```bash
# In Coolify console
npx prisma studio
# Or via SQL
```

### Rate Limiting Not Working

**Check**:
- Redis connection - Should see in logs
- Try authentication endpoint multiple times
- Check REDIS_URL environment variable

---

## Post-Deployment Tasks

### Security (CRITICAL - Do First!)
- [ ] **Create secure admin user**: Run `node scripts/create-secure-admin.js`
- [ ] **Rotate all API keys**: Follow `/docs/SECURITY_CREDENTIALS.md`
- [ ] **Change default passwords**: Admin, database, services
- [ ] **Verify .env not in git**: Check `git status` - should not show `.env` files
- [ ] **Test admin login**: Verify strong password works
- [ ] Enable HTTPS (Coolify does automatically)
- [ ] Configure custom domain
- [ ] Setup SSL certificate (Coolify auto via Let's Encrypt)
- [ ] Review firewall rules
- [ ] **Setup password manager**: Store all credentials securely
- [ ] **Remove exposed secrets from git history**: If any were committed

### Monitoring
- [ ] Setup uptime monitoring (UptimeRobot, etc.)
- [ ] Configure error tracking (Sentry)
- [ ] Setup log aggregation
- [ ] Database backup schedule

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure database connection pooling
- [ ] Setup Redis caching for sessions
- [ ] Monitor resource usage

---

## Quick Reference

### Coolify URLs
- **Dashboard**: Your Coolify instance URL
- **Application**: `https://[app-name].[coolify-domain]`
- **Health**: `https://[app-name].[coolify-domain]/api/health`

### Important Endpoints
```
GET  /api/health           - Health check
POST /api/auth/login       - Login with httpOnly cookies
POST /api/auth/logout      - Logout
GET  /api/auth/me          - Get current user
POST /api/auth/refresh     - Refresh token
GET  /api/pricing          - Get pricing (validated, paginated)
POST /api/pricing          - Create pricing (validated)
PUT  /api/pricing          - Update pricing (validated)
GET  /api/repairs          - Get repairs (validated, paginated)
POST /api/repairs          - Create repair (validated)
```

### Environment Variable Template

Copy this template for environment variables:

```env
# Database
DATABASE_URL=postgresql://repair_admin:[DB_PASSWORD]@mobile-repair-db:5432/mobile_repair_db

# Redis
REDIS_URL=redis://repair-redis:6379

# Authentication
JWT_SECRET=[GENERATE_WITH: openssl rand -hex 64]
REFRESH_TOKEN_SECRET=[GENERATE_WITH: openssl rand -hex 64]
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=0.0.0.0
```

---

## Success Criteria

Your deployment is successful when:

- ✅ Health check returns `200` with `"status": "ok"`
- ✅ Dashboard loads at `/dashboard`
- ✅ API endpoints return proper JSON responses
- ✅ Authentication cookies are set (httpOnly)
- ✅ Rate limiting blocks after 5 attempts
- ✅ Validation errors return proper `400` responses
- ✅ Database queries work (check pricing API)
- ✅ No errors in runtime logs

---

## Rollback

If deployment fails:

1. Go to Coolify → Application → **Deployments**
2. Find last working deployment
3. Click **"Redeploy"**

Or via Git:
```bash
git revert HEAD
git push origin main
```

---

## Support

**Documentation**:
- `/COOLIFY_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `/docs/SECURITY_CREDENTIALS.md` - Security & credential management
- `/SECURITY_FIXES_COMPLETED_FINAL.md` - Security fixes applied
- `/ARCHITECTURE_STATUS.md` - System architecture

**Scripts**:
- `scripts/create-secure-admin.js` - Generate secure admin credentials

**Need help?** Check Coolify logs:
- Build logs - for deployment issues
- Runtime logs - for application errors
- Database logs - for connection issues

---

**Deployment Time**: 10-15 minutes  
**Difficulty**: Easy (if following checklist)  
**Status**: Ready to deploy ✅
