// Hosted event client types
export type AgendaSlot = {
  id: string;
  eventId: string;
  day: number;
  time: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};
export type AgendaSlotPayload = Omit<AgendaSlot, "eventId" | "createdAt" | "updatedAt" | "id"> & { id?: string };

export type HostedEvent = {
  id: string;
  title: string;
  description: string | null;
  type: "RETREAT" | "WEBINAR" | "WORKSHOP" | "ONE_ON_ONE" | "COURSE" | "OTHER";

  coverImage: string | null;

  format: "IN_PERSON" | "ONLINE" | null;

  venueName: string | null;
  address: string | null;
  travelInstructions: string | null;

  meetingLink: string | null;
  meetingPlatform: string | null;

  startTime: string;
  endTime: string | null;
  timeZone: string | null;
  isPaid: boolean;

  resources: string | null;
  resourcesVisibility: "PUBLIC" | "PRIVATE";

  creatorId: string;
  status: "DRAFT" | "PUBLISHED";

  createdAt: string;
  updatedAt: string;

  ticket: {
    id: string;
    eventId: string;
    price: number;
    quantity: number;
    currency: "INR" | "USD" | null;
    createdAt: string;
    updatedAt: string;
  };

  agendaSlots: AgendaSlot[]; // you can type later

  creator: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type HostedEventResponse = {
  event: HostedEvent;
    ticket: {
    id: string;
    eventId: string;
    price: number;
    quantity: number;
    currency: "INR" | "USD";
    createdAt: string;
    updatedAt: string;
  } | null;
};

