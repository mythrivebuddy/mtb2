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
      // First, sign up the user by calling the signup API
      const res = await axios.post("/api/auth/signup", data);

      if (res.status >= 200 && res.status < 300) {
        const { userId } = res.data;
      
        toast.success(res.data.message);
      
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
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
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <Input
          placeholder="Referral Code (Optional)"
          {...register("referralCode")}
          className={errors.referralCode ? "border-red-500" : ""}
        />
        {errors.referralCode && (
          <p className="text-red-500 text-sm mt-1">{errors.referralCode.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
