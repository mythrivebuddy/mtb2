"use client";
import React, { useRef, useState } from "react";
import {
  Search,
  MapPin,
  ChevronRight,
  ArrowRight,
  Clock,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { theme } from "@/lib/new-home/theme/theme";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import PageSkeleton from "@/components/PageSkeleton";
import { HostedEvent } from "@prisma/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEnrollFreeEvent } from "@/hooks/use-free-event-enroll";
import { Chip } from "@/components/ui/mtb/chip";
import { Button } from "@/components/ui/button";

// --- CATEGORY DATA ---
const eventTypes = [
  "All",
  "Retreat",
  "Webinar",
  "Workshop",
  "One on One",
  "Course",
  "Other",
];

// --- TYPES ---
type HostedEventWithTickets = Omit<HostedEvent, "ticket"> & {
  tickets: {
    id: string;
    eventId: string;
    price: number;
    quantity: number;
    currency: "INR" | "USD" | null;
    createdAt: string;
    updatedAt: string;
  }[];
  creator: {
    id: string;
    name: string;
  };
  isEnrolled?: boolean;
};

type HostedEventsListResponse = {
  events: HostedEventWithTickets[];
  pastEvents: HostedEventWithTickets[];
};

// --- HELPER FUNCTIONS ---
const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
};

const getPrice = (event: HostedEventWithTickets) => {
  if (event?.tickets && event.tickets.length > 0) {
    const { currency, price } = event.tickets[0];

    const symbolMap: Record<string, string> = {
      INR: "₹",
      USD: "$",
    };

    const symbol = currency ? symbolMap[currency] || currency : "";

    return `${symbol}${price}`;
  }
  return "Free";
};

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return null;

  const date = new Date(dateStr);

  const month = date.toLocaleString("en-US", { month: "short" }); // 👈 important
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1200&auto=format&fit=crop";

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────
const HeroSection = ({
  searchValue,
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (val: string) => void;
}) => (
  <section className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center text-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <Image
        src="/event-mountains.jpeg"
        fill
        alt="Mountains"
        className="object-cover object-top opacity-80"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]"
        style={{ backgroundColor: "rgba(252, 249, 240, 0.4)" }}
      />
    </div>
    <div className="relative z-10 max-w-3xl flex flex-col items-center mt-16 md:mt-24">
      <h1
        className={`${theme.typography.h1} text-4xl md:text-6xl text-amber-900 mb-6 drop-shadow-sm`}
      >
        Find Your Path to{" "}
        <span className="italic text-amber-700">Flourishing</span>
      </h1>
      <p className="text-gray-800 md:text-lg mb-10 max-w-xl font-medium drop-shadow-sm">
        Curated events designed to nurture your soul, challenge your mind, and
        connect you with a vibrant community.
      </p>
      <div className="bg-white rounded-md sm:rounded-full mx-2 py-2 flex flex-col md:flex-row shadow-xl gap-2 md:gap-0">
        <div className="flex items-center px-4 gap-2 border-b md:border-b-0 md:border-r border-gray-200 py-2 md:py-0">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workshops, retreats, wellness..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
          />
        </div>
        <div className="flex px-2">
          <div className="flex items-center px-4 gap-2 py-2 md:py-0">
            <MapPin size={18} className="text-gray-400" />
            <input
              type="text"
              readOnly
              placeholder="Anywhere"
              className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
            />
          </div>
          <Button
            variant="mtbPrimary"
            size="mtbPill"
            onClick={() => {
              const el = document.getElementById("events-results");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Discover
          </Button>
        </div>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────
const FilterSection = ({
  activeType,
  setActiveType,
}: {
  activeType: string;
  setActiveType: (val: string) => void;
}) => (
  <div className="flex  items-center justify-start x1260:justify-center py-8 overflow-x-auto no-scrollbar gap-4">
    <div className={`flex pb-3 border-b ${theme.border.brandDeep}   gap-3`}>
      {eventTypes.map((type) => (
        <Chip
          key={type}
          isActive={activeType === type}
          onClick={() => setActiveType(type)}
        >
          {type}
        </Chip>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// FEATURED EXPERIENCES
// ─────────────────────────────────────────────
const FeaturedSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  const router = useRouter();
  const { freeEnroll, loadingId } = useEnrollFreeEvent([["all-events"]]);

  // if (!events || events.length === 0) return null;

  const now = new Date();
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const mainEvent =
    sorted.find((e) => e?.startTime && new Date(e.startTime) > now) ?? null;

  // Empty state
  if (!mainEvent)
    return (
      <section className="mb-12  mt-4 sm:mt-8">
        <h2
          className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl mb-10`}
        >
          Featured Events
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center py-10 px-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-amber-700" />
          </div>
          <h3
            className={`${theme.typography.h1} text-xl md:text-2xl lg:text-4xl  mb-2`}
          >
            No Featured Events Right Now
          </h3>
          <p className="text-gray-500 text-sm max-w-md">
            We&apos;re curating new featured events for you. Check back soon or
            explore all available events.
          </p>
        </div>
      </section>
    );

  const sideEvent = events[1] ?? mainEvent;
  const bottomEvent = events[2] ?? mainEvent;

  return (
    <section className="mb-12 mt-4 sm:mt-8">
      <h2
        className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl mb-10`}
      >
        Featured Events
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[420px]">
        {/* Main large card */}
        <div className="md:col-span-2 relative rounded-2xl overflow-hidden group cursor-pointer h-[400px] md:h-full">
          <Image
            src={mainEvent.coverImage || FALLBACK_IMAGE}
            alt={mainEvent.title}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col max-sm:items-center justify-center p-8 sm:mt-24">
            <span
              className={`${theme.bg.base} ${theme.text.primary} ${theme.typography.h1} text-xs  px-3 py-1 rounded-full w-max mb-4 uppercase`}
            >
              {mainEvent.format?.replace("_", "-")} {mainEvent.type}
            </span>
            <h3
              className={`${theme.typography.h1} ${theme.text.inverse} text-2xl md:text-3xl lg:text-5xl  mb-3`}
            >
              {mainEvent.title}
            </h3>
            <p
              className={`${theme.text.inverse} text-base sm:text-lg max-w-md mb-8 line-clamp-2`}
            >
              {stripHtml(mainEvent.description || "")}
            </p>
            <Button
              onClick={() => router.push(`/dashboard/events/${mainEvent.id}`)}
              variant="mtbSecondary"
              size="mtbPill"
              width="fit"
            >
              View Event <ArrowRight />
            </Button>
          </div>
        </div>

        {/* Side cards */}
        <div className="flex flex-col gap-6 h-full">
          {/* Top white card */}
          <div
            className={`flex-1 ${theme.bg.base} rounded-2xl p-6 border ${theme.border.accent} flex flex-col justify-between`}
          >
            <div>
              <span
                className={`${theme.text.accent} text-xs tracking-[0.058em] uppercase mb-2 block`}
              >
                Trending {sideEvent.type?.toLowerCase() || "Event"}
              </span>
              <h4
                className={`${theme.typography.h1} text-xl sm:text-2xl mb-2 leading-tight line-clamp-2`}
              >
                {sideEvent.title}
              </h4>
              <p className={`${theme.text.tertiary} text-base line-clamp-2`}>
                {stripHtml(sideEvent.description || "")}
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">
                {sideEvent.creator?.name || "Instructor"}
              </span>
              <Link
                href={`/dashboard/events/${sideEvent.id}`}
                className={`${theme.text.accent} flex items-center gap-1 text-sm font-medium  hover:underline`}
              >
                Learn More <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Bottom dark card */}
          <div
            className={`${theme.bg.brandDeep} ${theme.text.inverse} flex-1 rounded-2xl p-6 flex flex-col justify-between `}
          >
            <div>
              <span
                className={`${theme.text.warmAccent} text-xs  tracking-wider mb-2 block`}
              >
                Upcoming {bottomEvent.type || "Workshop"}
              </span>
              <h4
                className={`${theme.typography.h1} text-xl sm:text-2xl mb-6 leading-tight line-clamp-2`}
              >
                {bottomEvent.title}
              </h4>
            </div>
            <Button
              variant="mtbSecondary"
              disabled={bottomEvent.isEnrolled || loadingId === bottomEvent.id}
              onClick={() =>
                freeEnroll({
                  id: bottomEvent.id,
                  isPaid: bottomEvent.isPaid,
                  isEnrolled: bottomEvent.isEnrolled,
                })
              }
              size="mtbPill"
              width="full"
            >
              {loadingId === bottomEvent.id
                ? "Enrolling..."
                : bottomEvent.isEnrolled
                  ? "You are enrolled"
                  : bottomEvent.isPaid
                    ? `Register Now`
                    : "Register Now"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// RECOMMENDED FOR YOU
// ─────────────────────────────────────────────
const RecommendedSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!events || events.length === 0) return null;

  // Pick up to 4 events
  const recommended = events.slice(0, 4);

  // Track which card is active based on scroll position (mobile carousel)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20 // 20 = gap-5
      : el.clientWidth;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 20
      : el.clientWidth;
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  return (
    <section className="mb-12 mt-36">
      <div className="flex items-center justify-between mb-8 sm:mb-12">
        <div>
          <h2
            className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl mb-1`}
          >
            Recommended For You
          </h2>
          <p className="text-base">
            Personalized based on your flourishing journey.
          </p>
        </div>
        <Link
          href="/dashboard/events"
          className={`${theme.text.brandDeep} hidden md:flex items-center text-sm font-medium  hover:underline`}
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>

      {/* Carousel on mobile, grid on sm+ */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          flex sm:grid sm:grid-cols-2 md:grid-cols-5
          gap-5
          overflow-x-auto sm:overflow-visible
          snap-x snap-mandatory sm:snap-none
          -mx-4 px-4 sm:mx-0 sm:px-0
          scrollbar-hide
          [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]
        "
      >
        {recommended.map((event) => (
          <Link
            key={event.id}
            href={`/dashboard/events/${event.id}`}
            className="
              bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group flex flex-col hover:shadow-md transition-shadow
              shrink-0 w-[55vw] sm:w-auto
              snap-center sm:snap-align-none
            "
          >
            {/* Image */}
            <div className="relative h-40 w-full overflow-hidden">
              {event.isPaid && (
                <span className="absolute top-3 left-3 bg-amber-700 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full z-10 uppercase">
                  Paid
                </span>
              )}
              <Image
                src={event.coverImage || FALLBACK_IMAGE}
                alt={event.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
              {/* Creator row */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-800 shrink-0">
                  {(event.creator?.name || "I")[0].toUpperCase()}
                </div>
                <span className={`${theme.text.tertiary} text-xs  truncate`}>
                  {event.creator?.name || "Instructor"}
                </span>
              </div>

              <h4
                className={`${theme.typography.h1} font-semibold text-xl sm:text-2xl leading-snug mb-1 line-clamp-2`}
              >
                {event.title}
              </h4>

              {/* Meta row */}
              <p className="text-xs flex items-center gap-1 mb-3">
                <Clock className="w-4 h-4" />
                {event.startTime && <> · {formatDate(event.startTime)}</>}
              </p>

              {/* Price + CTA */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                <span className={`font-bold text-base ${theme.text.brandDeep}`}>
                  {event.isPaid ? getPrice(event) : "Free"}
                </span>
                <span
                  className={`text-xs font-medium ${theme.text.brandDeep} transition`}
                >
                  View Event
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Dot indicators + View All — mobile only */}
      <div className="sm:hidden relative flex items-center mt-5">
        {/* Dots — absolutely centered in the row */}
        {recommended.length > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {recommended.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === activeIndex ? "bg-amber-700" : "bg-amber-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* View All — pushed to the right */}
        <Link
          href="/dashboard/events"
          className={`${theme.text.brandDeep} ml-auto flex items-center text-sm font-medium hover:underline`}
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>
      {/* View all — tablet only (sm to md) */}
      <div className="hidden sm:flex md:hidden justify-end mt-5">
        <Link
          href="/dashboard/events"
          className={`${theme.text.brandDeep} flex items-center text-sm font-medium  hover:underline`}
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// WEEKEND EVENTS
// ─────────────────────────────────────────────
const WeekendEventsSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  // Show retreats or first 3 upcoming events
  const now = new Date();
  const weekendEvents = events
    .filter(
      (e) =>
        (!e.startTime || new Date(e.startTime) > now) &&
        (e.type === "RETREAT" || true), // fallback to any if no retreats
    )
    .slice(0, 3);

  if (weekendEvents.length === 0) return null;

  return (
    <section className="mb-12 mt-24">
      <h2
        className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl mb-2`}
      >
        Weekend Events
      </h2>
      <p className=" text-base mb-12">
        Escape the noise. Find yourself in nature with our hand-picked events.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {weekendEvents.map((event) => (
          <Link
            key={event.id}
            href={`/dashboard/events/${event.id}`}
            className="group cursor-pointer "
          >
            <div className="relative h-64  md:h-72 w-full rounded-2xl overflow-hidden mb-4">
              <Image
                src={event.coverImage || FALLBACK_IMAGE}
                alt={event.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <h4
              className={`${theme.typography.h1} font-semibold text-xl leading-snug mb-1 line-clamp-1`}
            >
              {event.title}
            </h4>
            <p
              className={`${theme.text.tertiary} text-sm flex items-center gap-1 mb-0.5`}
            >
              <MapPin size={13} />
              {event.venueName || event.address || "Online"}
              {event.startTime && <> · {formatDate(event.startTime)}</>}
            </p>
            <p className={`text-base font-semibold mt-1`}>
              {event.isPaid ? `${getPrice(event)} per person` : "Free"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// TRENDING THIS WEEK
// ─────────────────────────────────────────────
const TrendingSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  // if (!events || events.length === 0) return null;

  const now = new Date();
  const trendingEvents = [...events]
    .filter((e) => !e.startTime || new Date(e.startTime) > now) // ✅ Keep nulls AND future events
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ) // sort by createdAt
    .slice(0, 3);
  if (trendingEvents.length === 0)
    return (
      <section className="rounded-t-[3rem] px-4 py-16">
        <h2
          className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl mb-10`}
        >
          Trending This Week
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center py-10 px-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-amber-700" />
          </div>
          <h3
            className={`${theme.typography.h1} text-xl md:text-2xl lg:text-4xl mb-2`}
          >
            Nothing Trending Yet
          </h3>
          <p className="text-gray-500 text-sm max-w-md">
            Once events start gaining momentum, you&apos;ll see the most popular
            events here.
          </p>
        </div>
      </section>
    );
  return (
    <section className="rounded-t-[3rem]  px-4   py-16">
      <div className=" mx-auto flex flex-col gap-10 justify-between">
        <div className="md:w-1/3">
          <h2
            className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl `}
          >
            Trending This Week
          </h2>
        </div>

        <div className="flex flex-col gap-8">
          {trendingEvents.map((item, index) => (
            <Link
              key={item.id}
              href={`/dashboard/events/${item.id}`}
              className="flex items-center gap-3 sm:gap-6 group cursor-pointer"
            >
              <span className="text-lg sm:text-3xl whitespace-nowrap text-gray-500 font-light w-8">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                <Image
                  src={item.coverImage || "https://via.placeholder.com/150"}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <h4
                  className={
                    theme.typography.h1 +
                    "text-xl sm:text-2xl font-medium mb-1 line-clamp-1"
                  }
                >
                  {item.title}
                </h4>
                <p className={`text-xs ${theme.text.tertiary}`}>
                  {item.type} with {item.creator?.name || "Instructor"}
                  {/* • Starts{" "} */}
                  {/* {new Date(item.startTime).toLocaleDateString()} */}
                </p>
              </div>

              <div className="flex justify-end items-center  sm:gap-3 ml-auto">
                <p
                  className={`${theme.text.brandDeep} text-xs sm:text-base text-right whitespace-nowrap`}
                >
                  {item.isPaid ? getPrice(item) : "Free"}
                </p>
                <ChevronRight className="shrink-0 w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// PAST EVENTS
// ─────────────────────────────────────────────
const PastEventsSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-14 px-4">
      <div className=" mx-auto">
        <h2
          className={`${theme.typography.h1} text-2xl md:text-3xl lg:text-5xl  mb-1`}
        >
          Past Events
        </h2>
        <p className="text-base mb-8 sm:mb-12">
          Escape the noise. Find yourself in nature with our hand-picked two-day
          escapes.
        </p>

        <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="group relative rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={event.coverImage || FALLBACK_IMAGE}
                  alt={event.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105 grayscale-[30%] group-hover:grayscale-0"
                />
              </div>

              {/* Body */}
              <div className="p-6">
                <h4
                  className={`${theme.typography.h1} font-semibold text-xl sm:text-2xl mb-1 line-clamp-1`}
                >
                  {event.title}
                </h4>
                {event.startTime && (
                  <p
                    className={`text-xs ${theme.text.accent} mb-3 flex items-center gap-1`}
                  >
                    <MapPin size={12} />
                    {event.venueName || event.address || "Online"} · On{" "}
                   {event.startTime ? formatDate(event?.startTime):""}
                  </p>
                )}
                <p
                  className={`${theme.text.brandDeep} text-base line-clamp-2 mb-5`}
                >
                  {stripHtml(event.description || "")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function EventsDiscoveryPage() {
  const { data, isLoading } = useQuery<HostedEventsListResponse>({
    queryKey: ["all-events"],
    queryFn: async () => {
      const res = await axios.get(`/api/hosted-events?past=true`);
      return res.data;
    },
  });

  const { status: authStatus } = useSession();
  const [activeType, setActiveType] = useState("All");

    const [searchQuery, setSearchQuery] = useState("");
    
  const eventsList = data?.events || [];
  const pastEventsList = data?.pastEvents || [];

  const filteredByType =
    activeType === "All"
      ? eventsList
      : eventsList.filter(
          (event) => event.type === activeType.toUpperCase().replace(" ", "_"),
        );

  const filteredEvents = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByType;
    return filteredByType.filter((event) => {
      const title = event.title?.toLowerCase() || "";
      const description = stripHtml(event.description || "").toLowerCase();
      const creatorName = event.creator?.name?.toLowerCase() || "";
      const venue = (event.venueName || event.address || "").toLowerCase();
      return (
        title.includes(q) ||
        description.includes(q) ||
        creatorName.includes(q) ||
        venue.includes(q)
      );
    });
  }, [filteredByType, searchQuery]);

  const pageContent = (
    <div className="min-h-screen w-full">
      <main>
        {/* 1. Hero */}
        <HeroSection searchValue={searchQuery} onSearchChange={setSearchQuery} />

        <div className="mx-auto px-4">
          {/* 2. Filter chips */}
          <FilterSection
            activeType={activeType}
            setActiveType={setActiveType}
          />

              {/* No results state for search */}
          {!isLoading && searchQuery.trim() && filteredEvents.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center py-16 px-6 mb-12">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className={`${theme.typography.h1} text-xl md:text-2xl mb-2`}>
                No events found
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try a different search term.
              </p>
            </div>
          )}


          {/* 3. Featured Events */}
          {!isLoading && <FeaturedSection events={filteredEvents} />}

          {/* 4. Recommended for You */}
          {!isLoading && filteredEvents.length > 0 && (
            <RecommendedSection events={filteredEvents} />
          )}

          {/* 5. Weekend Events */}
          {!isLoading && <WeekendEventsSection events={filteredEvents} />}
        </div>

        {/* 6. Trending This Week — full-bleed dark section */}
        {!isLoading && <TrendingSection events={filteredEvents} />}

        {/* 7. Past Events */}
        {!isLoading && pastEventsList.length > 0 && (
          <PastEventsSection events={pastEventsList} />
        )}
      </main>
    </div>
  );

  const content = isLoading ? (
    <PageSkeleton type="events-discovery-page" />
  ) : (
    pageContent
  );

  return authStatus === "authenticated" ? (
    content
  ) : (
    <AppLayout>{content}</AppLayout>
  );
}
