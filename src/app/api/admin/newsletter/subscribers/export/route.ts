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
