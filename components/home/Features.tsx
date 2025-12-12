import {
  Archive,
  CalendarDays,
  Inbox,
  Megaphone,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  Clock,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: CalendarDays,
      title: "Daily Blooms",
      desc: "Plan your day with an integrated calendar and to-do list.",
    },
    {
      icon: Rocket,
      title: "1% Start",
      desc: "Build powerful habits with small, consistent actions.",
    },
    {
      icon: Archive,
      title: "1% Progress Vault",
      desc: "A private space to log your wins and reflect on progress.",
    },
    {
      icon: Sparkles,
      title: "Miracle Log",
      desc: "Start your day with gratitude and intention.",
    },
    {
      icon: Inbox,
      title: "Magic Box",
      desc: "Capture and organize your best ideas and insights",
    },
    {
      icon: Megaphone,
      title: "Spotlight",
      desc: "Share your expertise and get discovered by the community.",
    },
    {
      icon: Search,
      title: "BuddyLens",
      desc: "A smart directory to find and connect with peers.",
    },
    {
      icon: Trophy,
      title: "Challenges",
      desc: "Join community challenges for shared growth and accountability.",
    },
  ];

  return (
    <section className="py-4 bg-white dark:bg-slate-800/50 mt-4">
      <div className="">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl mt-4 sm:text-4xl font-bold dark:text-white">
            A Growth Ecosystem, Not Just Another Tool
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Discover a curated set of features designed to work together,
            supporting every facet of your journey.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* MAPPED CARDS */}
          {features.map((i) => (
            <div
              key={i.title}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <i.icon size={28} className="text-brand" />
              <h3 className="mt-4 text-xl font-bold dark:text-white">
                {i.title}
              </h3>
              <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">
                {i.desc}
              </p>
            </div>
          ))}

          {/* FINAL STATIC CARD — Scheduling (Coming Soon) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 opacity-60">
            <Clock size={28} className="text-slate-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Scheduling (Coming Soon)
            </h3>
            <p className="mt-1 text-lg text-slate-600 dark:text-slate-400">
              Seamlessly book and manage your appointments.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
