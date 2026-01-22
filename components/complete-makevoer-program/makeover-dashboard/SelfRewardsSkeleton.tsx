"use client";

const SelfRewardsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 animate-pulse"
        >
          {/* Left: gift + text */}
          <div className="flex items-center gap-3">
            {/* Gift icon placeholder */}
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-2">
              {/* Title */}
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              {/* Points */}
              <div className="h-2 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          {/* Right-side action */}
          <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </>
  );
};

export default SelfRewardsSkeleton;
