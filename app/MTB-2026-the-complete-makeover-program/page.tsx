/* eslint-disable react/no-unescaped-entities */
export const dynamic = "force-dynamic";

import Image from "next/image";

import {
  CheckCircle,
  Target,
  ListChecks,
  TrendingUp,
  CalendarDays,
  Calendar,
  Users,
  Trophy,
  PartyPopper,
  Map,
  BatteryCharging,
  ArrowRight,
  ChartNoAxesCombined,
  UserRoundX,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import axios from "axios";
import JoinProgram from "./_components/JoinProgram";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserTypeSelection from "@/components/dashboard/user/UserTypeSelection";
import { AuthMethod } from "@prisma/client";
import { grantProgramAccessToPage } from "@/lib/utils/makeover-program/access/grantProgramAccess";
import { redirect } from "next/navigation";
export const metadata = {
  title: "2026 Complete Makeover Program",
  description:
    "Finally follow through on your resolutions and transform your life with a proven system for success.",
};

const renderIcon = (name: string, hexColorClass: string) => {
  const baseIconSize = "w-6 h-6";
  const largeFeatureIconSize = "w-10 h-10";
  const stepIconSize = "w-8 h-8";
  const xlIconSize = "w-12 h-12";

  switch (name) {
    case "map":
      return <Map className={`${hexColorClass} ${largeFeatureIconSize}`} />;
    case "group_off":
      return (
        <UserRoundX className={`${hexColorClass} ${largeFeatureIconSize}`} />
      );
    case "battery_alert":
      return (
        <BatteryCharging
          className={`${hexColorClass} ${largeFeatureIconSize}`}
        />
      );

    case "check_circle":
      return <CheckCircle className={`${baseIconSize} ${hexColorClass}`} />;

    case "insights":
      return <Target className={`${hexColorClass} ${stepIconSize} mt-1`} />;
    case "checklist":
      return <ListChecks className={`${hexColorClass} ${stepIconSize} mt-1`} />;
    case "timeline":
      return <TrendingUp className={`${hexColorClass} ${stepIconSize} mt-1`} />;

    case "today":
      return (
        <CalendarDays className={`${hexColorClass} ${stepIconSize} mb-4`} />
      );
    case "calendar_view_week":
      return <Calendar className={`${hexColorClass} ${stepIconSize} mb-4`} />;
    case "calendar_month":
      return <Calendar className={`${hexColorClass} ${stepIconSize} mb-4`} />;

    case "groups":
      return <Users className={`${hexColorClass} ${xlIconSize}`} />;
    case "emoji_events":
      return <Trophy className={`${hexColorClass} ${xlIconSize}`} />;
    case "celebration":
      return <PartyPopper className={`${hexColorClass} ${xlIconSize}`} />;

    case "arrow_forward":
      return <ArrowRight className={`${baseIconSize} ${hexColorClass} mt-1`} />;
    case "chart_no_axes":
      return (
        <ChartNoAxesCombined
          className={`${baseIconSize} ${hexColorClass} mt-1`}
        />
      );

    default:
      return null;
  }
};

const CompleteMakeoverPageContent = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  const res = await axios.get(`${process.env.NEXT_URL}/api/program`);
  const plan = res.data.plan;
  const program = res.data.program;
  const { isPurchased } = await grantProgramAccessToPage();
  console.log({isPurchased});
  
    if (
    isPurchased &&
    program.onboardingStartDate &&
    new Date(program?.onboardingStartDate).getTime() <= Date.now()
  ) {
    redirect("/dashboard/complete-makeover-program/makeover-dashboard");
  }


  return (
    <AppLayout>
      <div className="bg-[#FFFFFF] dark:bg-[#1F2937] font-body text-[#333333] dark:text-[#E5E7EB]">
        <main className="flex-grow">
          {/* HERO */}
          <section className="max-w-6xl mx-auto px-4 pt-10 pb-11 sm:pt-24 sm:pb-12  text-center">
            <div className="flex flex-col items-center gap-6">
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl max-w-3xl">
                2026 <span className="text-[#6B8E23]">Complete Makeover</span>{" "}
                Program
              </h1>

              <h2 className="text-[#6B7280] dark:text-[#9CA3AF] text-lg font-normal leading-normal max-w-2xl">
                Finally follow through on your resolutions and transform your
                life with a proven system for success.
              </h2>
              <JoinProgram
                url={`/dashboard/membership/checkout?plan=${plan.id}`}
              />
            </div>
          </section>

          {/* RESOLUTIONS PROBLEM */}
          <section className="max-w-6xl mx-auto px-4 py-0 bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] rounded-xl">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-4 text-center items-center">
                <h2 className="font-display text-3xl font-bold sm:text-4xl max-w-2xl">
                  New Year's Resolutions Don't Stick. It’s Not Your Fault.
                </h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base max-w-3xl">
                  Every year, millions set ambitious goals, only to see them
                  fade by February. The problem isn't desire, it's the lack of a
                  system.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-1 flex-col items-center gap-4 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] p-6 text-center">
                  {renderIcon("map", "text-[#CD853F]")}
                  <h3 className="font-display text-lg font-bold">
                    No Clear Path
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                    Without a step-by-step guide, it's easy to get lost and give
                    up.
                  </p>
                </div>

                <div className="flex flex-1 flex-col items-center gap-4 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] p-6 text-center">
                  {renderIcon("group_off", "text-[#CD853F]")}
                  <h3 className="font-display text-lg font-bold">
                    Lack of Accountability
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                    Going it alone makes it easy to slip into old habits.
                  </p>
                </div>

                <div className="flex flex-1 flex-col items-center gap-4 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] p-6 text-center">
                  {renderIcon("battery_alert", "text-[#CD853F]")}
                  <h3 className="font-display text-lg font-bold">
                    Motivation Burnout
                  </h3>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                    Excitement fades quickly without the right support systems.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PROGRAM INTRO */}
          <section className="max-w-4xl mx-auto px-4 py-16 sm:pt-20 sm:pb-4 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Introducing the Complete Makeover Program
            </h2>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mt-4">
              A comprehensive, 12-month system designed to help you achieve
              lasting change in all areas of life.
            </p>
          </section>

          {/* IMAGINE A YEAR */}
          <section className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] px-4 sm:pt-12  rounded-xl">
              <div className="w-full lg:w-1/2 flex justify-center">
                <Image
                  className="rounded-lg object-cover w-full h-80 lg:h-96"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuNgpDLEuucHZ8J4HB31gCK8OJ2daeOwptPOYHh32efD49r5ijKm5bz5nED5S11V5gcRcATt6be-F1tzdSExB6DJfrsrarunQxTVZObJMLuepnKA_lDCneZfv4ZASEDVNiYuvdJjSMkgbG13pUNZBzO4TYH2BtdZH8tVrPHKKXe2mXdLPxZa5trs2ZSfzwhkTrh3-9XIkiBTe012qROr_8I0-xdtka882XVyW3pFixpViG_fzXHqHYZhlWYsliNOlupu41Ht3m4HDO"
                  alt="Wellness pose"
                  width={500}
                  height={400}
                  priority
                />
              </div>

              <div className="w-full lg:w-1/2 flex flex-col gap-6 text-center lg:text-left">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Imagine a Year From Now...
                </h2>

                <ul className="space-y-4 text-left">
                  <li className="flex items-start gap-3">
                    {renderIcon("check_circle", "text-[#6B8E23] mt-1")}
                    <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                      You've achieved your biggest goals.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    {renderIcon("check_circle", "text-[#6B8E23] mt-1")}
                    <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                      You feel energized and in control.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    {renderIcon("check_circle", "text-[#6B8E23] mt-1")}
                    <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                      You’re part of a thriving community.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                How It Works
              </h2>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mt-4">
                Three simple, powerful steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] text-center">
                <div className="flex flex-col items-center justify-center size-24 rounded-full bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] font-display font-bold text-5xl mb-4">
                  <span>1</span>
                  {renderIcon("chart_no_axes", "text-[#6B8E23]")}
                </div>
                <h3 className="font-display text-xl font-bold">
                  Foundation & Goal Setting
                </h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Define a powerful vision and clear, meaningful goals.
                </p>
              </div>

              <div className="flex flex-col items-center p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] text-center">
                <div className="flex flex-col items-center justify-center size-24 rounded-full bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] font-display font-bold text-5xl mb-4">
                  <span>2</span>
                  {renderIcon("checklist", "text-[#6B8E23]")}
                </div>
                <h3 className="font-display text-xl font-bold">
                  Habit Integration
                </h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Build daily actions that compound into massive change.
                </p>
              </div>

              <div className="flex flex-col items-center p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563] bg-[#FFFFFF] dark:bg-[#1F2937] text-center">
                <div className="flex flex-col items-center justify-center size-24 rounded-full bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] font-display font-bold text-5xl mb-4">
                  <span>3</span>
                  {renderIcon("timeline", "text-[#6B8E23]")}
                </div>
                <h3 className="font-display text-xl font-bold">
                  Continuous Growth
                </h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Adapt, overcome obstacles, and stay aligned year-round.
                </p>
              </div>
            </div>
          </section>

          {/* RHYTHM */}
          <section className="max-w-6xl mx-auto px-4 py-2">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Your Daily, Weekly, Monthly Rhythm
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563]">
                {renderIcon("today", "text-[#CD853F]")}
                <h3 className="font-display text-xl font-bold">Daily</h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Quick, energizing check-ins and habit tracking.
                </p>
              </div>

              <div className="bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563]">
                {renderIcon("calendar_view_week", "text-[#CD853F]")}
                <h3 className="font-display text-xl font-bold">Weekly</h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Review, celebrate, and plan ahead with guided reflections.
                </p>
              </div>

              <div className="bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] p-8 rounded-lg border border-[#D1D5DB] dark:border-[#4B5563]">
                {renderIcon("calendar_month", "text-[#CD853F]")}
                <h3 className="font-display text-xl font-bold">Monthly</h3>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">
                  Workshops, long-term reviews, and fresh alignment.
                </p>
              </div>
            </div>
          </section>

          {/* COMMUNITY, GAMIFICATION, EVENTS */}
          <section className="max-w-4xl mx-auto px-4 py-16 sm:pt-20">
            <div className="grid grid-cols-1 gap-12">
              <div className="text-center flex flex-col items-center">
                {renderIcon("groups", "text-[#6B8E23]")}
                <h2 className="font-display text-3xl font-bold mt-4">
                  Accountability & Community
                </h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mt-3 max-w-2xl">
                  Private community + dedicated coaching to ensure
                  follow-through.
                </p>
              </div>

              <div className="text-center flex flex-col items-center">
                {renderIcon("emoji_events", "text-[#6B8E23]")}
                <h2 className="font-display text-3xl font-bold mt-4">
                  Gamification
                </h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mt-3 max-w-2xl">
                  Earn points, unlock badges, climb leaderboards, and stay
                  motivated.
                </p>
              </div>

              <div className="text-center flex flex-col items-center">
                {renderIcon("celebration", "text-[#6B8E23]")}
                <h2 className="font-display text-3xl font-bold mt-4">
                  Exclusive Events
                </h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mt-3 max-w-2xl">
                  Members-only workshops, Q&A sessions, and virtual retreats.
                </p>
              </div>
            </div>
          </section>

          {/* IS THIS FOR YOU */}
          <section className="max-w-6xl mx-auto px-4 rounded-2xl bg-slate-50">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 bg-[#F0F8E6] bg-opacity-30 dark:bg-[#1F2937] px-4 py-8 sm:py-8 rounded-xl">
              <div className="w-full lg:w-1/2 flex justify-center">
                <img
                  className="rounded-2xl object-cover w-full"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrE80yKyYbfvnr91RUDyPQ8nt_DHdIio8vWOqVGROpOG7PyvgIXaV-ftldeD1o4zhpkwqGr3LAxi064EkyT-R4kPx36G1n3TAF7IadzPhaSQ6hJ-EY06qYNonjwAm-HXFUKitpsY_Mi40nq-y3RF0so9NymPwlJOJxqB8AECFYR56Mf4K2IcsTTwqewaB41moEGMMCiKMUmkOjnMhG0urlZdi6w3O75TlyPfrIcqmgrTHYAiXc44sJudx96SMiJGBCrIojaruT9Axg"
                  alt="Community collaboration"
                />
              </div>

              <div className="w-full lg:w-1/2 flex flex-col gap-6 text-center lg:text-left">
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Is This Program For You?
                </h2>

                <p className="text-[#6B7280] dark:text-[#9CA3AF]">
                  This program is ideal for individuals who are:
                </p>

                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    {renderIcon("arrow_forward", "text-[#CD853F] mt-1")}
                    <p>Tired of the start-and-stop cycle.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    {renderIcon("arrow_forward", "text-[#CD853F] mt-1")}
                    <p>Ready for a structured system of growth.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    {renderIcon("arrow_forward", "text-[#CD853F] mt-1")}
                    <p>Wanting a supportive community.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    {renderIcon("arrow_forward", "text-[#CD853F] mt-1")}
                    <p>Willing to invest in themselves.</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="max-w-4xl mx-auto px-4 py-14 text-center">
            <div className="flex flex-col items-center gap-6">
              <h2 className="font-display text-4xl font-bold sm:text-5xl max-w-3xl">
                Your Transformation Starts Now
              </h2>

              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg max-w-2xl">
                Stop waiting for someday. The 2026 Complete Makeover Program is
                your roadmap to becoming your best self.
              </p>
              <JoinProgram
                url={`/dashboard/membership/checkout?plan=${plan.id}`}
              />
            </div>
          </section>
        </main>
        {user?.authMethod &&
          user.authMethod === AuthMethod.GOOGLE &&
          user.userType == null && (
            <UserTypeSelection authMethod={user.authMethod} />
          )}
      </div>
    </AppLayout>
  );
};

export default CompleteMakeoverPageContent;
