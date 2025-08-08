"use client";

import { useForm } from "react-hook-form";
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
  "DAILY_CHALLENGE_PUSH_NOTIFICATION",
  "DAILY_BLOOM_PUSH_NOTIFICATION",
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
});

type FormValues = {
  type: typeof placeholderValue | typeof notificationTypes[number];
  title: string;
  message: string;
};
type ApiResponse = { message: string };

export const NotificationManagementComponent = () => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] =
    useState<FormValues["type"]>(placeholderValue);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: placeholderValue,
      title: "",
      message: "",
    },
  });

  // Fetch all templates once on page load
  const { data: allTemplates = [], isFetching } = useQuery({
    queryKey: ["notificationTemplates"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/notification"); // <-- no type param
      return res.data.data;
    },
    staleTime: Infinity, // cache until manually invalidated
  });

  // Update form fields when type changes
  useEffect(() => {
    if (!selectedType || selectedType === placeholderValue) {
      form.setValue("title", "");
      form.setValue("message", "");
      return;
    }

    const template = allTemplates.find(
      (t: any) => t.notification_type === selectedType
    );

    form.setValue("title", template?.title || "");
    form.setValue("message", template?.message || "");
  }, [selectedType, allTemplates, form]);

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
      });
      setSelectedType(placeholderValue);
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
                          setSelectedType(value as FormValues["type"]);
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
                    <FormLabel>Title</FormLabel>
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
                    <FormLabel>Message</FormLabel>
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
