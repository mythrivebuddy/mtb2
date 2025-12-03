import { ArrowRight } from "lucide-react";

export default function ThreePillars() {
  return (
    <section className="py-16 sm:py-24">
      <div className="px-4 sm:px-24">
        <div className="max-w-3xl mx-auto text-center mt-4">
          <h2 className="text-3xl sm:text-4xl font-bold dark:text-white">
            One Ecosystem. Built for Your Growth.
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Whether you're a coach, solopreneur, or a growth-minded creator —
            MyThriveBuddy unifies everything you need into one supportive,
            momentum-building ecosystem.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8 ">
          <div className="rounded-3xl border bg-white border-slate-200 px-8 py-10 dark:border-slate-700 text-center">
            <h3 className="text-xl font-semibold dark:text-slate-300">
              Tools That Move You Forward
            </h3>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Build habits, track progress, stay organised, and get things done
              with simple tools designed for daily momentum — not overwhelm.
            </p>
          </div>

          <div className="rounded-3xl border-2 bg-white border-brand p-8 text-center ring-4 ring-brand/20 dark:bg-slate-800">
            <h3 className="text-xl font-semibold text-brand">
              Mindset That Keeps You Growing
            </h3>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Strengthen your inner game with practices that help you stay
              positive, consistent, confident, and aligned with your purpose.
            </p>
          </div>

          <div className="rounded-3xl border bg-white border-slate-200 p-8 dark:border-slate-700 text-center">
            <h3 className="text-xl font-semibold dark:text-slate-300">
              Community & Visibility
            </h3>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Be seen, supported, and celebrated. Connect with peers, grow your
              visibility, and gain momentum through shared progress.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-lg">
          <a
            className="group font-bold text-brand inline-flex gap-2 items-center"
            href="#"
          >
            Explore the Full Ecosystem
            <span className="transition-transform group-hover:translate-x-1">
              <ArrowRight />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
