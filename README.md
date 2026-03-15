# UniCanteen — Canteen Management System

A full-stack web application for managing hostel canteen orders. Students browse menus, place orders, and pay via Razorpay. Canteen admins manage menus and fulfill orders. A super admin oversees the entire system.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation & Running](#installation--running)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth--apiauth)
  - [Canteens](#canteens--apicanteens)
  - [Menu](#menu--apimenu)
  - [Cart](#cart--apicart)
  - [Orders](#orders--apiorders)
  - [Payments](#payments--apipayments)
  - [Reviews](#reviews--apireviews)
  - [Notifications](#notifications--apinotifications)
  - [Super Admin](#super-admin--apisuper-admin)
- [Payment Flow (Razorpay)](#payment-flow-razorpay)
- [Real-Time Events (Socket.IO)](#real-time-events-socketio)
- [Frontend Routes](#frontend-routes)
- [Role-Based Access](#role-based-access)
- [Key Design Decisions](#key-design-decisions)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Frontend | React 18, Vite, Tailwind CSS |
| Auth | JWT (access token in localStorage + refresh token in HttpOnly cookie) |
| Real-time | Socket.IO |
| Payments | Razorpay |
| File Uploads | Cloudinary via Multer (memory storage) |
| Validation | Zod (server-side) |

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│              Client (React)              │
│  Auth  Cart  Checkout  Orders  Admin    │
│         Axios + Socket.IO client        │
└────────────────┬────────────────────────┘
                 │ HTTP + WebSocket
┌────────────────▼────────────────────────┐
│           Express Server                │
│  Routes → Controllers → Prisma          │
│  Middleware: auth, validate, upload     │
│  Socket.IO server (same HTTP server)    │
└────────────────┬────────────────────────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
PostgreSQL   Razorpay    Cloudinary
```

The server and client run as separate processes in development. In production, the client is built as static files and can be served by the same Express server or a CDN.

---

## Project Structure

```
Canteen-Management/
├── server/
│   ├── server.js                 # Entry: creates HTTP server, inits Socket.IO
│   ├── .env                      # Environment variables (never commit)
│   ├── prisma/
│   │   ├── schema.prisma         # Full data model
│   │   ├── seed.js               # DB seeder
│   │   └── migrations/           # SQL migration history
│   └── src/
│       ├── app.js                # Express app, middleware, route mounting
│       ├── config/
│       │   ├── db.js             # Prisma singleton
│       │   ├── razorpay.js       # Razorpay SDK instance
│       │   ├── cloudinary.js     # Cloudinary SDK config
│       │   └── socket.js         # Socket.IO init + room management
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── canteen.controller.js
│       │   ├── menu.controller.js
│       │   ├── cart.controller.js
│       │   ├── order.controller.js
│       │   ├── payment.controller.js
│       │   ├── review.controller.js
│       │   ├── notification.controller.js
│       │   └── admin.controller.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── canteen.routes.js
│       │   ├── menu.routes.js
│       │   ├── cart.routes.js
│       │   ├── order.routes.js
│       │   ├── payment.routes.js
│       │   ├── review.routes.js
│       │   ├── notification.routes.js
│       │   └── admin.routes.js
│       ├── middleware/
│       │   ├── auth.js           # authenticate + authorize(roles)
│       │   ├── validate.js       # Zod schema middleware
│       │   ├── upload.js         # Multer (memory, 5 MB, images only)
│       │   └── errorHandler.js   # Global error handler (Prisma error mapping)
│       ├── validators/
│       │   ├── auth.validator.js
│       │   ├── menu.validator.js
│       │   ├── order.validator.js
│       │   └── review.validator.js
│       └── utils/
│           ├── apiResponse.js    # success() / error() helpers
│           └── generateToken.js  # JWT access + refresh token generators
│
└── client/
    ├── index.html                # Loads Razorpay checkout.js globally
    └── src/
        ├── main.jsx              # React root, provider tree
        ├── App.jsx               # All routes + ProtectedRoute/PublicRoute
        ├── index.css             # Tailwind + custom CSS classes
        ├── services/
        │   └── api.js            # Axios instance with auto-refresh interceptor
        ├── context/
        │   ├── AuthContext.jsx   # User auth state
        │   ├── CartContext.jsx   # Student cart state
        │   └── SocketContext.jsx # Socket.IO client lifecycle
        ├── components/
        │   └── layout/
        │       └── Navbar.jsx    # Role-aware top nav
        └── pages/
            ├── auth/             # Login, Register
            ├── student/          # Home, CanteenMenu, Cart, Checkout,
            │                     # OrderTracking, OrderHistory, Profile
            ├── admin/            # Dashboard, OrderManager, MenuManager, Settings
            ├── superadmin/       # Dashboard, ManageCanteens, ManageUsers
            └── Notifications.jsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A [Razorpay](https://dashboard.razorpay.com) account (free test mode)
- A [Cloudinary](https://cloudinary.com) account (free tier) for menu item images

### Environment Variables

Create `server/.env`:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/canteen_db

# JWT
JWT_ACCESS_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-other-long-random-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Razorpay (test keys from dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx

# Cloudinary (from cloudinary.com → Dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxx

# App
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Installation & Running

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Push schema to the database and generate Prisma client
npx prisma db push
npx prisma generate

# 3. (Optional) Seed with sample data
npx prisma db seed

# 4. Start dev server
npm run dev          # runs on http://localhost:5000

# --- In another terminal ---

# 5. Install client dependencies
cd client
npm install

# 6. Start frontend dev server
npm run dev          # runs on http://localhost:5173
```

**Useful DB commands:**
```bash
npx prisma studio      # visual DB browser
npx prisma db push     # sync schema to DB
npx prisma generate    # regenerate Prisma client after schema changes
```

---

## Database Schema

### Enums

| Enum | Values |
|------|--------|
| `Role` | `STUDENT`, `CANTEEN_ADMIN`, `SUPER_ADMIN` |
| `OrderStatus` | `PLACED`, `CONFIRMED`, `PICKED_UP`, `CANCELLED` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |

### Models

```
User
  id, name, email (unique), phone (unique), passwordHash
  role (default: STUDENT), hostelId?, avatarUrl?, isActive (default: true)
  → Hostel (many-to-one)
  → CartItem, Order, Review, Notification (one-to-many)
  → Canteen as "managedCanteen" (one-to-one, CANTEEN_ADMIN only)

Hostel
  id, name (unique), location?
  → Canteen (one-to-one), Users (one-to-many)

Canteen
  id, name, hostelId (unique), adminId? (unique)
  description?, imageUrl?
  lunchStart, lunchEnd, dinnerStart, dinnerEnd  (e.g. "12:00")
  upiId?, isOpen (default: true)
  → Hostel, User (admin), MenuCategory[], Order[]

MenuCategory
  id, name, canteenId, sortOrder (default: 0)
  unique: (canteenId, name)
  → Canteen (cascade delete), MenuItem[]

MenuItem
  id, name, description?, price (Decimal 8,2), imageUrl?
  categoryId, isVeg (default: true), isAvailable (default: false)
  → MenuCategory (cascade delete)
  → CartItem[], OrderItem[], Review[]

CartItem
  id, userId, menuItemId, quantity (default: 1)
  unique: (userId, menuItemId)

Order
  id, orderNumber (unique), userId, canteenId
  status (default: PLACED), totalAmount (Decimal 10,2)
  specialInstructions?, meal (default: "LUNCH")
  → User, Canteen, OrderItem[], Payment (one-to-one)

OrderItem
  id, orderId, menuItemId, quantity, unitPrice (Decimal 8,2), itemName
  → Order (cascade delete), MenuItem

Payment
  id, orderId (unique), amount (Decimal 10,2)
  rzpOrderId? (unique)     — Razorpay order ID
  rzpPaymentId? (unique)   — Razorpay payment ID (set after successful payment)
  status (default: PENDING)
  → Order

Review
  id, userId, menuItemId, rating (1–5), comment?
  unique: (userId, menuItemId)

Notification
  id, userId, title, message, type, isRead (default: false), data (Json?)
  → User (cascade delete)
```

---

## Authentication

**Flow:**
1. `POST /api/auth/login` or `POST /api/auth/register` → returns `accessToken` (15 min) in body + sets `refreshToken` (7 days) HttpOnly cookie.
2. Client stores `accessToken` in `localStorage` and attaches it as `Authorization: Bearer <token>` on every request.
3. When a request returns `401`, the Axios interceptor calls `POST /api/auth/refresh` using the cookie to get a new `accessToken`, then retries the original request.
4. `POST /api/auth/logout` clears the cookie.

**Middleware:**

```js
// authenticate — verifies the Bearer token, sets req.user = { userId, role }
// authorize(...roles) — checks req.user.role is in the allowed list

// Usage in routes:
router.get('/admin', authenticate, authorize('CANTEEN_ADMIN'), getCanteenOrders)
```

---

## API Reference

All responses follow this shape:
```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [...] }
```

---

### Auth — `/api/auth`

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| `POST` | `/register` | Public | `{ name, email, phone, password, hostelId? }` | Create account. Returns `{ user, accessToken }` |
| `POST` | `/login` | Public | `{ email, password }` | Login. Returns `{ user, accessToken }` |
| `POST` | `/refresh` | Cookie | — | Refresh access token using `refreshToken` cookie |
| `POST` | `/logout` | Public | — | Clears `refreshToken` cookie |
| `GET` | `/me` | Any | — | Returns current user with hostel + managedCanteen |
| `PUT` | `/me` | Any | `{ name?, phone?, hostelId? }` | Update own profile |

---

### Canteens — `/api/canteens`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | Public | All canteens with hostel info and category count |
| `GET` | `/me` | `CANTEEN_ADMIN` | The admin's own canteen record |
| `GET` | `/:id` | Public | Single canteen with categories and available items |
| `POST` | `/` | `SUPER_ADMIN` | Create canteen: `{ name, hostelId, adminId?, description?, lunchStart?, lunchEnd?, dinnerStart?, dinnerEnd? }` |
| `PUT` | `/:id` | `SUPER_ADMIN` or `CANTEEN_ADMIN` | Update any canteen field including `upiId` |
| `PATCH` | `/:id/toggle` | `CANTEEN_ADMIN` | Toggle `isOpen` |

---

### Menu — `/api/menu`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/search` | Public | `?q=keyword&canteenId=uuid` — search available items |
| `GET` | `/canteen/:id` | Public | Categories + available items only (for students) |
| `GET` | `/canteen/:id/full` | `CANTEEN_ADMIN` | Categories + all items including unavailable (for admin) |
| `PUT` | `/daily` | `CANTEEN_ADMIN` | `{ availableItemIds: string[] }` — set today's available items in bulk |
| `POST` | `/canteen/:id/categories` | `CANTEEN_ADMIN` | `{ name, sortOrder? }` — create category |
| `PUT` | `/categories/:id` | `CANTEEN_ADMIN` | Update category name/sortOrder |
| `DELETE` | `/categories/:id` | `CANTEEN_ADMIN` | Delete category (cascades to all items) |
| `POST` | `/items` | `CANTEEN_ADMIN` | `multipart/form-data`: `{ name, price, categoryId, description?, isVeg?, isAvailable?, image? }` |
| `PUT` | `/items/:id` | `CANTEEN_ADMIN` | Update item fields; optional `image` re-upload |
| `PATCH` | `/items/:id/availability` | `CANTEEN_ADMIN` | Toggle single item's `isAvailable` |
| `DELETE` | `/items/:id` | `CANTEEN_ADMIN` | Delete item |

---

### Cart — `/api/cart` *(STUDENT only)*

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/` | — | Full cart with item details and `total` |
| `POST` | `/` | `{ menuItemId, quantity? }` | Add item. Enforces single-canteen rule. Upserts (increments if already in cart) |
| `PUT` | `/:cartItemId` | `{ quantity }` | Update quantity (removes item if quantity < 1) |
| `DELETE` | `/:cartItemId` | — | Remove a single item |
| `DELETE` | `/clear` | — | Empty the cart |

---

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | `STUDENT` | Place order from cart. Creates Razorpay order. Returns `{ order, rzpOrderId, rzpKeyId, rzpAmount, canteenName }` |
| `GET` | `/` | `STUDENT` | Own order history. `?status=&page=&limit=` |
| `POST` | `/:id/verify-payment` | `STUDENT` | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` — verifies HMAC, confirms order |
| `POST` | `/:id/cancel` | `STUDENT` | Cancel a `PLACED` order |
| `GET` | `/admin` | `CANTEEN_ADMIN` | All orders for admin's canteen. `?status=&page=&limit=` |
| `GET` | `/admin/stats` | `CANTEEN_ADMIN` | `{ todayOrders, todayRevenue, activeOrders, totalOrders }` |
| `PATCH` | `/:id/status` | `CANTEEN_ADMIN` | `{ status: "CONFIRMED" | "PICKED_UP" | "CANCELLED" }` |
| `GET` | `/:id` | Any | Single order. Students can only access own orders |

---

### Payments — `/api/payments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/:orderId` | Any | Get `Payment` record for an order |

---

### Reviews — `/api/reviews`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/item/:menuItemId` | Public | All reviews for an item + average rating |
| `POST` | `/` | Any | `{ menuItemId, rating (1–5), comment? }` — one review per item per user |
| `PUT` | `/:id` | Any | Update own review |
| `DELETE` | `/:id` | Any | Delete review (students: own only) |

---

### Notifications — `/api/notifications` *(authenticated)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Paginated notifications + `unreadCount` |
| `PATCH` | `/:id/read` | Mark one notification as read |
| `PATCH` | `/read-all` | Mark all as read |

---

### Super Admin — `/api/super-admin` *(SUPER_ADMIN only)*

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | System stats: users, orders, revenue, per-canteen counts |
| `GET` | `/users` | Paginated users. `?role=&search=&page=&limit=` |
| `PATCH` | `/users/:id/role` | `{ role }` — change a user's role |
| `PATCH` | `/users/:id/status` | Toggle `isActive` |
| `GET` | `/hostels` | All hostels with canteen and user count |
| `POST` | `/hostels` | `{ name, location? }` — create hostel |
| `PUT` | `/hostels/:id` | Update hostel |

---

## Payment Flow (Razorpay)

```
Student                  Frontend                  Backend               Razorpay
   │                        │                         │                      │
   │── Place Order ─────────▶                         │                      │
   │                        │── POST /orders ─────────▶                      │
   │                        │                         │── Create RZP order ──▶
   │                        │                         │◀─ { id, amount } ────│
   │                        │◀── { rzpOrderId,        │                      │
   │                        │    rzpKeyId, rzpAmount } │                      │
   │                        │                         │                      │
   │                        │── window.Razorpay.open()│                      │
   │◀── Razorpay Modal ─────│                         │                      │
   │── Pay (UPI/card) ──────────────────────────────────────────────────────▶│
   │◀── { razorpay_order_id,                                                  │
   │     razorpay_payment_id,                                                 │
   │     razorpay_signature } ──────────────────────────────────────────────◀│
   │                        │                         │                      │
   │                        │── POST /orders/:id/     │                      │
   │                        │   verify-payment ───────▶                      │
   │                        │                         │ HMAC verify          │
   │                        │                         │ order → CONFIRMED    │
   │                        │                         │ send notification     │
   │                        │                         │ emit socket event     │
   │                        │◀── 200 OK ──────────────│                      │
   │◀── Redirect to         │                         │                      │
   │    /order/:id ─────────│                         │                      │
```

**HMAC Verification (server-side):**
```js
const expected = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

if (expected !== razorpay_signature) → 400 Invalid signature
```

---

## Real-Time Events (Socket.IO)

### Connection

Clients connect with a JWT in the handshake:
```js
io(window.location.origin, { auth: { token: accessToken } })
```
The server verifies the token before accepting the connection.

### Rooms

| Room | Joined by | Purpose |
|------|-----------|---------|
| `user:<userId>` | Everyone (auto on connect) | Personal notifications |
| `canteen:<canteenId>` | `CANTEEN_ADMIN` (emits `join:canteen`) | New order alerts |
| `order:<orderId>` | Any user (emits `join:order`) | Live order status updates |

### Events

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join:canteen` | `canteenId` | Admin joins canteen room |
| `join:order` | `orderId` | User starts tracking an order |
| `leave:order` | `orderId` | User stops tracking |

**Server → Client:**

| Event | Emitted to | Trigger | Payload |
|-------|-----------|---------|---------|
| `order:statusUpdate` | `user:<id>` + `order:<id>` | Payment verified or status changed | `{ orderId, orderNumber, status }` |
| `order:new` | `canteen:<id>` | Payment verified (order confirmed) | `{ orderId, orderNumber }` |

---

## Frontend Routes

| Path | Page | Roles |
|------|------|-------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/` | Canteen listing | `STUDENT` |
| `/canteen/:id` | Menu browser | `STUDENT` |
| `/cart` | Cart | `STUDENT` |
| `/checkout` | Checkout + payment | `STUDENT` |
| `/order/:id` | Live order tracking | `STUDENT`, `CANTEEN_ADMIN` |
| `/orders` | Order history | `STUDENT` |
| `/admin` | Admin dashboard | `CANTEEN_ADMIN` |
| `/admin/orders` | Order management | `CANTEEN_ADMIN` |
| `/admin/menu` | Menu management | `CANTEEN_ADMIN` |
| `/admin/settings` | Canteen settings (UPI ID, hours) | `CANTEEN_ADMIN` |
| `/super-admin` | System dashboard | `SUPER_ADMIN` |
| `/super-admin/canteens` | Canteen management | `SUPER_ADMIN` |
| `/super-admin/users` | User management | `SUPER_ADMIN` |
| `/profile` | User profile | Any |
| `/notifications` | Notification center | Any |

---

## Role-Based Access

| Feature | `STUDENT` | `CANTEEN_ADMIN` | `SUPER_ADMIN` |
|---------|-----------|-----------------|---------------|
| Browse menu | ✅ | ✅ | ✅ |
| Place order | ✅ | ❌ | ❌ |
| Pay via Razorpay | ✅ | ❌ | ❌ |
| Track own orders | ✅ | ✅ (all orders) | ❌ |
| Mark order picked up | ❌ | ✅ | ❌ |
| Manage menu | ❌ | ✅ | ❌ |
| Set daily menu | ❌ | ✅ | ❌ |
| Open/close canteen | ❌ | ✅ | ❌ |
| Create/manage canteens | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Manage hostels | ❌ | ❌ | ✅ |
| View system stats | ❌ | Own canteen | ✅ All |

---

## Key Design Decisions

**Why `db push` instead of `migrate dev`?**
During development the schema is evolving rapidly. `prisma db push` syncs the DB to the schema without requiring interactive migration naming. For production, run `prisma migrate deploy` with properly named migration files.

**Why is the Razorpay order created after the DB transaction?**
Network calls inside Prisma transactions cause deadlocks and timeouts. The DB order is created first (clearing the cart atomically), then the Razorpay order is created. If Razorpay fails, the DB order is cancelled immediately.

**Why does `window.Razorpay` come from a `<script>` tag and not an npm package?**
The Razorpay checkout SDK (`checkout.razorpay.com/v1/checkout.js`) must be loaded from their CDN to pass PCI-DSS compliance. It cannot be bundled. It is loaded eagerly in `client/index.html` so `window.Razorpay` is always available before the checkout page mounts.

**Single-canteen cart rule:**
A student's cart can only contain items from one canteen at a time. If a student adds an item from a different canteen, the backend rejects it with a 400 error. The frontend clears the cart first.

**Menu item images:**
Images are received as multipart form data, held in memory by Multer (never written to disk), then streamed directly to Cloudinary via a `upload_stream` call. The returned `secure_url` is stored in the DB.

**Refresh token rotation:**
The refresh token is stored in an HttpOnly, Secure, SameSite=Strict cookie to prevent XSS theft. The access token is stored in `localStorage` for easy access by Axios. On every 401 response the interceptor calls `/auth/refresh` using the cookie, stores the new access token, and retries the original request — transparent to the user.
