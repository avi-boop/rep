# 🔌 API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api` (development)  
**Authentication:** Not implemented (add NextAuth.js)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Brands API](#brands-api)
4. [Device Models API](#device-models-api)
5. [Repair Types API](#repair-types-api)
6. [Part Types API](#part-types-api)
7. [Pricing API](#pricing-api)
8. [Customers API](#customers-api)
9. [Repairs API](#repairs-api)
10. [Settings API](#settings-api)
11. [Integrations API](#integrations-api)
12. [Error Handling](#error-handling)

---

## 🎯 Overview

All API endpoints return JSON responses. The API follows RESTful conventions.

### Base Response Format

**Success:**
```json
{
  "id": 1,
  "name": "Apple",
  "createdAt": "2025-11-10T00:00:00Z"
}
```

**Error:**
```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔐 Authentication

**Status:** Not implemented

**Planned Implementation:**
```
Authorization: Bearer <jwt_token>
```

**Future endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get current session

---

## 📱 Brands API

### List All Brands

```http
GET /api/brands
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Apple",
    "isPrimary": true,
    "logoUrl": null,
    "createdAt": "2025-11-10T00:00:00Z",
    "updatedAt": "2025-11-10T00:00:00Z"
  }
]
```

### Create Brand

```http
POST /api/brands
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "OnePlus",
  "isPrimary": false,
  "logoUrl": "https://example.com/logo.png"
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "name": "OnePlus",
  "isPrimary": false,
  "logoUrl": "https://example.com/logo.png",
  "createdAt": "2025-11-10T00:00:00Z",
  "updatedAt": "2025-11-10T00:00:00Z"
}
```

---

## 📱 Device Models API

### List Device Models

```http
GET /api/device-models?brandId=1
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| brandId | number | Filter by brand ID (optional) |

**Response:**
```json
[
  {
    "id": 1,
    "brandId": 1,
    "name": "iPhone 15 Pro Max",
    "modelNumber": "A2894",
    "releaseYear": 2023,
    "deviceType": "phone",
    "screenSize": 6.7,
    "isActive": true,
    "brand": {
      "id": 1,
      "name": "Apple"
    }
  }
]
```

### Create Device Model

```http
POST /api/device-models
Content-Type: application/json
```

**Request Body:**
```json
{
  "brandId": 1,
  "name": "iPhone 16 Pro",
  "modelNumber": "A3000",
  "releaseYear": 2024,
  "deviceType": "phone",
  "screenSize": 6.3,
  "isActive": true
}
```

**Response:** `201 Created`

---

## 🔧 Repair Types API

### List Repair Types

```http
GET /api/repair-types
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Screen Replacement",
    "category": "Display",
    "description": "Replace cracked or damaged screen",
    "estimatedDuration": 60,
    "isActive": true,
    "createdAt": "2025-11-10T00:00:00Z",
    "updatedAt": "2025-11-10T00:00:00Z"
  }
]
```

### Create Repair Type

```http
POST /api/repair-types
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Water Damage Repair",
  "category": "Component",
  "description": "Dry and clean water-damaged device",
  "estimatedDuration": 180,
  "isActive": true
}
```

---

## 🔩 Part Types API

### List Part Types

```http
GET /api/part-types
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "OEM (Original)",
    "qualityLevel": 5,
    "warrantyMonths": 12,
    "description": "Original manufacturer parts",
    "isActive": true
  },
  {
    "id": 2,
    "name": "Aftermarket Premium",
    "qualityLevel": 4,
    "warrantyMonths": 6,
    "description": "High-quality aftermarket parts",
    "isActive": true
  }
]
```

### Create Part Type

```http
POST /api/part-types
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Aftermarket Standard",
  "qualityLevel": 3,
  "warrantyMonths": 3,
  "description": "Standard quality aftermarket parts",
  "isActive": true
}
```

---

## 💰 Pricing API

### List All Pricing

```http
GET /api/pricing?deviceModelId=1
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| deviceModelId | number | Filter by device model (optional) |
| repairTypeId | number | Filter by repair type (optional) |

**Response:**
```json
[
  {
    "id": 1,
    "deviceModelId": 1,
    "repairTypeId": 1,
    "partTypeId": 1,
    "price": 299.99,
    "cost": 150.00,
    "isActive": true,
    "isEstimated": false,
    "confidenceScore": 1.0,
    "deviceModel": {
      "id": 1,
      "name": "iPhone 15 Pro Max",
      "brand": {
        "name": "Apple"
      }
    },
    "repairType": {
      "id": 1,
      "name": "Screen Replacement"
    },
    "partType": {
      "id": 1,
      "name": "OEM (Original)"
    }
  }
]
```

### Create Pricing

```http
POST /api/pricing
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceModelId": 1,
  "repairTypeId": 1,
  "partTypeId": 1,
  "price": 299.99,
  "cost": 150.00,
  "isActive": true,
  "notes": "Standard pricing for 2025"
}
```

### Update Pricing

```http
PUT /api/pricing
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": 1,
  "price": 319.99,
  "cost": 160.00,
  "notes": "Price increase due to parts cost"
}
```

### Estimate Price

```http
POST /api/pricing/estimate
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceModelId": 5,
  "repairTypeId": 1,
  "partTypeId": 1
}
```

**Response:**
```json
{
  "price": 275.00,
  "isEstimated": true,
  "confidenceScore": 0.85,
  "method": "interpolation",
  "explanation": "Estimated based on similar iPhone models"
}
```

---

## 👥 Customers API

### List All Customers

```http
GET /api/customers?search=john
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name, email, or phone |
| limit | number | Number of results (default: 50) |
| offset | number | Pagination offset |

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "notificationPreferences": {
      "sms": true,
      "email": true,
      "push": false
    },
    "isActive": true,
    "createdAt": "2025-11-10T00:00:00Z"
  }
]
```

### Get Customer by ID

```http
GET /api/customers/1
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "notificationPreferences": {
    "sms": true,
    "email": true
  },
  "notes": "VIP customer",
  "isActive": true,
  "repairOrders": [
    {
      "id": 1,
      "orderNumber": "R20251110-0001",
      "status": "completed",
      "totalPrice": 299.99
    }
  ]
}
```

### Create Customer

```http
POST /api/customers
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567891",
  "notificationPreferences": {
    "sms": true,
    "email": true,
    "push": false
  },
  "notes": "Prefers morning appointments"
}
```

### Update Customer

```http
PUT /api/customers/1
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "notificationPreferences": {
    "sms": false,
    "email": true
  }
}
```

### Delete Customer

```http
DELETE /api/customers/1
```

**Response:** `200 OK`
```json
{
  "message": "Customer deleted successfully"
}
```

---

## 🔧 Repairs API

### List All Repairs

```http
GET /api/repairs?status=in_progress&customerId=1
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| customerId | number | Filter by customer |
| priority | string | Filter by priority |
| fromDate | string | Filter from date (ISO 8601) |
| toDate | string | Filter to date (ISO 8601) |

**Response:**
```json
[
  {
    "id": 1,
    "orderNumber": "R20251110-0001",
    "customerId": 1,
    "deviceModelId": 1,
    "status": "in_progress",
    "priority": "normal",
    "totalPrice": 299.99,
    "depositPaid": 50.00,
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    },
    "deviceModel": {
      "name": "iPhone 15 Pro Max",
      "brand": {
        "name": "Apple"
      }
    },
    "repairOrderItems": [
      {
        "repairType": {
          "name": "Screen Replacement"
        },
        "partType": {
          "name": "OEM (Original)"
        },
        "unitPrice": 299.99,
        "quantity": 1,
        "totalPrice": 299.99
      }
    ],
    "createdAt": "2025-11-10T00:00:00Z"
  }
]
```

### Get Repair by ID

```http
GET /api/repairs/1
```

**Response:** Includes full repair details with all relationships

### Create Repair

```http
POST /api/repairs
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerId": 1,
  "deviceModelId": 1,
  "deviceImei": "123456789012345",
  "deviceSerial": "SERIAL123",
  "devicePassword": "1234",
  "status": "pending",
  "priority": "normal",
  "issueDescription": "Cracked screen, needs replacement",
  "cosmeticCondition": "Good condition otherwise",
  "estimatedCompletion": "2025-11-12T00:00:00Z",
  "totalPrice": 299.99,
  "depositPaid": 50.00,
  "items": [
    {
      "repairTypeId": 1,
      "partTypeId": 1,
      "pricingId": 1,
      "quantity": 1,
      "unitPrice": 299.99,
      "discount": 0,
      "totalPrice": 299.99
    }
  ]
}
```

**Response:** `201 Created` with full repair object

### Update Repair

```http
PUT /api/repairs/1
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed",
  "actualCompletion": "2025-11-11T00:00:00Z",
  "depositPaid": 299.99
}
```

### Update Repair Status

```http
PATCH /api/repairs/1/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "ready_pickup",
  "notes": "Customer notified via SMS"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "ready_pickup",
  "message": "Status updated successfully"
}
```

### Delete Repair

```http
DELETE /api/repairs/1
```

---

## ⚙️ Settings API

### Get Settings

```http
GET /api/settings
```

**Response:**
```json
{
  "shopName": "Mobile Repair Pro",
  "taxRate": 0.08,
  "currency": "USD",
  "timezone": "America/New_York",
  "notifications": {
    "sms": {
      "enabled": true,
      "provider": "twilio"
    },
    "email": {
      "enabled": true,
      "provider": "sendgrid"
    }
  }
}
```

### Update Settings

```http
PUT /api/settings
Content-Type: application/json
```

**Request Body:**
```json
{
  "shopName": "My Repair Shop",
  "taxRate": 0.10
}
```

---

## 🔌 Integrations API

### Lightspeed POS

#### Sync Customers

```http
POST /api/integrations/lightspeed/customers
Content-Type: application/json
```

**Request Body:**
```json
{
  "syncDirection": "pull",
  "fullSync": false
}
```

**Response:**
```json
{
  "success": true,
  "synced": 25,
  "errors": 0,
  "lastSyncAt": "2025-11-10T00:00:00Z"
}
```

#### Get Pricing from Lightspeed

```http
GET /api/integrations/lightspeed/pricing
```

### Gemini AI Pricing

```http
POST /api/integrations/gemini/pricing
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceModel": "iPhone 15 Pro",
  "repairType": "Screen Replacement",
  "partQuality": "OEM"
}
```

**Response:**
```json
{
  "suggestedPrice": 299.99,
  "marketAverage": 275.00,
  "competitorPrices": [280, 290, 300],
  "confidence": 0.92,
  "reasoning": "Based on market analysis and competitor pricing"
}
```

---

## 🚨 Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid input data |
| NOT_FOUND | Resource not found |
| DUPLICATE_ENTRY | Record already exists |
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Insufficient permissions |
| SERVER_ERROR | Internal server error |

### Example Errors

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "phone": "Phone number required"
  }
}
```

**Not Found (404):**
```json
{
  "error": "Customer not found",
  "code": "NOT_FOUND"
}
```

---

## 📊 Rate Limiting

**Status:** Not implemented

**Planned:**
- 100 requests per minute per IP
- 1000 requests per hour per user
- Rate limit headers in response

---

## 🔒 Security

### Current Implementation
- Input validation via TypeScript types
- SQL injection prevention (Prisma ORM)
- CORS enabled for same-origin only

### Planned Security Features
- JWT authentication
- Role-based access control (RBAC)
- Rate limiting
- API key authentication
- Request signing
- Audit logging

---

## 📝 Examples

### Create Complete Repair Flow

```javascript
// 1. Check if customer exists
const customers = await fetch('/api/customers?search=john@example.com')
const customer = customers[0]

// 2. Get device models
const devices = await fetch('/api/device-models?brandId=1')

// 3. Get pricing
const pricing = await fetch('/api/pricing?deviceModelId=1&repairTypeId=1')

// 4. Create repair order
const repair = await fetch('/api/repairs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: customer.id,
    deviceModelId: 1,
    items: [{
      repairTypeId: 1,
      partTypeId: 1,
      unitPrice: pricing[0].price,
      totalPrice: pricing[0].price
    }]
  })
})

// 5. Update status
await fetch(`/api/repairs/${repair.id}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'in_progress' })
})
```

---

## 🧪 Testing

### cURL Examples

```bash
# List brands
curl http://localhost:3000/api/brands

# Create brand
curl -X POST http://localhost:3000/api/brands \
  -H "Content-Type: application/json" \
  -d '{"name":"Xiaomi","isPrimary":false}'

# Get specific repair
curl http://localhost:3000/api/repairs/1

# Update repair status
curl -X PATCH http://localhost:3000/api/repairs/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

*Last Updated: November 10, 2025*  
*API Version: 1.0.0*
