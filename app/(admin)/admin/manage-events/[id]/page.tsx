import EventDetailsPage from "@/components/hosted-events/event-details/EventDetails.page";
import {prisma} from "@/lib/prisma"
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchEventForMeta(id: string) {
  try {
    const event = await prisma.hostedEvent.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        coverImage: true,
      },
    });
    return event;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEventForMeta(id);
  if (!event) {
    return {
      title: "Event | MTB",
      description: "Explore transformative events and retreats.",
    };
  }

  const title = `${event.title} | MyThriveBuddy`;
  const description = event.description
    ? event.description.replace(/<[^>]*>/g, "").slice(0, 160) // strip HTML tags
    : ``;
  const image =
    event.coverImage ?? `${process.env.NEXT_PU_URL}/new-home-assets/new-logo.png`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "MTB",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}
export default async function AdminEventDetailPage({ params }: Props) {
  const { id } = await params;
    return <EventDetailsPage eventId={id} />;
}