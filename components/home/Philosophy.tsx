
/* eslint-disable react/no-unescaped-entities */

import { MessageSquare, Lightbulb, Flower } from "lucide-react";

export default function Philosophy() {
  return (
    <section className="py-8 sm:py-16 bg-white dark:bg-slate-800/50">
      <div className="">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* LEFT ILLUSTRATION BOX */}
          <div className="relative h-96 py-12 lg:h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50"></div>

            {/* Center icon */}
            <MessageSquare
              className="text-brand/30 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              size={96}
            />

            {/* Bottom-right icon */}
            <Lightbulb
              className="absolute -bottom-4 -right-4 text-brand/20 dark:text-brand/30"
              size={72}
            />

            {/* Top-left icon */}
            <Flower
              className="absolute -top-5 left-5 text-brand/20 dark:text-brand/30 -rotate-12"
              size={84}
            />
          </div>

          {/* RIGHT TEXT BLOCK */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">
              Built So You Don’t Have to Grow Alone.
            </h2>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 leading-8">
             MyThriveBuddy was born from a simple belief: growth is better together. We saw countless coaches and creators juggling a dozen apps, feeling isolated and overwhelmed. We wanted to create a single, supportive home—a place where planning your progress feels as joyful as achieving it. It’s more than tools; it's an ecosystem designed to give you clarity, connection, and momentum on your unique journey.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
