/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

import React from "react";

import {
  ArrowRight,
  PlayCircle,
  User,
  TrendingDown,
  Users,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  RefreshCw,
} from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import Header from "@/components/new-home/Header";
import { cormorant, instrument } from "@/lib/new-home/fonts/fonts";
import {
  MtbBarChartIcon,
  MtbBookOpenIcon,
  MtbCalendarIcon,
  MtbCapIcon,
  MtbCheckIcon,
  MtbCompassIcon,
  MtbFlameIcon,
  MtbGrowthIcon,
  MtbMessageIcon,
  MtbSparklesIcon,
  MtbTargetIcon,
  MtbThreeUsersIcon,
} from "@/icons/mtb-icons";
import Footer from "@/components/new-home/Footer";

// --- Components ---

const Hero = () => (
  <section
    className={`max-w-[1440px]  mx-auto px-4 sm:px-6 md:px-12 pt-12 pb-24 overflow-hidden`}
  >
    {/* from here  */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
      {/* Left Content */}
      <div className="space-y-8 ">
        <div className="inline-flex items-center gap-2 px-2 py-2.5 rounded-full border border-[#B87042] text-black text-xs  sm:tracking-widest uppercase shadow-[0px_0px_4px_rgba(255,255,255,1)]">
          {/* Sparkels icon */}
          <MtbSparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span
            className={`${cormorant.className} font-semibold text-[10px] sm:text-[16px] whitespace-nowrap`}
          >
            Your Personal & Professional Growth Environment
          </span>
        </div>

        <h1
          className={
            theme.typography.h1 + " text-[31px] md:text-[48px]  lg:text-[58px] "
          }
        >
          <span>Growth is easier when your</span>
          <br className="hidden sm:block" />
          {"  "}
          <span className={`${cormorant.className} italic text-[#B87042] `}>
            environment
          </span>{" "}
          supports it.
        </h1>

        <p className="text-[16px] sm:text-[24px] text-[#2C251F] leading-[1.4] ">
          MTB is a growth environment that helps people struggling with{" "}
          <span className="text-[#B87042]">
            focus, routines, burnout, and inconsistency
          </span>{" "}
          grow through guided structure, programs, daily actions,
          accountability, and community support.
        </p>

        <div className="flex flex-col sm:flex-row w-full text-[16px] items-center sm:items-stretch gap-4 pt-2">
          <button
            className={
              theme.buttonDark +
              ` flex items-center justify-center gap-2 w-full sm:w-auto lg:w-full px-6 lg:px-8 py-4 rounded-full font-medium transition-colors whitespace-nowrap`
            }
          >
            Start Your Journey <ArrowRight className="w-5 h-5" />
          </button>

          <button className="flex items-center justify-center gap-2 w-full sm:w-auto lg:w-full px-6 lg:px-8 py-4 rounded-full font-medium bg-white text-[#2C251F] hover:bg-stone-50 transition-colors shadow-sm hover:shadow-lg whitespace-nowrap">
            <PlayCircle className="w-5 h-5" /> Explore Inside MTB
          </button>
        </div>

        <div className="flex items-center gap-4 sm:pt-6">
          <div className="flex -space-x-3">
            {[
              "bg-blue-200",
              "bg-indigo-200",
              "bg-stone-300",
              "bg-rose-200",
            ].map((bg, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full border-2 border-[#FCF9F3] ${bg} overflow-hidden`}
              >
                <img
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-[#2C251F]">
              Trusted by 500+ members
            </div>
            <div className="text-[#5A5048]">
              building healthier routines everyday
            </div>
          </div>
        </div>
      </div>

      {/* Right Visual Image & Floating Cards */}
      <div className="relative w-full max-w-[550px] h-[450px] sm:h-[550px] lg:h-[600px]">
        {/* Placeholder for the aesthetic desk image */}
        <img
          src="/new-home-assets/Hero-image.png"
          alt="Aesthetic desk setup with books and coffee"
          className="absolute top-0 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 w-[85%] sm:w-[80%] h-[80%] sm:h-[90%] object-cover rounded-3xl"
        />

        {/* Floating Weekly Momentum Card */}
        <div className="absolute -top-8 right-0 sm:-top-4 sm:-right-4 lg:-top-8 lg:-right-8 bg-white p-3 rounded-2xl shadow-xl border border-stone-100 w-[220px] sm:w-[250px] h-[141px] flex flex-col justify-between z-10">
          {/* Top */}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[10px] text-[#2C251F]">
              Weekly momentum
            </span>
            <span className="text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
              This week v
            </span>
          </div>

          {/* Date */}
          <div className="text-[9px] text-stone-500">Feb 12 - Feb 19</div>

          {/* Chart */}
          <div className="flex items-end justify-between flex-1 px-1">
            {[40, 50, 55, 65, 70, 85, 95].map((h, i) => (
              <div
                key={i}
                className="w-2 bg-[#FFA97A] rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* Days */}
          <div className="flex justify-between text-[9px] text-stone-400 px-1">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Bottom */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm font-semibold text-[#2C251F] leading-none">
                83%
              </div>
              <div className="text-[9px] text-stone-500 leading-none">
                Consistency
              </div>
            </div>

            <div className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
              +19%
            </div>
          </div>
        </div>

        {/* Floating Streak Card */}
        <div className="absolute bottom-0 left-0 sm:bottom-6 sm:left-4 lg:left-8 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 w-[220px] sm:w-[242px] h-[156px] flex flex-col justify-between select-none z-10">
          {/* Header */}
          <div className="text-[13px] font-semibold text-[#2C251F] tracking-wide">
            Current streak
          </div>

          {/* Streak Count Content */}
          <div className="flex items-center gap-4 pl-3">
            {/* Flame Icon */}
            <div className="flex items-center justify-center">
              <Flame className="w-10 h-10 text-[#E77C53]" fill="#E77C53" />
            </div>

            {/* Counter Numbers */}
            <div className="flex flex-col justify-center leading-none">
              <div className="text-[38px] font-medium text-[#2C251F] tracking-tight h-[36px] flex items-center">
                28
              </div>
              <div className="text-[11px] text-[#2C251F] font-medium mt-1">
                days going
              </div>
            </div>
          </div>

          {/* Days Tracker */}
          <div className="flex justify-between items-center px-0.5">
            {["M", "T", "W", "T", "F", "F", "S", "S"].map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-stone-500">
                  {day}
                </span>
                {i < 7 ? (
                  // Active Completed Days
                  <div className="w-[15px] h-[15px] rounded-full bg-[#E77C53] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                  </div>
                ) : (
                  // Incomplete Day (Last Circle)
                  <div className="w-[15px] h-[15px] rounded-full border border-stone-400 bg-white"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Feature Bar */}
    <div className="mt-[42px] bg-white border-2 border-[#B87042] rounded-2xl p-3 sm:p-6 md:p-8 flex justify-between gap-2 sm:gap-4 lg:gap-8">
      {[
        {
          title: "Structure routines",
          desc: "Build daily habits that fit your life.",
          icon: <MtbCalendarIcon />,
        },
        {
          title: "Guided accountability",
          desc: "Stay on track with check-ins, coaches & reminders.",
          icon: <User />,
        },
        {
          title: "Track real progress",
          desc: "See your growth with simple insights & analytics.",
          icon: <MtbBarChartIcon />,
        },
        {
          title: "Supportive community",
          desc: "Grow with people who inspire and support you.",
          icon: <MtbThreeUsersIcon className="" />,
        },
      ].map((feature, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col lg:flex-row items-center lg:items-start gap-1.5 sm:gap-3 lg:gap-4 text-center lg:text-left"
        >
          <div
            className={`p-2 sm:p-3 bg-[#FCF9F3] rounded-full shrink-0 ${theme.highLightTextColor}`}
          >
            {React.cloneElement(feature.icon, {
              className: "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7",
            })}
          </div>
          <div className="w-full flex flex-col items-center justify-center lg:block mt-1 sm:mt-2 lg:mt-0">
            <h4 className="font-semibold text-[#2C251F] text-[9px] min-[375px]:text-[10px] sm:text-[12px] lg:text-sm leading-tight mb-1">
              {feature.title}
            </h4>
            <p className="text-[11px] lg:text-xs hidden sm:block text-[#5A5048] leading-relaxed">
              {feature.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle?: string;
  isSingleLine?: boolean;
};
const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  isSingleLine = false,
  subtitle,
}: SectionHeadingProps) => (
  <div className="text-center mb-16 max-w-6xl mx-auto">
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className={"h-px " + theme.highLightBgColor + "  w-[750px]"}></div>
      <span
        className={
          theme.highLightTextColor + " text-[24px] uppercase whitespace-nowrap"
        }
      >
        {eyebrow}
      </span>
      <div className={theme.highLightBgColor + " h-px w-[750px]"}></div>
    </div>
    <div
      className={`max-w-5xl  text-center flex flex-col items-center mx-auto`}
    >
      <h2
        className={`${instrument.className} text-5xl ${cormorant.className} text-center leading-tight font-medium   mb-6`}
      >
        {title}
        {isSingleLine ? null : <br />}{" "}
        <span
          className={`${cormorant.className} italic ${theme.highLightTextColor}`}
        >
          {highlight}
        </span>
      </h2>
      <div className="max-w-lg">
        {subtitle && <p className="text-base">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const ProblemSection = () => (
  <section
    className={`py-24 px-6 md:px-12 max-w-[1440px] mx-auto ${theme.bgSecondary}`}
  >
    <SectionHeading
      eyebrow="The Real Problem"
      title="Knowing what to do isn't the problem."
      highlight="Doing it consistently is."
      subtitle="People start strong, lose momentum quietly, and eventually begin again from zero. MTB helps break that cycle with structure, accountability, and support."
    />

    <div className="grid md:grid-cols-4 gap-6 mb-12">
      {[
        {
          title: "Starting and stopping",
          desc: "You start strong, but lose momentum and end up starting over again.",
          icon: <RefreshCw />,
        },
        {
          title: "Consuming, not implementing",
          desc: "You read, watch, and learn but struggle to take action consistently.",
          icon: <MtbBookOpenIcon />,
        },
        {
          title: "Doing it alone",
          desc: "Without support or accountability, it's easy to get off track.",
          icon: <User />,
        },
        {
          title: "Losing momentum quietly",
          desc: "Progress fades slowly — until one day you realize you're back at zero.",
          icon: <TrendingDown />,
        },
      ].map((card, i) => (
        <div
          key={i}
          className={`bg-white border ${theme.hightLightBorderColor} rounded-[2rem] py-8 px-16 text-center flex flex-col items-center`}
        >
          <div
            className={`w-16 h-16 rounded-full bg-[#FCFAF4] border-2 border-[#E6D9CA] flex items-center justify-center ${theme.highLightTextColor} mb-6`}
          >
            {React.cloneElement(card.icon, { className: "w-8 h-8 stroke-2" })}
          </div>
          <h3
            className={`${cormorant.className}  font-bold text-2xl text-black mb-4 h-14 flex items-center justify-center `}
          >
            {card.title}
          </h3>
          <div className="w-8 h-px bg-[#2C251F] mb-5"></div>
          <p className="text-sm text-black ">{card.desc}</p>
        </div>
      ))}
    </div>

    <div
      className={`bg-white text-[16px] border ${theme.hightLightBorderColor} rounded-2xl px-24 py-6 flex flex-col md:flex-row items-center justify-between gap-6`}
    >
      <div className="flex items-center gap-7 pl-4">
        <div className="w-12 h-12 bg-[#FCF9F3] rounded-full flex items-center justify-center text-[#B87042]">
          <img src="/new-home-assets/Leaf.svg" width={72} height={72} />
        </div>
        <div className="flex flex-col justify-center gap-2 leading-none">
          <p className="font-medium text-base  text-black">
            You're not lazy. You're not bad with goals.
          </p>
          <p
            className={`${cormorant.className} text-[24px] font-semibold ${theme.highLightTextColor}`}
          >
            You just need the right environment.
          </p>
        </div>
      </div>
      <div
        className={theme.highLightBgColor + " hidden md:block w-px h-16 "}
      ></div>
      <p className="text-base  text-[#5A5048] pr-4 max-w-sm leading-relaxed">
        MTB gives you the structure, accountability, and support to help you
        stay consistent and keep growing forward.
      </p>
    </div>
  </section>
);

const FeatureSection = () => (
  <section className={" py-24 px-12 max-w-[1440px] mx-auto"}>
    <SectionHeading
      eyebrow="What MTB Actually Does"
      title="Everything you need to"
      highlight="stay consistent."
      isSingleLine={true}
      subtitle="MTB combines structure, accountability, coaching, and community to help you build better habits and make lasting progress."
    />

    <div className="grid md:grid-cols-6 gap-6 mt-2 mb-[72px]">
      {/* Row 1 */}
      <div className="md:col-span-3 bg-white border border-[#B87042] rounded-[2rem] p-8 flex items-start gap-6">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042]"
          }
        >
          <MtbCheckIcon className="w-8 h-8 stroke-1" />
        </div>
        <div>
          <div className="text-[#B87042] text-sm font-semibold mb-1">01</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Stay accountable
          </h3>
          <p className="text-sm  leading-relaxed">
            Stay consistent with simple check-ins, reminders, and supportive
            accountability.
          </p>
        </div>
      </div>
      <div className="md:col-span-3 bg-white border border-[#B87042] rounded-[2rem] p-8 flex items-start gap-6">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042]"
          }
        >
          <MtbFlameIcon className="w-8 h-8 stroke-1" />
        </div>
        <div>
          <div className="text-[#B87042] text-sm font-semibold mb-1">02</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Build consistency
          </h3>
          <p className="text-sm  leading-relaxed">
            Create small routines that are easy to follow and strong enough to
            last.
          </p>
        </div>
      </div>

      {/* Row 2 */}
      <div className="md:col-span-2 bg-white border border-[#B87042] flex  p-8  gap-6 rounded-[2rem]">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042] mb-6"
          }
        >
          <MtbBarChartIcon className="w-6 h-6 stroke-1" />
        </div>
        <div className="flex flex-col gap-1">
          <div
            className={theme.highLightTextColor + " text-sm font-semibold mb-1"}
          >
            03
          </div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            See Your Progress
          </h3>
          <p className="text-sm leading-relaxed">
            Track your growth, routines, and momentum with clear progress
            insights.
          </p>
        </div>
      </div>
      <div className="md:col-span-2 bg-white border border-[#B87042] flex gap-6 rounded-[2rem] p-8">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042] mb-6"
          }
        >
          <MtbThreeUsersIcon className="w-8 h-8 stroke-1" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[#B87042] text-sm font-semibold mb-1">04</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Grow With Support
          </h3>
          <p className="text-sm  leading-relaxed">
            Join a supportive community of people focused on growth and
            self-improvement.
          </p>
        </div>
      </div>
      <div className="md:col-span-2 bg-white border flex gap-6 border-[#B87042] rounded-[2rem] p-8">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042] mb-6"
          }
        >
          <MtbCapIcon className="w-8 h-8 stroke-1" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-[#B87042] text-sm font-semibold mb-1">05</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Learn with structure
          </h3>
          <p className="text-sm  leading-relaxed">
            Learn through guided steps designed to turn knowledge into real
            progress.
          </p>
        </div>
      </div>

      {/* Row 3 */}
      <div className="md:col-span-3 bg-white border border-[#B87042] rounded-[2rem] p-8 flex items-start gap-6">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042]"
          }
        >
          <MtbMessageIcon className="w-8 h-8 stroke-1" />
        </div>
        <div>
          <div className="text-[#B87042] text-sm font-semibold mb-1">06</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Work with coaches
          </h3>
          <p className="text-sm  leading-relaxed">
            Work with experienced coaches who help you grow with clarity and
            confidence.
          </p>
        </div>
      </div>
      <div className="md:col-span-3 bg-white border border-[#B87042] rounded-[2rem] p-8 flex items-start gap-6">
        <div
          className={
            theme.bgTertiary +
            " w-14 h-14 shrink-0 rounded-full border border-[#E6D9CA] flex items-center justify-center text-[#B87042]"
          }
        >
          <MtbCompassIcon className="w-8 h-8 stroke-1" />
        </div>
        <div>
          <div className="text-[#B87042] text-sm font-semibold mb-1">07</div>
          <h3 className={cormorant.className + " text-2xl font-semibold mb-3"}>
            Create Lasting Momentum
          </h3>
          <p className="text-sm leading-relaxed">
            Build systems and routines that help you keep going even during
            difficult weeks.
          </p>
        </div>
      </div>
    </div>

    <div className="bg-white border border-[#B87042] rounded-2xl p-6 flex items-center justify-start pl-20 gap-3">
      <div className={theme.bgTertiary + " rounded-full p-2"}>
        <MtbSparklesIcon className="h-6 w-6" />
      </div>
      <p className=" text-lg text-[#B87042]">
        All in one Place. All designed to help you stay consistent and grow
        forward.
      </p>
    </div>
  </section>
);

const ProcessSection = () => (
  <section className="py-24 px-12 max-w-[1440px] mx-auto text-center">
    {/* HEADER */}
    <div className="mb-20 max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-7">
        <div className={"h-px " + theme.highLightBgColor + " w-[750px]"}></div>

        <h3 className="text-2xl uppercase tracking-widest whitespace-nowrap text-[#B87042]">
          The Process
        </h3>

        <div className={"h-px " + theme.highLightBgColor + " w-[750px]"}></div>
      </div>

      <h2
        className={
          instrument.className +
          " text-3xl md:text-[2.75rem] font-serif leading-tight text-[#2C251F]"
        }
      >
        A{" "}
        <span className={cormorant.className + " italic text-[#B87042]"}>
          simple path designed
        </span>{" "}
        to help you
        <br />
        keep going.
      </h2>

      <p className="text-sm mt-8 leading-relaxed text-[#5A5048]">
        MTB helps you turn goals into routines, routines into momentum, and
        momentum into long-term growth.
      </p>
    </div>

    {/* STEPS */}
    <div className="relative mb-20 mx-auto pt-6">
      {/* HORIZONTAL LINE */}
      <div className="absolute top-[92px] left-[10%] right-[10%] h-[1px] bg-[#D6C5B3] hidden md:block z-0"></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
        {[
          {
            step: "01",
            title: "Choose Your Focus",
            desc: "Set meaningful goals and habits that fit your life.",
            // Target icon svg
            icon: <MtbTargetIcon className="w-6 h-6 stroke-1" />,
          },
          {
            step: "02",
            title: "Build Your Routine",
            desc: "Create simple systems and check-ins that support consistency.",
            // icon: <Calender className="w-6 h-6" />
            icon: <MtbCalendarIcon className="w-6 h-6 stroke-1" />,
          },
          {
            step: "03",
            title: "Stay Supported",
            desc: "Receive accountability, coaching, and community encouragement.",
            // Three users icon
            icon: <MtbThreeUsersIcon className="w-6 h-6 stroke-1" />,
          },
          {
            step: "04",
            title: "Track Momentum",
            desc: "See your progress clearly and keep moving forward confidently.",
            // Bar chart new icon
            icon: <MtbBarChartIcon className="w-6 h-6 stroke-1" />,
          },
          {
            step: "05",
            title: "Grow Sustainably",
            desc: "Turn small daily actions into long-term personal growth.",
            // Leaf on hands icon
            icon: <MtbGrowthIcon className="w-6 h-6 stroke-1" />,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center relative h-full"
          >
            {/* STEP */}
            <div className="text-[#B87042] rounded-full text-sm font-semibold bg-[#FCF9F3] p-3 mt-8 z-10">
              {item.step}
            </div>

            {/* VERTICAL LINE */}
            <div className={theme.highLightBgColor + " w-px h-12"}></div>

            {/* ICON */}
            <div className="w-14 h-14 rounded-full bg-[#FCF9F3] border border-[#E6D9CA] flex items-center justify-center text-[#B87042] mb-6 z-10">
              {React.cloneElement(item.icon, {
                className: "w-6 h-6 stroke-1",
              })}
            </div>

            {/* TEXT WRAPPER (FIX) */}
            <div className="flex flex-col items-center justify-start h-[140px]">
              <h3
                className={
                  cormorant.className + " whitespace-nowrap text-2xl mb-2"
                }
              >
                {item.title}
              </h3>

              <p className="text-sm max-w-[180px]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* BOTTOM CARD */}
    <div className="bg-white border border-[#B87042] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6  mx-auto">
      <div className="flex items-center gap-4 pl-4">
        <div className="w-12 h-12 bg-[#FCF9F3] rounded-full flex items-center justify-center text-[#B87042]">
          <MtbSparklesIcon className="w-5 h-5" />
        </div>

        <p className="font-bold text-[#2C251F]">
          One System. Five steps. Endless growth.
        </p>
      </div>

      <div className="hidden md:block w-px h-12 bg-[#E6D9CA]"></div>

      <div className="flex items-center gap-4 pr-4">
        <div className="w-12 h-12 bg-[#FCF9F3] rounded-full flex items-center justify-center text-[#B87042]">
          <Leaf className="w-5 h-5" />
        </div>

        <div className="text-left">
          <p className="font-serif text-lg text-[#B87042] italic">
            You don't need perfection.
          </p>
          <p className="font-serif text-lg text-[#B87042] italic">
            You just need a growth environment
          </p>
        </div>
      </div>
    </div>
  </section>
);

const SuccessStoriesSection = () => (
  <section className="py-24 px-12 max-w-[1440px] mx-auto">
    <SectionHeading
      eyebrow="Stories From Inside"
      title="Real people."
      highlight="Real momentum."
      subtitle="Growth looks different for everyone — but consistency changes everything."
    />

    <div className="flex items-center justify-center gap-6 mb-12">
      <button className="w-12 h-12 shrink-0 rounded-full border border-[#D6C5B3] bg-white  items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors hidden md:flex">
        <ChevronLeft className="w-6 h-6 stroke-1" />
      </button>

      <div className="grid md:grid-cols-2 gap-6 ">
        {[
          {
            name: "Aman Verma",
            role: "Software Engineer",
            quote:
              "MTB helped me stop restarting my routines every few weeks. For the first time, consistency feels calm instead of exhausting.",
          },
          {
            name: "Riya Sharma",
            role: "Student",
            quote:
              "The accountability and structure made a bigger difference than motivation ever did. I finally feel like I'm moving forward.",
          },
        ].map((testimonial, i) => (
          <div
            key={i}
            className="bg-white border border-[#B87042] rounded-3xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
          >
            <div className="w-32 h-40 shrink-0 bg-stone-200 rounded-xl overflow-hidden">
              <img
                src={`https://i.pravatar.cc/300?img=${i + 11}`}
                alt={testimonial.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-between h-full py-2">
              <p className="font-serif text-lg text-[#2C251F] leading-snug mb-6">
                "{testimonial.quote}"
              </p>
              <div>
                <h5 className="font-semibold text-sm text-[#2C251F]">
                  {testimonial.name}
                </h5>
                <p className="text-xs text-[#5A5048]">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="w-12 h-12 shrink-0 rounded-full border border-[#D6C5B3] bg-white  items-center justify-center text-[#B87042] hover:bg-stone-50 transition-colors hidden md:flex">
        <ChevronRight className="w-6 h-6 stroke-1" />
      </button>
    </div>

    <div className="bg-white border border-[#B87042] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-[1200px] mx-auto px-8">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-[#FCF9F3] rounded-full flex items-center justify-center text-[#B87042]">
          <MtbSparklesIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-serif text-xl text-[#2C251F]">
            Different paths. Same destination.
          </p>
          <p className="font-serif text-xl text-[#B87042] italic">
            Let's grow, together.
          </p>
        </div>
      </div>
      <button
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${theme.buttonDark}`}
      >
        Start Your Journey <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </section>
);

const WhoItHelpsSection = () => (
  <section className="py-24 px-12 max-w-[1440px] mx-auto text-center">
    {/* HEADER (SAME AS PROCESS SECTION) */}
    <div className="mb-20 max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-7">
        <div className={"h-px " + theme.highLightBgColor + " w-[750px]"}></div>

        <h3 className="text-2xl uppercase tracking-widest whitespace-nowrap text-[#B87042]">
          Who It Helps
        </h3>

        <div className={"h-px " + theme.highLightBgColor + " w-[750px]"}></div>
      </div>
      <div className="flex flex-col items-center">
        <h2
          className={
            instrument.className +
            " text-5xl md:text-5xl leading-tight tracking-[0.02em] mb-6"
          }
        >
          If this feels <span className="italic text-[#B87042]">familiar,</span>
          <br />
          MTB was built for you.
        </h2>

        <p className="text-base mt-1 tracking-wide max-w-lg text-center ">
          Different journeys. Same goal: becoming the best version of yourself.
          We're here to help you get there.
        </p>
      </div>
    </div>

    {/* GRID */}
    <div className="grid md:grid-cols-3 gap-6 items-stretch">
      {[
        {
          title: "Self-growth seekers",
          desc: "Build healthy routines and turn good intentions into consistent action.",
        },
        {
          title: "Founders",
          desc: "Stay focused, balanced, and consistent while building something demanding.",
        },
        {
          title: "Professionals",
          desc: "Create structure and grow with intention instead of reacting to daily pressure.",
        },
        {
          title: "Creators",
          desc: "Protect your energy, creativity, and momentum over the long term.",
        },
        {
          title: "Coaches & mentors",
          desc: "Support the people you guide inside a more structured growth environment.",
        },
        {
          title: "Getting on track",
          desc: "Start again with support, structure, and habits that actually last.",
        },
      ].map((item, i) => (
        <div
          key={i}
          className={
            "border " +
            theme.hightLightBorderColor +
            " bg-white border rounded-2xl p-8 flex flex-col items-center text-center h-full"
          }
        >
          {/* SAME HEIGHT SYSTEM AS PROCESS */}
          <div className="flex flex-col items-center justify-start h-[140px]">
            {/* TITLE */}
            <h3
              className={
                "border " +
                cormorant.className +
                " " +
                theme.hightLightBorderColor +
                " px-6 py-2 rounded-full  bg-[#FCFAF4] text-2xl mb-4 flex items-center font-semibold justify-center h-[56px] text-center"
              }
            >
              {item.title}
            </h3>

            {/* DESCRIPTION */}
            <p className="text-base max-w-[270px]">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-12 px-12 mt-4 pb-[100px] max-w-[1440px] mx-auto">
    <div className="bg-gradient-to-br from-[#433428] to-[#5A4535] rounded-[3rem] p-16 md:p-24 text-center text-white relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute -bottom-48 -left-24 w-96 h-96 rounded-full border border-white/10"></div>
      <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full border border-white/10"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <h3 className="text-white tracking-widest text-2xl uppercase">
            Ready To Begin
          </h3>
          <div className="h-[2px] bg-white w-[80px]"></div>
        </div>

        <h2
          className={
            cormorant.className +
            " tracking-[0.05em] text-5xl mb-8 leading-tight"
          }
        >
          A better life is built through
          <br />
          small, consistent days.
        </h2>

        <p className="text-white mb-12 text-sm md:text-base  tracking-[0.05em] leading-relaxed">
          MTB helps you stay focused, supported, and intentional — so
          <br />
          growth becomes part of your everyday life.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#433428] rounded-full font-medium hover:bg-stone-100 transition-colors w-full sm:w-auto">
            Start Your Journey <ArrowRight className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border border-white/30 rounded-full font-medium hover:bg-white/10 transition-colors w-full sm:w-auto">
            <PlayCircle className="w-5 h-5" /> Explore Inside MTB
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-base text-white tracking-[0.05em]">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <Users className="w-6 h-6 " />
          </div>
          Join 10,000+ people building healthier routines with MTB.
        </div>
      </div>
    </div>
  </section>
);

export default function MyThriveBuddyLandingPage() {
  return (
    <div
      className={`min-h-screen w-full  selection:bg-[#B87042] selection:text-white `}
    >
      <Header />
      <main>
        <section className="bg-[var(--bg-primary)]">
          <Hero />
        </section>
        <section className={`${theme.bgSecondary}`}>
          <ProblemSection />
        </section>
        <section className={theme.bgTertiary}>
          <FeatureSection />
        </section>
        <section className={`${theme.bgSecondary}`}>
          <ProcessSection />
        </section>
        <section className={theme.bgTertiary}>
          <SuccessStoriesSection />
        </section>
        <section className={`${theme.bgSecondary}`}>
          <WhoItHelpsSection />
          <CTASection />
        </section>
      </main>
      <section className={theme.bgTertiary}>
        <Footer />
      </section>
    </div>
  );
}
