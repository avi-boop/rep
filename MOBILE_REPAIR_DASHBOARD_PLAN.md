# Mobile Repair Shop Dashboard - Comprehensive Plan

## Executive Summary
A comprehensive dashboard system for managing mobile device repairs with smart pricing, customer notifications, and Lightspeed POS integration. Focus on simplicity, efficiency, and automation.

---

## 1. Core Features & Modules

### 1.1 Dashboard Overview (Home)
- **Quick Stats Cards**
  - Today's repairs (in progress, completed, pending)
  - Revenue (daily, weekly, monthly)
  - Pending customer pickups
  - Low stock alerts (parts inventory)
  
- **Activity Feed**
  - Recent repair orders
  - Customer check-ins
  - Completed repairs awaiting pickup
  - Urgent repairs or escalations

- **Quick Actions**
  - Create new repair order
  - Check device in
  - Search customer/order
  - Add walk-in customer

### 1.2 Repair Order Management
- **Create/Edit Repair Orders**
  - Customer selection (search existing or create new)
  - Device selection (brand, model, IMEI/serial)
  - Issue description with photos
  - Multiple repair items per order
  - Part quality selection (Original/Aftermarket)
  - Priority levels (Standard, Express, Urgent)
  - Estimated completion date/time
  - Price calculation (automatic with smart pricing)
  
- **Repair Status Workflow**
  1. Received/Checked-in
  2. Diagnosis in progress
  3. Awaiting parts
  4. Repair in progress
  5. Quality check
  6. Completed - awaiting pickup
  7. Delivered/Closed
  
- **Technician Assignment**
  - Assign repairs to specific technicians
  - Track technician workload
  - Performance metrics per technician

### 1.3 Smart Pricing System
**Intelligent Price Estimation Algorithm**

- **Database Structure**
  - Brand → Model → Repair Type → Part Quality → Price
  - Historical pricing data
  - Market price trends
  
- **Smart Estimation Logic**
  ```
  Example:
  If iPhone 11 screen = $150
  And iPhone 13 screen = $210
  Then iPhone 12 screen ≈ $180 (linear interpolation)
  
  Factors:
  - Release date proximity
  - Component similarity
  - Market positioning
  - Historical repair costs
  ```

- **Price Calculation Features**
  - Manual override capability
  - Bulk pricing rules (e.g., 10% discount for multiple repairs)
  - Seasonal adjustments
  - Competitor price tracking
  - Profit margin calculator
  - Labor + Parts breakdown

- **Missing Price Alerts**
  - Flag repairs with estimated prices
  - Review queue for price confirmation
  - Learning from confirmed estimates

### 1.4 Device & Parts Management

**Supported Devices:**
- **Primary Focus:**
  - iPhones (all models)
  - Samsung Galaxy phones
  - Samsung Galaxy tablets
  - iPads
  
- **Secondary:**
  - Other Android brands (Google, OnePlus, Xiaomi, etc.)
  - Generic "Other" category

**Repair Types:**
- Front screen (LCD/OLED)
- Back glass
- Battery replacement
- Charging port
- Audio (speaker, microphone, earpiece)
- Camera (front, rear, lens)
- Motherboard repair
- Water damage treatment
- Software issues
- Other repairs (custom entry)

**Parts Inventory:**
- Stock tracking per part type/model
- Original vs Aftermarket distinction
- Reorder alerts (low stock threshold)
- Supplier information
- Cost tracking
- Serial number tracking (for high-value parts)

### 1.5 Customer Management
- **Customer Database**
  - Name, phone, email, address
  - Repair history
  - Device history
  - Notes/preferences
  - Marketing consent
  
- **Lightspeed Integration** (Phase 2)
  - Sync customer data
  - Pull transaction history
  - Unified customer view
  - Avoid duplicate entries

### 1.6 Notification System

**Customer Notifications:**
- **SMS & Email Support**
  - Repair received confirmation
  - Diagnosis complete (with quote)
  - Parts arrived notification
  - Repair in progress update
  - Ready for pickup (with photo)
  - Pickup reminder (if not collected)
  - Payment receipt
  
- **Notification Settings**
  - Customer preference (SMS/Email/Both)
  - Auto-send vs manual review
  - Template customization
  - Automated triggers
  
- **Integration Options**
  - Twilio (SMS)
  - SendGrid/AWS SES (Email)
  - WhatsApp Business API (future)

**Internal Notifications:**
- Staff alerts for urgent repairs
- Technician task assignments
- Parts arrival notifications
- Quality check failures

### 1.7 Pricing & Catalog Management
- **Price List Management**
  - Search and filter (brand, model, repair type)
  - Bulk import/export (CSV/Excel)
  - Version history
  - Effective date ranges
  - Competition tracking notes
  
- **Price Strategies**
  - Standard pricing
  - Express service markup (e.g., +30%)
  - Weekend/holiday rates
  - Warranty repair pricing
  - Insurance claim pricing

### 1.8 Reporting & Analytics
- **Financial Reports**
  - Daily/weekly/monthly revenue
  - Revenue by repair type
  - Revenue by device brand
  - Original vs Aftermarket parts split
  - Profit margins
  
- **Operational Reports**
  - Average repair time
  - Technician performance
  - Popular repairs
  - Device breakdown statistics
  - Customer satisfaction trends
  
- **Inventory Reports**
  - Stock levels
  - Part usage trends
  - Slow-moving inventory
  - Reorder recommendations

### 1.9 Settings & Configuration
- **Business Settings**
  - Shop name, logo, contact info
  - Operating hours
  - Tax rates
  - Currency settings
  
- **User Management**
  - Role-based access (Admin, Manager, Technician, Front Desk)
  - Permissions matrix
  - Activity logging
  
- **Integration Settings**
  - Lightspeed API credentials
  - Notification service configs
  - Payment gateway settings
  
---

## 2. Database Schema Design

### 2.1 Core Tables

```sql
-- Customers
customers
  - id (PK)
  - lightspeed_customer_id (nullable, for future integration)
  - first_name
  - last_name
  - phone
  - email
  - address
  - city, state, zip
  - marketing_consent
  - preferred_contact_method (SMS/Email/Both)
  - notes
  - created_at
  - updated_at

-- Devices
devices
  - id (PK)
  - brand (iPhone, Samsung, Other)
  - model (e.g., "iPhone 13 Pro")
  - variant (e.g., "128GB", "256GB")
  - release_year
  - device_category (Phone, Tablet)
  - created_at
  - updated_at

-- Customer Devices (for tracking specific devices)
customer_devices
  - id (PK)
  - customer_id (FK)
  - device_id (FK)
  - imei_serial
  - color
  - condition_notes
  - first_seen_at
  - created_at
  - updated_at

-- Repair Types
repair_types
  - id (PK)
  - name (e.g., "Front Screen", "Battery")
  - category (Display, Power, Audio, etc.)
  - description
  - typical_duration_minutes
  - active (boolean)
  - created_at
  - updated_at

-- Price List
price_list
  - id (PK)
  - device_id (FK)
  - repair_type_id (FK)
  - part_quality (Original/Aftermarket)
  - price
  - cost (for profit calculation)
  - is_estimated (boolean, for smart pricing)
  - confidence_score (0-100, for smart pricing)
  - effective_from
  - effective_until (nullable)
  - notes
  - created_at
  - updated_at

-- Repair Orders
repair_orders
  - id (PK)
  - order_number (unique, e.g., "RO-2025-00123")
  - customer_id (FK)
  - customer_device_id (FK)
  - status (received, diagnosis, awaiting_parts, in_progress, qc, completed, delivered)
  - priority (standard, express, urgent)
  - checked_in_at
  - estimated_completion_at
  - completed_at
  - delivered_at
  - assigned_technician_id (FK to users)
  - customer_issue_description
  - technician_diagnosis
  - device_passcode (encrypted)
  - device_condition_notes
  - backup_confirmed (boolean)
  - total_price
  - deposit_paid
  - final_payment_status (unpaid, partial, paid)
  - created_at
  - updated_at

-- Repair Order Items (multiple repairs per order)
repair_order_items
  - id (PK)
  - repair_order_id (FK)
  - repair_type_id (FK)
  - part_quality (Original/Aftermarket)
  - price
  - cost
  - status (pending, completed, failed)
  - notes
  - created_at
  - updated_at

-- Parts Inventory
parts_inventory
  - id (PK)
  - device_id (FK, nullable for generic parts)
  - repair_type_id (FK)
  - part_quality (Original/Aftermarket)
  - sku
  - quantity_in_stock
  - reorder_threshold
  - unit_cost
  - supplier_name
  - supplier_contact
  - location (shelf/bin location)
  - created_at
  - updated_at

-- Inventory Transactions
inventory_transactions
  - id (PK)
  - part_id (FK)
  - transaction_type (in, out, adjustment)
  - quantity
  - repair_order_item_id (FK, nullable)
  - notes
  - created_at_by (FK to users)
  - created_at

-- Notifications
notifications
  - id (PK)
  - repair_order_id (FK)
  - customer_id (FK)
  - type (sms, email)
  - template_name
  - recipient
  - subject
  - message
  - status (pending, sent, failed)
  - sent_at
  - error_message (if failed)
  - created_at

-- Users (Staff)
users
  - id (PK)
  - username
  - email
  - password_hash
  - first_name
  - last_name
  - role (admin, manager, technician, front_desk)
  - active (boolean)
  - created_at
  - updated_at

-- Activity Log (audit trail)
activity_log
  - id (PK)
  - user_id (FK)
  - action (create, update, delete, login, etc.)
  - entity_type (repair_order, customer, etc.)
  - entity_id
  - changes (JSON)
  - ip_address
  - created_at

-- Smart Pricing History (for learning)
pricing_history
  - id (PK)
  - device_id (FK)
  - repair_type_id (FK)
  - part_quality
  - estimated_price
  - actual_price_used
  - was_estimated (boolean)
  - created_at
```

### 2.2 Indexes
```sql
-- Performance optimization
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_repair_orders_status ON repair_orders(status);
CREATE INDEX idx_repair_orders_customer ON repair_orders(customer_id);
CREATE INDEX idx_repair_orders_order_number ON repair_orders(order_number);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_price_list_device_repair ON price_list(device_id, repair_type_id);
```

---

## 3. Smart Pricing Algorithm Details

### 3.1 Interpolation Strategy

**Linear Interpolation (Basic)**
```python
def estimate_price(target_model, repair_type, part_quality):
    # Get known prices for same repair type and part quality
    known_prices = get_known_prices(repair_type, part_quality)
    
    # Sort by model release date/number
    sorted_prices = sort_by_model_sequence(known_prices)
    
    # Find surrounding models
    lower_model = find_lower_bound(sorted_prices, target_model)
    upper_model = find_upper_bound(sorted_prices, target_model)
    
    if lower_model and upper_model:
        # Linear interpolation
        position = calculate_relative_position(target_model, lower_model, upper_model)
        estimated_price = lower_model.price + (upper_model.price - lower_model.price) * position
        confidence = 85  # High confidence with bounded data
    elif lower_model or upper_model:
        # Extrapolation (less confident)
        estimated_price = extrapolate(lower_model or upper_model)
        confidence = 60  # Lower confidence
    else:
        # Use category average
        estimated_price = get_category_average(repair_type, part_quality)
        confidence = 40  # Low confidence
    
    return {
        'price': round(estimated_price, 2),
        'confidence': confidence,
        'is_estimated': True
    }
```

**Advanced Factors:**
- Screen size similarity
- Technology similarity (LCD vs OLED)
- Market segment (budget, mid-range, flagship)
- Historical price trends
- Seasonal patterns

### 3.2 Confidence Scoring
- **90-100%**: Price exists in database (not estimated)
- **80-89%**: Interpolated between two close models
- **60-79%**: Extrapolated from one model or similar device
- **40-59%**: Based on category average
- **Below 40%**: Requires manual pricing

### 3.3 Learning & Improvement
- Track estimated vs actual prices used
- Admin review queue for low-confidence estimates
- Automatically update price list when patterns emerge
- Quarterly price review reports

---

## 4. Lightspeed POS Integration Strategy

### 4.1 Integration Approach
**Phase 1: Read-Only Integration**
- Fetch customer data from Lightspeed
- Import customer purchase history
- One-way sync (Lightspeed → Dashboard)

**Phase 2: Bi-Directional Sync**
- Push repair orders to Lightspeed as sales
- Sync inventory (if managing accessories in Lightspeed)
- Real-time updates

### 4.2 API Integration Points
```
Lightspeed Retail API Endpoints:
- GET /customers - Fetch customer list
- GET /customers/{id} - Get customer details
- POST /customers - Create new customer (if needed)
- GET /sales - Fetch sales history
- POST /sales - Create sale (for completed repairs)
```

### 4.3 Data Mapping
```
Lightspeed Customer → Dashboard Customer
- customer_id → lightspeed_customer_id
- firstName + lastName → first_name, last_name
- contact.phone → phone
- contact.email → email
- contact.addresses → address fields
```

### 4.4 Sync Strategy
- **Initial Sync**: Import all existing customers (one-time)
- **Incremental Sync**: Poll for updates every 15 minutes
- **Conflict Resolution**: Lightspeed as source of truth for customer info
- **Webhook Support**: If available, use webhooks for real-time updates

### 4.5 Fallback Mechanism
- System should work fully offline from Lightspeed
- Manual customer entry always available
- Queue sync operations if API unavailable

---

## 5. Notification System Architecture

### 5.1 Notification Templates
```
1. REPAIR_RECEIVED
   Subject: "Repair Received - Order #{order_number}"
   Message: "Hi {customer_name}, we've received your {device_model} for {repair_type}. 
            Estimated completion: {est_date}. Track: {tracking_link}"

2. DIAGNOSIS_COMPLETE
   Subject: "Diagnosis Complete - Order #{order_number}"
   Message: "Diagnosis for your {device_model} is complete. 
            Repair cost: ${total}. Reply YES to approve or call us."

3. REPAIR_IN_PROGRESS
   Subject: "Repair Started - Order #{order_number}"
   Message: "Good news! We've started repairing your {device_model}."

4. READY_FOR_PICKUP
   Subject: "Ready for Pickup! - Order #{order_number}"
   Message: "Your {device_model} is ready! Please collect from {shop_address}. 
            Hours: {business_hours}. Amount due: ${balance}"

5. PICKUP_REMINDER
   Subject: "Pickup Reminder - Order #{order_number}"
   Message: "Reminder: Your {device_model} has been ready since {date}. 
            Please collect at your earliest convenience."
```

### 5.2 Notification Triggers
- **Automatic Triggers**:
  - Status changes (checked-in → diagnosis → etc.)
  - Delay alerts (if repair takes longer than estimated)
  - Pickup reminders (24 hours, 3 days, 7 days after completion)

- **Manual Triggers**:
  - Custom messages from staff
  - Quote approval requests
  - Additional issue discovered

### 5.3 Implementation
**Recommended Services:**
- **SMS**: Twilio (reliable, global, good pricing)
- **Email**: SendGrid or AWS SES
- **Future**: WhatsApp Business API

**Rate Limiting & Cost Control:**
- Batch notifications where possible
- Respect customer contact preferences
- Track notification costs per order
- Monthly spending alerts

---

## 6. User Interface & Experience

### 6.1 Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Mobile Repair Dashboard        [User ▼] [Logout]  │
├─────────────────────────────────────────────────────────────┤
│  [Dashboard] [Repairs] [Customers] [Pricing] [Inventory]    │
│  [Reports] [Settings]                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ In Prog. │ │ Ready    │ │ Today's  │ │ Low      │      │
│  │    12    │ │ Pickup 5 │ │ Rev $850 │ │ Stock 3  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                               │
│  Recent Activity                    Quick Actions            │
│  ┌─────────────────────────┐       ┌──────────────┐        │
│  │ RO-123: iPhone 13       │       │ + New Repair │        │
│  │ Status: In Progress     │       └──────────────┘        │
│  │ Customer: John Doe      │       ┌──────────────┐        │
│  └─────────────────────────┘       │ Search Order │        │
│  ┌─────────────────────────┐       └──────────────┘        │
│  │ RO-122: Samsung S21     │                                │
│  │ Status: Ready           │                                │
│  └─────────────────────────┘                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Repair Order Flow (UI)
```
Step 1: Customer Selection
  - Search box (phone/name/email)
  - Quick create customer button
  - Recent customers list

Step 2: Device Selection
  - Brand dropdown (iPhone, Samsung, Other)
  - Model dropdown (smart search)
  - IMEI/Serial input
  - Device condition photo upload

Step 3: Issue Selection
  - Checkboxes for common repairs
  - "+ Add Another Repair" button
  - Custom issue description
  - Priority selector

Step 4: Parts & Pricing
  - Original vs Aftermarket toggle per repair
  - Auto-calculated prices (highlight estimated ones)
  - Manual price override option
  - Discount field
  - Total calculation

Step 5: Confirmation
  - Review summary
  - Estimated completion date picker
  - Technician assignment
  - Customer notification preference
  - Save & Print ticket button
```

### 6.3 Design Principles
- **Clean & Minimal**: Focus on essential information
- **Mobile Responsive**: Works on tablets for front desk
- **Color Coding**: Status colors (red=urgent, yellow=in-progress, green=ready)
- **Search First**: Prominent search bars everywhere
- **One-Click Actions**: Common tasks should be quick
- **Real-time Updates**: Use WebSockets for live status updates

### 6.4 Technology Recommendations

**Frontend:**
- **React.js** or **Vue.js** - Modern, component-based
- **Tailwind CSS** - Fast UI development
- **Material-UI** or **Ant Design** - Pre-built components
- **Chart.js** or **Recharts** - For analytics

**Backend:**
- **Node.js (Express)** or **Python (FastAPI/Django)**
- **PostgreSQL** - Reliable relational database
- **Redis** - Caching and real-time features

**Hosting:**
- **Frontend**: Vercel, Netlify, or AWS S3+CloudFront
- **Backend**: AWS EC2, Digital Ocean, or Railway
- **Database**: AWS RDS, Digital Ocean Managed DB, or Supabase

**Mobile App (Future):**
- React Native or Flutter
- Customer-facing app for tracking repairs

---

## 7. Additional Feature Suggestions

### 7.1 Warranty Management
- Track warranty periods for repairs
- Warranty claim processing
- Warranty repair history
- Automated warranty expiration reminders

### 7.2 Customer Portal
- Online repair booking
- Real-time repair tracking
- Digital receipt access
- Repair history view
- Online payment option

### 7.3 Quality Assurance
- Post-repair testing checklist
- Photo documentation (before/after)
- Customer satisfaction surveys (SMS after pickup)
- Technician quality scores

### 7.4 Marketing Features
- Customer segmentation (repeat customers, high-value)
- Email marketing campaigns
- Loyalty program/points
- Referral tracking
- Special offers management

### 7.5 Advanced Analytics
- Predictive maintenance alerts (based on device age)
- Peak hours analysis (staffing optimization)
- Customer lifetime value
- Repair success rates
- Part failure rates (identify bad suppliers)

### 7.6 Multi-Location Support (Future)
- If expanding to multiple shops
- Location-based inventory
- Inter-location part transfers
- Consolidated reporting

### 7.7 Appointment Booking
- Calendar integration
- Time slot management
- Appointment reminders
- Walk-in vs appointment tracking

### 7.8 Accessory Sales
- Sell cases, screen protectors, chargers
- Integrate with repair orders
- Inventory for accessories
- Upsell suggestions during checkout

---

## 8. Implementation Roadmap

### Phase 1: MVP (Months 1-2)
✅ Core dashboard with statistics
✅ Customer management (CRUD)
✅ Device database
✅ Repair order creation and tracking
✅ Manual pricing management
✅ Basic reporting
✅ User authentication and roles

### Phase 2: Smart Features (Month 3)
✅ Smart pricing algorithm
✅ Price estimation and confidence scoring
✅ Parts inventory management
✅ Automated notifications (SMS/Email)
✅ Technician assignment and workload

### Phase 3: Integration (Month 4)
✅ Lightspeed POS integration
✅ Customer data sync
✅ Payment processing integration
✅ Advanced search and filters

### Phase 4: Enhancement (Month 5-6)
✅ Advanced analytics and reporting
✅ Customer portal (self-service)
✅ Quality assurance workflows
✅ Mobile app development
✅ Marketing automation

---

## 9. Security Considerations

### 9.1 Data Protection
- Encrypt sensitive data (customer passwords, device passcodes)
- HTTPS only (SSL certificate)
- Regular database backups
- GDPR compliance (if applicable)
- Customer data deletion requests

### 9.2 Access Control
- Role-based permissions
- Audit logs for all data changes
- Session timeout
- Two-factor authentication (for admins)
- IP whitelisting for admin panel (optional)

### 9.3 API Security
- API key authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

---

## 10. Cost Estimates

### 10.1 Development Costs
- **MVP Development**: $15,000 - $25,000 (freelancer/agency)
- **Full Featured (Phases 1-4)**: $40,000 - $70,000
- **Maintenance**: $500 - $1,500/month

### 10.2 Operational Costs
- **Hosting**: $50 - $200/month (depending on scale)
- **Database**: $25 - $100/month
- **SMS (Twilio)**: ~$0.01 per SMS (estimate $50-200/month)
- **Email (SendGrid)**: $15 - $50/month
- **SSL Certificate**: Free (Let's Encrypt) or $50-200/year
- **Domain**: $10-20/year
- **Backup Storage**: $10-30/month

**Total Monthly Operational**: ~$150 - $600/month

---

## 11. Success Metrics

### 11.1 Business KPIs
- Average repair turnaround time
- Customer satisfaction score
- Repeat customer rate
- Revenue per repair order
- Profit margin per repair type
- Technician utilization rate

### 11.2 System KPIs
- Order processing time (staff efficiency)
- Price estimation accuracy
- Notification delivery rate
- System uptime
- Page load times

---

## 12. Risk Mitigation

### Potential Risks:
1. **Lightspeed API Changes**: Build abstraction layer for easy switching
2. **Data Loss**: Automated daily backups, tested restore procedures
3. **SMS Costs**: Set spending caps, use email as fallback
4. **Staff Resistance**: Provide training, make UI intuitive
5. **Pricing Errors**: Manual review required for estimated prices
6. **Security Breach**: Regular security audits, penetration testing

---

## 13. Next Steps

1. **Review & Refine** this plan with stakeholders
2. **Select Technology Stack** based on team expertise
3. **Create Detailed Wireframes** for UI/UX
4. **Database Setup** and schema implementation
5. **Start MVP Development** (Phase 1)
6. **Beta Testing** with staff
7. **Gradual Rollout** with training
8. **Iterate Based on Feedback**

---

## Contact & Questions

For questions or clarifications about this plan, please note:
- Priority features that must be in MVP
- Any custom requirements not covered
- Budget constraints
- Timeline expectations
- Integration with other systems

---

**Document Version**: 1.0  
**Created**: 2025-11-10  
**Status**: Draft for Review

