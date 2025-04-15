"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "sonner";
import axios from "axios";
import { useSession } from "next-auth/react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    if (!captchaToken) {
      toast.error("Please complete the captcha verification");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/contactus", {
        formData,
        captchaToken,
      });

      toast.success(response.data.message);
      reset();
      setCaptchaToken(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to send message. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {session?.user ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-700 flex items-center justify-center gap-4 text-xs font-medium">
            <span>
              • General <span className="font-bold">50 Joy Pearls 🪙</span>
            </span>
            <span className="text-green-400">|</span>
            <span>
              • Feature <span className="font-bold">100 Joy Pearls 🪙</span>
            </span>
            <span className="text-green-400">|</span>
            <span>
              • Bug <span className="font-bold">150 Joy Pearls 🪙</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Sign in to earn Joy Pearls for your feedback!
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <Input
            id="name"
            placeholder="Your Name"
            {...register("name")}
            className={`h-12 ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Email Address"
            {...register("email")}
            className={`h-12 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subject
          </label>

          <div className="flex items-center gap-x-6">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="general"
                value="general"
                {...register("subject")}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="general" className="text-sm text-gray-700">
                General Feedback
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="feature"
                value="feature"
                {...register("subject")}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="feature" className="text-sm text-gray-700">
                Feature Request
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="bug"
                value="bug"
                {...register("subject")}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <label htmlFor="bug" className="text-sm text-gray-700">
                Bug Report
              </label>
            </div>
          </div>

          {errors.subject && (
            <p className="text-red-500 text-sm">{errors.subject.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <Textarea
            id="message"
            placeholder="Your Message"
            rows={6}
            {...register("message")}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && (
            <p className="text-red-500 text-sm">{errors.message.message}</p>
          )}
        </div>

        <div className="flex justify-start">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
            onChange={handleCaptchaChange}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-[16px] "
          disabled={isLoading || !captchaToken}
        >
          {isLoading ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
