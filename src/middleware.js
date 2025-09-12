import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Define protected routes and allowed roles
const roleProtectedRoutes = [
  { path: "/dashboard", roles: ["ADMIN"] },
  { path: "/admin", roles: ["ADMIN"] },
  { path: "/agent-dashboard", roles: ["AGENT"] },
];

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check role-based access
  for (const route of roleProtectedRoutes) {
    if (pathname.startsWith(route.path) && !route.roles.includes(token.role)) {
      // Redirect unauthorized users to their dashboard
      if (token.role === "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.url));
      if (token.role === "AGENT") return NextResponse.redirect(new URL("/agent-dashboard", req.url));
      // Default fallback
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};