"use client";

import { MapPin, Calendar, Leaf, ArrowRight } from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import { cormorant } from "@/lib/new-home/fonts/fonts";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import Image from "next/image";
import { ComingSoonWrapper } from "@/components/wrappers/ComingSoonWrapper";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import PageSkeleton from "@/components/PageSkeleton";
import Share from "@/components/common/ShareModal";
import { AgendaSlot, HostedEvent } from "@/types/client/events";
import { isSameDay } from "date-fns";


type EventDetailResponse = {
  event: HostedEvent & {
    ticket: {
      id: string;
      price: number;
      quantity: number;
      currency: "INR" | "USD" | null;
      spotsLeft: number;
    } | null;
    creator: {
      id: string;
      name: string;
      image: string | null;
      bio: string | null;
      businessProfile: {
        tagline: string | null;
        yearsOfExperience: number | null;
        shortBio: string | null;
        profilePhoto: string | null;
      } | null;
    };
  };
};

type EventDetail = EventDetailResponse["event"];

// ── fetch ──────────────────────────────────────────────────────────────────
async function fetchEventDetail(id: string): Promise<EventDetail> {
  const res = await axios.get<EventDetailResponse>(
    `/api/hosted-events/get-event-details/${id}`,
  );
  return res.data.event;
}

// ── sub-components ─────────────────────────────────────────────────────────
const HeroSection = ({ event }: { event: EventDetail }) =>{
   const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard/events/${event.id}`
    : `/dashboard/events/${event.id}`;
  return (
  <section
    className="relative h-[60vh] min-h-[500px] w-full bg-cover bg-center flex items-end pb-16"
    style={{ backgroundImage: `url('${event.coverImage ?? ""}')` }}
  >
    {/* <div className="absolute inset-0 bg-black/40" /> */}
      {/* Share button top-right */}
    <div className="absolute top-4 right-4 z-20">
      <Share
        url={eventUrl}
        title={event.title}
        buttonLabel="Share"
      />
    </div>
    <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12">
      <div
        className={`${cormorant.className} ${theme.chip} ${theme.bgSecondary} ${theme.textAccent} border-2 ${theme.hightLightBorderColor} inline-flex items-center gap-2 mb-4 border-none`}
      >
        <Leaf className="w-4 h-4" /> {event.type.replace(/_/g, " ")}
      </div>
      <h1
        className={`${theme.typography.h1} text-white text-4xl md:text-5xl max-w-2xl`}
      >
        {event.title}
      </h1>
    </div>
 </section>
)};

const GuideCard = ({ event }: { event: EventDetail }) => {
  const bp = event.creator.businessProfile;
  return (
    <div
      className={`${theme.bgPrimary} p-6 md:p-8 rounded-xl border ${theme.borderLight} mt-8`}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Image
          src={event.creator.image ?? ""}
          alt={event.creator.name}
          width={80}
          height={80}
          className="rounded-full object-cover shadow-md w-20 h-20"
        />
        <div>
          <h3
            className={`text-2xl mb-2 ${theme.textDark} ${cormorant.className} font-medium`}
          >
            {event.creator.name}
            {bp?.tagline ? `, ${bp.tagline}` : ""}
          </h3>
          <p className="leading-relaxed opacity-80 text-sm md:text-base">
            {bp?.shortBio ?? event.creator.bio ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
};

const JourneyTimeline = ({ slots }: { slots: AgendaSlot[] }) => {
  // Group slots by day
  const grouped = slots.reduce<Record<number, AgendaSlot[]>>(
    (acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    },
    {},
  );

  const days = Object.entries(grouped).map(([day, events]) => ({
    dayNumber: String(day).padStart(2, "0"),
    label: `Day ${day}`,
    events,
  }));

  return (
    <div className="mt-16">
      <h2
        className={`text-2xl sm:text-4xl mb-8 ${theme.textDark} ${cormorant.className} font-medium`}
      >
        The Journey Timeline
      </h2>
      <div className="space-y-12 pl-2">
        {days.map((day) => (
          <div key={day.dayNumber} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`${theme.stepperCircleBase} ${theme.stepperCircleActive} z-10`}
              >
                {day.dayNumber}
              </div>
              <h3
                className={`text-xl sm:text-2xl md:text-3xl ${theme.textDark} ${cormorant.className} font-medium`}
              >
                {day.label}
              </h3>
            </div>
            <div
              className={`ml-5 border-l-2 ${theme.borderLight} pl-8 space-y-6 pb-6`}
            >
              {day.events.map((event) => (
                <div key={event.id}>
                  <div className="flex flex-col text-base sm:flex-row sm:gap-12">
                    <span
                      className={`${theme.textAccent} font-medium text-sm sm:w-24 shrink-0`}
                    >
                      {event.time}
                    </span>
                    <span className={`${theme.textDark} font-medium`}>
                      {event.title}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SanctuaryLocation = ({ event }: { event: EventDetail }) => (
  <div className="mt-16">
    <h2
      className={`text-2xl mb-8 ${theme.textDark} ${cormorant.className} font-medium`}
    >
      The Sanctuary Location
    </h2>
    <div className="flex flex-col md:flex-row gap-6">
      <div
        className={`w-full ${theme.bgTertiary} rounded-xl p-8 flex flex-col items-center justify-center text-center border ${theme.borderLight}`}
      >
        <MapPin className={`w-8 h-8 ${theme.textAccent} mb-4`} />
        <h4 className={`font-semibold text-lg mb-2 ${theme.textDark}`}>
          {event.venueName ?? "Venue TBD"}
        </h4>
        <p className={`${theme.textDark} opacity-70 text-sm mb-4`}>
          {event.address ?? ""}
        </p>
        {event.address && (
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event?.venueName} ${event?.address}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${theme.textAccent} font-medium text-sm ${theme.hoverTextAccent} flex items-center gap-1`}
          >
            View on Map <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  </div>
);

const PricingSidebar = ({ event }: { event: EventDetail }) => {
  const ticket = event.ticket;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const sameDay = event.endTime
  ? isSameDay(new Date(event.startTime), new Date(event.endTime))
  : true;
  return (
    <div className="sticky top-24 space-y-6">
      <div
        className={`${theme.bgSecondary} rounded-2xl p-6 border ${theme.borderLight} shadow-xl`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span
              className={`text-xs ${theme.textDark} opacity-60 font-semibold uppercase tracking-wider`}
            >
              {event.isPaid ? "Starting From" : "Free Event"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-3xl  ${theme.textDark}`}
              >
                {event.isPaid && ticket
                  ? `${ticket.currency === "INR" ? "₹" : "$"} ${ticket.price}`
                  : "Free"}
              </span>
            </div>
          </div>
          {ticket && ticket.spotsLeft <= 10 && (
            <span
              className={`${theme.highLightBgColor} text-white text-xs px-3 py-1 rounded-full`}
            >
              Only {ticket.spotsLeft} left
            </span>
          )}
        </div>

        <div className={`space-y-4 my-6 py-6 border-y ${theme.borderLight}`}>
          <div className={`flex items-center gap-3 text-sm ${theme.textDark}`}>
            <Calendar className="w-5 h-5 opacity-50" />
            <span>
              {formatDate(event.startTime)}
              {event.endTime && !sameDay ? ` — ${formatDate(event.endTime)}` : ""}
            </span>
          </div>
        </div>
        <ComingSoonWrapper>
          <button
            className={`${theme.buttonDark} w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-colors ease-linear`}
          >
            Enroll Now <ArrowRight className="w-5 h-5" />
          </button>
        </ComingSoonWrapper>
      </div>
    </div>
  );
};


// ── main export ────────────────────────────────────────────────────────────
export default function EventDetailsPage({eventId}:{eventId:string}) {

  const { data, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ["event-detail", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
  const { status: authStatus } = useSession();

  const content = (() => {
    if (isLoading) return <PageSkeleton type="events-detail-page" />;
    if (isError || !data)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-500">Event not found or unavailable.</p>
        </div>
      );

    // data is guaranteed PublicEventDetail here
    return (
      <div className="min-h-screen">
        <HeroSection event={data} />
        <main className="mx-auto px-4 md:px-6 py-16">
          <div className="flex flex-col lg:flex-row gap-12 xl:gap-20">
            <div className="flex-1 max-w-3xl order-2 lg:order-1">
              <section>
                <h2 className={`text-2xl sm:text-4xl mb-6 ${theme.textDark} ${cormorant.className} font-medium`}>
                  Nurture Your Flourishing
                </h2>
                <div
                  className="space-y-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: data.description ?? "" }}
                />
                <GuideCard event={data} />
              </section>
              <div className="mt-8 lg:hidden">
                <PricingSidebar event={data} />
              </div>
              <JourneyTimeline slots={data.agendaSlots} />
              {data.format === "IN_PERSON" && <SanctuaryLocation event={data} />}
            </div>
            <aside className="w-full lg:w-[400px] shrink-0 order-1 lg:order-2 hidden lg:block">
              <PricingSidebar event={data} />
            </aside>
          </div>
        </main>
      </div>
    );
  })();

  return authStatus === "authenticated" ? content : <AppLayout>{content}</AppLayout>;
}
