/* eslint-disable react/no-unescaped-entities */

import AppLayout from '@/components/layout/AppLayout';
import React from 'react';
import {
  Calendar,
  Hourglass,
} from 'lucide-react';

const WebinarsContent: React.FC = () => {
  return (
    <AppLayout>
      <main>
        {/* HERO + Coming Soon Placeholder */}
        <section className="py-24 bg-background-light dark:bg-background-dark">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand dark:bg-brand/20"
            >
              {/* Icon change: event -> Calendar */}
              <Calendar className="h-4 w-4" />
              Webinars
            </span>
            <h1
              className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Global Webinars — Coming Soon
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Soon, you'll be able to browse upcoming growth webinars from coaches,
              experts, and creators around the world — even if they're not yet on
              MyThriveBuddy.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              A unified hub for personal development, skills, and transformation.
            </p>
            <div className="mt-12 flex justify-center">
              <div
                className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 shadow-sm"
              >
                {/* Icon change: hourglass_bottom -> Hourglass */}
                <Hourglass 
                  className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-600"
                  strokeWidth={1}
                />
                <p
                  className="mt-6 text-base font-medium text-slate-700 dark:text-slate-300"
                >
                  We're curating the world's top events for your growth.
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Stay tuned — launching soon on MTB.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
};

export default WebinarsContent;