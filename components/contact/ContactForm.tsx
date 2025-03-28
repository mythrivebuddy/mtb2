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

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
    setIsLoading(true);
    if (!captchaToken) {
      toast.error("Please complete the captcha");
      setIsLoading(false);
      return;
    }
    try {
      console.log("Submitting form data:", formData);
      await axios.post("/api/contactus", {
        formData,
        captchaToken,
      });
      // Simulate delay for API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thank you for your message! We'll get back to you soon.");
      setSuccess(true);
      reset();
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm mb-6">
          Thank you for your message! We&apos;ll get back to you soon.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input
            placeholder="Your Name"
            {...register("name")}
            className={`h-12 ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Input
            type="email"
            placeholder="Email Address"
            {...register("email")}
            className={`h-12 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Input
            placeholder="Subject"
            {...register("subject")}
            className={`h-12 ${errors.subject ? "border-red-500" : ""}`}
          />
          {errors.subject && (
            <p className="text-red-500 text-sm mt-1">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <Textarea
            placeholder="Your Message"
            rows={6}
            {...register("message")}
            className={errors.message ? "border-red-500" : ""}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
          onChange={handleCaptchaChange}
        />

        <Button
          type="submit"
          className="w-full h-12 text-[16px]"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
