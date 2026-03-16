# Zeron Online Store — Design Spec

## Overview

Zeron is a streetwear clothing brand launching a direct-to-consumer online store. The platform is a Next.js 15 monolith with Firebase backend, Stripe payments, Amazon Bedrock-powered chatbot, multi-language support (ES/EN/zh-HK), and an admin panel for full store management.

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS 4, CSS native animations |
| Database | Firebase Firestore |
| Auth | Firebase Auth (email/password, Google, Apple) |
| File Storage | Firebase Storage |
| Payments | Stripe Checkout Sessions (hosted) |
| Chatbot | Amazon Bedrock (Claude) |
| i18n | next-intl |
| Charts | Recharts |
| Email | Amazon SES |
| Theme | next-themes (dark default) |

### Approach: Monolith Next.js

Single Next.js project with App Router. The admin panel lives at an obfuscated route (`/zr-ops/`) rather than `/admin`. All business logic goes through Next.js Route Handlers as middleware to Firebase, Stripe, and Bedrock. No separate backend.

**Deployment target**: Vercel (natural fit for Next.js App Router, serverless functions for Route Handlers).

### Project Structure

```
/workspace/zeron/
├── src/
│   ├── app/
│   │   ├── [locale]/                  # Public routes (es, en, zh-HK)
│   │   │   ├── (shop)/               # Store: home, catalog, product, cart, checkout
│   │   │   ├── (account)/            # User panel: orders, profile, password
│   │   │   └── (auth)/               # Login, signup, reset password
│   │   ├── zr-ops/                   # Admin panel (English only, no i18n)
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── orders/
│   │   │   ├── promotions/
│   │   │   ├── analytics/
│   │   │   └── chatbot-kb/
│   │   └── api/                      # Route Handlers
│   ├── components/
│   ├── lib/                          # Firebase, Stripe, Bedrock configs & utils
│   ├── hooks/
│   ├── messages/                     # Translation files (es.json, en.json, zh-HK.json)
│   └── types/
├── public/
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Middleware

Next.js middleware handles:
- Locale detection and redirection (default: `es`). Routes starting with `/zr-ops/` and `/api/` are excluded from locale processing.
- Protection of `/zr-ops/*` routes: checks Firebase auth token for `admin` custom claim. Unauthenticated or non-admin users are redirected to `/login` with a `redirect` query param.
- Protection of `/(account)/*` routes (requires authentication)

### Admin Access

- Admins log in through the same `/login` page as customers. After login, if the user has the `admin` custom claim, the UI shows a link to `/zr-ops/`.
- Initial admin setup: a one-time Firebase Admin SDK script (`scripts/set-admin.ts`) sets the `admin` custom claim on a user by email.
- The `/zr-ops/` route is not linked anywhere in the public UI — only accessible by direct URL or the admin-only link post-login.

---

## Data Model (Firestore)

### `users/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| email | string | User email |
| displayName | string | Display name |
| photoURL | string | Avatar URL |
| role | `"customer" \| "admin"` | User role |
| addresses | array | `[{ recipientName, phone, street, city, state, country, zip, isDefault }]` |
| preferredLocale | string | `"es" \| "en" \| "zh-HK"` |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `products/{productId}`

| Field | Type | Description |
|-------|------|-------------|
| name | map | `{ es, en, "zh-HK" }` translated name |
| description | map | `{ es, en, "zh-HK" }` translated description |
| slug | string | URL-friendly unique identifier |
| categoryId | string | Reference to category |
| basePrice | number | Price in cents (USD) |
| images | array | Firebase Storage URLs |
| sizes | array | `["S", "M", "L", "XL"]` |
| stock | map | `{ S: number, M: number, L: number, XL: number }` |
| status | string | `"active" \| "draft" \| "archived"` |
| tags | array | String tags for filtering |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `categories/{categoryId}`

| Field | Type | Description |
|-------|------|-------------|
| name | map | `{ es, en, "zh-HK" }` |
| slug | string | URL-friendly identifier |
| description | map | `{ es, en, "zh-HK" }` |
| image | string | Category image URL |
| order | number | Display order in navigation |

### `orders/{orderId}`

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Reference to user |
| items | array | `[{ productId, name, size, quantity, unitPrice, image }]` |
| subtotal | number | In cents |
| shipping | number | In cents |
| discount | number | In cents |
| total | number | In cents |
| paymentStatus | string | `"pending" \| "paid" \| "refunded"` |
| fulfillmentStatus | string | `"processing" \| "shipped" \| "delivered" \| "cancelled"` |
| shippingAddress | map | `{ recipientName, phone, street, city, state, country, zip }` |
| stripeSessionId | string | Stripe Checkout session ID |
| promotionCodes | array | Applied promo codes (max 1 manual + 1 auto) |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### `promotions/{promoId}`

| Field | Type | Description |
|-------|------|-------------|
| code | string \| null | Unique code (e.g., "ZERON20"), null for auto-applied |
| type | string | `"percentage" \| "fixed" \| "free_shipping"` |
| applyMode | string | `"manual"` (user enters code) or `"auto"` (applied automatically) |
| value | number | Percentage: 20 = 20%. Fixed: amount in cents (2000 = $20) |
| minOrderAmount | number \| null | Minimum order in cents to apply |
| applicableCategories | array \| null | Category IDs, null = all |
| banner | map \| null | `{ es, en, "zh-HK" }` banner text |
| showBanner | boolean | Whether to show banner on storefront |
| startDate | timestamp | |
| endDate | timestamp | |
| maxUses | number \| null | null = unlimited |
| currentUses | number | |
| active | boolean | |

### `chatbot_kb/{entryId}`

| Field | Type | Description |
|-------|------|-------------|
| title | string | Entry title |
| content | string | Text content for Bedrock context |
| category | string | `"products" \| "policies" \| "faq" \| "sizing"` |
| active | boolean | |
| updatedAt | timestamp | |

### `wishlists/{userId}`

| Field | Type | Description |
|-------|------|-------------|
| productIds | array | List of product IDs saved as favorites |
| updatedAt | timestamp | |

One document per user. Heart icon on product cards and product detail pages toggles the product in/out of the wishlist. Viewable from `/account/wishlist`.

### `settings/general`

| Field | Type | Description |
|-------|------|-------------|
| flatRateShipping | number | Flat-rate shipping cost in cents |
| currency | string | `"usd"` |
| defaultLocale | string | `"es"` |

Single document for global store configuration. Editable from admin panel.

### `carts/{visitorId}`

| Field | Type | Description |
|-------|------|-------------|
| userId | string \| null | Linked user ID if authenticated |
| items | array | `[{ productId, name, size, quantity, unitPrice, image }]` |
| updatedAt | timestamp | Last activity timestamp |

Carts are stored in Firestore keyed by a visitor ID (stored in a cookie). When a user logs in, the cart is linked to their `userId`. Carts older than 30 days are cleaned up by a scheduled function. This enables abandoned cart tracking.

### Data decisions

- Prices stored in **cents** to avoid floating point issues (Stripe standard)
- All monetary `value` fields on promotions follow the same convention: cents for fixed amounts, whole numbers for percentages
- Translations **inline** per document (not separate collections) — practical for 3 languages
- Stock tracked **per size** on the product document (no color variants)
- Chatbot KB is a separate collection edited by admin, consumed as RAG context by Bedrock
- Promotions support stacking: max 1 manual (code-based) + 1 auto-applied per order

---

## Pages and Routes

### Public Store (`/[locale]/`)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero section with Zeron logo (`zeron_logo.webp`), featured drops, categories, promo banner |
| Catalog | `/shop` | Product grid with filters (category, size, price), sorting |
| Category | `/shop/[category]` | Catalog filtered by category |
| Product | `/shop/[category]/[slug]` | Gallery, size selector, stock, add to cart |
| Cart | `/cart` | Item list, apply promo code, price summary |
| Checkout | `/checkout` | Select saved address or enter new one → redirect to Stripe Checkout |
| Confirmation | `/checkout/success` | Post-payment order confirmation |
| Contact | `/contact` | Contact form (sends email via Route Handler) |

### User Panel (`/[locale]/(account)/`)

| Page | Route | Description |
|------|-------|-------------|
| My Orders | `/account/orders` | Order list with status |
| Order Detail | `/account/orders/[id]` | Products, address, detailed status |
| Profile | `/account/profile` | Edit name, email, preferred locale, manage saved shipping addresses |
| Wishlist | `/account/wishlist` | Saved favorite products, add to cart from wishlist |
| Password | `/account/password` | Change password |

### Auth (`/[locale]/(auth)/`)

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password + Google + Apple |
| Signup | `/signup` | Registration with email verification |
| Reset | `/forgot-password` | Password reset link |

### Admin Panel (`/zr-ops/`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/zr-ops` | Today's sales, pending orders, key metrics |
| Products | `/zr-ops/products` | Product CRUD with translation editor |
| Categories | `/zr-ops/categories` | Category CRUD |
| Orders | `/zr-ops/orders` | List with status filters, search, status change |
| Analytics | `/zr-ops/analytics` | Recharts: sales, conversion, geo, categories, comparisons |
| Promotions | `/zr-ops/promotions` | Promo CRUD, banner toggle |
| Chatbot KB | `/zr-ops/chatbot-kb` | Knowledge base entry CRUD |

### Purchase Flow

```
Browse catalog → Select product/size → Add to cart
→ View cart → Apply promo (optional) → Checkout
→ Select saved address or enter new one → Stripe Checkout (hosted)
→ Webhook confirms payment → Order created in Firestore → Confirmation email
→ Redirect to success page
```

---

## External Integrations

### Stripe

- **Stripe Checkout Sessions** (hosted page): user redirects to Stripe, we never handle card data
- **Webhooks** via Route Handler at `/api/stripe/webhook`:
  - `checkout.session.completed` → creates order in Firestore, decrements stock
  - `checkout.session.expired` → cleans up pending session
  - `charge.refunded` → updates order `paymentStatus` to `"refunded"`
- Prices calculated **server-side always** (never trust client)
- Promo codes validated **server-side** before creating Stripe session

### Amazon Bedrock

- Invoked from Route Handler `/api/chatbot`
- Model: Claude via Bedrock
- Per-message flow:
  1. User sends message
  2. Route Handler queries `chatbot_kb` for relevant entries (keyword/category search)
  3. Builds prompt: system prompt + KB context + conversation history + user message
  4. If user is authenticated, can include their order data for status queries
  5. Response streamed to client

- Knowledge base read directly from Firestore. On each request, all active KB entries are fetched (expected <100 entries) and filtered in-memory by category relevance. No vector DB or full-text search needed at this scale.

### Rate Limiting (Chatbot)

- **Authenticated users**: 30 messages / 10 minutes
- **Anonymous users**: 10 messages / 10 minutes
- **Implementation**: Firestore-based counter per userId/IP with TTL. A `chatbot_rate_limits/{key}` document tracks message count and window expiry. Simple, serverless-compatible, no external dependencies beyond Firebase.
- **Response on exceed**: HTTP 429 with friendly message

### Firebase

- **Auth**: Email/password + Google + Apple providers. Custom claims for `admin` role
- **Firestore**: Primary database. Security Rules enforce admin-only writes where needed
- **Storage**: Product and category images. Rules restrict uploads to admins only

### Contact Form

- Route Handler `/api/contact` sends email via **Amazon SES**
- SES also handles order confirmation emails (triggered after successful payment webhook)
- Password reset emails use Firebase Auth's built-in email service (no custom handling needed)

### SEO

- Dynamic metadata per page via `generateMetadata`
- Dynamic `sitemap.xml` with all products/categories per locale
- Static `robots.txt`
- Open Graph images per product
- JSON-LD structured data (schema.org/Product)
- Canonical URLs with `hreflang` tags for all 3 locales
- Open Graph images auto-generated from product's first image (no manual upload needed)

### Shipping

- Flat-rate shipping (configured by admin, stored in a `settings` Firestore document)
- Free shipping promotions override the flat rate when applicable

---

## Visual Design

### Identity

- **Theme**: Dark mode default (streetwear/urban), light mode toggle available
- **Brand**: Zeron — stylized "Z" logo in dark gray, minimalist

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0A` | Page background |
| Surface | `#141414` | Cards, panels |
| Accent | `#E5E5E5` | Primary text (off-white) |
| Brand | Gray from logo | Hovers, highlights |
| Destructive | Red | Errors, irreversible actions |
| Success | Green | Confirmations |

### Typography

- **Headings**: Geometric sans-serif, bold weight (streetwear feel)
- **Body**: Clean sans-serif, regular weight
- **Monospace**: For prices and data-heavy contexts

### Animations (CSS Native)

- **CSS Transitions**: Hovers, state changes, micro-interactions
- **CSS Animations + @keyframes**: Entrances, slide-ins (cart drawer, chatbot panel, mobile menu)
- **Scroll-driven animations**: CSS native API for on-scroll effects
- **View Transitions API**: Next.js page transitions (graceful degradation on unsupported browsers — pages load without transition animation)

No JavaScript animation libraries. All animations are CSS native for minimal bundle impact.

### Components

- **Product cards**: Dominant image, hover reveals second image, subtle scale effect, name and price below, heart icon for wishlist toggle
- **Navigation**: Fixed header with backdrop blur, centered logo, categories left, cart/account right
- **Mobile**: Hamburger menu with animated drawer, bottom bar with icons (home, shop, cart, account)
- **Cart**: Right-side drawer (not a separate page, except during checkout flow)
- **Chatbot**: Floating button bottom-right, expands as right-side panel with slide-in animation

### Admin Panel Layout

- Desktop: Fixed left sidebar with navigation, main content area on right
- Mobile: Collapsible sidebar as drawer, bottom navigation for key sections
- Functional and clean, follows dark theme but prioritizes readability and data density
- Paginated tables with inline search and filters
- Recharts with brand-consistent colors and informative tooltips
- Inline form validation, image upload previews

### Responsive

- **Mobile-first** design, scaled up to tablet and desktop
- **Breakpoints**: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px
- **Catalog grid**: 1 col mobile → 2 tablet → 3-4 desktop
- **Admin**: Fully responsive — optimized for mobile, tablet, and desktop

### Accessibility

- WCAG AA minimum contrast on all text
- Visible focus indicators on interactive elements
- Alt text on product images
- Functional keyboard navigation

---

## Analytics Metrics (Admin Dashboard)

### Basic
- Total sales (period)
- Orders per day
- Best-selling products
- Revenue

### Intermediate
- Registered users count
- Conversion rate
- Abandoned carts (from `carts` collection — carts with items but no completed order after 24h)

### Advanced
- Revenue by category
- Period comparisons (week over week, month over month)
- Geographic sales map (country-level aggregation from `shippingAddress.country` on orders — no geocoding needed)

All charts built with Recharts, data aggregated from Firestore orders collection.

---

## Promotion Types

| Type | Apply Mode | Description |
|------|-----------|-------------|
| Percentage discount | manual | User enters code, e.g., "ZERON20" for 20% off |
| Fixed amount discount | manual | User enters code, e.g., "$10 off" |
| Free shipping | manual or auto | Free shipping when order exceeds `minOrderAmount` |
| Auto-discount by category | auto | Automatically applied when cart contains items from `applicableCategories` |
| Auto-discount by amount | auto | Automatically applied when cart subtotal exceeds `minOrderAmount` |

Promotional banners are not a separate type — any promotion with `showBanner: true` displays its translated `banner` text on the storefront.

**Stacking rules**: Max 1 manual code + 1 auto-applied promotion per order. If multiple auto promotions qualify, the one with the highest discount value wins.

---

## Non-Goals (Out of Scope)

- Product reviews and ratings
- Inventory alerts / low stock notifications
- Order tracking integration with carriers
- Multi-currency (USD only, prices displayed in USD across all locales)
- Newsletter / email marketing
- A/B testing
- PWA / offline support
