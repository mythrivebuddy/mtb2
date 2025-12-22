"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { SignupFormType, signupSchema } from "@/schema/zodSchema";
import GoogleIcon from "../icons/GoogleIcon";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { Checkbox } from "@/components/ui/checkbox";
import { isInAppBrowser, openInExternalBrowser } from "@/lib/utils/isInAppBrowser";

export default function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  // Recaptcha states
  const captchaRef = useRef<ReCAPTCHA | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [prefilledTypes, setPrefilledTypes] = useState<string[]>([]);
  const [userHasChosen, setUserHasChosen] = useState(false);

  const userType = searchParams.get("user-type");

  const referralCodeFromURL = searchParams.get("ref");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormType>({
    resolver: zodResolver(signupSchema),
  });
  useEffect(() => {
    if (!userType) return;

    if (userType === "coach-solopreneur") {
      setPrefilledTypes(["coach"]);
      setValue("userType", "coach", { shouldValidate: true });
      setUserHasChosen(false);
      return;
    }

    if (userType === "coach" || userType === "enthusiast") {
      setPrefilledTypes([userType]);
      setValue("userType", userType as "coach" | "enthusiast", {
        shouldValidate: true,
      });
      setUserHasChosen(false);
    }
  }, [userType, setValue]);

  // ✅ Store referral code in cookie if present
  useEffect(() => {
    if (referralCodeFromURL) {
      setValue("referralCode", referralCodeFromURL);
      Cookies.set("referralCode", referralCodeFromURL, { expires: 7 });
    }
  }, [referralCodeFromURL, setValue]);

  // ✅ React Query mutation for signup
  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormType & { captchaToken?: string }) => {
      const res = await axios.post("/api/auth/signup", data);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      toast.success("Signup successful");
      const referralCode =
        variables.referralCode || Cookies.get("referralCode");

      if (referralCode) {
        try {
          const referralRes = await axios.post("/api/refer-friend/process", {
            referralCode,
            userId: data.userId,
          });

          if (referralRes.status >= 200 && referralRes.status < 300) {
            toast.success("Referral processed successfully!");
            Cookies.remove("referralCode"); // remove after processing
          }
        } catch (refErr) {
          toast.error(getAxiosErrorMessage(refErr, "Referral failed"));
        }
      }

      router.push("/signin");
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err, "Signup failed"));
      captchaRef.current?.reset();
    },
  });

  const onSubmit: SubmitHandler<SignupFormType> = async (formData) => {
    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA to continue.");
      return;
    }

    setIsLoading(true);
    signupMutation.mutate(
      { ...formData, captchaToken: captchaToken as string },
      {
        onSettled: () => setIsLoading(false),
      }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      // Get referral code from URL or cookies
      // const referralCode = searchParams.get('ref');
      if (isInAppBrowser()) {
        toast.info("Opening secure browser for Google sign-in");
        openInExternalBrowser("/signin");
        return;
      }

      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/dashboard",
        // state: "gggggggggg",
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

  const handleCaptchaChange = (token: string | null) => {
    // This token is what you send to your backend for verification
    setCaptchaError(null);
    setCaptchaToken(token);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          type="text"
          {...register("honeypot" as never)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <Input {...register("name")} placeholder="Your Name" />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}

        <Input {...register("email")} placeholder="Email" type="email" />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}

        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
          {errors.password && (
            <p className="text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
          />
          <div
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Input
          {...register("referralCode")}
          placeholder="Referral Code (optional)"
          readOnly={!!referralCodeFromURL}
        />
        {errors.referralCode && (
          <p className="text-red-500">{errors.referralCode.message}</p>
        )}
        {referralCodeFromURL && (
          <p className="text-gray-500 text-sm">
            Referral code auto-filled from link
          </p>
        )}

        {/* USER TYPE SELECTION */}
        <div className="space-y-3">
          <label className="font-medium text-gray-700 text-sm">
            Select Your Type
          </label>

          {/* Enthusiast */}
          <div
            className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setUserHasChosen(true);
              setValue("userType", "enthusiast", { shouldValidate: true });
            }}
          >
            <Checkbox
              id="enthusiast"
              checked={
                userHasChosen
                  ? watch("userType") === "enthusiast"
                  : prefilledTypes.includes("enthusiast")
              }
              onCheckedChange={() => {
                setUserHasChosen(true);
                setValue("userType", "enthusiast", {
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
              onClick={(e) => e.stopPropagation()} // prevent double toggling
            />

            <label
              htmlFor="enthusiast"
              className="text-sm cursor-pointer"
              onClick={(e) => e.stopPropagation()} // allow label to toggle without firing parent twice
            >
              Self Growth Enthusiast
            </label>
          </div>

          <div
            className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setUserHasChosen(true);
              setValue("userType", "coach", { shouldValidate: true });
            }}
          >
            <Checkbox
              id="coach"
              checked={
                userHasChosen
                  ? watch("userType") === "coach"
                  : prefilledTypes.includes("coach")
              }
              onCheckedChange={() => {
                setUserHasChosen(true);
                setValue("userType", "coach", {
                  shouldValidate: true,
                  shouldTouch: true,
                });
              }}
              onClick={(e) => e.stopPropagation()}
            />

            <label
              htmlFor="coach"
              className="text-sm cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              Coach / Solopreneur
            </label>
          </div>
          {/* ZOD ERROR */}
          {errors.userType && (
            <p className="text-red-500 text-sm">{errors.userType.message}</p>
          )}
        </div>

        <div className="w-full overflow-hidden flex flex-col items-center">
          <div className="scale-[0.95] origin-top inline-block">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
              onChange={handleCaptchaChange}
            />
          </div>

          {captchaError && (
            <p className="text-red-500 text-sm mt-2 break-words whitespace-normal text-center px-2">
              {captchaError}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-12 flex items-center justify-center space-x-2"
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
