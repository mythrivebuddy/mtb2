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

// Define your enum values here
const notificationTypes = [
  "DAILY_CHALLENGE_NOTIFICATION",
  "DAILY_BLOOMS_PUSH_NOTIFICATION",
] as const;

const formSchema = z.object({
  type: z.enum(notificationTypes, {
    errorMap: () => ({ message: "Please select a type" }),
  }),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const NotificationManagementComponent = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: "",
      body: "",
    },
  });

  const onSubmit = async (
  //  values: FormValues
  ) => {
    try {
    //   const res = await fetch("/api/admin/notification-template", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(values),
    //   });

    //   if (!res.ok) throw new Error("Failed to save template");
      toast.success("Notification template saved!");
    } catch (err) {
      toast.error("Failed to save template");
      console.error(err);
    }
  };

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

              {/* Body Textarea */}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter notification body text"
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
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Save Template
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
