"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { SignupFormType, signupSchema } from "@/schema/zodSchema";
import GoogleIcon from "../icons/GoogleIcon";
import { signIn } from "next-auth/react";

// const schema = z
//   .object({
//     email: z.string().email("Invalid email address"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ["confirmPassword"],
//   });

// type FormData = z.infer<typeof schema>;

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormType>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit: SubmitHandler<SignupFormType> = async (data) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", data);
      if (res.status >= 200 && res.status < 300) {
        toast.success(res.data.message);
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
            // type="password"
            placeholder="Enter Your Name"
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
        <div>
          <Input
            type="password"
            placeholder="Password"
            {...register("password")}
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
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
    </div>
  );
}
