/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Trash2,
  Globe,
  Link as LinkIcon,
  FileEdit,
  Calendar,
  Users,
  Lightbulb,
  CheckCircle2,
  Files,
} from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { HostedEventResponse } from "@/types/client/events";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";

const step4Schema = z.object({
  resourcesVisibility: z.enum(["PUBLIC", "PRIVATE", "DRAFT"]),
  resource: z
    .instanceof(File)
    .refine((f) => f.size <= 25 * 1024 * 1024, "File must be 25MB or smaller")
    .refine(
      (f) => {
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
        ];
        const allowedExtensions = [".pdf", ".doc", ".docx", ".key"];
        
        //  check MIME type OR file extension as fallback
        return (
          allowedTypes.includes(f.type) ||
          allowedExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
        );
      },
      "Only PDF, DOCX, or Keynote files are allowed",
    )
    .optional(),
});
type Step4FormData = z.infer<typeof step4Schema>;

export default function Step4({
  // onNext,
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
  eventId?: string | null;
  isDraft?: boolean;
  setIsDraft?: (v: boolean) => void;
  setIsDraftLoading?: (v: boolean) => void;
}) {
  const {
    handleSubmit,
    setValue,
    watch,

    formState: { errors },
  } = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      resourcesVisibility:
        eventData?.event?.resourcesVisibility === "PRIVATE"
          ? "PRIVATE"
          : "PUBLIC",
      // status: eventData?.event?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      resource: undefined,
    },
  });

  const router = useRouter();

  const [existingResource, setExistingResource] = useState<string | null>(
    eventData?.event?.resources || null,
  );
  const resourcesVisibility = watch("resourcesVisibility");
  const resourceFile = watch("resource");
  const queryClient = useQueryClient();

  const resourceRef = useRef<HTMLDivElement>(null);

  const updateStep4 = useMutation({
    mutationFn: async (formData: FormData) => {
      if (isDraft) setIsDraftLoading?.(true);
      else setIsLoading(true);

      const res = await axios.put(`/api/hosted-events/${eventId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
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
      toast.success("Event submitted for review");
      setShowSuccessModal(true);
    },
    onError: () => toast.error("Failed to publish event"),
    onSettled: () => {
      setIsLoading(false);
      setIsDraftLoading?.(false);
    },
  });

  //   const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setValue("resource", file, { shouldValidate: true });
  };
  // const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   setIsDragging(false);
  //   handleFiles(e.dataTransfer.files);
  // };

  const previewData = {
    title: eventData?.event?.title || "Untitled Event",
    coverImage: eventData?.event?.coverImage || "/placeholder.png",
    category: eventData?.event?.type || "Event",
    startTime: eventData?.event?.startTime,
    endTime: eventData?.event?.endTime,
    venue: eventData?.event?.venueName,
    price: eventData?.event?.isPaid ? eventData?.ticket?.price : 0,
    currency: eventData?.ticket?.currency || "INR",
    spotsLeft: eventData?.ticket?.quantity || 0,
    hostName: eventData?.event?.creator?.name || "Unknown Host",
    hostImage: eventData?.event?.creator?.image || "",
  };

  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const getDuration = () => {
    if (!previewData.startTime || !previewData.endTime) return "";
    const diff =
      (new Date(previewData.endTime).getTime() -
        new Date(previewData.startTime).getTime()) /
      (1000 * 60 * 60 * 24);
    return `${Math.ceil(diff)} Days`;
  };

  const onFinalSubmit = async (data: Step4FormData) => {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        resourcesVisibility: data.resourcesVisibility,
         ...(!isDraft && { status: "UNDER_REVIEW" }),
      }),
    );
    if (data.resource) formData.append("resources", data.resource);
    else if (existingResource) {
      formData.append("resources", existingResource);
    }
    await updateStep4.mutateAsync(formData);
  };
  return (
    <form
      id="step4-form"
      onSubmit={handleSubmit(onFinalSubmit, (errors) => {
        if (errors.resource) {
          toast.error(errors.resource.message);
          resourceRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      })}
      className="mx-auto px-4 sm:px-6 mt-8 relative"
    >
      <h2 className={`${theme.typography.h1} text-2xl`}>Finalize & Launch</h2>
      <div className=" mx-auto mt-2 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuration Columns */}
          <div ref={resourceRef} className="lg:col-span-7 space-y-8">
            {/* Resources Section */}
            <section
              className={`bg-white p-6 md:p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`${theme.typography.h1} text-xl`}>
                    Resources & Materials
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    Upload workbooks, pre-reads, or guides for your attendees.
                  </p>
                </div>
                <Files className={`w-8 h-8 ${theme.textAccent}`} />
              </div>

              {/* Upload Dropzone */}
              <label htmlFor="resourceUpload">
                <input
                  type="file"
                  id="resourceUpload"
                  multiple
                  accept=".pdf,.doc,.docx,.key"
                  className="hidden"
                  // {...register("resource")}
                  onChange={handleFileChange}
                />
                {errors.resource && (
                  <p className="text-red-500 text-xs mt-2">
                    {errors.resource.message}
                  </p>
                )}
                <div
                  className={`border-2 border-dashed  rounded-xl p-10 flex flex-col items-center justify-center text-center group ${theme.borderAccent} transition-colors cursor-pointer bg-gray-50/50`}
                >
                  <div
                    className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <FileText className={`w-8 h-8 ${theme.textDark}`} />
                  </div>
                  <h4 className="text-sm font-bold mb-1">Click to upload</h4>
                  <p className="text-xs opacity-70">
                    PDF, DOCX, or Keynote (Max 25MB)
                  </p>
                </div>
              </label>

              {/* Uploaded Files List */}
              <div className="mt-6 space-y-3">
                {(resourceFile || existingResource) && (
                  <div
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border ${theme.borderLight}`}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className={`w-6 h-6 ${theme.textAccent}`} />
                      <div>
                        {resourceFile ? (
                          <p className="text-xs opacity-70 flex flex-col">
                            <span>{resourceFile?.name}</span>
                            <span>
                              {Number(
                                (resourceFile.size / (1024 * 1024)).toFixed(2),
                              )}{" "}
                              MB • Ready
                            </span>
                          </p>
                        ) : (
                          <a
                            href={existingResource!}
                            target="_blank"
                            className="text-xs text-blue-500 underline"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("resource", undefined, {
                          shouldValidate: true,
                        });
                        setExistingResource(null); // Clear the existing database URL so it actually deletes
                      }}
                      className="opacity-40 hover:opacity-100 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Visibility Settings */}
            <section
              className={`bg-white p-6 md:p-8 rounded-xl shadow-sm border ${theme.borderLight}`}
            >
              <h3 className={`${theme.typography.h1} text-xl mb-6`}>
                Visibility Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Public Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={watch("resourcesVisibility") === "PUBLIC"}
                    onChange={() => {
                      setValue("resourcesVisibility", "PUBLIC");
                    }}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${resourcesVisibility === "PUBLIC" ? `${theme.borderAccent} ` : `${theme.borderLight} hover:border-gray-400`}`}
                  >
                    <Globe
                      className={`w-8 h-8 mb-4 ${resourcesVisibility === "PUBLIC" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Public</p>
                    <p className="text-xs opacity-70 mt-2">
                      Listed in Discovery feed for everyone.
                    </p>
                  </div>
                </label>

                {/* Private Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={watch("resourcesVisibility") === "PRIVATE"}
                    onChange={() => {
                      setValue("resourcesVisibility", "PRIVATE");
                    }}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${resourcesVisibility === "PRIVATE" ? `${theme.borderAccent} ` : `${theme.borderLight} hover:border-gray-400`}`}
                  >
                    <LinkIcon
                      className={`w-8 h-8 mb-4 ${resourcesVisibility === "PRIVATE" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Private</p>
                    <p className="text-xs opacity-70 mt-2">
                      Only accessible via direct invite link.
                    </p>
                  </div>
                </label>

                {/* Draft Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    className="peer sr-only"
                    checked={watch("resourcesVisibility") === "DRAFT"}
                    onChange={() => {
                      setValue("resourcesVisibility", "DRAFT");
                    }}
                  />
                  <div
                    className={`h-full p-6 border rounded-xl flex flex-col items-center text-center transition-all ${
                      watch("resourcesVisibility") === "DRAFT"
                        ? `${theme.borderAccent}`
                        : `${theme.borderLight} hover:border-gray-400`
                    }`}
                  >
                    <FileEdit
                      className={`w-8 h-8 mb-4 ${watch("resourcesVisibility") === "DRAFT" ? theme.textAccent : "opacity-40"}`}
                    />
                    <p className="text-sm font-bold">Draft</p>
                    <p className="text-xs opacity-70 mt-2">
                      Hidden from all views until published.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-5 sticky top-[100px]">
            <div
              className={`bg-gray-50 p-6 rounded-2xl border ${theme.borderLight}`}
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h4
                  className={`text-xs font-bold uppercase tracking-widest ${theme.textAccent}`}
                >
                  Live Preview
                </h4>
                <span className="text-xs opacity-70">
                  How it looks to seekers
                </span>
              </div>

              {/* Card Preview */}
              <article
                className={`bg-white rounded-xl overflow-hidden shadow-sm border ${theme.borderLight} transform transition-transform hover:scale-[1.01]`}
              >
                <div className="h-56 w-full relative">
                  <Image
                    src={eventData?.event.coverImage || ""}
                    alt="Event Image"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
                    <span className={`text-sm font-bold ${theme.textAccent}`}>
                      {previewData?.price && previewData.price > 0
                        ? `₹${previewData.price}`
                        : "Free"}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-2 mb-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                      {previewData.category}
                    </span>

                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                      {getDuration()}
                    </span>
                  </div>

                  <h3 className={`${theme.typography.h1} text-xl mb-3`}>
                    {previewData.title}
                  </h3>

                  <div className="flex items-center gap-3 mb-6">
                    <Image
                      src={previewData.hostImage}
                      alt={previewData.hostName}
                      width={48}
                      height={48}
                      className="rounded-full w-12 h-12 object-cover"
                    />
                    <span className="text-xs opacity-70 font-medium">
                      Hosted by {previewData.hostName}
                    </span>
                  </div>

                  <div
                    className={`pt-4 border-t ${theme.borderLight} flex justify-between items-center`}
                  >
                    <div className="flex items-center gap-2 opacity-70">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        Starts {formatDate(previewData.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {previewData.spotsLeft} Spots left
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Tip Box */}
              <div
                className={`mt-6 p-6 text-white ${theme.highLightBgColor} rounded-xl border ${theme.hightLightBorderColor} flex gap-4`}
              >
                <Lightbulb className={`w-6 h-6 ${theme.textAccent} shrink-0`} />
                <div>
                  <p className={`text-sm font-bold `}>Coach's Pro Tip</p>
                  <p className="text-sm  mt-1">
                    Events with at least one high-quality PDF workbook see a 40%
                    higher completion rate. Consider adding a 'Session Zero'
                    guide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              Under Review
            </h2>
            <p className="text-base opacity-70 mb-10">
              Your event has been submitted and is currently under review. We'll
              notify you once it's approved.
            </p>

            <div className="flex flex-col gap-3">
              <button
                className={`w-full py-4 ${theme.buttonDark} rounded-xl text-sm font-semibold shadow-md transition-opacity hover:opacity-90`}
                onClick={() => router.push("/dashboard/events/coach")}
              >
                Go to Dashboard
              </button>
              {/* <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full py-4 border ${theme.borderLight} rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 flex items-center justify-center gap-2`}
              >
                {/* <Share className="w-4 h-4" /> */}
              {/* Share Link */}
              {/* </button> */}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
