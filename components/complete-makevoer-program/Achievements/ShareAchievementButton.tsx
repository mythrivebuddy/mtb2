"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareDialog from "./ShareDialog";

interface Props {
  userId: string;
  shareText:string;
}

export default function ShareAchievementButton({ userId,shareText }: Props) {
  const [open, setOpen] = useState(false);

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/profile/${userId}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 bg-[#0f2cbd] hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
      >
       Share with your friends/network
      </button>

      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        shareText={shareText}
        shareUrl={shareUrl}
      />
    </>
  );
}
