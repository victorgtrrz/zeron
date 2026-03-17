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
