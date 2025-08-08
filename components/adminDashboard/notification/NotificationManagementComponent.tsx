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
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// ✅ Define your enum values
const notificationTypes = [
  "DAILY_CHALLENGE_PUSH_NOTIFICATION",
  "DAILY_BLOOM_PUSH_NOTIFICATION",
] as const;

// ✅ Zod schema
const formSchema = z.object({
  type: z.enum(notificationTypes, {
    errorMap: () => ({ message: "Please select a type" }),
  }),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

type FormValues = z.infer<typeof formSchema>;
type ApiResponse = { message: string };

export const NotificationManagementComponent = () => {
  // ✅ Mutation with correct types
  const mutation = useMutation<ApiResponse, Error, FormValues>({
    mutationFn: async (values) => {
      const res = await axios.post("/api/admin/notification", values);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Notification template saved!");
      form.reset(); // Optional: Reset form on success
    },
    onError: (error) => {
      toast.error("Failed to save template");
      console.error(error);
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: "",
      message: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
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
              {/* Notification Type Dropdown */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md transition">
                          <SelectValue placeholder="Select notification type" />
                        </SelectTrigger>
                        <SelectContent>
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

              {/* Title Input */}
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
                        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md transition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message Textarea */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter notification message text"
                        className="min-h-[100px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md transition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Template"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
