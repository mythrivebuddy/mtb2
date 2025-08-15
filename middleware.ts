// File: middleware.ts (in your project's root folder)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const searchParams = req.nextUrl.searchParams;
    const redirect = searchParams.get('redirect') || null;
    const redirectUrl = redirect && redirect.startsWith('/') ? `${req.nextUrl.origin}${redirect}` : null;

    console.log('Middleware triggered:', { path, token: !!token, redirect, redirectUrl });

    // Handle authenticated users accessing /signin
    if (token && path === '/signin' && redirectUrl) {
      console.log('Redirecting authenticated user from /signin to:', redirectUrl);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // Redirect admins accessing /dashboard to /admin/dashboard
    if (token && path.startsWith('/dashboard') && token.role === 'ADMIN') {
      console.log('Redirecting admin to /admin/dashboard');
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    // Redirect non-admins accessing /admin to /dashboard
    if (token && path.startsWith('/admin') && token.role !== 'ADMIN') {
      console.log('Redirecting non-admin to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Explicitly allow /dashboard/challenge/... for non-admins
    if (token && path.startsWith('/dashboard/challenge/') && token.role !== 'ADMIN') {
      console.log('Allowing non-admin access to:', path);
      return NextResponse.next();
    }

    console.log('Middleware proceeding with NextResponse.next() for path:', path);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        console.log('Authorized callback:', { path, token: !!token });

        // Allow public challenge pages
        if (path === '/dashboard/challenge') {
    return true;
  }
        if (isPublicChallengePage(path)) {
          console.log('Public challenge page allowed:', path);
          return true;
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
    pages: {
      signIn: '/signin',
    },
  }
);

function isPublicChallengePage(path: string): boolean {
  const privateChallengePrefixes = [
    '/dashboard/challenge/my-challenges',
    '/dashboard/challenge/create-challenge',
    '/dashboard/challenge/join-challenge',
    '/dashboard/challenge/let-others-roll',
  ];

  const isMainChallengePage = path === '/dashboard/challenge';
  const isPrivateSubPage = privateChallengePrefixes.some((prefix) => path.startsWith(prefix));

  return path.startsWith('/dashboard/challenge/') && !isMainChallengePage && !isPrivateSubPage;
}

export const config = {
  matcher: ['/dashboard/:path*', '/leaderboard', '/admin/:path*', '/signin'],
};