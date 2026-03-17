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
