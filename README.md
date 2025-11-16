# Mobile Repair Shop Management System

**Production-ready dashboard for managing mobile device repairs**

🔗 **Live Site:** https://repair.theprofitplatform.com.au/

## Overview

Comprehensive mobile repair shop management system built with Next.js 15, React 19, and Supabase. Features intelligent pricing, repair tracking, customer management, and business analytics.

## Project Structure

```
mobile/
├── dashboard/              # Main Next.js application (ACTIVE)
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── lib/               # Utilities and helpers
│   ├── prisma/            # Database schema
│   └── public/            # Static assets
├── archive/               # Archived files (not in use)
│   ├── old-apps/         # Previous app versions (app/, backend/, frontend/)
│   ├── deployment-scripts/ # Old deployment automation scripts
│   └── old-docs/         # Archived documentation
├── docs/                  # Current documentation
├── scripts/              # Active utility scripts
└── .github/              # GitHub Actions CI/CD

```

## Features

- ✅ **Repair Management** - Track repairs from intake to completion with Kanban board
- ✅ **Smart Pricing** - AI-powered price estimation with confidence scores
- ✅ **Customer Management** - Customer information and repair history
- ✅ **Analytics & Reports** - Revenue tracking and business metrics
- ✅ **Inventory Management** - Parts and stock tracking
- ✅ **Lightspeed POS Integration** - Seamless integration with Lightspeed Retail

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Deployment:** Coolify (self-hosted)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
cd dashboard
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Documentation

All documentation is in the `dashboard/` directory:

- `README.md` - Dashboard-specific setup
- `API_DOCUMENTATION.md` - API endpoints
- `COMPONENT_DOCUMENTATION.md` - Component library
- `DEPLOYMENT.md` - Deployment guide
- `SETUP_GUIDE.md` - Complete setup instructions

## Deployment

Application is deployed via Coolify at:
- **Production:** https://repair.theprofitplatform.com.au/

### Deploy Updates

Deployments are automatic via GitHub Actions on push to `main` branch.

## Scripts

Available in `scripts/`:
- `verify-all.sh` - Comprehensive system verification

## Archive

The `archive/` directory contains:
- Old app versions (Express backend, separate frontend)
- Legacy deployment scripts
- Historical documentation

These are kept for reference but are not used in the current application.

## Development Team

Built for The Profit Platform repair shop management.

## License

Proprietary - All rights reserved

---

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **Updated:** 2025-11-16
