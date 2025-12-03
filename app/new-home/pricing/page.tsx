"use client";

import Head from "next/head";
import React from "react";
import {
  CheckCircle,
  Sparkles,
  Users,
  Gem,
  Award,
  Sprout,
  Search,
  Phone,
  FileText,
  TrendingUp,
  Leaf
} from "lucide-react";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing - MyThriveBuddy</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className="bg-background-light dark:bg-slate-950 text-slate-800 dark:text-slate-200">

        {/* HERO */}
        <section className="py-20 sm:py-28 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                One Complete Growth Ecosystem.
              </h1>

              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                For Coaches, Solopreneurs & Self-Growth Enthusiasts. One ecosystem.
                Endless momentum.
              </p>

              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                Choose the membership that fits how you grow. Clear and simple pricing.
              </p>
            </div>
          </div>
        </section>

        {/* AUDIENCE SPLIT */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 gap-8 md:grid-cols-2">

            {/* Coaches / Solopreneurs */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-brand/10 rounded-lg text-brand">
                    {/* Assuming brand color is roughly blue/indigo based on context, applying generic text color class if brand not defined */}
                    <Award className="text-blue-600" size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  For Coaches & Solopreneurs
                </h2>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Grow visibility, attract clients, and build momentum without juggling tools.
              </p>

              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                    <Search className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <span>Get discovered via <strong>Spotlight</strong> & Find Your Coach</span>
                </li>
                <li className="flex items-start gap-3">
                    <Phone className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <span>Showcase & promote your <strong>Discovery Calls</strong></span>
                </li>
                <li className="flex items-start gap-3">
                    <FileText className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <span>Sharpen profiles with <strong>BuddyLens</strong> reviews</span>
                </li>
              </ul>
            </div>

            {/* Self-Growth */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
                    <Sprout size={28} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  For Self-Growth Enthusiasts
                </h2>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Build habits, track inner growth, and connect with coaches when ready.
              </p>

              <ul className="space-y-4 text-sm">
                 <li className="flex items-start gap-3">
                    <TrendingUp className="text-green-600 shrink-0 mt-0.5" size={18} />
                    <span>Log wins & progress in the <strong>Miracle Log</strong></span>
                </li>
                <li className="flex items-start gap-3">
                    <Leaf className="text-green-600 shrink-0 mt-0.5" size={18} />
                    <span>Build habits with <strong>1% Start</strong> & Progress Vault</span>
                </li>
                <li className="flex items-start gap-3">
                    <Sparkles className="text-green-600 shrink-0 mt-0.5" size={18} />
                    <span>Receive surprise rewards via <strong>Magic Box</strong></span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* PRICING CARDS */}
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4 max-w-7xl">

            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Simple, All-Inclusive Pricing
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Designed to support every stage of your growth journey.
              </p>
            </div>

            {/* 1. COACHES SECTION (Full Width Row) */}
            <div className="mb-20">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                 <Users className="text-blue-600" size={24} />
                 <h3 className="text-lg font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Coaches & Solopreneurs
                </h3>
              </div>

              {/* Grid Fix: 4 columns on large screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                {[
                  {
                    label: "Free",
                    price: "$0",
                    badge: null,
                    features: ["Access Daily Blooms", "1% Start & Progress Vault"],
                  },
                  {
                    label: "Monthly",
                    price: "$49",
                    period: "/mo",
                    badge: null,
                    features: ["Full business toolkit", "Discovery Call Promotion"],
                  },
                  {
                    label: "Yearly",
                    price: "$299",
                    period: "/yr",
                    badge: "BEST VALUE",
                    highlight: true,
                    features: ["Save 50% vs Monthly", "Priority visibility", "Pro BuddyLens reviews"],
                  },
                  {
                    label: "Lifetime",
                    price: "$2999",
                    period: "one-time",
                    badge: null,
                    features: ["Everything unlocked forever", "Top visibility ranking"],
                  },
                ].map((p, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-2xl p-6 shadow-sm text-center flex flex-col h-full bg-white dark:bg-slate-900 transition-all hover:shadow-md ${
                      p.highlight 
                        ? "border-2 border-blue-600 ring-4 ring-blue-600/10 z-10 transform sm:-translate-y-2" 
                        : "border border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {p.badge && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase">
                        {p.badge}
                      </div>
                    )}

                    <h4 className={`text-sm font-bold uppercase ${p.highlight ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>
                        {p.label}
                    </h4>
                    
                    <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">
                        {p.price}
                        {p.period && <span className="text-sm font-medium text-slate-500 ml-1">{p.period}</span>}
                    </p>

                    <div className="flex-grow mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                      <ul className="space-y-3 text-sm text-left">
                        {p.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                            <span className="text-slate-600 dark:text-slate-300">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button className={`mt-8 w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                        p.highlight 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}>
                      {p.label === "Free" ? "Get Started" : `Start ${p.label}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SELF GROWTH SECTION (Centered Row) */}
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                <Gem className="text-green-600" size={24} />
                <h3 className="text-lg font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Self-Growth Enthusiasts
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md flex flex-col md:flex-row items-center md:items-start gap-8">
                
                {/* Price Left */}
                <div className="text-center md:text-left md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
                  <h4 className="text-sm font-bold text-green-600 uppercase mb-2">Annual Membership</h4>
                  <p className="text-5xl font-black text-slate-900 dark:text-white">
                    $9.99<span className="text-lg font-medium text-slate-500">/yr</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-500">or ₹500/year (India)</p>
                  
                  <button className="mt-6 w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all">
                    Start Annual Membership
                  </button>
                </div>

                {/* Features Right */}
                <div className="flex-grow md:pl-2">
                   <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                    {[
                      "Full access to Miracle Log & Magic Box",
                      "Join challenges & build habits",
                      "Track 1% Progress daily",
                      "Book coaches whenever you're ready",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">
                Frequently Asked Questions
            </h2>

            <div className="space-y-8 text-sm">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    What’s the difference between the two memberships?
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                  Coaches get visibility and business tools. Self-growth users get mindset,
                  habit-building, and accountability tools at an accessible price.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Can I switch later?
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    Yes — upgrade anytime from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}