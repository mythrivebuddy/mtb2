import React from "react";
import { Commitment } from "./TodaysActionsClient";

export default function PaginationIndicatorsDailyActions({
  commitments,
  setCurrentSlideIndex,
  currentSlideIndex,
}: {
  commitments: Commitment[];
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  currentSlideIndex: number;
}) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {commitments?.map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentSlideIndex(index)}
          aria-label={`Go to slide ${index + 1}`}
          className={`h-2 rounded-full transition-all ${
            index === currentSlideIndex
              ? "w-8 bg-[#1990e6]"
              : "w-2 bg-slate-300 hover:bg-slate-400"
          }`}
        />
      ))}
    </div>
  );
}
