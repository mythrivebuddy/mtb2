"use client";

import Head from "next/head";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Leaf,
  Loader2,
  Flag,
  Info,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import axios from "axios";
import NavLink from "@/components/navbars/navbar/NavLink";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// --- Types (Based on the previous context) ---
interface Plan {
  id: string;
  name: string;
  amountINR: number;
  amountUSD: number;
  interval: "MONTHLY" | "YEARLY" | "LIFETIME" | "FREE";
  userType: "SOLOPRENEUR" | "ENTHUSIAST" | "COACH";
  isActive: boolean;
  description: string | null;
  gstEnabled: boolean;
  gstPercentage: number;
  createdAt: string;
  updatedAt: string;
  // Custom property for UI
  features: string[];
  highlight?: boolean;
}

// Helper to format currency (from previous context)
const formatCurrency = (amount: number, currency: "INR" | "USD") => {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

// --- Mock Data Fetching (Replace with actual API call to /api/subscription-plans) ---
const fetchPlans = async (): Promise<Plan[]> => {
  const res = await axios.get("/api/subscription-plans");
  return res.data;
};

// type ActiveTab = "ENTHUSIAST" | "SOLOPRENEUR" | "COACH";

export default function PricingPage() {
  const session = useSession();

  type ActiveTab = "ENTHUSIAST" | "SOLOPRENEUR";

  const [activeTab, setActiveTab] = useState<ActiveTab>("ENTHUSIAST");

  useEffect(() => {
    const userType = session?.data?.user?.userType;

    if (!userType) return;

    if (userType === "COACH" || userType === "SOLOPRENEUR") {
      setActiveTab("SOLOPRENEUR");
    } else {
      setActiveTab("ENTHUSIAST");
    }
  }, [session?.data?.user?.userType]);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["all-plans"],
    queryFn: fetchPlans,
  });

  // const filteredPlans =
  //   plans?.filter((plan) => plan.userType === activeTab) || [];

  const enthusiastPlan = plans?.find((plan) => plan.userType === "ENTHUSIAST");
  const solopreneurPlans = plans
    ?.filter(
      (plan) => plan.userType === "SOLOPRENEUR" || plan.userType === "COACH"
    )
    .sort((a, b) => a.amountUSD - b.amountUSD);

  const getPriceDisplay = (plan: Plan) => {
    const price = formatCurrency(plan.amountUSD, "USD");

    const period =
      plan.interval === "MONTHLY"
        ? "/month"
        : plan.interval === "YEARLY"
          ? "/year"
          : plan.interval === "LIFETIME"
            ? "one-time"
            : plan.interval === "FREE"
              ? "free"
              : "";

    // Calculate total INR with GST for INR display
    const finalPriceINR = plan.amountINR;

    const priceINR = formatCurrency(finalPriceINR, "INR");

    return { price, period, priceINR };
  };

  // --- Render Functions ---

  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-10">
      <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
      <span className="text-lg text-slate-500">Loading plans...</span>
    </div>
  );

  const renderCoachPlans = () => (
    <div className="mb-20">
      <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
        <Users className="text-blue-600" size={24} />
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Coaches & Solopreneurs
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {solopreneurPlans?.map((p) => {
          const { price, period } = getPriceDisplay(p);
          const badgeText = p.interval === "YEARLY" ? "BEST VALUE" : null;

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-6 shadow-sm text-center flex flex-col h-full bg-white dark:bg-slate-900 transition-all hover:shadow-md ${
                p.amountUSD === 299
                  ? "border-2 border-blue-600 ring-4 ring-blue-600/10 z-10 transform sm:-translate-y-2"
                  : "border border-slate-200 dark:border-slate-800"
              }`}
            >
              {badgeText && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase">
                  {badgeText}
                </div>
              )}

              <h4
                className={`text-sm font-bold uppercase ${p.highlight ? "text-blue-600" : "text-slate-500 dark:text-slate-400"}`}
              >
                {p.name.replace(" Pro", "").replace("Tier", "")}
              </h4>

              <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                {price}

                {p.interval === "LIFETIME" ? (
                  <span className="block text-sm font-medium text-slate-500 mt-1">
                    {period}
                  </span>
                ) : (
                  p.amountUSD > 0 && (
                    <span className="text-sm font-medium text-slate-500 ml-1">
                      {period}
                    </span>
                  )
                )}
                {/* INR DISPLAY  */}
                <span className="block text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">
                  {getPriceDisplay(p).priceINR} + GST (India)
                </span>
              </p>

              <div className="flex-grow mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <ul className="space-y-3 text-sm text-left">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        className="text-blue-600 shrink-0 mt-0.5"
                        size={16}
                      />
                      <span className="text-slate-600 dark:text-slate-300">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {session.data?.user?.userType === "COACH" ||
              session.data?.user?.userType === "SOLOPRENEUR" ? (
                // Eligible CTA
                <NavLink href="/dashboard/subscription">
                  <button className="mt-8 w-full py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors">
                    Get Started for FREE Now
                  </button>
                </NavLink>
              ) : (
                // Not Eligible CTA
                <button
                  onClick={() =>
                    toast.warning(
                      "You are not eligible for this plan because you are a self growth enthusiast"
                    )
                  }
                  className="mt-8 w-full py-3 rounded-xl text-sm font-bold bg-gray-300 text-gray-600 "
                >
                  Not eligible for this plan
                </button>
              )}

              {/* <NavLink href="/dashboard/subscription">
                <button
                  className={`mt-8 w-full py-3 rounded-xl text-sm font-bold transition-colors ${"bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"}`}
                >
                  Get Started for FREE Now
                </button>
              </NavLink> */}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEnthusiastPlan = () => {
    if (!enthusiastPlan) return null;
    const p = enthusiastPlan;
    const { price, period, priceINR } = getPriceDisplay(p);

    return (
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
            <h4 className="text-sm font-bold text-green-600 uppercase mb-2">
              {p.name}
            </h4>
            <p className="text-5xl font-black text-slate-900 dark:text-white">
              {price}
              <span className="text-lg font-medium text-slate-500">
                {period}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              or {priceINR}/year + GST (India)
            </p>
            {session.data?.user?.userType !== "ENTHUSIAST" ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    toast.warning(
                      `You are a ${session.data?.user?.userType}. Please purchase the COACH/SOLOPRENEUR subscriptions.`
                    );
                  }}
                  className="mt-6 w-full py-3 rounded-xl bg-gray-300 text-gray-700 text-sm font-bold cursor-not-allowed"
                >
                  Not Eligible
                </button>
                <p className="text-sm text-red-600 flex gap-2">
                  <Info size={32} /> You are not eligible for this plan because
                  you are a {session.data?.user?.userType?.toLocaleLowerCase()}.
                </p>
              </div>
            ) : (
              <NavLink href={`/dashboard/membership/checkout?plan=${p.id}`}>
                <button className="mt-6 w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20">
                  Start Annual Membership
                </button>
              </NavLink>
            )}

            {/* <NavLink href={`/dashboard/membership/checkout?plan=${p.id}`}>
              <button className="mt-6 w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all">
                Start Annual Membership
              </button>
            </NavLink> */}
          </div>

          {/* Features Right */}
          <div className="flex-grow md:pl-2">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle
                    className="text-green-600 shrink-0 mt-0.5"
                    size={18}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Pricing - MyThriveBuddy</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <AppLayout>
        <main className=" dark:bg-slate-950 bg-background-light text-slate-800 dark:text-slate-200">
          {/* HERO */}
          <section className="py-12 sm:py-20 bg-white dark:bg-slate-900  dark:border-slate-800">
            <div className="mx-auto">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                  One Complete Growth Ecosystem.
                </h1>

                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                  For Coaches, Solopreneurs & Self-Growth Enthusiasts. One
                  ecosystem. Endless momentum.
                </p>

                <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Choose the membership that fits how you grow. Clear and simple
                  pricing.
                </p>
              </div>
            </div>
          </section>

          {/* AUDIENCE SPLIT (Static Content) */}
          <section className="py-12 sm:py-16">
            <div className="container mx-auto px-4 max-w-6xl grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Coaches / Solopreneurs */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-brand/10 rounded-lg text-brand">
                    <Award className="text-blue-600" size={28} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    For Coaches & Solopreneurs
                  </h2>
                </div>
                <p className="text-md text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  The full ecosystem to grow your visibility, clients, and
                  business momentum—without juggling a dozen tools.
                </p>
                <ul className="space-y-4 text-md ">
                  <li className="flex items-start gap-3">
                    <Search
                      className="text-blue-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Get discovered via{" "}
                      <span className="font-bold">Spotlight</span> &{" "}
                      <span className="font-bold">Find Your Coach</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone
                      className="text-blue-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Showcase & promote your{" "}
                      <span className="font-bold">Discovery Calls</span> inside
                      MTB
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText
                      className="text-blue-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Sharpen profiles with{" "}
                      <span className="font-bold">BuddyLens</span> reviews
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sprout
                      className="text-blue-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Stay consistent with{" "}
                      <span className="font-bold">
                        Daily Blooms, 1% Start, and 1% Progress Vault
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles
                      className="text-blue-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Be eligible for{" "}
                      <span className="font-bold">Prosperity Drops</span>{" "}
                      (future grants for solopreneurs)
                    </span>
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
                <p className="text-md text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  A gentle but powerful space to build habits, track inner
                  growth, and connect with coaches when you’re ready.
                </p>
                <ul className="space-y-4 text-md">
                  <li className="flex items-start gap-3">
                    <TrendingUp
                      className="text-green-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Log wins & progress in the{" "}
                      <span className="font-bold">Miracle Log</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Leaf
                      className="text-green-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Build small, sustainable habits with{" "}
                      <span className="font-bold">1% Start</span> &{" "}
                      <span className="font-bold">1% Progress Vault</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles
                      className="text-green-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Receive surprise nudges & rewards through the{" "}
                      <span className="font-bold">Magic Box</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Flag
                      className="text-green-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Join light, supportive{" "}
                      <span className="font-bold">Challenges</span> for
                      accountability
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Search
                      className="text-green-600 shrink-0 mt-0.5"
                      size={18}
                    />
                    <span>
                      Explore and book coaches directly in{" "}
                      <span className="font-bold">Find Your Coach</span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* PRICING CARDS (Dynamic & Tabbed) */}
          <section className="py-8 sm:py-16 bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="mx-auto max-w-3xl text-center mb-0 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  Simple, All-Inclusive Pricing
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  Designed to support every stage of your growth journey.
                </p>
              </div>

              {/* --- TAB SWITCHER --- */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex rounded-2xl  bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                  {/* Enthusiast Tab */}
                  <button
                    onClick={() => setActiveTab("ENTHUSIAST")}
                    className={`
        px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
        ${
          activeTab === "ENTHUSIAST"
            ? "bg-green-600 text-white shadow-md shadow-green-600/20 scale-[1.03]"
            : "text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20"
        }
      `}
                  >
                    Self-Growth Enthusiast
                  </button>

                  {/* Coach + Solopreneur Tab */}
                  <button
                    onClick={() => setActiveTab("SOLOPRENEUR")}
                    className={`
        px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
        ${
          activeTab === "SOLOPRENEUR"
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.03]"
            : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        }
      `}
                  >
                    Coaches & Solopreneurs
                  </button>
                </div>
              </div>

              {/* --- RENDER PLANS BASED ON ACTIVE TAB --- */}
              {isLoading ? (
                renderLoadingState()
              ) : (
                <>
                  {activeTab === "SOLOPRENEUR" &&
                    solopreneurPlans &&
                    renderCoachPlans()}
                  {activeTab === "ENTHUSIAST" &&
                    enthusiastPlan &&
                    renderEnthusiastPlan()}
                </>
              )}
            </div>
          </section>

          {/* FAQ */}
          <section className="py-4 sm:py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>

              <div className="space-y-8 text-sm">
                <div className=" dark:bg-slate-900  rounded-2xl">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    What’s the difference between the two memberships?
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    Coaches/Solopreneurs get business-building features like
                    Spotlight, Find Your Coach visibility, Discovery Call
                    promotion, and BuddyLens. Self-Growth Enthusiasts get full
                    access to habit, mindset, and reflection tools at a very
                    accessible price.
                  </p>
                </div>

                <div className=" dark:bg-slate-900 rounded-2xl">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Can I switch later?
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    Yes. You can upgrade to a coach/solopreneur membership when
                    you’re ready to start offering services or want business
                    visibility.
                  </p>
                </div>
                <div className=" dark:bg-slate-900  rounded-2xl">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Are there any hidden fees?
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    No. Pricing is transparent. If we ever introduce add-ons,
                    they’ll be clearly marked and optional.
                  </p>
                </div>
                <div className=" dark:bg-slate-900  rounded-2xl">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Do you offer refunds?
                  </h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                    Refund policies will be outlined at checkout, but you’ll
                    always have clarity before you pay.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </AppLayout>
    </>
  );
}
