import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const path = req.nextUrl.pathname;

    // Redirect non-admin users from /admin
    if (path.startsWith("/dashboard") && isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Allow authenticated users to continue to the requested route
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/signin", // Redirect unauthenticated users to sign-in page
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  }
);

export function middleware(request: NextRequest) {
  // Check if the request is for the signup page and has a referral code
  if (request.nextUrl.pathname === '/signup') {
    const ref = request.nextUrl.searchParams.get('ref')
    
    if (ref) {
      // Create a response
      const response = NextResponse.next()
      
      // Set the referral code in a cookie that expires in 7 days
      response.cookies.set('referral_code', ref, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      
      return response
    }
  }
  
  return NextResponse.next()
}

// Combine both matchers into a single config
export const config = {
  matcher: ["/signup", "/dashboard/:path*", "/leaderboard", "/admin/:path*"],
};
