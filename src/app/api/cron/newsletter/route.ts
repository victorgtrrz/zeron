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
