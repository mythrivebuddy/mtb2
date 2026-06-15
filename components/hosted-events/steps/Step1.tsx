"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, FileText, Trash2 } from "lucide-react";
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
import {
  HostedActiveEvent,
  HostedEventDashboardData,
  HostedEventResponse,
} from "@/types/client/events";
import Image from "next/image";
import UpgradeMessageModal from "@/components/common/UpgradeMessageModal";
import { Chip } from "@/components/ui/mtb/chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    resourcesVisibility: z.enum(["PUBLIC", "PRIVATE", "DRAFT"]).optional(),
    resource: z
      .any()
      .refine(
        (f) => !f || (f instanceof File && f.size <= 25 * 1024 * 1024),
        "File must be 25MB or smaller",
      )
      .refine((f) => {
        if (!f || !(f instanceof File)) return true; // skip if no file or string (existing)
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
        ];
        const allowedExtensions = [".pdf", ".doc", ".docx", ".key"];
        return (
          allowedTypes.includes(f.type) ||
          allowedExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
        );
      }, "Only PDF, DOCX, or Keynote files are allowed")
      .optional(),
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
          message: "Quantity must be a positive number",
        });
      }
      // Then check if they are missing/zero
      else if (!quantity || !price) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Price and Quantity are required",
        });
      }
    } else {
      // Check for negatives first
      if (quantity !== undefined && quantity < 0) {
        ctx.addIssue({
          path: ["ticket"],
          code: z.ZodIssueCode.custom,
          message: "Quantity must be a positive number",
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
const DRAFT_STORAGE_KEY = "create-event-step1-draft";

export default function Step1({
  onNext,
  setIsLoading,
  eventData,
  eventId,
}: {
  onNext: () => void;
  setIsLoading: (loading: boolean) => void;
  eventData?: HostedEventResponse;
  eventId?: string | undefined | null;
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
    "Course",
    "One-on-One",
    "Other",
  ];
  const router = useRouter();
  const queryClient = useQueryClient();

  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [existingResource, setExistingResource] = useState<string | null>(null);
  const [isResourceDeleted, setIsResourceDeleted] = useState(false);

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
    resource: useRef<HTMLDivElement>(null), // ADDED
    resourcesVisibility: useRef<HTMLDivElement>(null),
  };

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      isPaid: true,
      ticket: { price: 0, quantity: 0, currency: "INR" },
      resourcesVisibility: "PUBLIC",
    },
  });
  const descriptionValue = watch("description");
  const ticketValue = watch("ticket");
  const resourceFile = watch("resource");
  const data = eventData;

  useEffect(() => {
    if (eventData?.event) return; // DB data takes priority
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      reset({
        title: saved.title ?? "",
        description: saved.description ?? "",
        type: saved.type ?? "",
        isPaid: saved.isPaid ?? true,
        ticket: saved.ticket ?? { price: 0, quantity: 0, currency: "INR" },
        coverImage: undefined,
      });
      if (saved.type) {
        const formatted =
          saved.type.charAt(0) + saved.type.slice(1).toLowerCase();
        setActiveCategory(formatted);
      }
      if (saved.isPaid === false) setEventType("FREE");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        resourcesVisibility: data.event.resourcesVisibility || "PUBLIC",
      });

      setEventType(data.event.isPaid ? "PAID" : "FREE");

      setExistingResource(data.event.resources || null);

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
  const createDraft = useMutation({
    mutationFn: async (data: FormData) => {
      setIsLoading(true);
      const res = await axios.post("/api/hosted-events/draft", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", data.event.id], data);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });
  const buildFormData = (data: Step1Form): FormData => {
    const formData = new FormData();
    const activeEventId =
      eventId || localStorage.getItem("create-event-draft-id") || "";
    formData.append("eventId", activeEventId || "");
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("type", data.type);
    formData.append("isPaid", String(data.isPaid));
    if (data.ticket) {
      formData.append(
        "ticket",
        JSON.stringify({
          ...data.ticket,
          currency: data.isPaid ? data.ticket.currency : null,
          price: data.isPaid ? data.ticket.price : 0,
        }),
      );
    }
    if (data.coverImage instanceof File) {
      formData.append("coverImage", data.coverImage);
    }
    if (data.resourcesVisibility) {
      formData.append("resourcesVisibility", data.resourcesVisibility);
    }

    if (data.resource instanceof File) {
      formData.append("resources", data.resource);
    } else if (existingResource && !data.resource) {
      // If no new file is uploaded but an existing one is there, keep it
      formData.append("resources", existingResource);
    } else if (existingResource && isResourceDeleted) {
      // If the user deleted the existing file, send a flag to clear it
      formData.append("clearResources", "true");
    }

    return formData;
  };
  const handleBackRequest = async () => {
    const values = getValues();
    const anyContent = !!(
      values.title?.trim() ||
      values.description?.trim() ||
      values.type ||
      values.ticket?.price ||
      values.ticket?.quantity
    );

    if (!anyContent) {
      router.back();
      return;
    }

    const isFullyFilled = !!(
      values.title?.trim() &&
      values.description?.trim() &&
      values.type &&
      values.coverImage &&
      values.ticket?.quantity &&
      (values.isPaid ? values.ticket?.price : true)
    );

    if (isFullyFilled) {
      // fire-and-forget — don't await, don't setIsLoading
      buildFormData(values);
      axios
        .post("/api/hosted-events/draft", buildFormData(values))
        .then((res) => {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          localStorage.setItem("create-event-draft-id", res.data.event.id);

          const newEvent = res.data.event;
          const newTicket = res.data.ticket;

          const formattedDate = newEvent.startTime
            ? new Date(newEvent.startTime).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })
            : null;

          // 2. Format the Location (handles in-person vs online)
          let locationString = null;
          if (newEvent.format === "IN_PERSON") {
            locationString = newEvent.address || newEvent.venueName;
          } else if (newEvent.format === "ONLINE") {
            locationString = "Online";
          }

          // 3. Combine them safely without dangling bullets
          const dateLocationString = [formattedDate, locationString]
            .filter(Boolean)
            .join(" • ");

          queryClient.setQueryData(
            ["events"],
            (old: HostedEventDashboardData | undefined) => {
              if (!old) return old;

              const mapped: HostedActiveEvent = {
                id: newEvent.id,
                title: newEvent.title,
                date: dateLocationString,
                progress: 0,
                total: newTicket?.quantity ?? 0,
                badge: newEvent.status,
                badgeLight: newEvent.status === "DRAFT",
                imgSrc: newEvent.coverImage ?? "",
              };

              const existsInActive = old.activeEvents?.some(
                (e) => e.id === newEvent.id,
              );
              const existsInPast = old.pastEvents?.some(
                (e) => e.id === newEvent.id,
              );

              return {
                ...old,
                activeEvents: existsInActive
                  ? old.activeEvents.map((e) =>
                      e.id === newEvent.id ? mapped : e,
                    )
                  : [mapped, ...(old.activeEvents ?? [])],
                // Remove from pastEvents if it was there (e.g. re-editing a past draft)
                pastEvents: existsInPast
                  ? old.pastEvents.filter((e) => e.id !== newEvent.id)
                  : (old.pastEvents ?? []),
              };
            },
          );
        })
        .catch(console.error);
      router.back(); // navigate immediately
      return;
    } else {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            title: values.title,
            description: values.description,
            type: values.type,
            isPaid: values.isPaid,
            ticket: values.ticket,
          }),
        );
      } catch {}
      router.back();
    }
  };
  const handleBackRequestRef = useRef(handleBackRequest);
  useEffect(() => {
    handleBackRequestRef.current = handleBackRequest;
  }, []);
  useEffect(() => {
    if (eventId) {
      localStorage.setItem("create-event-draft-id", eventId);
    }
  }, [eventId]);
  useEffect(() => {
    const form = document.getElementById("step1-form");
    if (!form) return;
    const listener = (e: Event) => {
      e.stopPropagation();
      handleBackRequestRef.current(); // ← always latest
    };
    form.addEventListener("back-request", listener);
    return () => form.removeEventListener("back-request", listener);
  }, []);

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data: Step1Form) => {
    try {
      const formData = new FormData();
      const activeEventId =
        eventId || localStorage.getItem("create-event-draft-id") || "";
      formData.append("eventId", activeEventId);
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
      if (data.resourcesVisibility) {
        formData.append("resourcesVisibility", data.resourcesVisibility);
      }

      if (data.resource instanceof File) {
        formData.append("resources", data.resource);
      } else if (isResourceDeleted) {
        // 🔥 highest priority: user explicitly deleted
        formData.append("clearResources", "true");
      } else if (existingResource) {
        // keep existing
        formData.append("resources", existingResource);
      }

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

      toast.success("Step 1 saved");
      localStorage.setItem("create-event-draft-id", res.event.id);
      setIsResourceDeleted(false);
      router.replace(`?eventId=${res.event.id}`, { scroll: false });
      onNext();
    } catch (err) {
      console.error("❌ Error in onSubmit:", err);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setModalContent({
          title: "Upgrade Required",
          message:
            err.response.data?.message || "You've reached your plan limit.",
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
  const handleResourceFile = (file: File) => {
    if (!file) return;

    // Validate File Type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const allowedExtensions = [".pdf", ".doc", ".docx", ".key"];

    const isAllowedType = allowedTypes.includes(file.type);
    const isAllowedExt = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );

    if (!isAllowedType && !isAllowedExt) {
      toast.error("Only PDF, DOCX, or Keynote files are allowed");
      return;
    }

    // Validate File Size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File must be 25MB or smaller");
      return;
    }

    // If valid, set it in the form
    setValue("resource", file, { shouldValidate: true });
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
      <main className="flex-1 pb-12 pt-4 px-4 sm:px-6">
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
          <section className="p-8 rounded-xl shadow-sm border bg-white space-y-6 sm:space-y-12">
            {/* Title */}
            <div ref={fieldRefs.title} className="flex flex-col ">
              <label
                className={
                  theme.typography.h1 +
                  " text-base sm:text-lg md:text-xl lg:text-3xl font-semibold uppercase tracking-widest"
                }
              >
                Event Title
              </label>
              <input
                {...register("title")}
                placeholder="e.g., Mindfulness Retreat to Reduce Stress & Recharge"
                className={`${theme.eventTitleInput} ${theme.typography.h1} text-2xl py-4`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div ref={fieldRefs.type}>
              <label className="text-base">Event Type</label>

              <div className="flex flex-wrap gap-3 pt-2">
                {eventTypes.map((type) => (
                  <Chip
                    key={type}
                    isActive={activeCategory === type}
                    onClick={() => {
                      setActiveCategory(type);
                      setValue("type", mapToEnum(type), {
                        shouldValidate: true,
                      });
                    }}
                  >
                    {type}
                  </Chip>
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
              <label className="text-base">Description</label>

              <div className={theme.editorContainer + " mt-2"}>
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
              <p className="italic text-xs opacity-70 mt-3">
                Help people understand the transformative value of your event.
              </p>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Pricing & Capacity */}
            <div ref={fieldRefs.ticket} className="space-y-2 sm:space-y-6">
              <div>
                <label className="text-base">Pricing Type</label>
                <div className="flex  gap-3 pt-2">
                  {["FREE", "PAID"].map((type) => (
                    <Chip
                      key={type}
                      isActive={eventType === type}
                      onClick={async () => {
                        const isNowPaid = type === "PAID";
                        setEventType(isNowPaid ? "PAID" : "FREE");

                        setValue("isPaid", isNowPaid, { shouldValidate: true });

                        if (!isNowPaid) {
                          setValue("ticket.price", 0, { shouldValidate: true });
                        }
                        await trigger("ticket");
                      }}
                      size="lg"
                    >
                      {type === "PAID" ? "Paid" : "Free"}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* 🔥 NEW COMPOSITE INPUTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* 1. Price Input (Only shows if PAID) */}
                {eventType === "PAID" && (
                  <div>
                    <label className="text-base block mb-2">Price</label>
                    <div className="flex items-center w-full bg-[transparent] border rounded-xl px-4  border-[var(--brand-momentum)] transition-all">
                      <Select
                        value={ticketValue?.currency || "INR"}
                        onValueChange={async (val) => {
                          setValue("ticket.currency", val as "INR" | "USD", {
                            shouldValidate: true,
                          });
                          await trigger("ticket");
                        }}
                      >
                        <SelectTrigger
                          // 🔥 We strip borders, shadows, and focus rings so it blends perfectly into your wrapper!
                          className="w-[70px] border-none bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 px-0 py-0 gap-1 text-[var(--ink-primary)] font-medium"
                        >
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Vertical Divider */}
                      <div className="w-[1px] h-4 bg-[var(--border-light)] mx-2"></div>

                      <input
                        type="number"
                        min="1"
                        placeholder="1499"
                        value={ticketValue?.price || ""}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") {
                            e.preventDefault();
                          }
                        }}
                        className="flex-1 bg-transparent outline-none w-full"
                        onChange={async (e) => {
                          setValue("ticket.price", Number(e.target.value), {
                            shouldValidate: true,
                          });
                          await trigger("ticket");
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Quantity Input */}
                <div>
                  <label className="text-base block mb-2">
                    Quantity Available
                  </label>
                  <div
                    className="flex items-center w-full bg-[transparent] border rounded-xl px-4 py-2
                   border-[var(--brand-momentum)] transition-all"
                  >
                    <input
                      type="number"
                      min="1"
                      placeholder="50"
                      value={ticketValue?.quantity || ""}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e" || e.key === "E") {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1 bg-transparent  outline-none w-full"
                      onChange={async (e) => {
                        setValue("ticket.quantity", Number(e.target.value), {
                          shouldValidate: true,
                        });
                        await trigger("ticket");
                      }}
                    />
                    {/* Suffix */}
                    <span className="text-sm opacity-50 ml-2">Seats</span>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              <div className="flex flex-col gap-1">
                {errors.ticket?.message && (
                  <p className="text-red-500 text-xs">
                    {errors.ticket.message}
                  </p>
                )}
              </div>
            </div>

            {/* Image */}
            {/* Image */}
            <div ref={fieldRefs.coverImage}>
              <label className="text-base ">Cover Photo</label>
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
                        <Camera className="w-8 h-8 opacity-70" />
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
            {/* Resources Upload */}

            <div ref={fieldRefs.resource} className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-base font-medium">
                    Resources & Materials (Optional)
                  </label>

                  <p className="text-sm opacity-70 mt-1">
                    Upload workbooks, pre-reads, or guides for your attendees.
                  </p>
                </div>
              </div>

              <label htmlFor="resourceUpload">
                <input
                  type="file"
                  id="resourceUpload"
                  accept=".pdf,.doc,.docx,.key"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) handleResourceFile(file);

                    e.target.value = "";
                  }}
                />

                <div
                  className={`border-2 border-dashed rounded-xl p-8 group ${theme.borderAccent} transition-colors cursor-pointer bg-[var(--surface-calm)]`}
                >
                  <div className="flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                    <div
                      className={`w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm `}
                    >
                      <FileText className={`w-6 h-6 ${theme.textDark}`} />
                    </div>

                    <h4 className="text-sm font-bold mb-1">
                      Click to upload resource
                    </h4>

                    <p className="text-xs opacity-70">
                      PDF, DOCX, or Keynote (Max 25MB)
                    </p>
                  </div>
                </div>
              </label>

              {errors.resource && (
                <p className="text-red-500 text-xs mt-2">
                  {errors.resource.message as string}
                </p>
              )}

              {/* Uploaded File Preview */}

              <div className="mt-4 space-y-3">
                {(resourceFile || existingResource) && (
                  <div
                    className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border ${theme.borderLight}`}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className={`w-6 h-6 ${theme.textAccent}`} />

                      <div>
                        {resourceFile ? (
                          <p className="text-xs opacity-70 flex flex-col">
                            <span className="font-medium text-gray-900">
                              {resourceFile?.name}
                            </span>

                            <span>
                              {(resourceFile.size / (1024 * 1024)).toFixed(2)}{" "}
                              MB • Ready
                            </span>
                          </p>
                        ) : (
                          <a
                            href={existingResource!}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 underline font-medium"
                          >
                            View Current File
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();

                        setValue("resource", undefined, {
                          shouldValidate: true,
                        });

                        setExistingResource(null); // Clear existing URL so it deletes on submit

                        setIsResourceDeleted(true);
                      }}
                      className="opacity-50 hover:opacity-100 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
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
