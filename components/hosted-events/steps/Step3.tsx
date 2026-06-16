/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Calendar,
  Globe,
  ChevronDown,
  Trash2,
  PlusCircle,
  Pencil,
  CheckCircle2,
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
import {
  AgendaSlot,
  AgendaSlotPayload,
  HostedEventResponse,
} from "@/types/client/events";
import z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";
import { TimeSelect } from "@/components/ui/TimeSelect24based";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  timezone: string;
  agendaSlots: AgendaSlotPayload[];
};

const TIMEZONES = [
  { label: "India (IST - Asia/Kolkata)", value: "Asia/Kolkata" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

export default function Step3({
  setIsLoading,
  eventData,
  eventId,
  isDraft,
  setIsDraft,
  setIsDraftLoading,
}: {
  onNext: () => void;
  setIsLoading: (loading: boolean) => void;
  eventData?: HostedEventResponse;
  eventId?: string | undefined | null;
  isDraft?: boolean;
  setIsDraft?: (v: boolean) => void;
  setIsDraftLoading?: (v: boolean) => void;
}) {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const [timezone, setTimezone] = useState(
    eventData?.event?.timeZone ?? "Asia/Kolkata",
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
            time: "09:00",
            title: "Opening Ceremony & Tea",
            description:
              "Settle into the space with a traditional silent tea ceremony and intention setting.",
          },
          {
            id: "2",
            time: "10:30",
            title: "The Art of Stillness",
            description:
              "Guided workshop on modern mindfulness and the neurobiology of calm.",
          },
          {
            id: "3",
            time: "13:00",
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
    setValue,
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

  const dateRef = useRef<HTMLDivElement>(null);
  const agendaRef = useRef<HTMLDivElement>(null);

  const updateStep3 = useMutation({
    mutationFn: async (payload: Step3Payload) => {
      if (isDraft) setIsDraftLoading?.(true);
      else setIsLoading(true);
      const res = await axios.put(`/api/hosted-events/${eventId}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      if (isDraft) {
        toast.success("Event saved as Draft");
        setIsDraft?.(false);
        router.push(`/dashboard/events/coach`);
        return;
      }
      localStorage.removeItem("create-event-draft-id");
      toast.success("Event submitted for review");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowSuccessModal(true);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : err.response?.data?.message
        : "Failed to save agenda";
      toast.error(message);
    },
    onSettled: () => {
      setIsLoading(false);
      setIsDraftLoading?.(false);
    },
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
    reset({
      // use reset instead of setValue to also clear errors
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
      const [h, minutes] = timeStr.split(":").map(Number);
      return h * 60 + minutes;
    };

    Object.entries(agendaData).forEach(([day, items]) => {
      const sorted = [...items].sort(
        (a, b) => parseTime(a.time) - parseTime(b.time),
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
    const parseTimeMinutes = (timeStr: string): number => {
      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        const [time, meridiem] = timeStr.trim().split(" ");
        const [h, m] = time.split(":").map(Number);
        let hours = h;
        if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
        return hours * 60 + m;
      }
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const day1Slots = [...(agendaData[1] ?? [])].sort(
      (a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time),
    );
    const lastDaySlots = [...(agendaData[totalDays] ?? [])].sort(
      (a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time),
    );

    const firstSlotTime = day1Slots[0]?.time;
    const lastSlotTime = lastDaySlots[lastDaySlots.length - 1]?.time;

    const parseSlotTime = (date: Date, timeStr: string): Date => {
      let hours: number;
      let minutes: number;

      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        // Legacy AM/PM format e.g. "09:00 AM"
        const [time, meridiem] = timeStr.trim().split(" ");
        const [h, m] = time.split(":").map(Number);
        hours = h;
        minutes = m;
        if (meridiem?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
      } else {
        // 24h format e.g. "14:30"
        const [h, m] = timeStr.split(":").map(Number);
        hours = h;
        minutes = m;
      }

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes,
        0,
      );
    };

    const startLocal = firstSlotTime
      ? parseSlotTime(values.dateRange.from, firstSlotTime)
      : new Date(
          values.dateRange.from.getFullYear(),
          values.dateRange.from.getMonth(),
          values.dateRange.from.getDate(),
          0,
          0,
          0,
        );

    const endLocal = lastSlotTime
      ? parseSlotTime(values.dateRange.to, lastSlotTime)
      : new Date(
          values.dateRange.to.getFullYear(),
          values.dateRange.to.getMonth(),
          values.dateRange.to.getDate(),
          23,
          59,
          59,
        );

    // Convert local time in selected timezone → UTC
    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
      console.log({
        firstSlotTime,
        lastSlotTime,
        startLocal,
        endLocal,
        totalDays,
      });
      toast.error("Invalid date or time — please check your agenda slots");
      return;
    }

    const startUTC = fromZonedTime(startLocal, timezone);
    const endUTC = fromZonedTime(endLocal, timezone);

    await updateStep3.mutateAsync({
      startTime: startUTC.toISOString(),
      endTime: endUTC.toISOString(),
      timezone: timezone,
      agendaSlots: values.agendaSlots,
      ...(!isDraft && { status: "UNDER_REVIEW" }),
    });
  };
  const prepareAndSubmit = async () => {
    const daysWithMissingAgenda = daysArray.filter(
      (day) => !agendaData[day] || agendaData[day].length === 0,
    );
    if (!range?.from || !range?.to) {
      toast.error("Select event date range");
      dateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (daysWithMissingAgenda.length > 0) {
      toast.error(
        `Please add at least one agenda slot for Day ${daysWithMissingAgenda.join(", Day ")}`,
      );

      // Jump to first incomplete day
      setActiveDay(daysWithMissingAgenda[0]);
      agendaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
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
        agendaRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (error.path.includes("dateRange")) {
        toast.error("Select event date range");
        dateRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
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
          <h2 className={`${theme.typography.h1} text-xl md:text-4xl mb-2`}>
            Time to map the journey.
          </h2>
          <p className="text-base opacity-70 max-w-2xl">
            Define when your transformation experience will take place and build
            a rhythmic agenda for your participants.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* LEFT COLUMN: Dates & Timezone */}
          <div ref={dateRef} className="lg:col-span-4 flex flex-col gap-8 ">
            <section
              className={`bg-white p-8 rounded-xl shadow-sm border ${theme.borderLight} overflow-hidden`}
            >
              <h3
                className={theme.typography.h1 + " text-2xl md:text-3xl  mb-6"}
              >
                Event Duration
              </h3>

              <div className="space-y-6">
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
                      className={`w-full pl-10 pr-10 py-2 bg-gray-50 border  focus:ring-0 ${theme.borderAccent} rounded-xl outline-none appearance-none cursor-pointer`}
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
                {/* Date Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold opacity-80">
                    Date Range
                  </label>
                  {range?.from && range?.to && (
                    <div
                      className={`flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border ${theme.borderAccent} `}
                    >
                      <Calendar className="w-4 h-4 opacity-50 shrink-0" />
                      <span className="text-sm font-medium">
                        {format(range.from, "MMM dd")} —{" "}
                        {format(range.to, "MMM dd, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Calendar Widget */}
              <div
                className={`mt-6 pt-8 border-t ${theme.borderLight} overflow-x-auto`}
              >
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  defaultMonth={new Date()}
                  disabled={{ before: new Date() }}
                />
                {!range && (
                  <p className="text-red-500 text-xs mt-2">
                    Date range is required
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Agenda */}
          <div ref={agendaRef} className="lg:col-span-8">
            <section
              className={`bg-white p-4 sm:p-8 rounded-xl shadow-sm border ${theme.borderLight} h-full`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3
                    className={`${theme.typography.h1} text-2xl md:text-3xl mb-1`}
                  >
                    Event Agenda
                  </h3>
                  <p className="text-base">Design the flow of each day.</p>
                </div>

                {totalDays > 0 && (
                  <div className="flex bg-[var(--surface-calm)] rounded-lg p-1 overflow-x-auto">
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

              <div className="space-y-4 sm:space-y-4 relative">
                {/* Render Agenda Slots */}
                {currentAgenda.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative z-10 grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-3 sm:gap-6 items-start group"
                  >
                    {/* Connecting Line */}
                    {index !== currentAgenda.length - 1 && (
                      <div
                        className={`absolute left-[35px] sm:left-[50px] -translate-x-1/2 top-[30px] sm:top-[36px] h-[calc(100%+12px)] sm:h-[calc(100%+16px)] w-[1px] sm:w-[2px] ${theme.bg.accent} z-0`}
                      />
                    )}

                    {/* Time */}
                    <div className="pt-4 sm:pt-4 text-center sm:text-right pr-0 sm:pr-2 bg-white relative z-10">
                      <span
                        className={`text-xs sm:text-base font-semibold ${theme.textAccent}`}
                      >
                        {item.time}
                      </span>
                    </div>

                    {/* Card */}
                    <div
                      className={`${theme.bg.calm} w-full p-4 sm:p-5 rounded-xl flex justify-between items-start group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200 z-0`}
                    >
                      <div className="pr-2">
                        <h4 className="text-sm sm:text-base font-bold">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm opacity-70 mt-1">
                          {item.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className={`${theme.hoverTextAccent} transition-colors p-1`}
                        >
                          <Pencil className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
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
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[80px_1fr] gap-3 sm:gap-6 items-start mt-6 sm:mt-8">
                  <div className="hidden sm:block"></div>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className={`w-full border-2 border-dashed rounded-xl py-6 sm:py-8 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors ${theme.borderAccent}`}
                  >
                    <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                    <span className="text-xs sm:text-base uppercase tracking-widest font-semibold mt-1 opacity-70">
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
              <input
                type="hidden"
                {...register("time", { required: "Time is required" })}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Time</label>
                <TimeSelect
                  value={watch("time")}
                  onChange={(val) =>
                    setValue("time", val, { shouldValidate: true })
                  }
                  placeholder="Select time"
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
                  className={`w-full px-3 py-2 border  rounded-xl focus:outline-none focus:ring-0 ${theme.borderAccent}`}
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
                    minLength: {
                      value: 10,
                      message: "Description must be at least 10 characters",
                    },
                  })}
                  placeholder="Describe what will happen..."
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-0 ${theme.borderAccent} resize-none h-24`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div
              className={`w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-8`}
            >
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className={`${theme.typography.h1} text-4xl mb-4`}>
              It's Official.
            </h2>
            <p className="text-base opacity-70 mb-10">
              Your event has been submitted and is currently under review. We'll
              notify you once it's approved.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="mtbPrimary"
                size="mtbPill"
                onClick={() => router.push("/dashboard/events/coach")}
              >
                Go to Dashboard
              </Button>
              {/* <Button
                onClick={() => setShowSuccessModal(false)}
                variant="mtbTertiary"
                size="mtbPill"
              >
               
                Share Link
              </Button> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
