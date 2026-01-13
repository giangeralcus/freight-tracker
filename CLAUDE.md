# Freight Tracker - CLAUDE.md

## Quick Start

```bash
# 1. Start Database (Docker)
docker-compose up -d

# 2. Start Backend API (port 3001)
cd backend && npm install && npm run dev

# 3. Start Frontend (port 5050)
cd frontend && npm install && npm run dev
```

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | localhost:5432 |
| Backend API | 3001 | http://localhost:3001 |
| **Frontend** | **5050** | **http://localhost:5050** |

## Database Credentials

```
Host: localhost
Port: 5432
Database: freight_tracker
User: postgres
Password: postgres
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v3 + TanStack Query
- **Backend**: Express.js + PostgreSQL
- **Database**: PostgreSQL 15 (Docker)

## Key Features

- Dashboard with KPIs
- Multi-currency support (15 currencies, weekly rates)
- Customers & Vendors management
- FCL Rates with validity periods
- Inquiries → Quotations → Shipments workflow
- Profit reports (monthly/customer/route)

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/dashboard/summary` - Dashboard KPIs
- `GET /api/currencies` - List currencies
- `GET /api/exchange-rates/current` - Current week rates
- `GET /api/customers` - List customers
- `GET /api/vendors` - List vendors
- `GET /api/ports` - List ports
- `GET /api/reports/monthly-profit` - Monthly profit report

## Notes

- Frontend runs on port **5050** (configured in vite.config.ts)
- Tailwind CSS v3 (downgraded from v4 for stability)
- Database auto-seeds with sample data on first run
