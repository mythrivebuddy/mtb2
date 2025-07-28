"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CardContent } from "@/components/ui/card";
import { Button } from "../ui/button";
import { FaWhatsapp, FaTelegramPlane, FaLinkedinIn } from "react-icons/fa";
import Link from "next/link";


export default function SurveyModalDialog() {
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

    const url = platforms[platform as keyof typeof platforms];
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("Instagram sharing is not supported via URL.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-xl mt-12 shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Banner image */}
        <div className="relative w-full h-[180px] sm:h-[200px]">
          <Image
            src="/image2.png"
            alt="Survey"
            fill
            className="object-cover"
            priority
          />
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Thank you — You&apos;ve completed your session.
            </h2>
          </div>

          <p className="text-gray-600 text-sm">
            Your responses are now locked into the Solopreneur Vault.
            <br />
            Your next session will unlock in 4 hours.
            <br />
            Come back then to answer more — the collective grows one mindful
            answer at a time.
          </p>

          <p className="text-gray-500 text-xs">
            You&apos;re one of 10,000+ solopreneurs building the future.
          </p>

          <h3 className="w-full text-center text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white py-1.5 px-3 rounded-full shadow-md">
            Share the survey with your solopreneur circle
          </h3>

          <div className="flex justify-center flex-wrap gap-3 pt-2">
            {/* WhatsApp */}
            <Button
              variant="outline"
              onClick={() => handleShare("whatsapp")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-gradient-to-r from-[#128C7E] to-[#075E54] text-white text-sm hover:text-white transition-all ease-in hover:scale-105"
            >
              <FaWhatsapp className="text-lg" />
              WhatsApp
            </Button>

            {/* LinkedIn */}
            <Button
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-gradient-to-r from-[#004182] to-[#002D64] text-white text-sm hover:text-white transition-all ease-in   hover:scale-105"
            >
              <FaLinkedinIn className="text-lg" />
              LinkedIn
            </Button>

            {/* Telegram */}
            <Button
              variant="outline"
              onClick={() => handleShare("telegram")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow bg-gradient-to-r from-[#005f9e] to-[#003f66] text-white hover:text-white transition-all ease-in  text-sm hover:scale-105"
            >
              <FaTelegramPlane  className="text-xl" />
              Telegram
            </Button>
            <Button>
             <Link href="/">
            Go To Home
             </Link>
            </Button>
          
          </div>
        </CardContent>
      </div>
    </div>
  );
}
