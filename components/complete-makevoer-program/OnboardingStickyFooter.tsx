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
  onSave?: () => void;
  onJoin?: () => void;

  isSaving?: boolean;
  isJoining?: boolean;

  isPurchased?: boolean;
  step?: number;
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
  onSave,
  onJoin,

  isSaving,
  isJoining,

  isPurchased,
  step,
}: OnboardingStickyFooterProps) => {
  return (
    <div className="  bottom-0 rounded-xl left-0 right-0 border-t border-emerald-100 bg-white/90 backdrop-blur ">
      <div
        className="mx-auto flex flex-col sm:flex-row w-full gap-3 sm:items-center sm:justify-between px-4 py-4 sm:py-6"
        style={{ maxWidth }}
      >
        {/* Left side */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onBack && (
            <button
              onClick={onBack}
              disabled={backDisabled}
              className="w-full sm:w-auto px-4 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white
           bg-[#059669] hover:bg-emerald-700 rounded-lg transition-colors
           active:scale-[0.98]
           disabled:opacity-55"
            >
              <ArrowLeft size={18} />
              {backLabel}
            </button>
          )}
          {children}
        </div>

        {/* Right side */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* ✅ STEP 5 SPECIAL */}
          {step === 5 ? (
            <>
              {/* Save button (only if NOT purchased) */}
              {!isPurchased && (
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-3 text-sm font-bold text-white
           bg-[#059669] rounded-lg hover:bg-emerald-700 transition-all
           active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Your Life Blueprint"}
                </button>
              )}

              {/* Main button */}
              <button
                onClick={isPurchased ? onSave : onJoin}
                disabled={isPurchased ? isSaving : isJoining}
                className="w-full sm:w-auto flex items-center justify-center gap-2
           px-4 sm:px-8 py-3 text-sm font-bold text-white
           bg-[#059669] rounded-lg shadow-lg
           hover:bg-emerald-700 transition-all
           active:scale-[0.98]
           disabled:opacity-50"
              >
                {isPurchased
                  ? isSaving
                    ? "Saving..."
                    : "Save Your Life Blueprint"
                  : isJoining
                    ? "Joining..."
                    : "Join Now"}

                <ArrowRight size={18} />
              </button>
            </>
          ) : (
            /* ✅ DEFAULT (OTHER STEPS UNCHANGED) */
            onNext && (
              <button
                onClick={onNext}
                disabled={disabled}
                className="flex items-center max-sm:justify-center gap-2 rounded-lg
                   bg-[#059669] px-8 py-3 text-sm max-sm:text-center font-bold text-white  disabled:opacity-50 disabled:pointer-events-none"
              >
                {nextLabel}
                <ArrowRight size={18} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingStickyFooter;
