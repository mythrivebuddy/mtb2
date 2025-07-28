"use client";
import React from "react";
import SignInForm from "@/components/auth/SignInForm";
import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

const SignInPageContent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    if (!session) return;
    const finalRedirect = redirectUrl && redirectUrl.includes('/challenge') 
      ? redirectUrl 
      : session?.user?.role === "ADMIN" 
        ? redirectUrl || "/admin/dashboard"
        : redirectUrl || "/dashboard";
    router.push(finalRedirect);
  }, [session, router, redirectUrl]);

  useEffect(() => {
    if (redirectUrl) {
      Cookies.set("redirectAfterAuth", redirectUrl, { expires: 1 });
    }
  }, [redirectUrl]);

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