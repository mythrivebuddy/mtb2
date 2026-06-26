"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { User } from "@/types/types";

interface GettingStartedModalProps {
  modalType: "COACH" | "ENTHUSIAST"; // New prop to determine modal content
  cmpPlanId?: string | null;
}

export default function GettingStartedModal({
  modalType,
  cmpPlanId,
}: GettingStartedModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: markGettingStarted, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axios.patch("/api/user/getting-started-status");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<User>(["userInfo"], (oldUser) => {
        if (!oldUser) return oldUser;

        return {
          ...oldUser,
          gettingStartedStatus: data.gettingStartedStatus,
        };
      });
    },
  });
  const handleClose = () => {
    if (!isPending) {
      markGettingStarted();
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  // Determine dynamic content based on user type
  const content =
    modalType === "COACH"
      ? {
          title: "Setup Business Profile",
          desc: "A complete coaching business profile builds trust when users visit your profile. Set it up now.",
          cta: "Set Up Business Profile Now",
          link: "/dashboard/business-profile",
        }
      : {
          title: "Create Life Blueprint",
          desc: "Clarity is the 1st step towards growth. Build your life blueprint now.",
          cta: "Create Life Blueprint Now",
          link: `/dashboard/complete-makeover-program/onboarding?planId=${cmpPlanId}`,
        };

  return (
    <>
      {/* Invisible backdrop */}
      <div
        className="hidden lg:block fixed inset-0 z-40 bg-transparent"
        onClick={() => setIsOpen(false)}
      />

      {/* Positioning Container */}
      <div className="hidden lg:block fixed z-50 lg:left-[280px] lg:top-[12%] lg:w-[600px] animate-in fade-in zoom-in duration-300">
        {/* Modal Body */}
        <div className="relative bg-white dark:bg-[#1A1D21] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-8 sm:p-10 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => handleClose()}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 z-20"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* The Pointer (Tail) */}
          <div className="absolute top-9 -left-3 w-6 h-6 bg-white dark:bg-[#1A1D21] rotate-45 border-b border-l border-slate-200 dark:border-slate-800" />

          <div className="relative flex flex-col items-center justify-center space-y-4">
            {/* Left Star Decoration */}
            <div className="absolute left-0 top-0 text-yellow-600 dark:text-yellow-500 opacity-80 animate-pulse">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute -bottom-4 -right-4 opacity-60"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>

            {/* Right Star Decoration */}
            <div className="absolute right-0 top-0 text-yellow-600 dark:text-yellow-500 opacity-80 animate-pulse delay-150">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute -top-4 -left-4 opacity-60"
              >
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>

            {/* Main Content mimicking the Slack style */}
            <div className="text-center z-10 px-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {content.title}
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-base mt-4 mb-8 mx-auto max-w-sm">
                {content.desc}
              </p>

              {/* Action Button */}
              <Button
                onClick={() => {
                  markGettingStarted();
                  router.push(content.link);
                  setIsOpen(false);
                }}
                className={`${modalType == "ENTHUSIAST" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {content.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
