# Freight Tracker

A freight tracking and quotation management system for PT Gateway Prima Indonusa.

## Features

- **Dashboard**: Real-time business overview with profit metrics
- **Inquiries**: Parse customer emails and convert to quotations
- **Quotations**: Create quotes with cost/revenue breakdown
- **Shipments**: Track actual costs vs quoted amounts
- **Customers**: Customer database with payment terms
- **Vendors**: Manage coloaders, shipping lines, and airlines
- **Rates**: FCL rates with validity tracking
- **Reports**: Monthly, customer, and route profit analysis

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: Express.js + PostgreSQL
- **Database**: PostgreSQL 15 (via Docker)

## Quick Start

### 1. Start Database

```bash
cd freight-tracker
docker-compose up -d
```

Database will be available at `localhost:5432` with:
- Database: `freight_tracker`
- User: `postgres`
- Password: `postgres`

### 2. Start Backend API

```bash
cd backend
npm install
npm run dev
```

API will run at `http://localhost:3001`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at `http://localhost:5173`

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `customers` | Customer master data |
| `vendors` | Vendors (coloaders, shipping lines, airlines) |
| `ports` | Port reference data (UN/LOCODE) |
| `carriers` | Shipping lines and airlines |
| `vendor_rates_sea` | FCL rates with validity periods |
| `vendor_surcharges` | THC, DOC, AMS, etc. |
| `inquiries` | Customer inquiries |
| `quotations` | Quotations with line items |
| `quotation_items` | Cost/revenue breakdown |
| `shipments` | Confirmed shipments |
| `shipment_items` | Actual costs per shipment |
| `settings` | System settings |

### Profit Analysis Views

- `v_monthly_profit` - Monthly profit summary
- `v_customer_profit` - Profit by customer
- `v_route_profit` - Profit by route (POL-POD)
- `v_dashboard_summary` - Dashboard KPIs

## API Endpoints

### Dashboard
- `GET /api/dashboard/summary` - Dashboard KPIs

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer
- `POST /api/customers` - Create customer

### Vendors
- `GET /api/vendors` - List vendors

### Ports & Carriers
- `GET /api/ports` - List ports
- `GET /api/carriers` - List carriers

### Rates
- `GET /api/vendor-rates/sea` - Get FCL rates

### Reports
- `GET /api/reports/monthly-profit` - Monthly profit
- `GET /api/reports/customer-profit` - Customer profit
- `GET /api/reports/route-profit` - Route profit

## Seed Data

The database comes pre-seeded with:
- 35+ ports (Indonesia, Australia, USA, Canada, Europe, Asia)
- 30 carriers (shipping lines + airlines)
- 5 sample customers
- 5 sample vendors
- Sample FCL rates (Jakarta to Australia, USA, Canada, Europe)
- Common surcharges (THC, DOC, AMS, ISF, etc.)

## Environment Variables

### Backend (.env)
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freight_tracker
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## License

Private - PT Gateway Prima Indonusa
