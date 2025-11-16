import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("sb-access-token")?.value;

  const isLoggedIn = !!session;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  // If user is NOT logged in → send to /login
  if (!isLoggedIn && !isLoginPage) {
    const redirectUrl = new URL("/login", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user IS logged in and tries to go to /login → send to /dashboard
  if (isLoggedIn && isLoginPage) {
    const redirectUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|public|favicon.ico).*)"],
};
