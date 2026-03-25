import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Client-side Firebase Auth uses tokens in the browser, not cookies by default.
// This middleware protects dashboard routes by checking for the auth cookie
// that we set after login. For a production app, consider using Firebase Admin SDK
// with session cookies or a JWT verification approach.

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // Check for auth token cookie (set by client after Firebase login)
  const authToken = request.cookies.get("__session")?.value
  if (!authToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
