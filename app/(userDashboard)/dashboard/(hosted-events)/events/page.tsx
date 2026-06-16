"use client";
import React, { useState } from "react";
import { Search, MapPin, ChevronRight } from "lucide-react";
import Image from "next/image";
import { theme } from "@/lib/new-home/theme/theme"; // Adjust path as needed
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import PageSkeleton from "@/components/PageSkeleton";
import { HostedEvent } from "@prisma/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useEnrollFreeEvent } from "@/hooks/use-free-event-enroll";

// --- CATEGORY DATA ---
const CATEGORIES = [
  "All",
  "Retreat",
  "Webinar",
  "Workshop",
  "One on One",
  "Course",
  "Other",
];

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
};

// --- HELPER FUNCTIONS ---
const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "");
};

const getPrice = (event: HostedEventWithTickets) => {
  if (event?.tickets && event.tickets.length > 0) {
    return `${event.tickets[0].currency} ${event.tickets[0].price}`;
  }
  return "Free";
};

// --- REUSABLE COMPONENTS ---
const HeroSection = () => {
  return (
    <section className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center text-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/event-mountains.jpeg"
          fill
          alt="Mountains"
          className="object-cover object-top opacity-80"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]`}
          style={{ backgroundColor: "rgba(252, 249, 240, 0.4)" }}
        ></div>
      </div>
      {/* Content */}
      <div className="relative z-10 max-w-3xl flex flex-col items-center mt-16 md:mt-24">
        <h1
          className={`${theme.typography.h1} text-4xl md:text-6xl text-amber-900 mb-6 drop-shadow-sm`}
        >
          Find Your Path to{" "}
          <span className="italic text-amber-700">Flourishing</span>
        </h1>
        <p className="text-gray-800 md:text-lg mb-10 max-w-xl font-medium drop-shadow-sm">
          Curated experiences designed to nurture your soul, challenge your
          mind, and connect you with a vibrant community.
        </p>
        {/* Search Bar */}
        <div className=" bg-white rounded-md sm:rounded-full mx-2 py-2 flex flex-col md:flex-row shadow-xl gap-2 md:gap-0">
          <div className="flex items-center px-4 gap-2 border-b md:border-b-0 md:border-r border-gray-200 py-2 md:py-0">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
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
            <button
              className={` md:w-auto px-6 py-3 rounded-full font-medium transition ${theme.buttonDark}`}
            >
              Discover
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const FilterSection = ({
  activeType,
  setActiveType,
}: {
  activeType: string;
  setActiveType: (val: string) => void;
}) => {
  return (
    <div className="flex items-center justify-start md:justify-center py-8 overflow-x-auto no-scrollbar gap-4">
      <div className="flex gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveType(cat)}
            className={`${theme.chip} whitespace-nowrap ${
              activeType === cat
                ? theme.buttonDark + " bg-[var(--bg-secondary)]"
                : theme.chipInactive
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

const FeaturedSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  const router = useRouter();

  const { freeEnroll, loadingId } = useEnrollFreeEvent([["all-events"]]);
  if (!events || events.length === 0) return null;

  const getActiveMainEvent = (events: HostedEventWithTickets[]) => {
    const sorted = [...events].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const now = new Date();
    return (
      sorted.find((e) => e?.startTime && new Date(e.startTime) > now) ?? null
    );
  };
  // For the sake of preserving the layout with limited data,
  // we fallback to the first event if there are fewer than 3 events.
  const mainEvent = getActiveMainEvent(events);

  if (!mainEvent)
    return (
      <section className="mb-8">
        <h2 className={`${theme.typography.h1} text-3xl mb-8`}>
          Featured Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[400px]">
          {/* Main Card — matches existing main card style */}
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-[400px] md:h-full bg-gray-100">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
              <h3 className={`${theme.typography.h1} text-3xl text-white mb-3`}>
                No Featured Events
              </h3>
              <p className="text-gray-200 text-sm max-w-md">
                New experiences are being curated. Check back soon!
              </p>
            </div>
          </div>

          {/* Side Cards */}
          <div className="flex flex-col gap-6 h-full">
            {/* Top — matches existing white card style */}
            <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-amber-700 text-xs tracking-wider uppercase mb-2 block">
                  Coming Soon
                </span>
                <h4
                  className={`${theme.typography.h1} text-xl mb-2 leading-tight`}
                >
                  New Events on the Way
                </h4>
                <p className="text-gray-500 text-sm">
                  Stay tuned for upcoming experiences.
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">Check back soon</span>
              </div>
            </div>

            {/* Bottom — matches existing dark card style */}
            <div
              className={`flex-1 rounded-2xl p-6 flex flex-col justify-between text-white ${theme.bgSecondary} bg-amber-950`}
            >
              <div>
                <span className="text-amber-200 text-xs font-semibold tracking-wider uppercase mb-2 block">
                  Stay Tuned
                </span>
                <h4
                  className={`${theme.typography.h1} text-xl mb-2 leading-tight`}
                >
                  More Experiences Coming
                </h4>
                <p className="text-amber-100/70 text-sm mt-2 flex items-center gap-1">
                  <MapPin size={14} /> Locations TBA
                </p>
              </div>
              <button
                disabled
                className="w-full py-3 rounded-full text-sm font-medium mt-4 bg-white text-black/40 cursor-not-allowed"
              >
                No Events Yet
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  const topSideEvent = mainEvent;
  const bottomSideEvent = mainEvent;

  return (
    <section className="mb-8">
      <h2 className={`${theme.typography.h1} text-3xl mb-8`}>
        Featured Events
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[400px]">
        {/* Main Card */}
        <div className="md:col-span-2 relative rounded-2xl overflow-hidden group cursor-pointer h-[400px] md:h-full">
          <Image
            src={
              mainEvent.coverImage ||
              "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1200&auto=format&fit=crop"
            }
            alt={mainEvent.title}
            fill
            className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
            <span className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full w-max mb-4 uppercase">
              {mainEvent.format ? mainEvent.format.replace("_", "-") : ""}{" "}
              {mainEvent.type}
            </span>
            <h3 className={`${theme.typography.h1} text-3xl text-white mb-3`}>
              {mainEvent.title}
            </h3>
            <p className="text-gray-200 text-sm max-w-md mb-6 line-clamp-2">
              {stripHtml(mainEvent?.description || "")}
            </p>
            <button
              onClick={() => router.push(`/dashboard/events/${mainEvent.id}`)}
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-medium w-max hover:bg-gray-100 transition"
            >
              View Event
            </button>
          </div>
        </div>

        {/* Side Cards */}
        <div className="flex flex-col gap-6 h-full">
          {/* Top Side Card */}
          <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-amber-700 text-xs tracking-wider uppercase mb-2 block">
                Trending {topSideEvent.type?.toLowerCase() || "Event"}
              </span>
              <h4
                className={`${theme.typography.h1} text-xl mb-2 leading-tight line-clamp-2`}
              >
                {topSideEvent.title}
              </h4>
              <p className="text-gray-500 text-sm line-clamp-2">
                {stripHtml(topSideEvent.description || "")}
              </p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex -space-x-2">
                {/* Simulated attendees or creator avatar */}
                {/* <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 overflow-hidden relative">
                  <Image
                    src={
                      topSideEvent.creator?.image ||
                      `https://i.pravatar.cc/100?img=11`
                    }
                    alt="avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-800">
                  +12
                </div> */}
              </div>
              <Link
                href={`/dashboard/events/${topSideEvent.id}`}
                className="text-sm font-medium text-amber-900 hover:underline"
              >
                Learn More →
              </Link>
            </div>
          </div>

          {/* Bottom Side Card */}
          <div
            className={`flex-1 rounded-2xl p-6 flex flex-col justify-between text-white ${theme.bgSecondary} bg-amber-950`}
          >
            <div>
              <span className="text-amber-200 text-xs font-semibold tracking-wider uppercase mb-2 block">
                Upcoming {bottomSideEvent.type?.toLowerCase() || "Workshop"}
              </span>
              <h4
                className={`${theme.typography.h1} text-xl mb-2 leading-tight line-clamp-2`}
              >
                {bottomSideEvent.title}
              </h4>
              <p className="text-amber-100/70 text-sm mt-2 flex items-center gap-1">
                <MapPin size={14} />{" "}
                {bottomSideEvent.venueName ||
                  bottomSideEvent.address ||
                  "Online"}
              </p>
            </div>
            <button
              disabled={
                bottomSideEvent.isEnrolled || loadingId === bottomSideEvent.id
              }
              onClick={() =>
                freeEnroll({
                  id: bottomSideEvent.id,
                  isPaid: bottomSideEvent.isPaid,
                  isEnrolled: bottomSideEvent.isEnrolled,
                })
              }
              className={`w-full py-3 rounded-full text-sm font-medium mt-4 transition bg-white ${
                bottomSideEvent.isEnrolled
                  ? " text-black/60 cursor-not-allowed" // Disabled styling
                  : " text-black hover:bg-gray-100" // Active styling
              }`}
            >
              {loadingId === bottomSideEvent.id
                ? "Enrolling..."
                : bottomSideEvent.isEnrolled
                  ? "You are enrolled"
                  : bottomSideEvent.isPaid
                    ? `Enroll Now - ${getPrice(bottomSideEvent)}`
                    : "Enroll for Free"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrendingSection = ({
  events = [],
}: {
  events: HostedEventWithTickets[];
}) => {
  if (!events || events.length === 0) return null;

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
      <section className="rounded-t-[3rem] py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className={`${theme.typography.h1} text-2xl sm:text-4xl mb-4`}>
            Trending This Week
          </h2>
          <p className="text-sm opacity-60">
            No upcoming events at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  return (
    <section className="rounded-t-[3rem]  py-16">
      <div className="max-w-7xl mx-auto flex flex-col gap-12 justify-between">
        <div className="md:w-1/3">
          <h2 className={`${theme.typography.h1} text-2xl sm:text-4xl mb-4`}>
            Trending This Week
          </h2>
          <p className="text-sm mb-6">
            Discover what the community is actively engaging with right now.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {trendingEvents.map((item, index) => (
            <Link
              key={item.id}
              href={`/dashboard/events/${item.id}`}
              className="flex items-center gap-4 sm:gap-6 group cursor-pointer"
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
                <p className="text-xs text-gray-500">
                  {item.type} with {item.creator?.name || "Instructor"}
                  {/* • Starts{" "} */}
                  {/* {new Date(item.startTime).toLocaleDateString()} */}
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-3">
                <p className={theme.highLightTextColor}>
                  {item.isPaid ? getPrice(item) : "Free"}
                </p>
                <ChevronRight size={20} className="shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- MAIN PAGE EXPORT ---
export default function EventsDiscoveryPage() {
  const { data, isLoading } = useQuery<HostedEventsListResponse>({
    queryKey: ["all-events"],
    queryFn: async () => {
      const res = await axios.get(`/api/hosted-events`);
      return res.data;
    },
  });
  const { status: authStatus } = useSession();

  const [activeType, setActiveType] = useState("All");

  const eventsList = data?.events || [];
  const filteredEvents =
    activeType === "All"
      ? eventsList
      : eventsList.filter((event) => event.type === activeType.toUpperCase());
  const pageContent = (
    <div className={`min-h-screen w-full `}>
      <main>
        <HeroSection />
        <div className=" mx-auto px-4 ">
          <FilterSection
            activeType={activeType}
            setActiveType={setActiveType}
          />
          {!isLoading && filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-gray-500 text-sm">
                Try selecting a different event type.
              </p>
            </div>
          )}

          {!isLoading && filteredEvents.length > 0 && (
            <FeaturedSection events={filteredEvents} />
          )}
        </div>
        {!isLoading && filteredEvents.length > 0 && (
          <TrendingSection events={filteredEvents} />
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
// const RecommendedSection = () => {
//   return (
//     <section className="mb-16">
//       <div className="flex items-end justify-between mb-8">
//         <div>
//           <h2 className={`${theme.typography.h1} text-3xl mb-2`}>
//             Recommended for You
//           </h2>
//           <p className="text-gray-500 text-sm">
//             Personalized based on your flourishing journey.
//           </p>
//         </div>
//         <button className="hidden md:block text-sm font-medium hover:underline">
//           View All →
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         {RECOMMENDED.map((item) => (
//           <div
//             key={item.id}
//             className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer flex flex-col"
//           >
//             <div className="relative h-48 w-full overflow-hidden">
//               <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full z-10">
//                 {item.type}
//               </span>
//               <img
//                 src={item.image}
//                 alt={item.title}
//                 className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
//               />
//             </div>
//             <div className="p-5 flex flex-col flex-1">
//               <div className="flex items-center gap-2 mb-3">
//                 <img
//                   src={`https://i.pravatar.cc/100?img=${item.id + 20}`}
//                   alt={item.instructor}
//                   className="w-6 h-6 rounded-full"
//                 />
//                 <span className="text-xs text-gray-500">{item.instructor}</span>
//               </div>
//               <h4 className="font-semibold text-lg mb-2 line-clamp-2 leading-tight">
//                 {item.title}
//               </h4>
//               <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
//                 <span className="font-bold text-lg">{item.price}</span>
//                 <span className="text-xs font-medium text-gray-500 group-hover:text-black transition">
//                   View Experience
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Mobile view all/pagination dots */}
//       <div className="md:hidden flex items-center justify-between mt-6 px-2">
//         <div className="flex gap-1.5">
//           <div className="w-2 h-2 rounded-full bg-amber-800"></div>
//           <div className="w-2 h-2 rounded-full border border-gray-400"></div>
//           <div className="w-2 h-2 rounded-full border border-gray-400"></div>
//         </div>
//         <button className="text-sm font-medium hover:underline">
//           View All →
//         </button>
//       </div>
//     </section>
//   );
// };

// const GetawaysSection = () => {
//   return (
//     <section className="mb-20">
//       <h2 className={`${theme.typography.h1} text-3xl mb-2`}>
//         Weekend Getaways
//       </h2>
//       <p className="text-gray-500 text-sm mb-8">
//         Disconnect from the noise and reconnect with nature in these pristine
//         spots.
//       </p>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {GETAWAYS.map((item) => (
//           <div key={item.id} className="group cursor-pointer">
//             <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden mb-4">
//               <img
//                 src={item.image}
//                 alt={item.title}
//                 className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
//               />
//             </div>
//             <h4 className="font-semibold text-lg">{item.title}</h4>
//             <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
//               <MapPin size={14} /> {item.location}
//             </p>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };
