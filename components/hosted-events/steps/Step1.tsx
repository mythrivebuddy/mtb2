"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { theme } from "@/lib/new-home/theme/theme";
import { Editor } from "@tinymce/tinymce-react";
import z from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getAxiosErrorMessage } from "@/utils/ax";
import { HostedEventResponse } from "@/types/client/events";
import Image from "next/image";
import UpgradeMessageModal from "@/components/common/UpgradeMessageModal";

const step1Schema = z
  .object({
    title: z
      .string()
      .nonempty("Title is required")
      .min(5, "Min 5 characters required in title")
      .max(150, "Max 150 characters"),
    description: z.string().min(5, "Description is required"),
    type: z.string().min(1, "Event type is required"),
    isPaid: z.boolean(),
    coverImage: z.any().refine((val) => val, "Cover photo is required"),
    ticket: z
      .object({
        price: z.number().optional(),
        quantity: z.number().optional(),
        currency: z.enum(["INR", "USD"]).nullable().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const ticket = data.ticket;
    const quantity = ticket?.quantity;
    const price = ticket?.price;

    if (data.isPaid) {
      // Check for negatives first
      if (price !== undefined && price < 0) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Price must be a positive number",
        });
      } else if (quantity !== undefined && quantity < 0) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Capacity must be a positive number",
        });
      }
      // Then check if they are missing/zero
      else if (!quantity || !price) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Price and Capacity are required",
        });
      }
    } else {
      // Check for negatives first
      if (quantity !== undefined && quantity < 0) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Capacity must be a positive number",
        });
      }
      // Then check if missing/zero
      else if (!quantity) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Capacity is required",
        });
      }
    }
  });

type Step1Form = z.infer<typeof step1Schema>;

export default function Step1({
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"FREE" | "PAID">("PAID");
  const eventTypes = [
    "Retreat",
    "Webinar",
    "Workshop",
    "One-on-One",
    "Course",
    "Other",
  ];
  const router = useRouter();
  const queryClient = useQueryClient();

  const [modalContent, setModalContent] = useState<{
  title: string;
  message: string;
} | null>(null);

  const fieldRefs: Record<
    keyof Step1Form,
    React.RefObject<HTMLDivElement | null>
  > = {
    title: useRef<HTMLDivElement>(null),
    type: useRef<HTMLDivElement>(null),
    description: useRef<HTMLDivElement>(null),
    isPaid: useRef<HTMLDivElement>(null),
    ticket: useRef<HTMLDivElement>(null),
    coverImage: useRef<HTMLDivElement>(null),
  };

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      isPaid: true,
      ticket: { price: 0, quantity: 0, currency: "INR" },
    },
  });
  const descriptionValue = watch("description");
  const ticketValue = watch("ticket");
  const data = eventData;
  useEffect(() => {
    if (data?.event) {
      reset({
        title: data.event.title || "",
        description: data.event.description || "",
        type: data.event.type || "",
        isPaid: data.event.isPaid ?? true,
        ticket: data.ticket
          ? data.ticket
          : { price: 0, quantity: 0, currency: "INR" },
        coverImage: data.event.coverImage,
      });

      setEventType(data.event.isPaid ? "PAID" : "FREE");

      // Capitalize first letter, lower rest for UI matching (e.g., "RETREAT" -> "Retreat")
      if (data.event.type) {
        const formattedType =
          data.event.type.charAt(0) + data.event.type.slice(1).toLowerCase();
        setActiveCategory(formattedType);
      }

      if (typeof data.event.coverImage === "string") {
        setPreviewImage(data.event.coverImage); // Show image if it's a URL from DB
      }
    }
  }, [data, reset]);

  useEffect(() => {
    register("type");
    register("isPaid");
    register("ticket");
    register("coverImage");
  }, [register]);

  /* ---------------- MUTATION ---------------- */

  const createDraft = useMutation({
    mutationFn: async (data: FormData) => {
      if (isDraft) setIsDraftLoading?.(true);
      else setIsLoading(true);
      const res = await axios.post("/api/hosted-events/draft", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", data.event.id], data);
    },
    onSettled: () => {
      setIsLoading(false);
      setIsDraftLoading?.(false);
    },
  });

  /* ---------------- SUBMIT ---------------- */

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data: Step1Form) => {
    try {
      const formData = new FormData();
      formData.append("eventId", eventId || "");
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      formData.append("type", data.type);
      formData.append("isPaid", String(data.isPaid));

      // Arrays/Objects must be stringified in FormData
      if (data.ticket) {
        const ticketPayload = {
          ...data.ticket,
          currency: data.isPaid ? data.ticket.currency : null,
          price: data.isPaid ? data.ticket.price : 0, // optional cleanup
        };

        formData.append("ticket", JSON.stringify(ticketPayload));
      }

      // Append the actual File object
      if (data.coverImage instanceof File) {
        formData.append("coverImage", data.coverImage);
      }

      // 🔥 FIX: You must pass 'formData' here, NOT 'data'!
      // Since createDraft expects Step1Form type, we cast it as any to bypass TS error
      const res = await createDraft.mutateAsync(formData);

      reset({
        title: res.event.title,
        description: res.event.description,
        type: res.event.type,
        isPaid: res.event.isPaid,
        ticket: res.ticket ?? { price: 0, quantity: 0, currency: "INR" },
        coverImage: res.event.coverImage,
      });

      if (isDraft) {
        toast.success("Event saved as Draft");
        setIsDraft?.(false);
        router.push(`/dashboard/events/coach`);
        return;
      }
      toast.success("Step 1 saved");
      router.replace(`?eventId=${res.event.id}`, { scroll: false });
      onNext();
    } catch (err) {
  console.error("❌ Error in onSubmit:", err);
  if (axios.isAxiosError(err) && err.response?.status === 403) {
    setModalContent({
      title: "Upgrade Required",
      message: err.response.data?.message || "You've reached your plan limit.",
    });
  } else {
    toast.error(getAxiosErrorMessage(err));
  }
}
  };
  const mapToEnum = (type: string) => {
    return type.toUpperCase().replace(/-/g, "_");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]); // 🔥 Pass this to handleFile to avoid duplicate code
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;

    // validation
    if (!file.type.startsWith("image/")) {
      toast.warning("Only images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File must be under 5MB");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);

    // 🔥 Update react-hook-form state
    setValue("coverImage", file, { shouldValidate: true });
  };
  return (
    <div className={`${theme.textDark} min-h-screen flex flex-col`}>
      <main className="flex-1 pb-12 px-4 sm:px-6">
        {/* Form */}
        <form
          id="step1-form"
          // form={`step${step}-form`}
          onSubmit={handleSubmit(onSubmit, (errors) => {
            const fieldOrder: (keyof Step1Form)[] = [
              "title",
              "type",
              "description",
              "ticket",
              "coverImage",
            ];

            for (const field of fieldOrder) {
              if (errors[field]) {
                toast.error(errors[field]?.message as string);
                fieldRefs[field].current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                // fieldRefs[field].current?.focus();
                break;
              }
            }
          })}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        >
          <section className="p-8 rounded-xl shadow-sm border bg-white space-y-12">
            {/* Title */}
            <div ref={fieldRefs.title} className="space-y-3 flex flex-col ">
              <label className="text-base font-semibold uppercase tracking-widest">
                Event Title
              </label>
              <input
                {...register("title")}
                placeholder="e.g., Mindfulness Retreat to Reduce Stress & Recharge"
                className={`${theme.eventTitleInput} ${theme.typography.h1} text-3xl py-4`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div ref={fieldRefs.type}>
              <label className="text-base font-semibold uppercase tracking-widest">
                Event Type
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setActiveCategory(type);
                      setValue("type", mapToEnum(type), {
                        shouldValidate: true,
                      });
                    }}
                    className={`${theme.chip} ${
                      activeCategory === type
                        ? theme.chipActive
                        : theme.chipInactive
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Editor */}
            <div ref={fieldRefs.description}>
              <label className="text-base font-semibold uppercase tracking-widest">
                Description
              </label>

              <div className={theme.editorContainer}>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  value={descriptionValue || ""}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: ["lists", "link", "image"],
                    toolbar: "bold italic | bullist numlist | link",
                  }}
                  onEditorChange={(val) =>
                    setValue("description", val, { shouldValidate: true })
                  }
                />
              </div>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Pricing & Capacity */}
            <div ref={fieldRefs.ticket} className="space-y-4">
              <div>
                <label className="text-base font-semibold uppercase tracking-widest">
                  Pricing Type
                </label>
                <div className="flex flex-wrap gap-3 pt-2">
                  {["FREE", "PAID"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={async () => {
                        const isNowPaid = type === "PAID";
                        setEventType(isNowPaid ? "PAID" : "FREE");

                        // 🔥 Tell the form we switched and re-validate
                        setValue("isPaid", isNowPaid, { shouldValidate: true });

                        // 🔥 Clear out the price if they switch to FREE
                        if (!isNowPaid) {
                          setValue("ticket.price", 0, { shouldValidate: true });
                        }
                        await trigger("ticket");
                      }}
                      className={`${theme.chip} ${
                        eventType === type
                          ? theme.chipActive
                          : theme.chipInactive
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-base font-semibold uppercase tracking-widest">
                  {eventType === "PAID" ? "Pricing & Capacity" : "Capacity"}
                </label>
                <div className={`mt-2 ${theme.inputGroup}`}>
                  {eventType === "PAID" && (
                    <>
                      <input
                        type="number"
                        min="1"
                        placeholder="Price"
                        value={ticketValue?.price || ""}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        onKeyDown={(e) => {
                          // 🔥 Blocks the minus sign and "e"
                          if (e.key === "-" || e.key === "e" || e.key === "E") {
                            e.preventDefault();
                          }
                        }}
                        className={theme.inputBase}
                        onChange={async (e) => {
                          // 🔥 Safely update ONLY the price, without touching capacity
                          setValue("ticket.price", Number(e.target.value), {
                            shouldValidate: true,
                          });
                          await trigger("ticket");
                        }}
                      />
                      <select
                        className={theme.select}
                        value={ticketValue?.currency || "INR"}
                        onChange={(e) =>
                          setValue(
                            "ticket.currency",
                            e.target.value as "INR" | "USD",
                            { shouldValidate: true },
                          )
                        }
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </>
                  )}
                  <input
                    type="number"
                    min="1"
                    placeholder="Capacity"
                    className={theme.inputBase}
                    value={ticketValue?.quantity || ""}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onKeyDown={(e) => {
                      // 🔥 Blocks the minus sign and "e"
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    onChange={async (e) => {
                      // 🔥 Safely update ONLY the capacity
                      setValue("ticket.quantity", Number(e.target.value), {
                        shouldValidate: true,
                      });
                      await trigger("ticket");
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {errors.ticket?.message && (
                    <p className="text-red-500 text-xs">
                      {errors.ticket.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image */}
            {/* Image */}
            <div ref={fieldRefs.coverImage} className="space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
                Cover Photo
              </label>
              <label htmlFor="fileUpload">
                <input
                  type="file"
                  accept="image/*"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`${theme.dropzoneBase} ${
                    isDragging ? theme.dropzoneActive : theme.dropzoneIdle
                  }`}
                >
                  {!previewImage ? (
                    <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <ImagePlus className="w-8 h-8 opacity-70" />
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {/* Drag and drop or{" "} */}
                          <span className="underline">Browse files</span>
                        </p>

                        <p className="text-xs opacity-70 mt-1">
                          Recommended: 1600x900px, under 5MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Image
                      width={1600}
                      height={900}
                      src={previewImage}
                      alt="Event Cover"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              </label>
              {errors.coverImage && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.coverImage.message as string}
                </p>
              )}
            </div>
          </section>
        </form>
      </main>
      <UpgradeMessageModal
  isOpen={!!modalContent}
  onClose={() => setModalContent(null)}
  title={modalContent?.title ?? ""}
  message={modalContent?.message ?? ""}
  redirectToPricingUrl="/pricing?ref=create-event"
/>
    </div>
  );
}
