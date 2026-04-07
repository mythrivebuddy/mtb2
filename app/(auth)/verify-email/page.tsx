"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useEffect } from "react";
import PageLoader from "@/components/PageLoader";

export default function VerifyEmail() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { data, error, isPending, isError } = useQuery<
    {
      success: boolean;
      type?: "verified" | "already_verified";
    },
    Error
  >({
    queryKey: ["verify-email", token],
    queryFn: async () => {
      if (!token) throw new Error("Invalid verification link");
      const res = await axios.post("/api/auth/verify-email/confirm", { token });
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data?.success) {
      if (data.type === "already_verified") {
        toast.success("Your email is already verified. You can sign in.");
      } else {
        toast.success("Email verified successfully!");
      }
      router.push("/signin");
    }
  }, [data, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          {isPending ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <PageLoader />
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          ) : isError ? (
            <div className="text-center">
              {axios.isAxiosError(error) ? (

                error.response?.data?.code === "TOKEN_EXPIRED" ? (
                  <>
                    <p className="text-yellow-600 font-medium">
                      This verification link has expired.
                    </p>
                    <p className="text-gray-600 text-sm">
                      We’ve sent a new verification link to your email address.
                      Please check your inbox and use the new link.
                    </p>
                  </>
                ) : error.response?.data?.code === "COOLDOWN_ACTIVE" ? (
                  <>
                    <p className="text-yellow-600 font-medium">
                      A new verification link was already sent recently.
                    </p>
                    <p className="text-gray-600 text-sm">
                      Please check your email inbox. You can use the latest verification link we sent.
                    </p>
                  </>
                ) : (
                  <p className="text-red-500 font-medium">
                    This verification link is invalid or has already been used.
                  </p>
                )
              ) : null}
              <button
                onClick={() => router.push("/signin")}
                className="mt-4 text-[#151E46] hover:text-[#151E46]/80"
              >
                Return to Sign In
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
