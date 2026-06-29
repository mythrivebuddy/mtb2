"use client";

import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import { cormorant } from "@/lib/new-home/fonts/fonts";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import { useSession } from "next-auth/react";
import PageSkeleton from "@/components/PageSkeleton";
import Share from "@/components/common/ShareModal";
import { AgendaSlot, HostedEvent } from "@/types/client/events";
import { isSameDay } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useEnrollFreeEvent } from "@/hooks/use-free-event-enroll";
import assets from "@/lib/constants/assets";
import SafeHTML from "@/components/common/SafeHTML";
import { useReferralAndRedirect } from "@/hooks/use-save-refferral-redirect";
import { MtbTriBloomIcon } from "@/icons/mtb-icons";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/mtb/stepper";

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
    isEnrolled?: boolean;
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
const HeroSection = ({ event }: { event: EventDetail }) => {
  const session = useSession();
  const ref = session?.data?.user?.referralCode;

  const eventPath = `/dashboard/events/${event.id}${ref ? `?ref=${ref}` : ""}`;

  const eventUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${eventPath}`
      : eventPath;
  return (
    <section className="relative h-[60vh] min-h-[491px] sm:min-h-[632px] w-full flex items-end pb-20">
      <Image
        src={event?.coverImage ?? assets.logo.current}
        alt={event.title}
        fill
        className="object-cover object-center"
        priority
        quality={100}
        unoptimized
      />

      {/* The "Blackish" Overlay: Gradient from 80% black at the bottom to transparent at the top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />

      {/* Share button top-right */}
      <div className="absolute top-4 right-4 z-20">
        <Share url={eventUrl} title={event.title} buttonLabel="Share" />
      </div>

      {/* Content Container: 
    - flex flex-col items-center text-center (Centers on mobile)
    - md:items-start md:text-left (Aligns left on screens md and up)
  */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col items-center text-center md:items-start md:text-left">
        <div
          className={`text-base font-semibold ${cormorant.className} ${theme.bg.base} ${theme.chip} ${theme.text.accent} inline-flex items-center gap-2 mb-6 border-none`}
        >
          <MtbTriBloomIcon className="w-4 h-4" />{" "}
          {event.type.replace(/_/g, " ")}
        </div>

        <h1
          className={`${theme.typography.h1} text-white text-3xl md:text-4xl lg:text-6xl  max-w-2xl drop-shadow-md mb-6 sm:mb-5`}
        >
          {event.title}
        </h1>
        {event.resources && (
          <Button
            variant="mtbSecondary"
            size="mtbPill"
            onClick={() =>
              window.open(event.resources!, "_blank", "noopener,noreferrer")
            }
          >
            View Resource <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </section>
  );
};

const GuideCard = ({ event }: { event: EventDetail }) => {
  const bp = event.creator.businessProfile;
  return (
    <div
      className={`${theme.bg.warm} p-6 md:p-8 rounded-2xl border ${theme.border.muted} shadow-md mt-8`}
    >
      <Link
        href={`/profile/${event.creator.id}`}
        target="_blank"
        className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start"
      >
        <Image
          src={event.creator.image ?? ""}
          alt={event.creator.name}
          width={128}
          height={128}
          className="rounded-full object-cover shadow-md w-32 h-32"
        />
        <div>
          <h3 className={`text-2xl mb-3  ${cormorant.className} font-semibold`}>
            {event.creator.name}
            {bp?.tagline ? `, ${bp.tagline}` : ""}
          </h3>
          <p
            className={`${theme.text.tertiary} max-w-2xl sm:max-w-xl leading-relaxed text-sm md:text-base`}
          >
            {bp?.shortBio ?? event.creator.bio ?? ""}
          </p>
        </div>
      </Link>
    </div>
  );
};

const JourneyTimeline = ({ slots }: { slots: AgendaSlot[] }) => {
  // Group slots by day
  const grouped = slots.reduce<Record<number, AgendaSlot[]>>((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  const days = Object.entries(grouped).map(([day, events]) => ({
    dayNumber: String(day).padStart(2, "0"),
    label: `Day ${day}`,
    events,
  }));

  const itinerarySteps = days.map((day) => ({
    icon: <span>{day.dayNumber}</span>,
    label: (
      <h3
        className={`text-xl sm:text-2xl md:text-3xl  ${cormorant.className} font-medium`}
      >
        {day.label}
      </h3>
    ),
    description: (
      <div className="mt-4 space-y-6 pb-2 w-full">
        {day.events.map((event) => (
          <div key={event.id}>
            <div className="flex flex-col text-base sm:flex-row  sm:gap-12">
              <span
                className={`${theme.text.accent} font-medium text-base sm:w-24 shrink-0`}
              >
                {event.time}
              </span>
              <span className={`font-semibold sm:flex-1 sm:text-end`}>
                {event.title}
              </span>
            </div>
            <div className="mt-2 border-t border-gray-200" />
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div className="mt-14 sm:mt-20">
      <h2
        className={`text-3xl sm:text-4xl mb-8 sm:mb-10 ${cormorant.className} font-medium`}
      >
        The Journey Timeline
      </h2>

      <Stepper
        steps={itinerarySteps}
        currentStep={1}
        variant="vertical"
        readOnly={true} // Forces all lines/circles to active color, disables clicking
        className="pl-2"
      />
    </div>
  );
};

const SanctuaryLocation = ({ event }: { event: EventDetail }) => (
  <div className="mt-16">
    <h2
      className={`text-3xl sm:text-4xl mb-8 ${cormorant.className} font-medium`}
    >
      The Sanctuary Location
    </h2>
    <div className="flex flex-col md:flex-row gap-6">
      <div
        className={`w-full ${theme.bg.calm} rounded-xl p-8 flex flex-col items-center justify-center text-center border ${theme.borderLight}`}
      >
        <MapPin className={`w-8 h-8 ${theme.text.accent} mb-4`} />
        <h4 className={`font-semibold text-sm mb-2`}>
          {event.venueName ?? "Venue TBD"}
        </h4>
        <p className={`opacity-70 text-sm mb-4`}>{event.address ?? ""}</p>
        {event.address && (
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event?.venueName} ${event?.address}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${theme.text.accent} font-medium text-sm flex items-center gap-1`}
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
  const isEnrolled = event.isEnrolled;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const sameDay = event.endTime
    ? isSameDay(new Date(event?.startTime), new Date(event.endTime))
    : true;

  const isEventOver = new Date(event?.startTime) < new Date();

  const queryKeys = useMemo(
    () => [["all-events"], ["event-detail", event.id]],
    [event.id],
  );
  const session = useSession();
  const { freeEnroll, loadingId } = useEnrollFreeEvent(queryKeys);
  return (
    <div className="sticky top-24 space-y-6">
      <div
        className={`${theme.bgSecondary} rounded-2xl p-6 border ${theme.borderLight} shadow-xl`}
      >
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`text-xs ${theme.text.accent} uppercase tracking-wider`}
            >
              {event.isPaid ? "Starting From" : "Free Event"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-3xl`}>
                {event.isPaid && ticket
                  ? `${ticket.currency === "INR" ? "₹" : "$"}${ticket.price}`
                  : "Free"}
              </h3>
            </div>
          </div>
          {ticket && (
            <span
              className={`${theme.bg.accent} whitespace-nowrap ${theme.text.inverse} text-xs px-1 sm:px-3 py-1 mt-1 rounded-full`}
            >
              Only {ticket.spotsLeft} left
            </span>
          )}
        </div>

        <div className={`py-3 sm:py-6 `}>
          <div className={`flex py-1 sm:py-2 items-center gap-3 text-base`}>
            <Calendar className="w-5 h-5" />
            <span>
              {event.startTime ? formatDate(event.startTime) : "Not Scheduled"}
              {event.endTime && !sameDay
                ? ` — ${formatDate(event.endTime)}`
                : ""}
            </span>
          </div>
        </div>

        {event.status == "PUBLISHED" && (
          <Button
            variant="mtbPrimary"
            size="mtbPill"
            width="full"
            disabled={isEnrolled || loadingId === event.id || isEventOver}
            onClick={() => {
              if (session.data?.user.role === "ADMIN") {
                toast.error("Admins cannot enroll for events");
                return;
              }
              freeEnroll({
                id: event.id,
                isPaid: event.isPaid,
                isEnrolled: event.isEnrolled,
              });
            }}
            className={`${
              isEnrolled || isEventOver ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {loadingId === event.id ? (
              "Enrolling..."
            ) : event.isEnrolled ? (
              "You are enrolled"
            ) : isEventOver ? (
              "Enrollment Closed"
            ) : event.isPaid ? (
              <>
                Enroll Now <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              "Enroll for Free"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// ── main export ────────────────────────────────────────────────────────────
export default function EventDetailsPage({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  useReferralAndRedirect();

  const { data, isLoading, isError } = useQuery<EventDetail>({
    queryKey: ["event-detail", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
  const { status: authStatus } = useSession();
  useEffect(() => {
    const payment = searchParams.get("payment");
    const orderId = searchParams.get("orderId");

    if (payment === "success" && orderId) {
      toast.success("Payment successful! You are now enrolled.");

      // Clean up the URL so the toaster doesn't refire on refresh
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);
    useEffect(() => {
    // if (sessionStorage.getItem("deferGettingStarted") === "true") return;
    sessionStorage.setItem("deferGettingStarted", "false");
    window.dispatchEvent(new Event("show-getting-started"));
  }, []);
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
      <div className="min-h-screen px-4">
        <HeroSection event={data} />
        <main className="mx-auto  py-12">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
            <div className="flex-1 min-w-0 order-2 lg:order-1">
              <section>
                <h2
                  className={`text-3xl sm:text-4xl mb-8 sm:mb-10 ${theme.textDark} ${cormorant.className} font-medium `}
                >
                  {data.title}
                </h2>
                <SafeHTML
                  className="prose prose-sm  max-w-none text-base text-gray-700 dark:prose-invert dark:text-slate-300 space-y-4 leading-relaxed"
                  html={data.description}
                />
                <GuideCard event={data} />
              </section>
              <div className="mt-8 lg:hidden">
                <PricingSidebar event={data} />
              </div>
              {data?.agendaSlots?.length != 0 && (
                <JourneyTimeline slots={data.agendaSlots} />
              )}

              {data.format === "IN_PERSON" && (
                <SanctuaryLocation event={data} />
              )}
            </div>
            <aside className="w-full lg:w-[340px] shrink-0 order-1 lg:order-2 hidden lg:block">
              <PricingSidebar event={data} />
            </aside>
          </div>
        </main>
      </div>
    );
  })();

  return authStatus === "authenticated" ? (
    content
  ) : (
    <AppLayout>{content}</AppLayout>
  );
}
