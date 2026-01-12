"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OnboardingStickyFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disabled?: boolean;
  maxWidth?: string; // optional override
  children?: React.ReactNode; // optional left-side content
   backDisabled?: boolean;
}

const OnboardingStickyFooter = ({
  onBack,
  onNext,
  nextLabel = "Next Step",
  backLabel = "Back",
  disabled = false,
  backDisabled = false,
  maxWidth = "1024px",
  children,
}: OnboardingStickyFooterProps) => {
  return (
    <div className="sticky bottom-0 rounded-xl left-0 right-0 border-t border-emerald-100 bg-white/90 backdrop-blur z-20">
      <div
        className="mx-auto flex w-full items-center justify-between px-4 py-6 "
        style={{ maxWidth }}
      >
        {/* Left side */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              disabled={backDisabled}
              className="px-4 flex items-center gap-2 py-3 text-sm font-semibold text-white
                          bg-[#059669]  hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-55 disabled:pointer-events-none"
            >
              <ArrowLeft size={18} />
              {backLabel}
            </button>
          )}
          {children}
        </div>

        {/* Right side */}
        {onNext && (
          <button
            onClick={onNext}
            disabled={disabled}
            className="flex items-center gap-2 rounded-lg
                       bg-[#059669] px-8 py-3 text-sm font-bold text-white
                       shadow-lg shadow-emerald-600/20
                       hover:bg-emerald-700 transition-all
                       disabled:opacity-50 disabled:pointer-events-none"
          >
            {nextLabel}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingStickyFooter;
