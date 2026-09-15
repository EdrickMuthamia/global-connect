/** Edge middleware: protects /dashboard and /admin, enforces role for /admin. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "global-connect-dev-secret-change-in-production",
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("gc_token")?.value;
  const url = req.nextUrl.clone();

  const toLogin = () => {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", url.pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete("gc_token");
    return res;
  };

  if (!token) return toLogin();

  try {
    const { payload } = await jwtVerify(token, secret);
    if (url.pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (url.pathname.startsWith("/dashboard") && payload.role === "admin" && url.pathname === "/dashboard") {
      // Admins land on the admin console by default.
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  } catch {
    return toLogin();
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
