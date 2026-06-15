"use client";

import React, { useEffect, useRef } from "react";
import {
  MapPin,
  Video,
  Compass,
  Monitor,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { HostedEventResponse } from "@/types/client/events";
import { useRouter } from "next/navigation";

const step2Schema = z
  .object({
    format: z.enum(["IN_PERSON", "ONLINE"]),

    venueName: z.string(),
    address: z.string(),
    travelInstructions: z.string().optional(),

    meetingLink: z.string(),
  })
  .superRefine((data, ctx) => {
    // ✅ IN PERSON → venue + address required
    if (data.format === "IN_PERSON") {
      if (!data.venueName.trim()) {
        ctx.addIssue({
          path: ["venueName"],
          code: z.ZodIssueCode.custom,
          message: "Venue name is required",
        });
      }

      if (!data.address.trim()) {
        ctx.addIssue({
          path: ["address"],
          code: z.ZodIssueCode.custom,
          message: "Address is required",
        });
      }
    }

    // ✅ ONLINE → meeting link required
    if (data.format === "ONLINE") {
      if (!data.meetingLink.trim()) {
        ctx.addIssue({
          path: ["meetingLink"],
          code: z.ZodIssueCode.custom,
          message: "Meeting link is required",
        });
      } else {
        // 🔥 also validate URL format
        const isValidUrl = /^https?:\/\/.+/.test(data.meetingLink);
        if (!isValidUrl) {
          ctx.addIssue({
            path: ["meetingLink"],
            code: z.ZodIssueCode.custom,
            message: "Enter a valid URL",
          });
        }
      }
    }
  });

export default function Step2({
  onNext,
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
  const queryClient = useQueryClient();
  const router = useRouter();

  type Step2Form = z.infer<typeof step2Schema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    trigger,
    formState: { errors },
  } = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
    defaultValues: {
      format: "IN_PERSON",
      venueName: "",
      address: "",
      travelInstructions: "",
      meetingLink: "",
    },
  });
  const format = watch("format");

  // 2. Add refs inside the component (after useForm)
  const fieldRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    venueName: useRef<HTMLDivElement>(null),
    address: useRef<HTMLDivElement>(null),
    meetingLink: useRef<HTMLDivElement>(null),
  };

  const updateStep2 = useMutation({
    mutationFn: async (data: Step2Form) => {
      if (isDraft) setIsDraftLoading?.(true);
      else setIsLoading(true);

      const payload =
        data.format === "ONLINE"
          ? {
              format: data.format,
              venueName: null, // ✅ force null
              address: null, // ✅ force null
              travelInstructions: null, // optional but clean
              meetingLink: data.meetingLink,
            }
          : {
              format: data.format,
              venueName: data.venueName,
              address: data.address,
              travelInstructions: data.travelInstructions,
              meetingLink: null, // ✅ clear online data
            };

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
      toast.success("Step 2 saved");
      onNext();
    },
    onError: (err) => {
      toast.error(getAxiosErrorMessage(err));
    },
    onSettled: () => {
      setIsLoading(false);
      setIsDraftLoading?.(false);
    },
  });
  const onSubmit = async (data: Step2Form) => {
    await updateStep2.mutateAsync(data);
  };

  useEffect(() => {
    if (eventData?.event) {
      reset({
        format: eventData.event.format || "IN_PERSON",
        venueName: eventData.event.venueName || "",
        address: eventData.event.address || "",
        travelInstructions: eventData.event.travelInstructions || "",
        meetingLink: eventData.event.meetingLink || "",
      });
    }
  }, [eventData, reset]);
  return (
    <div className="mx-auto px-4 sm:px-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Format Selection & Dynamic Forms */}
        <form
          id="step2-form"
          onSubmit={handleSubmit(onSubmit, (errors) => {
            const fieldOrder = ["venueName", "address", "meetingLink"];
            for (const field of fieldOrder) {
              if (errors[field as keyof Step2Form]) {
                toast.error(errors[field as keyof Step2Form]?.message);
                fieldRefs[field].current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                break;
              }
            }
          })}
          className="md:col-span-8 space-y-8 mb-12"
        >
          {/* Format Choice Card */}
          <section
            className={` bg-white p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
          >
            <h3 className={`${theme.typography.h1} text-2xl  lg:text-3xl mb-6`}>
              Choose your format
            </h3>
            <p className="text-base opacity-70 mb-8 max-w-2xl">
              Will this experience be held in person, hosted online, or a blend
              of both? This helps us provide the right tools for your attendees.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* In-Person Card */}
              <button
                type="button"
                onClick={async () => {
                  setValue("format", "IN_PERSON", { shouldValidate: true });
                  await trigger();
                }}
                className={`${theme.borderAccent} flex flex-row sm:flex-col items-center text-left sm:text-center p-5 sm:p-6 border-2 rounded-xl transition-all group gap-4 sm:gap-0 ${
                  format === "IN_PERSON"
                    ? `bg-[var(--brand-deep)] text-[var(--ink-inverse)] border-transparent shadow-md`
                    : ` hover:border-gray-400`
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center sm:mb-4 transition-transform group-hover:scale-110 bg-[var(--surface-calm)]`}
                >
                  <MapPin
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${theme.textAccent}`}
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`${theme.typography.h1} text-lg md:text-xl lg:text-3xl font-medium mb-1 sm:mb-2 block`}
                  >
                    In-Person
                  </span>
                  <p className="text-sm sm:text-base opacity-70 leading-snug sm:leading-normal">
                    Gather physically at a specific venue or outdoors.
                  </p>
                </div>
              </button>

              {/* Online Card */}
              <button
                type="button"
                onClick={async () => {
                  setValue("format", "ONLINE", { shouldValidate: true });
                  await trigger(); // forces validation refresh
                }}
                className={`${theme.borderAccent} flex flex-row sm:flex-col items-center text-left sm:text-center p-5 sm:p-6 border-2 rounded-xl transition-all group gap-4 sm:gap-0 ${
                  format === "ONLINE"
                    ? `bg-[var(--brand-deep)] text-[var(--ink-inverse)] border-transparent shadow-md`
                    : ` hover:border-gray-400`
                }`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center sm:mb-4 transition-transform group-hover:scale-110 bg-[var(--surface-calm)]`}
                >
                  <Video
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${theme.textAccent}`}
                  />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`${theme.typography.h1} text-lg md:text-xl lg:text-3xl font-medium mb-1 sm:mb-2 block`}
                  >
                    Online
                  </span>
                  <p className="text-sm sm:text-base opacity-70 leading-snug sm:leading-normal">
                    A digital experience via Zoom, Meet, or similar.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Dynamic Context Sections */}
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* In-Person Logistics - Renders if 'IN_PERSON' */}
            {format === "IN_PERSON" && (
              <section
                className={`flex-1 bg-white p-8 rounded-xl shadow-sm border-l-4 border-l-[var(--colors-primary)] border-y border-r ${theme.borderLight}`}
              >
                <div className="flex items-center gap-3 mb-8">
                  <Compass />
                  <h3
                    className={`${theme.typography.h1} text-2xl  lg:text-3xl`}
                  >
                    In-Person Logistics
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Venue name */}
                  <div ref={fieldRefs.venueName} className="col-span-2">
                    <label className="text-base mb-2 block">Venue Name</label>
                    <div
                      className="flex items-center w-full bg-[transparent] border rounded-xl px-4 py-2
                   border-[var(--brand-momentum)] transition-all"
                    >
                      <input
                        {...register("venueName")}
                        placeholder="e.g. The Sanctuary at High Peaks"
                        className={`w-full bg-transparent appearance-none ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none  transition-all`}
                      />
                    </div>
                    {errors.venueName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.venueName.message}
                      </p>
                    )}
                  </div>

                  <div ref={fieldRefs.address} className="col-span-2">
                    <label className="text-base mb-2 block">Full Address</label>

                    <div
                      className="flex items-center w-full bg-[transparent] border rounded-xl px-4 py-2
                   border-[var(--brand-momentum)] transition-all"
                    >
                      <input
                        {...register("address")}
                        placeholder="Street, City, State, Zip"
                        className={`w-full bg-transparent appearance-none ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none  transition-all`}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="text-base mb-2 block">
                      Travel Instructions (Optional)
                    </label>
                    <textarea
                      {...register("travelInstructions")}
                      rows={3}
                      placeholder="Where to park, hidden entrances, or local transit tips..."
                      className={`w-full border border-[var(--brand-momentum)] appearance-none rounded-xl p-4 focus:ring-0 focus:${theme.borderAccent} outline-none transition-all resize-none`}
                    ></textarea>
                  </div>
                </div>
              </section>
            )}

            {/* Online Settings - Renders if 'online' or 'hybrid' */}
            {format === "ONLINE" && (
              <section
                className={`flex-1 bg-white p-8 rounded-xl shadow-sm border-l-4 border-l-gray-700 border-y border-r ${theme.borderLight}`}
              >
                <div className="flex items-center gap-3 mb-8">
                  <Monitor />
                  <h3
                    className={`${theme.typography.h1} text-2xl  lg:text-3xl`}
                  >
                    Online Settings
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Meeting platform */}
                  {/* <div className="col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Meeting Platform</label>
                    <select className={`w-full bg-transparent border-0 border-b ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none py-3 transition-all cursor-pointer`}>
                      <option>Zoom (Recommended)</option>
                      <option>Google Meet</option>
                      <option>Microsoft Teams</option>
                      <option>Custom Link</option>
                    </select>
                  </div> */}

                  <div ref={fieldRefs.meetingLink} className="col-span-2">
                    <label className="text-base mb-2 block">
                      Meeting Link / Invite URL
                    </label>
                     <div
                      className="flex items-center w-full bg-[transparent] border rounded-xl px-4 py-2
                   border-[var(--brand-momentum)] transition-all"
                    >

                    <input
                      type="url"
                      {...register("meetingLink")}
                      placeholder="https://zoom.us/j/..."
                      className={`w-full bg-transparent appearance-none ${theme.borderLight} focus:${theme.borderAccent} focus:ring-0 outline-none transition-all`}
                      />
                      </div>
                    {errors.meetingLink && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.meetingLink.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </form>

        {/* Sidebar / Guidance */}
        <div className="md:col-span-4 hidden md:block">
          <div className=" top-24 space-y-6">
            {/* Coach's Tip */}
            {/* <div className="bg-[#293625] text-white p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-200" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">Coach's Tip</h4>
              </div>
              <p className="text-sm italic leading-relaxed text-gray-200">
                "Choosing 'Hybrid' allows you to scale your impact. While the local energy is irreplaceable, offering a digital seat invites seekers from around the world into your community."
              </p>
            </div> */}

            {/* Checklist */}
            <div
              className={`p-6 border ${theme.borderLight} rounded-xl bg-white shadow-sm`}
            >
              <h4 className="text-sm font-semibold mb-4">Checklist</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 ${theme.textAccent} shrink-0`}
                  />
                  <span className="text-sm opacity-80">
                    Confirm venue availability
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2
                    className={`w-5 h-5 ${theme.textAccent} shrink-0`}
                  />
                  <span className="text-sm opacity-80">
                    Test your recording software
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Circle className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-sm opacity-80">
                    Prepare travel instructions PDF
                  </span>
                </li>
              </ul>
            </div>

            {/* Inspiring Image */}
            <div className="rounded-xl overflow-hidden h-48 shadow-sm relative group cursor-pointer">
              <img
                src={
                  eventData?.event.coverImage || "/assets/inspiring-space.jpg"
                }
                alt="Inspiring Spaces"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
