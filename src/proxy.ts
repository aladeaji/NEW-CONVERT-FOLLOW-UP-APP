import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [/^\/today/, /^\/people/, /^\/setup/, /^\/admin/, /^\/follow-ups/, /^\/attendance/, /^\/unassigned/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((re) => re.test(pathname));
  if (!needsAuth) return NextResponse.next();
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/today/:path*", "/people/:path*", "/setup/:path*", "/admin/:path*", "/follow-ups/:path*", "/attendance/:path*", "/unassigned/:path*"],
};
