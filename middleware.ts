// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import jwt from 'jsonwebtoken'

// export async function middleware(request: NextRequest) {
//   const token = request.cookies.get('token')?.value

//   // Protect dashboard routes
//   if (request.nextUrl.pathname.startsWith('/dashboard')) {
//     if (!token) {
//       return NextResponse.redirect(new URL('/signin', request.url))
//     }

//     try {
//       jwt.verify(token, process.env.JWT_SECRET!)
//       return NextResponse.next()
//     } catch {
//       return NextResponse.redirect(new URL('/signin', request.url))
//     }
//   }

//   // Redirect authenticated users from auth pages
//   if (request.nextUrl.pathname.startsWith('/signin') ||
//       request.nextUrl.pathname.startsWith('/signup')) {
//     if (token) {
//       try {
//         jwt.verify(token, process.env.JWT_SECRET!)
//         return NextResponse.redirect(new URL('/dashboard', request.url))
//       } catch {
//         // Invalid token, continue to auth pages
//       }
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/signin', '/signup']
// }

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isAdmin = token?.role === "ADMIN";

    // Admin users: force navigation to admin routes only
    if (isAdmin) {
      if (!path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    } else {
      // Non-admin users: block access to admin routes
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
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

// Specify the routes that should be protected by this middleware
export const config = {
  matcher: ["/admin/:path*", "/dashboard", "/leaderboard"],
};
