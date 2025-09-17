"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { RealtimeChannel } from "@supabase/supabase-js";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"; // For creating a client instance
// import { useSession } from "next-auth/react"; // <-- CORRECT: Use NextAuth session hook
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
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { useSupabase } from "./providers/SupabaseClientProvider";

// ---------------- Types ----------------

interface EventPayload {
  id: number;
  title: string;
  start: string;
  end?: string | null;
  description?: string | null;
  isBloom?: boolean;
  isCompleted?: boolean;
}

// ADDED THIS INTERFACE
interface EventExtendedProps {
  description?: string;
  isBloom?: boolean;
  isCompleted?: boolean;
  category?: 'holiday' | string;
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
  events?: CalendarEvent[];
  onCreateBloomFromEvent: (payload: {
    title: string;
    description?: string;
    dueDate?: string;
    isCompleted?: boolean;
  }) => void;
}

// ---------------- Helpers ----------------

const toLocalInput = (dateStr?: string | null) => {
  // ... (This function is unchanged)
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
};

const useIsMobile = () => {
  // ... (This function is unchanged)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
};

// ---------------- Event Form Component ----------------

const EventForm = ({
  
  currentEvent,
  setCurrentEvent,
  mode,
  isEditing,
}: {
  currentEvent: CalendarEvent;
  setCurrentEvent: (event: CalendarEvent) => void;
  mode: "view" | "create" | null;
  isEditing: boolean;
}) => (
  <div className="grid gap-4 py-4 px-1">
    {/* ... All your form fields remain the same ... */ }
     <div className="grid gap-2">
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        value={currentEvent.title}
        onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
        disabled={mode === "view" && !isEditing}
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
            extendedProps: { ...currentEvent.extendedProps, description: e.target.value },
          })
        }
        disabled={mode === "view" && !isEditing}
        placeholder="Optional details..."
        className="text-sm"
      />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="due-date">Due Date</Label>
      <Input
        id="due-date"
        type={currentEvent.allDay ? "date" : "datetime-local"}
        value={
          currentEvent.allDay
            ? currentEvent.start.slice(0, 10)
            : currentEvent.start.slice(0, 16)
        }
        onChange={(e) => {
          const newStart = e.target.value;
          setCurrentEvent({ ...currentEvent, start: newStart });
        }}
        disabled={mode === "view" && !isEditing}
        className="text-sm"
      />
    </div>
    {!currentEvent.allDay && (
      <div className="grid gap-2">
        <Label htmlFor="end-date">End Date (optional)</Label>
        <Input
          id="end-date"
          type="datetime-local"
          value={currentEvent.end ? currentEvent.end.slice(0, 16) : ""}
          onChange={(e) => setCurrentEvent({ ...currentEvent, end: e.target.value || undefined })}
          disabled={mode === "view" && !isEditing}
          className="text-sm"
        />
      </div>
    )}
    <div className="flex items-center gap-2 pt-2">
      <Checkbox
        id="all-day"
        checked={currentEvent.allDay || false}
        onCheckedChange={(val) => {
          const isAllDay = val as boolean;
          let newStart = currentEvent.start;
          let newEnd: string | undefined = currentEvent.end;
          if (isAllDay) {
            newStart = newStart.slice(0, 10);
            newEnd = undefined;
          } else {
            if (newStart.length === 10) newStart += "T09:00";
            if (!newEnd) {
              const startD = new Date(newStart);
              newEnd = toLocalInput(new Date(startD.getTime() + 3600000).toString());
            }
          }
          setCurrentEvent({
            ...currentEvent,
            start: newStart,
            end: newEnd,
            allDay: isAllDay,
          });
        }}
        disabled={mode === "view" && !isEditing}
      />
      <Label htmlFor="all-day">All Day Event</Label>
    </div>
    <div className="flex items-center gap-2 pt-2">
      <Checkbox
        id="is-bloom"
        checked={currentEvent.extendedProps?.isBloom || false}
        onCheckedChange={(val) =>
          setCurrentEvent({
            ...currentEvent,
            extendedProps: { ...currentEvent.extendedProps, isBloom: val as boolean },
          })
        }
        disabled={mode === "view" && !isEditing}
      />
      <Label htmlFor="is-bloom">Mark as Bloom 🌱</Label>
    </div>
  </div>
);

// ---------------- Main Component ----------------

const DailyBloomCalendar: React.FC<Props> = ({ onCreateBloomFromEvent }) => {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [quickText, setQuickText] = useState("");
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [mode, setMode] = useState<"view" | "create" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(["bloom", "custom"]);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [isTabletOrBelow, setIsTabletOrBelow] = useState(false);

  // Get the single, globally-authenticated client from our new Context
  const supabaseClient = useSupabase();

  // UX / status
  const [isLoading, setIsLoading] = useState(true); 
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastDeletedEvent, setLastDeletedEvent] = useState<CalendarEvent | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debounce refs
  const dragDebounceRef = useRef<number | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsTabletOrBelow(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filtered events memo
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.extendedProps?.isBloom && activeFilters.includes("bloom")) {
        return true;
      }
      if (!event.extendedProps?.isBloom && activeFilters.includes("custom")) {
        return true;
      }
      return false;
    });
  }, [events, activeFilters]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  // initial fetch (unchanged, uses API route)
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      const formatted = (data || []).map((ev: EventPayload) => ({
        id: String(ev.id),
        title: ev.title || "Untitled",
        start: ev.start,
        end: ev.end || undefined,
        allDay: !ev.end && !ev.start.includes("T"),
        color: ev.isBloom ? "#4dabf7" : "#2ecc71",
        extendedProps: {
          description: ev.description || "",
          isBloom: !!ev.isBloom,
          isCompleted: !!ev.isCompleted,
        },
      }));
      setEvents(formatted);
    } catch (err) {
      console.error("Error fetching events:", err);
      setErrorMessage("Unable to load calendar events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

// --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    // 1. If the client from the context isn't ready, wait.
    //    The provider is already handling authentication.
    if (!supabaseClient) {
      return;
    }

    // 2. Create the subscription
    const channel = supabaseClient
      .channel("public:Event")
      .on<EventPayload>(
        "postgres_changes",
        { event: "*", schema: "public", table: "Event" },
        (payload) => {
          
          // Your original state logic:
          const newRow = payload.new as EventPayload;
          const oldRow = payload.old as { id: number }; // Cast old row for delete

          switch (payload.eventType) {
            case "INSERT":
              if (!("id" in newRow)) break;
              setEvents((prev) => [
                ...prev.filter((e) => e.id !== String(newRow.id)),
                {
                  id: String(newRow.id),
                  title: newRow.title,
                  start: newRow.start,
                  end: newRow.end || undefined,
                  allDay: !newRow.end && !newRow.start.includes("T"),
                  color: newRow.isBloom ? "#4dabf7" : "#2ecc71",
                  extendedProps: {
                    description: newRow.description || "",
                    isBloom: !!newRow.isBloom,
                    isCompleted: !!newRow.isCompleted,
                  },
                },
              ]);
              break;
            case "UPDATE":
              if (!("id" in newRow)) break;
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === String(newRow.id)
                    ? {
                        ...e,
                        title: newRow.title,
                        start: newRow.start,
                        end: newRow.end || undefined,
                        allDay: !newRow.end && !newRow.start.includes("T"),
                        color: newRow.isBloom ? "#4dabf7" : "#2ecc71",
                        extendedProps: {
                          description: newRow.description || "",
                          isBloom: !!newRow.isBloom,
                          isCompleted: !!newRow.isCompleted,
                        },
                      }
                    : e
                )
              );
              break;
            case "DELETE":
              if (!oldRow || !("id" in oldRow)) break;
              setEvents((prev) => prev.filter((e) => e.id !== String(oldRow.id)));
              break;
          }
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    // 3. Cleanup
    return () => {
      if (realtimeRef.current?.unsubscribe) {
        supabaseClient.removeChannel(realtimeRef.current); // Use removeChannel for cleanup
        realtimeRef.current.unsubscribe();
      }
    };
  }, [supabaseClient]); // This hook now ONLY depends on the client from the context

  // view updates on resize (unchanged)
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
    updateView();
    window.addEventListener("resize", updateView);
    return () => window.removeEventListener("resize", updateView);
  }, [isMobile]);

  // handleSave (used for keyboard shortcut)
  const handleSave = useCallback(async () => {
    if (!currentEvent || !currentEvent.title.trim()) return;
    const eventPayload = {
      title: currentEvent.title,
      start: currentEvent.start,
      end: currentEvent.end,
      description: currentEvent.extendedProps?.description || "",
      isBloom: currentEvent.extendedProps?.isBloom || false,
      isCompleted: currentEvent.extendedProps?.isCompleted || false,
    };
    const isBloom = currentEvent.extendedProps?.isBloom;
    if (isBloom && onCreateBloomFromEvent) {
      onCreateBloomFromEvent({
        title: eventPayload.title,
        description: eventPayload.description,
        dueDate: eventPayload.start,
        isCompleted: eventPayload.isCompleted,
      });
      handleCloseModal();
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save event");
      }
      handleCloseModal();
    } catch (err: unknown) {
      console.error("Error saving event:", err);
      setErrorMessage("Failed to save event. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent, onCreateBloomFromEvent]);

  // keyboard shortcuts: (unchanged)
  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode(null);
        setIsEditing(false);
      }
      if (e.key === "Enter") {
        if (mode === "create") {
          e.preventDefault();
          if (currentEvent && currentEvent.title.trim()) {
            handleSave();
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, currentEvent, isEditing, handleSave]);

  // handleDateClick (unchanged)
  const handleDateClick = (info: DateClickArg) => {
    const startStr = toLocalInput(info.dateStr);
    const isAllDay = info.allDay;
    const start = isAllDay ? startStr.slice(0, 10) : startStr;
    const end = isAllDay ? undefined : toLocalInput(new Date(new Date(info.dateStr).getTime() + 3600000).toString());
    setCurrentEvent({
      id: `tmp-${Date.now()}`,
      title: "",
      start,
      end,
      allDay: isAllDay,
      color: "#4dabf7",
      extendedProps: { description: "", isBloom: false, isCompleted: false },
    });
    setMode("create");
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setMode(null);
    setIsEditing(false);
  };
  
  // --- QUICK ADD (FIXED) ---
  // This function now uses the API route pattern, consistent with all other mutations.
  const handleQuickAdd = async () => {
    if (!quickText.trim()) return;

    // 1. Create the payload
    const newEventPayload = {
      title: quickText,
      start: new Date().toISOString().slice(0, 10), // Defaults to today
      description: "Quick add",
      isBloom: false,
      isCompleted: false,
      allDay: true, // Quick add events are all-day
    };

    const oldQuickText = quickText;
    setQuickText(""); // Clear text immediately

    try {
      // 2. Call your existing API route. The server will handle auth via NextAuth.
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventPayload),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || "Server failed to save event");
      }

            // Get the newly created event back from the API
      const { data: newRow } = await response.json();
      // Format it into the CalendarEvent type
      const formattedEvent: CalendarEvent = {
        id: String(newRow.id),
        title: newRow.title,
        start: newRow.start,
        end: newRow.end || undefined,
        allDay: !newRow.end && !newRow.start.includes("T"), // Use your existing logic
        color: newRow.isBloom ? "#4dabf7" : "#2ecc71",
        extendedProps: {
          description: newRow.description || "",
          isBloom: !!newRow.isBloom,
          isCompleted: !!newRow.isCompleted,
        },
      };

      // Manually add the new event to your local 'events' state
      setEvents((prevEvents) => [...prevEvents, formattedEvent]);
      
      
      // Success! The Realtime subscription will add it to the calendar.

    }  catch (err: unknown) { // <-- CHANGED from 'any'
      console.error("Quick add error:", err);
      // v-- ADDED TYPE GUARD
      if (err instanceof Error) {
        setErrorMessage(err.message || "Quick add failed. Try again.");
      } else {
        setErrorMessage("An unknown error occurred during quick add.");
      }
      setQuickText(oldQuickText); // Put the text back on failure
    }
  };

 // Mark complete with optimistic update & confetti
  const handleComplete = useCallback(async (id: string) => { // <-- WRAPPED
    const originalEvents = [...events];
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, extendedProps: { ...e.extendedProps, isCompleted: true } } : e
      )
    );
    try {
      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, isCompleted: true }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete event");
      }
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      handleCloseModal();
    } catch (err) {
      console.error("Error completing event:", err);
      setEvents(originalEvents);
      setErrorMessage("Failed to mark completed.");
    }
  }, [events]); // <-- ADDED DEPENDENCY

// Update event (preserved)
  const handleUpdate = useCallback(async () => { // <-- WRAPPED
    if (!currentEvent) return;
    const originalEvents = [...events];
    setEvents((prev) => prev.map((e) => (e.id === currentEvent.id ? currentEvent : e)));
    handleCloseModal();
    try {
      const response = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentEvent.id,
          title: currentEvent.title,
          description: currentEvent.extendedProps?.description,
          start: currentEvent.start,
          end: currentEvent.end,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update event");
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setEvents(originalEvents);
      setErrorMessage("Failed to update event.");
    }
  }, [currentEvent, events]); // <-- ADDED DEPENDENCIES
  // This function now contains the logic from the OLD handleDelete
  const handleConfirmDelete = async () => {
    if (!currentEvent) return;

    const originalEvents = [...events];
    setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
    setLastDeletedEvent(currentEvent);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    
    handleCloseModal();
    setShowDeleteConfirm(false); 
    
    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentEvent.id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete event");
      }
      undoTimerRef.current = window.setTimeout(() => {
        setLastDeletedEvent(null);
        undoTimerRef.current = null;
      }, 6000);
    } catch (err) {
      console.error("Error deleting event:", err);
      setEvents(originalEvents);
      setErrorMessage("Failed to delete event.");
      setLastDeletedEvent(null);
    }
  };

  // Undo deletion (re-insert visually and attempt server-side re-insert if needed)
  const handleUndoDelete = async () => {
    if (!lastDeletedEvent) return;
    setEvents((prev) => [...prev, lastDeletedEvent]);
    setLastDeletedEvent(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    try {
      const payload = {
        title: lastDeletedEvent.title,
        start: lastDeletedEvent.start,
        end: lastDeletedEvent.end,
        description: lastDeletedEvent.extendedProps?.description || "",
        isBloom: lastDeletedEvent.extendedProps?.isBloom || false,
        isCompleted: lastDeletedEvent.extendedProps?.isCompleted || false,
      };
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setErrorMessage("Undo succeeded locally but server re-create failed.");
      }
    } catch (err) {
      console.error("Undo re-create error:", err);
      setErrorMessage("Undo succeeded locally but server re-create failed.");
    }
  };

  // Drag handler with debounce
  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info;
    if (dragDebounceRef.current) window.clearTimeout(dragDebounceRef.current);
    dragDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: event.id,
            start: event.startStr,
            end: event.endStr || null,
          }),
        });
        if (!response.ok) throw new Error("Failed to update event drop");
      } catch (err) {
        console.error("Error updating event drop:", err);
        info.revert();
        setErrorMessage("Failed to move event.");
      } finally {
        dragDebounceRef.current = null;
      }
    }, 300);
  };

  // Resize handler with debounce
  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    if (resizeDebounceRef.current) window.clearTimeout(resizeDebounceRef.current);
    resizeDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: event.id,
            start: event.startStr,
            end: event.endStr,
          }),
        });
        if (!response.ok) throw new Error("Failed to update event resize");
      } catch (err) {
        console.error("Error updating event resize:", err);
        info.revert();
        setErrorMessage("Failed to resize event.");
      } finally {
        resizeDebounceRef.current = null;
      }
    }, 300);
  };

  // memoized eventContent (unchanged)
  const eventContent = useCallback((arg: EventContentArg) => {
    // ... (logic is unchanged)
    const ext = arg.event.extendedProps as EventExtendedProps;
    const dot = ext?.isCompleted ? "✅" : ext?.isBloom ? "🌱" : "📌";
    const badge = ext?.isBloom ? "Bloom" : ext?.isCompleted ? "Completed" : "Custom";
    return (
      <div
        title={arg.event.title + (ext?.description ? " — " + ext.description : "")}
        className="px-2 py-1 text-xs rounded-md flex items-center gap-1.5 border shadow-sm cursor-pointer w-full overflow-hidden hover:bg-white/60 transition"
        style={{
          borderColor: arg.event.backgroundColor,
          backgroundColor: "rgba(0,0,0,0.02)",
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
        <span className="flex-shrink-0 text-[12px]">{dot}</span>
        <span
          className={`truncate font-medium max-w-[70%] text-xs sm:text-sm ${ext?.isCompleted ? "line-through text-muted-foreground" : ""
            }`}
        >
          {arg.event.title}
        </span>
        <span className="ml-auto text-[10px] px-2 py-[2px] rounded-full bg-white/30 border text-muted-foreground hidden sm:inline-block">
          {badge}
        </span>
      </div>
    );
  }, []);

  // memoized FormButtons (unchanged)
  const FormButtons = useCallback(() => (
    <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-2">
      {mode === "create" && (
        <Button onClick={handleSave} className="py-2 px-3 text-sm sm:text-base">
          Save Event
        </Button>
      )}
      {mode === "view" && currentEvent && (
        <>
          {!isEditing && !currentEvent.extendedProps?.isCompleted && (
            <Button onClick={() => setIsEditing(true)} className="py-2 px-3 text-sm sm:text-base">
              Edit
            </Button>
          )}
          {isEditing && (
            <Button onClick={handleUpdate} className="py-2 px-3 text-sm sm:text-base">
              Save Changes
            </Button>
          )}
          {!currentEvent.extendedProps?.isCompleted && (
            <Button onClick={() => handleComplete(currentEvent.id)} className="py-2 px-3 text-sm sm:text-base">
              Mark Completed ✅
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="py-2 px-3 text-sm sm:text-base">
            Delete
          </Button>
        </>
      )}
    </div>
  ), [mode, currentEvent, isEditing, handleSave, handleUpdate, handleComplete]); 

  // SkeletonLoader (unchanged)
  const SkeletonLoader = () => (
    <div className="grid gap-2">
      <div className="h-8 bg-gray-100 rounded animate-pulse" />
      <div className="h-48 bg-gray-100 rounded animate-pulse" />
    </div>
  );

  // --- Main JSX Return (unchanged) ---
  return (
    <div className="border rounded-2xl shadow-lg bg-white p-4 sm:p-6 relative">
      {/* Error / Undo banners */}
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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">Daily Blooms Calendar</h2>
        </div>
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-3">
          <div className="flex items-center gap-1 border bg-gray-50 p-1 rounded-lg">
            <span className="text-sm font-medium mr-2 pl-2 text-gray-600 hidden lg:inline">Show:</span>
            <Button
              size="sm"
              onClick={() => toggleFilter("bloom")}
              variant={activeFilters.includes("bloom") ? "default" : "ghost"}
              className="text-xs sm:text-sm h-8 px-3"
              aria-pressed={activeFilters.includes("bloom")}
            >
              🌱 Blooms
            </Button>
            <Button
              size="sm"
              onClick={() => toggleFilter("custom")}
              variant={activeFilters.includes("custom") ? "default" : "ghost"}
              className="text-xs sm:text-sm h-8 px-3"
              aria-pressed={activeFilters.includes("custom")}
            >
              📌 Custom
            </Button>
          </div>
          {/* Quick Add Input, now tied to the API-based handleQuickAdd */}
          <div className="hidden sm:flex w-full sm:w-auto gap-2">
            <Input
              placeholder="Quick add event..."
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              className="flex-grow text-sm h-10"
            />
            <Button onClick={handleQuickAdd} variant="default" size="icon" className="flex-shrink-0 h-10 w-10">
              <Plus size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* FullCalendar */}
      <div className="fc-theme">
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="listWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            events={filteredEvents}
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
              timeGridWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
              timeGridDay: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
              listWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
            }}
            height="auto"
          />
        )}
      </div>

      {/* Mobile FAB (unchanged) */}
      {isMobile && (
        <div className="fixed bottom-6 right-4 z-50">
          <button
            title="Quick add event"
            onClick={() => {
              const start = new Date().toISOString().slice(0, 10);
              setCurrentEvent({
                id: `tmp-${Date.now()}`,
                title: "",
                start,
                end: undefined,
                allDay: true,
                color: "#2ecc71",
                extendedProps: { description: "", isBloom: false, isCompleted: false },
              });
              setMode("create");
              setIsEditing(false);
            }}
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Modal / Drawer (unchanged) */}
      {isTabletOrBelow ? (
        <Drawer open={!!mode} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{mode === "create" ? "Create Event" : "Event Details"}</DrawerTitle>
              <DrawerDescription>
                {mode === "create" ? "Fill in the details for your new event." : "View or manage your event details."}
              </DrawerDescription>
            </DrawerHeader>
            {currentEvent && (
              <EventForm currentEvent={currentEvent} setCurrentEvent={setCurrentEvent} mode={mode} isEditing={isEditing} />
            )}
            <DrawerFooter className="pt-4">
              <FormButtons />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!mode} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Create Event" : "Event Details"}</DialogTitle>
              <DialogDescription>
                {mode === "create" ? "Fill in the details for your new event." : "View or manage your event details."}
              </DialogDescription>
            </DialogHeader>
            {currentEvent && (
              <EventForm currentEvent={currentEvent} setCurrentEvent={setCurrentEvent} mode={mode} isEditing={isEditing} />
            )}
            <DialogFooter>
              <FormButtons />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert Dialog (unchanged) */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event:{" "}
              <strong className="text-foreground">
                {currentEvent?.title || 'this event'}
              </strong>
              . You can briefly undo this after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default DailyBloomCalendar;

















































































// "use client";
// // ENHANCED UI/UX VERSION: Improved visual design, animations, and mobile responsiveness
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin, { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
// import listPlugin from "@fullcalendar/list";
// import { EventContentArg, EventDropArg } from "@fullcalendar/core";
// import { RealtimeChannel } from "@supabase/supabase-js";
// import { supabaseClient } from "@/lib/supabaseClient";
// import { DailyBloom } from "@/types/client/daily-bloom";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerDescription,
//   DrawerFooter,
// } from "@/components/ui/drawer";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Label } from "@/components/ui/label";
// import { Plus, Calendar as CalendarIcon, Sparkles, Filter, X, CheckCircle, Edit3, Trash2 } from "lucide-react";
// import confetti from "canvas-confetti";

// // ---------------- Types ----------------

// interface EventPayload {
//   id: number;
//   title: string;
//   start: string;
//   end?: string | null;
//   description?: string | null;
//   isBloom?: boolean;
//   isCompleted?: boolean;
// }

// interface CalendarEvent {
//   id: string;
//   title: string;
//   start: string;
//   end?: string;
//   allDay?: boolean;
//   color?: string;
//   extendedProps?: {
//     description?: string;
//     isBloom?: boolean;
//     isCompleted?: boolean;
//     category?: 'holiday' | string;
//   };
// }

// interface Props {
//   blooms?: DailyBloom[];
//   events?: CalendarEvent[];
//   onCreateBloomFromEvent: (payload: {
//     title: string;
//     description?: string;
//     dueDate?: string;
//     isCompleted?: boolean;
//   }) => void;
// }

// // ---------------- Helpers ----------------

// const toLocalInput = (dateStr?: string | null) => {
//   if (!dateStr) return "";
//   const date = new Date(dateStr);
//   const y = date.getFullYear();
//   const m = (date.getMonth() + 1).toString().padStart(2, "0");
//   const d = date.getDate().toString().padStart(2, "0");
//   const h = date.getHours().toString().padStart(2, "0");
//   const min = date.getMinutes().toString().padStart(2, "0");
//   return `${y}-${m}-${d}T${h}:${min}`;
// };

// const useIsMobile = () => {
//   const [isMobile, setIsMobile] = useState(false);
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const mq = window.matchMedia("(max-width: 640px)");
//     const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
//     setIsMobile(mq.matches);
//     mq.addEventListener("change", handler);
//     return () => mq.removeEventListener("change", handler);
//   }, []);
//   return isMobile;
// };

// // ---------------- Enhanced Event Form Component ----------------

// const EventForm = ({
//   currentEvent,
//   setCurrentEvent,
//   mode,
//   isEditing,
// }: {
//   currentEvent: CalendarEvent;
//   setCurrentEvent: (event: CalendarEvent) => void;
//   mode: "view" | "create" | null;
//   isEditing: boolean;
// }) => (
//   <div className="space-y-6 py-4 px-1">
//     {/* Title Input with Enhanced Styling */}
//     <div className="space-y-3">
//       <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//         <span className="w-2 h-2 rounded-full bg-blue-500"></span>
//         Event Title
//       </Label>
//       <div className="relative">
//         <Input
//           id="title"
//           value={currentEvent.title}
//           onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
//           disabled={mode === "view" && !isEditing}
//           placeholder="Enter event title..."
//           className="text-sm h-12 px-4 border-2 border-gray-100 focus:border-blue-400 rounded-xl transition-all duration-200 bg-gray-50/50 focus:bg-white"
//         />
//         {currentEvent.title && (
//           <div className="absolute right-3 top-1/2 -translate-y-1/2">
//             <CheckCircle className="w-4 h-4 text-green-500" />
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Description with Enhanced Styling */}
//     <div className="space-y-3">
//       <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//         <span className="w-2 h-2 rounded-full bg-purple-500"></span>
//         Description
//       </Label>
//       <Textarea
//         id="description"
//         value={currentEvent.extendedProps?.description || ""}
//         onChange={(e) =>
//           setCurrentEvent({
//             ...currentEvent,
//             extendedProps: { ...currentEvent.extendedProps, description: e.target.value },
//           })
//         }
//         disabled={mode === "view" && !isEditing}
//         placeholder="Add event details, notes, or context..."
//         className="text-sm min-h-[100px] px-4 py-3 border-2 border-gray-100 focus:border-purple-400 rounded-xl transition-all duration-200 bg-gray-50/50 focus:bg-white resize-none"
//         rows={4}
//       />
//     </div>

//     {/* Date & Time Section */}
//     <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
//       <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//         <CalendarIcon className="w-4 h-4 text-blue-600" />
//         Schedule Details
//       </h4>
      
//       <div className="grid gap-4">
//         <div className="space-y-2">
//           <Label htmlFor="due-date" className="text-sm font-medium text-gray-600">
//             {currentEvent.allDay ? "Date" : "Start Date & Time"}
//           </Label>
//           <Input
//             id="due-date"
//             type={currentEvent.allDay ? "date" : "datetime-local"}
//             value={
//               currentEvent.allDay
//                 ? currentEvent.start.slice(0, 10)
//                 : currentEvent.start.slice(0, 16)
//             }
//             onChange={(e) => {
//               const newStart = e.target.value;
//               setCurrentEvent({ ...currentEvent, start: newStart });
//             }}
//             disabled={mode === "view" && !isEditing}
//             className="text-sm h-11 px-3 border border-gray-200 focus:border-blue-400 rounded-lg transition-all duration-200"
//           />
//         </div>

//         {!currentEvent.allDay && (
//           <div className="space-y-2">
//             <Label htmlFor="end-date" className="text-sm font-medium text-gray-600">
//               End Date & Time (optional)
//             </Label>
//             <Input
//               id="end-date"
//               type="datetime-local"
//               value={currentEvent.end ? currentEvent.end.slice(0, 16) : ""}
//               onChange={(e) => setCurrentEvent({ ...currentEvent, end: e.target.value || undefined })}
//               disabled={mode === "view" && !isEditing}
//               className="text-sm h-11 px-3 border border-gray-200 focus:border-blue-400 rounded-lg transition-all duration-200"
//             />
//           </div>
//         )}
//       </div>
//     </div>

//     {/* Event Options */}
//     <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
//       <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//         <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
//           <CheckCircle className="w-2.5 h-2.5 text-white" />
//         </span>
//         Event Options
//       </h4>
      
//       <div className="grid gap-4">
//         <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white/50 hover:bg-white transition-colors">
//           <Checkbox
//             id="all-day"
//             checked={currentEvent.allDay || false}
//             onCheckedChange={(val) => {
//               const isAllDay = val as boolean;
//               let newStart = currentEvent.start;
//               let newEnd: string | undefined = currentEvent.end;
//               if (isAllDay) {
//                 newStart = newStart.slice(0, 10);
//                 newEnd = undefined;
//               } else {
//                 if (newStart.length === 10) newStart += "T09:00";
//                 if (!newEnd) {
//                   const startD = new Date(newStart);
//                   newEnd = toLocalInput(new Date(startD.getTime() + 3600000).toString());
//                 }
//               }
//               setCurrentEvent({
//                 ...currentEvent,
//                 start: newStart,
//                 end: newEnd,
//                 allDay: isAllDay,
//               });
//             }}
//             disabled={mode === "view" && !isEditing}
//             className="rounded-md"
//           />
//           <Label htmlFor="all-day" className="text-sm font-medium cursor-pointer flex-1">
//             All Day Event
//           </Label>
//         </div>

//         <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white/50 hover:bg-white transition-colors">
//           <Checkbox
//             id="is-bloom"
//             checked={currentEvent.extendedProps?.isBloom || false}
//             onCheckedChange={(val) =>
//               setCurrentEvent({
//                 ...currentEvent,
//                 extendedProps: { ...currentEvent.extendedProps, isBloom: val as boolean },
//               })
//             }
//             disabled={mode === "view" && !isEditing}
//             className="rounded-md"
//           />
//           <Label htmlFor="is-bloom" className="text-sm font-medium cursor-pointer flex-1 flex items-center gap-2">
//             <Sparkles className="w-4 h-4 text-emerald-500" />
//             Mark as Daily Bloom
//           </Label>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // ---------------- Main Component ----------------

// const DailyBloomCalendar: React.FC<Props> = ({ onCreateBloomFromEvent }) => {
//   const isMobile = useIsMobile();
//   const [events, setEvents] = useState<CalendarEvent[]>([]);
//   const [quickText, setQuickText] = useState("");
//   const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
//   const [mode, setMode] = useState<"view" | "create" | null>(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [activeFilters, setActiveFilters] = useState<string[]>(["bloom", "custom"]);
//   const realtimeRef = useRef<RealtimeChannel | null>(null);
//   const calendarRef = useRef<FullCalendar>(null);
//   const [isTabletOrBelow, setIsTabletOrBelow] = useState(false);

//   // UX / status
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [lastDeletedEvent, setLastDeletedEvent] = useState<CalendarEvent | null>(null);
//   const undoTimerRef = useRef<number | null>(null);

//   // Debounce refs for drag/resize
//   const dragDebounceRef = useRef<number | null>(null);
//   const resizeDebounceRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const check = () => setIsTabletOrBelow(window.innerWidth < 1024);
//     check();
//     window.addEventListener("resize", check);
//     return () => window.removeEventListener("resize", check);
//   }, []);

//   // Filtered events (memoized)
//   const filteredEvents = useMemo(() => {
//     return events.filter((event) => {
//       if (event.extendedProps?.isBloom && activeFilters.includes("bloom")) {
//         return true;
//       }
//       if (!event.extendedProps?.isBloom && activeFilters.includes("custom")) {
//         return true;
//       }
//       return false;
//     });
//   }, [events, activeFilters]);

//   const toggleFilter = (filter: string) => {
//     setActiveFilters((prev) =>
//       prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
//     );
//   };

//   // initial fetch with loading + skeleton
//   const fetchEvents = useCallback(async () => {
//     setIsLoading(true);
//     setErrorMessage(null);
//     try {
//       const response = await fetch("/api/events");
//       if (!response.ok) {
//         throw new Error("Failed to fetch events");
//       }
//       const data = await response.json();
//       const formatted = (data || []).map((ev: EventPayload) => ({
//         id: String(ev.id),
//         title: ev.title || "Untitled",
//         start: ev.start,
//         end: ev.end || undefined,
//         allDay: !ev.end && !ev.start.includes("T"),
//         color: ev.isBloom ? "#10b981" : "#6366f1",
//         extendedProps: {
//           description: ev.description || "",
//           isBloom: !!ev.isBloom,
//           isCompleted: !!ev.isCompleted,
//         },
//       }));
//       setEvents(formatted);
//     } catch (err) {
//       console.error("Error fetching events:", err);
//       setErrorMessage("Unable to load calendar events.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchEvents();
//   }, [fetchEvents]);

//   // Realtime subscription
//   useEffect(() => {
//     const channel = supabaseClient
//       .channel("public:Event")
//       .on<EventPayload>(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "Event" },
//         (payload) => {
//           const newRow = payload.new;
//           const oldRow = payload.old;

//           switch (payload.eventType) {
//             case "INSERT":
//               if (!("id" in newRow)) break;
//               setEvents((prev) => [
//                 ...prev.filter((e) => e.id !== String(newRow.id)),
//                 {
//                   id: String(newRow.id),
//                   title: newRow.title,
//                   start: newRow.start,
//                   end: newRow.end || undefined,
//                   allDay: !newRow.end && !newRow.start.includes("T"),
//                   color: newRow.isBloom ? "#10b981" : "#6366f1",
//                   extendedProps: {
//                     description: newRow.description || "",
//                     isBloom: !!newRow.isBloom,
//                     isCompleted: !!newRow.isCompleted,
//                   },
//                 },
//               ]);
//               break;
//             case "UPDATE":
//               if (!("id" in newRow)) break;
//               setEvents((prev) =>
//                 prev.map((e) =>
//                   e.id === String(newRow.id)
//                     ? {
//                       ...e,
//                       title: newRow.title,
//                       start: newRow.start,
//                       end: newRow.end || undefined,
//                       allDay: !newRow.end && !newRow.start.includes("T"),
//                       color: newRow.isBloom ? "#10b981" : "#6366f1",
//                       extendedProps: {
//                         description: newRow.description || "",
//                         isBloom: !!newRow.isBloom,
//                         isCompleted: !!newRow.isCompleted,
//                       },
//                     }
//                     : e
//                 )
//               );
//               break;
//             case "DELETE":
//               if (!oldRow || !("id" in oldRow)) break;
//               setEvents((prev) => prev.filter((e) => e.id !== String(oldRow.id)));
//               break;
//           }
//         }
//       )
//       .subscribe();
//     realtimeRef.current = channel;
//     return () => {
//       if (realtimeRef.current?.unsubscribe) realtimeRef.current.unsubscribe();
//     };
//   }, []);

//   // view updates on resize
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const calendarApi = calendarRef.current?.getApi();
//     if (!calendarApi) return;
//     const updateView = () => {
//       const w = window.innerWidth;
//       if (w < 640) {
//         calendarApi.changeView("listWeek");
//       } else if (w < 768) {
//         calendarApi.changeView("timeGridDay");
//       } else if (w < 1024) {
//         calendarApi.changeView("timeGridWeek");
//       } else {
//         calendarApi.changeView("dayGridMonth");
//       }
//     };
//     updateView();
//     window.addEventListener("resize", updateView);
//     return () => window.removeEventListener("resize", updateView);
//   }, [isMobile]);

//   // keyboard shortcuts
//   useEffect(() => {
//     if (!mode) return;
//     const handler = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setMode(null);
//         setIsEditing(false);
//       }
//       if (e.key === "Enter") {
//         if (mode === "create") {
//           e.preventDefault();
//           if (currentEvent && currentEvent.title.trim()) {
//             handleSave();
//           }
//         }
//       }
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [mode, currentEvent, isEditing]);

//   const handleDateClick = (info: DateClickArg) => {
//     const startStr = toLocalInput(info.dateStr);
//     const isAllDay = info.allDay;
//     const start = isAllDay ? startStr.slice(0, 10) : startStr;
//     const end = isAllDay ? undefined : toLocalInput(new Date(new Date(info.dateStr).getTime() + 3600000).toString());
//     setCurrentEvent({
//       id: `tmp-${Date.now()}`,
//       title: "",
//       start,
//       end,
//       allDay: isAllDay,
//       color: "#6366f1",
//       extendedProps: { description: "", isBloom: false, isCompleted: false },
//     });
//     setMode("create");
//     setIsEditing(false);
//   };

//   const handleCloseModal = () => {
//     setMode(null);
//     setIsEditing(false);
//   };

//   // Save event (create)
//   const handleSave = async () => {
//     if (!currentEvent || !currentEvent.title.trim()) return;
//     const eventPayload = {
//       title: currentEvent.title,
//       start: currentEvent.start,
//       end: currentEvent.end,
//       description: currentEvent.extendedProps?.description || "",
//       isBloom: currentEvent.extendedProps?.isBloom || false,
//       isCompleted: currentEvent.extendedProps?.isCompleted || false,
//     };
//     const isBloom = currentEvent.extendedProps?.isBloom;
//     if (isBloom && onCreateBloomFromEvent) {
//       onCreateBloomFromEvent({
//         title: eventPayload.title,
//         description: eventPayload.description,
//         dueDate: eventPayload.start,
//         isCompleted: eventPayload.isCompleted,
//       });
//       handleCloseModal();
//       return;
//     }
//     try {
//       setIsLoading(true);
//       const response = await fetch("/api/events", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(eventPayload),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to save event");
//       }
//       handleCloseModal();
//     } catch (err: unknown) {
//       console.error("Error saving event:", err);
//       setErrorMessage("Failed to save event. Try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Quick add
//   const handleQuickAdd = async () => {
//     if (!quickText.trim()) return;
//     const newEvent: CalendarEvent = {
//       id: `qa-${Date.now()}`,
//       title: quickText,
//       start: new Date().toISOString().slice(0, 10),
//       allDay: true,
//       color: "#6366f1",
//       extendedProps: { description: "Quick add", isBloom: false, isCompleted: false },
//     };
//     setEvents((prev) => [...prev, newEvent]);
//     setQuickText("");
//     try {
//       const { data: inserted, error } = await supabaseClient
//         .from("Event")
//         .insert([
//           {
//             title: newEvent.title,
//             start: newEvent.start,
//             description: newEvent.extendedProps?.description,
//             isBloom: false,
//             isCompleted: false,
//             updatedAt: new Date().toISOString(),
//           },
//         ])
//         .select()
//         .single();
//       if (error) throw error;
//       setEvents((prev) =>
//         prev.map((e) => (e.id === newEvent.id ? { ...e, id: String(inserted.id) } : e))
//       );
//     } catch (err) {
//       console.error("Quick add error:", err);
//       setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
//       setErrorMessage("Quick add failed.");
//     }
//   };

//   // Mark complete with confetti
//   const handleComplete = async (id: string) => {
//     const originalEvents = [...events];
//     setEvents((prev) =>
//       prev.map((e) =>
//         e.id === id ? { ...e, extendedProps: { ...e.extendedProps, isCompleted: true } } : e
//       )
//     );
//     try {
//       const response = await fetch("/api/events", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id: id, isCompleted: true }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to complete event");
//       }
//       confetti({ 
//         particleCount: 100, 
//         spread: 70, 
//         origin: { y: 0.6 },
//         colors: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b']
//       });
//       handleCloseModal();
//     } catch (err) {
//       console.error("Error completing event:", err);
//       setEvents(originalEvents);
//       setErrorMessage("Failed to mark completed.");
//     }
//   };

//   // Update event
//   const handleUpdate = async () => {
//     if (!currentEvent) return;
//     const originalEvents = [...events];
//     setEvents((prev) => prev.map((e) => (e.id === currentEvent.id ? currentEvent : e)));
//     handleCloseModal();
//     try {
//       const response = await fetch("/api/events", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           id: currentEvent.id,
//           title: currentEvent.title,
//           description: currentEvent.extendedProps?.description,
//           start: currentEvent.start,
//           end: currentEvent.end,
//         }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to update event");
//       }
//     } catch (err) {
//       console.error("Error updating event:", err);
//       setEvents(originalEvents);
//       setErrorMessage("Failed to update event.");
//     }
//   };

//   // Delete with Undo
//   const handleDelete = async () => {
//     if (!currentEvent) return;
//     if (!window.confirm("Are you sure you want to delete this event?")) return;
//     const originalEvents = [...events];
//     setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
//     setLastDeletedEvent(currentEvent);
//     if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
//     handleCloseModal();
//     try {
//       const response = await fetch("/api/events", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ id: currentEvent.id }),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to delete event");
//       }
//       undoTimerRef.current = window.setTimeout(() => {
//         setLastDeletedEvent(null);
//         undoTimerRef.current = null;
//       }, 6000);
//     } catch (err) {
//       console.error("Error deleting event:", err);
//       setEvents(originalEvents);
//       setErrorMessage("Failed to delete event.");
//       setLastDeletedEvent(null);
//     }
//   };

//   // Undo deletion
//   const handleUndoDelete = async () => {
//     if (!lastDeletedEvent) return;
//     setEvents((prev) => [...prev, lastDeletedEvent]);
//     setLastDeletedEvent(null);
//     if (undoTimerRef.current) {
//       window.clearTimeout(undoTimerRef.current);
//       undoTimerRef.current = null;
//     }
//     try {
//       const payload = {
//         title: lastDeletedEvent.title,
//         start: lastDeletedEvent.start,
//         end: lastDeletedEvent.end,
//         description: lastDeletedEvent.extendedProps?.description || "",
//         isBloom: lastDeletedEvent.extendedProps?.isBloom || false,
//         isCompleted: lastDeletedEvent.extendedProps?.isCompleted || false,
//       };
//       const response = await fetch("/api/events", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!response.ok) {
//         setErrorMessage("Undo succeeded locally but server re-create failed.");
//       }
//     } catch (err) {
//       console.error("Undo re-create error:", err);
//       setErrorMessage("Undo succeeded locally but server re-create failed.");
//     }
//   };

//   // Drag handler with debounce
//   const handleEventDrop = async (info: EventDropArg) => {
//     const { event } = info;
//     if (dragDebounceRef.current) window.clearTimeout(dragDebounceRef.current);
//     dragDebounceRef.current = window.setTimeout(async () => {
//       try {
//         const response = await fetch("/api/events", {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             id: event.id,
//             start: event.startStr,
//             end: event.endStr || null,
//           }),
//         });
//         if (!response.ok) throw new Error("Failed to update event drop");
//       } catch (err) {
//         console.error("Error updating event drop:", err);
//         info.revert();
//         setErrorMessage("Failed to move event.");
//       } finally {
//         dragDebounceRef.current = null;
//       }
//     }, 300);
//   };

//   // Resize handler with debounce
//   const handleEventResize = async (info: EventResizeDoneArg) => {
//     const { event } = info;
//     if (resizeDebounceRef.current) window.clearTimeout(resizeDebounceRef.current);
//     resizeDebounceRef.current = window.setTimeout(async () => {
//       try {
//         const response = await fetch("/api/events", {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             id: event.id,
//             start: event.startStr,
//             end: event.endStr,
//           }),
//         });
//         if (!response.ok) throw new Error("Failed to update event resize");
//       } catch (err) {
//         console.error("Error updating event resize:", err);
//         info.revert();
//         setErrorMessage("Failed to resize event.");
//       } finally {
//         resizeDebounceRef.current = null;
//       }
//     }, 300);
//   };

//   // Enhanced event content with better styling
//   const eventContent = useCallback((arg: EventContentArg) => {
//     const ext = arg.event.extendedProps as any;
//     const isBloom = ext?.isBloom;
//     const isCompleted = ext?.isCompleted;
//     const dot = isCompleted ? "✅" : isBloom ? "✨" : "📌";
    
//     return (
//       <div
//         title={arg.event.title + (ext?.description ? " — " + ext.description : "")}
//         className="group px-3 py-2 text-xs rounded-lg flex items-center gap-2 border-2 cursor-pointer w-full overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
//         style={{
//           borderColor: arg.event.backgroundColor,
//           background: `linear-gradient(135deg, ${arg.event.backgroundColor}20, ${arg.event.backgroundColor}10)`,
//           backdropFilter: 'blur(10px)',
//         }}
//         onClick={() => {
//           setCurrentEvent({
//             id: arg.event.id,
//             title: arg.event.title,
//             start: arg.event.startStr,
//             end: arg.event.endStr,
//             allDay: arg.event.allDay,
//             color: arg.event.backgroundColor,
//             extendedProps: {
//               description: ext?.description,
//               isBloom: ext?.isBloom,
//               isCompleted: ext?.isCompleted,
//             },
//           });
//           setMode("view");
//           setIsEditing(false);
//         }}
//       >
//         <span className="flex-shrink-0 text-sm group-hover:scale-110 transition-transform">{dot}</span>
//         <span
//           className={`truncate font-medium max-w-[70%] text-xs sm:text-sm transition-all duration-200 ${
//             isCompleted 
//               ? "line-through text-gray-500" 
//               : isBloom 
//                 ? "text-emerald-700 font-semibold" 
//                 : "text-indigo-700"
//           }`}
//         >
//           {arg.event.title}
//         </span>
//         <div className="ml-auto flex items-center gap-1">
//           {isBloom && (
//             <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 hidden sm:inline-block font-medium">
//               Bloom
//             </span>
//           )}
//           {isCompleted && (
//             <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 hidden sm:inline-block font-medium">
//               Done
//             </span>
//           )}
//           {!isBloom && !isCompleted && (
//             <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 hidden sm:inline-block font-medium">
//               Event
//             </span>
//           )}
//         </div>
//       </div>
//     );
//   }, []);

//   // Enhanced FormButtons with better styling
//   const FormButtons = useCallback(() => (
//     <div className="w-full flex flex-col sm:flex-row sm:justify-end gap-3">
//       {mode === "create" && (
//         <Button 
//           onClick={handleSave} 
//           className="py-3 px-6 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Create Event
//         </Button>
//       )}
//       {mode === "view" && currentEvent && (
//         <>
//           {!isEditing && !currentEvent.extendedProps?.isCompleted && (
//             <Button 
//               onClick={() => setIsEditing(true)} 
//               variant="outline"
//               className="py-3 px-6 text-sm sm:text-base border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
//             >
//               <Edit3 className="w-4 h-4 mr-2" />
//               Edit
//             </Button>
//           )}
//           {isEditing && (
//             <Button 
//               onClick={handleUpdate} 
//               className="py-3 px-6 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//             >
//               <CheckCircle className="w-4 h-4 mr-2" />
//               Save Changes
//             </Button>
//           )}
//           {!currentEvent.extendedProps?.isCompleted && (
//             <Button 
//               onClick={() => handleComplete(currentEvent.id)} 
//               className="py-3 px-6 text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//             >
//               <CheckCircle className="w-4 h-4 mr-2" />
//               Mark Complete
//             </Button>
//           )}
//           <Button 
//             variant="destructive" 
//             onClick={handleDelete} 
//             className="py-3 px-6 text-sm sm:text-base bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
//           >
//             <Trash2 className="w-4 h-4 mr-2" />
//             Delete
//           </Button>
//         </>
//       )}
//     </div>
//   ), [mode, currentEvent, isEditing]);

//   // Enhanced skeleton loader
//   const SkeletonLoader = () => (
//     <div className="space-y-4">
//       <div className="flex gap-4">
//         <div className="h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse flex-1" />
//         <div className="h-10 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg animate-pulse" />
//       </div>
//       <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse border-2 border-gray-100" />
//     </div>
//   );

//   return (
//     <div className="relative">
//       {/* Main container with enhanced styling */}
//       <div className="border-2 border-gray-100 rounded-3xl shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-4 sm:p-8 relative overflow-hidden backdrop-blur-sm">
//         {/* Background decoration */}
//         <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full -translate-y-36 translate-x-36 pointer-events-none" />
//         <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-100/40 to-transparent rounded-full translate-y-48 -translate-x-48 pointer-events-none" />

//         {/* Enhanced Error / Undo banners */}
//         {errorMessage && (
//           <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-100 rounded-xl text-sm text-red-700 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
//             <div className="flex items-center gap-3">
//               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
//               <span className="font-medium">{errorMessage}</span>
//             </div>
//             <button
//               className="ml-3 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
//               onClick={() => setErrorMessage(null)}
//               aria-label="Dismiss error"
//             >
//               <X className="w-4 h-4" />
//             </button>
//           </div>
//         )}
        
//         {lastDeletedEvent && (
//           <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-100 rounded-xl text-sm flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
//             <div className="flex items-center gap-3">
//               <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
//               <div>
//                 <span className="font-medium text-amber-800">
//                   Deleted "{lastDeletedEvent.title}"
//                 </span>
//                 <span className="text-amber-600 ml-2">— You can undo this action</span>
//               </div>
//             </div>
//             <Button 
//               size="sm" 
//               onClick={handleUndoDelete}
//               className="bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
//             >
//               Undo
//             </Button>
//           </div>
//         )}

//         {/* Enhanced Header */}
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
//           {/* Left Side: Enhanced Title */}
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-20" />
//               <div className="relative w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
//                 <CalendarIcon className="w-6 h-6 text-white" />
//               </div>
//             </div>
//             <div>
//               <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
//                 Daily Blooms Calendar
//               </h2>
//               <p className="text-sm text-gray-500 mt-1">Organize your blooms and events beautifully</p>
//             </div>
//           </div>

//           {/* Right Side: Enhanced Controls */}
//           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
//             {/* Enhanced Filter Toggles */}
//             <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-2 rounded-2xl border-2 border-gray-100 shadow-lg">
//               <Filter className="w-4 h-4 text-gray-500 mx-2" />
//               <div className="flex gap-1">
//                 <Button
//                   size="sm"
//                   onClick={() => toggleFilter("bloom")}
//                   variant={activeFilters.includes("bloom") ? "default" : "ghost"}
//                   className={`text-xs sm:text-sm h-9 px-4 rounded-xl transition-all duration-200 ${
//                     activeFilters.includes("bloom")
//                       ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
//                       : "hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
//                   }`}
//                   aria-pressed={activeFilters.includes("bloom")}
//                 >
//                   <Sparkles className="w-3 h-3 mr-1.5" />
//                   Blooms
//                 </Button>
//                 <Button
//                   size="sm"
//                   onClick={() => toggleFilter("custom")}
//                   variant={activeFilters.includes("custom") ? "default" : "ghost"}
//                   className={`text-xs sm:text-sm h-9 px-4 rounded-xl transition-all duration-200 ${
//                     activeFilters.includes("custom")
//                       ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
//                       : "hover:bg-indigo-50 text-indigo-700 border border-indigo-200"
//                   }`}
//                   aria-pressed={activeFilters.includes("custom")}
//                 >
//                   📌 Events
//                 </Button>
//               </div>
//             </div>

//             {/* Enhanced Quick Add */}
//             <div className="hidden sm:flex w-full sm:w-auto gap-3 bg-white/70 backdrop-blur-sm p-2 rounded-2xl border-2 border-gray-100 shadow-lg">
//               <Input
//                 placeholder="Quick add event..."
//                 value={quickText}
//                 onChange={(e) => setQuickText(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
//                 className="flex-grow text-sm h-9 border-none bg-transparent focus:ring-0 focus:border-none placeholder:text-gray-400"
//               />
//               <Button 
//                 onClick={handleQuickAdd} 
//                 size="icon" 
//                 className="flex-shrink-0 h-9 w-9 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
//               >
//                 <Plus size={16} />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Enhanced FullCalendar Container */}
//         <div className="relative">
//           <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 rounded-2xl -z-10" />
//           <div className="fc-theme bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-100 shadow-xl overflow-hidden">
//             {isLoading ? (
//               <div className="p-6">
//                 <SkeletonLoader />
//               </div>
//             ) : (
//               <div className="p-4">
//                 <FullCalendar
//                   ref={calendarRef}
//                   plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
//                   initialView="listWeek"
//                   headerToolbar={{
//                     left: "prev,next today",
//                     center: "title",
//                     right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
//                   }}
//                   events={filteredEvents}
//                   editable={true}
//                   selectable={true}
//                   dayMaxEvents={true}
//                   eventOverlap={false}
//                   slotEventOverlap={false}
//                   eventContent={eventContent}
//                   dateClick={handleDateClick}
//                   eventDrop={handleEventDrop}
//                   eventResize={handleEventResize}
//                   dayHeaderFormat={{ weekday: isMobile ? "short" : "long" }}
//                   views={{
//                     dayGridMonth: { titleFormat: { year: "numeric", month: "long" } },
//                     timeGridWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
//                     timeGridDay: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
//                     listWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
//                   }}
//                   height="auto"
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Enhanced Floating Action Button for Mobile */}
//         {isMobile && (
//           <div className="fixed bottom-6 right-6 z-50">
//             <button
//               title="Quick add event"
//               onClick={() => {
//                 const start = new Date().toISOString().slice(0, 10);
//                 setCurrentEvent({
//                   id: `tmp-${Date.now()}`,
//                   title: "",
//                   start,
//                   end: undefined,
//                   allDay: true,
//                   color: "#6366f1",
//                   extendedProps: { description: "", isBloom: false, isCompleted: false },
//                 });
//                 setMode("create");
//                 setIsEditing(false);
//               }}
//               className="group w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
//               <Plus size={24} className="relative z-10 group-hover:scale-110 transition-transform" />
//             </button>
//           </div>
//         )}

//         {/* Enhanced Modal / Drawer */}
//         {isTabletOrBelow ? (
//           <Drawer open={!!mode} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
//             <DrawerContent className="max-h-[90vh] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
//               <DrawerHeader className="text-left border-b border-gray-100 pb-4">
//                 <DrawerTitle className="text-xl font-bold flex items-center gap-3">
//                   <div className={`w-3 h-3 rounded-full ${mode === "create" ? "bg-blue-500" : "bg-green-500"} animate-pulse`} />
//                   {mode === "create" ? "Create New Event" : "Event Details"}
//                 </DrawerTitle>
//                 <DrawerDescription className="text-gray-600 mt-1">
//                   {mode === "create" 
//                     ? "Fill in the details for your new event and make it bloom!" 
//                     : "View, edit, or manage your event details with ease."}
//                 </DrawerDescription>
//               </DrawerHeader>
//               <div className="px-4 max-h-[60vh] overflow-y-auto">
//                 {currentEvent && (
//                   <EventForm currentEvent={currentEvent} setCurrentEvent={setCurrentEvent} mode={mode} isEditing={isEditing} />
//                 )}
//               </div>
//               <DrawerFooter className="pt-6 border-t border-gray-100">
//                 <FormButtons />
//               </DrawerFooter>
//             </DrawerContent>
//           </Drawer>
//         ) : (
//           <Dialog open={!!mode} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
//             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-2 border-gray-100">
//               <DialogHeader className="border-b border-gray-100 pb-6">
//                 <DialogTitle className="text-2xl font-bold flex items-center gap-3">
//                   <div className={`w-3 h-3 rounded-full ${mode === "create" ? "bg-blue-500" : "bg-green-500"} animate-pulse`} />
//                   {mode === "create" ? "Create New Event" : "Event Details"}
//                 </DialogTitle>
//                 <DialogDescription className="text-gray-600 text-base mt-2">
//                   {mode === "create" 
//                     ? "Fill in the details for your new event and make it bloom!" 
//                     : "View, edit, or manage your event details with ease."}
//                 </DialogDescription>
//               </DialogHeader>
//               {currentEvent && (
//                 <EventForm currentEvent={currentEvent} setCurrentEvent={setCurrentEvent} mode={mode} isEditing={isEditing} />
//               )}
//               <DialogFooter className="pt-6 border-t border-gray-100">
//                 <FormButtons />
//               </DialogFooter>
//             </DialogContent>
//           </Dialog>
//         )}
//       </div>

//       {/* Custom Styles for FullCalendar */}
//       <style jsx global>{`
//         .fc-theme .fc-toolbar {
//           margin-bottom: 1.5rem;
//         }
        
//         .fc-theme .fc-toolbar-title {
//           font-size: 1.5rem;
//           font-weight: 700;
//           color: #1f2937;
//         }
        
//         .fc-theme .fc-button {
//           background: linear-gradient(135deg, #6366f1, #4f46e5);
//           border: none;
//           border-radius: 0.75rem;
//           padding: 0.5rem 1rem;
//           font-weight: 500;
//           box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
//           transition: all 0.2s ease;
//         }
        
//         .fc-theme .fc-button:hover {
//           background: linear-gradient(135deg, #4f46e5, #4338ca);
//           transform: translateY(-1px);
//           box-shadow: 0 8px 12px -1px rgb(0 0 0 / 0.15);
//         }
        
//         .fc-theme .fc-button-primary:not(:disabled):active,
//         .fc-theme .fc-button-primary:not(:disabled).fc-button-active {
//           background: linear-gradient(135deg, #4338ca, #3730a3);
//         }
        
//         .fc-theme .fc-daygrid-day {
//           background: rgba(255, 255, 255, 0.5);
//           border: 1px solid #e5e7eb;
//           transition: all 0.2s ease;
//         }
        
//         .fc-theme .fc-daygrid-day:hover {
//           background: rgba(239, 246, 255, 0.8);
//           cursor: pointer;
//         }
        
//         .fc-theme .fc-list-event:hover td {
//           background: rgba(239, 246, 255, 0.8);
//         }
        
//         .fc-theme .fc-col-header-cell {
//           background: linear-gradient(135deg, #f8fafc, #f1f5f9);
//           border: 1px solid #e2e8f0;
//           font-weight: 600;
//           color: #475569;
//         }
        
//         .fc-theme .fc-scrollgrid {
//           border-radius: 1rem;
//           overflow: hidden;
//           border: 2px solid #e5e7eb;
//         }
        
//         .fc-theme .fc-event {
//           border-radius: 0.5rem;
//           border: none;
//           margin: 2px;
//         }
        
//         @media (max-width: 640px) {
//           .fc-theme .fc-toolbar {
//             flex-direction: column;
//             gap: 1rem;
//           }
          
//           .fc-theme .fc-toolbar-chunk {
//             display: flex;
//             justify-content: center;
//             gap: 0.5rem;
//           }
          
//           .fc-theme .fc-button {
//             font-size: 0.75rem;
//             padding: 0.375rem 0.75rem;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default DailyBloomCalendar;