"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
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
  allDay?: boolean;
}

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
  events: CalendarEvent[];
  onCreateBloomFromEvent: (payload: {
    title: string;
    description?: string;
    dueDate?: string;
    isCompleted?: boolean;
  }) => void;
  onUpdateBloomFromEvent: (payload: {
    id: string;
    updatedData: {
      title?: string;
      description?: string;
      dueDate?: string;
    };
  }) => void;
  onDeleteBloomFromEvent: (bloomId: string) => void;
}

// ---------------- Helpers ----------------

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

const isTempId = (id?: string | number | null) => typeof id === "string" && id.startsWith("tmp-");

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

const useIsMobile = () => {
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
  </div>
);

// ---------------- Main Component ----------------

const DailyBloomCalendar: React.FC<Props> = ({
  events: eventsProp,
  onCreateBloomFromEvent,
  onUpdateBloomFromEvent,
  onDeleteBloomFromEvent,
}) => {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<CalendarEvent[]>(eventsProp);
  const [quickText, setQuickText] = useState("");
  const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
  const [mode, setMode] = useState<"view" | "create" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [isTabletOrBelow, setIsTabletOrBelow] = useState(false);
  const supabaseClient = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastDeletedEvent, setLastDeletedEvent] = useState<CalendarEvent | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dragDebounceRef = useRef<number | null>(null);
  const resizeDebounceRef = useRef<number | null>(null);
  const resizeViewDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    setEvents(eventsProp);
    setIsLoading(false);
  }, [eventsProp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsTabletOrBelow(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!supabaseClient) {
      return;
    }

    const channel = supabaseClient
      .channel("public:Event")
      .on<EventPayload>(
        "postgres_changes",
        { event: "*", schema: "public", table: "Event" },
        (payload) => {
          const newRow = payload.new as EventPayload;
          const oldRow = payload.old as { id: number };

          switch (payload.eventType) {
            case "INSERT":
              if (!("id" in newRow)) break;
              setEvents((prev: CalendarEvent[]) => [
                ...prev.filter((e: CalendarEvent) => e.id !== String(newRow.id)),
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
              setEvents((prev: CalendarEvent[]) =>
                prev.map((e: CalendarEvent) =>
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
              setEvents((prev: CalendarEvent[]) => prev.filter((e: CalendarEvent) => e.id !== String(oldRow.id)));
              break;
          }
        }
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

    const timerId = setTimeout(() => {
      updateView();
    }, 0);

    const debouncedUpdateView = () => {
      if (resizeViewDebounceRef.current) {
        window.clearTimeout(resizeViewDebounceRef.current);
      }
      resizeViewDebounceRef.current = window.setTimeout(() => {
        updateView();
      }, 300);
    };

    window.addEventListener("resize", debouncedUpdateView);

    return () => {
      window.removeEventListener("resize", debouncedUpdateView);
      clearTimeout(timerId);
      if (resizeViewDebounceRef.current) {
        window.clearTimeout(resizeViewDebounceRef.current);
      }
    };
  }, []);

  const handleCloseModal = useCallback(() => {
    setMode(null);
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentEvent || !currentEvent.title.trim()) return;

    const tmpId = currentEvent.id?.toString().startsWith("tmp-")
      ? currentEvent.id!
      : `tmp-${Date.now()}`;

    const eventPayload = {
      title: currentEvent.title,
      start: currentEvent.start,
      end: currentEvent.end ?? null,
      description: currentEvent.extendedProps?.description || "",
      isBloom: true,
      isCompleted: currentEvent.extendedProps?.isCompleted || false,
      allDay: currentEvent.allDay ?? false,
    };

    setIsLoading(true);

    setEvents((prev: CalendarEvent[]) => {
      if (prev.some((e: CalendarEvent) => e.id === tmpId)) return prev;
      return [
        ...prev,
        {
          ...currentEvent,
          id: tmpId,
          extendedProps: { ...(currentEvent.extendedProps || {}), isBloom: true },
        },
      ];
    });

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Failed to save event");

      const serverEvent = toCalendarEventFromServer(json.data);
      setEvents((prev: CalendarEvent[]) => prev.map((e: CalendarEvent) => (e.id === tmpId ? serverEvent : e)));

      if (onCreateBloomFromEvent) {
        onCreateBloomFromEvent({
          title: serverEvent.title,
          description: serverEvent.extendedProps?.description,
          dueDate: serverEvent.start,
          isCompleted: serverEvent.extendedProps?.isCompleted,
        });
      }

      handleCloseModal();
    } catch (err: unknown) {
      console.error("Error saving event:", err);
      setEvents((prev: CalendarEvent[]) => prev.filter((e: CalendarEvent) => e.id !== tmpId));
      setErrorMessage(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent, onCreateBloomFromEvent, handleCloseModal]);

  useEffect(() => {
    if (!mode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
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
  }, [mode, currentEvent, isEditing, handleSave, handleCloseModal]);

  const handleDateClick = useCallback((info: DateClickArg) => {
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
      extendedProps: { description: "", isBloom: true, isCompleted: false },
    });
    setMode("create");
    setIsEditing(false);
  }, []);

  const handleQuickAdd = useCallback(async () => {
    if (!quickText.trim()) return;
    const tmpId = `tmp-${Date.now()}`;

    const bloomPayload = {
      title: quickText,
      description: "Quick add",
      dueDate: new Date().toISOString().slice(0, 10),
      isCompleted: false,
    };

    const eventPayload = {
      title: bloomPayload.title,
      start: bloomPayload.dueDate,
      end: null,
      description: bloomPayload.description,
      isBloom: true,
      isCompleted: false,
      allDay: true,
    };

    const oldQuickText = quickText;
    setQuickText("");

    const optimisticEvent: CalendarEvent = {
      id: tmpId,
      title: bloomPayload.title,
      start: bloomPayload.dueDate,
      end: undefined,
      allDay: true,
      color: "#4dabf7",
      extendedProps: { description: bloomPayload.description, isBloom: true, isCompleted: false },
    };
    setEvents((prev: CalendarEvent[]) => [...prev, optimisticEvent]);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "Failed to save quick-add event");

      const serverEvent = toCalendarEventFromServer(json.data);
      setEvents((prev: CalendarEvent[]) => prev.map((e: CalendarEvent) => (e.id === tmpId ? serverEvent : e)));

      if (onCreateBloomFromEvent) {
        onCreateBloomFromEvent({
          title: serverEvent.title,
          description: serverEvent.extendedProps?.description,
          dueDate: serverEvent.start,
          isCompleted: serverEvent.extendedProps?.isCompleted,
        });
      }
    } catch (err: unknown) {
      console.error("Quick add error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Quick add failed.");
      setEvents((prev: CalendarEvent[]) => prev.filter((e: CalendarEvent) => e.id !== tmpId));
      setQuickText(oldQuickText);
    }
  }, [quickText, onCreateBloomFromEvent]);

  const handleComplete = useCallback(async (id: string) => {
    setEvents((prev: CalendarEvent[]) =>
      prev.map((e: CalendarEvent) =>
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
      setEvents((prev: CalendarEvent[]) =>
        prev.map((e: CalendarEvent) =>
          e.id === id ? { ...e, extendedProps: { ...e.extendedProps, isCompleted: false } } : e
        )
      );
      setErrorMessage("Failed to mark completed.");
    }
  }, [handleCloseModal]);

  const handleUpdate = useCallback(async () => {
    if (!currentEvent) return;

    if (currentEvent.extendedProps?.isBloom) {
      const bloomId = currentEvent.id.replace(/^bloom-/, "");

      onUpdateBloomFromEvent({
        id: bloomId,
        updatedData: {
          title: currentEvent.title,
          description: currentEvent.extendedProps?.description,
          dueDate: currentEvent.start,
        },
      });

      handleCloseModal();
      return;
    }

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
    }
  }, [currentEvent, handleCloseModal, onUpdateBloomFromEvent]);

  const handleConfirmDelete = useCallback(async () => {
    if (!currentEvent) return;
    const originalEvents = [...events];

    setEvents((prev) => prev.filter((e) => e.id !== currentEvent.id));
    setLastDeletedEvent(currentEvent);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    handleCloseModal();

    if (currentEvent.extendedProps?.isBloom) {
      try {
        const bloomId = currentEvent.id.replace(/^bloom-/, "");
        onDeleteBloomFromEvent(bloomId);
        undoTimerRef.current = window.setTimeout(() => {
          setLastDeletedEvent(null);
          undoTimerRef.current = null;
        }, 6000);
      } catch (err) {
        console.error("Error calling onDeleteBloomFromEvent:", err);
        setEvents(originalEvents);
        setErrorMessage(err instanceof Error ? err.message : "Failed to delete bloom.");
        setLastDeletedEvent(null);
      }
      return;
    }

    try {
      const eventId = currentEvent.id.replace(/^event-/, "");

      const resp = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message || "Failed to delete event");

      undoTimerRef.current = window.setTimeout(() => {
        setLastDeletedEvent(null);
        undoTimerRef.current = null;
      }, 6000);
    } catch (err) {
      console.error("Error deleting event:", err);
      setEvents(originalEvents);
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete event.");
      setLastDeletedEvent(null);
    }
  }, [currentEvent, events, handleCloseModal, onDeleteBloomFromEvent]);

  const handleUndoDelete = useCallback(async () => {
    if (!lastDeletedEvent) return;

    const wasTemp = isTempId(lastDeletedEvent.id);
    setEvents((prev: CalendarEvent[]) => [...prev, lastDeletedEvent]);
    setLastDeletedEvent(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

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
      if (!resp.ok) throw new Error(json?.message || "Failed to recreate event");
      const serverEvent = toCalendarEventFromServer(json.data);
      setEvents((prev: CalendarEvent[]) => prev.map((e: CalendarEvent) => {
        if (e.title === lastDeletedEvent.title && e.start === lastDeletedEvent.start) {
          return serverEvent;
        }
        return e;
      }));
    } catch (err) {
      console.error("Undo re-create error:", err);
      setErrorMessage("Undo succeeded locally but server re-create failed.");
    }
  }, [lastDeletedEvent]);

  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const { event } = info;

    if (isTempId(event.id)) {
      setErrorMessage("Please save the event before moving/resizing it.");
      info.revert();
      return;
    }

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
  }, []);

  const handleEventResize = useCallback(async (info: EventResizeDoneArg) => {
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
  }, []);

  const eventContent = useCallback((arg: EventContentArg) => {
    const ext = arg.event.extendedProps as EventExtendedProps;
    const dot = ext?.isCompleted ? "✅" : ext?.isBloom ? "🌱" : "📌";
    const badge = ext?.isBloom ? "Bloom" : ext?.isCompleted ? "Completed" : "Custom";
    const isListView = arg.view.type === 'listWeek';

    return (
      <div
        title={arg.event.title + (ext?.description ? " — " + ext.description : "")}
        className={`px-2 py-1 text-xs rounded-md flex ${isListView ? 'items-start' : 'items-center'} gap-1.5 border shadow-sm cursor-pointer w-full hover:bg-white/60 transition`}
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
        <span className={`flex-shrink-0 text-[12px] ${isListView ? 'pt-0.5' : ''}`}>{dot}</span>
        <span
          className={`flex-grow font-medium text-xs sm:text-sm ${ext?.isCompleted ? "line-through text-muted-foreground" : ""
            } ${isListView ? 'whitespace-normal break-words' : 'truncate'}`}
        >
          {arg.event.title}
        </span>
        <span className="ml-auto text-[10px] px-2 py-[2px] rounded-full bg-white/30 border text-muted-foreground hidden sm:inline-block flex-shrink-0">
          {badge}
        </span>
      </div>
    );
  }, []);

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

  const SkeletonLoader = () => (
    <div className="grid gap-2">
      <div className="h-8 bg-gray-100 rounded animate-pulse" />
      <div className="h-48 bg-gray-100 rounded animate-pulse" />
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
            <span className="font-medium">..You can undo this action</span>
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
        <style>
          {`
            /* --- CHANGE: Custom styles for FullCalendar toolbar buttons --- */

            /* Default state for all primary buttons (Month, Week, Day, Today, Arrows) */
            .fc-theme .fc-button-primary {
              background-color: #f1f5f9; /* slate-100 */
              border-color: #cbd5e1; /* slate-300 */
              color: #1e293b; /* slate-800 */
              transition: background-color 0.2s, border-color 0.2s;
            }

            /* Hover state for buttons */
            .fc-theme .fc-button-primary:hover {
              background-color: #e2e8f0; /* slate-200 */
              border-color: #94a3b8; /* slate-400 */
            }

            /* Active state for view-switcher buttons (Month, Week, etc.) */
            .fc-theme .fc-button-primary.fc-button-active,
            .fc-theme .fc-button-primary.fc-button-active:hover {
              background-color: #475569; /* slate-600 */
              border-color: #475569; /* slate-600 */
              color: #ffffff;
            }

            /* --- FIX: Make "Today" button always visible --- */
            .fc-theme .fc-today-button.fc-button:disabled {
              background-color: #f1f5f9; /* Same as default */
              border-color: #cbd5e1;   /* Same as default */
              color: #1e293b;        /* Same as default */
              opacity: 1;             /* Remove faded look */
            }
          `}
        </style>
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            // --- CHANGE: Use the main 'events' state directly ---
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
              timeGridWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
              timeGridDay: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
              listWeek: { titleFormat: { year: "numeric", month: "short", day: "numeric" } },
            }}
            height="auto"
          />
        )}
      </div>

      {/* Mobile FAB */}
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
                color: "#4dabf7",
                extendedProps: { description: "", isBloom: true, isCompleted: false },
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

      {/* Modal / Drawer */}
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

      {/* Alert Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event:{" "}
              <strong className="text-foreground">
                {currentEvent?.title || 'this event'}
              </strong>
              You can briefly undo this after deletion.
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