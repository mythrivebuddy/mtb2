import { Users } from "lucide-react";
import BuddyItem from "./BuddyItem";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";

const AccountabilityBuddy = () => {
  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
      <StaticDataBadge className="w-fit relative -top-8 -left-8 " />
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1183d4]" />
          Accountability Buddy
        </h3>
        {/* <button className="text-xs font-semibold text-[#1183d4] hover:underline">
          Find Buddies
        </button> */}
      </div>
      <div className="flex flex-col gap-3">
        <BuddyItem
          name="Arjun K."
          active="2h ago"
          image="https://i.pravatar.cc/150?u=arjun"
        />
        <BuddyItem
          name="Priya S."
          active="10m ago"
          image="https://i.pravatar.cc/150?u=priya"
        />
      </div>
    </section>
  );
};

export default AccountabilityBuddy;
