"use client";

import { useState, useEffect } from "react";
import { Activity } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const activitySchema = z.object({
  activityId: z.string().min(1, "Activity is required"),
  jpAmount: z.string().min(1, "JP amount is required"),
});

const magicBoxSettingsSchema = z.object({
  minJpAmount: z.number().min(1).max(1000),
  maxJpAmount: z.number().min(1).max(1000),
});

type ActivityFormValues = z.infer<typeof activitySchema>;
type MagicBoxSettingsFormValues = z.infer<typeof magicBoxSettingsSchema>;

export default function UpdateActivityJpPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [magicBoxSettings, setMagicBoxSettings] = useState({
    minJpAmount: 100,
    maxJpAmount: 500,
  });

  const activityForm = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityId: "",
      jpAmount: "",
    },
  });

  const magicBoxSettingsForm = useForm<MagicBoxSettingsFormValues>({
    resolver: zodResolver(magicBoxSettingsSchema),
    defaultValues: {
      minJpAmount: 100,
      maxJpAmount: 500,
    },
  });

  useEffect(() => {
    fetchActivities();
    fetchMagicBoxSettings();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/admin/activity/list");
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      toast.error("Failed to load activities");
      console.error(err);
    }
  };

  const fetchMagicBoxSettings = async () => {
    try {
      const response = await fetch("/api/admin/magic-box/settings");
      if (!response.ok) throw new Error("Failed to fetch magic box settings");
      const data = await response.json();
      setMagicBoxSettings(data.settings);
      magicBoxSettingsForm.reset(data.settings);
    } catch (err) {
      toast.error("Failed to load magic box settings");
      console.error(err);
    }
  };

  const handleActivitySubmit = async (data: ActivityFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/activity/update-jp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId: data.activityId,
          jpAmount: parseInt(data.jpAmount),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update JP amount");
      }

      toast.success("JP amount updated successfully!");
      activityForm.reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update JP amount"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMagicBoxSettingsSubmit = async (
    data: MagicBoxSettingsFormValues
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/magic-box/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update magic box settings"
        );
      }

      toast.success("Magic box settings updated successfully!");
      fetchMagicBoxSettings();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update magic box settings"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Update Activity JP Amount</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Activity JP</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...activityForm}>
              <form
                onSubmit={activityForm.handleSubmit(handleActivitySubmit)}
                className="space-y-4"
              >
                <FormField
                  control={activityForm.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Activity</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.activity ?? "Unnamed Activity"} (Current
                              JP: {activity.jpAmount ?? 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityForm.control}
                  name="jpAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New JP Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Updating..." : "Update JP Amount"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Magic Box Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...magicBoxSettingsForm}>
              <form
                onSubmit={magicBoxSettingsForm.handleSubmit(
                  handleMagicBoxSettingsSubmit
                )}
                className="space-y-4"
              >
                <FormField
                  control={magicBoxSettingsForm.control}
                  name="minJpAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum JP Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={magicBoxSettingsForm.control}
                  name="maxJpAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum JP Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Updating..." : "Update Magic Box Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
