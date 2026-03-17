import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export async function verifyUser(
  request: NextRequest
): Promise<{ uid: string; displayName: string | null }> {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  const decodedToken = await adminAuth.verifyIdToken(sessionCookie);

  return {
    uid: decodedToken.uid,
    displayName: decodedToken.name || null,
  };
}
