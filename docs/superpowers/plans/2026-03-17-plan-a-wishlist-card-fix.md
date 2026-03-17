# Plan A: Wishlist Persistence & Card Height Fix

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the wishlist heart button persist to Firestore for logged-in users, and make all product cards the same height by always showing the add-to-cart button (disabled "Out of stock" when no sizes available).

**Architecture:** Create a `WishlistContext` + `useWishlist` hook (mirroring the `CartContext`/`useCart` pattern) that loads wishlist IDs on mount via a one-time Firestore fetch, then wire the heart buttons in `ProductCard` and `ProductDetailClient` to use this hook. For the card fix, replace the conditional rendering of the add-to-cart button with an always-present button that shows "Out of stock" disabled state when no sizes are in stock.

**Tech Stack:** React 19, Next.js 16, Firebase Firestore (client SDK), TypeScript, Tailwind CSS, next-intl

**Important:** After implementing each task, ask the user to test it before proceeding to the next task.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/wishlist-context.tsx` | Create | WishlistProvider context — loads IDs from Firestore, exposes toggle/isWished |
| `src/hooks/use-wishlist.ts` | Create | Thin hook wrapping WishlistContext (like `use-cart.ts`) |
| `src/components/providers.tsx` | Modify | Add `WishlistProvider` to the provider tree |
| `src/components/product/product-card.tsx` | Modify | Replace `useState(false)` with `useWishlist()` for heart button; always show add-to-cart button |
| `src/components/product/product-detail-client.tsx` | Modify | Replace `useState(false)` with `useWishlist()` for heart button |

---

## Chunk 1: Wishlist Context & Hook

### Task 1: Create WishlistContext provider

**Files:**
- Create: `src/lib/wishlist-context.tsx`

- [ ] **Step 1: Create the wishlist context provider**

```tsx
"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { getWishlist, toggleWishlistItem } from "@/lib/firebase/firestore";

export interface WishlistState {
  wishlistIds: Set<string>;
  loading: boolean;
  toggle: (productId: string) => void;
  isWished: (productId: string) => boolean;
}

export const WishlistContext = createContext<WishlistState>({
  wishlistIds: new Set(),
  loading: true,
  toggle: () => {},
  isWished: () => false,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount / user change
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const doc = await getWishlist(user!.uid);
        if (!cancelled) {
          setWishlistIds(new Set(doc?.productIds ?? []));
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [user]);

  const toggle = useCallback(
    (productId: string) => {
      if (!user) return;

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      // Persist to Firestore — rollback on failure
      toggleWishlistItem(user.uid, productId).catch(() => {
        setWishlistIds((prev) => {
          const rollback = new Set(prev);
          if (rollback.has(productId)) {
            rollback.delete(productId);
          } else {
            rollback.add(productId);
          }
          return rollback;
        });
      });
    },
    [user]
  );

  const isWished = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return (
    <WishlistContext.Provider value={{ wishlistIds, loading, toggle, isWished }}>
      {children}
    </WishlistContext.Provider>
  );
}
```

Write this file to `src/lib/wishlist-context.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/wishlist-context.tsx
git commit -m "feat: add WishlistContext provider with optimistic Firestore sync"
```

---

### Task 2: Create useWishlist hook

**Files:**
- Create: `src/hooks/use-wishlist.ts`

- [ ] **Step 1: Create the hook**

Following the exact pattern of `src/hooks/use-cart.ts`:

```ts
"use client";

import { useContext } from "react";
import { WishlistContext } from "@/lib/wishlist-context";

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
```

Write to `src/hooks/use-wishlist.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-wishlist.ts
git commit -m "feat: add useWishlist hook"
```

---

### Task 3: Add WishlistProvider to the provider tree

**Files:**
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Add WishlistProvider wrapping children, inside CartProvider**

The current provider tree in `src/components/providers.tsx` (lines 10-23) is:
```tsx
<ThemeProvider>
  <AuthProvider>
    <AuthModalProvider>
      <CartProvider>
        {children}
        <AuthModal />
      </CartProvider>
    </AuthModalProvider>
  </AuthProvider>
</ThemeProvider>
```

Add `WishlistProvider` inside `CartProvider` (it needs `AuthProvider` above it since it calls `useAuth()`):

```tsx
import { WishlistProvider } from "@/lib/wishlist-context";

// In the JSX tree, wrap children with WishlistProvider:
<CartProvider>
  <WishlistProvider>
    {children}
    <AuthModal />
  </WishlistProvider>
</CartProvider>
```

Changes needed:
1. Add import: `import { WishlistProvider } from "@/lib/wishlist-context";` after line 5
2. Wrap `{children}` and `<AuthModal />` with `<WishlistProvider>...</WishlistProvider>` inside `CartProvider`

- [ ] **Step 2: Commit**

```bash
git add src/components/providers.tsx
git commit -m "feat: add WishlistProvider to app provider tree"
```

---

### Task 4: Wire heart button in ProductCard

**Files:**
- Modify: `src/components/product/product-card.tsx`

- [ ] **Step 1: Replace local isWished state with useWishlist hook**

Changes to `src/components/product/product-card.tsx`:

1. **Add import** (after line 7):
   ```tsx
   import { useWishlist } from "@/hooks/use-wishlist";
   ```

2. **Replace line 17** (`const [isWished, setIsWished] = useState(false);`) with:
   ```tsx
   const { isWished, toggle: toggleWishlist } = useWishlist();
   ```

3. **Replace lines 46-49** (the heart button onClick handler):
   ```tsx
   // Before:
   onClick={(e) => {
     e.preventDefault();
     setIsWished((prev) => !prev);
   }}

   // After:
   onClick={(e) => {
     e.preventDefault();
     toggleWishlist(product.id);
   }}
   ```

4. **Replace lines 54-56** (the Heart className that checks `isWished`):
   ```tsx
   // Before:
   className={`h-4 w-4 transition-colors ${
     isWished ? "fill-red-500 text-red-500" : "text-accent"
   }`}

   // After:
   className={`h-4 w-4 transition-colors ${
     isWished(product.id) ? "fill-red-500 text-red-500" : "text-accent"
   }`}
   ```

5. **Clean up unused import**: Remove `useState` from the React import if it's no longer used elsewhere. Check: `showSizes` and `added` still use `useState`, so keep it.

- [ ] **Step 2: Commit**

```bash
git add src/components/product/product-card.tsx
git commit -m "feat: wire product card heart button to WishlistContext"
```

---

### Task 5: Wire heart button in ProductDetailClient

**Files:**
- Modify: `src/components/product/product-detail-client.tsx`

- [ ] **Step 1: Replace local isWished state with useWishlist hook**

Changes to `src/components/product/product-detail-client.tsx`:

1. **Replace line 3** (`import { useState } from "react";`):
   Since `selectedSize` still uses `useState`, keep it. Add the wishlist import:
   ```tsx
   import { useWishlist } from "@/hooks/use-wishlist";
   ```

2. **Replace line 15** (`const [isWished, setIsWished] = useState(false);`) with:
   ```tsx
   const { isWished, toggle: toggleWishlist } = useWishlist();
   ```

3. **Replace line 31** (the heart button onClick):
   ```tsx
   // Before:
   onClick={() => setIsWished((prev) => !prev)}

   // After:
   onClick={() => toggleWishlist(product.id)}
   ```

4. **Replace line 32-35** (the button className condition):
   ```tsx
   // Before:
   className={`flex h-14 w-14 items-center justify-center rounded-lg border transition-colors ${
     isWished
       ? "border-red-500 bg-red-500/10 text-red-500"
       : "border-border text-muted hover:text-accent hover:border-accent"
   }`}

   // After:
   className={`flex h-14 w-14 items-center justify-center rounded-lg border transition-colors ${
     isWished(product.id)
       ? "border-red-500 bg-red-500/10 text-red-500"
       : "border-border text-muted hover:text-accent hover:border-accent"
   }`}
   ```

5. **Replace line 40** (Heart className):
   ```tsx
   // Before:
   className={`h-5 w-5 ${isWished ? "fill-red-500" : ""}`}

   // After:
   className={`h-5 w-5 ${isWished(product.id) ? "fill-red-500" : ""}`}
   ```

- [ ] **Step 2: Commit**

```bash
git add src/components/product/product-detail-client.tsx
git commit -m "feat: wire product detail heart button to WishlistContext"
```

- [ ] **Step 3: ASK USER TO TEST**

Ask the user to test:
1. Log in, go to `/shop`, click heart on a product card
2. Refresh the page — the heart should still be filled red
3. Click again to remove — refresh — should be unfilled
4. Go to a product detail page, test heart there too
5. Log out — hearts should all be unfilled, clicking should do nothing

---

## Chunk 2: Card Height Fix

### Task 6: Always show add-to-cart button (disabled "Out of stock" when empty)

**Files:**
- Modify: `src/components/product/product-card.tsx`

- [ ] **Step 1: Replace conditional rendering with always-present button**

In `src/components/product/product-card.tsx`, replace lines 96-153 (the entire `{availableSizes.length > 0 && (...)}` block) with:

```tsx
{/* Add to cart / Out of stock button */}
<div className="relative mt-3">
  {availableSizes.length > 0 ? (
    <>
      <button
        onClick={() => setShowSizes((prev) => !prev)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 sm:gap-2 sm:py-2 sm:text-xs ${
          added
            ? "border-success bg-success/10 text-success"
            : "border-border text-muted hover:border-highlight hover:text-highlight"
        }`}
      >
        {added ? (
          <>
            <Check className="h-3.5 w-3.5" />
            {tProduct("addedToCart")}
          </>
        ) : (
          <>
            <ShoppingBag className="h-3.5 w-3.5" />
            {t("addToCart")}
          </>
        )}
      </button>

      {/* Size picker overlay */}
      {showSizes && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowSizes(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-1 animate-scale-in rounded-lg border border-border bg-surface p-3 shadow-xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {tProduct("selectSize")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((size) => {
                const inStock = (product.stock[size] ?? 0) > 0;
                return (
                  <button
                    key={size}
                    disabled={!inStock}
                    onClick={() => handleAddToCart(size)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      inStock
                        ? "border-border text-accent hover:border-highlight hover:text-highlight"
                        : "border-border/50 text-muted/40 line-through"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  ) : (
    <button
      disabled
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted opacity-50 cursor-not-allowed sm:gap-2 sm:py-2 sm:text-xs"
    >
      {t("outOfStock")}
    </button>
  )}
</div>
```

Key changes:
- The outer `<div className="relative mt-3">` is now always rendered (not conditional)
- Inside: ternary — if sizes available, show add-to-cart + size picker (unchanged logic); if not, show disabled "Out of stock" button
- The disabled button uses the same `w-full py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider` as the active button for matching height
- Uses existing translation key `t("outOfStock")` from `common` namespace (already exists: "Out of Stock" / "Agotado" / "已售罄")

- [ ] **Step 2: Commit**

```bash
git add src/components/product/product-card.tsx
git commit -m "fix: always show add-to-cart button, disabled Out of Stock when no sizes"
```

- [ ] **Step 3: ASK USER TO TEST**

Ask the user to test:
1. Go to `/shop` and find a product that is out of stock (or temporarily set all stock to 0 for a product in the admin)
2. Verify all cards in the grid have the same height
3. The out-of-stock card should show a grayed-out "Out of stock" / "Agotado" button
4. Check related products on any product detail page — heights should also be uniform
5. Verify the button is not clickable (cursor should be not-allowed)
