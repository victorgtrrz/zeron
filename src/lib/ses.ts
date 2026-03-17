import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { Order } from "@/types";

export const ses = new SESClient({
  region: process.env.AWS_REGION ?? "us-east-1",
});

export const fromEmail = process.env.SES_FROM_EMAIL ?? "noreply@zeron.store";

export async function sendOrderConfirmation(
  to: string,
  order: Order
): Promise<void> {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #333;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #333;">${item.size}</td>
          <td style="padding:8px;border-bottom:1px solid #333;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #333;">$${(item.unitPrice / 100).toFixed(2)}</td>
          <td style="padding:8px;border-bottom:1px solid #333;">$${((item.unitPrice * item.quantity) / 100).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0a0a0a;color:#e5e5e5;font-family:Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;margin:0;">ZERON</h1>
      <p style="color:#888;font-size:14px;margin-top:8px;">Order Confirmation</p>
    </div>

    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 16px;">Order #${order.id}</h2>

      <table style="width:100%;border-collapse:collapse;color:#e5e5e5;font-size:14px;">
        <thead>
          <tr style="color:#888;">
            <th style="padding:8px;text-align:left;border-bottom:1px solid #333;">Item</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #333;">Size</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #333;">Qty</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #333;">Price</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #333;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div style="margin-top:16px;border-top:1px solid #333;padding-top:16px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#888;">Subtotal</span>
          <span>$${(order.subtotal / 100).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:#888;">Shipping</span>
          <span>$${(order.shipping / 100).toFixed(2)}</span>
        </div>
        ${
          order.discount > 0
            ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <span style="color:#888;">Discount</span>
                <span style="color:#22c55e;">-$${(order.discount / 100).toFixed(2)}</span>
              </div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-top:8px;">
          <span>Total</span>
          <span>$${(order.total / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#ffffff;font-size:16px;margin:0 0 12px;">Shipping Address</h3>
      <p style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;">
        ${order.shippingAddress.recipientName}<br>
        ${order.shippingAddress.street}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
        ${order.shippingAddress.country}
      </p>
    </div>

    <p style="text-align:center;color:#888;font-size:12px;margin-top:32px;">
      &copy; ${new Date().getFullYear()} Zeron. All rights reserved.
    </p>
  </div>
</body>
</html>`;

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: {
        Data: `Zeron — Order Confirmation #${order.id}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  await ses.send(command);
}

export async function sendContactEmail(
  fromName: string,
  fromEmail: string,
  message: string
): Promise<void> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0a0a0a;color:#e5e5e5;font-family:Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:24px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 16px;">New Contact Form Message</h2>
      <p style="color:#888;font-size:14px;margin:0 0 8px;"><strong>From:</strong> ${fromName} (${fromEmail})</p>
      <div style="border-top:1px solid #333;margin:16px 0;padding-top:16px;">
        <p style="color:#e5e5e5;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${message}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const sesFromEmail = process.env.SES_FROM_EMAIL ?? "noreply@zeron.store";

  const command = new SendEmailCommand({
    Source: sesFromEmail,
    Destination: { ToAddresses: [sesFromEmail] },
    ReplyToAddresses: [fromEmail],
    Message: {
      Subject: {
        Data: `Zeron Contact: Message from ${fromName}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
      },
    },
  });

  await ses.send(command);
}
