"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAxiosErrorMessage } from "@/utils/ax";
import { SigninFormType, signinSchema } from "@/schema/zodSchema";
import { signIn } from "next-auth/react";
import GoogleIcon from "../icons/GoogleIcon";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { isInAppBrowser } from "@/lib/utils/isInAppBrowser";
import OpenInBrowserDialog from "./OpenInBrowserDialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionResponse {
  user?: { role?: string };
}
interface MfaStatusResponse {
  mfaEnabled: boolean;
}

// ─── Inner form (needs Suspense for useSearchParams) ──────────────────────────

function SignInFormContent() {
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOpenBrowserDialog, setShowOpenBrowserDialog] = useState(false);
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("redirect") ||
    searchParams.get("callbackUrl") ||
    "/dashboard";
  const errorFromUrl = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<SigninFormType>({
    resolver: zodResolver(signinSchema),
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await axios.post("/api/auth/resend-verification-email", {
        email,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Verification email sent!");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Failed to resend email"));
    },
  });
  const resendVerification = () => {
    const email = getValues("email");

    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    if (loginError !== "EMAIL_NOT_VERIFIED") {
      toast.error("Please try signing in first");
      return;
    }

    resendMutation.mutate(email);
  };

  // ── Show URL errors on mount ───────────────────────────────────────────
  useEffect(() => {
    if (errorFromUrl === "account-exists-with-credentials") {
      setTimeout(() => {
        toast.error(
          "An account with this email already exists. Please sign in with your password.",
        );
        router.push("/signin");
      }, 100);
    } else if (errorFromUrl) {
      setTimeout(() => toast.error(errorFromUrl), 100);
    }
  }, [errorFromUrl, router]);

  // ── Fetch MFA status only after admin credentials sign-in ─────────────
  const { data: mfaStatus } = useQuery<MfaStatusResponse>({
    queryKey: ["mfa-status-signin"],
    queryFn: () =>
      axios.get<MfaStatusResponse>("/api/admin/mfa/status").then((r) => r.data),
    enabled: isAdminSignedIn,
    staleTime: 0,
  });

  // ── Redirect after MFA status is fetched ──────────────────────────────
  useEffect(() => {
    if (!isAdminSignedIn || mfaStatus === undefined) return;
    router.push(mfaStatus.mfaEnabled ? "/mfa-verify" : "/mfa-setup");
  }, [isAdminSignedIn, mfaStatus, router]);

  // ── Credentials sign-in mutation ──────────────────────────────────────
  const signinMutation = useMutation({
    mutationFn: async (data: SigninFormType) => {
      const response = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackUrl: redirect,
      });

      if (!response?.ok) {
        throw new Error(response?.error || "Sign in failed. Please try again.");
      }

      // Fetch session to check role
      const sessionRes = await axios.get<SessionResponse>("/api/auth/session");
      return sessionRes.data;
    },
    onSuccess: (session) => {
      if (session?.user?.role === "ADMIN") {
        // Trigger MFA status query
        setIsAdminSignedIn(true);
        return;
      }
      toast.success("Signin successful");
      router.push(redirect);
    },
    onError: (err: Error) => {
      const message = err.message;

      if (message.includes("not verified")) {
        setLoginError("EMAIL_NOT_VERIFIED");
      } else {
        setLoginError(message);
      }
    },
  });

  const onSubmit = (data: SigninFormType) => {
    setLoginError("");
    signinMutation.mutate(data);
  };

  const handleGoogleLogin = async () => {
    try {
      if (isInAppBrowser()) {
        setShowOpenBrowserDialog(true);
        return;
      }
      await signIn("google", { callbackUrl: redirect });
    } catch (error) {
      toast.error(
        getAxiosErrorMessage(
          error,
          "Google Sign in failed. Please try again later.",
        ),
      );
    }
  };

  const isLoading = signinMutation.isPending;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 mt-4 sm:mt-8 shadow-sm">
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              {...register("email")}
              onChange={(e) => {
                setValue("email", e.target.value);
                setLoginError("");
              }}
              className={`h-12 ${errors.email || loginError ? "border-red-500" : ""} relative`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}

            {!errors.email &&
              loginError &&
              loginError !== "EMAIL_NOT_VERIFIED" && (
                <p className="text-red-500 text-sm mt-1">{loginError}</p>
              )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password")}
                onChange={(e) => {
                  setValue("password", e.target.value);
                  setLoginError("");
                }}
                className={`h-12 ${errors.password || loginError ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                className="absolute right-2 top-3 cursor-pointer"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
            {!errors.password && loginError === "EMAIL_NOT_VERIFIED" && (
              <p className="text-red-500 text-sm mt-1 whitespace-nowrap">
                Your email is not verified.
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resendMutation.isPending}
                  className="text-blue-600 underline ml-1"
                >
                 {resendMutation.isPending ? "Sending email..." : "Resend verification email"}
                </button>
              </p>
            )}

            {!errors.password &&
              loginError &&
              loginError !== "EMAIL_NOT_VERIFIED" && (
                <p className="text-red-500 text-sm mt-1">{loginError}</p>
              )}
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                {...register("rememberMe")}
              />
              <span>Remember me</span>
            </label>
            <a
              href="/forgot-password"
              className="text-[#1E2875] hover:underline"
              target="_blank"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-[16px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Google sign-in */}
        <Button
          variant="outline"
          className="w-full h-12 text-[16px] flex items-center justify-center space-x-2"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          <span>Sign in with Google</span>
        </Button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#1E2875] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>

      <OpenInBrowserDialog
        open={showOpenBrowserDialog}
        onOpenChange={setShowOpenBrowserDialog}
        onConfirm={() => setShowOpenBrowserDialog(false)}
      />
    </div>
  );
}

// ─── Export with Suspense ─────────────────────────────────────────────────────

export default function SignInForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormContent />
    </Suspense>
  );
}
