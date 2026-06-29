"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { theme } from "@/lib/new-home/theme/theme";
import { Chip } from "@/components/ui/mtb/chip";
import { HostedEvent } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { stripHtml } from "@/lib/utils/html";
import PageSkeleton from "@/components/PageSkeleton";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import { useDebounce } from "@/hooks/use-debounce";

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
    image?: string;
  };
  isEnrolled?: boolean;
};

type HostedEventsListResponse = {
  events: HostedEventWithTickets[];
  pastEvents: HostedEventWithTickets[];
};

// --- CONSTANTS & HELPERS ---
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1200&auto=format&fit=crop";

const eventTypes = [
  "All",
  "Retreat",
  "Webinar",
  "Workshop",
  "One on One",
  "Course",
  "Other",
];

const getPrice = (event: HostedEventWithTickets) => {
  if (event?.tickets && event.tickets.length > 0) {
    const { currency, price } = event.tickets[0];
    const symbolMap: Record<string, string> = { INR: "₹", USD: "$" };
    const symbol = currency ? symbolMap[currency] || currency : "";
    return `${symbol}${price}`;
  }
  return "Free";
};

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

export default function EventsDiscoveryPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [activeType, setActiveType] = useState("All");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFirstLoad, setIsFirstLoad] = useState(true);
   const [mainEvent, setMainEvent] = useState<HostedEventWithTickets | null>(null);

const debouncedValue = useDebounce(searchQuery, 500);
  // Fetch API Data
  const { data, isLoading } = useQuery<HostedEventsListResponse>({
    queryKey: ["all-events", debouncedValue],
    queryFn: async () => {
      const params = new URLSearchParams({ past: "true" });
      if (debouncedValue.trim()) params.set("search", debouncedValue.trim());
      const res = await axios.get(`/api/hosted-events?${params.toString()}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

    useEffect(() => {
    if (data?.events && data.events.length > 0 && !mainEvent) {
      const now = new Date();
      const sorted = [...data.events].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMainEvent(
        sorted.find((e) => e?.startTime && new Date(e.startTime) > now) ?? null
      );
    }
  }, [data]);

  useEffect(() => {
    if (!isLoading) {
      setIsFirstLoad(false);
    }
  }, [isLoading]);

  const eventsList = data?.events || [];

  // Filter events by selected chip
  const filteredEvents = useMemo(() => {
    if (activeType === "All") return eventsList;
    return eventsList.filter(
      (event) => event.type === activeType.toUpperCase().replace(" ", "_"),
    );
  }, [eventsList, activeType]);

  // Find Featured Event (First upcoming event)

  if (isFirstLoad && isLoading) {
    const skeleton = <PageSkeleton type="all-events-page" />;

    return authStatus === "authenticated" ? (
      skeleton
    ) : (
      <AppLayout>{skeleton}</AppLayout>
    );
  }
  const content = (
    <div className={`min-h-screen`}>
      {/* HERO SECTION */}
      {/* HERO SECTION */}
      {mainEvent ? (
        <section
          className={`${theme.bg.calm} relative h-[60vh] min-h-[491px] sm:min-h-[584px] w-full flex items-center overflow-hidden text-white`}
        >
          <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 flex flex-col justify-center items-center text-center md:items-start md:text-left">
            <p
              className={`${theme.text.accent} ${theme.bg.base} px-4 py-1.5 rounded-full backdrop-blur-sm text-sm tracking-wider uppercase mb-6`}
            >
              Featured Event
            </p>
            <div className="max-w-2xl flex flex-col items-center md:items-start">
              <h1
                className={`${theme.typography.h1} ${theme.text.primary} text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight drop-shadow-md`}
              >
                {mainEvent.title}
              </h1>
              <p
                className={`${theme.text.primary} text-base md:text-lg leading-relaxed mb-8 line-clamp-3 drop-shadow-sm`}
              >
                {stripHtml(mainEvent.description)}
              </p>
              <Button
                variant="mtbPrimary"
                type="button"
                size="mtbPill"
                onClick={() => router.push(`/dashboard/events/${mainEvent.id}`)}
              >
                View Details <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </section>
      ) : (
        /* EMPTY STATE SECTION */
        <section className="mb-12 mt-4 sm:mt-8 max-w-[1440px] mx-auto px-4 sm:px-6 w-full pt-10">
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
              className={`${theme.typography.h1} text-xl md:text-2xl lg:text-4xl mb-2`}
            >
              No Featured Events Right Now
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              We&apos;re curating new featured events for you. Check back soon
              or explore all available events below.
            </p>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <main className={`${theme.layout.container} py-12`}>
        {/* FILTERS & SEARCH */}
        <div
          className={`border-b ${theme.border.brandDeep} flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12 pb-3`}
        >
          <div className={`flex overflow-x-auto no-scrollbar gap-3`}>
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

          <div className="relative max-w-[250px] shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className={`px-4 py-2 w-full ${theme.bg.base} rounded-full pl-10 transition-all border border-gray-200 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-gray-300 focus:shadow-none appearance-none`}
            />
          </div>
        </div>

        {/* EVENT GRID */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center py-20 px-6 mb-12 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-amber-700" />
            </div>
            <h3 className={`${theme.typography.h1} text-xl md:text-2xl mb-2`}>
              No events found
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              We couldn&apos;t find anything matching your search. Try adjusting
              your filters or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 place-items-center sm:grid-cols-2 md:grid-cols-3 x1260:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group flex flex-col hover:shadow-md transition-shadow shrink-0 w-full sm:w-auto snap-center sm:snap-align-none"
              >
                {/* Image */}
                <div className="relative h-40 w-full overflow-hidden bg-gray-200">
                  <span
                    className={`absolute top-3 left-3 ${theme.bg.base} ${theme.text.accent} text-xs px-2.5 py-1 rounded-full z-10 uppercase shadow-sm`}
                  >
                    {event.type?.replace("_", " ") || "Free"}
                  </span>

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
                    {/* 1. The Avatar */}
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                      {event.creator?.image ? (
                        <Image
                          width={40}
                          height={40}
                          src={event.creator.image}
                          alt={event.creator.name || "Creator"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-800">
                          {(event.creator?.name || "I")[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* 2. The Name */}
                    <span className="text-xs text-stone-500 truncate">
                      {event.creator?.name || "Instructor"}
                    </span>
                  </div>

                  <h4
                    className={`${theme.typography.h1} font-semibold text-xl sm:text-2xl leading-snug mb-1 line-clamp-2`}
                  >
                    {event.title}
                  </h4>

                  {/* Meta row */}
                  <p className="text-xs flex items-center gap-1 mb-3 text-stone-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {event.startTime && <> · {formatDate(event.startTime)}</>}
                    </span>
                  </p>

                  {/* Price + CTA */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                    <span
                      className={`font-bold text-base ${theme.text.brandDeep}`}
                    >
                      {event.isPaid ? getPrice(event) : "Free"}
                    </span>
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className={`text-xs font-medium ${theme.text.brandDeep} transition`}
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  return authStatus === "authenticated" ? (
    content
  ) : (
    <AppLayout>{content}</AppLayout>
  );
}
