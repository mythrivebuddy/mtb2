"use client";
import React, { Suspense } from "react";
import SignInForm from "@/components/auth/SignInForm";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MfaCheckVerifiedResponse { verified: boolean; }
interface MfaStatusResponse       { mfaEnabled: boolean; }

// ─── Inner content (needs Suspense for useSearchParams) ───────────────────────

const SignInPageInner = () => {
  const { data: session } = useSession();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const redirect          = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/dashboard";

  const isAdmin        = session?.user?.role === "ADMIN";
  const isGoogleAdmin  = isAdmin && session?.user?.authMethod === "GOOGLE";

  // ── Only fetch when admin + not Google ──────────────────────────────────
  const { data: mfaVerified } = useQuery<MfaCheckVerifiedResponse>({
    queryKey: ["mfa-check-verified"],
    queryFn:  () =>
      axios
        .get<MfaCheckVerifiedResponse>("/api/admin/mfa/check-verified")
        .then((r) => r.data),
    enabled: isAdmin && !isGoogleAdmin,
    staleTime: 0,
  });

  const { data: mfaStatus } = useQuery<MfaStatusResponse>({
    queryKey: ["mfa-status"],
    queryFn:  () =>
      axios
        .get<MfaStatusResponse>("/api/admin/mfa/status")
        .then((r) => r.data),
    // Only fetch after we know cookie is NOT verified
    enabled: isAdmin && !isGoogleAdmin && mfaVerified?.verified === false,
    staleTime: 0,
  });

  // ── Redirect logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    // Google admin → skip MFA
    if (isGoogleAdmin) {
      router.push("/admin/dashboard");
      return;
    }

    // Non-Google admin
    if (isAdmin) {
      // Cookie already valid
      if (mfaVerified?.verified) {
        router.push("/admin/dashboard");
        return;
      }

      // Cookie NOT valid + we know MFA status
      if (mfaVerified?.verified === false && mfaStatus !== undefined) {
        router.push(mfaStatus.mfaEnabled ? "/mfa-verify" : "/mfa-setup");
        return;
      }

      // Still loading — wait
      return;
    }

    // Regular user
    router.push(redirect);
  }, [session, isAdmin, isGoogleAdmin, mfaVerified, mfaStatus, router, redirect]);

  return (
    <AppLayout>
      <div className="mt-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E2875] mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        <SignInForm />
      </div>
    </AppLayout>
  );
};

// ─── Page export with Suspense ────────────────────────────────────────────────

const SignInPageContent = () => (
  <Suspense fallback={null}>
    <SignInPageInner />
  </Suspense>
);

export default SignInPageContent;