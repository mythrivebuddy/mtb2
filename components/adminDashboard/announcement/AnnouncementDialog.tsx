"use client";

import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

interface AnnouncementDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  announcement?: any | null;
}

interface AnnouncementFormValues {
  title: string;
  backgroundColor: string;
  fontColor: string;
  linkUrl?: string;
  openInNewTab: "same" | "new";
  isActive: "on" | "off";
  audience: "EVERYONE" | "PAID" | "FREE";
  expireAt?: string;
}

export default function AnnouncementDialog({
  open,
  setOpen,
  announcement,
}: AnnouncementDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
    watch,
  } = useForm<AnnouncementFormValues>();

  const queryClient = useQueryClient();

  // for preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Reset form values for edit / create
  useEffect(() => {
    if (announcement) {
      reset({
        title: announcement.title,
        backgroundColor: announcement.backgroundColor,
        fontColor: announcement.fontColor,
        linkUrl: announcement.linkUrl || "",
        openInNewTab: announcement.openInNewTab ? "new" : "same",
        isActive: announcement.isActive ? "on" : "off",
        audience: announcement.audience,
         expireAt: announcement.expireAt
        ? new Date(announcement.expireAt).toISOString().split("T")[0] // ✅ YYYY-MM-DD
        : "",
      });
    } else {
      reset({
        backgroundColor: "#4f46e5",
        fontColor: "#000000",
        openInNewTab: "same",
        isActive: "on",
        audience: "EVERYONE",
      });
    }
  }, [announcement, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const payload = {
        ...data,
        openInNewTab: data.openInNewTab === "new",
        isActive: data.isActive === "on",
      };
      return axios.post("/api/admin/announcement", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["user-announcement"] });
      reset();
      setOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const payload = {
        ...data,
        openInNewTab: data.openInNewTab === "new",
        isActive: data.isActive === "on",
      };
      return axios.patch(`/api/admin/announcement/${announcement.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["user-announcement"] });
      reset();
      setOpen(false);
    },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    if (announcement) {
      editMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  const formatInputDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // return YYYY-MM-DD
    return date.toISOString().split("T")[0];
  };

  // Watch form values for preview
  const watchValues = watch();

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg w-full ml-2 mr-2 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {announcement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title.message}</p>
              )}
            </div>

            {/* Background & Font Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <Input
                  type="color"
                  className="h-10"
                  {...register("backgroundColor")}
                />
              </div>
              <div className="space-y-2">
                <Label>Font Color</Label>
                <Input
                  type="color"
                  className="h-10"
                  {...register("fontColor")}
                />
              </div>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input id="link" {...register("linkUrl")} />
            </div>

            {/* Open in */}
            <div className="space-y-2">
              <Label>Open in</Label>
              <Controller
                control={control}
                name="openInNewTab"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="same" id="same" />
                      <Label htmlFor="same">Same Tab</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new">New Tab</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Active */}
            <div className="space-y-2">
              <Label>Active</Label>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on">On</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="off" id="off" />
                      <Label htmlFor="off">Off</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label>Audience</Label>
              <Controller
                control={control}
                name="audience"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="EVERYONE" id="everyone" />
                      <Label htmlFor="everyone">Everyone</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="PAID" id="paid" />
                      <Label htmlFor="paid">Paid</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="FREE" id="free" />
                      <Label htmlFor="free">Free</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Expire At */}
            <div className="space-y-2">
              <Label htmlFor="expire">Expire At</Label>
              <Input
                id="expire"
                type="date"
                defaultValue={
                  announcement ? formatInputDate(announcement.expireAt) : ""
                }
                {...register("expireAt", {
                  required: "Expiry date is required",
                })}
              />

              {errors.expireAt && (
                <p className="text-red-500 text-xs">
                  {errors.expireAt.message}
                </p>
              )}
            </div>

            {/* Preview button */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreviewOpen(true)}
            >
              Preview banner
            </Button>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  createMutation.isPending ||
                  editMutation.isPending
                }
              >
                {announcement
                  ? editMutation.isPending
                    ? "Updating..."
                    : "Update"
                  : createMutation.isPending
                    ? "Saving..."
                    : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Preview Banner</DialogTitle>
          </DialogHeader>
          <div
            className="p-4 rounded-md text-center shadow-md"
            style={{
              backgroundColor: watchValues.backgroundColor ?? "#f8f9fa",
              color: watchValues.fontColor ?? "#000",
            }}
          >
            <a
              href={watchValues.linkUrl || "#"}
              target={watchValues.openInNewTab === "new" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="inline-block font-semibold text-sm"
            >
              {watchValues.title || "Your announcement text"}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
