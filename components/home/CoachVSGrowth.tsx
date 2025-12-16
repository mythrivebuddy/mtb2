import {
  EyeOff,
  Layers,
  User,
  TrendingUp,
  ArrowRight,
  Slash,
  Brain,
  PartyPopper,
  Handshake,
} from "lucide-react";
import Link from "next/link";

export default function CoachVsGrowth() {
  return (
    <section className="py-6">
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
          {/* SELF GROWTH */}
          <div className="rounded-2xl bg-white border-2 border-green-700 p-8">
            <h3 className="text-2xl font-bold">For Self-Growth Enthusiasts</h3>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              A dedicated space to track your journey, build habits, and connect
              with your inner wisdom.
            </p>

            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: Slash,
                  text: "Finding it hard to stay consistent with your goals.",
                },
                {
                  icon: Brain,
                  text: "Personal growth feels overwhelming or unstructured.",
                },
                {
                  icon: PartyPopper,
                  text: "Lacking a place to track and celebrate small wins.",
                },
                {
                  icon: Handshake,
                  text: "Wanting accountability without intense pressure.",
                },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-brand mt-0.5" />
                  <span className="text-lg">{item.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?user-type=enthusiast"
              className="group inline-flex items-center mt-8 gap-2 font-bold text-brand"
            >
              <span className="text-md sm:text-lg">
                Sign Up and start your personal development journey
              </span>
              <ArrowRight />
            </Link>
          </div>

          {/* COACHES */}
          <div className="rounded-2xl bg-white border-2 border-blue-600  p-8">
            <h3 className="text-2xl font-bold">For Coaches & Solopreneurs</h3>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              An all-in-one system to manage your business and personal growth,
              so you can focus on making an impact.
            </p>

            <ul className="mt-6 space-y-4">
              {[
                {
                  icon: EyeOff,
                  text: "Struggling with visibility and finding new clients.",
                },
                {
                  icon: Layers,
                  text: "Managing too many disconnected tools for your work.",
                },
                {
                  icon: User,
                  text: "Feeling isolated while working and growing alone.",
                },
                {
                  icon: TrendingUp,
                  text: "Lacking consistent momentum in your business.",
                },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <item.icon className="h-6 w-6 text-brand mt-0.5" />
                  <span className="text-lg">{item.text}</span>
                </li>
              ))}
            </ul>

            <Link
              className="group inline-flex items-center mt-8 gap-2 font-bold text-brand"
              href="/signup?user-type=coach-solopreneur"
            >
              <span className="text-md sm:text-lg">Sign Up With Curiousity, Grow without Hustle!</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
