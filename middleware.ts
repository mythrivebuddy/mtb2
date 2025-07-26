// File: middleware.ts (in your project's root folder)
// THIS IS THE CORRECTED VERSION

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

        // If the page is public, always allow access.
        if (isPublicChallengePage(path)) {
          return true;
        }

        // For all other pages, require a login.
        return !!token;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

/**
 * Helper function to determine if a path is a public challenge page.
 * This logic now perfectly matches your updated UserDashboardLayout component.
 */
function isPublicChallengePage(path: string): boolean {
  // Define all private prefixes under /dashboard/challenge/
  const privateChallengePrefixes = [
    '/dashboard/challenge/my-challenges',
    '/dashboard/challenge/create-challenge',
    '/dashboard/challenge/join-challenge',
    '/dashboard/challenge/let-others-roll',
    // The '/upcoming-challenges' line has been REMOVED from this list
  ];

  const isMainChallengePage = path === '/dashboard/challenge';
  const isPrivateSubPage = privateChallengePrefixes.some(prefix => path.startsWith(prefix));

  // A page is public if it's under /dashboard/challenge/ and NOT in the private list.
  return path.startsWith('/dashboard/challenge/') && !isMainChallengePage && !isPrivateSubPage;
}


// This config does not change.
export const config = {
  matcher: ["/dashboard/:path*", "/leaderboard", "/admin/:path*"],
};