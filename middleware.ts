import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // Superadmin hitting root or dashboard → send to admin panel
    if ((pathname === "/" || pathname === "/dashboard") && role === "superadmin") {
      return NextResponse.redirect(new URL("/admin/companies", req.url));
    }

    // Non-superadmin trying to access admin panel → send to dashboard
    if (pathname.startsWith("/admin") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Allow request only if a valid token exists
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  // Protect everything except API routes, static files, and login
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
