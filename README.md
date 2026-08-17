# Momai Traders — E-Commerce Platform

A full-featured B2B/B2C e-commerce platform for **Momai Traders**, a wholesale supplier of cleaning materials, stationery, packaging, and washroom solutions based in Ahmedabad, Gujarat, India.

Built with Next.js 16 (App Router), PostgreSQL, Prisma ORM, and Tailwind CSS v4 — running entirely on free-tier services.

## Features

### Storefront

- Hero banners, category grid, and featured products
- Product catalog with category filters, search, and sorting
- Product detail pages with gallery, specs, and enquiry/quote requests
- Shopping cart and checkout with saved addresses
- Pincode auto-lookup (auto-fills city/state from India Post API)
- Account dashboard with order history and live status tracking
- GST-compliant invoice PDF generation
- Delivery challan PDF download
- Quote request/acceptance flow with secure token links
- About, Contact, and Clients pages

### Admin Panel (`/admin`)

- Dashboard with stats (orders, revenue, enquiries, outstanding payments)
- Product CRUD with image upload (Cloudinary)
- Category management with sort ordering
- Order management — set per-item quote prices, update status, generate invoices
- Delivery challan system with partial dispatch and courier tracking
- Enquiry management with status tracking
- Customer listing
- Outstanding/accounts receivable tracking with payment recording
- Site settings (store name, phone, GSTIN, invoice prefix, etc.)
- Stamped-copy document archive upload (Cloudinary)

### Order Lifecycle

```
PLACED → QUOTED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                                  ↘ CANCELLED
```

### Payment Methods

- Cash on Delivery (COD)
- Bank Transfer (NEFT/RTGS)
- WhatsApp confirmation

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | Next.js 16.3 (App Router) + TypeScript          |
| Styling          | Tailwind CSS v4                                 |
| Database         | PostgreSQL 17 via Prisma ORM v7.9               |
| Auth             | Custom JWT (jose) + bcryptjs + httpOnly cookies |
| PDF Generation   | @react-pdf/renderer                             |
| Image Storage    | Cloudinary (free tier)                          |
| Email            | Nodemailer (Gmail SMTP)                         |
| Spreadsheet      | ExcelJS (quote requests, outstanding reports)   |
| Validation       | Zod v4                                          |
| Containerization | Docker (PostgreSQL)                             |

## Prerequisites

- **Node.js** v24+
- **PostgreSQL** 17 (local install or Docker)
- **Cloudinary** account (free tier) for image uploads
- **Gmail** account with app password for email notifications

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd ecommerce-website
npm install
```

### 2. Set up environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Start PostgreSQL

**Option A — Docker (recommended):**

```bash
docker compose up -d
```

This starts PostgreSQL 17 on port `5433` with database `momai_shop`.

**Option B — Local PostgreSQL:**

Ensure PostgreSQL is running on port `5432` and update `DATABASE_URL` in `.env` accordingly.

### 4. Initialize the database

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates all tables and seeds 8 product categories + an admin user.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable               | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                     |
| `JWT_SECRET`           | Secret key for JWT signing (long random string)  |
| `ADMIN_EMAIL`          | Default admin login email                        |
| `ADMIN_PASSWORD`       | Default admin login password                     |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name                            |
| `CLOUDINARY_API_KEY`   | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret                            |
| `SMTP_HOST`            | SMTP server host (default: smtp.gmail.com)      |
| `SMTP_PORT`            | SMTP server port (default: 465)                  |
| `SMTP_USER`            | SMTP username (Gmail address)                    |
| `SMTP_PASS`            | SMTP password / app password                     |
| `SMTP_FROM`            | Sender name for emails                           |
| `NOTIFY_EMAIL`         | Email address for order/enquiry notifications    |
| `SITE_URL`             | Base URL (http://localhost:3000 for dev)         |

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy your **Cloud name**, **API Key**, and **API Secret** from the dashboard
3. Add them to your `.env` file
4. Verify the connection:

```bash
npx tsx scripts/test-cloudinary-connection.ts
```

Files are archived in a hierarchical folder structure:

```
Momai Traders/{Company}/{State}/{Year}/{Month}/{Date}/{DocumentType}/
```

Free tier: 25 credits/month (1 credit = 1 GB storage).

## Project Structure

```
├── prisma/                  # Database schema, migrations, seed
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── scripts/                 # Utility scripts
├── public/                  # Static assets (logos, client logos, gallery)
│   ├── clients/
│   └── gallery/
└── src/
    ├── app/                 # Next.js App Router pages
    │   ├── (storefront)/    # Public pages: home, products, cart, checkout
    │   ├── admin/           # Admin panel (protected)
    │   └── api/             # API routes (invoice, challan, pincode, export)
    ├── actions/             # Server actions (auth, orders, cart, enquiries)
    ├── components/          # React components
    │   ├── admin/           # Admin panel components
    │   ├── shop/            # Storefront components
    │   ├── order/           # Order-related components
    │   ├── account/         # Account page components
    │   └── ui/              # Shared UI components
    ├── lib/                 # Utilities (auth, DB, PDF, email, validators)
    └── generated/           # Auto-generated Prisma client
```

## Database Models

| Model               | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| **User**            | Customers and admins (bcrypt passwords, roles)   |
| **Address**         | Saved delivery addresses per user                |
| **Category**        | Product categories with GST rates                |
| **Product**         | Catalog items (optional price = quote-based)     |
| **CartItem**        | Server-side shopping cart                        |
| **Order**           | Full order lifecycle with status tracking         |
| **OrderItem**       | Line items with GST, HSN codes, quote prices     |
| **DeliveryChallan** | Partial dispatch records with courier/tracking   |
| **Outstanding**     | Accounts receivable per order                    |
| **OutstandingPayment** | Individual payment records                    |
| **Enquiry**         | Customer enquiries and quote requests            |
| **QuotationItem**   | Priced line items on quotations                  |
| **Banner**          | Homepage carousel banners                        |
| **Setting**         | Key-value site settings store                    |
| **DocumentArchive** | Stamped copy archive (Cloudinary)                |

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Default Admin Credentials

After seeding, log in at `/admin/login` with:

- **Email:** `admin@momaitraders.in`
- **Password:** `ChangeMe123!`

Change these immediately in production.

## Business Details

- **Company:** Momai Traders
- **Owner:** Jigar Prajapati
- **Address:** Shop-10, Simandhar Complex, Near Prabhat Chowk, Ghatlodiya, Ahmedabad 380061
- **Phone:** +91 99749 02733, +91 87884 77773
- **Email:** momaitraders73@gmail.com
- **Hours:** Mon–Sat 9AM–9PM

## License

Private — All rights reserved.
