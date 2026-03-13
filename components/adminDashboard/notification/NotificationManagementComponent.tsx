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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Enum values
const notificationTypes = [
  // Push notifications
  "DAILY_CHALLENGE_PUSH_NOTIFICATION",
  "DAILY_BLOOM_PUSH_NOTIFICATION",

  // CMP – Daily
  "CMP_DAILY_PRIMARY",
  "CMP_DAILY_GENTLE_NUDGE",

  // CMP – Weekly (Sunday)
  "CMP_SUNDAY_MORNING",
  "CMP_SUNDAY_EVENING_PENDING",

  // CMP – Quarterly
  "CMP_QUARTER_ENDING_SOON",
  "CMP_QUARTER_RESET",

  // CMP – Rewards & Levels
  "CMP_REWARD_UNLOCKED",
  "CMP_REWARD_UNCLAIMED",
  "CMP_LEVEL_UP",

  // CMP – Goa Journey
  "CMP_GOA_PROGRESS_MILESTONE",
  "CMP_GOA_ELIGIBLE",

  // CMP – Inactivity
  "CMP_INACTIVITY_3_DAYS",
  "CMP_INACTIVITY_7_DAYS",

  // CMP – Onboarding
  "CMP_ONBOARDING_PENDING",
] as const;

const placeholderValue = "__placeholder__";

// Schema
const formSchema = z.object({
  type: z.union([
    z.literal(placeholderValue),
    z.enum(notificationTypes, {
      errorMap: () => ({ message: "Please select a type" }),
    }),
  ]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  url: z
    .string()
    .startsWith("/", "URL must start with /")
    .optional()
    .or(z.literal("")),
});

type FormValues = {
  type: typeof placeholderValue | (typeof notificationTypes)[number];
  title: string;
  message: string;
  url?: string;
};
type ApiResponse = { message: string };
interface NotificationTemplate {
  notification_type: string;
  title: string;
  message: string;
  url?: string;
  isDynamic?: boolean;
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
      title: "",
      message: "",
      url: "",
    },
  });
  const selectedType = useWatch({
    control: form.control,
    name: "type",
  });

  const [dynamicVariables, setDynamicVariables] = useState<string[]>([]);

  // Fetch all templates once on page load
  const { data: allTemplates = [] } = useQuery<NotificationTemplate[]>({
    queryKey: ["notificationTemplates"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/notification"); // <-- no type param
      return res.data.data;
    },
    staleTime: Infinity, // cache until manually invalidated
  });

  // Update form fields when type changes
  useEffect(() => {
    //  Exit early if no selection
    if (!selectedType || selectedType === placeholderValue) {
      // Only reset if not already empty to avoid unnecessary triggers
      if (form.getValues("title") !== "") {
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

    // 3. IMPORTANT: Only update if the values are different
    // This prevents the infinite loop
    const currentValues = form.getValues();
    if (
      currentValues.title !== newTitle ||
      currentValues.message !== newMessage ||
      currentValues.url !== newUrl
    ) {
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
      const res = await axios.post("/api/admin/notification", values);
      return res.data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Notification template saved!");
      await queryClient.invalidateQueries({
        queryKey: ["notificationTemplates"],
      });
      form.reset({
        type: placeholderValue,
        title: "",
        message: "",
        url: "",
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

  const isLoading = mutation.status === "pending";

  return (
    <div className="max-w-xl mx-auto mt-10 px-4">
      <Card className="border-blue-500 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-600 text-2xl">
            Notification Template
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Please select any type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled value={placeholderValue}>
                            Please select any type
                          </SelectItem>
                          {notificationTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replaceAll("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <div className="flex gap-4 items-center">
                        <span>Message</span>
                        {/* Variables UI repeated for Message */}

                        {dynamicVariables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
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
                          </div>
                        )}
                      </div>
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

              {/* Submit */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Loading..." : "Save Template"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
