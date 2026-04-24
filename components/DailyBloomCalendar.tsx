//components/DailyBloomCalendar.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
  DateClickArg,
  EventResizeDoneArg,
} from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { DailyBloom } from "@/types/client/daily-bloom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import confetti from "canvas-confetti";
import { useSupabase } from "./providers/SupabaseClientProvider";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// ---------------- Types ----------------

interface EventPayload {
  id: number;
  title: string;
  start: string;
  end?: string | null;
  description?: string | null;
  isBloom?: boolean;
  isCompleted?: boolean;
  allDay?: boolean;
}

interface EventExtendedProps {
  description?: string;
  isBloom?: boolean;
  isCompleted?: boolean;
  category?: "holiday" | string;
  lastTime?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  extendedProps?: EventExtendedProps;
}

interface Props {
  blooms?: DailyBloom[];
  events: CalendarEvent[];
  onCreateBloomFromEvent: (payload: {
    title: string;
    description?: string;
    dueDate?: string;
    end?: string;
    isCompleted?: boolean;
  }) => void | Promise<void>;
  onUpdateBloomFromEvent: (payload: {
    id: string;
    updatedData: {
      title?: string;
      description?: string;
      dueDate?: string;
      end?: string;
      isCompleted?: boolean;
      startTime?: string;
      endTime?: string;
    };
  }) => void;
  onDeleteBloomFromEvent: (bloomId: string) => void;
}

// ---------------- Helpers ----------------
const canMarkCompleted = (start?: string, allDay?: boolean) => {
  if (!start) return false;

  const now = new Date();

  // For all-day → allow only if today or past
  if (allDay) {
    const today = new Date();
    const eventDate = new Date(start);

    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  }

  // Normal event → check full datetime
  const startDate = new Date(start);
  return now >= startDate;
};

const parseLocal = (dateTime: string) => {
  const [date, time] = dateTime.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = (time || "00:00").split(":").map(Number);

  return new Date(y, m - 1, d, h, min);
};
// ---------------- Validation ----------------
const validateDateTime = (
  start: string,
  end?: string,
  allDay?: boolean, // ✅ add this
): { valid: boolean; message: string | null } => {
  if (!start) return { valid: true, message: null };

  // ✅ FIX: skip time validation for all-day
  if (allDay) {
    return { valid: true, message: null };
  }

  const now = new Date();

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;

  const startDate = parseLocal(start);
  const endDate = end ? parseLocal(end) : null;

  const startDateStr = start.slice(0, 10);

  if (startDateStr < todayStr) {
    return { valid: false, message: "Date cannot be in the past" };
  }

  const isSameDay = startDateStr === todayStr;
  console.log({
    isSameDay,
    startDate,
    now,
  });

  if (isSameDay && startDate < now) {
    return { valid: false, message: "Start time cannot be in the past" };
  }

  if (endDate && endDate <= startDate) {
    return { valid: false, message: "End must be after start" };
  }

  return { valid: true, message: null };
};

const getNearestHourLocal = () => {
  const now = new Date();

  // Always go to next hour
  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);

  return toLocalInput(now.toString());
};
const addOneHour = (dateStr: string) => {
  const d = new Date(dateStr);
  return toLocalInput(new Date(d.getTime() + 60 * 60 * 1000).toString());
};

const toLocalInput = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
};

const isTempId = (id?: string | number | null) =>
  typeof id === "string" && id.startsWith("tmp-");

const toCalendarEventFromServer = (row: EventPayload): CalendarEvent => ({
  id: String(row.id),
  title: row.title || "Untitled",
  start: row.start,
  end: row.end || undefined,
  allDay: row.allDay ?? (!row.end && !row.start?.includes("T")),
  color: row.isBloom ? "#4dabf7" : "#2ecc71",
  extendedProps: {
    description: row.description || "",
    isBloom: !!row.isBloom,
    isCompleted: !!row.isCompleted,
  },
});

// ----- CHANGE: Replaced useIsMobile and useEffect with a single robust hook -----
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};
// ----- END CHANGE -----

// ---------------- Event Form Component ----------------
const EventForm = ({
  currentEvent,
  setCurrentEvent,
  isSubmitting,
}: {
  currentEvent: CalendarEvent;
  setCurrentEvent: (event: CalendarEvent) => void;
  mode: "view" | "create" | null;
  isEditing: boolean;
  isSubmitting: boolean;
}) => {
  const [timeError, setTimeError] = useState<string | null>(null);

  // 1. Move time extraction BEFORE generating the options
  const timePart = currentEvent.start?.includes("T")
    ? currentEvent.start.split("T")[1]?.slice(0, 5)
    : currentEvent.extendedProps?.lastTime?.slice(0, 5) ||
      getNearestHourLocal().split("T")[1]?.slice(0, 5);

  const endTimePart = currentEvent.end?.includes("T")
    ? currentEvent.end.split("T")[1]?.slice(0, 5)
    : "";

  // 2. Update the generator to use a Set and inject the exact times
  const generateTimeOptions = () => {
    const times = new Set<string>();

    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const hour = h.toString().padStart(2, "0");
        const min = m.toString().padStart(2, "0");
        times.add(`${hour}:${min}`);
      }
    }

    // Ensure the event's specific start and end times exist in the dropdown
    if (timePart) times.add(timePart);
    if (endTimePart) times.add(endTimePart);

    // Return as an array and sort them chronologically
    return Array.from(times).sort();
  };

  const timeOptions = generateTimeOptions();
  // const timePart = currentEvent.start?.includes("T")
  //   ? currentEvent.start.split("T")[1]?.slice(0, 5)
  //   : currentEvent.extendedProps?.lastTime?.slice(0, 5) ||
  //     getNearestHourLocal().split("T")[1]?.slice(0, 5);

  // const endTimePart = currentEvent.end?.includes("T")
  //   ? currentEvent.end.split("T")[1]?.slice(0, 5)
  //   : "";
  const isCompleted = currentEvent.extendedProps?.isCompleted;
  const isDisabled = isSubmitting || isCompleted;
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={currentEvent.title}
          onChange={(e) =>
            setCurrentEvent({ ...currentEvent, title: e.target.value })
          }
          disabled={isDisabled}
          placeholder="Event Title"
          className="text-sm"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={currentEvent.extendedProps?.description || ""}
          onChange={(e) =>
            setCurrentEvent({
              ...currentEvent,
              extendedProps: {
                ...currentEvent.extendedProps,
                description: e.target.value,
              },
            })
          }
          disabled={isDisabled}
          placeholder="Optional details..."
          className="text-sm"
        />
      </div>
      <div className="grid gap-2">
        <Label>Due Date</Label>

        <div className="flex gap-2">
          {/* DATE */}
          <Input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={currentEvent.start.slice(0, 10)}
            onChange={(e) => {
              const date = e.target.value;

              const timePart = currentEvent.start?.includes("T")
                ? currentEvent.start.split("T")[1]?.slice(0, 5)
                : getNearestHourLocal().split("T")[1]?.slice(0, 5);

              const newStart = `${date}T${timePart}`;
              const newEnd =
                currentEvent.end &&
                new Date(currentEvent.end) > new Date(newStart)
                  ? currentEvent.end
                  : addOneHour(newStart);

              setCurrentEvent({
                ...currentEvent,
                start: newStart,
                end: newEnd,
              });

              const result = validateDateTime(
                newStart,
                newEnd,
                currentEvent.allDay,
              );
              setTimeError(result.message);
            }}
            disabled={isDisabled}
          />

          {/* TIME (24H DROPDOWN) */}
          <Select
            value={timePart}
            onValueChange={(time) => {
              const date = currentEvent.start?.includes("T")
                ? currentEvent.start.split("T")[0]
                : new Date().toISOString().slice(0, 10);

              const newStart = `${date}T${time}`;
              const newEnd = addOneHour(newStart);
              setCurrentEvent({
                ...currentEvent,
                start: newStart,
                end: newEnd,
              });
              const result = validateDateTime(
                newStart,
                newEnd,
                currentEvent.allDay,
              );
              setTimeError(result.message);
            }}
          >
            <SelectTrigger className="w-[110px]" disabled={isDisabled}>
              <SelectValue placeholder="Time" />
            </SelectTrigger>

            <SelectContent className="max-h-60 overflow-y-auto">
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!currentEvent.allDay && (
        <div className="flex gap-2">
          {/* END DATE */}
          <Input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={
              currentEvent.end
                ? currentEvent.end.slice(0, 10)
                : currentEvent.start.slice(0, 10)
            }
            onChange={(e) => {
              const date = e.target.value;
              const time = endTimePart || timePart;

              const newEnd = `${date}T${time}`;

              setCurrentEvent({
                ...currentEvent,
                end: newEnd,
              });
              const result = validateDateTime(currentEvent.start, newEnd);
              setTimeError(result.message);
            }}
            disabled={isDisabled}
          />

          {/* END TIME DROPDOWN */}
          <Select
            value={endTimePart}
            onValueChange={(time) => {
              const date = currentEvent.end?.includes("T")
                ? currentEvent.end.split("T")[0]
                : currentEvent.start.split("T")[0];

              const newEnd = `${date}T${time}`;

              setCurrentEvent({
                ...currentEvent,
                end: newEnd,
              });
              const result = validateDateTime(currentEvent.start, newEnd);
              setTimeError(result.message);
            }}
          >
            <SelectTrigger className="w-[110px]" disabled={isDisabled}>
              <SelectValue placeholder="End Time" />
            </SelectTrigger>

            <SelectContent className="max-h-60 overflow-y-auto">
              {timeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="all-day"
          checked={currentEvent.allDay || false}
          onCheckedChange={(val) => {
            const isAllDay = val as boolean;
            let newStart = currentEvent.start;
            let newEnd: string | undefined = currentEvent.end;
            let newExtendedProps = { ...currentEvent.extendedProps };

            if (isAllDay) {
              // Capture time NOW into a local variable before stripping
              const existingTime = currentEvent.start.includes("T")
                ? currentEvent.start.split("T")[1]
                : "09:00";

              newStart = currentEvent.start;
              newEnd = undefined;
              newExtendedProps = {
                ...newExtendedProps,
                lastTime: existingTime,
              };
            } else {
              // 👇 FIX: Check if a time was already selected in the dropdown first
              const currentTimeInStart = currentEvent.start.includes("T")
                ? currentEvent.start.split("T")[1]
                : null;

              // Use the currently selected time, or fall back to lastTime / nearest hour
              const restoredTime =
                currentTimeInStart ||
                currentEvent.extendedProps?.lastTime ||
                getNearestHourLocal().split("T")[1];

              newStart = `${currentEvent.start.slice(0, 10)}T${restoredTime}`;

              if (!newEnd) {
                newEnd = addOneHour(newStart);
              }
            }

            // Single setCurrentEvent call with everything updated together
            setCurrentEvent({
              ...currentEvent,
              start: newStart,
              end: newEnd,
              allDay: isAllDay,
              extendedProps: newExtendedProps,
            });
          }}
          disabled={isDisabled}
        />
        <Label htmlFor="all-day">All Day Event</Label>
      </div>
    </div>
  );
};

// ---------------- Main Component ----------------

const DailyBloomCalendar: React.FC<Props> = ({
  events: eventsProp,
  onCreateBloomFromEvent,
  onUpdateBloomFromEvent,
  onDeleteBloomFromEvent,
}) => {
  // ----- CHANGE: Using the new useMediaQuery hook -----
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTabletOrBelow = useMediaQuery("(max-width: 1024px)");
  // ----- END CHANGE -----

  const [events, setEvents] = useState<CalendarEvent[]>(eventsProp);
  const [quickText, setQuickText] = useState("");
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [mode, setMode] = useState<"view" | "create" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const supabaseClient = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form button loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastDeletedEvent, setLastDeletedEvent] =
    useState<CalendarEvent | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dragDebounceRef = useRef<number | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);
  const resizeViewDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    console.log(
      "PROPS_CHANGED: eventsProp has changed. Overwriting local events state.",
      eventsProp,
    );
    setEvents(eventsProp);
    setIsLoading(false);
  }, [eventsProp]);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!supabaseClient) return;

    const channel = supabaseClient
      .channel("public:Event")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Event" },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT": {
              const newRow = payload.new as EventPayload;
              if (!("id" in newRow)) break;

              const newEvent = toCalendarEventFromServer(newRow);

              setEvents((prev) => {
                // Find if an optimistic event (with a 'tmp-' ID) exists
                const tempEventIndex = prev.findIndex((e) =>
                  e.id.startsWith("tmp-"),
                );

                if (tempEventIndex !== -1) {
                  // If a temporary event is found, replace it with the new server event
                  const updatedEvents = [...prev];
                  updatedEvents[tempEventIndex] = newEvent;
                  return updatedEvents;
                }

                // If no temp event, check if the event already exists to prevent duplicates
                if (prev.some((e) => e.id === newEvent.id)) {
                  return prev;
                }

                // Otherwise, it's a new event from another client, so add it
                return [...prev, newEvent];
              });
              break;
            }

            case "UPDATE": {
              const newRow = payload.new as EventPayload;
              if (!("id" in newRow)) break;
              const updatedEvent = toCalendarEventFromServer(newRow);
              setEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)),
              );
              break;
            }

            case "DELETE": {
              const oldRow = payload.old as { id: number };
              if (!oldRow || !("id" in oldRow)) break;
              setEvents((prev) =>
                prev.filter((e) => e.id !== String(oldRow.id)),
              );
              break;
            }
          }
        },
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      if (realtimeRef.current?.unsubscribe) {
        supabaseClient.removeChannel(realtimeRef.current);
        realtimeRef.current.unsubscribe();
      }
    };
  }, [supabaseClient]);

  // view updates on resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    const updateView = () => {
      const w = window.innerWidth;
      if (w < 640) {
        calendarApi.changeView("listWeek");
      } else if (w < 768) {
        calendarApi.changeView("timeGridDay");
      } else if (w < 1024) {
        calendarApi.changeView("timeGridWeek");
      } else {
        calendarApi.changeView("dayGridMonth");
      }
    };
    const timerId = setTimeout(updateView, 0);

    const debouncedUpdateView = () => {
      if (resizeViewDebounceRef.current)
        window.clearTimeout(resizeViewDebounceRef.current);
      resizeViewDebounceRef.current = window.setTimeout(updateView, 300);
    };
    window.addEventListener("resize", debouncedUpdateView);

    return () => {
      window.removeEventListener("resize", debouncedUpdateView);
      clearTimeout(timerId);
      if (resizeViewDebounceRef.current)
        window.clearTimeout(resizeViewDebounceRef.current);
    };
  }, []);

  const handleCloseModal = useCallback(() => {
    setMode(null);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentEvent || !currentEvent.title.trim()) return;
    const result = validateDateTime(currentEvent.start, currentEvent.end);

    if (!result.valid) {
      toast.error(result.message);
      return;
    }
    setIsSaving(true);

    setEvents((prev) => [...prev, currentEvent]);
    handleCloseModal();

    try {
      // Delegate creation entirely to the parent component.
      // The parent's react-query `onMutate` will handle the optimistic update.
      await onCreateBloomFromEvent({
        title: currentEvent.title,
        description: currentEvent.extendedProps?.description || "",
        dueDate: currentEvent.start,
        isCompleted: false,
        end: currentEvent.end,
      });
      handleCloseModal();
    } catch (err) {
      console.error("Error creating event:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save event.",
      );
      // --- FIX: Revert on Failure ---
      // 4. If the API call fails, remove the optimistically added event.
      setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
    } finally {
      setIsSaving(false);
    }
  }, [currentEvent, onCreateBloomFromEvent, handleCloseModal]);

  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
      if (
        e.key === "Enter" &&
        mode === "create" &&
        currentEvent?.title.trim()
      ) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, currentEvent, isEditing, handleSave, handleCloseModal]);

  const handleDateClick = useCallback((info: DateClickArg) => {
    let start: string;

    if (info.allDay) {
      const time =
        currentEvent?.extendedProps?.lastTime ||
        getNearestHourLocal().split("T")[1];

      start = `${info.dateStr}T${time}`; // ✅ attach time
    } else {
      start = getNearestHourLocal();
    }
    const isAllDay = info.allDay;
    //  start = isAllDay ? startStr.slice(0, 10) : startStr;
    const end = isAllDay ? undefined : addOneHour(start);
    setCurrentEvent({
      id: `tmp-${Date.now()}`,
      title: "",
      start,
      end,
      allDay: isAllDay,
      color: "#4dabf7",
      extendedProps: { description: "", isBloom: true, isCompleted: false },
    });
    setMode("create");
    setIsEditing(false);
  }, []);

  const handleQuickAdd = useCallback(async () => {
    if (!quickText.trim()) return;

    const textToSubmit = quickText;
    const tempId = `tmp-${Date.now()}`;

    // --- FIX START: Get local date string instead of UTC ---
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const todayDateString = `${year}-${month}-${day}`;
    // --- FIX END ---

    const newEvent: CalendarEvent = {
      id: tempId,
      title: textToSubmit,
      start: todayDateString, // Use the correct local date string
      allDay: true,
      color: "#4dabf7",
      extendedProps: {
        description: "Quick add",
        isBloom: true,
        isCompleted: false,
      },
    };

    setQuickText("");
    setEvents((prev) => [...prev, newEvent]);

    try {
      await onCreateBloomFromEvent({
        title: textToSubmit,
        description: "Quick add",
        dueDate: todayDateString, // Use the correct local date string
        isCompleted: false,
      });
    } catch (err) {
      console.error("Quick add error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Quick add failed.");
      setQuickText(textToSubmit);
      setEvents((prev) => prev.filter((e) => e.id !== tempId));
    }
  }, [quickText, onCreateBloomFromEvent]);

  const handleComplete = useCallback(
    async (id: string) => {
      setIsCompleting(true);

      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, extendedProps: { ...e.extendedProps, isCompleted: true } }
            : e,
        ),
      );

      try {
        const eventObj = events.find((e) => e.id === id);

        if (eventObj?.extendedProps?.isBloom) {
          // ✅ BLOOM → correct API
          await onUpdateBloomFromEvent({
            id: id.replace(/^bloom-/, ""),
            updatedData: {
              isCompleted: true,
            },
          });
        } else {
          // ✅ EVENT → correct API
          const response = await fetch("/api/events", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: id.replace(/^event-/, ""),
              isCompleted: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
          }
        }

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        handleCloseModal();
      } catch (err) {
        console.error(err);

        // revert UI
        setEvents((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  extendedProps: { ...e.extendedProps, isCompleted: false },
                }
              : e,
          ),
        );

        setErrorMessage("Failed to mark completed.");
      } finally {
        setIsCompleting(false);
      }
    },
    [events, onUpdateBloomFromEvent, handleCloseModal],
  );

  const handleUpdate = useCallback(async () => {
    if (!currentEvent) return;
    const result = validateDateTime(
      currentEvent.start,
      currentEvent.end,
      currentEvent.allDay,
    );

    if (!result.valid) {
      toast.error(result.message);
      return;
    }
    setIsSaving(true);

    if (currentEvent.extendedProps?.isBloom) {
      const isAllDay = currentEvent.allDay;
      // --- FIX START ---
      // Optimistically update the local events state to immediately reflect UI changes.
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === currentEvent.id ? { ...currentEvent } : event,
        ),
      );
      // --- FIX END ---

      // This calls the parent component's mutation to save to the database.
      onUpdateBloomFromEvent({
        id: currentEvent.id.replace(/^bloom-/, ""),
        updatedData: {
          title: currentEvent.title,
          description: currentEvent.extendedProps?.description,
          dueDate: currentEvent.start,
          end: currentEvent.end,
          startTime: currentEvent.start
            ? new Date(currentEvent.start).toISOString().slice(11, 16)
            : "",
          endTime: isAllDay
            ? undefined
            : currentEvent.end
              ? new Date(currentEvent.end).toISOString().slice(11, 16)
              : undefined,
        },
      });

      setIsSaving(false);
      handleCloseModal();
      return;
    }

    // The rest of the function for handling non-bloom events remains the same.
    try {
      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentEvent.id.replace(/^event-/, ""),
          title: currentEvent.title,
          description: currentEvent.extendedProps?.description,
          start: currentEvent.start,
          end: currentEvent.end,
          isBloom: currentEvent.extendedProps?.isBloom,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error updating event:", err);
      setErrorMessage("Failed to update event.");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentEvent, handleCloseModal, onUpdateBloomFromEvent]);

  const handleConfirmDelete = useCallback(async () => {
    if (!currentEvent) return;
    setIsSubmitting(true);
    const originalEvents = [...events];

    setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
    setLastDeletedEvent(currentEvent);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    handleCloseModal();

    const finallyBlock = () => setIsSubmitting(false);

    if (currentEvent.extendedProps?.isBloom) {
      try {
        onDeleteBloomFromEvent(currentEvent.id.replace(/^bloom-/, ""));
        undoTimerRef.current = window.setTimeout(
          () => setLastDeletedEvent(null),
          6000,
        );
      } catch (err) {
        console.error("Error calling onDeleteBloomFromEvent:", err);
        setEvents(originalEvents);
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to delete bloom.",
        );
        setLastDeletedEvent(null);
      } finally {
        finallyBlock();
      }
      return;
    }

    try {
      const resp = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentEvent.id.replace(/^event-/, "") }),
      });
      if (!resp.ok) {
        const json = await resp.json();
        throw new Error(json?.message || "Failed to delete event");
      }
      undoTimerRef.current = window.setTimeout(
        () => setLastDeletedEvent(null),
        6000,
      );
    } catch (err) {
      console.error("Error deleting event:", err);
      setEvents(originalEvents);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete event.",
      );
      setLastDeletedEvent(null);
    } finally {
      finallyBlock();
    }
  }, [currentEvent, events, handleCloseModal, onDeleteBloomFromEvent]);

  const handleUndoDelete = useCallback(async () => {
    if (!lastDeletedEvent) return;
    const wasTemp = isTempId(lastDeletedEvent.id);
    setEvents((prev: CalendarEvent[]) => [...prev, lastDeletedEvent]);
    setLastDeletedEvent(null);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    if (wasTemp) return;
    try {
      const payload = {
        title: lastDeletedEvent.title,
        start: lastDeletedEvent.start,
        end: lastDeletedEvent.end ?? null,
        description: lastDeletedEvent.extendedProps?.description || "",
        isBloom: lastDeletedEvent.extendedProps?.isBloom || false,
        isCompleted: lastDeletedEvent.extendedProps?.isCompleted || false,
        allDay: lastDeletedEvent.allDay ?? false,
      };
      const resp = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (!resp.ok)
        throw new Error(json?.message || "Failed to recreate event");
      const serverEvent = toCalendarEventFromServer(json.data);
      setEvents((prev) =>
        prev.map((e) => (e.id === lastDeletedEvent.id ? serverEvent : e)),
      );
    } catch (err) {
      console.error("Undo re-create error:", err);
      setErrorMessage("Undo succeeded locally but server re-create failed.");
    }
  }, [lastDeletedEvent]);

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const { event } = info;
      if (event.end && event.start && event.end <= event.start) {
        info.revert();
        toast.error("Invalid event duration");
        return;
      }
      if (isTempId(event.id)) {
        setErrorMessage("Please save the event before moving/resizing it.");
        info.revert();
        return;
      }
      if (dragDebounceRef.current) window.clearTimeout(dragDebounceRef.current);
      dragDebounceRef.current = window.setTimeout(async () => {
        try {
          // If it's a bloom, use the dedicated parent handler
          if (event.extendedProps?.isBloom && onUpdateBloomFromEvent) {
            onUpdateBloomFromEvent({
              id: info.event.id.replace(/^bloom-/, ""),
              updatedData: {
                dueDate: info.event.startStr,
                end: info.event.endStr,
                startTime: info.event.startStr
                  ? new Date(info.event.startStr).toISOString().slice(11, 16)
                  : "",
                endTime: info.event.endStr
                  ? new Date(info.event.endStr).toISOString().slice(11, 16)
                  : undefined,
              },
            });
          } else {
            // Otherwise, use the generic event API
            const response = await fetch("/api/events", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // ----- FIX: Strip both 'event-' and 'bloom-' prefixes -----
                id: event.id.replace(/^event-/, "").replace(/^bloom-/, ""),
                // ----- END FIX -----
                start: event.startStr,
                end: event.endStr || null,
              }),
            });
            if (!response.ok) throw new Error("Failed to update event drop");
          }
        } catch (err) {
          console.error("Error updating event drop:", err);
          info.revert();
          setErrorMessage("Failed to move event.");
        } finally {
          dragDebounceRef.current = null;
        }
      }, 300);
    },
    [onUpdateBloomFromEvent],
  );

  const handleEventResize = useCallback(
    async (info: EventResizeDoneArg) => {
      const { event } = info;
      if (event.end && event.start && event.end <= event.start) {
        info.revert();
        toast.error("End time must be greater than start time");
        return;
      }
      if (resizeDebounceRef.current)
        window.clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = window.setTimeout(async () => {
        try {
          // If it's a bloom, use the dedicated parent handler
          if (event.extendedProps?.isBloom && onUpdateBloomFromEvent) {
            onUpdateBloomFromEvent({
              id: info.event.id.replace(/^bloom-/, ""),
              updatedData: {
                dueDate: info.event.startStr,
                end: info.event.endStr,
                startTime: info.event.startStr
                  ? new Date(info.event.startStr).toISOString().slice(11, 16)
                  : "",
                endTime: info.event.endStr
                  ? new Date(info.event.endStr).toISOString().slice(11, 16)
                  : undefined,
              },
            });
          } else {
            // Otherwise, use the generic event API
            const response = await fetch("/api/events", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // ----- FIX: Strip both 'event-' and 'bloom-' prefixes -----
                id: event.id.replace(/^event-/, "").replace(/^bloom-/, ""),
                // ----- END FIX -----
                start: event.startStr,
                end: event.endStr,
              }),
            });
            if (!response.ok) throw new Error("Failed to update event resize");
          }
        } catch (err) {
          console.error("Error updating event resize:", err);
          info.revert();
          setErrorMessage("Failed to resize event.");
        } finally {
          resizeDebounceRef.current = null;
        }
      }, 300);
    },
    [onUpdateBloomFromEvent],
  );

  const eventContent = useCallback((arg: EventContentArg) => {
    const ext = arg.event.extendedProps as EventExtendedProps;
    const isListView = arg.view.type === "listWeek";

    // ----- CHANGE: Added Tooltip for better readability -----
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`px-2 py-1 text-xs rounded-md flex items-center border shadow-sm cursor-pointer w-full hover:bg-white/60 transition`}
              style={{
                borderColor: arg.event.backgroundColor,
                backgroundColor: `${arg.event.backgroundColor}1A`,
              }}
              onClick={() => {
                setCurrentEvent({
                  id: arg.event.id,
                  title: arg.event.title,
                  start: arg.event.startStr,
                  end: arg.event.endStr,
                  allDay: arg.event.allDay,
                  color: arg.event.backgroundColor,
                  extendedProps: {
                    description: ext?.description,
                    isBloom: ext?.isBloom,
                    isCompleted: ext?.isCompleted,
                  },
                });
                setMode("view");
                setIsEditing(false);
              }}
            >
              <span
                className={`flex-grow font-medium text-xs sm:text-sm ${
                  ext?.isCompleted ? "line-through text-muted-foreground" : ""
                } ${isListView ? "whitespace-normal break-words" : "truncate"}`}
              >
                {arg.event.title}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-bold">{arg.event.title}</p>
            {ext?.description && (
              <p className="text-sm text-muted-foreground">{ext.description}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, []);

  // ----- CHANGE: Added isSubmitting prop and logic for loading states -----
  const FormButtons = useCallback(
    () => (
      <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-2">
        {mode === "create" && (
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full sm:w-auto py-2 px-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 transition "
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Event
          </Button>
        )}
        {mode === "view" && currentEvent && (
          <>
            {/* {!isEditing && !currentEvent.extendedProps?.isCompleted && (
              <Button
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-2 px-3 text-sm sm:text-base"
              >
                Edit
              </Button>
            )} */}
            {mode === "view" && !currentEvent.extendedProps?.isCompleted && (
              <Button
                onClick={handleUpdate}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-2 px-3 text-sm sm:text-base"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            )}
            {!currentEvent.extendedProps?.isCompleted &&
              canMarkCompleted(currentEvent.start, currentEvent.allDay) && (
                <Button
                  onClick={() => handleComplete(currentEvent.id)}
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-2 px-3 text-sm sm:text-base"
                >
                  {isCompleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Mark Completed ✅
                </Button>
              )}
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
              className="w-full sm:w-auto py-2 px-3 text-sm sm:text-base"
            >
              Delete
            </Button>
          </>
        )}
      </div>
    ),
    [
      mode,
      currentEvent,
      isEditing,
      isSubmitting,
      handleSave,
      handleUpdate,
      handleComplete,
    ],
  );

  // ----- CHANGE: Added key prop to Skeleton Loader elements -----
  const SkeletonLoader = () => (
    <div className="grid gap-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-100 rounded animate-pulse ${index === 0 ? "h-8" : "h-48"}`}
        />
      ))}
    </div>
  );

  return (
    <div className="border rounded-2xl shadow-lg bg-white p-4 sm:p-6 relative">
      {errorMessage && (
        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
          {errorMessage}
          <button
            className="ml-3 underline"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}
      {lastDeletedEvent && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-sm flex items-center justify-between">
          <div>
            Deleted {lastDeletedEvent.title} —{" "}
            <span className="font-medium">You can undo this action</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUndoDelete}>
              Undo
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Daily Blooms Calendar
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3">
          <div className="hidden sm:flex w-full sm:w-auto gap-2">
            <Input
              placeholder="Quick add event..."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              className="flex-grow text-sm h-10"
            />
            <Button
              onClick={handleQuickAdd}
              variant="default"
              size="icon"
              className="bg-green-600 hover:bg-green-700 flex-shrink-0 h-10 w-10"
            >
              <Plus size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="fc-theme">
        <style>
          {`
            /* --- UI Improvement: Modern & Clean FullCalendar Header --- */
            .fc-theme .fc-button { background-color: #ffffff; border: 1px solid #e2e8f0; color: #475569; text-transform: capitalize; font-weight: 500; border-radius: 0.5rem; transition: all 0.2s ease-in-out; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
            .fc-theme .fc-button .fc-icon { vertical-align: middle; }
            .fc-theme .fc-button:focus, .fc-theme .fc-button:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); }
            .fc-theme .fc-button:not(:disabled):not(.fc-button-active):hover {
                background-color: #f8fafc;
               border-color: #cbd5e1;
          color: #1e293b;
                }   
           .fc-theme .fc-button.fc-button-primary.fc-button-active {
  background-color: #15803d !important;
  border-color: #15803d !important;
  color: #ffffff !important;
  box-shadow: none;
}

/* Active Hover */
.fc-theme .fc-button.fc-button-primary.fc-button-active:hover {
  background-color: #166534 !important;
  border-color: #166534 !important;
  color: #ffffff !important;
}
            .fc-theme .fc-today-button { background-color: #eff6ff; color: #2563eb; border-color: #bfdbfe; font-weight: 600; }
            .fc-theme .fc-today-button:hover:not(:disabled) { background-color: #dbeafe; color: #1d4ed8; }
            .fc-theme .fc-button.fc-today-button:disabled { background-color: #f1f5f9; border-color: #e2e8f0; color: #64748b; opacity: 1; }
            .fc .fc-header-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
            .fc .fc-toolbar-chunk { display: flex; align-items: center; gap: 0.5rem; }
            .fc .fc-button-group { display: inline-flex; }
            .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 600; color: #1e293b; }
          `}
        </style>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <FullCalendar
            key={events.length}
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={events}
            editable={true}
            selectable={true}
            dayMaxEvents={true}
            eventOverlap={false}
            slotEventOverlap={false}
            eventContent={eventContent}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dayHeaderFormat={{ weekday: isMobile ? "short" : "long" }}
            views={{
              dayGridMonth: { titleFormat: { year: "numeric", month: "long" } },
              timeGridWeek: {
                titleFormat: {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              },
              timeGridDay: {
                titleFormat: {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              },
              listWeek: {
                titleFormat: {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              },
            }}
            height="auto"
          />
        )}
      </div>

      {isMobile && (
        <div className="fixed bottom-6 right-4 z-50">
          <button
            title="Quick add event"
            onClick={() => {
              const start = getNearestHourLocal();
              const end = addOneHour(start);
              setCurrentEvent({
                id: `tmp-${Date.now()}`,
                title: "",
                start,
                end,
                allDay: true,
                color: "#4dabf7",
                extendedProps: {
                  description: "",
                  isBloom: true,
                  isCompleted: false,
                },
              });
              setMode("create");
              setIsEditing(false);
            }}
            className="w-14 h-14 rounded-full bg-green-600 text-white shadow-lg flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {isTabletOrBelow ? (
        <Drawer
          open={!!mode}
          onOpenChange={(isOpen) => !isOpen && handleCloseModal()}
        >
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {mode === "create" ? "Create Event" : "Event Details"}
              </DrawerTitle>
              <DrawerDescription>
                {mode === "create"
                  ? "Fill in the details for your new event."
                  : "View or manage your event details."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto">
              {currentEvent && (
                <EventForm
                  currentEvent={currentEvent}
                  setCurrentEvent={setCurrentEvent}
                  mode={mode}
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
            <DrawerFooter className="pt-4">
              <FormButtons />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={!!mode}
          onOpenChange={(isOpen) => !isOpen && handleCloseModal()}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Create Event" : "Event Details"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? "Fill in the details for your new event."
                  : "View or manage your event details."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 overflow-y-auto max-h-[60vh]">
              {currentEvent && (
                <EventForm
                  currentEvent={currentEvent}
                  setCurrentEvent={setCurrentEvent}
                  mode={mode}
                  isEditing={isEditing}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
            <DialogFooter>
              <FormButtons />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event:{" "}
              <strong className="text-foreground">
                {currentEvent?.title || "this event"}
              </strong>
              . You can briefly undo this after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DailyBloomCalendar;
