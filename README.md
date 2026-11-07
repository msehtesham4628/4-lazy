# 4 LAZY — Full-Stack Luxury Streetwear E-Commerce Platform

> **"LESS EFFORT. MORE STYLE."**  
> Complete production-ready clothing e-commerce platform for international luxury streetwear brand **4 LAZY**.

---

## 💎 Features Overview

### 1. Brand Identity & Design System
- **Luxury Visual Language**: High-fashion editorial aesthetic featuring the signature interlocking **4LY** gold monogram (`/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png`).
- **Heavyweight Silhouettes**: Focus on 280 GSM combed cotton drop-shoulder boxy tees, 500 GSM loopback French Terry hoodies, tailored double-pleated utility cargos, and brutalist outerwear.
- **Strict Anti-Slop Discipline**: Zero generic pills, 60-30-10 color allocation (deep matte obsidian `#0c0c0e`, off-whites, neutral charcoal, and luxury warm gold `#E5A914`), tabular numerals, and responsive layouts.

### 2. Frontend Customer Experience
- **Storefront Home (`/`)**: Full-screen campaign hero, Drop 04 New Arrivals, Shop by Silhouette, Editorial Brutalist Lookbook, Customer Acclaim strip, and VIP Vanguard newsletter.
- **Catalog & Archive (`/shop`)**: Multi-dimensional filtering by Category, Size (S to XXL), Color palette, and Price range slider with real-time sorting (Newest, Price Low/High, Popularity).
- **Product Details (`/products/:slug`)**:
  - **Dynamic Variant Color Switcher**: Grouped variants where clicking a color swatch automatically updates image gallery to that specific colorway.
  - **Size & Inventory Matrix**: Live stock feedback ("Only 4 left", "In Stock", or "Sold Out") per size and SKU.
  - **Sizing Matrix Modal**: Chest, length, and shoulder drop measurements for oversized boxy fit.
  - **Add to Bag & Instant Buy Now**.
  - **Verified Customer Reviews**: Community rating stars, reviews breakdown, and review submission form.
- **Persistent Slide-Out Bag (`/cart`)**: Itemized list, quantity stepper, free shipping threshold tracker (free express delivery on orders over ₹1,999), and coupon code engine.
- **Multi-Step Checkout (`/checkout`)**:
  - Step 1: Contact info & phone validation.
  - Step 2: Shipping address with Indian state dropdown and 6-digit PIN code validation.
  - Step 3: Delivery speed selection (Complimentary Standard or Express Air Priority).
  - Step 4: Secure payment with UPI (Google Pay, PhonePe, Paytm, QR), Credit/Debit Cards, NetBanking, and Razorpay/Stripe readiness.
  - Server-side inventory reservation, tax calculation, and order locking.
- **Order Confirmation & Success (`/order-success`)**: Confetti celebration, printable order breakdown, estimated delivery date, and instant live tracking link.
- **Order Tracking Portal (`/track-order`)**: Public tracking lookup by order number (e.g. `4L-2026-1001`) and email with 7-stage milestone timeline and courier AWB details.
- **Customer Dashboard (`/account`)**: Order history, saved address book, and wishlist.
- **Authentication (`/login`, `/register`)**: Customer registration with 6-digit OTP verification, bcrypt password hashing, and session management.

### 3. Full-Featured Admin Console (`/admin`)
- **Executive Overview**: Total revenue, verified orders, active customers, catalog SKUs, monthly revenue distribution, and variant low-stock alerts.
- **Orders Fulfillment**:
  - Filter orders by status.
  - Update status: *Order Placed &rarr; Confirmed &rarr; Processing &rarr; Packed &rarr; Shipped &rarr; Out for Delivery &rarr; Delivered &rarr; Cancelled &rarr; Returned*.
  - Assign logistics partner (Blue Dart Express, Delhivery, etc.) with AWB number and estimated delivery date (automatically sends shipping update email to buyer).
  - One-click order refund processing with stock replenishment.
- **Product Catalog Management**: Multi-variant SKU management, price/discount setup, color groups with dedicated image URLs.
- **Bulk CSV / Excel Product Import & Export**: Import multiple products and variants via CSV with SKU validation; export entire catalog.
- **Variant Inventory Matrix**: Live stock table for every size/color variant with quick `+/-` manual stock adjustment and audit transaction trail.
- **Coupons Engine**: Create fixed and percentage discount codes with minimum order values, caps, and usage limits.
- **Website CMS**: Live editor for homepage announcements, hero banner text, and campaign stories without code changes.
- **Store Settings**: Tax rates, shipping fees, currency, and Razorpay / Stripe public and private key configuration.
- **Automated Email Logs**: Real-time inspection of all outbound transactional emails (Welcome, Email OTP, Order Confirmation, Shipping Updates) with full rendered HTML preview modal.

---

## 🔐 Credentials & Quick Demo Access

### Administrator Account
- **Email**: `admin@4lazyfashion.com`
- **Password**: `admin123`
- *Access*: Full access to `/admin` console, inventory adjustment, order status updates, and courier tracking.

### Customer Account
- **Email**: `aryan@example.com`
- **Password**: `lazy123`
- *Sample Existing Order*: `4L-2026-1001` (Track via `/track-order`)

---

## ⚙️ Environment Variables (`.env`)

```bash
# Server & App URL
PORT=3000
APP_URL="http://localhost:3000"

# JWT Secret for Auth Tokens
JWT_SECRET="4lazy_super_secure_jwt_token_secret_key_2026"

# Database Configuration (Optional: uses robust persistent store if MONGODB_URI is not set)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/4lazy?retryWrites=true&w=majority"

# Razorpay Payment Gateway (Indian Cards, UPI, Netbanking)
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Stripe Payment Gateway (International Cards)
STRIPE_PUBLIC_KEY="pk_test_xxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxx"

# Email Notifications (Resend / SMTP)
RESEND_API_KEY="re_xxxxxx"
EMAIL_FROM="orders@4lazyfashion.com"
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start full-stack dev server (Express + Vite)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
