import { NextResponse } from "next/server";

/**
 * Next.js 16 Proxy for Route Protection
 * Protects /admin, /receptionist, /super-admin, and /app routes on the server side
 * before any rendering occurs.
 */
export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // Retrieve token and user from cookies
  const token = request.cookies.get("accessToken")?.value || request.cookies.get("token")?.value;
  const rawUserCookie = request.cookies.get("user")?.value;

  let user = null;
  if (rawUserCookie) {
    try {
      user = JSON.parse(decodeURIComponent(rawUserCookie));
    } catch {
      try {
        user = JSON.parse(rawUserCookie);
      } catch {
        user = null;
      }
    }
  }

  const isAuth = Boolean(token);
  const redirectTarget = encodeURIComponent(`${pathname}${search}`);

  const isAdminPath = pathname.startsWith("/admin");
  const isReceptionistPath = pathname.startsWith("/receptionist");
  const isSuperAdminPath = pathname.startsWith("/super-admin");
  const isAppPath = pathname.startsWith("/app");

  const isProtectedPath = isAdminPath || isReceptionistPath || isSuperAdminPath || isAppPath;

  // 1. If trying to access protected route without login -> redirect to /login
  if (isProtectedPath) {
    if (!isAuth) {
      const loginUrl = new URL(`/login?redirect=${redirectTarget}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Role-based route authorization
    const role = user?.role;
    if (role === "RECEPTIONIST") {
      // Receptionists can only access receptionist routes
      if (isAdminPath || isSuperAdminPath) {
        return NextResponse.redirect(new URL("/receptionist/dashboard", request.url));
      }
    } else if (role === "HOTEL_ADMIN") {
      // Hotel admins cannot access super-admin
      if (isSuperAdminPath) {
        return NextResponse.redirect(new URL("/admin/overview", request.url));
      }
    } else if (role === "SUPER_ADMIN") {
      // Super admins accessing receptionist routes redirect to super admin overview
      if (isReceptionistPath) {
        return NextResponse.redirect(new URL("/super-admin/overview", request.url));
      }
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/admin/:path*",
    "/receptionist/:path*",
    "/super-admin/:path*",
    "/app/:path*",
  ],
};

