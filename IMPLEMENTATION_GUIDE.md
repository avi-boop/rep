# Implementation Guide - Mobile Repair Shop Dashboard

## Quick Start Guide

This guide will help you get started with implementing the mobile repair shop dashboard.

---

## Technology Stack Comparison

### Option 1: MERN Stack (Recommended for JavaScript developers)
**MongoDB/PostgreSQL + Express + React + Node.js**

**Pros:**
- Single language (JavaScript) for full stack
- Large ecosystem and community
- Easy to find developers
- Fast development
- Great for real-time features

**Cons:**
- May require more setup for complex queries (if using MongoDB)

**Tech Details:**
- Frontend: React.js with Material-UI or Tailwind CSS
- Backend: Node.js with Express.js
- Database: PostgreSQL (recommended) or MongoDB
- ORM: Prisma or Sequelize
- Real-time: Socket.io

**Estimated Development Time:** 4-6 months

---

### Option 2: Python Stack (Recommended for data-heavy applications)
**PostgreSQL + FastAPI/Django + React**

**Pros:**
- Excellent for smart pricing algorithms (Python ML libraries)
- FastAPI is very fast and modern
- Django has built-in admin panel
- Strong typing with type hints

**Cons:**
- Need to know both Python and JavaScript
- Slightly smaller ecosystem for real-time features

**Tech Details:**
- Frontend: React.js with Tailwind CSS
- Backend: FastAPI or Django REST Framework
- Database: PostgreSQL
- ORM: SQLAlchemy (FastAPI) or Django ORM
- Real-time: FastAPI WebSockets or Django Channels

**Estimated Development Time:** 4-6 months

---

### Option 3: Low-Code Solution (Fastest to Market)
**Supabase + Next.js or Bubble.io**

**Pros:**
- Fastest development time (2-3 months)
- Built-in authentication, database, and storage
- Automatic API generation
- Real-time subscriptions out of the box

**Cons:**
- Less flexibility for complex features
- Vendor lock-in
- May have scaling limitations

**Tech Details:**
- Backend: Supabase (PostgreSQL + Auth + Storage + Real-time)
- Frontend: Next.js with React
- ORM: Supabase client
- Authentication: Built-in

**Estimated Development Time:** 2-3 months

---

## Recommended Setup (MERN Stack)

### Prerequisites
```bash
- Node.js v18+ and npm/yarn
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)
```

### Project Structure
```
repair-shop-dashboard/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   ├── store/         # Redux store
│   │   ├── utils/         # Helper functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── styles/        # CSS/Tailwind
│   │   └── App.js
│   ├── package.json
│   └── README.md
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helpers
│   │   ├── config/        # Configuration
│   │   └── server.js      # Entry point
│   ├── tests/             # Unit & integration tests
│   ├── package.json
│   └── README.md
├── database/
│   ├── migrations/        # DB migrations
│   ├── seeds/             # Seed data
│   └── schema.sql         # Database schema
├── docs/                  # Documentation
├── .gitignore
├── docker-compose.yml     # Docker setup
└── README.md
```

---

## Step-by-Step Implementation

### Phase 1: Setup & Foundation (Week 1-2)

#### 1. Initialize Projects
```bash
# Create project directory
mkdir repair-shop-dashboard
cd repair-shop-dashboard

# Backend setup
mkdir server && cd server
npm init -y
npm install express pg cors dotenv bcrypt jsonwebtoken
npm install --save-dev nodemon

# Frontend setup
cd ..
npx create-react-app client
cd client
npm install @mui/material @emotion/react @emotion/styled
npm install axios react-router-dom redux @reduxjs/toolkit
npm install recharts date-fns
```

#### 2. Database Setup
```bash
# Create PostgreSQL database
createdb repair_shop_db

# Run schema
psql repair_shop_db < database/schema.sql
```

#### 3. Environment Variables
Create `.env` files:

**server/.env**
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/repair_shop_db
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourshop.com

# Lightspeed (for later)
LIGHTSPEED_API_KEY=
LIGHTSPEED_ACCOUNT_ID=
```

**client/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_WS_URL=ws://localhost:5000
```

#### 4. Basic Server Setup

**server/src/server.js**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/repair-orders', require('./routes/repairOrders'));
app.use('/api/v1/customers', require('./routes/customers'));
app.use('/api/v1/pricing', require('./routes/pricing'));
// ... more routes

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Phase 2: Core Features (Week 3-6)

#### Week 3: Authentication & User Management
- [ ] User model and database
- [ ] Registration endpoint
- [ ] Login endpoint with JWT
- [ ] Password hashing with bcrypt
- [ ] JWT middleware for protected routes
- [ ] Role-based access control
- [ ] Frontend login/register pages

#### Week 4: Repair Orders
- [ ] Repair order model
- [ ] CRUD endpoints for repair orders
- [ ] Auto-generate order numbers
- [ ] Status management
- [ ] Order listing with filters
- [ ] Frontend repair order pages
- [ ] Order form with validation

#### Week 5: Customers & Devices
- [ ] Customer model and endpoints
- [ ] Device model and endpoints
- [ ] Customer search functionality
- [ ] Device selection UI
- [ ] Repair history per customer

#### Week 6: Pricing Management
- [ ] Pricing model and endpoints
- [ ] Price lookup functionality
- [ ] Pricing management UI
- [ ] Bulk price operations

---

### Phase 3: Advanced Features (Week 7-10)

#### Week 7: Smart Pricing
- [ ] Implement price estimation algorithm
- [ ] Confidence scoring
- [ ] Price suggestion UI
- [ ] Convert estimates to fixed prices

#### Week 8: Inventory
- [ ] Inventory model
- [ ] Stock tracking
- [ ] Low stock alerts
- [ ] Inventory adjustment endpoints
- [ ] Reorder functionality

#### Week 9: Notifications
- [ ] Notification templates
- [ ] Twilio SMS integration
- [ ] SendGrid email integration
- [ ] Auto-trigger notifications
- [ ] Notification history

#### Week 10: Dashboard & Reports
- [ ] Dashboard metrics
- [ ] Charts and graphs
- [ ] Revenue reports
- [ ] Export functionality

---

### Phase 4: Integration & Polish (Week 11-16)

#### Week 11-12: Lightspeed Integration
- [ ] Lightspeed API client
- [ ] Customer sync
- [ ] Webhook handlers
- [ ] Conflict resolution
- [ ] Sync status UI

#### Week 13-14: Additional Features
- [ ] Before/after photos
- [ ] Warranty tracking
- [ ] Customer feedback
- [ ] QR code generation

#### Week 15-16: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

---

## Code Samples

### 1. Database Connection (server/src/config/database.js)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Database connected');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### 2. Authentication Middleware (server/src/middleware/auth.js)
```javascript
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authorized' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized for this action' }
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
```

### 3. Smart Pricing Algorithm (server/src/services/smartPricing.js)
```javascript
const db = require('../config/database');

class SmartPricingService {
  async estimatePrice(deviceId, repairTypeId, partQuality) {
    // Get device details
    const deviceQuery = await db.query(
      'SELECT * FROM devices WHERE id = $1',
      [deviceId]
    );
    
    if (deviceQuery.rows.length === 0) {
      throw new Error('Device not found');
    }
    
    const device = deviceQuery.rows[0];
    
    // Get all prices for same brand, repair type, and part quality
    const pricesQuery = await db.query(`
      SELECT p.*, d.model, d.model_year, d.release_date
      FROM pricing p
      JOIN devices d ON p.device_id = d.id
      WHERE d.brand = $1 
        AND p.repair_type_id = $2 
        AND p.part_quality = $3
        AND p.is_active = true
        AND p.is_estimated = false
      ORDER BY d.release_date
    `, [device.brand, repairTypeId, partQuality]);
    
    if (pricesQuery.rows.length === 0) {
      return { price: null, confidence: 0, based_on: [] };
    }
    
    const prices = pricesQuery.rows;
    
    // Find nearest models
    const beforeModel = this.findNearestBefore(device, prices);
    const afterModel = this.findNearestAfter(device, prices);
    
    let estimatedPrice;
    let confidence;
    let basedOn = [];
    
    if (beforeModel && afterModel) {
      // Linear interpolation
      estimatedPrice = this.interpolate(beforeModel, afterModel, device);
      confidence = 85;
      basedOn = [
        { device: beforeModel.model, price: beforeModel.selling_price },
        { device: afterModel.model, price: afterModel.selling_price }
      ];
    } else if (beforeModel || afterModel) {
      // Use single reference with adjustment
      const reference = beforeModel || afterModel;
      const yearDiff = Math.abs(device.model_year - reference.model_year);
      const adjustmentFactor = 1 + (yearDiff * 0.05); // 5% per year
      
      estimatedPrice = beforeModel 
        ? reference.selling_price * adjustmentFactor
        : reference.selling_price / adjustmentFactor;
      
      confidence = 60;
      basedOn = [{ device: reference.model, price: reference.selling_price }];
    } else {
      // Use average
      const avgPrice = prices.reduce((sum, p) => sum + parseFloat(p.selling_price), 0) / prices.length;
      estimatedPrice = avgPrice;
      confidence = 40;
      basedOn = [{ device: 'Average', price: avgPrice }];
    }
    
    return {
      price: Math.round(estimatedPrice * 100) / 100,
      confidence,
      based_on: basedOn
    };
  }
  
  findNearestBefore(device, prices) {
    return prices
      .filter(p => new Date(p.release_date) < new Date(device.release_date))
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))[0];
  }
  
  findNearestAfter(device, prices) {
    return prices
      .filter(p => new Date(p.release_date) > new Date(device.release_date))
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))[0];
  }
  
  interpolate(before, after, device) {
    const beforeDate = new Date(before.release_date).getTime();
    const afterDate = new Date(after.release_date).getTime();
    const deviceDate = new Date(device.release_date).getTime();
    
    const ratio = (deviceDate - beforeDate) / (afterDate - beforeDate);
    
    const beforePrice = parseFloat(before.selling_price);
    const afterPrice = parseFloat(after.selling_price);
    
    return beforePrice + (afterPrice - beforePrice) * ratio;
  }
}

module.exports = new SmartPricingService();
```

### 4. Notification Service (server/src/services/notification.js)
```javascript
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const db = require('../config/database');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class NotificationService {
  async sendNotification(repairOrderId, templateId, notificationType = 'sms') {
    // Get repair order details
    const orderQuery = await db.query(`
      SELECT ro.*, c.first_name, c.last_name, c.phone, c.email,
             d.brand || ' ' || d.model as device_name
      FROM repair_orders ro
      JOIN customers c ON ro.customer_id = c.id
      JOIN devices d ON ro.device_id = d.id
      WHERE ro.id = $1
    `, [repairOrderId]);
    
    if (orderQuery.rows.length === 0) {
      throw new Error('Repair order not found');
    }
    
    const order = orderQuery.rows[0];
    
    // Get template
    const templateQuery = await db.query(
      'SELECT * FROM notification_templates WHERE id = $1',
      [templateId]
    );
    
    if (templateQuery.rows.length === 0) {
      throw new Error('Template not found');
    }
    
    const template = templateQuery.rows[0];
    
    // Replace placeholders
    const message = this.replacePlaceholders(template.message_content, {
      customer_name: order.first_name,
      order_number: order.order_number,
      device_model: order.device_name,
      repair_type: 'Screen Repair', // Get from items
      total_price: order.final_amount,
      expected_date: order.expected_completion_date
    });
    
    let result;
    
    try {
      if (notificationType === 'sms') {
        result = await this.sendSMS(order.phone, message);
      } else if (notificationType === 'email') {
        result = await this.sendEmail(order.email, template.name, message);
      }
      
      // Log notification
      await db.query(`
        INSERT INTO notifications_log 
        (repair_order_id, customer_id, template_id, notification_type, 
         recipient, message_content, status, sent_at, external_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
      `, [
        repairOrderId,
        order.customer_id,
        templateId,
        notificationType,
        notificationType === 'sms' ? order.phone : order.email,
        message,
        'sent',
        result.sid || result.messageId
      ]);
      
      return { success: true, message: 'Notification sent' };
    } catch (error) {
      // Log failure
      await db.query(`
        INSERT INTO notifications_log 
        (repair_order_id, customer_id, template_id, notification_type, 
         recipient, message_content, status, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        repairOrderId,
        order.customer_id,
        templateId,
        notificationType,
        notificationType === 'sms' ? order.phone : order.email,
        message,
        'failed',
        error.message
      ]);
      
      throw error;
    }
  }
  
  async sendSMS(to, message) {
    return await twilioClient.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
  }
  
  async sendEmail(to, subject, message) {
    return await sgMail.send({
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    });
  }
  
  replacePlaceholders(template, data) {
    let result = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), data[key]);
    });
    return result;
  }
}

module.exports = new NotificationService();
```

---

## Deployment Guide

### Option 1: Traditional VPS (DigitalOcean, Linode)

**Cost: ~$20-50/month**

```bash
# 1. Set up server
ssh root@your-server-ip

# 2. Install Node.js, PostgreSQL, Nginx
apt update
apt install nodejs npm postgresql nginx

# 3. Clone repository
git clone your-repo-url
cd repair-shop-dashboard

# 4. Set up database
sudo -u postgres createdb repair_shop_db
psql repair_shop_db < database/schema.sql

# 5. Install dependencies
cd server && npm install
cd ../client && npm install && npm run build

# 6. Configure Nginx (reverse proxy)
# Edit /etc/nginx/sites-available/default

# 7. Set up PM2 for process management
npm install -g pm2
pm2 start server/src/server.js
pm2 startup
pm2 save

# 8. Set up SSL with Let's Encrypt
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### Option 2: Docker Deployment

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: repair_shop_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: yourpassword
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://admin:yourpassword@postgres:5432/repair_shop_db
      JWT_SECRET: your_secret
    depends_on:
      - postgres

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres-data:
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

**Easiest for beginners**

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy with one click
4. Auto-scaling included

**Cost: ~$7-25/month per service**

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Store passwords with bcrypt (salt rounds: 10+)
- [ ] Use JWT with expiration
- [ ] Validate all inputs
- [ ] Sanitize database queries (use parameterized queries)
- [ ] Enable CORS only for trusted domains
- [ ] Rate limiting on API endpoints
- [ ] Encrypt sensitive data (device passcodes)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement RBAC (Role-Based Access Control)
- [ ] Add request logging
- [ ] Set up backup strategy

---

## Testing Strategy

### Unit Tests (Jest)
```javascript
// Example: test smart pricing
describe('Smart Pricing Service', () => {
  test('estimates price between two known models', async () => {
    const result = await smartPricing.estimatePrice(10, 1, 'original');
    expect(result.price).toBeGreaterThan(200);
    expect(result.confidence).toBeGreaterThan(70);
  });
});
```

### Integration Tests
- Test API endpoints
- Test database operations
- Test third-party integrations

### E2E Tests (Cypress)
- Test user workflows
- Test form submissions
- Test navigation

---

## Performance Optimization

1. **Database**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Optimize complex queries

2. **Backend**
   - Implement caching (Redis)
   - Compress responses (gzip)
   - Use pagination for large datasets

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategies

---

## Maintenance Plan

### Daily
- Monitor error logs
- Check notification success rate
- Review system performance

### Weekly
- Database backup verification
- Security updates
- Review customer feedback

### Monthly
- Performance analysis
- Feature usage statistics
- Cost analysis
- Security audit

---

## Support & Resources

### Documentation
- React: https://react.dev
- Express: https://expressjs.com
- PostgreSQL: https://www.postgresql.org/docs
- Material-UI: https://mui.com

### Communities
- Stack Overflow
- Reddit: r/webdev, r/reactjs
- Discord: Reactiflux, Node.js

### Tools
- Postman (API testing)
- pgAdmin (Database management)
- VS Code extensions: ESLint, Prettier

---

## Conclusion

This implementation guide provides a solid foundation for building your mobile repair shop dashboard. Start with the MVP features, test thoroughly, and iterate based on user feedback.

**Remember:**
- Start small, scale gradually
- Test each feature thoroughly
- Get user feedback early
- Document as you go
- Security first!

Good luck with your project! 🚀
