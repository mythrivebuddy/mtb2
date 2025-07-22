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
            className="object-fit"
            priority
          />
        </div>

        {/* Content */}
        <CardContent className="w-full p-6 space-y-4">
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

          <p className="w-full text-center bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition">
            Share the survey with your solopreneur circle
          </p>

          <div className="flex justify-center flex-wrap gap-4 text-blue-600 text-sm pt-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={() => handleShare("whatsapp")}
              className="flex items-center space-x-2 bg-[#198340] hover:bg-[#258649] hover:text-white text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
              </svg>
              <span>WhatsApp</span>
            </Button>

            {/* LinkedIn */}
            <Button
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="flex items-center space-x-2 bg-[#17719e] hover:bg-[#266381] hover:text-white text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.7v2.3h.1c.7-1.3 2.3-2.7 4.8-2.7 5.1 0 6 3.3 6 7.6V24h-5v-7.6c0-1.8 0-4.1-2.5-4.1s-2.9 2-2.9 4v7.7h-5V8z" />
              </svg>
              <span>LinkedIn</span>
            </Button>

            {/* Telegram */}
            <Button
              variant="outline"
              onClick={() => handleShare("telegram")}
              className="flex items-center space-x-2 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.563 8.994l-1.83 8.59c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.566-4.458c.534-.196 1.006.128.832.941z" />
              </svg>
              <span>Telegram</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
