# Quick Start Guide 🚀

Get your Mobile Repair Shop Dashboard up and running in minutes!

---

## 🎯 Choose Your Path

### Option A: Docker (Recommended - 5 minutes)
Perfect if you have Docker installed. Everything runs in containers.

### Option B: Local Development (15 minutes)
For developers who want to run services locally.

---

## Option A: Docker Quick Start 🐳

### Prerequisites
- Docker Desktop installed
- Docker Compose installed
- 4GB RAM available

### Steps

#### 1. Clone or Download
```bash
# If using git
git clone your-repo-url
cd repair-shop-dashboard

# Or extract the ZIP file
```

#### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (optional for testing)
nano .env  # or use your favorite editor
```

#### 3. Run Setup Script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

When prompted, choose Option 1 (Docker Compose).

#### 4. Access the Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
pgAdmin:   http://localhost:5050  (dev only)
```

#### 5. Login
```
Username: admin
Password: admin123
```

**🔐 Change this immediately!**

### That's it! 🎉

---

## Option B: Local Development 💻

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis (optional, for caching)

### Steps

#### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### 2. Create Database
```bash
# Create database
createdb repair_shop_db

# Or using psql
psql postgres
CREATE DATABASE repair_shop_db;
\q
```

#### 3. Clone Project
```bash
git clone your-repo-url
cd repair-shop-dashboard
```

#### 4. Configure Environment
```bash
cp .env.example .env

# Edit database connection
nano .env

# Make sure DATABASE_URL is set:
# DATABASE_URL=postgresql://your_user:your_password@localhost:5432/repair_shop_db
```

#### 5. Run Setup Script
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Choose Option 2 (Local Development).

#### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install
npm start
```

#### 7. Access Application
```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000/api/v1
```

#### 8. Login
```
Username: admin
Password: admin123
```

---

## 🎨 First Steps After Login

### 1. Change Admin Password
1. Click on your profile (top right)
2. Go to Settings → Change Password
3. Set a strong password

### 2. Configure Shop Settings
1. Navigate to Settings
2. Update shop information:
   - Shop name
   - Address
   - Phone number
   - Email
   - Business hours

### 3. Set Up Notification Services

#### For SMS (Twilio):
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
5. Restart backend

#### For Email (SendGrid):
1. Sign up at https://sendgrid.com/
2. Create an API key
3. Add to `.env`:
   ```
   SENDGRID_API_KEY=your_api_key
   SENDGRID_FROM_EMAIL=noreply@yourshop.com
   ```
4. Restart backend

### 4. Add Devices and Pricing

#### Add Devices:
1. Go to Devices → Add New Device
2. Add your commonly repaired models:
   - iPhone 11, 12, 13, 14, 15
   - Samsung Galaxy S21, S22, S23
   - etc.

#### Set Pricing:
1. Go to Pricing → Add New Price
2. For each device, set prices for:
   - Front Screen (Original & Aftermarket)
   - Battery (Original & Aftermarket)
   - Back Glass
   - Charging Port
   - Camera
   - etc.

### 5. Add Team Members (Optional)
1. Go to Users → Add User
2. Assign roles:
   - **Admin**: Full access
   - **Manager**: Repairs + customers + reports
   - **Technician**: View/update assigned repairs
   - **Front Desk**: Create orders, customer management

### 6. Create Your First Repair Order
1. Click "➕ New Repair Order"
2. Add or select customer
3. Select device
4. Choose repairs needed
5. Select part quality (Original/Aftermarket)
6. Assign to technician
7. Create order

### 7. Test Notifications
1. Open a repair order
2. Click "Notify Customer"
3. Send test SMS or email
4. Verify customer receives it

---

## 🔧 Common Tasks

### View All Repair Orders
```
Dashboard → Repairs
Filter by status, date, customer, etc.
```

### Quick Price Lookup
```
Dashboard → "Quick Price Lookup" button
Select device and repair type
Get instant pricing
```

### Generate Smart Estimates
```
Pricing → Select device without price
Click "Generate Smart Estimate"
Review confidence score
Convert to fixed price if accurate
```

### Check Inventory
```
Inventory → View stock levels
Low stock items shown with warnings
Click "Reorder" to track orders
```

### View Reports
```
Reports → Select date range
View revenue, popular repairs, technician performance
Export as PDF, Excel, or CSV
```

---

## 🆘 Troubleshooting

### Docker Issues

#### Services won't start:
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

#### Port already in use:
```bash
# Check what's using the port
sudo lsof -i :5000  # or :3000

# Change ports in docker-compose.yml
```

#### Database won't connect:
```bash
# Check if postgres is running
docker-compose ps

# Recreate database
docker-compose down -v
docker-compose up -d
```

### Local Development Issues

#### "Cannot connect to database":
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql@14  # macOS
```

#### "Module not found":
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install
```

#### Port already in use:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

#### Database migration fails:
```bash
# Reset database
dropdb repair_shop_db
createdb repair_shop_db

# Run migrations again
cd server
npm run migrate
```

### Smart Pricing Not Working

1. Ensure you have at least 2-3 prices set for same brand
2. Devices must have `releaseDate` set
3. Check confidence score - below 40% won't show
4. Try "Generate All Missing Prices" in Pricing section

### Notifications Not Sending

1. Check `.env` has correct API keys
2. Verify customer has valid phone/email
3. Check notification logs in Notifications → History
4. Enable debug mode: `DEBUG=true` in `.env`

---

## 📱 Mobile App Access (Future)

Currently web-only, but mobile app planned for Phase 5.

### Temporary Solution:
1. Make website mobile-responsive (already done)
2. Add to home screen:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

---

## 🔐 Security Checklist

Before going live:

- [ ] Changed default admin password
- [ ] Set strong JWT_SECRET in .env
- [ ] Enabled HTTPS (use Let's Encrypt)
- [ ] Set up firewall rules
- [ ] Configured CORS_ORIGIN to your domain
- [ ] Database password is strong
- [ ] Regular backups enabled
- [ ] Rate limiting enabled
- [ ] Removed .env from git
- [ ] Set NODE_ENV=production

---

## 📚 Next Steps

1. **Read Full Documentation**
   - [Main Plan](MOBILE_REPAIR_SHOP_DASHBOARD_PLAN.md)
   - [Implementation Guide](IMPLEMENTATION_GUIDE.md)
   - [API Documentation](api_endpoints.md)
   - [UI Wireframes](UI_WIREFRAMES.md)

2. **Customize**
   - Add your logo
   - Customize colors
   - Add custom repair types
   - Configure warranty periods

3. **Integrate Lightspeed**
   - Get API credentials
   - Configure in settings
   - Test sync
   - Enable automatic sync

4. **Train Your Team**
   - Create user accounts
   - Walk through common workflows
   - Test repair order lifecycle
   - Practice notification sending

5. **Go Live!**
   - Import existing customers
   - Set up all pricing
   - Configure notifications
   - Start taking orders

---

## 💬 Support

### Documentation
- Check the main documentation files
- Review API endpoints
- See implementation guide

### Common Issues
- Check Troubleshooting section above
- Search GitHub issues (if applicable)
- Review logs: `docker-compose logs -f`

### Community (If Available)
- Discord server
- GitHub Discussions
- Stack Overflow tag

---

## 🎉 You're Ready!

Your Mobile Repair Shop Dashboard is now set up and ready to streamline your repair business!

### Quick Stats After Setup:
- ✅ Database with 15 tables
- ✅ 30+ API endpoints
- ✅ Sample devices and repair types
- ✅ Smart pricing algorithm
- ✅ Notification system
- ✅ Role-based access control

### Success Tips:
1. **Start Small**: Create a few test orders first
2. **Test Notifications**: Send test messages before going live
3. **Set Realistic Prices**: Review market rates
4. **Train Staff**: Walk through all features
5. **Backup Regularly**: Set up automated backups

---

**Happy Repairing! 🔧📱💻**

Need help? Check the full documentation or reach out to support!
