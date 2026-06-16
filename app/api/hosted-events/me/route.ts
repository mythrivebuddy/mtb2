// /api/hosted-events/me/route.ts
import { checkRole } from "@/lib/utils/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    // 1. Authenticate user
    const session = await checkRole(["USER"]);

    const creatorId = session.user.id;
    const now = new Date();

    // 2. Fetch events matching the user's schema
    const events = await prisma.hostedEvent.findMany({
      where: {
        creatorId,
        // Optionally filter by status if you only want active ones
        // status: "PUBLISHED"
      },
      include: {
        tickets: true, // Includes pricing and capacity (quantity)
        _count: {
          select: { enrollments: true }, // Accurately counts sold seats
        },
      },
      orderBy: {
        startTime: "desc", // Order by nearest upcoming event
      },
    });

    // 3. Initialize aggregation variables
    // let activeRegistrations = 0;
    // let totalRevenue = 0;

    // Filter for events happening in the future
    const upcomingEvents = events.filter(
      (e) => e.startTime && new Date(e.startTime) >= now,
    );
    const pastEvents = events.filter(
      (e) => e.startTime && new Date(e.startTime) < now,
    );
    const draftEvents = events.filter((e) => !e.startTime);
    const upcomingEventsCount = upcomingEvents.length;

    // 4. Format the active events for the frontend UI
    const activeEventsFormatted = upcomingEvents.slice(0, 3).map((event) => {
      // Get counts and ticket info based on schema relations
      const regCount = event._count?.enrollments || 0;
      //   activeRegistrations += regCount;

      // Extract ticket configuration (unique per event based on schema)
      const ticket = event.tickets?.[0];
      //   const price = ticket?.price || 0;
      const maxCapacity = ticket?.quantity || 0;

      const price = ticket?.price ?? null;
      const currency = ticket?.currency ?? "INR";

      // Calculate Revenue
      //   if (event.isPaid) {
      //     totalRevenue += price * regCount;
      //   }

      // Calculate days until the event for the UI badge
      const timeDiff = event.startTime
        ? new Date(event.startTime).getTime() - now.getTime()
        : Infinity;
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let badge = "UPCOMING";
      let badgeLight = true;

      if (daysUntil <= 7) {
        badge = `IN ${daysUntil} DAYS`;
        badgeLight = false; // Use the dark orange accent color
      } else if (daysUntil <= 30) {
        badge = "NEXT MONTH";
      }

      // Format location string cleanly based on Enum format
      const locationString =
        event.format === "IN_PERSON"
          ? event.venueName || event.address || "In Person"
          : "Online";

      return {
        id: event.id,
        title: event.title,
        date: `${event.startTime ? new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : ""} • ${locationString}`,
        progress: regCount,
        total: maxCapacity,
        price,
        currency,
        badge,
        badgeLight,
        imgSrc: event.coverImage || "/api/placeholder/400/200",
      };
    });
    const pastEventsFormatted = pastEvents.map((event) => {
      const regCount = event._count?.enrollments || 0;
      const ticket = event.tickets?.[0];
      const maxCapacity = ticket?.quantity || 0;
      const price = ticket?.price ?? null;
      const currency = ticket?.currency ?? "INR";
      const locationString =
        event.format === "IN_PERSON"
          ? event.venueName || event.address || "In Person"
          : "Online";

      return {
        id: event.id,
        title: event.title,
        date: `${event.startTime ? new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "TBD"} • ${locationString}`,
        progress: regCount,
        total: maxCapacity,
        price,
        currency,
        badge: "COMPLETED",
        badgeLight: true,
        imgSrc: event.coverImage || "/api/placeholder/400/200",
      };
    });
const draftEventsFormatted = draftEvents.map((event) => {
  const ticket = event.tickets?.[0];
  const maxCapacity = ticket?.quantity || 0;
  const price = ticket?.price ?? null;
  const currency = ticket?.currency ?? "INR";

  return {
    id: event.id,
    title: event.title,
    date: "Draft • Not scheduled",
    progress: 0,
    total: maxCapacity,
    price,
    currency,
    badge: "DRAFT",
    badgeLight: true,
    imgSrc: event.coverImage || "/api/placeholder/400/200",
  };
});
    // 5. Return structured payload for the frontend
    return NextResponse.json(
      {
        stats: {
          totalRevenue: "N/A", //`$${(totalRevenue / 1000).toFixed(1)}k`

          activeRegistrations: "N/A",
          upcomingEventsCount:
            upcomingEventsCount > 0 ? upcomingEventsCount : "N/A",
          averageRating: "N/A", // Mocked rating (requires a Review schema implementation)
        },
    activeEvents: [...draftEventsFormatted, ...activeEventsFormatted],
        pastEvents: pastEventsFormatted,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
};
