"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "../ui/button";

export default function SurveyModal() {
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/survey`);
    }
  }, []);

  const handleShare = (platform: string) => {
    const shareText = `Join this survey 👇 ${shareLink}`;
    const platforms = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
    };

    if (platforms[platform as keyof typeof platforms]) {
      window.open(platforms[platform as keyof typeof platforms], "_blank");
    } else {
      alert("Instagram sharing is not supported via URL.");
    }
  };

  return (
    <div className="my-12 flex justify-center items-center z-50">
      <Card className="flex flex-col w-full max-w-4xl rounded-xl overflow-hidden shadow-lg">
        {/* Image */}
        <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px]">
          <Image
            src="/image2.png"
            alt="Illustration"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content */}
        <CardContent className="w-full p-6 space-y-6">
          <h2 className="text-2xl font-bold">
            Thank you — You&apos;ve completed your session.
          </h2>

          <p className="text-gray-600">
            Your responses are now locked into the Solopreneur Vault.
            <br />
            Your next session will unlock in 4 hours.
            <br />
            Come back then to answer more — the collective grows one mindful
            answer at a time.
          </p>

          <p className="text-gray-500 text-sm">
            You&apos;re one of 10,000+ solopreneurs building the future.
          </p>

          <h3 className="w-full text-center text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-full shadow-md">
            Share the survey with your solopreneur circle
          </h3>

          <div className="flex justify-center flex-wrap gap-4 pt-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={() => handleShare("whatsapp")}
              className="flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg bg-gradient-to-r from-[#128C7E] to-[#075E54] text-white hover:text-white transition-all hover:-translate-y-1"
            >
              <svg
                className="w-9 h-9 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                fill="currentColor"
              >
                <path d="M256 0C114.84 0 0 114.836 0 256c0 45.252 11.828 89.25 34.293 127.582L0 512l132.473-34.078C171.035 500.813 212.418 512 256 512c141.162 0 256-114.836 256-256S397.162 0 256 0zm0 472c-40.125 0-79.18-10.695-113.383-30.973l-7.645-4.59-78.347 20.192 21.028-76.915-4.949-7.879C53.363 334.894 40 296.32 40 256c0-119.103 96.897-216 216-216s216 96.897 216 216-96.897 216-216 216zm121.715-150.3c-6.719-3.359-39.656-19.531-45.793-21.746-6.156-2.234-10.641-3.328-15.125 3.328-4.484 6.656-17.297 21.746-21.203 26.234-3.906 4.484-7.812 5.031-14.531 1.672-6.719-3.344-28.359-10.453-54.027-33.297-19.961-17.797-33.437-39.805-37.344-46.453-3.891-6.656-.43-10.25 2.938-13.609 3.016-3 6.719-7.812 10.078-11.719 3.359-3.906 4.484-6.656 6.719-11.109 2.219-4.453 1.109-8.359-.547-11.719-1.656-3.359-14.688-35.625-20.109-48.703-5.313-12.875-10.734-11.109-14.531-11.328-3.75-.219-8.078-.266-12.406-.266s-11.328 1.609-17.203 8.328C109.312 177.187 96 194.64 96 225.25c0 30.594 21.953 60.234 24.984 64.328 3.016 4.078 43.141 66.016 104.836 91.375 14.656 6.078 26.078 9.703 34.984 12.391 14.703 4.688 28.078 4.031 38.672 2.438 11.781-1.781 39.656-16.219 45.188-31.922 5.531-15.688 5.531-29.156 3.891-31.953-1.625-2.813-6.141-4.453-12.84-7.812z" />
              </svg>
              <span className="text-lg font-semibold">WhatsApp</span>
            </Button>

            {/* LinkedIn */}
            <Button
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg bg-gradient-to-r from-[#004182] to-[#002D64] text-white hover:text-white transition-all hover:-translate-y-1"
            >
              <svg
                className="w-9 h-9 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.7v2.3h.1c.7-1.3 2.3-2.7 4.8-2.7 5.1 0 6 3.3 6 7.6V24h-5v-7.6c0-1.8 0-4.1-2.5-4.1s-2.9 2-2.9 4v7.7h-5V8z" />
              </svg>
              <span className="text-lg font-semibold">LinkedIn</span>
            </Button>

            {/* Telegram */}
            <Button
              variant="outline"
              onClick={() => handleShare("telegram")}
              className="flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg bg-gradient-to-r from-[#005f9e] to-[#003f66] text-white hover:text-white transition-all hover:-translate-y-1"
            >
              <svg
                className="w-9 h-9 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.563 8.994l-1.83 8.59c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.566-4.458c.534-.196 1.006.128.832.941z" />
              </svg>
              <span className="text-lg font-semibold">Telegram</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
