import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export async function verifyAdmin(
  request: NextRequest
): Promise<{ uid: string }> {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  const decodedToken = await adminAuth.verifyIdToken(sessionCookie);

  if (!decodedToken.admin) {
    throw new Error("User is not an admin");
  }

  return { uid: decodedToken.uid };
}

export async function verifyAdminFromCookies(): Promise<{ uid: string }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("No session cookie found");
  }

  const decodedToken = await adminAuth.verifyIdToken(sessionCookie);

  if (!decodedToken.admin) {
    throw new Error("User is not an admin");
  }

  return { uid: decodedToken.uid };
}
