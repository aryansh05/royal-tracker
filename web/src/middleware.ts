import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/mfa");

  if (!isProtected) {
    return NextResponse.next();
  }

  // Allow slave dashboard
  if (
    pathname.startsWith("/dashboard") &&
    searchParams.get("mode") === "slave"
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token"));

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/mfa/:path*"],
};