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
  const redirect = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/dashboard"; // Respect redirect parameter
  console.log(redirect);
  useEffect(() => console.log("SESSION:", session), [session]);

  
  useEffect(() => {
    if (!session) return;

    console.log("SignInPageContent redirecting:", { redirect, role: session?.user?.role }); // Debug

    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.replace(redirect); // Use redirect parameter
    }
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