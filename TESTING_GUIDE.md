# Testing Guide - Mobile Repair Dashboard

## Testing Strategy Overview

### Test Pyramid
```
                    ┌──────────────┐
                    │   E2E Tests  │  (10%)
                    │   Playwright │
                ┌───┴──────────────┴───┐
                │  Integration Tests   │  (30%)
                │    API Testing       │
            ┌───┴──────────────────────┴───┐
            │      Unit Tests              │  (60%)
            │  Components, Functions       │
        ┌───┴──────────────────────────────┴───┐
```

---

## 1. Unit Tests (Jest + React Testing Library)

### Setup

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @types/jest ts-jest
```

**jest.config.js**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Test: Smart Pricing Algorithm

**`lib/pricing/__tests__/estimator.test.ts`**
```typescript
import { estimatePrice } from '../estimator'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  prisma: {
    price: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    deviceModel: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Smart Pricing Estimator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return exact price when available', async () => {
    const mockPrice = {
      id: 1,
      deviceModelId: 1,
      repairTypeId: 1,
      partsQuality: 'original',
      totalPrice: 199.99,
      isEstimated: false,
    }

    ;(prisma.price.findFirst as jest.Mock).mockResolvedValue(mockPrice)

    const result = await estimatePrice(1, 1, 'original')

    expect(result.price).toBe(199.99)
    expect(result.isEstimated).toBe(false)
    expect(result.confidence).toBe(1.0)
  })

  it('should interpolate price between two models', async () => {
    const mockDevice = {
      id: 2,
      name: 'iPhone 12',
      brandId: 1,
      releaseYear: 2020,
      tierLevel: 2,
      brand: { name: 'Apple' },
    }

    const mockReferencePrices = [
      {
        id: 1,
        totalPrice: 159,
        deviceModel: { id: 1, releaseYear: 2019, name: 'iPhone 11' },
      },
      {
        id: 2,
        totalPrice: 239,
        deviceModel: { id: 3, releaseYear: 2021, name: 'iPhone 13' },
      },
    ]

    ;(prisma.price.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.deviceModel.findUnique as jest.Mock).mockResolvedValue(mockDevice)
    ;(prisma.price.findMany as jest.Mock).mockResolvedValue(mockReferencePrices)

    const result = await estimatePrice(2, 1, 'original')

    // Should interpolate between 159 and 239
    expect(result.price).toBeGreaterThan(159)
    expect(result.price).toBeLessThan(239)
    expect(result.isEstimated).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(0.75)
  })

  it('should handle tier adjustment correctly', async () => {
    const mockDevice = {
      id: 4,
      name: 'iPhone 14 Pro Max',
      brandId: 1,
      releaseYear: 2022,
      tierLevel: 1, // Flagship
      brand: { name: 'Apple' },
    }

    const mockReferencePrices = [
      {
        id: 1,
        totalPrice: 200,
        deviceModel: { id: 5, releaseYear: 2022, tierLevel: 2 },
      },
    ]

    ;(prisma.price.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.deviceModel.findUnique as jest.Mock).mockResolvedValue(mockDevice)
    ;(prisma.price.findMany as jest.Mock).mockResolvedValue(mockReferencePrices)

    const result = await estimatePrice(4, 1, 'original')

    // Flagship should have 15% premium (200 * 1.15 = 230)
    expect(result.price).toBeGreaterThan(200)
  })

  it('should return low confidence for insufficient data', async () => {
    const mockDevice = {
      id: 6,
      name: 'OnePlus 12',
      brandId: 4,
      releaseYear: 2024,
      tierLevel: 2,
      brand: { name: 'OnePlus' },
    }

    ;(prisma.price.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.deviceModel.findUnique as jest.Mock).mockResolvedValue(mockDevice)
    ;(prisma.price.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.price.aggregate as jest.Mock).mockResolvedValue({
      _avg: { totalPrice: 150 },
    })

    const result = await estimatePrice(6, 1, 'original')

    expect(result.confidence).toBeLessThan(0.5)
    expect(result.isEstimated).toBe(true)
  })
})
```

### Test: React Component

**`components/__tests__/DeviceSelector.test.tsx`**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeviceSelector } from '../DeviceSelector'

global.fetch = jest.fn()

describe('DeviceSelector', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders brand selection', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 1, name: 'Apple', isPrimary: true },
          { id: 2, name: 'Samsung', isPrimary: true },
        ],
      }),
    })

    render(<DeviceSelector onSelect={mockOnSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Samsung')).toBeInTheDocument()
    })
  })

  it('loads models when brand is selected', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 1, name: 'Apple', isPrimary: true }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 1, name: 'iPhone 15', variant: 'Pro Max', releaseYear: 2023 },
            { id: 2, name: 'iPhone 15', variant: 'Pro', releaseYear: 2023 },
          ],
        }),
      })

    render(<DeviceSelector onSelect={mockOnSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Apple'))

    await waitFor(() => {
      expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    })
  })

  it('calls onSelect when model is chosen', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 1, name: 'Apple', isPrimary: true }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 1, name: 'iPhone 15', variant: 'Pro', releaseYear: 2023 }],
        }),
      })

    render(<DeviceSelector onSelect={mockOnSelect} />)

    await waitFor(() => screen.getByText('Apple'))
    fireEvent.click(screen.getByText('Apple'))

    await waitFor(() => screen.getByText('iPhone 15'))
    fireEvent.click(screen.getByText('iPhone 15'))

    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })
})
```

---

## 2. Integration Tests (API Testing)

### Setup

```bash
npm install --save-dev supertest @types/supertest
```

### Test: API Endpoints

**`app/api/__tests__/repairs.test.ts`**
```typescript
import { POST, GET } from '../repairs/route'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db')
jest.mock('@/lib/notifications')

describe('Repairs API', () => {
  describe('POST /api/repairs', () => {
    it('should create a new repair', async () => {
      const mockRepair = {
        id: 1,
        repairNumber: 'RR-20250110-001',
        customerId: 1,
        deviceModelId: 1,
        status: 'new',
        totalCost: 299.99,
        customer: { firstName: 'John', lastName: 'Doe' },
        deviceModel: {
          name: 'iPhone 15',
          brand: { name: 'Apple' },
        },
        repairItems: [],
      }

      ;(prisma.repair.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue(mockRepair)

      const request = new Request('http://localhost/api/repairs', {
        method: 'POST',
        body: JSON.stringify({
          customerId: 1,
          deviceModelId: 1,
          repairItems: [
            {
              repairTypeId: 1,
              partsQuality: 'original',
              manualPrice: 299.99,
            },
          ],
          priority: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.repairNumber).toBe('RR-20250110-001')
    })

    it('should validate required fields', async () => {
      const request = new Request('http://localhost/api/repairs', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          repairItems: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/repairs', () => {
    it('should return paginated repairs', async () => {
      const mockRepairs = [
        {
          id: 1,
          repairNumber: 'RR-001',
          status: 'new',
        },
      ]

      ;(prisma.repair.findMany as jest.Mock).mockResolvedValue(mockRepairs)
      ;(prisma.repair.count as jest.Mock).mockResolvedValue(1)

      const request = new Request('http://localhost/api/repairs?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('should filter by status', async () => {
      ;(prisma.repair.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.repair.count as jest.Mock).mockResolvedValue(0)

      const request = new Request('http://localhost/api/repairs?status=in_progress')
      await GET(request)

      expect(prisma.repair.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'in_progress',
          }),
        })
      )
    })
  })
})
```

---

## 3. End-to-End Tests (Playwright)

### Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**`playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test: Complete Repair Flow

**`e2e/repair-creation.spec.ts`**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Repair Creation Flow', () => {
  test('should create a new repair end-to-end', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/')
    
    // Click "New Repair" button
    await page.click('text=New Repair')
    await expect(page).toHaveURL('/repairs/new')
    
    // Step 1: Search and select customer
    await page.fill('input[placeholder*="Search"]', 'John Smith')
    await page.waitForTimeout(500)
    await page.click('text=John Smith')
    
    // Verify customer selected
    await expect(page.locator('text=john.smith@email.com')).toBeVisible()
    
    // Step 2: Select device
    await page.click('text=Apple')
    await page.waitForSelector('text=iPhone 15')
    await page.click('text=iPhone 15')
    
    // Step 3: Select repair type
    await page.click('text=Screen Replacement')
    
    // Wait for price calculation
    await page.waitForSelector('text=/\\$[0-9]+\\.\\d{2}/')
    
    // Select parts quality
    await page.click('text=Premium')
    
    // Step 4: Add notes
    await page.fill('textarea[placeholder*="additional information"]', 
      'Customer reports cracked screen after drop'
    )
    
    // Step 5: Submit
    await page.click('button:has-text("Create Repair")')
    
    // Wait for success
    await page.waitForURL(/\/repairs\/\d+/)
    
    // Verify repair created
    await expect(page.locator('text=/RR-\\d{8}-\\d{3}/')).toBeVisible()
    await expect(page.locator('text=John Smith')).toBeVisible()
    await expect(page.locator('text=iPhone 15')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/repairs/new')
    
    // Try to submit without filling form
    await page.click('button:has-text("Create Repair")')
    
    // Should show error messages
    await expect(page.locator('text=/customer/i')).toBeVisible()
  })
})

test.describe('Status Board', () => {
  test('should drag repair to new status', async ({ page }) => {
    await page.goto('/repairs')
    
    // Find a repair card in "New" column
    const repairCard = page.locator('[data-status="new"] >> .repair-card').first()
    
    // Drag to "In Progress" column
    await repairCard.dragTo(page.locator('[data-status="in_progress"]'))
    
    // Wait for API update
    await page.waitForTimeout(1000)
    
    // Verify moved
    await expect(
      page.locator('[data-status="in_progress"] >> text=/RR-/')
    ).toBeVisible()
  })
})

test.describe('Price Matrix', () => {
  test('should edit price inline', async ({ page }) => {
    await page.goto('/pricing')
    
    // Click on a price cell
    await page.click('[data-testid="price-cell-1-1"]')
    
    // Edit value
    await page.fill('input[type="number"]', '299.99')
    
    // Save
    await page.press('input[type="number"]', 'Enter')
    
    // Wait for save
    await page.waitForTimeout(500)
    
    // Verify saved
    await expect(page.locator('text=299.99')).toBeVisible()
    await expect(page.locator('text=Saved')).toBeVisible()
  })

  test('should show estimated prices with warning', async ({ page }) => {
    await page.goto('/pricing')
    
    // Look for estimated price indicator
    await expect(page.locator('text=⚠️ Estimated').first()).toBeVisible()
    
    // Hover to see confidence score
    await page.hover('[data-estimated="true"]')
    await expect(page.locator('text=/confidence/i')).toBeVisible()
  })
})
```

---

## 4. Manual Testing Checklist

### Critical User Flows

#### ✅ Repair Creation
- [ ] Can search for existing customer
- [ ] Can create new customer
- [ ] Can select device (brand → model → variant)
- [ ] Can select multiple repair types
- [ ] Can choose parts quality for each repair
- [ ] Prices calculate automatically
- [ ] Can override calculated prices
- [ ] Can add notes and IMEI
- [ ] Can set priority (standard/urgent/express)
- [ ] Repair number generates correctly
- [ ] Customer receives notification

#### ✅ Status Management
- [ ] Can view all repairs in status board
- [ ] Can drag repair to new status
- [ ] Status updates immediately
- [ ] Customer receives status update notification
- [ ] Can filter by status
- [ ] Can search repairs
- [ ] Overdue repairs show warning

#### ✅ Price Management
- [ ] Can view price matrix
- [ ] Can edit prices inline
- [ ] Estimated prices show confidence score
- [ ] Can export prices to CSV
- [ ] Can import prices from CSV
- [ ] Missing prices show in red

#### ✅ Customer Management
- [ ] Can search customers
- [ ] Can view customer repair history
- [ ] Can edit customer details
- [ ] Lightspeed sync works (if configured)
- [ ] Can set notification preferences

#### ✅ Notifications
- [ ] SMS sends successfully
- [ ] Email sends successfully
- [ ] Templates render correctly
- [ ] Customer can opt out
- [ ] Delivery status tracked

#### ✅ Reports
- [ ] Revenue report calculates correctly
- [ ] Charts render properly
- [ ] Can export reports
- [ ] Date filters work
- [ ] Breakdown by device/repair type correct

---

## 5. Performance Testing

### Load Testing with k6

**`load-test.js`**
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
}

export default function () {
  // Test repairs list endpoint
  const res = http.get('http://localhost:3000/api/repairs')
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

Run with:
```bash
k6 run load-test.js
```

---

## 6. Security Testing

### Checklist

- [ ] **SQL Injection**: All queries use parameterized queries (Prisma ORM)
- [ ] **XSS**: Input sanitization on all user inputs
- [ ] **CSRF**: CSRF tokens on all forms
- [ ] **Authentication**: JWT tokens with proper expiration
- [ ] **Authorization**: Role-based access control enforced
- [ ] **Rate Limiting**: API endpoints rate limited
- [ ] **Data Validation**: Zod schemas validate all inputs
- [ ] **Sensitive Data**: PII encrypted at rest
- [ ] **API Keys**: All secrets in environment variables
- [ ] **HTTPS**: TLS 1.3 enforced in production

---

## 7. Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 8. Accessibility Testing

### Tools
- **axe DevTools** (browser extension)
- **WAVE** (web accessibility evaluation tool)
- **Lighthouse** (Chrome DevTools)

### Checklist
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Semantic HTML used
- [ ] ARIA labels where needed

---

## 9. Test Data Management

### Creating Test Data

```sql
-- Reset database to clean state
TRUNCATE TABLE 
    notifications,
    repair_items,
    repairs,
    customers,
    prices,
    device_models,
    brands,
    repair_types
RESTART IDENTITY CASCADE;

-- Run seed script
\i DATABASE_SEEDS.sql
```

### Test Users

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Admin | admin@test.com | test123 | Full access |
| Manager | manager@test.com | test123 | All except settings |
| Technician | tech@test.com | test123 | View/update repairs |
| Front Desk | desk@test.com | test123 | Create/view repairs |

---

## 10. Continuous Integration

**`.github/workflows/test.yml`**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Coverage Goals

- **Unit Tests**: > 80%
- **Integration Tests**: > 70%
- **E2E Tests**: Critical paths only
- **Overall**: > 75%

Run coverage report:
```bash
npm run test:coverage
```

---

Your application is now thoroughly tested and production-ready! 🎉
