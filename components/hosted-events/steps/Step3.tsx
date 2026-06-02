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
const TIMEZONES = [
    { label: "India (IST - Asia/Kolkata)", value: "Asia/Kolkata" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

export default function Step3() {
  const [activeDay, setActiveDay] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  // Example initial data
  const [agendaData, setAgendaData] = useState<Record<number, AgendaItem[]>>({
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
  });

  const { register, handleSubmit, reset, setValue,watch } = useForm<FormData>({
    defaultValues: {
      id: "",
      time: "",
      title: "",
      description: "",
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
    setValue("id", item.id);
    setValue("time", item.time);
    setValue("title", item.title);
    setValue("description", item.description);
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
            { ...data, id: Date.now().toString() }, // simple unique ID
          ],
        };
      }
    });

    setIsDialogOpen(false);
    reset();
  };

  // Safe fallback for current day's agenda array
  const currentAgenda = agendaData[activeDay] || [];

  return (
    <div className="mx-auto px-4 sm:px-6 mt-8 relative">
      <div className="fixed top-0 right-0 w-1/3 h-1/2 bg-orange-50 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-1/4 h-1/3 bg-green-50 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <header className="mb-8">
        <h2 className={`${theme.typography.h1} text-3xl mb-2`}>
          Time to map the journey.
        </h2>
        <p className="text-lg opacity-70 max-w-2xl">
          Define when your transformation experience will take place and build a
          rhythmic agenda for your participants.
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
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold opacity-80">
                  Timezone
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" />
                  <select
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
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                        activeDay === day
                          ? `bg-white shadow-sm ${theme.textDark}`
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      Day {day}
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
                  className="relative z-10 grid grid-cols-[80px_1fr] gap-6 items-start group"
                >
                  <div className="pt-4 text-right pr-2">
                    <span className={`text-sm font-bold ${theme.textAccent}`}>
                      {item.time}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg flex justify-between group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                    <div>
                      <h4 className="text-base font-bold">{item.title}</h4>
                      <p className="text-sm opacity-70 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-start gap-2  transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className={`${theme.hoverTextAccent} transition-colors p-1`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
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
              <div className="relative z-10 grid grid-cols-[80px_1fr] gap-6 items-start mt-8">
                <div></div>
                <button
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

      {/* --- SHADCN DIALOG FOR ADD/EDIT --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
                  {...register("time", { required: true })}
                  placeholder="e.g., 09:00 AM"
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Title</label>
                <input
                  {...register("title", { required: true })}
                  placeholder="e.g., Opening Ceremony"
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  {...register("description", { required: true })}
                  placeholder="Describe what will happen..."
                  className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:${theme.borderAccent} resize-none h-24`}
                />
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-8 py-3 rounded-full ${theme.buttonDark} text-sm font-medium shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2`}
              >
                Save Slot
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
