"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { toast } from "sonner";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Pencil } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PushNotificationToggle from "@/components/notifications/PushNotificationToggle";
const placeholderValue = "__placeholder__";

// Schema
const formSchema = z.object({
  type: z.string().min(1, "Please select a type"),
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  url: z
    .string()
    .startsWith("/", "URL must start with /")
    .optional()
    .or(z.literal("")),
  audiences: z
    .array(z.enum(["USER", "ADMIN", "COACH"]))
    .min(1, "Select at least one audience"),
});
const audienceLabels = {
  USER: "All Users (Non-Admin)", // ✅ FIX
  ADMIN: "Admins",
  COACH: "Coaches",
};

type FormValues = {
  type: string;
  title: string;
  name: string;
  message: string;
  url?: string;
  audiences: ("USER" | "ADMIN" | "COACH")[];
};
type ApiResponse = { message: string };
type Audience = "USER" | "ADMIN" | "COACH";
interface NotificationTemplate {
  notification_type: string;
  name: string;
  title: string;
  message: string;
  url?: string;
  isDynamic?: boolean;
  audiences?: Audience[];
}

const extractPlaceholders = (text: string): string[] => {
  const regex = /{{\s*([^}]+)\s*}}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }

  return Array.from(new Set(matches)); // remove duplicates
};

export const NotificationManagementComponent = () => {
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: placeholderValue,
      name: "",
      title: "",
      message: "",
      url: "",
      audiences: ["USER"],
    },
  });
  const selectedType = useWatch({
    control: form.control,
    name: "type",
  });

  const [dynamicVariables, setDynamicVariables] = useState<string[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search, 500);

  // Fetch all templates once on page load
  const { data, isLoading: templatesLoading } = useQuery<{
    data: NotificationTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["notificationTemplates", page, limit, debouncedSearch],
    queryFn: async () => {
      const res = await axios.get("/api/admin/notification", {
        params: { page, limit, search: debouncedSearch },
      });
      return res.data;
    },
    staleTime: Infinity,
    placeholderData: (prev) => prev,
  });
  const allTemplates = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Update form fields when type changes
  useEffect(() => {
    //  Exit early if no selection
    if (!selectedType || selectedType === placeholderValue) {
      // Only reset if not already empty to avoid unnecessary triggers
      if (
        form.getValues("name") !== "" ||
        form.getValues("title") !== "" ||
        form.getValues("message") !== ""
      ) {
        form.resetField("name", { defaultValue: "" });
        form.resetField("title", { defaultValue: "" });
        form.resetField("message", { defaultValue: "" });
        form.resetField("url", { defaultValue: "" });
        setDynamicVariables([]);
      }
      return;
    }

    // 2. Find the template
    const template = allTemplates.find(
      (t) => t.notification_type === selectedType,
    );

    const newTitle = template?.title || "";
    const newMessage = template?.message || "";
    const newUrl = template?.url || "";
    const newName = template?.name || "";

    // 3. IMPORTANT: Only update if the values are different
    // This prevents the infinite loop
    const currentValues = form.getValues();
    if (
      currentValues.name !== newName ||
      currentValues.title !== newTitle ||
      currentValues.message !== newMessage ||
      currentValues.url !== newUrl
    ) {
      form.setValue("name", newName);
      form.setValue("title", newTitle);
      form.setValue("message", newMessage);
      form.setValue("url", newUrl);

      if (template?.isDynamic) {
        const allVars = [
          ...extractPlaceholders(newTitle),
          ...extractPlaceholders(newMessage),
        ];
        setDynamicVariables(Array.from(new Set(allVars)));
      } else {
        setDynamicVariables([]);
      }
    }
  }, [selectedType, allTemplates, form]); // Added form to dependencies for completeness

  // Save template
  const mutation = useMutation<ApiResponse, Error, FormValues>({
    mutationFn: async (values) => {
      const res = await axios.post("/api/admin/notification", {
        ...values,
        isEdit: !!editingTemplate,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Notification template saved!");
      await queryClient.invalidateQueries({
        queryKey: ["notificationTemplates"],
      });
      setIsEditOpen(false);
      form.reset({
        type: placeholderValue,
        name: "",
        title: "",
        message: "",
        url: "",
        audiences: ["USER"],
      });
      setDynamicVariables([]);
    },
    onError: () => {
      toast.error("Failed to save template");
    },
  });

  const onSubmit = (values: FormValues & { type: string }) => {
    if (values.type === placeholderValue) {
      form.setError("type", { message: "Please select a type" });
      return;
    }
    mutation.mutate(values as FormValues);
  };
  // Change the function signature
  const insertPlaceholder = (
    fieldName: "title" | "message",
    variable: string,
  ) => {
    const placeholder = `{{${variable}}}`;
    const currentValue = form.getValues(fieldName) || "";

    form.setValue(
      fieldName,
      `${currentValue}${currentValue && !currentValue.endsWith(" ") ? " " : ""}${placeholder}`,
      { shouldDirty: true },
    );

    form.setFocus(fieldName);
  };
  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);

    form.reset({
      type: template.notification_type,
      name: template.name,
      title: template.title,
      message: template.message,
      url: template.url || "",
      audiences: template.audiences || ["USER"],
    });

    if (template.isDynamic) {
      const allVars = [
        ...extractPlaceholders(template.title),
        ...extractPlaceholders(template.message),
      ];
      setDynamicVariables(Array.from(new Set(allVars)));
    } else {
      setDynamicVariables([]);
    }

    setIsEditOpen(true);
  };
  const isLoading = mutation.status === "pending";
  const AUDIENCES: Audience[] = ["USER", "ADMIN", "COACH"];

  return (
    <div className=" mx-auto mt-10 px-4">
      {/* Push Notification Settings */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 dark:bg-slate-900">
        <h2 className="text-lg font-medium mb-3 dark:text-gray-200">
          Notification Settings
        </h2>
        <div className="space-y-3">
          <PushNotificationToggle
            variant="switch"
            label="Browser Push Notifications"
          />
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            Receive notifications even when you are not actively using the site
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        {/* LEFT SIDE */}
        <div className="flex flex-col w-full">
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        {/* RIGHT SIDE */}
        <Select
          value={String(limit)}
          onValueChange={(value) => {
            setLimit(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Rows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 / page</SelectItem>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {templatesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : allTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              allTemplates.map((template) => (
                <TableRow key={template.notification_type}>
                  <TableCell>{template.name}</TableCell>

                  <TableCell className="max-w-[200px] truncate">
                    {template.title}
                  </TableCell>

                  <TableCell className="max-w-[250px] truncate">
                    {template.message}
                  </TableCell>

                  <TableCell>{template.url || "-"}</TableCell>

                  <TableCell>
                    {template.audiences
                      ?.map(
                        (aud) =>
                          audienceLabels[aud as keyof typeof audienceLabels],
                      )
                      .join(", ") || "-"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(template)} // 🔥 IMPORTANT
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableRow>
            <TableCell colSpan={6}>
              {/* 🔥 THIS IS YOUR LABEL */}
              <span className="text-xs text-muted-foreground mt-1">
                Showing {start}–{end} of {total} templates
              </span>
              <div className="flex justify-center items-center gap-4 py-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            </TableCell>
          </TableRow>
        </Table>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Notification Template</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Notification Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <FormControl>
                      <Input value={field.value} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Admin Label)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex flex-col gap-1">
                      <span>Title</span>

                      {/* Inside the Title FormField render */}
                      {dynamicVariables.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Available variables (click to insert):{" "}
                          {dynamicVariables.map((v) => (
                            <button
                              key={v}
                              type="button" // Important: prevents form submission
                              onClick={() => insertPlaceholder("title", v)}
                              className="mx-0.5 rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800 hover:bg-blue-200 transition-colors cursor-pointer border-none"
                            >
                              {`{{${v}}}`}
                            </button>
                          ))}
                        </span>
                      )}
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter notification title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex flex-col gap-1">
                      <span>Message</span>
                      {/* Variables UI repeated for Message */}

                      {dynamicVariables.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Available variables (click to insert):{" "}
                          {dynamicVariables.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => insertPlaceholder("message", v)}
                              className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-800 hover:bg-blue-200 transition-colors border border-slate-200"
                            >
                              {`{{${v}}}`}
                            </button>
                          ))}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter notification message text"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Redirect URL */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/dashboard/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="audiences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Audience
                      <span className="text-xs text-muted-foreground ml-2">
                        (USER = all non-admin users)
                      </span>
                    </FormLabel>

                    <div className="flex gap-4">
                      {AUDIENCES.map((aud) => (
                        <label key={aud} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(aud)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, aud]);
                              } else {
                                field.onChange(
                                  field.value.filter((v) => v !== aud),
                                );
                              }
                            }}
                          />
                          <span>{audienceLabels[aud]}</span>
                        </label>
                      ))}
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Submit */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Loading..." : "Save Template"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
