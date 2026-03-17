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
