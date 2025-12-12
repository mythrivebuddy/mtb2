/* eslint-disable react/no-unescaped-entities */

import AppLayout from "@/components/layout/AppLayout";
import React from "react";
import { Award, Calendar, Hourglass, Info } from "lucide-react";
import Link from "next/link";

const WebinarsContent: React.FC = () => {
  return (
    <AppLayout>
      <main>
        {/* HERO + Coming Soon Placeholder */}
        <section className="py-12 bg-background-light rounded-2xl dark:bg-background-dark">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand dark:bg-brand/20">
              {/* Icon change: event -> Calendar */}
              <Calendar className="h-4 w-4" />
              Webinars
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Global Webinars — Coming Soon
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Soon, you'll be able to browse upcoming growth webinars from
              coaches, experts, and creators around the world — even if they're
              not yet on MyThriveBuddy.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              A unified hub for personal development, skills, and
              transformation.
            </p>
            <div className="mt-12 flex justify-center">
              <div className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 shadow-sm">
                {/* Icon change: hourglass_bottom -> Hourglass */}
                <Hourglass
                  className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600"
                  strokeWidth={1}
                />
                <p className="mt-6 text-base font-medium text-slate-700 dark:text-slate-300">
                  We're curating the world's top events for your growth.
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Stay tuned — launching soon on MTB.
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="mt-1 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Are You a Coach or Solopreneur?
          </h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Get featured at the top, receive more live webinars bookings, and
            grow your visibility inside MyThriveBuddy.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row  sm:justify-center gap-3">
            <Link
              href={`/signup?user-type=coach-solopreneur`}
              className="inline-flex items-center gap-2 rounded-lg h-11 bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              <Award className="h-4 w-4" />
              Join as a Coach
            </Link>

            <Link
              href="/join-live-webinars"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg h-11 border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              <Info className="h-4 w-4" />
              Learn about Live Webinars
            </Link>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default WebinarsContent;
