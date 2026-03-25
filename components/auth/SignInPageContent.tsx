"use client";
import React from "react";
import SignInForm from "@/components/auth/SignInForm";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const SignInPageContent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || searchParams.get("callbackUrl") || "/dashboard"; // Respect redirect parameter

  useEffect(() => {
    if (!session) return;

    const checkAndRedirect = async () => {
      if (session?.user?.role === "ADMIN") {
        if (session?.user?.authMethod === "GOOGLE") {
          router.push("/admin/dashboard");
          return;
        }

         // ✅ Pehle check karo — MFA already verified hai?
      const mfaStatusRes = await fetch("/api/admin/mfa/check-verified");
      const mfaStatus = await mfaStatusRes.json();

      if (mfaStatus.verified) {
        // Cookie valid hai — seedha dashboard
        router.push("/admin/dashboard");
        return;
      }

        const mfaRes = await fetch("/api/admin/mfa/status");
        const mfaData = await mfaRes.json();

        if (mfaData.mfaEnabled) {
          router.push("/mfa-verify");
        } else {
          router.push("/mfa-setup");
        }
        return;
      }

      router.push(redirect);
    };

    checkAndRedirect();
  }, [session, router, redirect]);

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

export default SignInPageContent;