# Plan B: Newsletter Phase 1 — Subscribers & Admin

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store newsletter subscribers in Firestore when they submit the homepage form, and provide an admin page in `/zr-ops` to view subscribers and export them as CSV.

**Architecture:** A public API route receives email subscriptions and stores them in Firestore via the admin SDK. The newsletter component calls this API on submit. A new admin section in `/zr-ops/newsletter` displays subscribers in a paginated table with CSV export. The subscriber document ID is the normalized (lowercased) email for idempotency.

**Tech Stack:** React 19, Next.js 16, Firebase Firestore (admin SDK for server), TypeScript, Tailwind CSS, AWS SES (existing)

**Important:** After implementing each task, ask the user to test it before proceeding to the next task.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `NewsletterSubscriber` interface |
| `src/app/api/newsletter/subscribe/route.ts` | Create | Public POST endpoint — validates email, stores in Firestore |
| `src/components/home/newsletter.tsx` | Modify | Wire form to call the subscribe API |
| `src/app/api/admin/newsletter/subscribers/route.ts` | Create | Admin GET — paginated subscriber list |
| `src/app/api/admin/newsletter/subscribers/export/route.ts` | Create | Admin GET — CSV export of all subscribers |
| `src/components/admin/newsletter/subscriber-table.tsx` | Create | Client component — paginated table with export button |
| `src/app/zr-ops/newsletter/page.tsx` | Create | Admin page for newsletter subscribers |
| `src/components/admin/admin-sidebar.tsx` | Modify | Add Newsletter link to sidebar nav |
| `src/components/admin/admin-mobile-nav.tsx` | Modify | Add Newsletter link to mobile nav |

---

## Chunk 1: Subscribe API & Frontend Wiring

### Task 1: Add NewsletterSubscriber type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the interface at the end of the file (before the closing)**

Add after the last interface in `src/types/index.ts`:

```ts
export interface NewsletterSubscriber {
  email: string;
  locale: Locale;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  source: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add NewsletterSubscriber type"
```

---

### Task 2: Create the public subscribe API route

**Files:**
- Create: `src/app/api/newsletter/subscribe/route.ts`

- [ ] **Step 1: Create the API route**

This route:
- Rate limits: max 5 requests per IP per minute (in-memory store)
- Validates email format (regex + max 254 chars)
- Uses the normalized (lowercased, trimmed) email as the Firestore document ID (simpler than hashing, spec said hash but direct email is better for lookups)
- If the email already exists, returns 200 (idempotent) without error
- Stores via Firebase Admin SDK (server-side only)

```ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limiter (per-instance; resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, locale } = body;

    // Validate email
    if (
      !email ||
      typeof email !== "string" ||
      email.length > 254 ||
      !EMAIL_REGEX.test(email)
    ) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate locale
    const validLocales = ["es", "en", "zh-HK"];
    const subscriberLocale = validLocales.includes(locale) ? locale : "en";

    const normalizedEmail = email.toLowerCase().trim();
    const docRef = adminDb.collection("newsletter_subscribers").doc(normalizedEmail);

    const existing = await docRef.get();
    if (existing.exists) {
      // Idempotent — already subscribed
      return NextResponse.json({ ok: true });
    }

    await docRef.set({
      email: normalizedEmail,
      locale: subscriberLocale,
      subscribedAt: new Date(),
      unsubscribedAt: null,
      source: "homepage_footer",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Write to `src/app/api/newsletter/subscribe/route.ts`.

Note: This uses `adminDb` from `@/lib/firebase/admin` — the same admin Firestore instance used by other admin API routes. Verify this export exists by checking `src/lib/firebase/admin.ts` (it should export `adminDb` — the Firestore admin instance).

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/subscribe/route.ts
git commit -m "feat: add public newsletter subscribe API route"
```

---

### Task 3: Wire the newsletter form to call the API

**Files:**
- Modify: `src/components/home/newsletter.tsx`

- [ ] **Step 1: Update handleSubmit to call the API**

In `src/components/home/newsletter.tsx`, replace the `handleSubmit` function (lines 32-37):

```tsx
// Before:
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!email) return;
  setSubmitted(true);
  setEmail("");
}
```

With:

```tsx
const [error, setError] = useState(false);
const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!email || submitting) return;

  setError(false);
  setSubmitting(true);

  try {
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });

    if (!res.ok) throw new Error("Subscribe failed");

    setSubmitted(true);
    setEmail("");
  } catch {
    setError(true);
  } finally {
    setSubmitting(false);
  }
}
```

Additional changes needed:
1. Change the `next-intl` import at line 4 to also include `useLocale`:
   ```tsx
   import { useLocale, useTranslations } from "next-intl";
   ```

2. Add `const locale = useLocale();` after line 8 (inside the component, after `const t = useTranslations("newsletter");`).

4. Add an error message in the form area. After the success state div (line 94), before the form, add an error indicator. Actually, better to show it below the form — add after the `</form>` closing tag:
   ```tsx
   {error && (
     <p className="mt-3 text-sm text-red-500">
       {t("error") || "Something went wrong. Please try again."}
     </p>
   )}
   ```

5. Add a newsletter error translation key. For now, reuse the existing `common.error` key or add a specific one. Since the newsletter translations don't have an error key, add one to each locale file:
   - `en.json` → `"newsletter.error": "Something went wrong. Please try again."`
   - `es.json` → `"newsletter.error": "Algo salió mal. Inténtalo de nuevo."`
   - `zh-HK.json` → `"newsletter.error": "出了點問題，請再試一次。"`

6. Disable the submit button while submitting — add `disabled={submitting}` to the submit button and optionally add `opacity-50` when submitting.

- [ ] **Step 2: Update locale message files**

Add `"error"` key to the `"newsletter"` section of each locale file:

**`src/messages/en.json`** — in the `"newsletter"` block after `"disclaimer"`:
```json
"error": "Something went wrong. Please try again."
```

**`src/messages/es.json`** — in the `"newsletter"` block:
```json
"error": "Algo salió mal. Inténtalo de nuevo."
```

**`src/messages/zh-HK.json`** — in the `"newsletter"` block:
```json
"error": "出了點問題，請再試一次。"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/newsletter.tsx src/messages/en.json src/messages/es.json src/messages/zh-HK.json
git commit -m "feat: wire newsletter form to subscribe API with error handling"
```

- [ ] **Step 4: ASK USER TO TEST**

Ask the user to test:
1. Go to the homepage, scroll to the newsletter section
2. Enter an email and click "Subscribe"
3. Should see "Welcome to Team ZERON!" success message
4. Check Firestore console — a document should exist in `newsletter_subscribers` collection with the normalized email as doc ID
5. Submit the same email again — should still show success (idempotent), no error
6. Try submitting an invalid email — should show validation error from the browser (type="email" + required)

---

## Chunk 2: Admin Subscriber View

### Task 4: Create admin subscribers API route

**Files:**
- Create: `src/app/api/admin/newsletter/subscribers/route.ts`

- [ ] **Step 1: Create the paginated subscriber list endpoint**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const collection = adminDb.collection("newsletter_subscribers");

    // Get total count
    const countSnap = await collection.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limit);

    // Get paginated results ordered by subscribedAt descending
    const offset = (page - 1) * limit;
    const snap = await collection
      .orderBy("subscribedAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const subscribers = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        locale: data.locale,
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString() ?? null,
        unsubscribedAt: data.unsubscribedAt?.toDate?.()?.toISOString() ?? null,
        source: data.source,
      };
    });

    return NextResponse.json({
      subscribers,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Write to `src/app/api/admin/newsletter/subscribers/route.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/newsletter/subscribers/route.ts
git commit -m "feat: add admin API route for paginated newsletter subscribers"
```

---

### Task 5: Create CSV export API route

**Files:**
- Create: `src/app/api/admin/newsletter/subscribers/export/route.ts`

- [ ] **Step 1: Create the CSV export endpoint**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection("newsletter_subscribers")
      .orderBy("subscribedAt", "desc")
      .get();

    const header = "email,locale,subscribed_at,source";
    const rows = snap.docs.map((doc) => {
      const d = doc.data();
      const subscribedAt = d.subscribedAt?.toDate?.()?.toISOString() ?? "";
      return `${d.email},${d.locale},${subscribedAt},${d.source}`;
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export subscribers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Write to `src/app/api/admin/newsletter/subscribers/export/route.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/newsletter/subscribers/export/route.ts
git commit -m "feat: add admin CSV export route for newsletter subscribers"
```

---

### Task 6: Create the subscriber table component

**Files:**
- Create: `src/components/admin/newsletter/subscriber-table.tsx`

- [ ] **Step 1: Create the component**

Follow the same patterns as `src/components/admin/orders/order-table.tsx` — `useCallback` + `useEffect` for data fetching, pagination with ChevronLeft/ChevronRight, search support.

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Users } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  locale: string;
  subscribedAt: string | null;
  source: string;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SubscriberTable() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  async function handleExport() {
    try {
      const res = await fetch("/api/admin/newsletter/subscribers/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  }

  return (
    <div>
      {/* Stats and actions bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/20">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{total}</p>
            <p className="text-xs text-muted">Total subscribers</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-medium text-muted">Email</th>
              <th className="px-4 py-3 font-medium text-muted">Locale</th>
              <th className="px-4 py-3 font-medium text-muted">Subscribed</th>
              <th className="px-4 py-3 font-medium text-muted">Source</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No subscribers yet
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-border transition-colors hover:bg-background/50"
                >
                  <td className="px-4 py-3 text-accent">{sub.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted">
                      {sub.locale}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(sub.subscribedAt)}
                  </td>
                  <td className="px-4 py-3 text-muted">{sub.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border p-2 text-accent transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border p-2 text-accent transition-colors hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Write to `src/components/admin/newsletter/subscriber-table.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/newsletter/subscriber-table.tsx
git commit -m "feat: add subscriber table component for admin newsletter view"
```

---

### Task 7: Create the admin newsletter page

**Files:**
- Create: `src/app/zr-ops/newsletter/page.tsx`

- [ ] **Step 1: Create the page**

Follow the same pattern as `src/app/zr-ops/orders/page.tsx`:

```tsx
import { AdminHeader } from "@/components/admin/admin-header";
import { SubscriberTable } from "@/components/admin/newsletter/subscriber-table";

export default function NewsletterPage() {
  return (
    <>
      <AdminHeader title="Newsletter" />
      <div className="p-6">
        <h2 className="mb-6 text-3xl font-bold font-heading">Subscribers</h2>
        <SubscriberTable />
      </div>
    </>
  );
}
```

Write to `src/app/zr-ops/newsletter/page.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/app/zr-ops/newsletter/page.tsx
git commit -m "feat: add admin newsletter subscribers page"
```

---

### Task 8: Add Newsletter link to admin sidebar and mobile nav

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-mobile-nav.tsx`

- [ ] **Step 1: Update admin-sidebar.tsx**

In `src/components/admin/admin-sidebar.tsx`:

1. Add `Mail` to the lucide-react import (line 6-16):
   ```tsx
   import {
     LayoutDashboard,
     Package,
     Tags,
     ShoppingCart,
     BarChart3,
     Percent,
     MessageSquare,
     Settings,
     ArrowLeft,
     Mail,
   } from "lucide-react";
   ```

2. Add Newsletter entry to `navLinks` array (line 18-27), after the Promotions entry and before Chatbot KB:
   ```tsx
   { href: "/zr-ops/newsletter", label: "Newsletter", icon: Mail },
   ```

- [ ] **Step 2: Update admin-mobile-nav.tsx**

In `src/components/admin/admin-mobile-nav.tsx`:

1. Add `Mail` to the lucide-react import (line 7-20):
   ```tsx
   Mail,
   ```

2. Add Newsletter entry to `navLinks` array (line 22-31), after Promotions and before Chatbot KB:
   ```tsx
   { href: "/zr-ops/newsletter", label: "Newsletter", icon: Mail },
   ```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx src/components/admin/admin-mobile-nav.tsx
git commit -m "feat: add Newsletter link to admin sidebar and mobile nav"
```

- [ ] **Step 4: ASK USER TO TEST**

Ask the user to test:
1. Go to `/zr-ops` — "Newsletter" should appear in the sidebar between Promotions and Chatbot KB
2. Click "Newsletter" — should see the subscribers page with total count and table
3. If there are subscribers (from the earlier test), they should appear in the table
4. Click "Export CSV" — should download a CSV file with the subscriber data
5. Check pagination works if there are enough subscribers (or adjust limit to 1 for testing)
6. Test on mobile — Newsletter should appear in the drawer menu
