# Zeron Online Store Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete streetwear e-commerce store for the Zeron brand with customer-facing shop, user accounts, admin panel, Stripe payments, Bedrock chatbot, and multi-language support.

**Architecture:** Next.js 15 App Router monolith with Firebase backend (Auth, Firestore, Storage). All business logic in Route Handlers. Admin panel at obfuscated `/zr-ops/` route. Dark-first streetwear aesthetic with CSS-native animations.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Firebase (Auth/Firestore/Storage), Stripe, Amazon Bedrock, Amazon SES, next-intl, next-themes, Recharts

**Spec:** `docs/superpowers/specs/2026-03-16-zeron-store-design.md`

---

## Chunk 1: Project Foundation

### Task 1.1: Scaffold Next.js Project

**Files:**
- Create: `zeron/package.json`
- Create: `zeron/tsconfig.json`
- Create: `zeron/next.config.ts`
- Create: `zeron/src/app/layout.tsx`
- Create: `zeron/src/app/globals.css` (includes Tailwind CSS 4 `@theme` config)
- Create: `zeron/.env.local.example`

- [ ] **Step 1: Create Next.js project**

```bash
cd /workspace && npx create-next-app@latest zeron --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Install core dependencies**

Ask user to install:
```
next-intl next-themes firebase firebase-admin stripe @aws-sdk/client-bedrock-runtime @aws-sdk/client-ses recharts lucide-react
```

- [ ] **Step 3: Create `.env.local.example`**

Create `zeron/.env.local.example` with all required env vars:
```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
SES_FROM_EMAIL=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Configure `next.config.ts`**

Set up next-intl plugin with locales `es`, `en`, `zh-HK`. Default locale `es`.

- [ ] **Step 5: Configure theme in `globals.css`**

Tailwind CSS 4 uses CSS-based configuration (no `tailwind.config.ts`). Define all theme tokens via `@theme` directive in `globals.css`:
- Colors: `--color-background: #0A0A0A`, `--color-surface: #141414`, `--color-accent: #E5E5E5`, brand gray, destructive red, success green
- Font families for headings (geometric sans) and body
- CSS custom properties for light theme overrides (`.light` class)
- CSS animation keyframes: `slide-in-right`, `slide-in-left`, `fade-in`, `scale-in`, `slide-down`

Note: If `create-next-app` generates a `tailwind.config.ts`, delete it and move config to CSS `@theme` block. Tailwind CSS 4 auto-detects content files.

- [ ] **Step 7: Verify dev server starts**

```bash
cd /workspace/zeron && npm run dev
```

- [ ] **Step 8: Commit**

```bash
git add zeron/ && git commit -m "feat: scaffold Next.js project with Tailwind and dependencies"
```

---

### Task 1.2: TypeScript Types

**Files:**
- Create: `zeron/src/types/index.ts`

- [ ] **Step 1: Define all shared types**

Types for: `User`, `Address`, `Product`, `Category`, `Order`, `OrderItem`, `Promotion`, `ChatbotKBEntry`, `WishlistDoc`, `CartDoc`, `CartItem`, `Settings`, `ChatbotRateLimit` (count, windowStart, key), `Locale` (`"es" | "en" | "zh-HK"`), `TranslatedField` (`Record<Locale, string>`).

All fields match Firestore data model in spec exactly. Monetary fields are `number` (cents).

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add TypeScript type definitions"
```

---

### Task 1.3: Firebase Configuration

**Files:**
- Create: `zeron/src/lib/firebase/client.ts` — client SDK init (uses `NEXT_PUBLIC_` vars)
- Create: `zeron/src/lib/firebase/admin.ts` — admin SDK init (uses server-only vars)
- Create: `zeron/src/lib/firebase/auth.ts` — auth helpers (signIn, signUp, signOut, resetPassword, Google/Apple providers)
- Create: `zeron/src/lib/firebase/firestore.ts` — typed Firestore helpers (getDoc, setDoc, query wrappers for each collection)
- Create: `zeron/src/lib/firebase/storage.ts` — upload/delete image helpers

- [ ] **Step 1: Create client SDK init**

Initialize Firebase app with public config. Export `auth` and `db` (Firestore) and `storage` instances.

- [ ] **Step 2: Create admin SDK init**

Initialize Firebase Admin with service account credentials from env vars. Export `adminAuth`, `adminDb`. Use singleton pattern to avoid re-initialization.

- [ ] **Step 3: Create auth helpers**

Export functions: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signInWithApple`, `signOutUser`, `resetPassword`, `updateUserPassword`. All wrap Firebase Auth SDK calls.

- [ ] **Step 4: Create Firestore helpers**

Typed CRUD functions per collection: `getProduct(id)`, `getProducts(filters)`, `getCategories()`, `getOrder(id)`, `getUserOrders(userId)`, `getPromotions()`, `getActivePromotions()`, `getSettings()`, `getCart(visitorId)`, `updateCart(visitorId, items)`, `getWishlist(userId)`, `toggleWishlistItem(userId, productId)`, etc.

- [ ] **Step 5: Create storage helpers**

`uploadImage(file, path): Promise<string>` and `deleteImage(url): Promise<void>`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Firebase client, admin, auth, firestore, and storage helpers"
```

---

### Task 1.4: Internationalization Setup

**Files:**
- Create: `zeron/src/messages/es.json`
- Create: `zeron/src/messages/en.json`
- Create: `zeron/src/messages/zh-HK.json`
- Create: `zeron/src/i18n/request.ts`
- Create: `zeron/src/i18n/routing.ts`
- Create: `zeron/src/i18n/navigation.ts`

- [ ] **Step 1: Create routing config**

In `routing.ts`: define locales `["es", "en", "zh-HK"]`, default locale `"es"`, `localePrefix: "always"`.

- [ ] **Step 2: Create request config**

In `request.ts`: `getRequestConfig` that loads the correct message file based on locale.

- [ ] **Step 3: Create navigation helpers**

In `navigation.ts`: export `Link`, `redirect`, `usePathname`, `useRouter` from `next-intl` with the routing config.

- [ ] **Step 4: Create translation files**

Start with base keys for: `nav` (home, shop, cart, account, login, signup, contact), `common` (addToCart, buyNow, outOfStock, loading, error), `product` (size, price, description, stock), `cart` (title, empty, subtotal, shipping, total, checkout, promoCode, apply), `auth` (email, password, login, signup, forgotPassword, resetPassword, orContinueWith), `account` (orders, profile, wishlist, password, addresses), `checkout` (shippingAddress, savedAddresses, newAddress, placeOrder), `contact` (title, name, email, message, send), `chatbot` (title, placeholder, rateLimitMessage).

All three files with same keys, properly translated. `zh-HK` in Traditional Chinese.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add i18n setup with ES/EN/zh-HK translations"
```

---

### Task 1.5: Middleware

**Files:**
- Create: `zeron/src/middleware.ts`

- [ ] **Step 1: Create middleware**

The middleware must handle three concerns in order:

1. **Exclude paths**: `/zr-ops/*`, `/api/*`, `/_next/*`, static files — skip locale processing for these.
2. **Admin protection**: If path starts with `/zr-ops`, verify Firebase auth token cookie (`__session`). Check `admin` custom claim via Firebase Admin SDK `verifyIdToken`. If missing/invalid, redirect to `/es/login?redirect=/zr-ops`.
3. **Account protection**: If URL path matches `/[locale]/account/*` (note: route group `(account)` is stripped from URLs — match on `/account/` in the actual path). Verify auth token cookie exists. If not, redirect to `/[locale]/login`.
4. **Locale handling**: Delegate to `next-intl` `createMiddleware` for all other routes.

Use `createMiddleware` from `next-intl/middleware` combined with custom logic.

- [ ] **Step 2: Verify middleware works**

Test that `/` redirects to `/es`, `/zr-ops` is protected, and `/api` routes pass through.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add middleware for i18n, auth, and admin protection"
```

---

### Task 1.6: Theme and Root Layout

**Files:**
- Create: `zeron/src/app/[locale]/layout.tsx`
- Create: `zeron/src/components/providers.tsx` — ThemeProvider + AuthProvider wrapper
- Create: `zeron/src/hooks/use-auth.ts` — auth context hook
- Create: `zeron/src/lib/auth-context.tsx` — AuthContext with Firebase onAuthStateChanged

- [ ] **Step 1: Create AuthContext**

Client component (`"use client"` directive required). React context that wraps `onAuthStateChanged`. Provides `user`, `loading`, `isAdmin` (read from custom claims via `getIdTokenResult`). Also stores/reads auth token in a cookie (`__session`) for middleware to verify.

- [ ] **Step 2: Create `use-auth` hook**

Simple `useContext(AuthContext)` wrapper with error if used outside provider.

- [ ] **Step 3: Create Providers component**

Wraps children with `ThemeProvider` (defaultTheme "dark", attribute "class") and `AuthProvider`.

- [ ] **Step 4: Create root layout `app/layout.tsx`**

HTML boilerplate, import globals.css, set fonts (Google Fonts: Space Grotesk for headings, Inter for body, JetBrains Mono for mono).

- [ ] **Step 5: Create locale layout `app/[locale]/layout.tsx`**

Wraps with `NextIntlClientProvider`, `Providers`. Sets `<html lang={locale}>`. Loads messages for locale.

- [ ] **Step 6: Verify app renders with dark theme**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add theme, auth context, providers, and locale layout"
```

---

## Chunk 2: Authentication

### Task 2.1: Auth Pages UI

**Files:**
- Create: `zeron/src/app/[locale]/(auth)/login/page.tsx`
- Create: `zeron/src/app/[locale]/(auth)/signup/page.tsx`
- Create: `zeron/src/app/[locale]/(auth)/forgot-password/page.tsx`
- Create: `zeron/src/app/[locale]/(auth)/layout.tsx` — centered card layout for auth pages
- Create: `zeron/src/components/auth/login-form.tsx`
- Create: `zeron/src/components/auth/signup-form.tsx`
- Create: `zeron/src/components/auth/forgot-password-form.tsx`
- Create: `zeron/src/components/auth/social-login-buttons.tsx`

- [ ] **Step 1: Create auth layout**

Centered layout with dark background, Zeron logo at top, card container for form content.

- [ ] **Step 2: Create social login buttons**

Google and Apple sign-in buttons. Styled with brand colors. Call `signInWithGoogle` / `signInWithApple` from auth helpers. On success, create/update user doc in Firestore and redirect.

- [ ] **Step 3: Create login form**

Email + password fields, submit handler calls `signInWithEmail`. Show validation errors inline. Link to signup and forgot-password. Include `SocialLoginButtons`. After login, check for `redirect` query param and navigate there, otherwise to `/`. If user has `admin` custom claim, show a discrete link to `/zr-ops/` on redirect.

- [ ] **Step 4: Create signup form**

Email + password + displayName fields. Calls `signUpWithEmail`, then creates user doc in Firestore with `role: "customer"`. Redirect to login with success message.

- [ ] **Step 5: Create forgot-password form**

Email field. Calls `resetPassword`. Shows success message.

- [ ] **Step 6: Create page files**

Each page.tsx imports its form component and wraps with translations.

- [ ] **Step 7: Verify login/signup/reset flows work**

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add auth pages — login, signup, forgot-password"
```

---

### Task 2.2: Admin Setup Script

**Files:**
- Create: `zeron/scripts/set-admin.ts`

- [ ] **Step 1: Create script**

Takes email as CLI argument. Uses Firebase Admin SDK to set custom claim `{ admin: true }` on the user and updates their Firestore user doc `role` to `"admin"`.

```bash
npx tsx scripts/set-admin.ts admin@zeron.com
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add admin setup script"
```

---

## Chunk 3: Store Layout & Navigation

### Task 3.1: Store Shell

**Files:**
- Create: `zeron/src/components/layout/header.tsx`
- Create: `zeron/src/components/layout/mobile-menu.tsx`
- Create: `zeron/src/components/layout/mobile-bottom-bar.tsx`
- Create: `zeron/src/components/layout/footer.tsx`
- Create: `zeron/src/components/layout/promo-banner.tsx`
- Create: `zeron/src/components/layout/locale-switcher.tsx`
- Create: `zeron/src/components/layout/theme-toggle.tsx`
- Create: `zeron/src/components/layout/cart-icon.tsx`
- Create: `zeron/src/app/[locale]/(shop)/layout.tsx`

- [ ] **Step 1: Create header**

Fixed top, backdrop-blur, semi-transparent dark bg. Left: category links (fetched from Firestore). Center: Zeron logo linking to home. Right: locale switcher, theme toggle, cart icon with item count badge (placeholder count until Chunk 4 wires CartContext), user icon (links to account or login). If user is admin (from AuthContext `isAdmin`), show a small gear/shield icon linking to `/zr-ops/`.

Mobile: hamburger menu button replaces category links.

- [ ] **Step 2: Create mobile menu**

Full-screen drawer from left. CSS `@keyframes slide-in-left`. Contains category links, account links, locale switcher, theme toggle. Close button.

- [ ] **Step 3: Create mobile bottom bar**

Fixed bottom bar visible only on `< md`. Icons: Home, Shop, Cart, Account. Active state indicator.

- [ ] **Step 4: Create promo banner**

Fetches active promotions with `showBanner: true` from Firestore. Displays translated banner text in a dismissible bar at very top of page. CSS slide-down animation.

- [ ] **Step 5: Create footer**

Brand info, category links, contact link, social placeholders, locale switcher, copyright.

- [ ] **Step 6: Create locale switcher**

Dropdown showing ES/EN/繁中. Uses `useRouter` and `usePathname` from `next-intl` to switch locale while keeping current path.

- [ ] **Step 7: Create theme toggle**

Button with sun/moon icon. Uses `useTheme` from `next-themes`.

- [ ] **Step 8: Create shop layout**

Wraps children with `PromoBanner`, `Header`, `main`, `Footer`, `MobileBottomBar`.

- [ ] **Step 9: Verify layout renders with all components**

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: add store shell — header, footer, mobile nav, promo banner"
```

---

### Task 3.2: Home Page

**Files:**
- Create: `zeron/src/app/[locale]/(shop)/page.tsx`
- Create: `zeron/src/components/home/hero.tsx`
- Create: `zeron/src/components/home/featured-products.tsx`
- Create: `zeron/src/components/home/category-grid.tsx`

- [ ] **Step 1: Create hero section**

First, ensure logo is in public dir: `cp /workspace/zeron_logo.webp /workspace/zeron/public/zeron_logo.webp`

Full-viewport-height section. Dark background with Zeron logo (`/zeron_logo.webp`) as large centered graphic. Bold heading text ("ZERON" or tagline). CTA button linking to `/shop`. CSS fade-in animation on load.

- [ ] **Step 2: Create featured products section**

Horizontal scroll row of product cards. Fetches latest active products (server component, Firestore query ordered by `createdAt` desc, limit 8). Section title translated.

- [ ] **Step 3: Create category grid**

Grid of category cards. Each card shows category image, translated name, links to `/shop/[category]`. 2 cols mobile, 4 cols desktop.

- [ ] **Step 4: Create home page**

Server component composing Hero + FeaturedProducts + CategoryGrid. Add `generateMetadata` for SEO (title, description, OG).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add home page — hero, featured products, category grid"
```

---

### Task 3.3: Product Card Component

**Files:**
- Create: `zeron/src/components/product/product-card.tsx`
- Create: `zeron/src/components/product/wishlist-button.tsx`
- Create: `zeron/src/lib/wishlist-context.tsx`
- Create: `zeron/src/hooks/use-wishlist.ts`

- [ ] **Step 1: Create wishlist context**

Client component (`"use client"`). Listens to auth state. When user is logged in, subscribes to `wishlists/{userId}` doc with `onSnapshot` for real-time updates. Provides: `wishlistIds: string[]`, `isInWishlist(productId)`, `toggleWishlist(productId)`, `loading`. Add `WishlistProvider` to `Providers` component.

- [ ] **Step 2: Create wishlist button**

Heart icon button (lucide-react `Heart`). Client component. Uses `useWishlist()` hook. If user is logged in, toggles product via context. Filled heart if `isInWishlist(productId)`, outline if not. If not logged in, redirects to login.

- [ ] **Step 3: Create product card**

Props: `product: Product`, `locale: Locale`. Displays first image, on hover shows second image (CSS transition on opacity). Product name (translated), price formatted as USD. Subtle scale transform on hover. Wishlist heart button in top-right corner. Links to `/shop/[category]/[slug]`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add product card with wishlist context and toggle"
```

---

### Task 3.4: Catalog & Category Pages

**Files:**
- Create: `zeron/src/app/[locale]/(shop)/shop/page.tsx`
- Create: `zeron/src/app/[locale]/(shop)/shop/[category]/page.tsx`
- Create: `zeron/src/components/shop/product-grid.tsx`
- Create: `zeron/src/components/shop/filters.tsx`
- Create: `zeron/src/components/shop/sort-select.tsx`

- [ ] **Step 1: Create filters component**

Client component. Sidebar on desktop, collapsible drawer on mobile. Filters: category checkboxes (from Firestore categories), size checkboxes (S/M/L/XL), price range (min/max inputs). Updates URL search params for server-side filtering.

- [ ] **Step 2: Create sort select**

Dropdown: newest, price low-high, price high-low, name A-Z. Updates URL search param `sort`.

- [ ] **Step 3: Create product grid**

Receives `products: Product[]`. Renders grid of `ProductCard`. Responsive: 1 col → 2 → 3 → 4. Shows "no products found" if empty.

- [ ] **Step 4: Create catalog page `/shop`**

Server component. Reads search params for filters/sort. Queries Firestore with filters. Renders Filters + SortSelect + ProductGrid. `generateMetadata` for SEO.

Note: Firestore compound queries (e.g., filter by category + sort by price) require composite indexes. These will be auto-suggested by Firestore error messages during development — follow the provided links to create them in Firebase Console.

- [ ] **Step 5: Create category page `/shop/[category]`**

Same as catalog but pre-filtered by category slug. Fetches category doc for translated name in heading and metadata.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add catalog and category pages with filters and sorting"
```

---

### Task 3.5: Product Detail Page

**Files:**
- Create: `zeron/src/app/[locale]/(shop)/shop/[category]/[slug]/page.tsx`
- Create: `zeron/src/components/product/product-gallery.tsx`
- Create: `zeron/src/components/product/size-selector.tsx`
- Create: `zeron/src/components/product/add-to-cart-button.tsx`
- Create: `zeron/src/components/product/product-jsonld.tsx`

- [ ] **Step 1: Create product gallery**

Main image + thumbnail strip below. Click thumbnail to change main image. CSS transition for image swap. Zoom on hover (CSS `transform: scale(1.5)` with `overflow: hidden`).

- [ ] **Step 2: Create size selector**

Row of size buttons (S, M, L, XL). Disabled + crossed out if stock is 0 for that size. Selected state with border highlight. Shows remaining stock count for selected size.

- [ ] **Step 3: Create add-to-cart button**

Client component. Requires size selection. On click, adds item to cart (Firestore `carts` collection via helper). Disabled if no size selected or out of stock. Shows "Added!" feedback briefly.

- [ ] **Step 4: Create JSON-LD component**

Renders `<script type="application/ld+json">` with schema.org/Product data: name, image, description, price, availability, brand "Zeron".

- [ ] **Step 5: Create product detail page**

Server component. Fetches product by slug. 404 if not found. Two-column layout: gallery left, info right (name, price, description, size selector, add to cart, wishlist button). ProductJsonLd. `generateMetadata` with product data + OG image from first product image. `hreflang` links.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add product detail page with gallery, sizes, add to cart, SEO"
```

---

## Chunk 4: Cart & Checkout

### Task 4.1: Cart System

**Files:**
- Create: `zeron/src/lib/cart-context.tsx` — cart context with Firestore sync
- Create: `zeron/src/hooks/use-cart.ts`
- Create: `zeron/src/components/cart/cart-drawer.tsx`
- Create: `zeron/src/components/cart/cart-item.tsx`
- Create: `zeron/src/app/[locale]/(shop)/cart/page.tsx`

- [ ] **Step 1: Create cart context**

Client component (`"use client"`). Manages cart state. Generates `visitorId` cookie if not present. Syncs cart items to Firestore `carts/{visitorId}`. On auth change, links cart to `userId`. Provides: `items`, `addItem(product, size, qty)`, `removeItem(productId, size)`, `updateQuantity(productId, size, qty)`, `clearCart()`, `itemCount`, `subtotal`, `isCartOpen`, `openCart()`, `closeCart()`.

- [ ] **Step 2: Create cart item component**

Displays product image, name, size, unit price, quantity selector (+/-), remove button, line total.

- [ ] **Step 3: Create cart drawer**

Right-side sliding panel (CSS `@keyframes slide-in-right`). Overlay backdrop. Lists CartItems. Shows subtotal. "View Cart" and "Checkout" buttons. Close button. Empty state message.

- [ ] **Step 4: Create cart page**

Full page cart view. CartItems list. Promo code input + apply button. Auto-promotions: call `getAutoPromotion()` via `/api/promotions/auto` Route Handler and display if qualifying. Price breakdown: subtotal, manual discount, auto discount, shipping (flat rate from settings), total. "Proceed to Checkout" button.

Promo code validation: calls `/api/promotions/validate` Route Handler.

- [ ] **Step 5: Wire cart into app**

- Add `CartProvider` to `Providers` component (`src/components/providers.tsx`)
- Add `<CartDrawer />` to `app/[locale]/(shop)/layout.tsx`
- Update `cart-icon.tsx` in header to use `useCart()` for `itemCount` and `openCart()` on click

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add cart system — context, drawer, cart page, promo codes"
```

---

### Task 4.2: Promotions API

**Files:**
- Create: `zeron/src/app/api/promotions/validate/route.ts`
- Create: `zeron/src/app/api/promotions/auto/route.ts`
- Create: `zeron/src/lib/promotions.ts` — server-side promotion logic

- [ ] **Step 1: Create promotion logic**

`validatePromoCode(code, cartItems, subtotal)`: checks code exists, is active, within date range, under max uses, meets min order amount, applicable categories match. Returns discount amount in cents or error.

`getAutoPromotion(cartItems, subtotal)`: queries active auto promotions, finds qualifying ones, returns the one with highest discount.

`calculateDiscount(promotion, cartItems, subtotal)`: computes discount based on type (percentage/fixed/free_shipping).

- [ ] **Step 2: Create validate API route**

POST `/api/promotions/validate`. Receives `{ code, items, subtotal }`. Calls `validatePromoCode`. Returns `{ valid, discount, promotion }` or `{ valid: false, error }`.

- [ ] **Step 3: Create auto-promotion API route**

POST `/api/promotions/auto`. Receives `{ items, subtotal }`. Calls `getAutoPromotion`. Returns `{ promotion, discount }` or `{ promotion: null }`. This is called by the cart page to show auto-applied discounts.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add promotions validation API"
```

---

### Task 4.3: Stripe Checkout

**Files:**
- Create: `zeron/src/app/api/checkout/route.ts`
- Create: `zeron/src/app/api/stripe/webhook/route.ts`
- Create: `zeron/src/lib/stripe.ts` — Stripe client init
- Create: `zeron/src/app/[locale]/(shop)/checkout/page.tsx`
- Create: `zeron/src/app/[locale]/(shop)/checkout/success/page.tsx`
- Create: `zeron/src/components/checkout/address-form.tsx`
- Create: `zeron/src/components/checkout/saved-addresses.tsx`
- Create: `zeron/src/lib/ses.ts` — SES email helper

- [ ] **Step 1: Create Stripe client**

Initialize Stripe with `STRIPE_SECRET_KEY`.

- [ ] **Step 2: Create SES helper**

`sendOrderConfirmation(to, order)`: sends order confirmation email via SES. HTML template with order details.

`sendContactEmail(from, name, message)`: sends contact form email via SES.

- [ ] **Step 3: Create checkout API route**

POST `/api/checkout`. Receives `{ items: [{productId, size, quantity}], shippingAddress, promotionCodes, visitorId }`. Server-side: fetches each product from Firestore to get authoritative prices (never trust client prices), validates stock availability per size, validates promotions via `validatePromoCode`/`getAutoPromotion`, fetches shipping from `settings/general`. Creates Stripe Checkout Session with calculated line items. Returns `{ sessionUrl }`. Uses Firebase Admin SDK for all Firestore reads.

- [ ] **Step 4: Create Stripe webhook route**

POST `/api/stripe/webhook`. Verifies Stripe signature. Handles:
- `checkout.session.completed`: Creates order in Firestore (paymentStatus: "paid", fulfillmentStatus: "processing"). Decrements product stock per size. Clears cart. Increments promo `currentUses`. Sends confirmation email via SES.
- `checkout.session.expired`: No-op (cart persists for retry).
- `charge.refunded`: Updates order `paymentStatus` to "refunded".

- [ ] **Step 5: Create saved addresses component**

Client component. If user logged in, fetches their addresses from user doc. Radio buttons to select. Default address pre-selected. "Use new address" option.

- [ ] **Step 6: Create address form**

Fields: recipientName, phone, street, city, state, country (dropdown), zip. Checkbox "Save this address to my profile". Validation on all fields.

- [ ] **Step 7: Create checkout page**

Protected (requires auth — redirect to login if not). Shows order summary. SavedAddresses or AddressForm. "Place Order" button that calls `/api/checkout`, then redirects to Stripe hosted checkout URL.

- [ ] **Step 8: Create success page**

Reads `session_id` from URL params. Displays order confirmation. Link to "View my orders".

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add checkout flow — Stripe integration, address selection, webhooks, email"
```

---

## Chunk 5: User Account

### Task 5.1: Account Layout & Orders

**Files:**
- Create: `zeron/src/app/[locale]/(account)/layout.tsx`
- Create: `zeron/src/app/[locale]/(account)/account/orders/page.tsx`
- Create: `zeron/src/app/[locale]/(account)/account/orders/[id]/page.tsx`
- Create: `zeron/src/components/account/account-nav.tsx`
- Create: `zeron/src/components/account/order-card.tsx`
- Create: `zeron/src/components/account/order-status-badge.tsx`

- [ ] **Step 1: Create account navigation**

Sidebar on desktop, horizontal tabs on mobile. Links: My Orders, Profile, Wishlist, Password.

- [ ] **Step 2: Create account layout**

AccountNav + main content area. Protected by middleware (redirects to login).

- [ ] **Step 3: Create order status badge**

Colored badge for payment + fulfillment status. Green for paid/delivered, yellow for processing, red for cancelled/refunded.

- [ ] **Step 4: Create order card**

Shows order date, order ID, item count, total, payment status badge, fulfillment status badge. Links to detail page.

- [ ] **Step 5: Create orders page**

Fetches user's orders from Firestore ordered by `createdAt` desc. Lists OrderCards. Empty state if no orders.

- [ ] **Step 6: Create order detail page**

Fetches single order. Shows all items with images, sizes, quantities, prices. Shipping address. Price breakdown. Status badges.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add account layout, orders list, and order detail pages"
```

---

### Task 5.2: Profile, Addresses & Password

**Files:**
- Create: `zeron/src/app/[locale]/(account)/account/profile/page.tsx`
- Create: `zeron/src/app/[locale]/(account)/account/password/page.tsx`
- Create: `zeron/src/components/account/profile-form.tsx`
- Create: `zeron/src/components/account/address-manager.tsx`
- Create: `zeron/src/components/account/password-form.tsx`

- [ ] **Step 1: Create profile form**

Edit displayName, email (read-only), preferredLocale (dropdown). Save updates to Firestore user doc.

- [ ] **Step 2: Create address manager**

List saved addresses. "Add new address" button opens address form. Edit/delete existing. Set default address toggle. Each address shows recipientName, full address, phone. Updates Firestore user doc `addresses` array.

- [ ] **Step 3: Create profile page**

Combines ProfileForm + AddressManager in sections.

- [ ] **Step 4: Create password form**

Current password + new password + confirm new password. First re-authenticates user with `reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword))` (required by Firebase before password change), then calls `updatePassword(user, newPassword)`. Validation: min 8 chars, passwords match. Show error if re-auth fails ("Current password is incorrect").

- [ ] **Step 5: Create password page**

Wraps PasswordForm.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add profile, address management, and password change pages"
```

---

### Task 5.3: Wishlist

**Files:**
- Create: `zeron/src/app/[locale]/(account)/account/wishlist/page.tsx`

- [ ] **Step 1: Create wishlist page**

Fetches user's wishlist doc. Fetches product data for each productId. Renders ProductCard grid (same as catalog). Each card has "Add to Cart" shortcut + remove from wishlist button. Empty state: "No saved items yet" with link to shop.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add wishlist page"
```

---

## Chunk 6: Admin Panel Core

### Task 6.1: Admin Layout

**Files:**
- Create: `zeron/src/app/zr-ops/layout.tsx`
- Create: `zeron/src/components/admin/admin-sidebar.tsx`
- Create: `zeron/src/components/admin/admin-mobile-nav.tsx`
- Create: `zeron/src/components/admin/admin-header.tsx`

- [ ] **Step 1: Create admin sidebar**

Fixed left sidebar. Links: Dashboard, Products, Categories, Orders, Analytics, Promotions, Chatbot KB. Active state highlight. Zeron logo at top. "Back to store" link at bottom. Collapsible on mobile as drawer.

- [ ] **Step 2: Create admin mobile nav**

Bottom bar for mobile with icons for key sections (Dashboard, Products, Orders, More dropdown).

- [ ] **Step 3: Create admin header**

Top bar with page title, admin user name/avatar, "View store" link.

- [ ] **Step 4: Create admin layout**

AdminSidebar + AdminHeader + main content area. Protected by middleware (admin claim). English only — no locale wrapper.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin panel layout — sidebar, mobile nav, header"
```

---

### Task 6.2: Admin Dashboard

**Files:**
- Create: `zeron/src/app/zr-ops/page.tsx`
- Create: `zeron/src/components/admin/dashboard/stat-card.tsx`
- Create: `zeron/src/components/admin/dashboard/recent-orders.tsx`
- Create: `zeron/src/components/admin/dashboard/sales-chart.tsx`

- [ ] **Step 1: Create stat card**

Small card showing a metric label, value, and optional trend indicator. Props: title, value, icon, trend.

- [ ] **Step 2: Create recent orders table**

Last 10 orders. Columns: order ID, customer, total, payment status, fulfillment status, date. Links to `/zr-ops/orders/[id]`.

- [ ] **Step 3: Create sales chart**

Recharts `AreaChart` showing revenue over last 7 days. Fetches orders and aggregates by day.

- [ ] **Step 4: Create dashboard page**

Server component. Fetches dashboard data directly from Firestore using Admin SDK: today's orders (sum revenue, count), pending orders count, registered users count. Passes data to StatCards + SalesChart + RecentOrders.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin dashboard with stats, chart, and recent orders"
```

---

### Task 6.3: Products CRUD

**Files:**
- Create: `zeron/src/app/zr-ops/products/page.tsx`
- Create: `zeron/src/app/zr-ops/products/new/page.tsx`
- Create: `zeron/src/app/zr-ops/products/[id]/edit/page.tsx`
- Create: `zeron/src/components/admin/products/product-table.tsx`
- Create: `zeron/src/components/admin/products/product-form.tsx`
- Create: `zeron/src/components/admin/products/image-upload.tsx`
- Create: `zeron/src/components/admin/products/translation-editor.tsx`
- Create: `zeron/src/app/api/admin/products/route.ts`
- Create: `zeron/src/app/api/admin/products/[id]/route.ts`

- [ ] **Step 1: Create product API routes**

`GET /api/admin/products`: list products with optional query params (search, category, status, page, limit). Returns paginated results.
`GET /api/admin/products/[id]`: get single product.
`POST /api/admin/products`: create product. Generates slug from English name. Saves to Firestore.
`PUT /api/admin/products/[id]`: update product.
`DELETE /api/admin/products/[id]`: archive product (set status to "archived", don't delete).

All routes verify admin auth token via Firebase Admin SDK `verifyIdToken` + check `admin` claim.

- [ ] **Step 2: Create image upload component**

Drag-and-drop zone + file picker. Uploads to Firebase Storage under `products/[productId]/`. Shows preview thumbnails. Reorder with drag. Delete button per image.

- [ ] **Step 3: Create translation editor**

Three-tab interface (ES/EN/繁中). Each tab has input fields for that locale. Used for name and description fields.

- [ ] **Step 4: Create product form**

TranslationEditor for name/description. Category dropdown. Base price input (displays as dollars, stores as cents). Sizes multi-select. Stock per size inputs. Tags input. Status dropdown. ImageUpload. Save button.

- [ ] **Step 5: Create product table**

Paginated table. Columns: image thumbnail, name (ES), category, price, total stock, status, actions (edit/archive). Search by name. Filter by category and status.

- [ ] **Step 6: Create product pages**

List page: ProductTable + "Add Product" button.
New page: ProductForm in create mode.
Edit page: ProductForm in edit mode, pre-filled with product data.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add admin products CRUD with translations and image upload"
```

---

### Task 6.4: Categories CRUD

**Files:**
- Create: `zeron/src/app/zr-ops/categories/page.tsx`
- Create: `zeron/src/components/admin/categories/category-table.tsx`
- Create: `zeron/src/components/admin/categories/category-form.tsx`
- Create: `zeron/src/app/api/admin/categories/route.ts`
- Create: `zeron/src/app/api/admin/categories/[id]/route.ts`

- [ ] **Step 1: Create category API routes**

`GET /api/admin/categories`: list all categories ordered by `order` field.
`POST /api/admin/categories`: create. Generate slug from English name.
`PUT /api/admin/categories/[id]`: update.
`DELETE /api/admin/categories/[id]`: delete, but prevent if products reference the category (return 409 error).

All admin-only (verify auth token + admin claim).

- [ ] **Step 2: Create category form**

TranslationEditor for name/description. Image upload (single). Display order number input. Save button. Used as modal/dialog for both create and edit.

- [ ] **Step 3: Create category table**

Columns: image, name (ES), product count, display order, actions (edit/delete). Drag to reorder (updates `order` field).

- [ ] **Step 4: Create categories page**

CategoryTable + "Add Category" button that opens CategoryForm modal.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin categories CRUD"
```

---

### Task 6.5: Orders Management

**Files:**
- Create: `zeron/src/app/zr-ops/orders/page.tsx`
- Create: `zeron/src/app/zr-ops/orders/[id]/page.tsx`
- Create: `zeron/src/components/admin/orders/order-table.tsx`
- Create: `zeron/src/components/admin/orders/order-detail.tsx`
- Create: `zeron/src/components/admin/orders/status-updater.tsx`
- Create: `zeron/src/app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Create order API route**

`GET /api/admin/orders`: list orders with query params (fulfillmentStatus, paymentStatus, search by ID/email, page, limit). Returns paginated results.
`GET /api/admin/orders/[id]`: get single order with full details.
`PUT /api/admin/orders/[id]`: update fulfillmentStatus. Validates status transitions (processing → shipped → delivered; any → cancelled).

All admin-only (verify auth token + admin claim).

- [ ] **Step 2: Create status updater**

Dropdown to change fulfillment status. Only shows valid next states. Confirmation dialog for cancellation.

- [ ] **Step 3: Create order table**

Paginated. Columns: order ID, customer email, items count, total, payment status, fulfillment status, date. Filter by fulfillment status and payment status. Search by order ID or customer email.

- [ ] **Step 4: Create order detail**

Full order info: customer details, items with images, shipping address, price breakdown, promotion codes applied, Stripe session link, status updater.

- [ ] **Step 5: Create order pages**

List page: OrderTable. Detail page: OrderDetail.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add admin orders management with status updates"
```

---

## Chunk 7: Admin Panel Extended

### Task 7.1: Promotions Management

**Files:**
- Create: `zeron/src/app/zr-ops/promotions/page.tsx`
- Create: `zeron/src/app/zr-ops/promotions/new/page.tsx`
- Create: `zeron/src/app/zr-ops/promotions/[id]/edit/page.tsx`
- Create: `zeron/src/components/admin/promotions/promotion-table.tsx`
- Create: `zeron/src/components/admin/promotions/promotion-form.tsx`
- Create: `zeron/src/app/api/admin/promotions/route.ts`
- Create: `zeron/src/app/api/admin/promotions/[id]/route.ts`

- [ ] **Step 1: Create promotion API routes**

CRUD endpoints. Admin-only. Validate: code uniqueness (for manual promos), date range, value ranges.

- [ ] **Step 2: Create promotion form**

Fields: applyMode toggle (manual/auto), code input (only if manual), type dropdown, value input (with label changing: "%" or "$" based on type), minOrderAmount, applicableCategories multi-select, date range picker, maxUses, banner text (TranslationEditor), showBanner toggle, active toggle.

- [ ] **Step 3: Create promotion table**

Columns: code (or "Auto"), type, value, apply mode, date range, uses, active toggle, actions. Filter by active/inactive and apply mode.

- [ ] **Step 4: Create promotion pages**

List, new, and edit pages.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin promotions management"
```

---

### Task 7.2: Analytics Dashboard

**Files:**
- Create: `zeron/src/app/zr-ops/analytics/page.tsx`
- Create: `zeron/src/components/admin/analytics/revenue-chart.tsx`
- Create: `zeron/src/components/admin/analytics/orders-chart.tsx`
- Create: `zeron/src/components/admin/analytics/top-products.tsx`
- Create: `zeron/src/components/admin/analytics/category-revenue.tsx`
- Create: `zeron/src/components/admin/analytics/geo-map.tsx`
- Create: `zeron/src/components/admin/analytics/conversion-stats.tsx`
- Create: `zeron/src/components/admin/analytics/period-selector.tsx`
- Create: `zeron/src/app/api/admin/analytics/route.ts`

- [ ] **Step 1: Create analytics API route**

`GET /api/admin/analytics?period=7d|30d|90d`. Aggregates from Firestore orders:
- Revenue per day
- Orders per day
- Top 10 products by units sold
- Revenue per category
- Country distribution
- Registered users count
- Conversion rate (orders / carts created)
- Abandoned cart count
- Period comparison (current vs previous)

Returns JSON payload consumed by chart components.

- [ ] **Step 2: Create period selector**

Toggle buttons: 7 days, 30 days, 90 days. Updates URL param.

- [ ] **Step 3: Create revenue chart**

Recharts `AreaChart`. Revenue over time. Comparison line for previous period (dashed). Tooltip with formatted values.

- [ ] **Step 4: Create orders chart**

Recharts `BarChart`. Orders per day.

- [ ] **Step 5: Create top products**

Recharts `BarChart` horizontal. Top 10 products by quantity sold.

- [ ] **Step 6: Create category revenue**

Recharts `PieChart`. Revenue share by category.

- [ ] **Step 7: Create geo map**

Recharts horizontal `BarChart` showing orders by country. Country-level aggregation from `shippingAddress.country`. Country names displayed as labels. Stays within Recharts (no external map library needed).

- [ ] **Step 8: Create conversion stats**

Cards showing: conversion rate %, abandoned carts count, registered users count. With period comparison arrows.

- [ ] **Step 9: Create analytics page**

PeriodSelector + grid layout of all chart components. Responsive: stacks on mobile.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: add admin analytics dashboard with Recharts"
```

---

### Task 7.3: Chatbot Knowledge Base

**Files:**
- Create: `zeron/src/app/zr-ops/chatbot-kb/page.tsx`
- Create: `zeron/src/components/admin/chatbot-kb/kb-table.tsx`
- Create: `zeron/src/components/admin/chatbot-kb/kb-form.tsx`
- Create: `zeron/src/app/api/admin/chatbot-kb/route.ts`
- Create: `zeron/src/app/api/admin/chatbot-kb/[id]/route.ts`

- [ ] **Step 1: Create KB API routes**

CRUD endpoints. Admin-only. Fields: title, content (textarea/markdown), category dropdown (products/policies/faq/sizing), active toggle.

- [ ] **Step 2: Create KB form**

Title input, category dropdown, content textarea (large, supports multiline), active toggle. Save button.

- [ ] **Step 3: Create KB table**

Columns: title, category, active toggle, last updated, actions (edit/delete). Filter by category.

- [ ] **Step 4: Create KB page**

KBTable + "Add Entry" button. Inline editing or modal for form.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add admin chatbot knowledge base management"
```

---

### Task 7.4: Admin Settings Page

**Files:**
- Create: `zeron/src/app/zr-ops/settings/page.tsx`
- Create: `zeron/src/components/admin/settings/settings-form.tsx`
- Create: `zeron/src/app/api/admin/settings/route.ts`

- [ ] **Step 1: Create settings API route**

`GET /api/admin/settings`: fetch `settings/general` doc.
`PUT /api/admin/settings`: update `settings/general` doc. Admin-only.

- [ ] **Step 2: Create settings form**

Fields: flatRateShipping (input in dollars, stored as cents), currency (read-only "USD" for now), defaultLocale dropdown. Save button.

- [ ] **Step 3: Create settings page**

SettingsForm. Add "Settings" link to admin sidebar.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add admin settings page for store configuration"
```

---

## Chunk 8: Chatbot

### Task 8.1: Bedrock Integration & Chat API

**Files:**
- Create: `zeron/src/lib/bedrock.ts` — Bedrock client
- Create: `zeron/src/app/api/chatbot/route.ts`
- Create: `zeron/src/lib/chatbot-rate-limit.ts`

- [ ] **Step 1: Create Bedrock client**

Initialize `BedrockRuntimeClient` with AWS credentials. Export `invokeModel(messages, systemPrompt)` function that calls Claude via Bedrock `InvokeModelWithResponseStream`. Returns async iterable of text chunks.

- [ ] **Step 2: Create rate limiter**

`checkRateLimit(key, isAuthenticated)`: reads `chatbot_rate_limits/{key}` from Firestore. If window expired, reset. If under limit (30 auth / 10 anon per 10 min), increment and allow. Otherwise reject. Returns `{ allowed: boolean, remaining: number }`.

- [ ] **Step 3: Create chatbot API route**

POST `/api/chatbot`. Receives `{ message, history, userId? }`.

1. Check rate limit (by userId or IP from headers).
2. Fetch all active KB entries from `chatbot_kb` using Firebase Admin SDK (required — Firestore rules restrict client reads to admin-only on this collection).
3. If userId provided, optionally fetch recent orders for context.
4. Build system prompt: "You are Zeron's shopping assistant. Help with products, sizing, orders, and store policies. Use the following knowledge base..." + KB content + order data if applicable.
5. Stream response from Bedrock back to client using `ReadableStream`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add chatbot API with Bedrock, KB context, and rate limiting"
```

---

### Task 8.2: Chat UI

**Files:**
- Create: `zeron/src/components/chatbot/chat-widget.tsx`
- Create: `zeron/src/components/chatbot/chat-panel.tsx`
- Create: `zeron/src/components/chatbot/chat-message.tsx`
- Create: `zeron/src/components/chatbot/chat-input.tsx`

- [ ] **Step 1: Create chat message**

Bubble component. User messages right-aligned dark surface. Bot messages left-aligned slightly lighter. Supports streaming text (renders as it arrives). Timestamp below.

- [ ] **Step 2: Create chat input**

Text input + send button. Disabled while streaming. Enter to send. Placeholder text translated.

- [ ] **Step 3: Create chat panel**

Right-side panel, full height. Header with "Zeron Assistant" title + close button. Scrollable message list. ChatInput at bottom. CSS `@keyframes slide-in-right` for panel entrance.

Manages conversation state: `messages[]`. On send: adds user message, calls `/api/chatbot` with `fetch` + streaming reader, progressively renders bot response.

Shows rate limit message if 429 received.

- [ ] **Step 4: Create chat widget**

Floating button in bottom-right corner. Click toggles ChatPanel open/closed. Badge with unread indicator. Visible on all shop pages (rendered in shop layout).

- [ ] **Step 5: Add chat widget to shop layout**

Add `<ChatWidget />` to `app/[locale]/(shop)/layout.tsx`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add chatbot UI — floating widget, chat panel, streaming messages"
```

---

## Chunk 9: Contact, SEO & Final Polish

### Task 9.1: Contact Page

**Files:**
- Create: `zeron/src/app/[locale]/(shop)/contact/page.tsx`
- Create: `zeron/src/components/contact/contact-form.tsx`
- Create: `zeron/src/app/api/contact/route.ts`

- [ ] **Step 1: Create contact API route**

POST `/api/contact`. Receives `{ name, email, message }`. Validates fields. Sends email via SES to store's contact email. Returns success/error.

- [ ] **Step 2: Create contact form**

Name, email, message (textarea) fields. Submit button. Success/error feedback. Client-side validation.

- [ ] **Step 3: Create contact page**

Contact form + store info (address placeholder, email). `generateMetadata` for SEO.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add contact page with SES email"
```

---

### Task 9.2: SEO — Sitemap, Robots, Hreflang

**Files:**
- Create: `zeron/src/app/sitemap.ts`
- Create: `zeron/src/app/robots.ts`

- [ ] **Step 1: Create dynamic sitemap**

Exports `generateSitemaps` and default function. Queries all active products and categories from Firestore. Generates URLs for all locales × all pages (home, shop, each category, each product, contact). Sets `lastModified` from `updatedAt`.

- [ ] **Step 2: Create robots.txt**

Allow all. Sitemap URL pointing to `/sitemap.xml`. Disallow `/zr-ops/` and `/api/`.

- [ ] **Step 3: Add `generateMetadata` sweep**

Ensure ALL pages have `generateMetadata` with: title, description, `alternates.languages` for hreflang (all 3 locales), canonical URL. Pages to verify/add: home, catalog, category, product detail, cart, checkout, contact, account pages, auth pages.

- [ ] **Step 4: Create OG image route**

Create `zeron/src/app/[locale]/(shop)/shop/[category]/[slug]/opengraph-image.tsx`. Uses Next.js `ImageResponse` to auto-generate OG images from the product's first image + product name + price overlaid. Falls back to a generic Zeron branded OG image for non-product pages.

- [ ] **Step 5: Verify JSON-LD on product pages**

Confirm the `ProductJsonLd` component (created in Task 3.5) renders correctly with schema.org/Product data. Test with Google Rich Results validator.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add sitemap, robots.txt, OG images, metadata sweep"
```

---

### Task 9.3: Firestore Security Rules & Firebase Storage Rules

**Files:**
- Create: `zeron/firestore.rules`
- Create: `zeron/storage.rules`

- [ ] **Step 1: Create Firestore security rules**

Note: All Route Handlers (`/api/*`) use Firebase Admin SDK, which bypasses these rules. These rules protect direct client-side Firestore access only. Orders are created by the Stripe webhook Route Handler (Admin SDK), so the admin-only write rule on orders is correct.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: read/write own doc, admins read all
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth.token.admin == true;
    }
    // Products, categories: public read, admin write
    match /products/{id} { allow read: if true; allow write: if request.auth.token.admin == true; }
    match /categories/{id} { allow read: if true; allow write: if request.auth.token.admin == true; }
    // Orders: user reads own, admin reads/writes all
    match /orders/{id} { allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.auth.token.admin == true); allow write: if request.auth.token.admin == true; }
    // Carts: visitor ID based, open write (validated server-side)
    match /carts/{id} { allow read, write: if true; }
    // Wishlists: user own doc only
    match /wishlists/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    // Promotions: public read active, admin write
    match /promotions/{id} { allow read: if true; allow write: if request.auth.token.admin == true; }
    // Settings: public read, admin write
    match /settings/{id} { allow read: if true; allow write: if request.auth.token.admin == true; }
    // Chatbot KB: server-side only reads, admin write
    match /chatbot_kb/{id} { allow read: if request.auth.token.admin == true; allow write: if request.auth.token.admin == true; }
    // Rate limits: server-side only
    match /chatbot_rate_limits/{id} { allow read, write: if false; }
  }
}
```

- [ ] **Step 2: Create Storage rules**

Admin-only uploads. Public reads for product/category images.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Firestore and Storage security rules"
```

---

### Task 9.4: Seed Data Script

**Files:**
- Create: `zeron/scripts/seed.ts`

- [ ] **Step 1: Create seed script**

Populates Firestore with:
- 4 categories (Camisetas, Pantalones, Sudaderas, Accesorios) with translations
- 12 sample products (3 per category) with translations, random stock, placeholder images
- 1 settings document (flat rate shipping: 999 = $9.99)
- 2 sample promotions (one manual "ZERON10" 10% off, one auto free shipping over $50)
- 5 chatbot KB entries (sizing guide, return policy, shipping info, brand story, FAQ)

Run with: `npx tsx scripts/seed.ts`

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add seed data script"
```

---

### Task 9.5: Copy Logo & Public Assets

- [ ] **Step 1: Copy logo**

```bash
cp /workspace/zeron_logo.webp /workspace/zeron/public/zeron_logo.webp
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: add Zeron logo to public assets"
```

---

## Dependencies Between Chunks

```
Chunk 1 (Foundation) ← everything depends on this
Chunk 2 (Auth) ← Chunks 4, 5, 6, 7, 8 depend on this
Chunk 3 (Store Layout) ← Chunks 4, 8 depend on this
Chunk 4 (Cart & Checkout) ← depends on 1+2+3
Chunk 5 (User Account) ← depends on 1+2
Chunk 6 (Admin Core) ← depends on 1+2
Chunk 7 (Admin Extended) ← depends on 6
Chunk 8 (Chatbot) ← depends on 2+3
Chunk 9 (Polish) ← depends on all others
```

**Parallel execution possible:** After Chunks 1-3, Chunks 4/5/6 can run in parallel. After 6, Chunks 7 and 8 can run in parallel.
