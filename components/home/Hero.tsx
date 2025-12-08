"use client";

import { motion } from "framer-motion";
import SpotlightCard from "./SpotlightCard";
import useRedirectDashboard from "@/hooks/use-redirect-dashboard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Hero() {
  useRedirectDashboard();
  const session = useSession();
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 max-w-2xl mx-auto md:px-4 sm:px-6"
    >
      <div className="space-y-2">
        <h1 className="md:text-[56px] text-[36px] lg:text-[75px] font-bold text-[#1E2875] leading-tight">
          One Complete Growth Ecosystem
        </h1>
        {/* <h1 className="md:text-[56px] text-[36px] font-bold text-[#7B90FF] leading-tight">
          Made Amazing
        </h1> */}
      </div>
      <div className="lg:hidden flex flex-col ">
        <SpotlightCard />
      </div>

      {/* <p className="md:text-[18px] text-[14px] text-[#636363] leading-relaxed max-w-xl">
        Solopreneurship doesn&apos;t have to be lonely. Join the ecosystem built
        to make your journey joyful, connected and wildly fulfilling.
      </p> */}
      <p className="text-[14px] md:text-[18px] lg:text-xl text-slate-600 dark:text-slate-400">
        For Coaches, Solopreneurs & Self-Growth Enthusiasts. The ecosystem that
        grows you and your business. <br />
        <br />
        One ecosystem. Endless momentum.
      </p>
      <div className="flex flex-col pt-5 sm:flex-row gap-4 lg:justify-start">
        <button
          onClick={() => {
            if (session.status === "authenticated") {
              router.push("/dashboard");
            } else {
              router.push("/signup?user-type=coach-solopreneur");
            }
          }}
          className="h-12 px-5 sm:text-[12px] lg:text-sm bg-brand hover:bg-brand/90 text-white rounded-xl font-bold py-1"
        >
          I am a Coach/Solopreneur
        </button>

        <button
          onClick={() => {
            if (session.status === "authenticated") {
              router.push("/dashboard");
            } else {
              router.push("/signup?user-type=enthusiast");
            }
          }}
          className="h-12 px-5 text-sm sm:text-[12px] lg:text-sm bg-slate-200 dark:bg-slate-700 rounded-lg font-bold py-1 hover:bg-brand/10"
        >
          I am a Self Growth Enthusiast
        </button>
      </div>
      <div className="pt-2">
        <p className="text-sm text-slate-500 ">
          Start with curiosity. Grow without hustle.
        </p>
      </div>

      {/* <div className="pt-2 sm:pt-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <CategoryTag>Trainer</CategoryTag>
          <CategoryTag>Coach</CategoryTag>
          <CategoryTag>Healer</CategoryTag>
          <CategoryTag>Consultant</CategoryTag>
          <CategoryTag>Designer</CategoryTag>
          <CategoryTag>Developer</CategoryTag>
          <CategoryTag>Astrologer</CategoryTag>
        </div>
      </div>

      <CardGrid /> */}
    </motion.div>
  );
}

// function CategoryTag({ children }: { children: React.ReactNode }) {
//   return (
//     <motion.button
//       whileHover={{ scale: 1.02 }}
//       whileTap={{ scale: 0.98 }}
//       className="px-2 py-1.5 sm:px-4 sm:py-2.5 min-w-[80px] rounded-[20px] bg-white text-[#1E2875] text-[12px] sm:text-[15px] font-medium shadow-md transition-all cursor-default"
//     >
//       {children}
//     </motion.button>
//   );
// }
