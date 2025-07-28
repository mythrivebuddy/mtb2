"use client";
import { useSession } from "next-auth/react";
import AppLayout from "../layout/AppLayout";
import React, { Suspense, useEffect } from "react";
import SignUpForm from "./SignUpForm";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoader from "../PageLoader";
import Cookies from "js-cookie";

const SignUpPageContent = () => {
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
            Create Account
          </h1>
          <p className="text-gray-600">Join MyThriveBuddy today</p>
        </div>
        <Suspense fallback={<PageLoader />}>
          <SignUpForm />
        </Suspense>
      </div>
    </AppLayout>
  );
};

export default SignUpPageContent;