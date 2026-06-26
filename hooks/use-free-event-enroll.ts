// hooks/use-enroll-event.ts
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAxiosErrorMessage } from "@/utils/ax";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useReferralAndRedirect } from "./use-save-refferral-redirect";

type EventInput = {
  id: string;
  isPaid: boolean;
  isEnrolled?: boolean;
};

// 1. Define strict interfaces for our cache structures
interface EventCacheItem {
  id: string;
  isEnrolled?: boolean;
  // This safely allows other properties (title, creator, etc.) 
  // without breaking TypeScript's spread operators
  [key: string]: unknown; 
}

interface EventListCache {
  events: EventCacheItem[];
}

interface WrappedEventCache {
  event: EventCacheItem;
}

// The overall union type for the cache
type EventsCache = EventListCache | WrappedEventCache | EventCacheItem;

// 2. Create Type Guards to perfectly narrow the types
function isEventListCache(data: unknown): data is EventListCache {
  return typeof data === "object" && data !== null && "events" in data && Array.isArray((data as EventListCache).events);
}

function isWrappedEventCache(data: unknown): data is WrappedEventCache {
  return typeof data === "object" && data !== null && "event" in data && typeof (data as WrappedEventCache).event === "object";
}

function isDirectEventCache(data: unknown): data is EventCacheItem {
  return typeof data === "object" && data !== null && "id" in data && !("events" in data) && !("event" in data);
}

export function useEnrollFreeEvent(queryKeys: QueryKey[]) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { status } = useSession();

  const mutation = useMutation({
    mutationFn: async (eventId: string) => {
      setLoadingId(eventId);
      const res = await axios.post("/api/hosted-events/free-enroll", {
        eventId,
      });
      return res.data;
    },

    onMutate: async (eventId: string) => {
      const previousDataMap = new Map<QueryKey, EventsCache | undefined>();

      for (const key of queryKeys) {
        await queryClient.cancelQueries({ queryKey: key });

        const prev = queryClient.getQueryData<EventsCache>(key);
        previousDataMap.set(key, prev);

        queryClient.setQueryData<EventsCache>(key, (oldData) => {
          if (!oldData) return oldData;

          // Case A: A list of events (TypeScript now knows oldData is EventListCache)
          if (isEventListCache(oldData)) {
            return {
              ...oldData,
              events: oldData.events.map((e) =>
                e.id === eventId ? { ...e, isEnrolled: true } : e,
              ),
            };
          }

          // Case B: A wrapped single event (TypeScript now knows oldData is WrappedEventCache)
          if (isWrappedEventCache(oldData)) {
            return {
              ...oldData,
              event:
                oldData.event.id === eventId
                  ? { ...oldData.event, isEnrolled: true }
                  : oldData.event,
            };
          }

          // Case C: A direct single event (TypeScript now knows oldData is EventCacheItem)
          if (isDirectEventCache(oldData) && oldData.id === eventId) {
            return {
              ...oldData,
              isEnrolled: true,
            };
          }

          return oldData;
        });
      }

      return { previousDataMap };
    },

    onError: (err, _, context) => {
      toast.error(getAxiosErrorMessage(err) || "Failed to enroll");

      if (context?.previousDataMap) {
        for (const [key, data] of context.previousDataMap.entries()) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSuccess: () => {
      toast.success("Enrolled successfully 🎉");
    },
    onSettled: () => {
      setLoadingId(null);
    },
  });
const {setCallbackUrl} =useReferralAndRedirect()

  const freeEnroll = (event: EventInput) => {
    if (status === "unauthenticated") {
      setCallbackUrl(`${window.location.origin}/dashboard/membership/checkout?eventId=${event.id}&context=HOSTED_EVENT`);
      router.push(
        `/dashboard/membership/checkout?eventId=${event.id}&context=HOSTED_EVENT`,
      );
      return;
    }

    if (status === "loading") return;
    if (event.isEnrolled) return;

    if (!event.isPaid) {
      mutation.mutate(event.id);
    } else {
      router.push(
        `/dashboard/membership/checkout?eventId=${event.id}&context=HOSTED_EVENT`,
      );
    }
  };

  return {
    freeEnroll,
    loadingId,
  };
}