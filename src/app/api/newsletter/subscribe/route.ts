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
