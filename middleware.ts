// File: middleware.ts (in your project's root folder)

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = token?.role === "ADMIN";
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard") && isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (path.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public Route Logic
        if (path.startsWith('/dashboard/challenge/')) {
          const isSpecificDashboardPage =
            path.startsWith('/dashboard/challenge/create-challenge') ||
            path.startsWith('/dashboard/challenge/join-challenge') ||
            path.startsWith('/dashboard/challenge/let-others-roll') ||
            path.startsWith('/dashboard/challenge/my-challenges');
          
          if (!isSpecificDashboardPage) {
            // Yeh dynamic page hai, sabke liye public access allow karo.
            return true; 
          }
        }
        
        // Protected Route Logic
        // Baaki sabhi pages ke liye, user ka logged in hona zaroori hai.
        return !!token;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/leaderboard", "/admin/:path*"],
};
