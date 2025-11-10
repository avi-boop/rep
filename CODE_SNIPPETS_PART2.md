# Mobile Repair Dashboard - Code Snippets (Part 2)

Continuation of essential code snippets.

---

## 4. File Upload

### File Upload Service

```typescript
// backend/src/services/fileUpload.service.ts

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter (accept only images and PDFs)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'));
  }
};

// Multer upload configuration
export const upload = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// S3 upload service
export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET!;
  }

  /**
   * Upload file to S3
   */
  async uploadToS3(file: Express.Multer.File, folder: string = 'repairs'): Promise<string> {
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }
}
```

### File Upload Route

```typescript
// backend/src/routes/uploads.ts

import express from 'express';
import { upload, S3UploadService } from '../services/fileUpload.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const s3Service = new S3UploadService();

/**
 * POST /api/uploads/repair-photo
 * Upload repair order photo
 */
router.post(
  '/repair-photo',
  authenticate,
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let fileUrl: string;

      if (process.env.STORAGE_TYPE === 's3') {
        // Upload to S3
        fileUrl = await s3Service.uploadToS3(req.file, 'repairs');
      } else {
        // Local storage
        fileUrl = `/uploads/${req.file.filename}`;
      }

      res.json({
        success: true,
        fileUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  }
);

/**
 * POST /api/uploads/multiple
 * Upload multiple photos
 */
router.post(
  '/multiple',
  authenticate,
  upload.array('photos', 5), // Max 5 photos
  async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const urls = await Promise.all(
        req.files.map(file =>
          process.env.STORAGE_TYPE === 's3'
            ? s3Service.uploadToS3(file, 'repairs')
            : Promise.resolve(`/uploads/${file.filename}`)
        )
      );

      res.json({
        success: true,
        files: urls.map((url, i) => ({
          url,
          filename: req.files![i].filename,
          size: req.files![i].size,
        })),
      });
    } catch (error) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  }
);

export default router;
```

---

## 5. Lightspeed Integration

### Lightspeed Service

```typescript
// backend/src/services/lightspeed.service.ts

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LightspeedCustomer {
  customerID: string;
  firstName: string;
  lastName: string;
  contact: {
    phone: string;
    email: string;
    addresses: Array<{
      address1: string;
      city: string;
      state: string;
      zip: string;
    }>;
  };
}

export class LightspeedService {
  private apiUrl: string;
  private accountId: string;
  private accessToken: string;

  constructor() {
    this.apiUrl = process.env.LIGHTSPEED_API_URL!;
    this.accountId = process.env.LIGHTSPEED_ACCOUNT_ID!;
    this.accessToken = process.env.LIGHTSPEED_ACCESS_TOKEN!;
  }

  /**
   * Get customer from Lightspeed by ID
   */
  async getCustomer(lightspeedCustomerId: string): Promise<LightspeedCustomer> {
    const response = await axios.get(
      `${this.apiUrl}/Account/${this.accountId}/Customer/${lightspeedCustomerId}.json`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    return response.data.Customer;
  }

  /**
   * Search for customer by phone
   */
  async searchCustomerByPhone(phone: string): Promise<LightspeedCustomer[]> {
    const response = await axios.get(
      `${this.apiUrl}/Account/${this.accountId}/Customer.json`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          phone: phone.replace(/\D/g, ''), // Remove non-digits
        },
      }
    );

    return response.data.Customer || [];
  }

  /**
   * Sync customer from Lightspeed to local database
   */
  async syncCustomer(lightspeedCustomerId: string): Promise<number> {
    const lsCustomer = await this.getCustomer(lightspeedCustomerId);

    // Check if customer already exists locally
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { lightspeedCustomerId: lsCustomer.customerID },
          { phone: lsCustomer.contact.phone },
          { email: lsCustomer.contact.email },
        ],
      },
    });

    const address = lsCustomer.contact.addresses?.[0];

    const customerData = {
      lightspeedCustomerId: lsCustomer.customerID,
      firstName: lsCustomer.firstName,
      lastName: lsCustomer.lastName,
      phone: lsCustomer.contact.phone,
      email: lsCustomer.contact.email || null,
      address: address?.address1 || null,
      city: address?.city || null,
      state: address?.state || null,
      zip: address?.zip || null,
    };

    if (existing) {
      // Update existing customer
      await prisma.customer.update({
        where: { id: existing.id },
        data: customerData,
      });
      return existing.id;
    } else {
      // Create new customer
      const newCustomer = await prisma.customer.create({
        data: customerData,
      });
      return newCustomer.id;
    }
  }

  /**
   * Sync all customers (one-time initial sync)
   */
  async syncAllCustomers(): Promise<{ synced: number; errors: number }> {
    let page = 1;
    let totalSynced = 0;
    let totalErrors = 0;

    while (true) {
      try {
        const response = await axios.get(
          `${this.apiUrl}/Account/${this.accountId}/Customer.json`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            params: {
              limit: 100,
              offset: (page - 1) * 100,
            },
          }
        );

        const customers = response.data.Customer || [];

        if (customers.length === 0) break;

        for (const customer of customers) {
          try {
            await this.syncCustomer(customer.customerID);
            totalSynced++;
          } catch (error) {
            console.error(`Error syncing customer ${customer.customerID}:`, error);
            totalErrors++;
          }
        }

        page++;
      } catch (error) {
        console.error('Error fetching Lightspeed customers:', error);
        break;
      }
    }

    return { synced: totalSynced, errors: totalErrors };
  }

  /**
   * Push completed repair to Lightspeed as a sale
   */
  async createSaleFromRepair(repairOrderId: number): Promise<string> {
    const order = await prisma.repairOrder.findUnique({
      where: { id: repairOrderId },
      include: {
        customer: true,
        repairOrderItems: {
          include: { repairType: true },
        },
      },
    });

    if (!order) {
      throw new Error('Repair order not found');
    }

    // Create sale in Lightspeed
    const saleData = {
      customerID: order.customer.lightspeedCustomerId,
      completed: true,
      SaleLines: {
        SaleLine: order.repairOrderItems.map(item => ({
          itemID: 0, // Use 0 for services (not tracked inventory)
          description: item.repairType.name,
          unitPrice: item.price.toNumber(),
          unitQuantity: 1,
        })),
      },
    };

    const response = await axios.post(
      `${this.apiUrl}/Account/${this.accountId}/Sale.json`,
      { Sale: saleData },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.Sale.saleID;
  }

  /**
   * Test connection to Lightspeed
   */
  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/Account/${this.accountId}.json`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return true;
    } catch (error) {
      console.error('Lightspeed connection test failed:', error);
      return false;
    }
  }
}
```

---

## 6. WebSocket Real-time Updates

### WebSocket Server Setup

```typescript
// backend/src/services/websocket.service.ts

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Authentication middleware for WebSocket
   */
  private setupMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        socket.data.user = payload;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.data.user.email);

      // Join user-specific room
      socket.join(`user:${socket.data.user.userId}`);

      // Join role-specific room
      socket.join(`role:${socket.data.user.role}`);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.data.user.email);
      });

      // Subscribe to specific repair order updates
      socket.on('subscribe:repair-order', (orderId: number) => {
        socket.join(`repair-order:${orderId}`);
      });

      socket.on('unsubscribe:repair-order', (orderId: number) => {
        socket.leave(`repair-order:${orderId}`);
      });
    });
  }

  /**
   * Emit repair order status change
   */
  emitRepairStatusChange(repairOrderId: number, data: any) {
    this.io.to(`repair-order:${repairOrderId}`).emit('repair:status-changed', data);
    
    // Also notify all managers and admins
    this.io.to('role:admin').emit('repair:status-changed', data);
    this.io.to('role:manager').emit('repair:status-changed', data);
  }

  /**
   * Emit new repair order created
   */
  emitNewRepairOrder(data: any) {
    this.io.emit('repair:new-order', data);
  }

  /**
   * Emit notification sent
   */
  emitNotificationSent(repairOrderId: number, data: any) {
    this.io.to(`repair-order:${repairOrderId}`).emit('notification:sent', data);
  }

  /**
   * Emit low stock alert
   */
  emitLowStockAlert(data: any) {
    this.io.to('role:admin').emit('inventory:low-stock', data);
    this.io.to('role:manager').emit('inventory:low-stock', data);
  }
}
```

### Frontend WebSocket Client

```typescript
// frontend/src/services/websocket.service.ts

import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(token: string) {
    this.token = token;

    this.socket = io(process.env.REACT_APP_API_URL!, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to repair order updates
   */
  subscribeToRepairOrder(orderId: number, callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.emit('subscribe:repair-order', orderId);
    this.socket.on('repair:status-changed', callback);
  }

  /**
   * Unsubscribe from repair order updates
   */
  unsubscribeFromRepairOrder(orderId: number, callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.emit('unsubscribe:repair-order', orderId);
    this.socket.off('repair:status-changed', callback);
  }

  /**
   * Listen for new repair orders
   */
  onNewRepairOrder(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('repair:new-order', callback);
  }

  /**
   * Listen for notifications
   */
  onNotificationSent(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('notification:sent', callback);
  }

  /**
   * Listen for low stock alerts
   */
  onLowStockAlert(callback: (data: any) => void) {
    if (!this.socket) return;

    this.socket.on('inventory:low-stock', callback);
  }
}

export const websocketService = new WebSocketService();
```

### React Component Usage

```tsx
// frontend/src/components/RepairOrderDetail.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { websocketService } from '../services/websocket.service';

export const RepairOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Fetch initial order data
    fetchOrder();

    // Subscribe to real-time updates
    const handleStatusChange = (data: any) => {
      if (data.orderId === parseInt(id!)) {
        console.log('Order status changed:', data);
        setOrder((prev: any) => ({
          ...prev,
          status: data.newStatus,
        }));
        
        // Show toast notification
        toast.success(`Status updated to: ${data.newStatus}`);
      }
    };

    websocketService.subscribeToRepairOrder(parseInt(id!), handleStatusChange);

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribeFromRepairOrder(parseInt(id!), handleStatusChange);
    };
  }, [id]);

  const fetchOrder = async () => {
    // Fetch order from API
  };

  return (
    <div>
      <h1>Repair Order #{order?.orderNumber}</h1>
      <p>Status: {order?.status}</p>
      {/* ... rest of component */}
    </div>
  );
};
```

---

## 7. Database Queries (Prisma Examples)

### Common Repair Order Queries

```typescript
// backend/src/services/repairOrder.service.ts

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class RepairOrderService {
  /**
   * Get repair orders with filters
   */
  async getRepairOrders(filters: {
    status?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: number;
    technicianId?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...whereFilters } = filters;

    const where: Prisma.RepairOrderWhereInput = {};

    if (whereFilters.status) {
      where.status = whereFilters.status;
    }

    if (whereFilters.priority) {
      where.priority = whereFilters.priority;
    }

    if (whereFilters.dateFrom || whereFilters.dateTo) {
      where.checkedInAt = {
        ...(whereFilters.dateFrom && { gte: whereFilters.dateFrom }),
        ...(whereFilters.dateTo && { lte: whereFilters.dateTo }),
      };
    }

    if (whereFilters.customerId) {
      where.customerId = whereFilters.customerId;
    }

    if (whereFilters.technicianId) {
      where.assignedTechnicianId = whereFilters.technicianId;
    }

    const [orders, total] = await Promise.all([
      prisma.repairOrder.findMany({
        where,
        include: {
          customer: true,
          customerDevice: {
            include: { device: true },
          },
          repairOrderItems: {
            include: { repairType: true },
          },
          assignedTechnician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkedInAt: 'desc' },
      }),
      prisma.repairOrder.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create new repair order
   */
  async createRepairOrder(data: {
    customerId: number;
    deviceId: number;
    priority: string;
    customerIssueDescription: string;
    estimatedCompletionAt?: Date;
    repairItems: Array<{
      repairTypeId: number;
      partQuality: string;
      price: number;
      cost?: number;
    }>;
  }) {
    // Calculate total price
    const totalPrice = data.repairItems.reduce((sum, item) => sum + item.price, 0);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create customer device if not exists
    const customerDevice = await prisma.customerDevice.upsert({
      where: {
        customerId_deviceId: {
          customerId: data.customerId,
          deviceId: data.deviceId,
        },
      },
      create: {
        customerId: data.customerId,
        deviceId: data.deviceId,
      },
      update: {},
    });

    // Create repair order with items
    const order = await prisma.repairOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        customerDeviceId: customerDevice.id,
        priority: data.priority,
        customerIssueDescription: data.customerIssueDescription,
        estimatedCompletionAt: data.estimatedCompletionAt,
        totalPrice,
        repairOrderItems: {
          create: data.repairItems,
        },
      },
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

    return order;
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastOrder = await prisma.repairOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `RO-${year}-`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    if (!lastOrder) {
      return `RO-${year}-00001`;
    }

    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(5, '0');
    return `RO-${year}-${nextNumber}`;
  }

  /**
   * Update repair order status
   */
  async updateStatus(orderId: number, status: string, notes?: string) {
    const order = await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(status === 'delivered' && { deliveredAt: new Date() }),
      },
      include: {
        customer: true,
        customerDevice: {
          include: { device: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'status_changed',
        entityType: 'repair_order',
        entityId: orderId.toString(),
        changes: JSON.stringify({ oldStatus: order.status, newStatus: status, notes }),
        ipAddress: '0.0.0.0', // TODO: Get from request
      },
    });

    return order;
  }
}
```

---

## 8. Error Handling

### Global Error Handler

```typescript
// backend/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Custom app errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        statusCode: 401,
      },
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        statusCode: 401,
      },
    });
  }

  // Validation errors (Joi/Zod)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: error.message,
        statusCode: 400,
      },
    });
  }

  // Default error
  res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
};

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, res: Response) {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return res.status(409).json({
        error: {
          message: 'A record with this value already exists',
          field: error.meta?.target,
          statusCode: 409,
        },
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        error: {
          message: 'Record not found',
          statusCode: 404,
        },
      });

    case 'P2003':
      // Foreign key constraint failed
      return res.status(400).json({
        error: {
          message: 'Invalid reference',
          statusCode: 400,
        },
      });

    default:
      return res.status(500).json({
        error: {
          message: 'Database error',
          statusCode: 500,
        },
      });
  }
}

/**
 * Async error wrapper to avoid try-catch in every route
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Usage Example

```typescript
// backend/src/routes/repairOrders.ts

import express from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { RepairOrderService } from '../services/repairOrder.service';

const router = express.Router();
const repairOrderService = new RepairOrderService();

/**
 * GET /api/repair-orders/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await repairOrderService.getById(parseInt(id));

    if (!order) {
      throw new AppError('Repair order not found', 404);
    }

    res.json(order);
  })
);

/**
 * POST /api/repair-orders
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = req.body;

    // Validate data
    if (!data.customerId || !data.deviceId) {
      throw new AppError('Missing required fields', 400);
    }

    const order = await repairOrderService.createRepairOrder(data);

    res.status(201).json(order);
  })
);

export default router;
```

---

These code snippets provide working examples of the most critical features in the mobile repair dashboard. Copy and adapt them as needed for your implementation!
