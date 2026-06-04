"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { fromZonedTime } from "date-fns-tz";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const LIMIT = 10;
const MAX_RESOURCE_SIZE = 25 * 1024 * 1024;
const RESOURCE_EXTENSIONS = ["pdf", "docx", "key"];
const statusOptions = ["DRAFT", "UNDER_REVIEW", "PUBLISHED"] as const;
const eventTypes = [
  "RETREAT",
  "WEBINAR",
  "WORKSHOP",
  "ONE_ON_ONE",
  "COURSE",
] as const;
const eventFormats = ["ONLINE", "IN_PERSON"] as const;
const currencies = ["INR", "USD"] as const;
const resourceVisibility = ["PUBLIC", "PRIVATE"] as const;
const timeOptions = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`,
);
const timezoneOptions = getTimezoneOptions();

type EventStatus = (typeof statusOptions)[number];

type HostedEvent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  customCategory: string | null;
  coverImage: string | null;
  format: string;
  location: string | null;
  meetingLink: string | null;
  meetingPlatform: string | null;
  startTime: string;
  endTime: string | null;
  isPaid: boolean;
  resources: string | null;
  resourcesVisibility: string;
  status: EventStatus;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    currency: string;
  }>;
  agendaSlots: Array<{
    id: string;
    day: number;
    time: string;
    title: string;
    description: string | null;
    order: number;
  }>;
};

type AdminEventsResponse = {
  events: HostedEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: z.string().optional(),
    type: z.enum(eventTypes),
    customCategory: z.string().optional(),
    format: z.enum(eventFormats),
    location: z.string().optional(),
    meetingLink: z.string().optional(),
    meetingPlatform: z.string().optional(),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().optional(),
    timezone: z.string().min(1, "Timezone is required."),
    isPaid: z.boolean(),
    totalCapacity: z.coerce
      .number()
      .int()
      .positive("Total capacity must be at least 1."),
    price: z.coerce.number().min(0, "Price cannot be negative."),
    currency: z.enum(currencies),
    resourcesVisibility: z.enum(resourceVisibility),
    status: z.enum(statusOptions),
    coverImage: fileListSchema("Cover image must be an image file."),
    resources: fileListSchema(
      "Resource must be a PDF, DOCX, or Keynote file.",
      true,
    ),
    agendaSlots: z.array(
      z.object({
        day: z.coerce.number().int().positive("Day must be at least 1."),
        time: z.string().trim().min(1, "Time is required."),
        title: z.string().trim().min(1, "Agenda title is required."),
        description: z.string().optional(),
        order: z.coerce.number().int().min(0, "Order cannot be negative."),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.format === "IN_PERSON" && !value.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Location is required for offline events.",
      });
    }
    if (value.format === "ONLINE" && !value.meetingLink?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meetingLink"],
        message: "Meeting link is required for online events.",
      });
    }
    if (
      value.endTime &&
      fromZonedTime(value.endTime, value.timezone) <=
        fromZonedTime(value.startTime, value.timezone)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
  });

type CreateEventFormValues = z.infer<typeof createEventSchema>;
type EventForm = UseFormReturn<CreateEventFormValues>;

function fileListSchema(message: string, isResource = false) {
  return z
    .any()
    .optional()
    .refine((files) => {
      const file = getFirstFile(files);
      if (!file) return true;
      if (isResource) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return (
          file.size <= MAX_RESOURCE_SIZE &&
          !!ext &&
          RESOURCE_EXTENSIONS.includes(ext)
        );
      }
      return file.type.startsWith("image/");
    }, message);
}

function getFirstFile(files: unknown): File | null {
  if (typeof FileList !== "undefined" && files instanceof FileList)
    return files.item(0);
  return null;
}

function getTimezoneOptions() {
  if (typeof Intl.supportedValuesOf === "function")
    return Intl.supportedValuesOf("timeZone");
  return ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];
}

async function fetchEvents(page: number, status: string, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
  });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const { data } = await axios.get<AdminEventsResponse>(
    `/api/admin/hosted-events?${params.toString()}`,
  );
  return data;
}

async function createEvent(values: CreateEventFormValues) {
  const fd = new FormData();
  const coverImage = getFirstFile(values.coverImage);
  const resources = getFirstFile(values.resources);
  fd.append("data", JSON.stringify(toApiPayload(values)));
  if (coverImage) fd.append("coverImage", coverImage);
  if (resources) fd.append("resources", resources);
  await axios.post("/api/hosted-events", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

async function updateStatus(id: string, action: "approve" | "disapprove") {
  await axios.patch(`/api/admin/hosted-events/${id}/${action}`);
}

async function deleteEvent(id: string) {
  await axios.delete(`/api/admin/hosted-events/${id}`);
}

function toApiPayload(values: CreateEventFormValues) {
  return {
    title: values.title,
    description: values.description || null,
    type: values.type,
    categoryId: null,
    customCategory: values.customCategory || null,
    format: values.format,
    location: values.format === "IN_PERSON" ? values.location || null : null,
    meetingLink: values.format === "ONLINE" ? values.meetingLink || null : null,
    meetingPlatform:
      values.format === "ONLINE" ? values.meetingPlatform || null : null,
    startTime: fromZonedTime(values.startTime, values.timezone).toISOString(),
    endTime: values.endTime
      ? fromZonedTime(values.endTime, values.timezone).toISOString()
      : null,
    isPaid: values.isPaid,
    resourcesVisibility: values.resourcesVisibility,
    status: values.status,
    tickets: [
      {
        name: "General Admission",
        price: values.isPaid ? values.price : 0,
        quantity: values.totalCapacity,
        currency: values.currency,
        includeTax: false,
      },
    ],
    agendaSlots: values.agendaSlots,
  };
}

function defaultValues(): CreateEventFormValues {
  return {
    title: "",
    description: "",
    type: "WEBINAR",
    customCategory: "",
    format: "ONLINE",
    location: "",
    meetingLink: "",
    meetingPlatform: "",
    startTime: "",
    endTime: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    isPaid: false,
    totalCapacity: 1,
    price: 0,
    currency: "INR",
    resourcesVisibility: "PUBLIC",
    status: "UNDER_REVIEW",
    coverImage: undefined,
    resources: undefined,
    agendaSlots: [],
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: EventStatus) {
  if (status === "PUBLISHED")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "UNDER_REVIEW")
    return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ManageEventsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<EventStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HostedEvent | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["admin-hosted-events", page, status, search],
    queryFn: () => fetchEvents(page, status, search),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      setCreateOpen(false);
      void qc.invalidateQueries({ queryKey: ["admin-hosted-events"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "disapprove";
    }) => updateStatus(id, action),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin-hosted-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ["admin-hosted-events"] }),
  });

  const events = eventsQuery.data?.events ?? [];
  const pagination = eventsQuery.data?.pagination;

  function runSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              Manage Events
            </h1>
            <p className="text-sm text-slate-500">
              Review, publish, create, and remove hosted events.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Event
          </Button>
        </div>

        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">Hosted Events</CardTitle>
              <CardDescription>
                {pagination?.total ?? 0} total events
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && runSearch()}
                  placeholder="Search events"
                  className="pl-9"
                />
              </div>
              <Select
                value={status || "ALL"}
                onValueChange={(value) => {
                  setStatus(value === "ALL" ? "" : (value as EventStatus));
                  setPage(1);
                }}
              >
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={runSearch}>
                Search
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void eventsQuery.refetch()}
              >
                <RefreshCw
                  className={`h-4 w-4 ${eventsQuery.isFetching ? "animate-spin" : ""}`}
                />
              </Button>
              {search || status ? (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {eventsQuery.isError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Failed to load events.
              </div>
            ) : (
              <EventsTable
                events={events}
                isLoading={eventsQuery.isLoading}
                statusPendingId={statusMutation.variables?.id}
                deletePendingId={deleteMutation.variables}
                onView={setSelectedEvent}
                onApprove={(id) =>
                  statusMutation.mutate({ id, action: "approve" })
                }
                onDisapprove={(id) =>
                  statusMutation.mutate({ id, action: "disapprove" })
                }
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            )}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination || page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSaving={createMutation.isPending}
        error={createMutation.error}
        onSubmit={(values) => createMutation.mutate(values)}
      />
      <EventDetailsDialog
        event={selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </div>
  );
}

function EventsTable({
  events,
  isLoading,
  statusPendingId,
  deletePendingId,
  onView,
  onApprove,
  onDisapprove,
  onDelete,
}: {
  events: HostedEvent[];
  isLoading: boolean;
  statusPendingId?: string;
  deletePendingId?: string;
  onView: (event: HostedEvent) => void;
  onApprove: (id: string) => void;
  onDisapprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, index) => <LoadingRow key={index} />)
          ) : events.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-32 text-center text-slate-500"
              >
                No events found.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => {
              const ticket = event.tickets[0];
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {event.coverImage ? (
                        <img
                          src={event.coverImage}
                          alt={event.title}
                          className="h-11 w-11 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100">
                          <CalendarDays className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.type.replaceAll("_", " ")} -{" "}
                          {event.format === "ONLINE" ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(event.status)}
                    >
                      {event.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {formatDate(event.startTime)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">
                      {event.creator?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.creator?.email}
                    </p>
                  </TableCell>
                  <TableCell>{ticket?.quantity ?? 0}</TableCell>
                  <TableCell>
                    {event.isPaid && ticket
                      ? `${ticket.currency} ${ticket.price}`
                      : "Free"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onView(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={statusPendingId === event.id}
                        onClick={() => onApprove(event.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={statusPendingId === event.id}
                        onClick={() => onDisapprove(event.id)}
                      >
                        <XCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={deletePendingId === event.id}
                        onClick={() => onDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function LoadingRow() {
  return (
    <TableRow>
      {[...Array(7)].map((_, index) => (
        <TableCell key={index}>
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function CreateEventDialog({
  open,
  onOpenChange,
  isSaving,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  error: unknown;
  onSubmit: (values: CreateEventFormValues) => void;
}) {
  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: defaultValues(),
  });
  const agendaSlots = useFieldArray({
    control: form.control,
    name: "agendaSlots",
  });
  const format = form.watch("format");
  const isPaid = form.watch("isPaid");
  const coverImageFile = getFirstFile(form.watch("coverImage"));
  const coverPreview = useMemo(
    () => (coverImageFile ? URL.createObjectURL(coverImageFile) : null),
    [coverImageFile],
  );

  function closeDialog(openValue: boolean) {
    onOpenChange(openValue);
    if (!openValue) form.reset(defaultValues());
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Hosted Event</DialogTitle>
          <DialogDescription>
            Add event details, capacity, agenda, image, and resource file.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField form={form} name="title" label="Title" />
              <SelectField
                form={form}
                name="type"
                label="Type"
                options={eventTypes}
              />
              <SelectField
                form={form}
                name="format"
                label="Format"
                options={eventFormats}
                labels={{ ONLINE: "Online", IN_PERSON: "Offline" }}
              />
              <TextField
                form={form}
                name="customCategory"
                label="Custom category"
              />
              <TextField
                form={form}
                name="startTime"
                label="Start time"
                type="datetime-local"
              />
              <TextField
                form={form}
                name="endTime"
                label="End time"
                type="datetime-local"
              />
              <SelectField
                form={form}
                name="timezone"
                label="Timezone"
                options={timezoneOptions}
              />
              {format === "ONLINE" ? (
                <TextField
                  form={form}
                  name="meetingLink"
                  label="Meeting link"
                />
              ) : (
                <TextField form={form} name="location" label="Location" />
              )}
              {format === "ONLINE" ? (
                <TextField
                  form={form}
                  name="meetingPlatform"
                  label="Meeting platform"
                />
              ) : null}
              <SelectField
                form={form}
                name="resourcesVisibility"
                label="Resources visibility"
                options={resourceVisibility}
              />
              <SelectField
                form={form}
                name="status"
                label="Initial status"
                options={statusOptions}
              />
              <SelectField
                form={form}
                name="isPaid"
                label="Pricing"
                options={["false", "true"]}
                labels={{ false: "Free", true: "Paid" }}
              />
              <TextField
                form={form}
                name="totalCapacity"
                label="Total capacity"
                type="number"
              />
              {isPaid ? (
                <TextField
                  form={form}
                  name="price"
                  label="Price"
                  type="number"
                />
              ) : null}
              {isPaid ? (
                <SelectField
                  form={form}
                  name="currency"
                  label="Currency"
                  options={currencies}
                />
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <FileField
                  form={form}
                  name="coverImage"
                  label="Cover image"
                  accept="image/*"
                />
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-44 w-full rounded-md border object-cover"
                  />
                ) : null}
              </div>
              <FileField
                form={form}
                name="resources"
                label="Resources"
                accept=".pdf,.docx,.key"
              />
            </div>

            <SectionHeader
              title="Agenda"
              actionLabel="Add slot"
              onAdd={() =>
                agendaSlots.append({
                  day: 1,
                  time: "09:00",
                  title: "",
                  description: "",
                  order: agendaSlots.fields.length,
                })
              }
            />
            {agendaSlots.fields.length === 0 ? (
              <p className="text-sm text-slate-500">No agenda slots added.</p>
            ) : null}
            {agendaSlots.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-md border p-3 md:grid-cols-6"
              >
                <TextField
                  form={form}
                  name={`agendaSlots.${index}.day`}
                  label="Day"
                  type="number"
                />
                <SelectField
                  form={form}
                  name={`agendaSlots.${index}.time`}
                  label="Time"
                  options={timeOptions}
                />
                <TextField
                  form={form}
                  name={`agendaSlots.${index}.title`}
                  label="Title"
                />
                <TextField
                  form={form}
                  name={`agendaSlots.${index}.order`}
                  label="Order"
                  type="number"
                />
                <TextField
                  form={form}
                  name={`agendaSlots.${index}.description`}
                  label="Description"
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => agendaSlots.remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {error ? (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {axios.isAxiosError(error)
                  ? String(
                      error.response?.data?.message ??
                        "Failed to create event.",
                    )
                  : "Failed to create event."}
              </p>
            ) : null}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}{" "}
                Create Event
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  form,
  name,
  label,
  type = "text",
}: {
  form: EventForm;
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FileField({
  form,
  name,
  label,
  accept,
}: {
  form: EventForm;
  name: "coverImage" | "resources";
  label: string;
  accept: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: { onChange, ref } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              ref={ref}
              type="file"
              accept={accept}
              onChange={(event) => onChange(event.target.files)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  form,
  name,
  label,
  options,
  labels,
}: {
  form: EventForm;
  name: string;
  label: string;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value)}
            onValueChange={(value) =>
              field.onChange(
                value === "true" ? true : value === "false" ? false : value,
              )
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {labels?.[option] ?? option.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAdd,
}: {
  title: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        {actionLabel}
      </Button>
    </div>
  );
}

function EventDetailsDialog({
  event,
  onOpenChange,
}: {
  event: HostedEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const ticket = event?.tickets[0];
  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{event?.title}</DialogTitle>
          <DialogDescription>
            {event
              ? `${event.type.replaceAll("_", " ")} - ${event.format === "ONLINE" ? "Online" : "Offline"}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {event ? (
          <div className="grid gap-4 text-sm md:grid-cols-2">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="h-56 w-full rounded-md object-cover md:col-span-2"
              />
            ) : null}
            <Info label="Status" value={event.status.replaceAll("_", " ")} />
            <Info label="Start" value={formatDate(event.startTime)} />
            <Info
              label="Creator"
              value={`${event.creator?.name ?? "Unknown"} (${event.creator?.email ?? "No email"})`}
            />
            <Info label="Capacity" value={String(ticket?.quantity ?? 0)} />
            <Info
              label="Price"
              value={
                event.isPaid && ticket
                  ? `${ticket.currency} ${ticket.price}`
                  : "Free"
              }
            />
            {event.format === "ONLINE" ? (
              <Info label="Meeting" value={event.meetingLink ?? "Not set"} />
            ) : (
              <Info label="Location" value={event.location ?? "Not set"} />
            )}
            {event.resources ? (
              <a
                href={event.resources}
                target="_blank"
                className="flex items-center gap-2 text-blue-600 underline"
              >
                <FileText className="h-4 w-4" /> Open resources
              </a>
            ) : null}
            <div className="md:col-span-2">
              <p className="font-medium text-slate-700">Description</p>
              <p className="mt-1 text-slate-600">
                {event.description ?? "No description."}
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  );
}
