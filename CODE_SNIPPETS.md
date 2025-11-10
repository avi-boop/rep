# Mobile Repair Dashboard - Code Snippets

Essential code snippets for implementing key features of the mobile repair dashboard.

---

## Table of Contents
1. [Smart Pricing Algorithm](#1-smart-pricing-algorithm)
2. [Authentication & JWT](#2-authentication--jwt)
3. [Notification System](#3-notification-system)
4. [File Upload](#4-file-upload)
5. [Lightspeed Integration](#5-lightspeed-integration)
6. [WebSocket Real-time Updates](#6-websocket-real-time-updates)
7. [Database Queries](#7-database-queries)
8. [Error Handling](#8-error-handling)

---

## 1. Smart Pricing Algorithm

### Backend: Price Estimation Service

```typescript
// backend/src/services/smartPricing.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceEstimate {
  price: number;
  isEstimated: boolean;
  confidenceScore: number;
  method: 'exact' | 'interpolated' | 'extrapolated' | 'category_average';
  similarPrices: Array<{
    deviceModel: string;
    price: number;
  }>;
}

export class SmartPricingService {
  /**
   * Get price for a specific device, repair type, and part quality
   * Uses smart estimation if exact price not found
   */
  async getPrice(
    deviceId: number,
    repairTypeId: number,
    partQuality: 'Original' | 'Aftermarket'
  ): Promise<PriceEstimate> {
    // First, try to find exact match
    const exactPrice = await prisma.priceList.findFirst({
      where: {
        deviceId,
        repairTypeId,
        partQuality,
        effectiveUntil: null, // Current price
      },
      include: {
        device: true,
        repairType: true,
      },
    });

    if (exactPrice) {
      return {
        price: exactPrice.price.toNumber(),
        isEstimated: false,
        confidenceScore: 100,
        method: 'exact',
        similarPrices: [],
      };
    }

    // No exact match - use smart estimation
    return await this.estimatePrice(deviceId, repairTypeId, partQuality);
  }

  /**
   * Estimate price using interpolation or extrapolation
   */
  private async estimatePrice(
    deviceId: number,
    repairTypeId: number,
    partQuality: 'Original' | 'Aftermarket'
  ): Promise<PriceEstimate> {
    // Get the target device details
    const targetDevice = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!targetDevice) {
      throw new Error('Device not found');
    }

    // Find similar devices with known prices (same brand, repair type, part quality)
    const similarPrices = await prisma.priceList.findMany({
      where: {
        repairTypeId,
        partQuality,
        effectiveUntil: null,
        device: {
          brand: targetDevice.brand,
          deviceCategory: targetDevice.deviceCategory,
        },
      },
      include: {
        device: true,
      },
      orderBy: {
        device: {
          releaseYear: 'asc',
        },
      },
    });

    if (similarPrices.length === 0) {
      // No similar prices - use category average
      return await this.getCategoryAverage(repairTypeId, partQuality);
    }

    // Try linear interpolation
    const interpolated = this.linearInterpolation(
      targetDevice,
      similarPrices.map(p => ({
        device: p.device,
        price: p.price.toNumber(),
      }))
    );

    if (interpolated) {
      return interpolated;
    }

    // If interpolation fails, extrapolate from nearest price
    return this.extrapolatePrice(targetDevice, similarPrices);
  }

  /**
   * Linear interpolation between two known prices
   */
  private linearInterpolation(
    targetDevice: any,
    knownPrices: Array<{ device: any; price: number }>
  ): PriceEstimate | null {
    if (!targetDevice.releaseYear) return null;

    // Find the closest devices before and after target
    let lowerBound: typeof knownPrices[0] | null = null;
    let upperBound: typeof knownPrices[0] | null = null;

    for (const known of knownPrices) {
      if (!known.device.releaseYear) continue;

      if (known.device.releaseYear <= targetDevice.releaseYear) {
        if (!lowerBound || known.device.releaseYear > lowerBound.device.releaseYear) {
          lowerBound = known;
        }
      }

      if (known.device.releaseYear >= targetDevice.releaseYear) {
        if (!upperBound || known.device.releaseYear < upperBound.device.releaseYear) {
          upperBound = known;
        }
      }
    }

    // Need both bounds for interpolation
    if (!lowerBound || !upperBound || lowerBound === upperBound) {
      return null;
    }

    // Calculate position between bounds (0 to 1)
    const yearDiff = upperBound.device.releaseYear - lowerBound.device.releaseYear;
    const targetYearDiff = targetDevice.releaseYear - lowerBound.device.releaseYear;
    const position = targetYearDiff / yearDiff;

    // Linear interpolation
    const priceDiff = upperBound.price - lowerBound.price;
    const estimatedPrice = lowerBound.price + (priceDiff * position);

    return {
      price: Math.round(estimatedPrice * 100) / 100, // Round to 2 decimals
      isEstimated: true,
      confidenceScore: 85, // High confidence with bounded interpolation
      method: 'interpolated',
      similarPrices: [
        { deviceModel: lowerBound.device.model, price: lowerBound.price },
        { deviceModel: upperBound.device.model, price: upperBound.price },
      ],
    };
  }

  /**
   * Extrapolate price from nearest known price
   */
  private extrapolatePrice(
    targetDevice: any,
    similarPrices: any[]
  ): PriceEstimate {
    // Find nearest device by release year
    let nearest = similarPrices[0];
    let minDiff = Math.abs(
      (targetDevice.releaseYear || 0) - (nearest.device.releaseYear || 0)
    );

    for (const similar of similarPrices) {
      const diff = Math.abs(
        (targetDevice.releaseYear || 0) - (similar.device.releaseYear || 0)
      );
      if (diff < minDiff) {
        minDiff = diff;
        nearest = similar;
      }
    }

    // Apply adjustment factor based on year difference
    const yearDiff = (targetDevice.releaseYear || 0) - (nearest.device.releaseYear || 0);
    const adjustmentRate = 0.10; // 10% price increase per year (newer devices)
    const adjustment = 1 + (yearDiff * adjustmentRate);
    const estimatedPrice = nearest.price.toNumber() * adjustment;

    return {
      price: Math.round(estimatedPrice * 100) / 100,
      isEstimated: true,
      confidenceScore: 60, // Lower confidence with extrapolation
      method: 'extrapolated',
      similarPrices: [
        { deviceModel: nearest.device.model, price: nearest.price.toNumber() },
      ],
    };
  }

  /**
   * Calculate category average as fallback
   */
  private async getCategoryAverage(
    repairTypeId: number,
    partQuality: 'Original' | 'Aftermarket'
  ): Promise<PriceEstimate> {
    const avgResult = await prisma.priceList.aggregate({
      where: {
        repairTypeId,
        partQuality,
        effectiveUntil: null,
      },
      _avg: {
        price: true,
      },
    });

    const avgPrice = avgResult._avg.price?.toNumber() || 100;

    return {
      price: Math.round(avgPrice * 100) / 100,
      isEstimated: true,
      confidenceScore: 40, // Low confidence with category average
      method: 'category_average',
      similarPrices: [],
    };
  }

  /**
   * Log estimated price usage for learning
   */
  async logPriceUsage(
    deviceId: number,
    repairTypeId: number,
    partQuality: string,
    estimatedPrice: number,
    actualPriceUsed: number,
    wasEstimated: boolean
  ): Promise<void> {
    await prisma.pricingHistory.create({
      data: {
        deviceId,
        repairTypeId,
        partQuality,
        estimatedPrice,
        actualPriceUsed,
        wasEstimated,
      },
    });
  }
}
```

### API Endpoint

```typescript
// backend/src/routes/prices.ts

import express from 'express';
import { SmartPricingService } from '../services/smartPricing.service';

const router = express.Router();
const pricingService = new SmartPricingService();

/**
 * GET /api/prices/estimate
 * Get price estimate for a device repair
 */
router.get('/estimate', async (req, res) => {
  try {
    const { deviceId, repairTypeId, partQuality } = req.query;

    if (!deviceId || !repairTypeId || !partQuality) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const estimate = await pricingService.getPrice(
      parseInt(deviceId as string),
      parseInt(repairTypeId as string),
      partQuality as 'Original' | 'Aftermarket'
    );

    res.json(estimate);
  } catch (error) {
    console.error('Price estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate price' });
  }
});

export default router;
```

---

## 2. Authentication & JWT

### Authentication Service

```typescript
// backend/src/services/auth.service.ts

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export class AuthService {
  /**
   * Login user and generate JWT
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.active) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      // Log failed attempt
      await this.logLoginAttempt(email, false);
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    const isLocked = await this.isAccountLocked(email);
    if (isLocked) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    // Generate JWT
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log successful login
    await this.logLoginAttempt(email, true);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.email.split('@')[0],
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'front_desk',
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Track login attempts for account lockout
   */
  private async logLoginAttempt(email: string, success: boolean) {
    await prisma.activityLog.create({
      data: {
        action: success ? 'login_success' : 'login_failed',
        entityType: 'user',
        entityId: email,
        changes: JSON.stringify({ timestamp: new Date() }),
        ipAddress: 'TODO: Get from request',
      },
    });
  }

  /**
   * Check if account is locked due to failed attempts
   */
  private async isAccountLocked(email: string): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedAttempts = await prisma.activityLog.count({
      where: {
        action: 'login_failed',
        entityId: email,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    return failedAttempts >= 5;
  }
}
```

### Auth Middleware

```typescript
// backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

/**
 * Verify JWT token middleware
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const payload = authService.verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Check user role middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Usage in Routes

```typescript
// backend/src/routes/repairOrders.ts

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Anyone can view repair orders
router.get('/', async (req, res) => {
  // ... get repair orders
});

// Only admin and manager can delete
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  // ... delete repair order
});

export default router;
```

---

## 3. Notification System

### Notification Service

```typescript
// backend/src/services/notification.service.ts

import twilio from 'twilio';
import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface NotificationTemplate {
  sms?: string;
  email?: {
    subject: string;
    html: string;
  };
}

export class NotificationService {
  /**
   * Send notification to customer
   */
  async sendNotification(
    repairOrderId: number,
    templateName: string,
    customData?: Record<string, any>
  ) {
    // Get repair order with customer details
    const order = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        customerDevice: {
          include: { device: true },
        },
        repairOrderItems: {
          include: { repairType: true },
        },
      },
    });

    if (!order) {
      throw new Error('Repair order not found');
    }

    // Get template
    const template = this.getTemplate(templateName);
    
    // Prepare variables
    const variables = {
      customer_name: `${order.customer.firstName} ${order.customer.lastName}`,
      device_brand: order.customerDevice.device.brand,
      device_model: order.customerDevice.device.model,
      order_number: order.orderNumber,
      estimated_completion_date: order.estimatedCompletionAt?.toLocaleDateString(),
      total_price: order.totalPrice.toString(),
      business_name: process.env.BUSINESS_NAME,
      business_phone: process.env.BUSINESS_PHONE,
      business_address: process.env.BUSINESS_ADDRESS,
      ...customData,
    };

    // Send SMS if enabled
    if (template.sms && this.shouldSendSMS(order.customer)) {
      await this.sendSMS(
        order.customer.phone,
        this.replaceVariables(template.sms, variables),
        repairOrderId
      );
    }

    // Send email if enabled
    if (template.email && this.shouldSendEmail(order.customer)) {
      await this.sendEmail(
        order.customer.email!,
        this.replaceVariables(template.email.subject, variables),
        this.replaceVariables(template.email.html, variables),
        repairOrderId
      );
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(
    to: string,
    message: string,
    repairOrderId: number
  ): Promise<void> {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          repairOrderId,
          customerId: (await prisma.repairOrder.findUnique({ where: { id: repairOrderId } }))!.customerId,
          type: 'sms',
          templateName: 'generic',
          recipient: to,
          message,
          status: 'pending',
        },
      });

      // Send SMS
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log('SMS sent:', result.sid);
    } catch (error) {
      console.error('SMS send error:', error);
      
      // Log failure
      await prisma.notification.updateMany({
        where: {
          repairOrderId,
          type: 'sms',
          status: 'pending',
        },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
        },
      });
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    repairOrderId: number
  ): Promise<void> {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          repairOrderId,
          customerId: (await prisma.repairOrder.findUnique({ where: { id: repairOrderId } }))!.customerId,
          type: 'email',
          templateName: 'generic',
          recipient: to,
          subject,
          message: html,
          status: 'pending',
        },
      });

      // Send email
      await sgMail.send({
        to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL!,
          name: process.env.BUSINESS_NAME!,
        },
        subject,
        html,
      });

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      console.log('Email sent to:', to);
    } catch (error) {
      console.error('Email send error:', error);
      
      // Log failure
      await prisma.notification.updateMany({
        where: {
          repairOrderId,
          type: 'email',
          status: 'pending',
        },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
        },
      });
    }
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value || '');
    }
    return result;
  }

  /**
   * Check customer's preference for SMS
   */
  private shouldSendSMS(customer: any): boolean {
    return customer.preferredContactMethod === 'SMS' || customer.preferredContactMethod === 'Both';
  }

  /**
   * Check customer's preference for email
   */
  private shouldSendEmail(customer: any): boolean {
    return customer.email && (customer.preferredContactMethod === 'Email' || customer.preferredContactMethod === 'Both');
  }

  /**
   * Get notification template
   */
  private getTemplate(name: string): NotificationTemplate {
    const templates: Record<string, NotificationTemplate> = {
      REPAIR_RECEIVED: {
        sms: "Hi {customer_name}, we've received your {device_brand} {device_model} for repair. Order #{order_number}. Est. completion: {estimated_completion_date}.",
        email: {
          subject: 'Repair Received - Order #{order_number}',
          html: '<html>...</html>', // Full template here
        },
      },
      // Add more templates...
    };

    return templates[name] || templates.REPAIR_RECEIVED;
  }
}
```

---

**(Continued in next message due to length...)**

Would you like me to continue with the remaining code snippets (File Upload, Lightspeed Integration, WebSocket, Database Queries, Error Handling)?
