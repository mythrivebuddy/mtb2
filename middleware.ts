// File: middleware.ts (in your project's root folder)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const searchParams = req.nextUrl.searchParams;
    const redirect = searchParams.get("redirect") || null;
    const redirectUrl =
      redirect && redirect.startsWith("/")
        ? `${req.nextUrl.origin}${redirect}`
        : null;

    // Handle authenticated users accessing /signin
    if (token && path === "/signin" && redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // Redirect admins accessing /dashboard to /admin/dashboard
    // if (token && path.startsWith("/dashboard") && token.role === "ADMIN") {
    //   return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    // }
    if (token && token.role === "ADMIN" && path.startsWith("/dashboard")) {
      const allowedAdminRoutes = [
        "/dashboard/accountability",
        "/dashboard/accountability-hub",
      ];

      const isAllowed = allowedAdminRoutes.some((r) => path.startsWith(r));

      if (!isAllowed) {
        return NextResponse.redirect(
          new URL("/admin/dashboard", req.url)
        );
      }
    }

    // Redirect non-admins accessing /admin to /dashboard
    if (token && path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Explicitly allow /dashboard/challenge/... for non-admins
    if (
      token &&
      path.startsWith("/dashboard/challenge/") &&
      token.role !== "ADMIN"
    ) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public challenge pages
        if (path === "/dashboard/challenge") {
          return true;
        }
        if (isPublicChallengePage(path)) {
          return true;
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

function isPublicChallengePage(path: string): boolean {
  const privateChallengePrefixes = [
    "/dashboard/challenge/my-challenges",
    "/dashboard/challenge/create-challenge",
    "/dashboard/challenge/join-challenge",
    "/dashboard/challenge/let-others-roll",
  ];

  const isMainChallengePage = path === "/dashboard/challenge";
  const isPrivateSubPage = privateChallengePrefixes.some((prefix) =>
    path.startsWith(prefix)
  );

  return (
    path.startsWith("/dashboard/challenge/") &&
    !isMainChallengePage &&
    !isPrivateSubPage
  );
}

export const config = {
  matcher: ["/dashboard/:path*", "/leaderboard", "/admin/:path*", "/signin"],
};