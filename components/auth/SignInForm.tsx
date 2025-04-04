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
import { signIn, useSession } from "next-auth/react";
import GoogleIcon from "../icons/GoogleIcon";

function SignInFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession(); // Use session to get role info
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormType>({
    resolver: zodResolver(signinSchema),
  });
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Show a toast or error message when the page loads if there's a specific error
  useEffect(() => {
    console.log(error); //?dev
    if (error === "account-exists-with-credentials") {
      console.log("here");
      setTimeout(() => {
        toast.error(
          "An account with this email already exists. Please sign in with your password."
        );
        router.push("/signin");
      }, 100);
    } else if (error) {
      setTimeout(() => {
        toast.error(error);
      }, 100);
    }
  }, [error, router]);

  useEffect(() => {
    if (!session) return;
    if (session?.user?.role === "ADMIN") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  }, [session, router]);

  const onSubmit = async (data: SigninFormType) => {
    console.log("siginin form data", data);
    setIsLoading(true);
    try {
      // const res = await axios.post("/api/auth/signin", data);
      const res = await signIn("credentials", {
        // callbackUrl: "/dashboard",
        redirect: false,
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      console.log("res", res); //?dev
      if (res?.ok) {
        toast.success("Signed in successfully");
        return;
      }
      if (res?.error) {
        console.log("error", res.error);
        toast.error(res.error ?? "Sign in failed. Please try again later.");
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
      const result = await signIn("google", {
        redirect: false,
      });
      console.log(result);
      if (result?.ok) {
        toast.success("Signed in successfully");
        return;
      }
      if (result?.error) {
        console.log("error", result.error);
        toast.error("Google Sign failed. Please try again later.");
      }
    } catch (error) {
      console.error("Error signing in", error); //?dev
      toast.error(
        getAxiosErrorMessage(
          error,
          "Google Sign failed. Please try again later."
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            {...register("email")}
            className={`h-12 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Input
            type="password"
            placeholder="Password"
            {...register("password")}
            className={`h-12 ${errors.password ? "border-red-500" : ""}`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
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
          <Link
            href="/forgot-password"
            className="text-[#1E2875] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-[16px]"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
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
  );
}

export default function SignInForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormContent />
    </Suspense>
  );
}
