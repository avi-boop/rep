# API Endpoints Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints (except login/register) require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication

### POST /auth/login
Login to system
```json
Request:
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@shop.com",
    "role": "admin"
  }
}
```

### POST /auth/logout
Logout (invalidate token)

### POST /auth/refresh
Refresh JWT token

---

## 2. Repair Orders

### GET /repair-orders
Get all repair orders with filters
```
Query Parameters:
- status: pending|in_progress|completed|etc.
- customer_id: number
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
- assigned_to: user_id
- page: number (default: 1)
- limit: number (default: 20)
- sort: created_at|expected_date (default: created_at)
- order: asc|desc (default: desc)

Example: /repair-orders?status=in_progress&page=1&limit=10
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_number": "RO-00001",
      "status": "in_progress",
      "priority": "normal",
      "customer": {
        "id": 1,
        "name": "John Doe",
        "phone": "(555) 123-4567",
        "email": "john@email.com"
      },
      "device": {
        "id": 9,
        "brand": "Apple",
        "model": "iPhone 13",
        "imei": "123456789012345"
      },
      "items": [
        {
          "id": 1,
          "repair_type": "Front Screen",
          "part_quality": "original",
          "unit_price": 249.99,
          "quantity": 1,
          "total_price": 249.99
        }
      ],
      "total_amount": 249.99,
      "discount_amount": 0,
      "final_amount": 249.99,
      "expected_completion_date": "2023-12-15",
      "assigned_technician": "tech_user",
      "created_at": "2023-12-10T10:30:00Z",
      "updated_at": "2023-12-10T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### GET /repair-orders/:id
Get single repair order details

### POST /repair-orders
Create new repair order
```json
Request:
{
  "customer_id": 1,
  "device_id": 9,
  "device_imei": "123456789012345",
  "device_passcode": "1234",
  "device_condition_notes": "Screen cracked, small dent on corner",
  "priority": "normal",
  "expected_completion_date": "2023-12-15",
  "items": [
    {
      "repair_type_id": 1,
      "part_quality": "original",
      "unit_price": 249.99,
      "quantity": 1,
      "notes": ""
    }
  ],
  "discount_amount": 0,
  "internal_notes": "Customer requested same-day if possible"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "RO-00123",
    ...
  },
  "message": "Repair order created successfully"
}
```

### PUT /repair-orders/:id
Update repair order

### PATCH /repair-orders/:id/status
Update repair order status
```json
Request:
{
  "status": "completed",
  "notes": "Repair completed successfully"
}
```

### DELETE /repair-orders/:id
Cancel repair order (soft delete)

### GET /repair-orders/:id/history
Get repair order activity history

---

## 3. Customers

### GET /customers
Get all customers
```
Query Parameters:
- search: string (name, phone, email)
- page: number
- limit: number
```

### GET /customers/:id
Get customer details with repair history

### POST /customers
Create new customer
```json
Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@email.com",
  "phone": "(555) 123-4567",
  "notification_preferences": {
    "sms": true,
    "email": true,
    "push": false
  },
  "notes": "VIP customer"
}
```

### PUT /customers/:id
Update customer

### GET /customers/:id/repairs
Get customer repair history

### POST /customers/:id/merge
Merge duplicate customers

---

## 4. Devices

### GET /devices
Get all devices
```
Query Parameters:
- brand: string
- device_type: phone|tablet
- search: string
- page: number
- limit: number
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 9,
      "brand": "Apple",
      "model": "iPhone 13",
      "device_type": "phone",
      "model_year": 2021,
      "release_date": "2021-09-24"
    }
  ]
}
```

### GET /devices/:id
Get device details

### POST /devices
Add new device model
```json
Request:
{
  "brand": "Apple",
  "model": "iPhone 15 Pro",
  "device_type": "phone",
  "model_year": 2023,
  "release_date": "2023-09-22"
}
```

### PUT /devices/:id
Update device

### GET /devices/brands
Get list of unique brands

---

## 5. Pricing

### GET /pricing
Get all pricing with filters
```
Query Parameters:
- device_id: number
- repair_type_id: number
- part_quality: original|aftermarket
- brand: string
- is_estimated: boolean
- search: string
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device": {
        "id": 9,
        "brand": "Apple",
        "model": "iPhone 13"
      },
      "repair_type": {
        "id": 1,
        "name": "Front Screen"
      },
      "part_quality": "original",
      "cost_price": 150.00,
      "selling_price": 249.99,
      "profit_margin": 99.99,
      "is_estimated": false,
      "confidence_score": null
    }
  ]
}
```

### GET /pricing/lookup
Quick price lookup
```
Query Parameters:
- device_id: number
- repair_type_id: number
- part_quality: original|aftermarket

Response:
{
  "success": true,
  "data": {
    "price": 249.99,
    "is_estimated": false,
    "confidence_score": null
  }
}
```

### POST /pricing
Add new price
```json
Request:
{
  "device_id": 9,
  "repair_type_id": 1,
  "part_quality": "original",
  "cost_price": 150.00,
  "selling_price": 249.99,
  "notes": ""
}
```

### PUT /pricing/:id
Update price

### DELETE /pricing/:id
Delete price

### POST /pricing/bulk-update
Bulk update prices
```json
Request:
{
  "filter": {
    "brand": "Apple",
    "part_quality": "aftermarket"
  },
  "action": "increase_by_percentage",
  "value": 10
}
```

### POST /pricing/smart-estimate
Generate smart price estimates
```json
Request:
{
  "device_id": 10,
  "repair_type_id": 1,
  "part_quality": "original"
}

Response:
{
  "success": true,
  "data": {
    "estimated_price": 239.99,
    "confidence_score": 85,
    "based_on": [
      {
        "device": "iPhone 12",
        "price": 229.99
      },
      {
        "device": "iPhone 13",
        "price": 249.99
      }
    ]
  }
}
```

### POST /pricing/confirm-estimate/:id
Convert estimated price to fixed price

---

## 6. Repair Types

### GET /repair-types
Get all repair types

### POST /repair-types
Add new repair type

### PUT /repair-types/:id
Update repair type

### DELETE /repair-types/:id
Delete repair type

---

## 7. Inventory

### GET /inventory
Get inventory items
```
Query Parameters:
- device_id: number
- repair_type_id: number
- part_quality: original|aftermarket
- low_stock: boolean
```

### GET /inventory/:id
Get inventory item details

### POST /inventory
Add inventory item

### PUT /inventory/:id
Update inventory item

### PATCH /inventory/:id/adjust
Adjust stock quantity
```json
Request:
{
  "quantity_change": -2,
  "transaction_type": "usage",
  "repair_order_id": 123,
  "notes": "Used for repair RO-00123"
}
```

### GET /inventory/low-stock
Get low stock items

### GET /inventory/:id/transactions
Get inventory transaction history

---

## 8. Notifications

### POST /notifications/send
Send notification to customer
```json
Request:
{
  "customer_id": 1,
  "repair_order_id": 123,
  "template_id": 3,
  "notification_type": "sms",
  "custom_message": "Optional custom message"
}
```

### GET /notifications/templates
Get notification templates

### POST /notifications/templates
Create notification template

### PUT /notifications/templates/:id
Update notification template

### GET /notifications/log
Get notification history
```
Query Parameters:
- customer_id: number
- repair_order_id: number
- status: sent|failed|pending
- notification_type: sms|email|push
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
```

### POST /notifications/resend/:id
Resend failed notification

---

## 9. Reports & Analytics

### GET /reports/dashboard
Get dashboard summary
```json
Response:
{
  "success": true,
  "data": {
    "today": {
      "repairs": 15,
      "revenue": 2499.85,
      "pending_repairs": 8,
      "completed_repairs": 7
    },
    "this_week": {
      "repairs": 87,
      "revenue": 15234.50
    },
    "this_month": {
      "repairs": 324,
      "revenue": 58923.75
    },
    "status_breakdown": {
      "pending": 12,
      "in_progress": 23,
      "awaiting_parts": 5,
      "completed": 8,
      "ready_for_pickup": 15
    },
    "popular_repairs": [
      {
        "repair_type": "Front Screen",
        "count": 145,
        "revenue": 35623.55
      }
    ],
    "device_breakdown": {
      "Apple": 210,
      "Samsung": 98,
      "Other": 16
    }
  }
}
```

### GET /reports/revenue
Revenue report
```
Query Parameters:
- period: daily|weekly|monthly|yearly
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
- group_by: day|week|month|repair_type|device
```

### GET /reports/repairs
Repairs report
```
Query Parameters:
- date_from: YYYY-MM-DD
- date_to: YYYY-MM-DD
- group_by: status|device|repair_type|technician
- format: json|csv|pdf
```

### GET /reports/inventory
Inventory report

### GET /reports/customer-satisfaction
Customer satisfaction report

### GET /reports/technician-performance
Technician performance report

---

## 10. Lightspeed Integration

### POST /lightspeed/sync
Trigger manual sync
```json
Request:
{
  "sync_type": "customers", // customers|orders|products|inventory
  "force": false
}
```

### GET /lightspeed/status
Get sync status

### GET /lightspeed/sync-log
Get sync history

### POST /lightspeed/connect
Connect Lightspeed account
```json
Request:
{
  "api_key": "your_api_key",
  "account_id": "your_account_id"
}
```

### DELETE /lightspeed/disconnect
Disconnect Lightspeed

---

## 11. Users (Admin only)

### GET /users
Get all users

### POST /users
Create new user

### PUT /users/:id
Update user

### DELETE /users/:id
Delete user

### PATCH /users/:id/password
Change user password

### GET /users/:id/activity
Get user activity log

---

## 12. Settings

### GET /settings
Get system settings

### PUT /settings
Update settings
```json
Request:
{
  "shop_name": "Mobile Repair Shop",
  "shop_address": "123 Main St",
  "shop_phone": "(555) 123-4567",
  "shop_email": "info@repairshop.com",
  "currency": "USD",
  "timezone": "America/New_York",
  "default_warranty_days": 90,
  "notification_settings": {
    "sms_enabled": true,
    "email_enabled": true,
    "twilio_sid": "xxx",
    "twilio_token": "xxx",
    "sendgrid_api_key": "xxx"
  },
  "business_hours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    ...
  }
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input data (400)
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Not authorized for this action (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `INTERNAL_ERROR` - Server error (500)

---

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per API key

## Webhooks (Optional)
Configure webhooks to receive real-time updates:
- `repair_order.created`
- `repair_order.status_changed`
- `repair_order.completed`
- `inventory.low_stock`
- `customer.created`

---

## WebSocket Events (Real-time Updates)

Connect to: `ws://localhost:3000/ws`

Subscribe to events:
```json
{
  "action": "subscribe",
  "channels": ["repair_orders", "notifications"]
}
```

Events received:
```json
{
  "event": "repair_order.updated",
  "data": {
    "id": 123,
    "order_number": "RO-00123",
    "status": "completed",
    "updated_at": "2023-12-10T15:30:00Z"
  }
}
```
