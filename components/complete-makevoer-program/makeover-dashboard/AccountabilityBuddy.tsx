import { Users } from "lucide-react";
import BuddyItem from "./BuddyItem";
import StaticDataBadge from "@/components/complete-makevoer-program/makeover-dashboard/StaticDataBadge";

interface AccountabilityPodProps {
  isProgramStarted: boolean;
}

const AccountabilityPod = ({ isProgramStarted }: AccountabilityPodProps) => {
  return (
    <section className="bg-white dark:bg-[#1a2630] rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative">
      <StaticDataBadge
        label="Your buddies"
        className="w-fit absolute -top-1.5 -left-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1183d4]" />
          Accountability Pod
        </h3>

        {isProgramStarted && (
          <button className="text-xs font-semibold text-[#1183d4] hover:underline">
            Find Buddies
          </button>
        )}
      </div>

      {/* Content */}
      {!isProgramStarted ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-500">
          <div className="size-12 rounded-full bg-slate-100  flex items-center justify-center">
            <Users className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-md font-medium italic text-center max-w-xs">
            Your accountability buddies will be assigned once the program
            starts.
          </p>
        </div>
      ) : (
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
      )}
    </section>
  );
};

export default AccountabilityPod;
