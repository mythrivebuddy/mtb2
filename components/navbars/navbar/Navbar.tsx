"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import NavLink from "./NavLink";
import { Button } from "../../ui/button";
import { Archive, Calendar, ChevronDown, Gift, Megaphone, Phone, Rocket, Search, Sparkles, Users } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-50 bg-white  ">
      <div className="flex items-center justify-between relative py-1.5">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2 relative">
          <Image
            src="/icon-logo-mtb.png"
            alt="MyThriveBuddy"
            width={50}
            height={50}
            className="object-contain"
          />
          <span className="font-semibold md:text-[22px]  text-black">
            MyThriveBuddy.com
          </span>
          <span className="md:text-[10px] absolute right-0 -top-3 text-[7px] font-medium px-1.5 sm:px-2 py-0.5 bg-black text-white rounded">
            BETA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-4 lg:space-x-8">
          {/* {session && <NavLink href="/dashboard">Dashboard</NavLink>} */}
           <div className="group relative">
              <Link
                className="flex items-center gap-1 text-md font-medium text-slate-700 hover:text-brand dark:text-slate-300 dark:hover:text-brand"
                href="#"
              >
                <span className="text-sm font-medium">Benefits</span>
                <span className="transition-transform duration-300 group-hover:rotate-180">
                  <ChevronDown size={18} />
                </span>
              </Link>

              {/* DROPDOWN MENU */}
              <div className="pointer-events-none absolute z-50 left-1/2 top-full w-max -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
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
                          link:"/daily-blooms-productivity-tool"
                        },
                        {
                          icon: Rocket,
                          title: "1% Start",
                          desc: "Build habits through tiny, doable daily actions.",
                          link:"/1-percent-start"
                        },
                        {
                          icon: Archive,
                          title: "1% Progress Vault",
                          desc: "See your progress add up and stay motivated.",
                          link:"/1-percent-progress-vault"
                        },
                      ].map((item) => (
                        <Link
                          className="group/item flex items-start gap-3"
                          href={item.link}
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
                        </Link>
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
                          link:"/miracle-log-manifestation-journal"
                        },
                        {
                          icon: Gift,
                          title: "Magic Box",
                          desc: "Unlock surprise rewards & insights through giving.",
                          link:"/magic-box"
                        },
                      ].map((item) => (
                        <Link
                          className="group/item flex items-start gap-3"
                          href={item.link}
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
                        </Link>
                      ))}

                      <h3 className="text-sm font-bold dark:text-white pt-2">
                        Grow Your Visibility & Business
                      </h3>

                      {[
                        {
                          icon: Megaphone,
                          title: "Spotlight",
                          desc: "Get featured and boost your visibility inside MTB.",
                          link:"/spotlight"
                        },
                        {
                          icon: Search,
                          title: "BuddyLens",
                          desc: "Sharpen your online presence with peer feedback.",
                          link:"/profile-audit-buddy-lens"
                        },
                      ].map((item) => (
                        <Link
                          className="group/item flex items-start gap-3"
                          href={item.link}
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
                        </Link>
                      ))}

                      <h3 className="text-sm font-bold dark:text-white pt-2">
                        Feel Supported
                      </h3>
                      <Link className="group/item flex items-start gap-3" href="/prosperity-drops">
                        <div className="text-brand mt-0.5">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold dark:text-slate-200 hover:text-brand">
                            Prosperity Drops
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Apply for grants that uplift deserving solopreneurs.
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
             {/* adding new navigattion for challange  */}
              <NavLink
              href="/pricing"
              className="text-sm hover:text-brand font-medium"
            >
              Pricing
            </NavLink>
          <NavLink href="/dashboard/challenge" className="hover:text-brand text-sm font-medium">Challenges</NavLink>
           {/* <NavLink href="/survey">Survey</NavLink> */}
           <NavLink href="/discovery-calls" className="hover:text-brand text-sm font-medium" >Discovery Calls</NavLink>
           <NavLink href="/live-webinars" className="hover:text-brand text-sm font-medium" >Live Webinars</NavLink>
          {/* <NavLink href="/blog">Blog</NavLink> */}
          {/* <NavLink href="/contact">Contact Us</NavLink> */}
          {/* <NavLink href="/about-us">About Us</NavLink> */}
          
          <div className="flex items-center space-x-3">
            {session ? (
              <NavLink href="/dashboard" className="hover:text-brand text-sm font-medium">Dashboard</NavLink>              
              // <Button
              //   onClick={() => signOut()}
              //   className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#0A0B1C] text-white rounded-full text-[14px] sm:text-[15px] font-medium hover:bg-[#0A0B1C]/90 transition-colors"
              // >
              //   Sign Out
              // </Button>
            ) : (
              <>
              <NavLink href="/signin">
                  <Button className="w-full text-center px-6 py-2.5 bg-[#0A0B1C] text-white rounded-full text-[15px] font-medium hover:bg-[#0A0B1C]/90 transition-colors">
                    Sign In
                  </Button>
                </NavLink>
                <NavLink href="/signup">
                  <Button className="w-full text-center px-6 py-2.5 bg-[#1E2875] text-white rounded-full text-[15px] font-medium hover:bg-[#1E2875]/90 transition-colors">
                    Sign Up
                  </Button>
                </NavLink>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
         aria-label="menu"
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        > 
          <svg
            className="w-6 h-6"
            fill="true"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white mt-0 p-4 rounded-lg shadow-lg lg:hidden z-50">
          <div className="flex flex-col space-y-4">
            {session && <NavLink href="/dashboard">Dashboard</NavLink>}
            <NavLink href="/pricing">Pricing</NavLink>
             <NavLink href="/dashboard/challenge">Challenges</NavLink>
             {/* // Todo will add links on discovey calls and live webinars */}
             <NavLink href="/discovery-calls">Discovery Calls</NavLink>
             <NavLink href="/live-webinars" >Live Webinars</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            {/* <NavLink href="/contact">Contact Us</NavLink> */}
            {/* <NavLink href="/about-us">About Us</NavLink> */}
            {session ? (
              <Button
                onClick={() => signOut()}
                className="w-full text-center px-6 py-2.5 bg-red-600 text-white rounded-full text-[15px] font-medium hover:bg-red-700 transition-colors"
              >
                Sign Out
              </Button>
            ) : (
              <>
                <NavLink href="/signup">
                  <Button className="w-full text-center px-6 py-2.5 bg-[#1E2875] text-white rounded-full text-[15px] font-medium hover:bg-[#1E2875]/90 transition-colors">
                    Sign Up
                  </Button>
                </NavLink>
                <NavLink href="/signin">
                  <Button className="w-full text-center px-6 py-2.5 bg-[#0A0B1C] text-white rounded-full text-[15px] font-medium hover:bg-[#0A0B1C]/90 transition-colors">
                    Sign In
                  </Button>
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
