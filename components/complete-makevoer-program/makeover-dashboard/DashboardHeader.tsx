/* eslint-disable react/no-unescaped-entities */
import { Sparkles, Clock, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DashboardHeader = ({
  isProgramStarted,
  hasThreeActions,
}: {
  isProgramStarted: boolean;
  hasThreeActions: boolean;
}) => {
  const isDailyActionsSettingLocked = hasThreeActions && isProgramStarted;
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* LEFT: Week + Month */}
        <div className="flex flex-col flex-wrap items-start gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold whitespace-nowrap">
            Week 0 of 51 • Quarter 1
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border whitespace-nowrap">
            <Clock className="w-4 h-4" />
            <span>
              {(() => {
                const today = new Date();

                // Last day of current month
                const lastDayOfMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() + 1,
                  0
                );

                // Difference in days
                const daysLeft = Math.ceil(
                  (lastDayOfMonth.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return `${daysLeft} days left in this month`;
              })()}
            </span>
          </div>
        </div>

        {/* RIGHT: Buttons + Quote */}
        <div className="flex flex-col md:ml-auto items-end gap-2">
          <div className="flex flex-col sm:flex-row w-full gap-3 sm:justify-end">
            {!isDailyActionsSettingLocked && (
              <Link
                href="/dashboard/complete-makeover-program/daily-actions-task-for-quarter"
                className="w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto bg-[#1183d4] hover:bg-[#0c62a0] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Set this quarter’s actions
                </Button>
              </Link>
            )}

            {!isProgramStarted && (
              <Link
                href="/dashboard/complete-makeover-program/onboarding"
                className="w-full sm:w-auto"
              >
                <Button className="w-full sm:w-auto bg-[#059669] hover:bg-emerald-700 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Edit onboarding
                </Button>
              </Link>
            )}
          </div>

          <p className="hidden md:block text-sm italic text-slate-500 text-right">
            "Keep showing up. You're building the new you."
          </p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
