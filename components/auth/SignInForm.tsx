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
import { isInAppBrowser, openInExternalBrowser } from "@/lib/utils/isInAppBrowser";

function SignInFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(""); // For backend error
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SigninFormType>({
    resolver: zodResolver(signinSchema),
  });

  const searchParams = useSearchParams();
  const redirect = "/MTB-2026-the-complete-makeover-program"; // high priority to makeover program we will change this in future
  // || searchParams.get("redirect") || searchParams.get("callbackUrl");
  const errorFromUrl = searchParams.get("error");

  useEffect(() => {
    if (errorFromUrl === "account-exists-with-credentials") {
      setTimeout(() => {
        toast.error(
          "An account with this email already exists. Please sign in with your password."
        );
        router.push("/signin");
      }, 100);
    } else if (errorFromUrl) {
      setTimeout(() => {
        toast.error(errorFromUrl);
      }, 100);
    }
  }, [errorFromUrl, router]);

  const onSubmit = async (data: SigninFormType) => {
    try {
      setIsLoading(true);
      setLoginError(""); // Reset login error

      const response = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackUrl: redirect,
      });

      if (response?.ok) {
        await router.push(redirect);
        toast.success("Signin successful");
        return;
      }

      if (response?.error) {
        setLoginError(response.error); // Show actual error from backend
      } else {
        setLoginError("Sign in failed. Please try again.");
      }
    } catch (error) {
      console.error("Signin error:", error);
      toast.error(
        getAxiosErrorMessage(error, "Sign in failed. Please try again later.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      if (isInAppBrowser()) {
        toast.info("Opening secure browser for Google sign-in");
        openInExternalBrowser("/signin");
        return;
      }
       signIn("google", {
        // redirect: false,
        callbackUrl: redirect,
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error(
        getAxiosErrorMessage(
          error,
          "Google Sign in failed. Please try again later."
        )
      );
    }
  };
  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 mt-4 sm:mt-8 shadow-sm">
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              {...register("email")}
              onChange={(e) => {
                setValue("email", e.target.value);
                setLoginError(""); // Clear error on change
              }}
              className={`h-12  ${errors.email || loginError ? "border-red-500" : ""} relative`}
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
            {!errors.email && loginError && (
              <p className="text-red-500 text-sm mt-1">{loginError}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                type={`${showPassword ? "text" : "password"}`}
                placeholder="Password"
                {...register("password")}
                onChange={(e) => {
                  setValue("password", e.target.value);
                  setLoginError(""); // Clear error on change
                }}
                className={`h-12 ${errors.password || loginError ? "border-red-500" : ""}`}
              />
              <button
                className="absolute right-2 top-3 cursor-pointer"
                type="button"
                onClick={handlePasswordToggle}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
            {!errors.password && loginError && (
              <p className="text-red-500 text-sm mt-1">{loginError}</p>
            )}
          </div>

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

        <div className="relative">
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

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
    </div>
  );
}

export default function SignInForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormContent />
    </Suspense>
  );
}
