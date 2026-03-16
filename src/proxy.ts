import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale processing for admin, API, static files
  if (
    pathname.startsWith("/zr-ops") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(webp|png|jpg|jpeg|svg|ico|css|js)$/)
  ) {
    // Admin route protection
    if (pathname.startsWith("/zr-ops")) {
      const sessionCookie = request.cookies.get("__session")?.value;
      if (!sessionCookie) {
        const loginUrl = new URL("/es/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Note: Full admin claim verification happens server-side in admin layout
      // Middleware only checks cookie existence for fast redirect
    }

    return NextResponse.next();
  }

  // Account route protection
  if (pathname.match(/^\/[a-z-]+\/account/)) {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) {
      // Extract locale from path
      const locale = pathname.split("/")[1] || "es";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle i18n for all other routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|favicon|.*\\..*).*)"],
};
