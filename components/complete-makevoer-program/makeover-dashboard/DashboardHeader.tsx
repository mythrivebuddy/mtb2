import { Sparkles, Clock, Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Week 12 of 51 • Quarter 1</h1>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border">
            <Clock className="w-4 h-4" />
            <span>18 days left in this quarter</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-3 mt-4 md:mt-0 md:ml-auto items-end sm:items-center sm:justify-end">
          <Link
            href="/dashboard/complete-makeover-program/daily-actions-task-for-quarter"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto bg-[#1183d4]  hover:bg-[#0c62a0] flex items-center justify-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Set this quarter’s actions
            </Button>
          </Link>

          <Link
            href="/dashboard/complete-makeover-program/onboarding"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto bg-[#059669] hover:bg-emerald-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4 mr-2" />
              Edit onboarding
            </Button>
          </Link>
        </div>
      </div>

      <p className="hidden md:block text-right text-sm italic text-slate-500">
        "Keep showing up. You're building the new you."
      </p>
    </header>
  );
};

export default DashboardHeader;
