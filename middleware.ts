// File: middleware.ts (in your project's root folder)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const searchParams = req.nextUrl.searchParams;
    const redirect =
      searchParams.get("redirect") || searchParams.get("callbackUrl") || null;
    const redirectUrl =
      redirect && redirect.startsWith("/")
        ? `${req.nextUrl.origin}${redirect}`
        : null;

    // Handle authenticated users accessing /signin
    if (token && path === "/signin" && redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    if (token?.role === "ADMIN") {
      const mfaPages = ["/mfa-verify", "/mfa-setup"];
      if (mfaPages.some((p) => path.startsWith(p))) {
        return NextResponse.next();
      }

      if (token.authMethod === "GOOGLE") {
        return NextResponse.next();
      }

      const mfaVerified = req.cookies.get("mfa_verified")?.value;
      if (!mfaVerified || mfaVerified !== token.sub) {
        return NextResponse.redirect(new URL("/mfa-verify", req.url));
      }
    }

    // Block non-COACH users from manage-store
    if (path.startsWith("/dashboard/manage-store")) {
      if (!token || token.userType !== "COACH") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
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
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
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

        // Allow public access to Mini Mastery Programs
        if (
          path === "/dashboard/mini-mastery-programs" ||
          /^\/dashboard\/mini-mastery-programs\/[^/]+$/.test(path)
        ) {
          return true;
        }

        // Allow public access to Growth Store
        if (path === "/dashboard/store") {
          return true;
        }

        // ✅ MFA pages publicly accessible (session hone ke baad bhi)
        if (path.startsWith("/mfa-verify")) return true;
        if (path.startsWith("/mfa-setup")) return true;


        // Require authentication for all other pages
        return !!token;
      },
    },
    pages: {
      signIn: "/signin",
    },
  },
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
    path.startsWith(prefix),
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
