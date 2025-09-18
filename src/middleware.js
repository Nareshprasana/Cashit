import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// ✅ Agent is allowed only these dashboard routes
const agentAllowedRoutes = [
  "/dashboard",
  "/dashboard/repayment",
  "/dashboard/repayments",
];

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow public routes (login, api, static, favicon)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is AGENT
  if (token.role === "AGENT") {
    // Only allow agent to visit the approved dashboard routes
    if (!agentAllowedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // If ADMIN → full access to everything
  if (token.role === "ADMIN") {
    return NextResponse.next();
  }

  // Default fallback → login
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
