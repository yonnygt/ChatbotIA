import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/register", "/api/auth/me"];
const STAFF_PATHS = ["/dashboard"];
const API_AUTH_PREFIX = "/api/auth";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("session_token")?.value;
    const userRole = req.cookies.get("user_role")?.value;

    // Allow public API auth routes
    if (pathname.startsWith(API_AUTH_PREFIX)) {
        return NextResponse.next();
    }

    // Allow all API routes (they handle their own auth)
    if (pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Public paths: allow through
    if (PUBLIC_PATHS.includes(pathname)) {
        return NextResponse.next();
    }

    // All other routes: require session cookie
    if (!token) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        return NextResponse.redirect(loginUrl);
    }

    // Staff paths: require staff or admin role
    const isStaffPath = STAFF_PATHS.some((p) => pathname.startsWith(p));
    if (isStaffPath) {
        if (!userRole || userRole === "cliente") {
            const homeUrl = req.nextUrl.clone();
            homeUrl.pathname = "/";
            return NextResponse.redirect(homeUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
