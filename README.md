# Car Rental Platform — Backend API

Multi-tenant SaaS backend for car rental businesses in Kenya. Built with Next.js 16 App Router, Prisma 7, PostgreSQL, and NextAuth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL (Render) |
| Auth | NextAuth v4 — credentials provider, JWT sessions |
| Validation | Zod v4 |
| Deployment | Vercel / Railway |

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- `psql` (PostgreSQL CLI) — for direct DB tasks
- Postman — for API testing

---

## Installation

```bash
git clone https://github.com/emuiga/car-rental.git
cd car-rental
git checkout develop
npm install
```

---

## Environment Setup

Create `.env` in the project root (for Prisma CLI):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

Create `.env.local` (for Next.js runtime):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

Copy `.env.example` for the full reference:

```bash
cp .env.example .env
cp .env.example .env.local
# then fill in your actual values
```

> Both files are git-ignored. Never commit credentials.

---

## Database Setup

### First-time setup (creates all tables)

```bash
npm run db:push
```

### Seed the superadmin account

```bash
npm run db:seed
```

This creates:
- **Email:** `superadmin@carrentalhq.com`
- **Password:** `ChangeMe123!`

> Change the password immediately after first login.

To customise the seed credentials:

```bash
SEED_SUPERADMIN_EMAIL=you@domain.com \
SEED_SUPERADMIN_PASSWORD=YourPassword123! \
npm run db:seed
```

### Other database commands

```bash
npm run db:migrate       # create a migration file (development)
npm run db:migrate:prod  # apply migrations in production
npm run db:studio        # open Prisma Studio (visual DB browser)
npm run db:generate      # regenerate Prisma client after schema changes
```

---

## Running the Project

```bash
npm run dev
```

Server starts at `http://localhost:3000`.

You should see Next.js ready output. No browser page is needed — this repo is API-only.

To verify the server is up, hit the session endpoint:

```
GET http://localhost:3000/api/auth/session
```

Expected response (not logged in):

```json
{}
```

---

## Postman — Setup Guide

### 1. Import the collection

Open Postman → **Import** → select `car-rental-api.postman_collection.json` from the project root.

### 2. Set up the Environment

In Postman, create a new Environment called **Car Rental Local** with these variables:

| Variable | Initial Value | Notes |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | Change to production URL when deployed |
| `companySlug` | _(blank for now)_ | Fill after creating a company |
| `vehicleId` | _(blank)_ | Auto-filled by test scripts |
| `customerId` | _(blank)_ | Auto-filled by test scripts |
| `bookingId` | _(blank)_ | Auto-filled by test scripts |
| `paymentId` | _(blank)_ | Auto-filled by test scripts |
| `companyId` | _(blank)_ | Auto-filled by test scripts |

Select this environment from the top-right dropdown before making any requests.

### 3. Authentication — How It Works

This API uses **cookie-based sessions** via NextAuth. After a successful login, Postman automatically stores the `next-auth.session-token` cookie in its cookie jar and sends it with every subsequent request to the same domain.

**No manual token copying is needed.**

#### Enable cookie handling in Postman

Go to **Settings (gear icon) → General**:
- **Automatically follow redirects** → ON
- **Save and send cookies** → ON (this is on by default)

#### Why "Inherit from parent" works here

The collection's top-level auth is set to `No Auth`. Each folder and request is set to **Inherit auth from parent**, which means they all rely on whatever auth mechanism the parent provides — in this case, the session cookie stored in Postman's cookie jar after login.

You only need to login once per session. The cookie persists across all requests in the same Postman window.

**The flow is:**

```
Run Login request
  └─ NextAuth sets next-auth.session-token cookie
       └─ Postman stores cookie in jar for localhost:3000
            └─ All subsequent requests inherit + send this cookie automatically
```

#### Switching between superadmin and company admin

- Run **Auth → Login — Superadmin** to act as superadmin
- Run **Auth → Login — Company User** (with `companySlug`) to act as a company admin
- Each login replaces the previous session cookie

#### Collection-level pre-request (optional — auto-login)

If you want every request to automatically ensure you are logged in, add this to the **Collection → Pre-request Script** tab:

```javascript
// Auto-login if no session exists
pm.sendRequest({
    url: pm.collectionVariables.get('baseUrl') + '/api/auth/session',
    method: 'GET'
}, (err, res) => {
    const session = res.json();
    if (!session || !session.user) {
        pm.sendRequest({
            url: pm.collectionVariables.get('baseUrl') + '/api/auth/callback/credentials',
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            body: {
                mode: 'raw',
                raw: JSON.stringify({
                    email: pm.environment.get('superadminEmail') || 'superadmin@carrentalhq.com',
                    password: pm.environment.get('superadminPassword') || 'ChangeMe123!',
                    redirect: false,
                    json: true
                })
            }
        }, () => {});
    }
});
```

Add `superadminEmail` and `superadminPassword` to your Postman environment to use this.

---

## Testing Walkthrough

Follow this sequence to test all Phase 1 features end to end.

### Step 1 — Verify the server is up

```
GET /api/auth/session
```

Expected: `{}` (empty — not logged in yet)

---

### Step 2 — Login as Superadmin

Run **Auth → Login — Superadmin**

```json
{
  "email": "superadmin@carrentalhq.com",
  "password": "ChangeMe123!",
  "redirect": false,
  "json": true
}
```

Expected: `200 OK`. The `next-auth.session-token` cookie is now in Postman's jar.

Verify by calling `GET /api/auth/session` — you should now see the user object with `role: "superadmin"`.

---

### Step 3 — Create a Company

Run **Companies (Superadmin) → Create Company**

Adjust the body as needed. On success, the test script auto-saves `companyId`.
Copy the `slug` value (e.g. `"demo-rentals"`) and set it as the `companySlug` environment variable.

Expected: `201 Created` with `{ company: {...}, admin: {...} }`

---

### Step 4 — Enable Features for the Company

Run **Companies → Toggle Feature Flags**

```json
{ "sms": true, "mpesa": true, "reports": true }
```

Expected: `200 OK` with updated `enabledFeatures`

---

### Step 5 — Login as Company Admin

Run **Auth → Login — Company User**

```json
{
  "email": "admin@demorentals.co.ke",
  "password": "SecureAdmin123!",
  "companySlug": "demo-rentals",
  "redirect": false,
  "json": true
}
```

> This replaces the superadmin session cookie with the company admin session.
> To switch back to superadmin, run **Login — Superadmin** again.

---

### Step 6 — Add a Vehicle

Run **Vehicles → Create Vehicle**

Test scripts auto-save the returned `id` as `vehicleId`.

Expected: `201 Created`

---

### Step 7 — Add a Customer

Run **Customers → Create Customer (Local)**

Test scripts auto-save the returned `id` as `customerId`.

Expected: `201 Created`

---

### Step 8 — Create a Booking

Run **Bookings → Create Booking**

The request uses `{{vehicleId}}` and `{{customerId}}` which were saved in the previous steps.

Expected: `201 Created` with `totalAmount` calculated automatically.
Test scripts save `bookingId`.

> If you get a 409, the vehicle is already booked for those dates — change the dates in the request body.

---

### Step 9 — Record a Payment

Run **Payments → Record M-Pesa Payment**

Uses `{{bookingId}}`. After payment, the booking's `paymentStatus` updates automatically:
- `0 paid` → `unpaid`
- `partial amount` → `partial`
- `full amount` → `paid`

Check the booking:

```
GET /api/bookings/{{bookingId}}
```

Response includes `amountPaid`, `outstanding`, and updated `paymentStatus`.

---

### Step 10 — Advance Booking Status

**Activate (vehicle picked up):**
Run **Bookings → Activate Booking (Pickup)** — transitions `pending → active`, marks vehicle as `rented`

**Complete (vehicle returned):**
Run **Bookings → Complete Booking (Return)** — transitions `active → completed`, frees vehicle back to `available`

---

### Step 11 — Check Dashboard

Run **Dashboard → Get Dashboard Stats**

Expected response:

```json
{
  "revenue": { "thisMonth": 34000, "lastMonth": 0, "changePercent": null },
  "bookings": { "active": 0, "pending": 0, "completed": 1, "cancelled": 0, "total": 1 },
  "vehicles": { "available": 1, "rented": 0, "maintenance": 0, "total": 1 },
  "customers": { "newThisMonth": 1, "total": 1 },
  "recentBookings": [...]
}
```

---

### Step 12 — Create a Staff User

Run **Auth → Register Company User**

```json
{
  "email": "staff@demorentals.co.ke",
  "password": "Staff123!",
  "firstName": "Alice",
  "lastName": "Wanjiku",
  "role": "staff"
}
```

Expected: `201 Created`

---

## Role Permission Summary

| Endpoint | superadmin | admin | manager | staff |
|---|:---:|:---:|:---:|:---:|
| Companies CRUD | ✅ | — | — | — |
| Feature flags | ✅ | — | — | — |
| Register users | ✅ | ✅ | ✅ | — |
| Vehicles — view | ✅ | ✅ | ✅ | ✅ |
| Vehicles — create/edit | ✅ | ✅ | ✅ | — |
| Vehicles — delete | ✅ | ✅ | — | — |
| Customers — all | ✅ | ✅ | ✅ | ✅ |
| Customers — delete | ✅ | ✅ | — | — |
| Bookings — all | ✅ | ✅ | ✅ | ✅ |
| Cancel active booking | ✅ | ✅ | — | — |
| Payments — all | ✅ | ✅ | ✅ | ✅ |
| Void payment | ✅ | ✅ | — | — |
| Dashboard | ✅ | ✅ | ✅ | ✅ |

---

## Deployment

### Vercel

1. Push to GitHub (already done — `main` branch is production-ready)
2. Import repo in Vercel dashboard
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate
   - `NEXTAUTH_URL` — your Vercel deployment URL (e.g. `https://car-rental.vercel.app`)
4. Set build command to `npm run db:migrate:prod && next build` to auto-run migrations on deploy
5. Deploy

### Railway

Same environment variables. Railway auto-detects Next.js. Add `npm run db:migrate:prod` as the pre-deploy command.

---

## Project Structure

```
car-rental/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/   # NextAuth handler
│       │   └── register/        # Create company users
│       ├── companies/           # Superadmin: company management + feature flags
│       ├── vehicles/            # Fleet management
│       ├── customers/           # KYC customer records
│       ├── bookings/            # Reservations + status state machine
│       ├── payments/            # Payment recording + paymentStatus sync
│       ├── dashboard/           # Revenue, booking, vehicle stats
│       └── users/               # User management
├── lib/
│   ├── prisma.ts                # Prisma singleton (Prisma 7 + pg adapter)
│   ├── auth.ts                  # NextAuth configuration
│   └── api.ts                   # withAuth wrapper, role constants, helpers
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Superadmin seeder
├── types/
│   └── next-auth.d.ts           # Session type augmentation
├── prisma.config.ts             # Prisma 7 CLI config
└── .env.example                 # Environment variable template
```

---

## Security Notes

- `company_id` is always sourced from the JWT session — never from the request body or query params
- Staff cannot access data from other companies by guessing UUIDs
- Passwords are hashed with bcrypt (12 rounds)
- Superadmin has no `company_id` — they operate across all companies
- `.env` files are git-ignored — never commit credentials
