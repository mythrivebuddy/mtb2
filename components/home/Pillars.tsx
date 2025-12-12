import React from "react";
import { Wrench, Brain, TrendingUp, Users } from "lucide-react";

export default function Pillars() {
  const items = [
    {
      icon: Wrench,
      title: "Tools",
      desc: "Everything you need to plan, track, and manage your progress in one place.",
    },
    {
      icon: Brain,
      title: "Mindset",
      desc: "Daily logs, reflections, and light systems that make growth joyful and sustainable.",
    },
    {
      icon: TrendingUp,
      title: "Visibility & Business Growth",
      desc: "For coaches and solopreneurs: get discovered, get booked, and grow your impact.",
    },
    {
      icon: Users,
      title: "Community",
      desc: "Supportive experiences that ensure you don’t grow alone.",
    },
  ];

  return (
    <section className="py-16 sm:pt-24 sm:pb-16 bg-white dark:bg-slate-800/50">
      <div>
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The Four Pillars of Your Growth Home
          </h2>
        </div>

        {/* Pillars */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl p-6 text-center bg-white dark:bg-slate-900/20 shadow-sm h-full 
                         flex flex-col items-center"
            >
              {/* Icon */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 dark:bg-brand/20">
                <item.icon className="h-6 w-6 text-brand" />
              </div>

              {/* Title */}
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>

              {/* Description (3-line limit) */}
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {item.desc}
              </p>

              <div className="flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
