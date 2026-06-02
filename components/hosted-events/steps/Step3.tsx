"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Calendar,
  Globe,
  ChevronDown,
  Trash2,
  PlusCircle,
  Pencil,
} from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { differenceInCalendarDays, format } from "date-fns";

// Ensure these point to your actual shadcn component paths
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { theme } from "@/lib/new-home/theme/theme";
import { AgendaSlot, AgendaSlotPayload, HostedEventResponse } from "@/types/client/events";
import z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";

const step3Schema = z.object({
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .refine((val) => val?.from && val?.to, {
      message: "Date range is required",
    }),

  agendaSlots: z
    .array(
      z.object({
        id: z.string().optional(),
        day: z.number(),
        time: z.string().min(1, "Time required"),
        title: z.string().min(1, "Title required"),
        description: z.string().min(1, "Description required"),
        order: z.number(),
      }),
    )
    .min(1, "At least one agenda slot is required"),
});
type AgendaItem = {
  id: string;
  time: string;
  title: string;
  description: string;
};

type FormData = {
  id: string;
  time: string;
  title: string;
  description: string;
};
type Step3Payload = {
  startTime: string;
  endTime: string;
  timeZone: string;
  agendaSlots: AgendaSlotPayload[];
};

const TIMEZONES = [
  { label: "India (IST - Asia/Kolkata)", value: "Asia/Kolkata" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

export default function Step3({
  onNext,
  setIsLoading,
  eventData,
  eventId,
}: {
  onNext: () => void;
  setIsLoading: (loading: boolean) => void;
  eventData?: HostedEventResponse;
  eventId?: string | undefined | null;
}) {
  const [activeDay, setActiveDay] = useState(1);
  const [timezone, setTimezone] = useState(
  eventData?.event?.timeZone ?? "Asia/Kolkata"
);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (eventData?.event?.startTime && eventData?.event?.endTime) {
      return {
        from: new Date(eventData.event.startTime),
        to: new Date(eventData.event.endTime),
      };
    }
    return undefined;
  });

  const [agendaData, setAgendaData] = useState<Record<number, AgendaItem[]>>(
    () => {
      if (
        eventData?.event?.agendaSlots &&
        eventData.event.agendaSlots.length > 0
      ) {
        // Group slots by day
        const grouped: Record<number, AgendaItem[]> = {};
        eventData.event.agendaSlots.forEach((slot: AgendaSlot) => {
          if (!grouped[slot.day]) grouped[slot.day] = [];
          grouped[slot.day].push({
            id: slot.id,
            time: slot.time,
            title: slot.title,
            description: slot.description ?? "",
          });
        });
        return grouped;
      }

      // Fallback placeholder only when no saved data
      return {
        1: [
          {
            id: "1",
            time: "09:00 AM",
            title: "Opening Ceremony & Tea",
            description:
              "Settle into the space with a traditional silent tea ceremony and intention setting.",
          },
          {
            id: "2",
            time: "10:30 AM",
            title: "The Art of Stillness",
            description:
              "Guided workshop on modern mindfulness and the neurobiology of calm.",
          },
          {
            id: "3",
            time: "01:00 PM",
            title: "Nourishing Community Lunch",
            description:
              "Farm-to-table organic lunch served in the garden pavilion.",
          },
        ],
      };
    },
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      id: "",
      time: "",
      title: "",
      description: "",
    },
  });
  const queryClient = useQueryClient();

  const updateStep3 = useMutation({
    mutationFn: async (payload: Step3Payload) => {
      setIsLoading(true);
      const res = await axios.put(`/api/hosted-events/${eventId}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      toast.success("Step 3 saved");
      onNext();
    },
    onError: () => {
      toast.error("Failed to save agenda");
    },
    onSettled: () => setIsLoading(false),
  });
  const currentId = watch("id");
  const totalDays =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from) + 1
      : 0;

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // --- Handlers ---
 const handleOpenAdd = () => {
  reset({ id: "", time: "", title: "", description: "" });
  setIsDialogOpen(true);
};

const handleOpenEdit = (item: AgendaItem) => {
  reset({ // use reset instead of setValue to also clear errors
    id: item.id,
    time: item.time,
    title: item.title,
    description: item.description,
  });
  setIsDialogOpen(true);
};

  const handleDelete = (id: string) => {
    setAgendaData((prev) => ({
      ...prev,
      [activeDay]: (prev[activeDay] || []).filter((item) => item.id !== id),
    }));
  };

  const onSubmit = (data: FormData) => {
    setAgendaData((prev) => {
      const currentDayItems = prev[activeDay] || [];

      if (data.id) {
        // Edit existing
        return {
          ...prev,
          [activeDay]: currentDayItems.map((item) =>
            item.id === data.id ? { ...data } : item,
          ),
        };
      } else {
        // Add new
        return {
          ...prev,
          [activeDay]: [
            ...currentDayItems,
            { ...data, id: `temp-${Date.now()}` }, // simple unique ID
          ],
        };
      }
    });

    setIsDialogOpen(false);
    reset({ id: "", time: "", title: "", description: "" });
  };

const buildAgendaPayload = () => {
  const slots: AgendaSlotPayload[] = [];

  const parseTime = (timeStr: string): number => {
    const [time, meridiem] = timeStr.trim().split(" ");
    const [h, minutes] = time.split(":").map(Number);
    let hours = h;
    if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  Object.entries(agendaData).forEach(([day, items]) => {
    const sorted = [...items].sort(
      (a, b) => parseTime(a.time) - parseTime(b.time)
    );
    sorted.forEach((item, index) => {
      slots.push({
        id: item.id?.startsWith("temp-") ? undefined : item.id,
        day: Number(day),
        time: item.time,
        title: item.title,
        description: item.description || null,
        order: index, // now chronologically correct
      });
    });
  });

  return slots;
};

const onFinalSubmit = async (values: z.infer<typeof step3Schema>) => {
  // Find first slot of day 1 (sorted by time string isn't reliable, use order)
  const day1Slots = agendaData[1] ?? [];
  const lastDaySlots = agendaData[totalDays] ?? [];

  // Get first slot time of day 1 and last slot time of last day
  const firstSlotTime = day1Slots[0]?.time;        // e.g. "09:00 AM"
  const lastSlotTime = lastDaySlots[lastDaySlots.length - 1]?.time; // e.g. "08:00 PM"

  const parseSlotTime = (date: Date, timeStr: string): Date => {
    const [time, meridiem] = timeStr.split(" ");
    const [h, minutes] = time.split(":").map(Number);
    let hours = h;
    if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0);
  };

  const startLocal = firstSlotTime
    ? parseSlotTime(values.dateRange.from, firstSlotTime)
    : new Date(values.dateRange.from.getFullYear(), values.dateRange.from.getMonth(), values.dateRange.from.getDate(), 0, 0, 0);

  const endLocal = lastSlotTime
    ? parseSlotTime(values.dateRange.to, lastSlotTime)
    : new Date(values.dateRange.to.getFullYear(), values.dateRange.to.getMonth(), values.dateRange.to.getDate(), 23, 59, 59);

  // Convert local time in selected timezone → UTC
  const startUTC = fromZonedTime(startLocal, timezone);
  const endUTC = fromZonedTime(endLocal, timezone);

  await updateStep3.mutateAsync({
    startTime: startUTC.toISOString(),
    endTime: endUTC.toISOString(),
    timeZone:timezone,
    agendaSlots: values.agendaSlots,
  });
};
  const prepareAndSubmit = async () => {
    const daysWithMissingAgenda = daysArray.filter(
      (day) => !agendaData[day] || agendaData[day].length === 0,
    );

    if (daysWithMissingAgenda.length > 0) {
      toast.error(
        `Please add at least one agenda slot for Day ${daysWithMissingAgenda.join(", Day ")}`,
      );
      // Jump to first incomplete day
      setActiveDay(daysWithMissingAgenda[0]);
      return;
    }
    const payload = {
      dateRange: range,
      agendaSlots: buildAgendaPayload(),
    };

    const parsed = step3Schema.safeParse(payload);

    if (!parsed.success) {
      const error = parsed.error.errors[0];

      if (error.path.includes("agendaSlots")) {
        toast.error("Add at least one agenda slot");
      } else if (error.path.includes("dateRange")) {
        toast.error("Select event date range");
      } else {
        toast.error(error.message);
      }
      return;
    }

    await onFinalSubmit(parsed.data);
  };
  // Safe fallback for current day's agenda array
  const currentAgenda = agendaData[activeDay] || [];

  return (
    <>
      <form
        id="step3-form"
        onSubmit={(e) => {
          e.preventDefault();
          prepareAndSubmit();
        }}
        className="mx-auto px-4 sm:px-6 mt-2 relative"
      >
        <div className="fixed top-0 right-0 w-1/3 h-1/2 bg-orange-50 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
        <div className="fixed bottom-0 left-0 w-1/4 h-1/3 bg-green-50 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <header className="mb-8">
          <h2 className={`${theme.typography.h1} text-3xl mb-2`}>
            Time to map the journey.
          </h2>
          <p className="text-lg opacity-70 max-w-2xl">
            Define when your transformation experience will take place and build
            a rhythmic agenda for your participants.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* LEFT COLUMN: Dates & Timezone */}
          <div className="lg:col-span-4 flex flex-col gap-8 ">
            <section
              className={`bg-white p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-6 opacity-80">
                Event Duration
              </h3>

              <div className="space-y-6">
                {/* Date Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-80">
                    Date Range
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                    <input
                      type="text"
                      readOnly
                      value={
                        range?.from
                          ? range.to
                            ? `${format(range.from, "MMM dd")} — ${format(
                                range.to,
                                "MMM dd, yyyy",
                              )}`
                            : format(range.from, "MMM dd, yyyy")
                          : "Select date range"
                      }
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border ${theme.borderLight} rounded-lg focus:ring-0 focus:${theme.borderAccent} outline-none transition-all cursor-pointer`}
                    />
                  </div>
                  {!range && (
                    <p className="text-red-500 text-xs mt-2">
                      Date range is required
                    </p>
                  )}
                </div>

                {/* Timezone */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-80">
                    Timezone
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                    <select
                      value={timezone}
  onChange={(e) => setTimezone(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-50 border ${theme.borderLight} focus:ring-0 focus:${theme.borderAccent} rounded-lg outline-none appearance-none cursor-pointer`}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Calendar Widget */}
              <div className={`mt-8 pt-8 border-t ${theme.borderLight}`}>
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  defaultMonth={new Date()}
                  disabled={{ before: new Date() }}
                />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Agenda */}
          <div className="lg:col-span-8">
            <section
              className={`bg-white p-8 rounded-xl shadow-sm border ${theme.borderLight} h-full`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className={`${theme.typography.h1} text-2xl mb-1`}>
                    Event Agenda
                  </h3>
                  <p className="text-sm opacity-70">
                    Design the flow of each day.
                  </p>
                </div>

                {totalDays > 0 && (
                  <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
                    {daysArray.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap relative ${
                          activeDay === day
                            ? `bg-white shadow-sm ${theme.textDark}`
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        Day {day}
                        {(!agendaData[day] || agendaData[day].length === 0) && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 relative">
                <div
                  className={`absolute left-[72px] top-6 bottom-6 w-[2px] ${theme.bgSecondary} z-0`}
                ></div>

                {/* Render Agenda Slots */}
                {currentAgenda.map((item) => (
                  <div
                    key={item.id}
                 className="relative z-10 flex flex-col sm:grid sm:grid-cols-[80px_1fr] gap-2 sm:gap-6 items-start group"
                  >
                    <div className="pt-0 sm:pt-4 text-left sm:text-right pr-0 sm:pr-2">
                      <span className={`text-sm font-bold ${theme.textAccent}`}>
                        {item.time}
                      </span>
                    </div>

                    <div className="w-full bg-gray-50 p-5 rounded-lg flex justify-between group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                      <div>
                        <h4 className="text-base font-bold">{item.title}</h4>
                        <p className="text-sm opacity-70 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-start gap-2  transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className={`${theme.hoverTextAccent} transition-colors p-1`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State / Prompt */}
                {currentAgenda.length === 0 && (
                  <p className="text-center opacity-50 py-8 text-sm">
                    No agenda slots for this day yet.
                  </p>
                )}

                {/* Add New Slot Button */}
                <div className="relative z-10 flex flex-col sm:grid sm:grid-cols-[80px_1fr] gap-2 sm:gap-6 items-start mt-8">
                 <div className="hidden sm:block"></div>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className={`w-full border-2 border-dashed rounded-lg py-8 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors border-gray-200 hover:${theme.borderAccent}`}
                  >
                    <PlusCircle className="w-8 h-8 opacity-50" />
                    <span className="text-sm uppercase tracking-widest font-semibold mt-1 opacity-70">
                      Add New Agenda Slot
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>
      {/* --- SHADCN DIALOG FOR ADD/EDIT --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg sm:max-w-[425px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>
                {currentId ? "Edit Agenda Slot" : "Add Agenda Slot"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <input type="hidden" {...register("id")} />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Time</label>
                <input
                  {...register("time", {
                    required: "Time is required",
                    pattern: {
                      value: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
                      message: "Use format like 09:00 AM or 2:30 PM",
                    },
                  })}
                  placeholder="e.g., 09:00 AM"
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent}`}
                />
                {errors.time && (
                  <p className="text-red-500 text-xs">{errors.time.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Title</label>
                <input
                  {...register("title", {
                    required: "Title is required",
                    minLength: {
                      value: 3,
                      message: "Title must be at least 3 characters",
                    },
                  })}
                  placeholder="e.g., Opening Ceremony"
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent}`}
                />
                 {errors.title && (
      <p className="text-red-500 text-xs">{errors.title.message}</p>
    )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  {...register("description", {
        required: "Description is required",
        minLength: { value: 10, message: "Description must be at least 10 characters" },
      })}
                  placeholder="Describe what will happen..."
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent} resize-none h-24`}
                />
                   {errors.description && (
      <p className="text-red-500 text-xs">{errors.description.message}</p>
    )}
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm rounded-full font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-8  py-3 text-center  rounded-full ${theme.buttonDark} text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2`}
              >
                Save Slot
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
