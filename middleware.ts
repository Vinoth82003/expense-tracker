import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("admin_session");

    if (!adminSession?.value) {
      // Log unauthorized access attempt
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      console.warn(`[SECURITY] Unauthorized admin access attempt to ${pathname} from IP: ${ip}`);
      
      // Redirect to admin login if no valid session cookie
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
