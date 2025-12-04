import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Check if the request is for the admin section
    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Exclude the login page and API routes from protection
        // We protect the API routes separately if needed, but for now let's just protect the UI
        if (
            request.nextUrl.pathname === "/admin/login" ||
            request.nextUrl.pathname.startsWith("/api")
        ) {
            return NextResponse.next();
        }

        const adminSession = request.cookies.get("admin_session");

        if (!adminSession) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
