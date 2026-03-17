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
