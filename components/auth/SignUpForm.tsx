
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { SignupFormType, signupSchema } from "@/schema/zodSchema";
import GoogleIcon from "../icons/GoogleIcon";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react"; // make sure to install lucide-react

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignupFormType>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (referralCode) {
      setValue("referralCode", referralCode);
    }
  }, [referralCode, setValue]);

  const onSubmit: SubmitHandler<SignupFormType> = async (data) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", data);

      if (res.status >= 200 && res.status < 300) {
        const { userId } = res.data;
        toast.success(res.data.message);

        console.log("data.referralCode", data.referralCode); //?dev

        // Process referral if code exists
        if (data.referralCode) {
          try {
            const referralRes = await axios.post("/api/refer-friend/process", {
              referralCode: data.referralCode,
              userId,
            });

            if (referralRes.status >= 200 && referralRes.status < 300) {
              toast.success("Referral processed successfully!");
            } else {
              toast.error(getAxiosErrorMessage(referralRes));
            }
          } catch (referralError) {
            console.error("Referral processing error:", referralError);
            toast.error(
              getAxiosErrorMessage(referralError, "Failed to process referral")
            );
          }
        }

        router.push("/signin");
        return;
      }
      toast.error(getAxiosErrorMessage(res));
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(
        getAxiosErrorMessage(error, "Signup failed. Please try again later.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (result?.ok) {
        router.push("/dashboard");
        toast.success("Signed in successfully");
        return;
      }
      if (result?.error) {
        toast.error("Google Sign in failed. Please try again later.");
      }
    } catch (error) {
      console.error("Error signing in", error);
      toast.error(
        getAxiosErrorMessage(
          error,
          "Google Sign in failed. Please try again later."
        )
      );
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            placeholder=" Your Name"
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Input
            type="email"
            placeholder="Email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className={errors.password ? "border-red-500" : ""}
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            {...register("confirmPassword")}
            className={errors.confirmPassword ? "border-red-500" : ""}
          />
          <div
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <Input
            placeholder="Referral Code (Optional)"
            {...register("referralCode")}
            className={errors.referralCode ? "border-red-500" : ""}
            readOnly={!!referralCode}
          />
          {errors.referralCode && (
            <p className="text-red-500 text-sm mt-1">
              {errors.referralCode.message}
            </p>
          )}
          {referralCode && (
            <p className="text-sm text-gray-500 mt-1">
              Referral code auto-filled from link
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
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
        Already have an account?{" "}
        <Link
          href="/signin"
          className="text-[#1E2875] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}