import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// ✅ AGENT-only allowed dashboard routes
const agentAllowedRoutes = [
  "/dashboard",
  "/dashboard/repayment",
  "/dashboard/repayments",
];

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1️⃣ Public routes allowed without auth
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // 2️⃣ If no session → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3️⃣ Session timeout check (30 min)
  const currentTime = Math.floor(Date.now() / 1000);
  if (token.exp && currentTime > token.exp) {
    // Token expired → clear cookies and redirect
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
    response.cookies.set("next-auth.callback-url", "", { maxAge: 0 });
    return response;
  }

  // 4️⃣ Role-based access control
  if (token.role === "AGENT") {
    // Allow only limited dashboard routes
    if (!agentAllowedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 5️⃣ ADMIN → full access
  if (token.role === "ADMIN") {
    return NextResponse.next();
  }

  // 6️⃣ Default fallback
  return NextResponse.redirect(new URL("/login", req.url));
}

// 7️⃣ Apply middleware to all non-static routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
