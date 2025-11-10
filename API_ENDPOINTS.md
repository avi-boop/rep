# Mobile Repair Dashboard - API Endpoints

## Authentication
All endpoints require authentication via JWT token (except login).

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
```

---

## 1. Customers

### Get All Customers
```
GET /api/customers?search={query}&page={page}&limit={limit}
```

### Get Customer by ID
```
GET /api/customers/:id
```

### Create Customer
```
POST /api/customers
Body: {
  first_name: string,
  last_name: string,
  phone: string,
  email: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  marketing_consent: boolean,
  preferred_contact_method: "SMS" | "Email" | "Both"
}
```

### Update Customer
```
PUT /api/customers/:id
Body: { ... same as create }
```

### Get Customer Repair History
```
GET /api/customers/:id/repairs
```

---

## 2. Devices

### Get All Devices
```
GET /api/devices?brand={brand}&category={category}
```

### Get Device by ID
```
GET /api/devices/:id
```

### Create Device
```
POST /api/devices
Body: {
  brand: string,
  model: string,
  variant: string,
  release_year: number,
  device_category: "Phone" | "Tablet"
}
```

### Search Devices
```
GET /api/devices/search?q={query}
```

---

## 3. Repair Orders

### Get All Repair Orders
```
GET /api/repair-orders?status={status}&priority={priority}&date_from={date}&date_to={date}&page={page}
```

### Get Repair Order by ID
```
GET /api/repair-orders/:id
```

### Create Repair Order
```
POST /api/repair-orders
Body: {
  customer_id: number,
  device_id: number,
  priority: "standard" | "express" | "urgent",
  customer_issue_description: string,
  device_passcode: string,
  estimated_completion_at: datetime,
  repair_items: [
    {
      repair_type_id: number,
      part_quality: "Original" | "Aftermarket",
      price: number
    }
  ]
}
```

### Update Repair Order Status
```
PATCH /api/repair-orders/:id/status
Body: {
  status: string,
  notes: string
}
```

### Assign Technician
```
PATCH /api/repair-orders/:id/assign
Body: {
  technician_id: number
}
```

### Complete Repair Order
```
POST /api/repair-orders/:id/complete
Body: {
  technician_notes: string,
  actual_completion_at: datetime
}
```

### Get Repair Order Timeline
```
GET /api/repair-orders/:id/timeline
```

---

## 4. Pricing

### Get Price List
```
GET /api/prices?device_id={id}&repair_type_id={id}&part_quality={quality}
```

### Get Price for Specific Repair
```
GET /api/prices/estimate?device_id={id}&repair_type_id={id}&part_quality={quality}
Response: {
  price: number,
  is_estimated: boolean,
  confidence_score: number,
  similar_prices: [...]
}
```

### Create/Update Price
```
POST /api/prices
Body: {
  device_id: number,
  repair_type_id: number,
  part_quality: string,
  price: number,
  cost: number
}
```

### Bulk Import Prices
```
POST /api/prices/bulk-import
Body: FormData (CSV file)
```

### Export Prices
```
GET /api/prices/export?format=csv
```

---

## 5. Inventory

### Get Parts Inventory
```
GET /api/inventory?device_id={id}&repair_type_id={id}&low_stock=true
```

### Update Stock Level
```
PATCH /api/inventory/:id
Body: {
  quantity_in_stock: number,
  notes: string
}
```

### Record Inventory Transaction
```
POST /api/inventory/:id/transactions
Body: {
  transaction_type: "in" | "out" | "adjustment",
  quantity: number,
  notes: string
}
```

### Get Low Stock Alerts
```
GET /api/inventory/low-stock
```

---

## 6. Notifications

### Send Manual Notification
```
POST /api/notifications
Body: {
  repair_order_id: number,
  type: "sms" | "email",
  template_name: string,
  custom_message: string (optional)
}
```

### Get Notification History
```
GET /api/notifications?repair_order_id={id}&status={status}
```

### Resend Failed Notification
```
POST /api/notifications/:id/resend
```

---

## 7. Reports

### Dashboard Statistics
```
GET /api/reports/dashboard-stats?date_from={date}&date_to={date}
Response: {
  repairs_in_progress: number,
  repairs_completed_today: number,
  revenue_today: number,
  pending_pickups: number,
  low_stock_count: number
}
```

### Revenue Report
```
GET /api/reports/revenue?period=daily|weekly|monthly&date={date}
```

### Technician Performance
```
GET /api/reports/technician-performance?technician_id={id}&date_from={date}&date_to={date}
```

### Popular Repairs
```
GET /api/reports/popular-repairs?date_from={date}&date_to={date}
```

### Device Breakdown
```
GET /api/reports/device-breakdown?date_from={date}&date_to={date}
```

---

## 8. Lightspeed Integration

### Sync Customers
```
POST /api/integrations/lightspeed/sync-customers
Body: {
  full_sync: boolean
}
```

### Check Sync Status
```
GET /api/integrations/lightspeed/sync-status
```

### Manual Customer Lookup
```
GET /api/integrations/lightspeed/customers/:lightspeed_id
```

---

## 9. Settings

### Get Business Settings
```
GET /api/settings/business
```

### Update Business Settings
```
PUT /api/settings/business
Body: {
  shop_name: string,
  phone: string,
  address: string,
  operating_hours: {...},
  tax_rate: number
}
```

### Get Notification Settings
```
GET /api/settings/notifications
```

### Update Notification Settings
```
PUT /api/settings/notifications
Body: {
  sms_provider: string,
  sms_api_key: string,
  email_provider: string,
  email_api_key: string,
  auto_send_enabled: boolean
}
```

---

## 10. Users (Staff)

### Get All Users
```
GET /api/users
```

### Create User
```
POST /api/users
Body: {
  username: string,
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  role: "admin" | "manager" | "technician" | "front_desk"
}
```

### Update User
```
PUT /api/users/:id
```

### Deactivate User
```
DELETE /api/users/:id
```

---

## WebSocket Events

### Real-time Updates
```
Connection: ws://your-domain/ws?token={jwt_token}

Events:
- repair_status_changed: { repair_order_id, old_status, new_status }
- new_repair_order: { repair_order }
- notification_sent: { notification_id, status }
- low_stock_alert: { part_id, quantity }
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {...}
  }
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error
