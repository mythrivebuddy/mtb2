"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
  shareUrl: string;
}

/* ---------------- SVG ICONS ---------------- */

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M12.04 2C6.53 2 2 6.48 2 12c0 1.97.57 3.89 1.64 5.55L2 22l4.62-1.59A10 10 0 0 0 12.04 22C17.52 22 22 17.52 22 12S17.52 2 12.04 2Zm5.8 14.4c-.24.68-1.37 1.3-1.9 1.36-.49.06-1.1.09-3.56-.76-3.15-1.09-5.18-3.8-5.33-3.98-.14-.19-1.26-1.68-1.26-3.2s.8-2.27 1.08-2.59c.28-.32.62-.4.82-.4h.59c.19 0 .45-.07.7.53.24.6.83 2.08.9 2.23.07.15.12.33.02.52-.1.19-.15.33-.3.51-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.19.3.83 1.37 1.78 2.22 1.23 1.1 2.27 1.44 2.58 1.6.31.16.49.14.67-.08.18-.22.77-.9.98-1.21.21-.3.42-.25.7-.15.28.1 1.78.84 2.08 1 .3.15.5.23.57.36.07.13.07.76-.17 1.44Z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M18.9 2H22l-7.19 8.21L23 22h-6.56l-5.13-6.71L5.5 22H2.4l7.7-8.8L1 2h6.7l4.63 6.05L18.9 2Zm-1.15 18h1.82L6.67 3.88H4.74L17.75 20Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.22 23.98h4.56V7.9H.22v16.08ZM8.98 7.9h4.37v2.2h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99v9.27h-4.56v-8.22c0-1.96-.04-4.48-2.73-4.48-2.74 0-3.16 2.14-3.16 4.34v8.36H8.98V7.9Z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

/* ---------------- COMPONENT ---------------- */

export default function ShareDialog({
  open,
  onOpenChange,
  shareText,
  shareUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const platforms = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: WhatsAppIcon,
      className: "hover:bg-green-500/10 text-green-500",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: TwitterIcon,
      className: "hover:bg-zinc-500/10 text-zinc-900",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: LinkedInIcon,
      className: "hover:bg-blue-600/10 text-blue-500",
    },
  ];

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#0f1224] border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-[#0d101b] dark:text-white">
            Share your achievement
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Inspire others by sharing your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition ${p.className}`}
              >
                <Icon />
                <span className="font-medium">{p.name}</span>
              </a>
            );
          })}

          {/* COPY BUTTON */}
          <button
            onClick={copyToClipboard}
            disabled={copied}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition
              ${
                copied
                  ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              }
            `}
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              <>
                <CopyIcon />
                Copy link
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Sharing spreads momentum 🚀
        </p>
      </DialogContent>
    </Dialog>
  );
}
