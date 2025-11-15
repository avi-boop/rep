# 🚀 Deploy Mobile Repair Dashboard with Coolify MCP

**Automated deployment using Coolify MCP Server's 35 tools**

---

## 🎯 What This Does

Deploy your Mobile Repair Dashboard to Coolify using the MCP Server's automated tools:
- ✅ **No manual configuration needed**
- ✅ **Automatic environment setup**
- ✅ **Batch operations** (10x faster)
- ✅ **Preview + Production environments**
- ✅ **One-command deployment**

---

## 📋 Prerequisites

You already have:
- ✅ Coolify running at: https://coolify.theprofitplatform.com.au
- ✅ Coolify MCP Server documentation (copied to this folder)
- ✅ Mobile Repair Dashboard (this project)
- ✅ GitHub repository: https://github.com/avi-boop/rep

---

## 🚀 Setup (5 minutes)

### Step 1: Get Coolify API Token

1. Open: https://coolify.theprofitplatform.com.au
2. Go to: **Settings** → **Security** → **API Tokens**
3. Click **"Create New Token"**
4. Settings:
   - Name: `mobile-repair-mcp`
   - Permissions: ☑️ read, ☑️ write, ☑️ deploy
5. **Copy the token** (save it!)

### Step 2: Configure MCP Environment

```bash
cd /home/avi/projects/mobile

# Create MCP config
cat > .coolify-mcp.env << 'EOF'
COOLIFY_BASE_URL=https://coolify.theprofitplatform.com.au
COOLIFY_TOKEN=your-api-token-here
PROJECT_NAME=mobile-repair-dashboard
GITHUB_REPO=https://github.com/avi-boop/rep.git
EOF

# Replace with your actual token
nano .coolify-mcp.env
```

### Step 3: Generate Secrets

```bash
# Generate secure secrets for deployment
./scripts/generate-secrets.sh > .deployment-secrets.txt

# View them
cat .deployment-secrets.txt
```

---

## 🎬 Deploy Using MCP (Automated!)

### Option 1: Use MCP with Claude Desktop

**On your local machine:**

1. **Configure Claude Desktop** (see `QUICK-REFERENCE.md` in this folder)

2. **In Claude Desktop, say:**

```
"Using Coolify MCP, create two applications for my mobile repair dashboard:

1. Preview Application:
   - Name: mobile-repair-preview
   - Repository: https://github.com/avi-boop/rep.git
   - Branch: dev
   - Dockerfile: Dockerfile.production
   - Base Directory: dashboard
   - Port: 3000
   - Domain: dev.theprofitplatform.com.au
   - Environment Variables:
     * DATABASE_URL=postgresql://user:pass@host:5432/mobile_repair_dev
     * JWT_SECRET=[from .deployment-secrets.txt DEV section]
     * NEXTAUTH_SECRET=[from .deployment-secrets.txt DEV section]
     * NEXTAUTH_URL=https://dev.theprofitplatform.com.au
     * NODE_ENV=production
     * PORT=3000
     * HOSTNAME=0.0.0.0
     * NEXT_TELEMETRY_DISABLED=1

2. Production Application:
   - Name: mobile-repair-production
   - Repository: https://github.com/avi-boop/rep.git
   - Branch: main
   - Dockerfile: Dockerfile.production
   - Base Directory: dashboard
   - Port: 3000
   - Domain: theprofitplatform.com.au
   - Environment Variables:
     * DATABASE_URL=postgresql://user:pass@host:5432/mobile_repair_prod
     * JWT_SECRET=[from .deployment-secrets.txt PRODUCTION section]
     * NEXTAUTH_SECRET=[from .deployment-secrets.txt PRODUCTION section]
     * NEXTAUTH_URL=https://theprofitplatform.com.au
     * NODE_ENV=production
     * PORT=3000
     * HOSTNAME=0.0.0.0
     * NEXT_TELEMETRY_DISABLED=1

Then deploy both applications."
```

**Claude will use MCP tools to:**
- ✅ Create both applications
- ✅ Configure all settings
- ✅ Set environment variables
- ✅ Start deployments
- ✅ Report status

### Option 2: Use Interactive Deployment Script

```bash
cd /home/avi/projects/mobile
./scripts/deploy-with-mcp.sh
```

**The script will:**
1. Check MCP server connection
2. Create project in Coolify
3. Create preview environment
4. Create production environment
5. Deploy both
6. Setup webhooks for GitHub
7. Run database migrations

---

## 📊 MCP Tools Used

### For This Deployment:

1. **`create_project`** - Create "mobile-repair-dashboard" project
2. **`create_environment`** - Create "preview" and "production" environments
3. **`create_application`** - Create both apps
4. **`batch_update_env_vars`** - Set all environment variables at once (10x faster!)
5. **`restart_application`** - Deploy applications
6. **`get_application_logs`** - Check deployment logs

---

## 🎯 After Deployment

### Check Status

**In Claude Desktop:**
```
"List all my applications and show their status"
```

### View Logs

```
"Show me the deployment logs for mobile-repair-preview"
```

### Restart Applications

```
"Restart applications: mobile-repair-preview, mobile-repair-production"
```
(Uses batch operation - completes in 3 seconds!)

### Update Environment Variables

```
"Update the API_KEY environment variable to 'new-value' across
mobile-repair-preview and mobile-repair-production, then restart both"
```
(Automated with `batch_update_env_vars`)

---

## 🔄 Daily Workflow with MCP

### Deploy New Changes

**Push to dev branch:**
```bash
git checkout dev
git push origin dev
```

**In Claude Desktop:**
```
"Restart the mobile-repair-preview application to deploy latest changes"
```

### Deploy to Production

**When tested:**
```bash
./scripts/deploy-production.sh
```

**Or in Claude Desktop:**
```
"Restart mobile-repair-production to deploy latest main branch"
```

### Check Health

```
"Check resource usage for all my mobile repair applications"
```

### Batch Operations (10x Faster!)

**Morning startup:**
```
"Start all my mobile repair services and applications"
```

**Evening shutdown:**
```
"Stop mobile-repair-preview to save resources"
```

**API key rotation:**
```
"Update TWILIO_AUTH_TOKEN across all mobile repair apps and restart them"
```

---

## 🗄️ Database Setup

**After first deployment:**

```
"Run these commands in mobile-repair-production:
  cd /app/dashboard
  npx prisma migrate deploy
  npx prisma db seed"
```

Or manually in Coolify:
1. Go to application → Terminal
2. Run migration commands

---

## 📈 Benefits of MCP Deployment

| Feature | Manual | With MCP |
|---------|--------|----------|
| Setup time | 30 min | 5 min |
| Application creation | Click through UI | One command |
| Env var updates | One by one | Batch (instant) |
| Restart apps | 30 seconds | 3 seconds |
| Monitoring | Check dashboard | Ask Claude |
| Logs | Navigate UI | "Show me logs" |

---

## 🎓 MCP Commands Cheat Sheet

### Deployment:
```
"Deploy mobile-repair-preview"
"Restart mobile-repair-production"
"Stop mobile-repair-preview"
```

### Monitoring:
```
"Show status of all my applications"
"Check logs for mobile-repair-production"
"Get resource usage for my servers"
```

### Batch Operations:
```
"Restart all mobile repair applications"
"Update DATABASE_URL across all apps"
"Stop all preview environments"
```

### Management:
```
"List all my Coolify projects"
"Show all deployments for mobile-repair-production"
"Check health of Coolify"
```

---

## 🔧 Troubleshooting

### MCP Not Connected

**Check:**
```bash
# On VPS where Coolify runs
cd /home/avi/projects/coolify/coolify-mcp
pm2 status coolify-mcp
```

**Fix:**
```bash
pm2 restart coolify-mcp
```

### Deployment Failed

**In Claude Desktop:**
```
"Show me the deployment logs for mobile-repair-preview"
```

Look for errors and fix.

### Environment Variable Issues

**Update via MCP:**
```
"Update these environment variables for mobile-repair-preview:
  DATABASE_URL=new-value
  JWT_SECRET=new-secret
Then restart the application"
```

---

## 📚 Full Documentation

Coolify MCP files in this directory:
- `README.md` - MCP Server overview
- `SETUP-GUIDE.md` - Detailed setup
- `USAGE-GUIDE.md` - Complete usage guide
- `QUICK-REFERENCE.md` - Quick commands
- `LOCAL-SETUP-GUIDE.md` - Local setup
- `CLAUDE-DESKTOP-CONFIG.md` - Claude config

---

## ✨ Next Steps

1. **Get API token** from Coolify
2. **Configure Claude Desktop** with MCP
3. **Ask Claude to deploy** using the command above
4. **Watch it happen automatically!**
5. **Use MCP for daily management**

---

## 🎊 Summary

**What you get:**
- ✅ Automated deployment via MCP
- ✅ Preview + Production environments
- ✅ Batch operations (10x faster)
- ✅ Natural language control via Claude
- ✅ Instant monitoring and logs
- ✅ One-command updates

**Time saved:**
- Manual: 30 minutes per deployment
- With MCP: 3 minutes per deployment
- **90% time savings!**

---

**Ready to deploy?**

1. Follow Step 1-3 above (5 min)
2. Configure Claude Desktop (2 min)
3. Ask Claude to deploy (1 min)
4. Your app is live! 🎉

---

*Generated: 2025-11-15*
*For: Mobile Repair Dashboard*
*Platform: Coolify with MCP*
