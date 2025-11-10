# API Endpoints Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://api.yourrepairshop.com/api
```

## Authentication
All endpoints require JWT token in Authorization header (except auth endpoints)
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication

### POST /auth/login
Login to the system
```json
Request:
{
  "email": "admin@shop.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "email": "admin@shop.com",
    "role": "admin",
    "name": "John Doe"
  }
}
```

### POST /auth/refresh
Refresh access token
```json
Request:
{
  "refreshToken": "..."
}

Response:
{
  "token": "new_token_here"
}
```

---

## 📱 Device Management

### GET /devices/brands
Get all brands
```json
Response:
[
  {
    "id": 1,
    "name": "Apple",
    "is_primary": true,
    "logo_url": "https://..."
  }
]
```

### GET /devices/models?brand_id=1&type=phone
Get device models with filters
```json
Query Parameters:
- brand_id (optional)
- type: phone|tablet (optional)
- is_active: boolean (optional)

Response:
[
  {
    "id": 1,
    "brand_id": 1,
    "brand_name": "Apple",
    "name": "iPhone 13",
    "model_number": "A2482",
    "release_year": 2021,
    "device_type": "phone",
    "screen_size": 6.1
  }
]
```

### POST /devices/models
Create new device model
```json
Request:
{
  "brand_id": 1,
  "name": "iPhone 15",
  "model_number": "A2846",
  "release_year": 2023,
  "device_type": "phone",
  "screen_size": 6.1
}

Response:
{
  "id": 25,
  "message": "Device model created successfully"
}
```

---

## 🔧 Repair Types

### GET /repairs/types
Get all repair types
```json
Response:
[
  {
    "id": 1,
    "name": "Front Screen",
    "category": "screen",
    "estimated_duration": 45,
    "is_active": true
  }
]
```

### GET /repairs/part-types
Get all part types
```json
Response:
[
  {
    "id": 1,
    "name": "Original (OEM)",
    "quality_level": 5,
    "warranty_months": 12
  }
]
```

---

## 💰 Pricing

### GET /pricing
Get all pricing with filters
```json
Query Parameters:
- device_model_id (optional)
- repair_type_id (optional)
- part_type_id (optional)
- is_estimated (optional)
- brand_id (optional)

Response:
[
  {
    "id": 1,
    "device_model": "iPhone 13",
    "brand": "Apple",
    "repair_type": "Front Screen",
    "part_type": "Original (OEM)",
    "price": 199.00,
    "cost": 120.00,
    "margin": 79.00,
    "is_estimated": false,
    "confidence_score": 1.0
  }
]
```

### GET /pricing/grid?brand_id=1
Get pricing in grid format for easy viewing
```json
Response:
{
  "brand": "Apple",
  "devices": [
    {
      "model": "iPhone 13",
      "release_year": 2021,
      "repairs": {
        "Front Screen": {
          "original": 199.00,
          "aftermarket": 149.00
        },
        "Battery": {
          "original": 69.00,
          "aftermarket": 49.00
        }
      }
    }
  ]
}
```

### POST /pricing
Create new pricing entry
```json
Request:
{
  "device_model_id": 1,
  "repair_type_id": 1,
  "part_type_id": 1,
  "price": 199.00,
  "cost": 120.00,
  "valid_from": "2024-01-01"
}

Response:
{
  "id": 150,
  "message": "Pricing created successfully"
}
```

### PUT /pricing/:id
Update existing pricing
```json
Request:
{
  "price": 209.00,
  "cost": 125.00,
  "notes": "Price increased due to part cost"
}

Response:
{
  "message": "Pricing updated successfully"
}
```

### POST /pricing/bulk-import
Bulk import pricing from CSV
```json
Request (multipart/form-data):
file: pricing.csv

Response:
{
  "imported": 45,
  "updated": 12,
  "errors": 2,
  "error_details": [
    {
      "row": 5,
      "error": "Device model not found"
    }
  ]
}
```

### GET /pricing/estimate
Get smart pricing estimate
```json
Query Parameters:
- device_model_id: required
- repair_type_id: required
- part_type_id: required

Response:
{
  "price": 165.00,
  "is_estimated": true,
  "confidence_score": 0.87,
  "based_on": [
    {"model": "iPhone 11", "price": 150.00},
    {"model": "iPhone 13", "price": 199.00}
  ],
  "method": "linear_interpolation"
}
```

---

## 👥 Customers

### GET /customers
Get all customers with pagination
```json
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string (search name, email, phone)

Response:
{
  "data": [
    {
      "id": 1,
      "lightspeed_id": "LS123456",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "notification_preferences": {
        "sms": true,
        "email": true,
        "push": false
      },
      "repair_count": 5,
      "total_spent": 895.00
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### GET /customers/:id
Get customer details
```json
Response:
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notification_preferences": {...},
  "repair_history": [
    {
      "order_number": "R20241110-0001",
      "date": "2024-11-10",
      "device": "iPhone 13",
      "status": "completed",
      "total": 199.00
    }
  ],
  "total_spent": 895.00,
  "avg_order_value": 179.00
}
```

### POST /customers
Create new customer
```json
Request:
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "notification_preferences": {
    "sms": true,
    "email": true
  }
}

Response:
{
  "id": 25,
  "message": "Customer created successfully"
}
```

### PUT /customers/:id
Update customer
```json
Request:
{
  "email": "newemail@example.com",
  "notification_preferences": {
    "sms": false,
    "email": true
  }
}

Response:
{
  "message": "Customer updated successfully"
}
```

### POST /customers/sync-lightspeed
Sync customer from Lightspeed by phone or email
```json
Request:
{
  "phone": "+1234567890"
}

Response:
{
  "id": 10,
  "lightspeed_id": "LS123456",
  "synced": true,
  "message": "Customer synced from Lightspeed"
}
```

---

## 🛠️ Repair Orders

### GET /orders
Get all repair orders with filters
```json
Query Parameters:
- status: pending|in_progress|completed|ready_pickup|delivered|cancelled
- priority: normal|urgent|express
- customer_id: number
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
- search: order number, customer name, IMEI
- page: number
- limit: number

Response:
{
  "data": [
    {
      "id": 1,
      "order_number": "R20241110-0001",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "device": "iPhone 13",
      "brand": "Apple",
      "status": "in_progress",
      "priority": "normal",
      "total_price": 199.00,
      "balance_due": 199.00,
      "created_at": "2024-11-10T10:30:00Z",
      "estimated_completion": "2024-11-10T15:30:00Z",
      "repair_items": [
        {
          "repair_type": "Front Screen",
          "part_type": "Original (OEM)",
          "status": "in_progress"
        }
      ]
    }
  ],
  "pagination": {...}
}
```

### GET /orders/:id
Get order details
```json
Response:
{
  "id": 1,
  "order_number": "R20241110-0001",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "device": {
    "brand": "Apple",
    "model": "iPhone 13",
    "imei": "123456789012345",
    "password": "****"
  },
  "status": "in_progress",
  "priority": "urgent",
  "issue_description": "Screen cracked after drop",
  "cosmetic_condition": "Minor scratches on back",
  "items": [
    {
      "id": 1,
      "repair_type": "Front Screen",
      "part_type": "Original (OEM)",
      "quantity": 1,
      "unit_price": 199.00,
      "discount": 0,
      "total_price": 199.00,
      "status": "in_progress",
      "technician_notes": "Ordered parts, arriving tomorrow"
    }
  ],
  "total_price": 199.00,
  "deposit_paid": 50.00,
  "balance_due": 149.00,
  "created_at": "2024-11-10T10:30:00Z",
  "estimated_completion": "2024-11-10T15:30:00Z",
  "photos": [
    {
      "id": 1,
      "url": "https://...",
      "type": "before",
      "uploaded_at": "2024-11-10T10:35:00Z"
    }
  ],
  "status_history": [
    {
      "status": "pending",
      "changed_at": "2024-11-10T10:30:00Z"
    },
    {
      "status": "in_progress",
      "changed_at": "2024-11-10T11:00:00Z"
    }
  ]
}
```

### POST /orders
Create new repair order
```json
Request:
{
  "customer_id": 1,
  "device_model_id": 5,
  "device_imei": "123456789012345",
  "device_password": "1234",
  "priority": "normal",
  "issue_description": "Screen cracked",
  "cosmetic_condition": "Good condition otherwise",
  "items": [
    {
      "repair_type_id": 1,
      "part_type_id": 1,
      "quantity": 1,
      "pricing_id": 10
    }
  ],
  "deposit_paid": 50.00
}

Response:
{
  "id": 25,
  "order_number": "R20241110-0025",
  "total_price": 199.00,
  "estimated_completion": "2024-11-10T16:30:00Z",
  "message": "Repair order created successfully"
}
```

### PUT /orders/:id/status
Update order status
```json
Request:
{
  "status": "ready_pickup",
  "notes": "Repair completed, tested successfully"
}

Response:
{
  "message": "Order status updated",
  "notification_sent": true
}
```

### POST /orders/:id/items
Add item to existing order
```json
Request:
{
  "repair_type_id": 2,
  "part_type_id": 1,
  "quantity": 1,
  "pricing_id": 15,
  "notes": "Customer requested additional repair"
}

Response:
{
  "id": 45,
  "message": "Item added to order",
  "new_total": 268.00
}
```

### PUT /orders/:id/items/:item_id
Update order item
```json
Request:
{
  "status": "completed",
  "technician_notes": "Replaced successfully, tested OK"
}

Response:
{
  "message": "Item updated successfully"
}
```

### POST /orders/:id/photos
Upload photo
```json
Request (multipart/form-data):
file: photo.jpg
photo_type: before|after|issue|testing
description: "Cracked screen close-up"

Response:
{
  "id": 10,
  "url": "https://storage.../photo.jpg",
  "message": "Photo uploaded successfully"
}
```

### POST /orders/:id/payment
Record payment
```json
Request:
{
  "amount": 149.00,
  "method": "cash|card|other",
  "notes": "Final payment"
}

Response:
{
  "message": "Payment recorded",
  "balance_due": 0,
  "lightspeed_sale_id": "LS789" // if integrated
}
```

---

## 🔔 Notifications

### GET /notifications
Get notification history
```json
Query Parameters:
- order_id: number
- customer_id: number
- type: sms|email|push
- status: pending|sent|failed|delivered
- date_from: YYYY-MM-DD

Response:
[
  {
    "id": 1,
    "order_number": "R20241110-0001",
    "customer_name": "John Doe",
    "type": "sms",
    "event_type": "order_created",
    "status": "delivered",
    "sent_at": "2024-11-10T10:31:00Z",
    "delivered_at": "2024-11-10T10:31:05Z"
  }
]
```

### POST /notifications/send
Send manual notification
```json
Request:
{
  "order_id": 1,
  "type": "sms",
  "message": "Your device is ready for pickup!"
}

Response:
{
  "id": 150,
  "status": "sent",
  "message": "Notification sent successfully"
}
```

### POST /notifications/retry/:id
Retry failed notification
```json
Response:
{
  "status": "sent",
  "message": "Notification resent successfully"
}
```

---

## 📊 Analytics & Reports

### GET /analytics/dashboard
Get dashboard overview
```json
Query Parameters:
- date: YYYY-MM-DD (default: today)

Response:
{
  "today": {
    "active_orders": 12,
    "ready_pickup": 4,
    "urgent_orders": 3,
    "revenue": 1250.00,
    "completed_repairs": 8
  },
  "week": {
    "total_orders": 45,
    "revenue": 8950.00,
    "avg_order_value": 198.89
  },
  "month": {
    "total_orders": 178,
    "revenue": 35600.00
  }
}
```

### GET /analytics/revenue
Get revenue analytics
```json
Query Parameters:
- period: day|week|month|year
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD

Response:
{
  "total_revenue": 35600.00,
  "total_orders": 178,
  "avg_order_value": 200.00,
  "by_date": [
    {"date": "2024-11-01", "revenue": 1200.00, "orders": 6},
    {"date": "2024-11-02", "revenue": 1450.00, "orders": 7}
  ],
  "by_repair_type": [
    {"repair_type": "Front Screen", "revenue": 15000.00, "count": 75},
    {"repair_type": "Battery", "revenue": 8000.00, "count": 80}
  ],
  "by_device_brand": [
    {"brand": "Apple", "revenue": 25000.00, "percentage": 70.2},
    {"brand": "Samsung", "revenue": 10600.00, "percentage": 29.8}
  ]
}
```

### GET /analytics/popular-repairs
Get most popular repairs
```json
Query Parameters:
- limit: number (default: 10)
- period: day|week|month|year

Response:
[
  {
    "repair_type": "Front Screen",
    "count": 125,
    "revenue": 24875.00,
    "avg_price": 199.00
  }
]
```

### GET /analytics/technician-performance
Get technician metrics (if tracking technicians)
```json
Response:
[
  {
    "technician_id": 1,
    "name": "Mike Johnson",
    "completed_repairs": 45,
    "avg_completion_time": 52, // minutes
    "customer_rating": 4.8
  }
]
```

---

## 🔌 Lightspeed Integration

### POST /integrations/lightspeed/sync-customer
Sync customer from Lightspeed
```json
Request:
{
  "lightspeed_customer_id": "LS123456"
}

Response:
{
  "customer_id": 10,
  "message": "Customer synced successfully"
}
```

### POST /integrations/lightspeed/create-sale
Create sale in Lightspeed for completed repair
```json
Request:
{
  "order_id": 1
}

Response:
{
  "lightspeed_sale_id": "LS_SALE_789",
  "message": "Sale created in Lightspeed"
}
```

### GET /integrations/lightspeed/status
Check Lightspeed connection status
```json
Response:
{
  "connected": true,
  "account_id": "12345",
  "last_sync": "2024-11-10T09:00:00Z"
}
```

---

## ⚙️ Settings & Configuration

### GET /settings
Get system settings
```json
Response:
{
  "business_name": "QuickFix Mobile Repair",
  "business_hours": "Mon-Sat 9AM-6PM",
  "address": "123 Main St, City",
  "phone": "+1234567890",
  "email": "info@quickfix.com",
  "tax_rate": 0.08,
  "default_warranty_months": 3,
  "notification_settings": {
    "auto_send_on_status_change": true,
    "sms_enabled": true,
    "email_enabled": true
  }
}
```

### PUT /settings
Update settings
```json
Request:
{
  "tax_rate": 0.085,
  "default_warranty_months": 6
}

Response:
{
  "message": "Settings updated successfully"
}
```

---

## 📤 Export

### GET /export/orders
Export orders to CSV
```json
Query Parameters:
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
- status: (optional)

Response: CSV file download
```

### GET /export/pricing
Export pricing to CSV
```json
Response: CSV file download
```

---

## Error Responses

All endpoints follow this error format:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Device model not found",
    "details": {
      "field": "device_model_id",
      "value": 999
    }
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `INVALID_INPUT` - 400
- `DUPLICATE_ENTRY` - 409
- `INTERNAL_ERROR` - 500
- `LIGHTSPEED_ERROR` - 502

---

## Rate Limiting
- 1000 requests per hour per API key
- Header: `X-RateLimit-Remaining: 998`

---

## Webhooks (Optional Future Feature)
```json
POST to your_webhook_url
{
  "event": "order.status_changed",
  "data": {
    "order_id": 1,
    "order_number": "R20241110-0001",
    "old_status": "in_progress",
    "new_status": "completed"
  },
  "timestamp": "2024-11-10T14:30:00Z"
}
```
