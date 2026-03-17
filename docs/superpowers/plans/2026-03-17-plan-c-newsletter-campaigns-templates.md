# Plan C: Newsletter Phases 2-3 — Campaigns & Templates

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email campaign creation, scheduling, and sending to the newsletter system. Admins can compose campaigns (with HTML preview), send them immediately or schedule for later, and manage reusable templates. Campaigns are sent via AWS SES to all active subscribers. All emails include an unsubscribe link.

**Architecture:** Campaigns and templates are stored in Firestore collections. Admin CRUD pages under `/zr-ops/newsletter/campaigns` and `/zr-ops/newsletter/templates`. Campaign sending iterates over active subscribers and sends via the existing SES client with throttling. Scheduled campaigns are processed by a cron API route. Unsubscribe uses JWT tokens for secure identification.

**Tech Stack:** React 19, Next.js 16, Firebase Firestore (admin SDK), AWS SES, TypeScript, Tailwind CSS, `jsonwebtoken` for unsubscribe tokens

**Important:** After implementing each task, ask the user to test it before proceeding to the next task.

**Prerequisite:** Plan B (Newsletter Phase 1) must be completed first — the `newsletter_subscribers` collection and admin newsletter section must exist.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `Campaign` and `CampaignTemplate` interfaces |
| `src/app/api/admin/newsletter/campaigns/route.ts` | Create | GET (list) + POST (create) campaigns |
| `src/app/api/admin/newsletter/campaigns/[id]/route.ts` | Create | GET (detail) + PUT (update draft) |
| `src/app/api/admin/newsletter/campaigns/[id]/send/route.ts` | Create | POST — send campaign now |
| `src/app/api/admin/newsletter/campaigns/[id]/schedule/route.ts` | Create | POST — schedule campaign |
| `src/lib/campaign-sender.ts` | Create | Core send logic: iterate subscribers, send via SES, update counters |
| `src/lib/unsubscribe.ts` | Create | JWT sign/verify for unsubscribe tokens |
| `src/app/api/newsletter/unsubscribe/route.ts` | Create | GET — process unsubscribe via JWT token |
| `src/app/api/cron/newsletter/route.ts` | Create | GET — process scheduled campaigns (cron) |
| `src/components/admin/newsletter/campaign-list.tsx` | Create | Campaign list page component |
| `src/components/admin/newsletter/campaign-form.tsx` | Create | Campaign create/edit form with HTML preview |
| `src/app/zr-ops/newsletter/campaigns/page.tsx` | Create | Admin campaigns list page |
| `src/app/zr-ops/newsletter/campaigns/new/page.tsx` | Create | Admin create campaign page |
| `src/app/zr-ops/newsletter/campaigns/[id]/page.tsx` | Create | Admin campaign detail (view results) |
| `src/app/zr-ops/newsletter/campaigns/[id]/edit/page.tsx` | Create | Admin edit campaign (draft only) |
| `src/app/api/admin/newsletter/templates/route.ts` | Create | GET (list) + POST (create) templates |
| `src/app/api/admin/newsletter/templates/[id]/route.ts` | Create | GET + PUT + DELETE templates |
| `src/components/admin/newsletter/template-list.tsx` | Create | Template list page component |
| `src/components/admin/newsletter/template-form.tsx` | Create | Template create/edit form with preview |
| `src/app/zr-ops/newsletter/templates/page.tsx` | Create | Admin templates list page |
| `src/app/zr-ops/newsletter/templates/new/page.tsx` | Create | Admin create template page |
| `src/app/zr-ops/newsletter/templates/[id]/edit/page.tsx` | Create | Admin edit template page |
| `src/components/admin/newsletter/html-preview.tsx` | Create | Shared iframe preview component |
| `src/components/admin/newsletter/newsletter-subnav.tsx` | Create | Sub-navigation: Subscribers / Campaigns / Templates |
| `src/app/zr-ops/newsletter/layout.tsx` | Create | Newsletter section layout with sub-nav |
| `src/app/zr-ops/newsletter/page.tsx` | Modify | Remove duplicate AdminHeader (now in layout) |
| `src/components/admin/newsletter/campaign-form-wrapper.tsx` | Create | Client wrapper that fetches templates + campaign data for form |
| `src/components/admin/newsletter/campaign-detail.tsx` | Create | Campaign detail view with stats and email preview |

---

## Chunk 1: Types, Unsubscribe & Campaign Sender Core

### Task 1: Add Campaign and CampaignTemplate types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the interfaces after `NewsletterSubscriber`**

```ts
export interface Campaign {
  id: string;
  subject: string;
  body: string;
  templateId: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: Date | null;
  sentAt: Date | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Campaign and CampaignTemplate types"
```

---

### Task 2: Create unsubscribe token utility

**Files:**
- Create: `src/lib/unsubscribe.ts`

- [ ] **Step 1: Create the JWT sign/verify utility**

Note: This requires the `jsonwebtoken` package. Check if it's already installed. If not, the user will need to install it (`pnpm add jsonwebtoken` + `pnpm add -D @types/jsonwebtoken`).

```ts
import jwt from "jsonwebtoken";

const SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || "newsletter-unsubscribe-secret";

export function createUnsubscribeToken(email: string): string {
  return jwt.sign({ email }, SECRET, { expiresIn: "90d" });
}

export function verifyUnsubscribeToken(token: string): { email: string } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { email: string };
    return payload;
  } catch {
    return null;
  }
}
```

Write to `src/lib/unsubscribe.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/unsubscribe.ts
git commit -m "feat: add JWT-based unsubscribe token utility"
```

---

### Task 3: Create unsubscribe API route

**Files:**
- Create: `src/app/api/newsletter/unsubscribe/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(renderPage("Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return new NextResponse(renderPage("This unsubscribe link has expired or is invalid."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const docRef = adminDb.collection("newsletter_subscribers").doc(payload.email);
    const snap = await docRef.get();

    if (snap.exists) {
      await docRef.update({ unsubscribedAt: new Date() });
    }

    return new NextResponse(renderPage("You have been unsubscribed successfully."), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(renderPage("Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

function renderPage(message: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Unsubscribe — ZERON</title></head>
<body style="background:#0a0a0a;color:#e5e5e5;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <h1 style="font-size:24px;margin-bottom:16px;">ZERON</h1>
    <p style="color:#888;font-size:16px;">${message}</p>
  </div>
</body></html>`;
}
```

Write to `src/app/api/newsletter/unsubscribe/route.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/unsubscribe/route.ts
git commit -m "feat: add newsletter unsubscribe route with JWT verification"
```

---

### Task 4: Create campaign sender core logic

**Files:**
- Create: `src/lib/campaign-sender.ts`

- [ ] **Step 1: Create the sender module**

This module:
- Fetches all active subscribers (unsubscribedAt == null)
- Sends emails via SES with throttling (10/sec)
- Includes unsubscribe link in footer
- Updates campaign counters and status

Note: This module reuses the SES configuration from `src/lib/ses.ts`. We need to export the existing `ses` client and `fromEmail` from that file first. Add these exports to `src/lib/ses.ts`:
```ts
export { ses, fromEmail };
```

Then create `campaign-sender.ts`:

```ts
import { adminDb } from "@/lib/firebase/admin";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { ses, fromEmail } from "@/lib/ses";
import { createUnsubscribeToken } from "@/lib/unsubscribe";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://zeron.store";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendCampaign(campaignId: string): Promise<void> {
  const campaignRef = adminDb.collection("campaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();

  if (!campaignSnap.exists) {
    throw new Error("Campaign not found");
  }

  const campaign = campaignSnap.data()!;

  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    throw new Error(`Cannot send campaign with status: ${campaign.status}`);
  }

  // Mark as sending
  await campaignRef.update({ status: "sending", updatedAt: new Date() });

  // Fetch active subscribers
  const subscribersSnap = await adminDb
    .collection("newsletter_subscribers")
    .where("unsubscribedAt", "==", null)
    .get();

  const subscribers = subscribersSnap.docs.map((doc) => doc.data());
  const recipientCount = subscribers.length;

  await campaignRef.update({ recipientCount });

  let successCount = 0;
  let failureCount = 0;

  // Send with throttling (10 emails/sec = 100ms between each)
  for (const sub of subscribers) {
    try {
      const unsubToken = createUnsubscribeToken(sub.email);
      const unsubLink = `${baseUrl}/api/newsletter/unsubscribe?token=${unsubToken}`;

      const htmlWithUnsubscribe = `${campaign.body}
        <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #333;">
          <p style="color:#666;font-size:12px;">
            You received this email because you subscribed to the ZERON newsletter.<br>
            <a href="${unsubLink}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
          </p>
        </div>`;

      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: { ToAddresses: [sub.email] },
        Message: {
          Subject: { Data: campaign.subject, Charset: "UTF-8" },
          Body: { Html: { Data: htmlWithUnsubscribe, Charset: "UTF-8" } },
        },
      });

      await ses.send(command);
      successCount++;
    } catch (err) {
      console.error(`Failed to send to ${sub.email}:`, err);
      failureCount++;
    }

    // Throttle: 100ms between emails = ~10/sec
    await sleep(100);
  }

  // Determine final status
  const finalStatus =
    recipientCount > 0 && failureCount / recipientCount > 0.5
      ? "failed"
      : "sent";

  await campaignRef.update({
    status: finalStatus,
    sentAt: new Date(),
    successCount,
    failureCount,
    updatedAt: new Date(),
  });
}
```

Write to `src/lib/campaign-sender.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/campaign-sender.ts
git commit -m "feat: add campaign sender with SES throttling and unsubscribe links"
```

- [ ] **Step 3: ASK USER TO TEST**

Ask the user to verify:
1. The `jsonwebtoken` package is installed (check `package.json`). If not, install it: `pnpm add jsonwebtoken && pnpm add -D @types/jsonwebtoken`
2. The app compiles without errors: `pnpm build` or `pnpm dev`
3. No runtime test yet — we'll test campaigns end-to-end after the admin UI is built

---

## Chunk 2: Campaign API Routes

### Task 5: Create campaign list + create API route

**Files:**
- Create: `src/app/api/admin/newsletter/campaigns/route.ts`

- [ ] **Step 1: Create the route**

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
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const collection = adminDb.collection("campaigns");

    const countSnap = await collection.count().get();
    const total = countSnap.data().count;
    const totalPages = Math.ceil(total / limit);

    const offset = (page - 1) * limit;
    const snap = await collection
      .orderBy("createdAt", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    const campaigns = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        subject: d.subject,
        status: d.status,
        scheduledAt: d.scheduledAt?.toDate?.()?.toISOString() ?? null,
        sentAt: d.sentAt?.toDate?.()?.toISOString() ?? null,
        recipientCount: d.recipientCount ?? 0,
        successCount: d.successCount ?? 0,
        failureCount: d.failureCount ?? 0,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ campaigns, total, page, totalPages });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, body: htmlBody, templateId } = body;

    if (!subject || !htmlBody) {
      return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
    }

    const now = new Date();
    const docRef = await adminDb.collection("campaigns").add({
      subject,
      body: htmlBody,
      templateId: templateId || null,
      status: "draft",
      scheduledAt: null,
      sentAt: null,
      recipientCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/campaigns/route.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/newsletter/campaigns/route.ts
git commit -m "feat: add campaign list and create API routes"
```

---

### Task 6: Create campaign detail + update API route

**Files:**
- Create: `src/app/api/admin/newsletter/campaigns/[id]/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const snap = await adminDb.collection("campaigns").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const d = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      subject: d.subject,
      body: d.body,
      templateId: d.templateId ?? null,
      status: d.status,
      scheduledAt: d.scheduledAt?.toDate?.()?.toISOString() ?? null,
      sentAt: d.sentAt?.toDate?.()?.toISOString() ?? null,
      recipientCount: d.recipientCount ?? 0,
      successCount: d.successCount ?? 0,
      failureCount: d.failureCount ?? 0,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("campaigns").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (snap.data()!.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;

    await docRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/campaigns/[id]/route.ts`.

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/admin/newsletter/campaigns/[id]/route.ts"
git commit -m "feat: add campaign detail and update API routes"
```

---

### Task 7: Create campaign send + schedule API routes

**Files:**
- Create: `src/app/api/admin/newsletter/campaigns/[id]/send/route.ts`
- Create: `src/app/api/admin/newsletter/campaigns/[id]/schedule/route.ts`

- [ ] **Step 1: Create the send route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { sendCampaign } from "@/lib/campaign-sender";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    // Fire and forget — sending happens async
    sendCampaign(id).catch((err) =>
      console.error(`Campaign ${id} send failed:`, err)
    );

    return NextResponse.json({ ok: true, message: "Campaign sending started" });
  } catch (error) {
    console.error("Failed to start campaign send:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/campaigns/[id]/send/route.ts`.

- [ ] **Step 2: Create the schedule route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "scheduledAt is required" },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledAt must be a valid future date" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("campaigns").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (snap.data()!.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft campaigns can be scheduled" },
        { status: 400 }
      );
    }

    await docRef.update({
      status: "scheduled",
      scheduledAt: scheduleDate,
      updatedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to schedule campaign:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/campaigns/[id]/schedule/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/newsletter/campaigns/[id]/send/route.ts" "src/app/api/admin/newsletter/campaigns/[id]/schedule/route.ts"
git commit -m "feat: add campaign send and schedule API routes"
```

---

### Task 8: Create cron route for scheduled campaigns

**Files:**
- Create: `src/app/api/cron/newsletter/route.ts`

- [ ] **Step 1: Create the cron route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendCampaign } from "@/lib/campaign-sender";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const snap = await adminDb
      .collection("campaigns")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .get();

    const campaignIds = snap.docs.map((doc) => doc.id);

    // Process each campaign
    for (const id of campaignIds) {
      try {
        await sendCampaign(id);
      } catch (err) {
        console.error(`Cron: failed to send campaign ${id}:`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      processed: campaignIds.length,
    });
  } catch (error) {
    console.error("Cron newsletter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/cron/newsletter/route.ts`.

Note: For Vercel deployment, add a `vercel.json` cron config or use the Vercel dashboard to configure the cron job to hit `GET /api/cron/newsletter` periodically (e.g., every 5 minutes). Set `CRON_SECRET` env variable for auth.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/cron/newsletter/route.ts
git commit -m "feat: add cron route for processing scheduled campaigns"
```

- [ ] **Step 3: ASK USER TO TEST**

Ask the user to verify:
1. The app compiles: `pnpm dev`
2. Check that `jsonwebtoken` is installed — if not, install now
3. No runtime test yet — we'll test after the admin UI is built

---

## Chunk 3: Campaign Admin UI

### Task 9: Create shared HTML preview component

**Files:**
- Create: `src/components/admin/newsletter/html-preview.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useRef, useEffect } from "react";

interface HtmlPreviewProps {
  html: string;
  className?: string;
}

export function HtmlPreview({ html, className = "" }: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      className={`w-full rounded-lg border border-border bg-white ${className}`}
      title="Email preview"
    />
  );
}
```

Write to `src/components/admin/newsletter/html-preview.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/newsletter/html-preview.tsx
git commit -m "feat: add shared HTML preview iframe component"
```

---

### Task 10: Create newsletter sub-navigation and layout

**Files:**
- Create: `src/components/admin/newsletter/newsletter-subnav.tsx`
- Create: `src/app/zr-ops/newsletter/layout.tsx`

- [ ] **Step 1: Create the sub-navigation component**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Send, FileText } from "lucide-react";

const tabs = [
  { href: "/zr-ops/newsletter", label: "Subscribers", icon: Users },
  { href: "/zr-ops/newsletter/campaigns", label: "Campaigns", icon: Send },
  { href: "/zr-ops/newsletter/templates", label: "Templates", icon: FileText },
];

export function NewsletterSubnav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/zr-ops/newsletter") {
      return pathname === "/zr-ops/newsletter" || pathname === "/zr-ops/newsletter/";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-border bg-surface">
      <div className="flex gap-1 px-6">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

Write to `src/components/admin/newsletter/newsletter-subnav.tsx`.

- [ ] **Step 2: Create the layout**

```tsx
import { AdminHeader } from "@/components/admin/admin-header";
import { NewsletterSubnav } from "@/components/admin/newsletter/newsletter-subnav";

export default function NewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader title="Newsletter" />
      <NewsletterSubnav />
      {children}
    </>
  );
}
```

Write to `src/app/zr-ops/newsletter/layout.tsx`.

- [ ] **Step 3: Update the subscribers page to remove duplicate AdminHeader**

Since the layout now includes `AdminHeader`, update `src/app/zr-ops/newsletter/page.tsx` to remove it:

```tsx
import { SubscriberTable } from "@/components/admin/newsletter/subscriber-table";

export default function NewsletterPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">Subscribers</h2>
      <SubscriberTable />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/newsletter/newsletter-subnav.tsx src/app/zr-ops/newsletter/layout.tsx src/app/zr-ops/newsletter/page.tsx
git commit -m "feat: add newsletter sub-navigation layout with tabs"
```

---

### Task 11: Create campaign list component and page

**Files:**
- Create: `src/components/admin/newsletter/campaign-list.tsx`
- Create: `src/app/zr-ops/newsletter/campaigns/page.tsx`

- [ ] **Step 1: Create the campaign list component**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CampaignSummary {
  id: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "sent":
      return "bg-success/20 text-success";
    case "sending":
      return "bg-brand/20 text-accent";
    case "scheduled":
      return "bg-warning/20 text-warning";
    case "failed":
      return "bg-destructive/20 text-destructive";
    case "draft":
    default:
      return "bg-muted/20 text-muted";
  }
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/newsletter/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div>
      {/* Header with New Campaign button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading">Campaigns</h2>
        <Link
          href="/zr-ops/newsletter/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-medium text-muted">Subject</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted">Recipients</th>
              <th className="px-4 py-3 font-medium text-muted">Sent</th>
              <th className="px-4 py-3 font-medium text-muted">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No campaigns yet
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border transition-colors hover:bg-background/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/zr-ops/newsletter/campaigns/${c.id}`}
                      className="text-accent hover:underline"
                    >
                      {c.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.status === "sent" || c.status === "failed"
                      ? `${c.successCount}/${c.recipientCount}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(c.sentAt)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(c.createdAt)}
                  </td>
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

Write to `src/components/admin/newsletter/campaign-list.tsx`.

- [ ] **Step 2: Create the page**

```tsx
import { CampaignList } from "@/components/admin/newsletter/campaign-list";

export default function CampaignsPage() {
  return (
    <div className="p-6">
      <CampaignList />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/campaigns/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/newsletter/campaign-list.tsx src/app/zr-ops/newsletter/campaigns/page.tsx
git commit -m "feat: add campaign list component and admin page"
```

---

### Task 12: Create campaign form component

**Files:**
- Create: `src/components/admin/newsletter/campaign-form.tsx`

- [ ] **Step 1: Create the form component**

This component handles create, edit, send now, and schedule actions. It includes an HTML textarea editor with a preview panel.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock, Save, Eye, EyeOff } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface CampaignFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    subject: string;
    body: string;
  };
  templates?: { id: string; name: string; subject: string; body: string }[];
}

export function CampaignForm({ mode, initialData, templates = [] }: CampaignFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialData?.subject ?? "");
  const [body, setBody] = useState(initialData?.body ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!subject || !body) {
      setError("Subject and body are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        mode === "edit"
          ? `/api/admin/newsletter/campaigns/${initialData!.id}`
          : "/api/admin/newsletter/campaigns";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      if (mode === "create") {
        const data = await res.json();
        router.push(`/zr-ops/newsletter/campaigns/${data.id}`);
      } else {
        router.push(`/zr-ops/newsletter/campaigns/${initialData!.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendNow() {
    if (!confirm("Send this campaign to all subscribers now?")) return;

    // Save first if creating
    if (mode === "create") {
      await handleSaveAndSend();
      return;
    }

    setSending(true);
    setError("");

    try {
      // Save latest changes first
      await fetch(`/api/admin/newsletter/campaigns/${initialData!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      const res = await fetch(
        `/api/admin/newsletter/campaigns/${initialData!.id}/send`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Failed to send");

      router.push(`/zr-ops/newsletter/campaigns/${initialData!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveAndSend() {
    if (!subject || !body) {
      setError("Subject and body are required");
      return;
    }

    setSending(true);
    setError("");

    try {
      const createRes = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (!createRes.ok) throw new Error("Failed to create");
      const { id } = await createRes.json();

      const sendRes = await fetch(
        `/api/admin/newsletter/campaigns/${id}/send`,
        { method: "POST" }
      );

      if (!sendRes.ok) throw new Error("Failed to send");

      router.push(`/zr-ops/newsletter/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule() {
    if (!scheduleDate) {
      setError("Please select a date and time");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let campaignId = initialData?.id;

      // Save first if creating or editing
      if (mode === "create") {
        const createRes = await fetch("/api/admin/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        });
        if (!createRes.ok) throw new Error("Failed to create");
        const data = await createRes.json();
        campaignId = data.id;
      } else {
        await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, body }),
        });
      }

      const res = await fetch(
        `/api/admin/newsletter/campaigns/${campaignId}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: new Date(scheduleDate).toISOString() }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule");
      }

      router.push(`/zr-ops/newsletter/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setSaving(false);
    }
  }

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Template selector */}
      {templates.length > 0 && mode === "create" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">
            Start from template
          </label>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-accent"
            defaultValue=""
          >
            <option value="">— Blank campaign —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
        />
      </div>

      {/* Body editor + preview */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Body (HTML)</label>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Show Preview
              </>
            )}
          </button>
        </div>

        <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<html>...</html>"
            rows={20}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-xs text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
          />
          {showPreview && (
            <HtmlPreview html={body} className="h-[500px]" />
          )}
        </div>
      </div>

      {/* Schedule input */}
      {showSchedule && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-muted">
              Schedule for
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent focus:border-highlight focus:outline-none"
            />
          </div>
          <button
            onClick={handleSchedule}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-warning/20 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning/30 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            {saving ? "Scheduling..." : "Confirm Schedule"}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-2 rounded-lg border border-warning/50 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning/10"
        >
          <Clock className="h-4 w-4" />
          Schedule
        </button>

        <button
          onClick={handleSendNow}
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send Now"}
        </button>
      </div>
    </div>
  );
}
```

Write to `src/components/admin/newsletter/campaign-form.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/newsletter/campaign-form.tsx
git commit -m "feat: add campaign form component with preview, schedule, and send"
```

---

## Chunk 3b: Campaign Pages & Detail

### Task 13: Create campaign admin pages (new, detail, edit)

**Files:**
- Create: `src/app/zr-ops/newsletter/campaigns/new/page.tsx`
- Create: `src/app/zr-ops/newsletter/campaigns/[id]/page.tsx`
- Create: `src/app/zr-ops/newsletter/campaigns/[id]/edit/page.tsx`

- [ ] **Step 1: Create "new campaign" page**

```tsx
import { CampaignFormWrapper } from "@/components/admin/newsletter/campaign-form-wrapper";

export default function NewCampaignPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">New Campaign</h2>
      <CampaignFormWrapper mode="create" />
    </div>
  );
}
```

Wait — the form needs templates loaded server-side. Create a client wrapper that fetches templates:

Create `src/components/admin/newsletter/campaign-form-wrapper.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { CampaignForm } from "@/components/admin/newsletter/campaign-form";

interface CampaignFormWrapperProps {
  mode: "create" | "edit";
  campaignId?: string;
}

export function CampaignFormWrapper({ mode, campaignId }: CampaignFormWrapperProps) {
  const [templates, setTemplates] = useState<
    { id: string; name: string; subject: string; body: string }[]
  >([]);
  const [initialData, setInitialData] = useState<{
    id: string;
    subject: string;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch templates for the selector
        const templatesRes = await fetch("/api/admin/newsletter/templates");
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data.templates ?? []);
        }

        // Fetch campaign data if editing
        if (mode === "edit" && campaignId) {
          const campaignRes = await fetch(
            `/api/admin/newsletter/campaigns/${campaignId}`
          );
          if (campaignRes.ok) {
            const data = await campaignRes.json();
            setInitialData({
              id: data.id,
              subject: data.subject,
              body: data.body,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load form data:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [mode, campaignId]);

  if (loading) {
    return <p className="text-muted">Loading...</p>;
  }

  return (
    <CampaignForm
      mode={mode}
      initialData={initialData ?? undefined}
      templates={templates}
    />
  );
}
```

Write to `src/components/admin/newsletter/campaign-form-wrapper.tsx`.

Now the "new campaign" page:

```tsx
import { CampaignFormWrapper } from "@/components/admin/newsletter/campaign-form-wrapper";

export default function NewCampaignPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">New Campaign</h2>
      <CampaignFormWrapper mode="create" />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/campaigns/new/page.tsx`.

- [ ] **Step 2: Create campaign detail page**

```tsx
import { CampaignDetail } from "@/components/admin/newsletter/campaign-detail";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <CampaignDetail campaignId={id} />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/campaigns/[id]/page.tsx`.

Create the detail component:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Send } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface CampaignData {
  id: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "sent":
      return "bg-success/20 text-success";
    case "sending":
      return "bg-brand/20 text-accent";
    case "scheduled":
      return "bg-warning/20 text-warning";
    case "failed":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted/20 text-muted";
  }
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/newsletter/campaigns/${campaignId}`
        );
        if (res.ok) {
          setCampaign(await res.json());
        }
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId]);

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!campaign) return <p className="text-muted">Campaign not found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/zr-ops/newsletter/campaigns"
            className="mb-2 flex items-center gap-1 text-sm text-muted hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to campaigns
          </Link>
          <h2 className="text-3xl font-bold font-heading">{campaign.subject}</h2>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <Link
              href={`/zr-ops/newsletter/campaigns/${campaignId}/edit`}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-background"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Status & stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Status</p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(campaign.status)}`}
          >
            {campaign.status}
          </span>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Recipients</p>
          <p className="mt-1 text-lg font-bold text-accent">
            {campaign.recipientCount}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Delivered</p>
          <p className="mt-1 text-lg font-bold text-success">
            {campaign.successCount}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted">Failed</p>
          <p className="mt-1 text-lg font-bold text-destructive">
            {campaign.failureCount}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex gap-6 text-sm text-muted">
        <span>Created: {formatDate(campaign.createdAt)}</span>
        {campaign.scheduledAt && (
          <span>Scheduled: {formatDate(campaign.scheduledAt)}</span>
        )}
        {campaign.sentAt && (
          <span>Sent: {formatDate(campaign.sentAt)}</span>
        )}
      </div>

      {/* Email preview */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Email Preview</h3>
        <HtmlPreview html={campaign.body} className="h-[600px]" />
      </div>
    </div>
  );
}
```

Write to `src/components/admin/newsletter/campaign-detail.tsx`.

- [ ] **Step 3: Create edit campaign page**

```tsx
import { CampaignFormWrapper } from "@/components/admin/newsletter/campaign-form-wrapper";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">Edit Campaign</h2>
      <CampaignFormWrapper mode="edit" campaignId={id} />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/campaigns/[id]/edit/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/newsletter/campaign-form-wrapper.tsx src/components/admin/newsletter/campaign-detail.tsx src/app/zr-ops/newsletter/campaigns/new/page.tsx "src/app/zr-ops/newsletter/campaigns/[id]/page.tsx" "src/app/zr-ops/newsletter/campaigns/[id]/edit/page.tsx"
git commit -m "feat: add campaign create, detail, and edit admin pages"
```

- [ ] **Step 5: ASK USER TO TEST**

Ask the user to test:
1. Go to `/zr-ops/newsletter` — sub-tabs (Subscribers, Campaigns, Templates) should appear
2. Click "Campaigns" tab → should see empty list with "New Campaign" button
3. Click "New Campaign" → fill in subject and HTML body
4. Toggle "Show Preview" — should see the HTML rendered in an iframe
5. Click "Save Draft" → should redirect to campaign detail page with status "draft"
6. Click "Edit" → should be able to modify subject/body
7. Test "Send Now" with a test subscriber (use caution — this sends real emails)
8. Test scheduling a campaign for a future date

---

## Chunk 4: Templates

### Task 14: Create template API routes

**Files:**
- Create: `src/app/api/admin/newsletter/templates/route.ts`
- Create: `src/app/api/admin/newsletter/templates/[id]/route.ts`

- [ ] **Step 1: Create list + create route**

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
      .collection("campaign_templates")
      .orderBy("updatedAt", "desc")
      .get();

    const templates = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        subject: d.subject,
        body: d.body,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, subject, body: htmlBody } = body;

    if (!name || !subject || !htmlBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const docRef = await adminDb.collection("campaign_templates").add({
      name,
      subject,
      body: htmlBody,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/templates/route.ts`.

- [ ] **Step 2: Create detail + update + delete route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const snap = await adminDb.collection("campaign_templates").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const d = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      name: d.name,
      subject: d.subject,
      body: d.body,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("campaign_templates").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;

    await docRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("campaign_templates").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Write to `src/app/api/admin/newsletter/templates/[id]/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/newsletter/templates/route.ts "src/app/api/admin/newsletter/templates/[id]/route.ts"
git commit -m "feat: add template CRUD API routes"
```

---

### Task 15: Create template UI components and pages

**Files:**
- Create: `src/components/admin/newsletter/template-list.tsx`
- Create: `src/components/admin/newsletter/template-form.tsx`
- Create: `src/app/zr-ops/newsletter/templates/page.tsx`
- Create: `src/app/zr-ops/newsletter/templates/new/page.tsx`
- Create: `src/app/zr-ops/newsletter/templates/[id]/edit/page.tsx`

- [ ] **Step 1: Create template list component**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  updatedAt: string | null;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TemplateList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/newsletter/templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold font-heading">Templates</h2>
        <Link
          href="/zr-ops/newsletter/templates/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted">Subject</th>
              <th className="px-4 py-3 font-medium text-muted">Updated</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Loading...
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No templates yet
                </td>
              </tr>
            ) : (
              templates.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border transition-colors hover:bg-background/50"
                >
                  <td className="px-4 py-3 font-medium text-accent">{t.name}</td>
                  <td className="px-4 py-3 text-muted">{t.subject}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(t.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/zr-ops/newsletter/templates/${t.id}/edit`}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

Write to `src/components/admin/newsletter/template-list.tsx`.

- [ ] **Step 2: Create template form component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff } from "lucide-react";
import { HtmlPreview } from "@/components/admin/newsletter/html-preview";

interface TemplateFormProps {
  mode: "create" | "edit";
  templateId?: string;
}

export function TemplateForm({ mode, templateId }: TemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && templateId) {
      fetch(`/api/admin/newsletter/templates/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          setName(data.name);
          setSubject(data.subject);
          setBody(data.body);
        })
        .catch((err) => console.error("Failed to load template:", err))
        .finally(() => setLoading(false));
    }
  }, [mode, templateId]);

  async function handleSave() {
    if (!name || !subject || !body) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url =
        mode === "edit"
          ? `/api/admin/newsletter/templates/${templateId}`
          : "/api/admin/newsletter/templates";

      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, body }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/zr-ops/newsletter/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Template Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Product Launch, Weekly Digest..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-muted">Body (HTML)</label>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Show Preview
              </>
            )}
          </button>
        </div>

        <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<html>...</html>"
            rows={20}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-xs text-accent placeholder:text-muted focus:border-highlight focus:outline-none"
          />
          {showPreview && (
            <HtmlPreview html={body} className="h-[500px]" />
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : mode === "create" ? "Create Template" : "Save Changes"}
      </button>
    </div>
  );
}
```

Write to `src/components/admin/newsletter/template-form.tsx`.

- [ ] **Step 3: Create template pages**

Templates list page:

```tsx
import { TemplateList } from "@/components/admin/newsletter/template-list";

export default function TemplatesPage() {
  return (
    <div className="p-6">
      <TemplateList />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/templates/page.tsx`.

New template page:

```tsx
import { TemplateForm } from "@/components/admin/newsletter/template-form";

export default function NewTemplatePage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">New Template</h2>
      <TemplateForm mode="create" />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/templates/new/page.tsx`.

Edit template page:

```tsx
import { TemplateForm } from "@/components/admin/newsletter/template-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold font-heading">Edit Template</h2>
      <TemplateForm mode="edit" templateId={id} />
    </div>
  );
}
```

Write to `src/app/zr-ops/newsletter/templates/[id]/edit/page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/newsletter/template-list.tsx src/components/admin/newsletter/template-form.tsx src/app/zr-ops/newsletter/templates/page.tsx src/app/zr-ops/newsletter/templates/new/page.tsx "src/app/zr-ops/newsletter/templates/[id]/edit/page.tsx"
git commit -m "feat: add template CRUD UI components and admin pages"
```

- [ ] **Step 5: ASK USER TO TEST**

Ask the user to test:
1. Go to `/zr-ops/newsletter` → click "Templates" tab
2. Click "New Template" → fill in name, subject, HTML body
3. Toggle "Show Preview" — verify HTML renders in iframe
4. Save → should redirect to templates list
5. Edit the template → change body → save
6. Delete the template → confirm → should disappear from list
7. Create a new template, then go to Campaigns → New Campaign
8. "Start from template" dropdown should list the template
9. Select it → subject and body should be pre-filled
10. Verify sub-navigation tabs (Subscribers, Campaigns, Templates) work correctly across all pages
