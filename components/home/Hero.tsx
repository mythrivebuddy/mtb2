"use client";

import { motion } from "framer-motion";
import SignInForm from "../auth/SignInForm";

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="space-y-2">
        <h1 className="md:text-[56px] text-[36px] font-bold text-[#1E2875] leading-tight">
          Solopreneurship
        </h1>
        <h1 className="md:text-[56px] text-[36px] font-bold text-[#7B90FF] leading-tight">
          Made Amazing
        </h1>
      </div>

      <p className="md:text-[18px] text-[14px] text-[#636363] leading-relaxed max-w-xl">
        Join the world&apos;s only platform / ecosystem that aims to provide
        growth, joy, sense of belonging.
      </p>

      <div className="pt-4">
        <div className="flex flex-wrap gap-3 mb-3 justify-center sm:justify-start">
          <CategoryTag>Trainer</CategoryTag>
          <CategoryTag>Coach</CategoryTag>
          <CategoryTag>Healer</CategoryTag>
          <CategoryTag>Consultant</CategoryTag>
        </div>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <CategoryTag>Designer</CategoryTag>
          <CategoryTag>Developer</CategoryTag>
          <CategoryTag>Astrologer</CategoryTag>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mt-8 shadow-sm">
        <SignInForm />
      </div>
    </motion.div>
  );
}

function CategoryTag({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      className="px-6 py-2.5 rounded-full bg-white text-[#1E2875] md:text-[15px] text-[20px] font-medium shadow-sm hover:shadow-md transition-all"
    >
      {children}
    </motion.button>
  );
}
