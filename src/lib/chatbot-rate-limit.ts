import { adminDb } from "@/lib/firebase/admin";
import type { ChatbotRateLimit } from "@/types";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const AUTH_LIMIT = 30;
const ANON_LIMIT = 10;

export async function checkRateLimit(
  key: string,
  isAuthenticated: boolean
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = isAuthenticated ? AUTH_LIMIT : ANON_LIMIT;
  const docRef = adminDb.collection("chatbot_rate_limits").doc(key);
  const doc = await docRef.get();
  const now = Date.now();

  if (!doc.exists) {
    await docRef.set({
      count: 1,
      windowStart: new Date(now),
    });
    return { allowed: true, remaining: limit - 1 };
  }

  const data = doc.data() as ChatbotRateLimit;
  const windowStart =
    data.windowStart instanceof Date
      ? data.windowStart.getTime()
      : (data.windowStart as unknown as { toMillis: () => number }).toMillis();

  // If the window has expired, reset the counter
  if (now - windowStart > WINDOW_MS) {
    await docRef.set({
      count: 1,
      windowStart: new Date(now),
    });
    return { allowed: true, remaining: limit - 1 };
  }

  // If under the limit, increment
  if (data.count < limit) {
    const newCount = data.count + 1;
    await docRef.update({ count: newCount });
    return { allowed: true, remaining: limit - newCount };
  }

  // Over limit
  return { allowed: false, remaining: 0 };
}
