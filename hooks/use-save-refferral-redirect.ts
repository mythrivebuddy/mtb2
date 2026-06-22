// hooks/useReferralAndRedirect.ts
"use client";

import { useSearchParams, ReadonlyURLSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Cookies from "js-cookie";
import { useEffect, useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type UseReferralAndRedirectReturn = {
  ref: string | undefined;
  setCallbackUrl: () => void;
  getFinalCallbackUrl: () => string;
  redirectToSignin: (router: AppRouterInstance) => void;
};

export const useReferralAndRedirect = (): UseReferralAndRedirectReturn => {
  const searchParams: ReadonlyURLSearchParams = useSearchParams();
  const { status } = useSession();

  const isAuthenticated: boolean = status === "authenticated";

  const currentUrl: string =
    typeof window !== "undefined" ? window.location.href : "";

  const refFromUrl: string | null = searchParams.get("ref");
  const existingRef: string | undefined = Cookies.get("referralCode");

  // ─────────────────────────────────────────────
  // ✅ LAST TOUCH REF (ONLY IF NOT AUTHENTICATED)
  // ─────────────────────────────────────────────
  const finalRef: string | undefined = useMemo(() => {
    if (!isAuthenticated && refFromUrl && refFromUrl !== existingRef) {
      Cookies.set("referralCode", refFromUrl, {
        expires: 7,
        path: "/",
      });
      return refFromUrl;
    }

    return refFromUrl || existingRef;
  }, [refFromUrl, existingRef, isAuthenticated]);

  // ─────────────────────────────────────────────
  // ✅ PASSIVE TRACKING
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const current = window.location.href;

    // ❗ ONLY proceed if user is NOT authenticated AND ref exists
    if (!isAuthenticated && refFromUrl) {
      // ✅ REFERRAL (last-touch)
      if (refFromUrl !== existingRef) {
        Cookies.set("referralCode", refFromUrl, {
          expires: 7,
          path: "/",
        });
      }

      // ✅ CALLBACK (only first time)
      const existingCallback = Cookies.get("callbackUrl");

      if (!existingCallback && current) {
        Cookies.set("callbackUrl", encodeURIComponent(current), {
          expires: 1 / 24, // 1 hour
          path: "/",
        });
      }
    }
  }, [refFromUrl, existingRef, isAuthenticated]);

  // ─────────────────────────────────────────────
  // ✅ MANUAL CALLBACK SETTER (USER INTENT)
  // ─────────────────────────────────────────────
  const setCallbackUrl = (): void => {
    if (!currentUrl) return;

    Cookies.set("callbackUrl", encodeURIComponent(currentUrl), {
      expires: 1 / 24,
      path: "/",
    });
  };

  // ─────────────────────────────────────────────
  // ✅ FINAL CALLBACK RESOLUTION
  // Priority:
  // 1. searchParams
  // 2. cookie
  // 3. /dashboard
  // ─────────────────────────────────────────────
  const getFinalCallbackUrl = (): string => {
    const fromUrl: string | null = searchParams.get("callbackUrl");
    const fromCookie: string | undefined = Cookies.get("callbackUrl");

    let cb: string =
      fromUrl ||
      (fromCookie ? decodeURIComponent(fromCookie) : "") ||
      "/dashboard";

    try {
      new URL(cb); // absolute URL
    } catch {
      cb = `${window.location.origin}${cb}`;
    }

    return cb;
  };

  // ─────────────────────────────────────────────
  // ✅ REDIRECT HANDLER
  // ─────────────────────────────────────────────
  const redirectToSignin = (router: AppRouterInstance): void => {
    if (!currentUrl) return;

    // 🔥 explicit intent → override callback
    setCallbackUrl();

    const encoded: string = encodeURIComponent(currentUrl);

    router.push(`/signin?callbackUrl=${encoded}`);
  };

  return {
    ref: finalRef,
    setCallbackUrl,
    getFinalCallbackUrl,
    redirectToSignin,
  };
};
