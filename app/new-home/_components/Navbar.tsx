
/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import {
  ChevronDown,
  Calendar,
  Rocket,
  Archive, // For "Inventory/Vault"
  Phone,
  Sparkles, // For "Auto Awesome"
  Gift, // For "Magic Box"
  Megaphone, // For "Campaign"
  Search, // For "BuddyLens"
  Users, // For "Groups"
} from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0  z-50 w-full bg-transparent backdrop-blur-sm ">
      <div className="px-4 sm:px-24">
        <div className="flex h-24 items-center justify-between">
          {/* LOGO SECTION */}
          <div className="flex items-center gap-4">
            <div className="text-brand">
              <svg className="h-6 w-6 text-brand" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clip-rule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill-rule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-white">
              MyThriveBuddy
            </h2>
          </div>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-9 lg:flex">
            <div className="group relative">
              <Link
                className="flex items-center gap-1 text-md font-medium text-slate-700 hover:text-brand dark:text-slate-300 dark:hover:text-brand"
                href="#"
              >
                <span>Benefits</span>
                <span className="transition-transform duration-300 group-hover:rotate-180">
                  <ChevronDown size={18} />
                </span>
              </Link>

              {/* DROPDOWN MENU */}
              <div className="pointer-events-none absolute left-1/2 top-full w-max -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6">
                    {/* COLUMN 1 */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Grow Effortlessly
                      </h3>

                      {[
                        {
                          icon: Calendar,
                          title: "Daily Blooms",
                          desc: "Stay organized with tasks + calendar in one place.",
                        },
                        {
                          icon: Rocket,
                          title: "1% Start",
                          desc: "Build habits through tiny, doable daily actions.",
                        },
                        {
                          icon: Archive,
                          title: "1% Progress Vault",
                          desc: "See your progress add up and stay motivated.",
                        },
                      ].map((item) => (
                        <a
                          className="group/item flex items-start gap-3"
                          href="#"
                          key={item.title}
                        >
                          <div className="text-brand mt-0.5">
                            <item.icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover/item:text-brand text-slate-800 dark:text-slate-200">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      ))}

                      <a
                        className="group/item flex items-start gap-3 opacity-50"
                        href="#"
                      >
                        <div className="text-slate-400 mt-0.5">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold dark:text-slate-200">
                            Discovery Calls
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Manage calls & follow-ups effortlessly. (Coming Soon)
                          </p>
                        </div>
                      </a>
                    </div>

                    {/* COLUMN 2 */}
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-bold dark:text-white">
                        Strengthen Your Mindset
                      </h3>

                      {[
                        {
                          icon: Sparkles,
                          title: "Miracle Log",
                          desc: "Notice daily wins & strengthen your success mindset.",
                        },
                        {
                          icon: Gift,
                          title: "Magic Box",
                          desc: "Unlock surprise rewards & insights through giving.",
                        },
                      ].map((item) => (
                        <a
                          className="group/item flex items-start gap-3"
                          href="#"
                          key={item.title}
                        >
                          <div className="text-brand mt-0.5">
                            <item.icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover/item:text-brand dark:text-slate-200">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      ))}

                      <h3 className="text-sm font-bold dark:text-white pt-2">
                        Grow Your Visibility & Business
                      </h3>

                      {[
                        {
                          icon: Megaphone,
                          title: "Spotlight",
                          desc: "Get featured and boost your visibility inside MTB.",
                        },
                        {
                          icon: Search,
                          title: "BuddyLens",
                          desc: "Sharpen your online presence with peer feedback.",
                        },
                      ].map((item) => (
                        <a
                          className="group/item flex items-start gap-3"
                          href="#"
                          key={item.title}
                        >
                          <div className="text-brand mt-0.5">
                            <item.icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold group-hover/item:text-brand dark:text-slate-200">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      ))}

                      <h3 className="text-sm font-bold dark:text-white pt-2">
                        Feel Supported
                      </h3>
                      <a className="group/item flex items-start gap-3" href="#">
                        <div className="text-brand mt-0.5">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold dark:text-slate-200">
                            Prosperity Drops
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Apply for grants that uplift deserving solopreneurs.
                          </p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/new-home/pricing"
              className="text-sm font-medium hover:text-brand"
            >
              Pricing
            </Link>
            <a
              className="text-sm font-medium hover:text-brand"
              href="challenges/"
            >
              Challenges
            </a>
            <a
              className="text-sm font-medium hover:text-brand"
              href="discovery-calls.html"
            >
              Discovery Calls
            </a>
            <a
              className="text-sm font-medium hover:text-brand"
              href="webinars.html"
            >
              Live Webinars
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button className="h-10 px-4 rounded-lg font-bold hover:bg-blue-50 transition-colors ease-linear">
              Sign In
            </button>
            <button className="h-10 px-4 rounded-lg  text-white font-bold bg-blue-500">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}